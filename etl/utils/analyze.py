"""
analyze.py — Pure analytical functions over Polars DataFrames.

Every function here:
  - Takes a DataFrame + one or more column name strings
  - Returns a DataFrame (never prints, never logs, never raises on bad data)
  - Has no side effects

These are used in two contexts:
  1. Pre-ETL analysis — run against the raw Excel to understand data shape
     before writing any transformation logic.
  2. ETL validation — called from main.py to produce summary stats that
     feed into the Rich report.

None of these functions belong in the ETL pipeline itself. They answer
"what does the data look like?" not "what should I do with it?".
"""

import unicodedata
import polars as pl
from typing import Any
from rapidfuzz import process, fuzz


# ── Distribution & frequency ──────────────────────────────────────────────────

def value_distribution(
    df: pl.DataFrame,
    column: str,
    normalize_values: bool = False,
) -> pl.DataFrame:
    """
    Frequency table of unique values in a column, sorted descending.

    Args:
        normalize_values: When True, groups by the accent-stripped casefolded
                          form (so "México"/"Mexico"/"MEXICO" count as one) but
                          displays the first seen raw value as the label.

    Returns columns: [column, count]
    """
    if not normalize_values:
        return (
            df.group_by(column)
            .agg(pl.len().alias("count"))
            .sort("count", descending=True)
        )

    # Normalise in Python so we can use the same _normalize logic as the rest
    # of the toolkit, then reconstruct a clean DataFrame.
    rows = df[column].drop_nulls().to_list()
    counts: dict[str, int] = {}
    canonical: dict[str, str] = {}   # norm_key → first seen raw value
    for v in rows:
        key = _normalize(str(v))
        counts[key] = counts.get(key, 0) + 1
        canonical.setdefault(key, str(v))
    return (
        pl.DataFrame({
            column:  list(canonical.values()),
            "count": [counts[k] for k in canonical],
        })
        .sort("count", descending=True)
    )


def null_summary(df: pl.DataFrame, columns: list[str]) -> pl.DataFrame:
    """
    Null count and percentage for each requested column.
    Silently skips columns that don't exist in the DataFrame.

    Returns columns: [column, null_count, null_pct, exists]
    """
    total = df.height
    rows = []
    for col in columns:
        if col not in df.columns:
            rows.append({"column": col, "null_count": -1, "null_pct": -1.0, "exists": False})
            continue
        n = df[col].null_count()
        rows.append({
            "column":     col,
            "null_count": n,
            "null_pct":   round(n / total * 100, 2) if total > 0 else 0.0,
            "exists":     True,
        })
    return pl.DataFrame(rows)


def null_rows(df: pl.DataFrame, target_col: str, context_cols: list[str]) -> pl.DataFrame:
    """
    Rows where target_col is null, projected to context_cols only.
    Only returns context_cols that actually exist in the DataFrame.
    """
    safe_cols = [c for c in context_cols if c in df.columns]
    return df.filter(pl.col(target_col).is_null()).select(safe_cols)


# ── Format / pattern analysis ─────────────────────────────────────────────────

def format_patterns(df: pl.DataFrame, column: str) -> pl.DataFrame:
    """
    Replace [0-9] → '0', [A-Z] → 'A', [a-z] → 'a' to surface structural
    patterns in a column (e.g. 'AA-0000', 'Aa Aa').
    Useful for spotting mixed formats in dates, IDs, phone numbers.

    Returns columns: [pattern, count, percentage, example_value]
    """
    return (
        df.select(pl.col(column))
        .with_columns(
            pl.col(column)
            .cast(pl.Utf8)
            .str.replace_all(r"[0-9]", "0")
            .str.replace_all(r"[A-Z]", "A")
            .str.replace_all(r"[a-z]", "a")
            .alias("pattern")
        )
        .group_by("pattern")
        .agg([
            pl.len().alias("count"),
            pl.col(column).first().alias("example_value"),
        ])
        .sort("count", descending=True)
        .with_columns(
            (pl.col("count") / df.height * 100).round(2).alias("percentage")
        )
    )


def numeric_stats(df: pl.DataFrame, column: str) -> pl.DataFrame:
    """
    Basic stats + data quality metrics for a column treated as numeric.
    Values that cannot be cast to Float64 are counted as conversion_failures.

    Returns columns: [column_name, min, max, mean, valid_count,
                      conversion_failures, failure_pct]
    """
    casted     = df.select(pl.col(column).cast(pl.Float64, strict=False))
    total      = df.height
    orig_nulls = df[column].null_count()
    new_nulls  = casted[column].null_count()
    failures   = new_nulls - orig_nulls
    valid      = total - new_nulls

    return casted.select([
        pl.lit(column).alias("column_name"),
        pl.col(column).min().alias("min"),
        pl.col(column).max().alias("max"),
        pl.col(column).mean().alias("mean"),
        pl.lit(valid).alias("valid_count"),
        pl.lit(failures).alias("conversion_failures"),
        pl.lit(round(failures / total * 100, 2) if total > 0 else 0.0).alias("failure_pct"),
    ])


# ── URL validation ────────────────────────────────────────────────────────────

_URL_PATTERN = (
    r'^(?:http|ftp)s?://'
    r'(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)'
    r'+(?:[a-zA-Z]{2,}|[a-zA-Z0-9-]{2,})'
    r'|\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})'
    r'(?::\d+)?(?:/?|[/?]\S+)?$'
)

def url_split(df: pl.DataFrame, column: str) -> tuple[pl.DataFrame, pl.DataFrame]:
    """
    Split a DataFrame into (valid_urls, invalid_urls) based on column.
    Null values are excluded from both outputs.

    Returns: (df_valid, df_invalid)
    """
    is_valid = (
        pl.col(column).is_not_null()
        & pl.col(column).str.contains(_URL_PATTERN, literal=False, strict=False)
    )
    return df.filter(is_valid), df.filter(~is_valid & pl.col(column).is_not_null())


# ── Fuzzy clustering ──────────────────────────────────────────────────────────

def _normalize(text: Any) -> str:
    """Accent-strip + casefold for fuzzy comparison."""
    if not isinstance(text, str):
        return ""
    return "".join(
        c for c in unicodedata.normalize("NFD", text)
        if unicodedata.category(c) != "Mn"
    ).casefold()


def fuzzy_clusters(
    df: pl.DataFrame,
    column: str,
    threshold: float = 85.0,
) -> pl.DataFrame:
    """
    Group similar string values into clusters using BFS over a fuzzy
    similarity graph. Accent-insensitive ('Panamá' == 'Panama').
    Canonical form is the longest string in each cluster.

    Returns columns: [canonical_name, cluster_size, variations, scores]
    Sorted by cluster_size descending. Single-member clusters are included
    (cluster_size=1, variations=[], scores=[]).

    Useful for spotting near-duplicate country/region/institution names
    before assigning ref table ids.
    """
    unique = df[column].str.strip_chars().drop_nulls().unique().to_list()

    if not unique:
        return pl.DataFrame(schema={
            "canonical_name": pl.Utf8,
            "cluster_size":   pl.UInt32,
            "variations":     pl.List(pl.Utf8),
            "scores":         pl.List(pl.Float64),
        })

    # Build adjacency list
    adj: dict[str, list[str]] = {v: [] for v in unique}
    for i, val in enumerate(unique):
        rest = unique[i + 1:]
        if not rest:
            continue
        for match, score, _ in process.extract(
            val, rest,
            scorer=fuzz.token_sort_ratio,
            processor=_normalize,
            score_cutoff=threshold,
            limit=None,
        ):
            adj[val].append(match)
            adj[match].append(val)

    # BFS connected components
    visited: set[str] = set()
    results = []

    for start in unique:
        if start in visited:
            continue
        component: set[str] = {start}
        stack = [start]
        visited.add(start)
        while stack:
            node = stack.pop()
            for neighbour in adj[node]:
                if neighbour not in visited:
                    visited.add(neighbour)
                    component.add(neighbour)
                    stack.append(neighbour)

        members    = list(component)
        canonical  = max(members, key=len)
        variations = [m for m in members if m != canonical]
        scores     = [
            round(fuzz.token_sort_ratio(canonical, m, processor=_normalize), 2)
            for m in variations
        ]
        results.append({
            "canonical_name": canonical,
            "cluster_size":   len(component),
            "variations":     variations,
            "scores":         scores,
        })

    return pl.DataFrame(results).sort("cluster_size", descending=True)


# ── Keyword categorisation ────────────────────────────────────────────────────

def categorize_by_keywords(
    df: pl.DataFrame,
    column: str,
    buckets: list[dict],
    threshold: int = 80,
) -> tuple[pl.DataFrame, pl.DataFrame]:
    """
    Classify unique values in column against keyword buckets using fuzzy
    partial matching, then return two DataFrames.

    buckets format:
        [{"label": "University", "keywords": ["universidad", "university"]}, ...]

    Returns: (df_matched, df_unmatched)
      df_matched   — original rows with a new 'category_type' column
      df_unmatched — original rows that matched no bucket
    """
    unique = df[column].drop_nulls().unique().to_list()
    mapping: dict[str, str] = {}

    for val in unique:
        if not isinstance(val, str):
            continue
        for bucket in buckets:
            score = max(
                (fuzz.partial_ratio(k.lower(), val.lower()) for k in bucket["keywords"]),
                default=0,
            )
            if score >= threshold:
                mapping[val] = bucket["label"]
                break

    df_mapped = df.with_columns(
        pl.col(column).replace(mapping, default=None).alias("category_type")
    )
    return (
        df_mapped.filter(pl.col("category_type").is_not_null()),
        df_mapped.filter(pl.col("category_type").is_null()),
    )