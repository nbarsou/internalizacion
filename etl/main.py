"""
main.py — ETL pipeline for Convenios Internacionales.

Three phases in order:
  1. EXTRACT  — load Excel + static JSON seed files
  2. ANALYSE  — data quality report (no mutations)
  3. TRANSFORM — build seed.json for the TypeScript seeder

Rich is used for all output. Console is set to record=True so
everything printed is also saved as output/report.html at the end.
"""

import json
import logging
from pathlib import Path
from typing import Final

import uuid as uuid

import polars as pl
from rich.console import Console
from rich.table import Table
from rich import box

from utils.load import get_data, load_json
from utils.analyze import (
    value_distribution,
    null_summary,
    url_split,
    fuzzy_clusters,
)
from utils.transform import (
    classify_contact,
    clean_text,
    make_slug,
    normalize,
    is_truthy,
    parse_bool_field,
    parse_slots,
    parse_date,
    map_utilization,
    resolve_beneficiary_token,
    resolve_url_pair,
    split_beneficiarios,
    resolve_ref,
    resolve_or_create,
)
from utils.network import check_urls, failed, summarize
from cols import Col, CommentCol

# ── Console (record=True → save_html at the end) ──────────────────────────────
console = Console(record=True)

# Silence library noise — we control all output through rich
logging.basicConfig(level=logging.WARNING)

# ── Paths & constants ─────────────────────────────────────────────────────────
ROOT: Final[Path] = Path(__file__).resolve().parent
SEED_DIR: Final[Path] = ROOT / "seed_data"
OUTPUT_DIR: Final[Path] = ROOT / "output"

EXCEL_PATH: Final[Path] = ROOT / "data" / "conveniosinternacionales.xlsx"
CACHE_DIR: Final[Path] = ROOT / "data"
FORCE_REFRESH: Final[bool] = True
NETWORK_CHECK: Final[bool] = True  # flip to True to run HTTP checks (slow)

NULL_THRESHOLD: Final[float] = 0.80  # rows with >80% nulls are skipped


# ── Rich helpers ──────────────────────────────────────────────────────────────


def section(title: str) -> None:
    console.rule(f"[bold cyan]{title}[/]")


def ok(msg: str) -> None:
    console.print(f"  [bold green]✓[/]  {msg}")


def warn(msg: str) -> None:
    console.print(f"  [bold yellow]⚠[/]  {msg}")


def err(msg: str) -> None:
    console.print(f"  [bold red]✗[/]  {msg}")


def info(msg: str) -> None:
    console.print(f"  [dim]ℹ[/]  {msg}")


# ── Helpers ──────────────────────────────────────────────────────────────


def make_obs(
    level: str,
    source: str,
    text: str,
    university_id: str | None = None,
    agreement_id: str | None = None,
) -> dict:
    return {
        "origin": "GENERATED",
        "level": level,
        "source": source,
        "text": text,
        "universityId": university_id,
        "agreementId": agreement_id,
    }


def rich_table(
    df: pl.DataFrame,
    title: str = "",
    max_rows: int = 20,
    headers: list[str] | None = None,
) -> None:
    """
    Render a Polars DataFrame as a Rich table.
    headers: optional display names for columns (must match len(df.columns)).
             Defaults to raw DataFrame column names.
    """
    display = headers if headers and len(headers) == len(df.columns) else df.columns
    t = Table(title=title, box=box.SIMPLE_HEAVY, show_lines=False)
    for h in display:
        t.add_column(h, style="white", overflow="fold")
    for row in df.head(max_rows).iter_rows():
        t.add_row(*[str(v) if v is not None else "[dim]null[/]" for v in row])
    if df.height > max_rows:
        t.caption = f"… {df.height - max_rows} more rows not shown"
    console.print(t)


# ── Phase 1: EXTRACT ──────────────────────────────────────────────────────────


def extract(seed: dict) -> tuple[pl.DataFrame, pl.DataFrame]:
    section("PHASE 1 — EXTRACT")

    # Excel
    df, df_comments = get_data(
        excel_path=EXCEL_PATH,
        cache_dir=CACHE_DIR,
        force_refresh=FORCE_REFRESH,
    )
    ok(f"Excel loaded: [bold]{df.height}[/] rows, [bold]{df.width}[/] columns")
    info(f"Columns: {df.columns}")
    if df_comments.height:
        ok(f"Cell comments: [bold]{df_comments.height}[/]")
    else:
        warn("No cell comments found")

    # Static seed files
    static_keys = {
        "ref_agreement_types": SEED_DIR / "ref_agreement_types.json",
        "ref_campuses": SEED_DIR / "ref_campuses.json",
        "ref_attrs": SEED_DIR / "ref_attrs.json",
        "ref_statuses": SEED_DIR / "ref_statuses.json",
        "ref_utilizations": SEED_DIR / "ref_utilizations.json",
        "ref_beneficiaries": SEED_DIR / "ref_beneficiaries.json",
    }
    for key, path in static_keys.items():
        seed[key] = load_json(path)
        ok(f"{key}: [bold]{len(seed[key])}[/] rows")

    return df, df_comments


# ── Phase 2: ANALYSE ──────────────────────────────────────────────────────────


def analyse(df: pl.DataFrame, df_comments: pl.DataFrame, seed: dict) -> pl.DataFrame:
    """Returns the DataFrame with high-null rows already dropped."""
    section("PHASE 2 — ANALYSE")

    # ── 2a. Row quality ───────────────────────────────────────────────────────
    console.print("\n[bold]Row quality (null density)[/]")
    df_scored = df.with_columns(
        (pl.sum_horizontal(pl.all().is_null()) / df.width).alias("_null_pct")
    )
    bad = df_scored.filter(pl.col("_null_pct") > NULL_THRESHOLD)
    if bad.height:
        warn(
            f"{bad.height} rows exceed {int(NULL_THRESHOLD * 100)}% null threshold — dropped"
        )

        # Forensic view: show exactly what non-null data each bad row contained
        data_cols = [c for c in df.columns if not c.startswith("_")]
        forensic_rows = []
        for row in bad.iter_rows(named=True):
            found = {
                k: v
                for k, v in row.items()
                if k in data_cols and v is not None and str(v).strip()
            }
            forensic_rows.append(
                {
                    "null_pct": f"{row['_null_pct']:.0%}",
                    "non_null_data": " | ".join(f"{k}: {v}" for k, v in found.items()),
                }
            )
        rich_table(
            pl.DataFrame(forensic_rows).sort("null_pct", descending=True),
            title="Dropped rows — non-null content",
        )
        df = df_scored.filter(pl.col("_null_pct") <= NULL_THRESHOLD).drop("_null_pct")
        ok(f"Continuing with [bold]{df.height}[/] rows")
    else:
        ok(f"No rows exceed {int(NULL_THRESHOLD * 100)}% null threshold")

    # ── 2b. Column fill rates ─────────────────────────────────────────────────
    console.print("\n[bold]Column fill rates[/]")
    key_cols = [
        Col.UNIVERSIDAD,
        Col.PAIS,
        Col.REGION,
        Col.CIUDAD,
        Col.GIRO,
        Col.CAMPUS,
        Col.SE_USA,
        Col.CATOLICA,
        Col.INICIO,
        Col.VIGENCIA,
        Col.PAGINA_WEB,
        Col.CONTACTO_ENT,
        Col.CONTACTO_SAL,
        Col.LINK_CONVENIO,
        Col.BENEFICIARIOS,
    ]
    ns = null_summary(df, key_cols)
    t = Table(box=box.SIMPLE_HEAVY)
    t.add_column("Column")
    t.add_column("Nulls", justify="right")
    t.add_column("Fill %", justify="right")
    for row in ns.iter_rows(named=True):
        pct = round(100 - row["null_pct"], 1) if row["exists"] else -1
        color = "green" if pct >= 90 else "yellow" if pct >= 60 else "red"
        t.add_row(row["column"], str(row["null_count"]), f"[{color}]{pct}%[/]")
    console.print(t)

    # ── 2c. Agreement type coverage ───────────────────────────────────────────
    console.print("\n[bold]Agreement type coverage[/]")
    console.print(
        "[dim]Each row in the Excel can mark multiple agreement types (Study Abroad, "
        "Intercambio, Prácticas…) as active. A cell is active when it is not null and "
        "does not start with 'N' (No / N/A). This table shows how many universities "
        "have each type active — and therefore how many Agreement rows the ETL will "
        "create per type in Phase 3.[/]\n"
    )
    # Human-readable label alongside the internal column name
    total_agreements = 0
    type_cols = [
        (Col.STUDY_ABROAD, "Study Abroad", 1),
        (Col.INTERCAMBIO, "Intercambio", 1),
        (Col.PLAZAS_POS, "Plazas Posgrado", 2),
        (Col.PRACTICAS, "Prácticas", 1),
        (Col.INVESTIGACION, "Investigación", 1),
        (Col.DOBLE_DIPLOMA, "Doble Diploma", 1),
        (Col.COTUTELA, "Cotutela", 1),
        (Col.OTRO, "Otro", 1),
    ]
    t = Table(box=box.SIMPLE_HEAVY)
    t.add_column("Agreement type")
    t.add_column("Active universities", justify="right")
    t.add_column("% of total", justify="right")
    total_rows = df.height
    for col, label, multiplier in type_cols:
        if col in df.columns:
            active = df.filter(
                pl.col(col).is_not_null()
                & ~pl.col(col).cast(pl.Utf8).str.to_lowercase().str.starts_with("n")
            ).height
            expected = active * multiplier
            total_agreements += expected
            pct = f"{active / total_rows * 100:.1f}%" if total_rows else "—"
            t.add_row(label, str(active), str(expected), pct)
    console.print(t)
    console.print(f"[dim]Expected total agreements in seed: {total_agreements}[/]\n")

    # ── 2d. Ref table value distribution ─────────────────────────────────────
    console.print("\n[bold]Value Distributions[/]\n")
    for col, label in [
        (Col.REGION, "Regions"),
        (Col.PAIS, "Countries"),
        (Col.GIRO, "Institution types"),
        (Col.CAMPUS, "Campuses"),
        (Col.SE_USA, "Utilization (Se_USA)"),
    ]:
        table = value_distribution(df, col, normalize_values=True)
        rich_table(
            table,
            title=f"{label}",
            max_rows=150,
            headers=[label, "Count"],
        )
        console.print(f"[dim]({table.height} unique values)[/]\n")

    # ── 2e. Fuzzy clusters on key ref columns ─────────────────────────────────
    console.print("\n[bold]Fuzzy duplicate detection[/]")
    for col, label in [(Col.PAIS, "Countries"), (Col.REGION, "Regions")]:
        clusters = fuzzy_clusters(df, col, threshold=88.0).filter(
            pl.col("cluster_size") > 1
        )
        if clusters.height:
            warn(f"{clusters.height} potential duplicate clusters in {label}")
            rich_table(
                clusters.select("canonical_name", "cluster_size", "variations"),
                title=label,
                headers=["Canonical", "Cluster size", "Variations"],
            )
        else:
            ok(f"No duplicates detected in {label}")

    # ── 2f. URL validation ────────────────────────────────────────────────────
    # Strategy: for each URL pair (display text col + hyperlink col), pick the
    # best available URL per row — prefer the extracted hyperlink target (_url)
    # since that's the real link, fall back to the display text if it looks like
    # a URL itself (typed directly into the cell). SharePoint/OneDrive relative
    # paths (../../../../) are not HTTP URLs and will fall out as invalid.
    console.print("\n[bold]URL validation[/]")

    # Cache: {url: UrlResult} — built during analyse, reused in transform
    # Stored on the seed dict so transform can read it without re-checking.
    url_cache: dict[str, object] = {}

    for text_col, url_col, label in [
        (Col.PAGINA_WEB, Col.PAGINA_WEB_URL, "Página Web"),
        (Col.LINK_CONVENIO, Col.LINK_CONVENIO_URL, "Link Convenio"),
    ]:
        if text_col not in df.columns and url_col not in df.columns:
            warn(f"Neither {text_col} nor {url_col} present — skipping")
            continue

        # Resolve best URL per row using the same logic as transform
        resolved = [
            resolve_url_pair(row.get(text_col), row.get(url_col))
            for row in df.iter_rows(named=True)
        ]
        best_urls = [r.web_url for r in resolved]
        local_paths = [r.local_path for r in resolved]

        df_work = df.with_columns(
            [
                pl.Series("_best_url", best_urls),
                pl.Series("_local_path", local_paths),
            ]
        )

        valid, invalid = url_split(df_work, "_best_url")
        null_ct = df_work["_best_url"].null_count()
        local_ct = df_work["_local_path"].drop_nulls().len()

        ok(
            f"{label}: [green]{valid.height} valid HTTP URLs[/] | "
            f"[red]{invalid.height} non-HTTP[/] | "
            f"[dim]{null_ct} null[/]"
            + (f" | [yellow]{local_ct} local paths[/]" if local_ct else "")
        )

        if invalid.height:
            rich_table(
                invalid.select(Col.UNIVERSIDAD, "_best_url").head(10),
                title=f"{label} — non-HTTP values (SharePoint paths, plain text)",
                headers=["Universidad", "Value"],
            )

        if NETWORK_CHECK and valid.height:
            console.print(f"  [dim]Checking {valid.height} {label} URLs…[/]")
            urls = valid["_best_url"].drop_nulls().unique().to_list()
            results = check_urls(urls)
            # Store in cache for transform to reuse
            for r in results:
                url_cache[r.url] = r
            rich_table(
                summarize(results),
                title=f"{label} — HTTP status",
                headers=["Status", "Count", "Percentage"],
            )
            down = failed(results)
            if down:
                down_urls = {r.url for r in down}
                rich_table(
                    valid.filter(pl.col("_best_url").is_in(down_urls))
                    .select(Col.UNIVERSIDAD, "_best_url")
                    .head(20),
                    title=f"{label} — unreachable",
                    headers=["Universidad", "URL"],
                )
            else:
                ok(f"All {label} URLs reachable")
        elif not NETWORK_CHECK and valid.height:
            info(f"Network check disabled — {valid.height} URLs not checked")

    # Attach cache to seed so transform can use it without re-checking
    seed["_url_cache"] = url_cache

    # ── 2g. Contact analysis ──────────────────────────────────────────────────
    console.print("\n[bold]Contact analysis[/]")
    console.print(
        "  [dim]Counts are universities, not Contact rows. "
        "'Same' → 1 GENERAL row. 'Different' → 2 rows (INCOMING + OUTGOING). "
        "Total Contact rows = same×1 + different×2 + entrante_only×1 + saliente_only×1.[/]\n"
    )
    same = df.filter(
        (pl.col(Col.CONTACTO_ENT) == pl.col(Col.CONTACTO_SAL))
        & pl.col(Col.CONTACTO_ENT).is_not_null()
    ).height
    diff = df.filter(
        pl.col(Col.CONTACTO_ENT).is_not_null()
        & pl.col(Col.CONTACTO_SAL).is_not_null()
        & (pl.col(Col.CONTACTO_ENT) != pl.col(Col.CONTACTO_SAL))
    ).height
    only_ent = df.filter(
        pl.col(Col.CONTACTO_ENT).is_not_null() & pl.col(Col.CONTACTO_SAL).is_null()
    ).height
    only_sal = df.filter(
        pl.col(Col.CONTACTO_SAL).is_not_null() & pl.col(Col.CONTACTO_ENT).is_null()
    ).height
    expected = same + diff * 2 + only_ent + only_sal
    info(f"Same contact   → 1 GENERAL row  : {same} universities")
    info(f"Different      → 2 rows each     : {diff} universities")
    info(f"Entrante only  → 1 INCOMING row  : {only_ent} universities")
    info(f"Saliente only  → 1 OUTGOING row  : {only_sal} universities")
    info(f"Expected Contact rows in seed    : [bold]{expected}[/]")

    # ── 2h. Cell comments ────────────────────────────────────────────────────
    console.print("\n[bold]Cell comments by column[/]")
    if df_comments.height:
        rich_table(
            value_distribution(df_comments, CommentCol.COLUMN_SOURCE),
            title="Comments per column",
            headers=["Column", "Count"],
        )
    else:
        info("No cell comments")

    ok("[bold green]Analysis complete[/]")
    return df


# ── Phase 3: TRANSFORM ────────────────────────────────────────────────────────


def transform(
    df: pl.DataFrame,
    df_comments: pl.DataFrame,
    seed: dict,
) -> None:
    section("PHASE 3 — TRANSFORM")

    obs: list[dict] = []  # accumulates Observation dicts
    new_ref_warnings = 0

    # ── 3a. Dynamic ref tables ────────────────────────────────────────────────
    console.print("\n[bold]Building dynamic ref tables[/]")
    for col, key, label in [
        (Col.REGION, "ref_regions", "region"),
        (Col.PAIS, "ref_countries", "country"),
        (Col.GIRO, "ref_institution_types", "institution type"),
    ]:
        # Seed starts with just N/A at id=0
        seed[key] = [{"id": 0, "name": "N/A"}]
        unique_vals = df[col].drop_nulls().unique().to_list()
        created_count = 0
        for val in sorted(unique_vals):
            _, created = resolve_or_create(val, seed[key])
            if created:
                created_count += 1

        ok(f"{label}: {len(seed[key])} total ({created_count} from Excel)")

    # ── 3b. Universities ──────────────────────────────────────────────────────
    console.print("\n[bold]Building universities[/]")

    skipped_unis = 0
    existing_slugs = set()
    for row in df.iter_rows(named=True):
        name = row.get(Col.UNIVERSIDAD)
        if not name or not str(name).strip():
            skipped_unis += 1
            continue

        uni_id = row[Col.ROW_ID]  # UUID assigned by loader

        region_id, rc = resolve_or_create(row.get(Col.REGION), seed["ref_regions"])
        country_id, cc = resolve_or_create(row.get(Col.PAIS), seed["ref_countries"])
        giro_id, gc = resolve_or_create(
            row.get(Col.GIRO), seed["ref_institution_types"]
        )

        for created, val, ref_label in [
            (rc, row.get(Col.REGION), "region"),
            (cc, row.get(Col.PAIS), "country"),
            (gc, row.get(Col.GIRO), "institution_type"),
        ]:
            if created:
                new_ref_warnings += 1
                obs.append(
                    make_obs(
                        "WARNING",
                        "etl_new_ref",
                        f"New {ref_label} inserted: '{val}'",
                        university_id=uni_id,
                    )
                )

        campus_id = resolve_ref(row.get(Col.CAMPUS), seed["ref_campuses"])
        if campus_id is None:
            if row.get(Col.CAMPUS):
                obs.append(
                    make_obs(
                        "WARNING",
                        "etl_missing_ref",
                        f"Campus not found: '{row.get(Col.CAMPUS)}'",
                        university_id=uni_id,
                    )
                )
            campus_id = 0

        util_value = map_utilization(row.get(Col.SE_USA))
        util_id = resolve_ref(util_value, seed["ref_utilizations"], name_key="value")

        start_r = parse_date(row.get(Col.INICIO))
        expires_r = parse_date(row.get(Col.VIGENCIA))
        start = start_r.date
        expires = expires_r.date
        if start_r.error:
            obs.append(
                make_obs(
                    "WARNING",
                    "etl_date_parse",
                    f"Could not parse start date: '{row.get(Col.INICIO)}'",
                    university_id=uni_id,
                )
            )
        if expires_r.error:
            obs.append(
                make_obs(
                    "WARNING",
                    "etl_date_parse",
                    f"Could not parse expiry date: '{row.get(Col.VIGENCIA)}'",
                    university_id=uni_id,
                )
            )
        # expires_r.indefinido → intentional open-end, no warning needed

        # Inline observation text from the Excel Observaciones column
        if row.get(Col.OBSERVACIONES):
            obs.append(
                make_obs(
                    "INFO",
                    "excel_observaciones",
                    str(row[Col.OBSERVACIONES]),
                    university_id=uni_id,
                )
            )

        raw_name = str(name).strip()
        slug = make_slug(raw_name, existing_slugs)
        existing_slugs.add(slug)

        # Resolve the best URL from the (display text, hyperlink target) pair.
        # pagina_web: prefer hyperlink target, fall back to display text if HTTP URL.
        # link_convenio: most hyperlink targets are local SharePoint paths — kept
        #   separately in local_path; web_url will be None for most rows.
        web_pair = resolve_url_pair(
            row.get(Col.PAGINA_WEB), row.get(Col.PAGINA_WEB_URL)
        )
        conv_pair = resolve_url_pair(
            row.get(Col.LINK_CONVENIO), row.get(Col.LINK_CONVENIO_URL)
        )

        if web_pair.source == "display_text":
            obs.append(
                make_obs(
                    "INFO",
                    "etl_url_source",
                    f"pagina_web URL taken from display text (no hyperlink): {web_pair.web_url}",
                    university_id=uni_id,
                )
            )
        if conv_pair.local_path:
            obs.append(
                make_obs(
                    "INFO",
                    "etl_local_path",
                    f"link_convenio is a local/SharePoint path — needs migration: {conv_pair.local_path[:120]}",
                    university_id=uni_id,
                )
            )

        # Check cache for connectivity result (populated by analyse if NETWORK_CHECK=True)
        url_cache = seed.get("_url_cache", {})
        if web_pair.web_url and web_pair.web_url in url_cache:
            result = url_cache[web_pair.web_url]
            if not result.ok:
                obs.append(
                    make_obs(
                        "WARNING",
                        "etl_url_unreachable",
                        f"pagina_web returned {result.http_code} ({result.status}): {web_pair.web_url}",
                        university_id=uni_id,
                    )
                )

        seed["universities"].append(
            {
                "id": uni_id,
                "slug": slug,
                "name": raw_name,
                "start": start,
                "expires": expires,
                "isCatholic": parse_bool_field(row.get(Col.CATOLICA)),
                "utilizationId": util_id,
                "regionId": region_id,
                "countryId": country_id,
                "institutionTypeId": giro_id,
                "campusId": campus_id,
                "ciudad": clean_text(row.get(Col.CIUDAD), max_length=150),
                "direccion": clean_text(row.get(Col.DIRECCION), max_length=500),
                "pagina_web": clean_text(row.get(Col.PAGINA_WEB), max_length=500),
                "pagina_web_url": web_pair.web_url,
            }
        )

    ok(
        f"Universities built: [bold]{len(seed['universities'])}[/] (skipped: {skipped_unis})"
    )

    # ── 3c. Contacts ──────────────────────────────────────────────────────────
    console.print("\n[bold]Building contacts[/]")
    skipped_contacts = 0

    def add_contact(uni_id: str, value: str, concern: str) -> None:
        """Classify, skip OTHER with observation, insert EMAIL/PHONE."""
        nonlocal skipped_contacts
        ct = classify_contact(value)
        if not ct.valid:
            skipped_contacts += 1
            obs.append(
                make_obs(
                    "WARNING",
                    "etl_contact_unclassified",
                    f"Contact value could not be classified as EMAIL or PHONE — skipped: '{value}'",
                    university_id=uni_id,
                )
            )
            return
        seed["contacts"].append(
            {
                "id": str(uuid.uuid4()),
                "universityId": uni_id,
                "concernType": concern,
                "valueType": ct.type_name,
                "value": value,
            }
        )

    for row in df.iter_rows(named=True):
        uni_id = row[Col.ROW_ID]
        ent = str(row[Col.CONTACTO_ENT]).strip() if row.get(Col.CONTACTO_ENT) else None
        sal = str(row[Col.CONTACTO_SAL]).strip() if row.get(Col.CONTACTO_SAL) else None

        if ent and sal and ent == sal:
            add_contact(uni_id, ent, "GENERAL")
        else:
            if ent:
                add_contact(uni_id, ent, "INCOMING")
            if sal:
                add_contact(uni_id, sal, "OUTGOING")

    ok(
        f"Contacts built: [bold]{len(seed['contacts'])}[/] (skipped: {skipped_contacts} unclassified)"
    )

    # ── 3d. Agreements ────────────────────────────────────────────────────────
    console.print("\n[bold]Building agreements[/]")

    STATUS_NA_ID: Final = 0  # RefStatus id=0 is 'N/A' — seeded in ref_statuses.json

    # Accreditation column → RefAttr name mapping
    ATTR_COLS: Final = {
        Col.ABET: "ABET",
        Col.ACJMC: "ACJMC",
        Col.AACSB: "AACSB",
        Col.AMBA: "AMBA",
        Col.EFMD: "EFMD",
    }

    # Build comment lookup once before the agreement loop
    # { (row_id, column_source): comment_text }
    comment_lookup: dict[tuple[str, str], str] = {
        (row[CommentCol.ROW_ID], row[CommentCol.COLUMN_SOURCE]): row[
            CommentCol.COMMENT_TEXT
        ]
        for row in df_comments.iter_rows(named=True)
        if row[CommentCol.COMMENT_TEXT] and str(row[CommentCol.COMMENT_TEXT]).strip()
    }

    consumed_comments: set[tuple[str, str]] = set()

    for row in df.iter_rows(named=True):
        uni_id = row[Col.ROW_ID]
        link_url = row.get(Col.LINK_CONVENIO_URL)

        # Resolve accreditation attr ids for this row
        attr_ids = [
            resolve_ref(attr_name, seed["ref_attrs"], name_key="name")
            for col, attr_name in ATTR_COLS.items()
            if is_truthy(row.get(col))
        ]

        # Beneficiary ids — try CVE first (e.g. "EN", "CC"), then full name.
        # Tokens that match neither are genuine data gaps: freeform text,
        # abbreviations, or values not in ref_beneficiaries.json.
        raw_beneficiarios = row.get(Col.BENEFICIARIOS)
        beneficiary_ids = []
        for token in split_beneficiarios(raw_beneficiarios):
            bid = resolve_beneficiary_token(token, seed["ref_beneficiaries"])
            if bid is None:
                obs.append(
                    make_obs(
                        "WARNING",
                        "etl_missing_beneficiary",
                        f"Unknown token '{token}' in cell '{raw_beneficiarios}'",
                        university_id=uni_id,
                    )
                )
            else:
                beneficiary_ids.append(bid)

        def add_agreement(
            type_name: str, spots: int | None, comments: str | None = None
        ):
            type_id = resolve_ref(
                type_name, seed["ref_agreement_types"], name_key="name"
            )
            if type_id is None:
                # Dynamic type from OTRO
                type_id, created = resolve_or_create(
                    type_name, seed["ref_agreement_types"]
                )
                if created:
                    obs.append(
                        make_obs(
                            "WARNING",
                            "etl_dynamic_type",
                            f"New agreement type inserted: '{type_name}'",
                            university_id=uni_id,
                        )
                    )

            agr_id = str(uuid.uuid4())
            seed["agreements"].append(
                {
                    "id": agr_id,
                    "universityId": uni_id,
                    "typeId": type_id,
                    "statusId": STATUS_NA_ID,
                    "spots": spots,
                    "link_convenio": link_url,
                    "comments": comments,
                    "attrIds": attr_ids,
                    "beneficiaryIds": beneficiary_ids,
                }
            )
            # obs.append(
            #     make_obs(
            #         "INFO",
            #         "etl_status_pending",
            #         "Agreement status set to N/A — requires manual review",
            #         agreement_id=agr_id,
            #     )
            # )

        if is_truthy(row.get(Col.STUDY_ABROAD)):
            add_agreement("Study Abroad", None)

        if is_truthy(row.get(Col.INTERCAMBIO)):
            slots_lic = parse_slots(row.get(Col.PLAZAS_LIC))
            add_agreement("Intercambio Licenciatura", slots_lic)

        if is_truthy(row.get(Col.PLAZAS_POS)):
            slots_pos = parse_slots(row.get(Col.PLAZAS_POS))
            add_agreement("Intercambio Maestría", slots_pos)
            add_agreement("Intercambio Doctorado", slots_pos)

        if is_truthy(row.get(Col.PRACTICAS)):
            add_agreement("Prácticas", None)

        if is_truthy(row.get(Col.INVESTIGACION)):
            add_agreement("Investigación", None)

        if is_truthy(row.get(Col.DOBLE_DIPLOMA)):
            add_agreement("Doble Diploma", None)

        if is_truthy(row.get(Col.COTUTELA)):
            add_agreement("Cotutela", None)

        if is_truthy(row.get(Col.OTRO)):
            otro_raw = str(row[Col.OTRO]).strip()
            otro_norm = normalize(otro_raw)

            # "X" or bare marker → the real type is in the cell comment
            if otro_norm in ("x", "si", "sí", "1"):
                comment = comment_lookup.get((uni_id, Col.OTRO))
                consumed_comments.add((uni_id, Col.OTRO))
                if comment:
                    type_name = comment.strip().title()
                else:
                    # No comment — can't determine type, flag for manual review
                    obs.append(
                        make_obs(
                            "WARNING",
                            "etl_otro_no_comment",
                            "OTRO marked with 'X' but has no cell comment — type unknown",
                            university_id=uni_id,
                        )
                    )
                    type_name = "Otro (Sin Especificar)"
            elif otro_norm in ("mou", "m.o.u", "marco"):
                type_name = "MOU"
            else:
                # The cell itself contains the type name
                type_name = otro_raw.title()

            add_agreement(type_name, None, comments=otro_raw)

    ok(f"Agreements built: [bold]{len(seed['agreements'])}[/]")

    # ── 3e. Cell comment observations ────────────────────────────────────────
    for row in df_comments.iter_rows(named=True):
        text = row[CommentCol.COMMENT_TEXT]
        if not text or not text.strip():
            continue
        key = (row[CommentCol.ROW_ID], row[CommentCol.COLUMN_SOURCE])
        if key in consumed_comments:
            continue  # already used to drive a transform decision
        obs.append(
            make_obs(
                "INFO",
                "excel_comment",
                "in column " + row[CommentCol.COLUMN_SOURCE] + ":" + text.strip(),
                university_id=row[CommentCol.ROW_ID],
            )
        )

    seed["observations"] = obs
    ok(
        f"Observations built: [bold]{len(obs)}[/] "
        f"([yellow]{new_ref_warnings} new-ref warnings[/])"
    )


# ── Summary ───────────────────────────────────────────────────────────────────


def print_summary(seed: dict) -> None:
    section("SUMMARY")
    t = Table(box=box.SIMPLE_HEAVY, title="seed.json contents")
    t.add_column("Key")
    t.add_column("Rows", justify="right")
    for key, val in seed.items():
        if not key.startswith("_"):  # skip internal keys like _url_cache
            t.add_row(key, str(len(val)))
    console.print(t)

    obs = seed.get("observations", [])

    # ── Level totals ──────────────────────────────────────────────────────────
    by_level: dict[str, int] = {}
    for o in obs:
        by_level[o["level"]] = by_level.get(o["level"], 0) + 1
    for level, count in sorted(by_level.items()):
        color = {"ERROR": "red", "WARNING": "yellow", "INFO": "dim"}.get(level, "white")
        console.print(f"  [{color}]{level}[/]: {count} observations")

    # ── Breakdown by source for each level ────────────────────────────────────
    for level, color in [("ERROR", "red"), ("WARNING", "yellow"), ("INFO", "dim")]:
        level_obs = [o for o in obs if o["level"] == level]
        if not level_obs:
            continue
        by_source: dict[str, int] = {}
        for o in level_obs:
            by_source[o["source"]] = by_source.get(o["source"], 0) + 1
        t = Table(
            box=box.SIMPLE_HEAVY, title=f"[{color}]{level}[/] breakdown by source"
        )
        t.add_column("Source")
        t.add_column("Count", justify="right")
        for src, cnt in sorted(by_source.items(), key=lambda x: -x[1]):
            t.add_row(src, str(cnt))
        console.print(t)


# ── Entry point ───────────────────────────────────────────────────────────────


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    seed = {
        "ref_regions": [],
        "ref_countries": [],
        "ref_institution_types": [],
        "ref_agreement_types": [],
        "ref_campuses": [],
        "ref_attrs": [],
        "ref_statuses": [],
        "ref_utilizations": [],
        "ref_beneficiaries": [],
        "universities": [],
        "agreements": [],
        "contacts": [],
        "observations": [],
    }

    console.print("\n[bold cyan]Convenios Internacionales — ETL Pipeline[/]\n")

    df, df_comments = extract(seed)
    df = analyse(df, df_comments, seed)
    transform(df, df_comments, seed)
    print_summary(seed)

    # Write seed.json
    seed.pop("_url_cache", None)  # internal only — not for the TypeScript seeder
    seed_path = OUTPUT_DIR / "seed.json"
    with open(seed_path, "w", encoding="utf-8") as f:
        json.dump(seed, f, ensure_ascii=False, indent=2, default=str)
    ok(f"seed.json → [bold]{seed_path}[/]")

    # Save HTML report
    report_path = OUTPUT_DIR / "report.html"
    console.save_html(str(report_path))
    ok(f"report.html → [bold]{report_path}[/]")


if __name__ == "__main__":
    main()
