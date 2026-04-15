"""
transform.py — Pure ETL primitives.

Every function here is:
  - Stateless (no globals, no I/O, no DataFrame access)
  - Independently testable
  - Called by main.py on individual cell values

The only exception is resolve_or_create, which mutates the ref_list
it receives — the caller (main.py) owns the list and passes it in.
"""

import re
import unicodedata
from datetime import datetime
from typing import Any, NamedTuple


# ── Text normalisation ────────────────────────────────────────────────────────


def normalize(value: Any) -> str:
    """
    Canonical text normalisation used for all ref-table lookups.
    'México' → 'mexico'  |  ' ESPAÑA ' → 'espana'

    Steps: strip whitespace → NFKD accent removal → casefold.
    Returns '' for None or non-string input.
    """
    if not isinstance(value, str):
        return ""
    nfkd = unicodedata.normalize("NFKD", value.strip())
    return "".join(c for c in nfkd if not unicodedata.combining(c)).casefold()


def clean_text(value: Any, max_length: int | None = None) -> str | None:
    """
    Strip whitespace from a text cell. Returns None for null/empty.
    Optionally truncates to max_length to respect DB column limits.
    """
    if not value:
        return None
    text = str(value).strip()
    if not text:
        return None
    return text[:max_length] if max_length else text


# ── Slug generation ──────────────────────────────────────────────────────────


def make_slug(name: Any, existing: set[str] | None = None) -> str:
    """
    URL-safe slug from a university name.

    Steps:
      1. NFKD normalisation — strips accents ("México" → "Mexico")
      2. Casefold
      3. Replace any run of non-alphanumeric characters with a single "-"
      4. Strip leading/trailing hyphens

    Collision handling: if `existing` is provided and the slug is already
    in the set, appends "-2", "-3", … until unique. The caller is responsible
    for adding the returned slug to the set.

    "Universidad Nacional Autónoma de México" → "universidad-nacional-autonoma-de-mexico"
    "MIT"                                     → "mit"
    "École Polytechnique"                     → "ecole-polytechnique"
    """
    if not name:
        return "unknown"

    nfkd = unicodedata.normalize("NFKD", str(name).strip())
    clean = "".join(c for c in nfkd if not unicodedata.combining(c)).casefold()
    slug = re.sub(r"[^a-z0-9]+", "-", clean).strip("-")

    if not slug:
        return "unknown"

    if existing is None:
        return slug

    candidate, counter = slug, 2
    while candidate in existing:
        candidate = f"{slug}-{counter}"
        counter += 1
    return candidate


# ── Boolean / truthy helpers ──────────────────────────────────────────────────


def is_truthy(value: Any) -> bool:
    """
    The 'cumple()' logic from old_main — determines whether a type-flag
    column (INTERCAMBIO, STUDY_ABROAD, etc.) counts as active.

    Falsy cases: None, NaN, empty string, strings starting with 'n' (No, NA, N/A).
    Everything else — 'X', 'SI', '1', 'x', a number — is truthy.
    """
    if value is None:
        return False
    text = str(value).strip().lower()
    return bool(text) and not text.startswith("n")


def parse_bool_field(value: Any) -> bool:
    """
    For yes/no columns like Católica.
    'SI', 'S', 'SÍ', '1', 'X', 'x' → True. Everything else → False.
    """
    if value is None:
        return False
    return normalize(value) in {"si", "sí", "s", "1", "x", "yes"}


# ── Numeric / slots ───────────────────────────────────────────────────────────


def parse_slots(value: Any) -> int | None:
    """
    Parse a plazas (spots) cell value.

    - Numeric string or int → int
    - Truthy non-numeric (e.g. 'X', 'SI') → 0  (spots exist, count unknown)
    - Falsy / null / 'N' / 'NA' → None           (not applicable)
    """
    if not is_truthy(value):
        return None
    text = str(value).strip()
    if re.fullmatch(r"\d+", text):
        return int(text)
    return 0


# ── Date parsing ──────────────────────────────────────────────────────────────

# Formats found in the Excel — order matters (most specific first).
_DATE_FORMATS = [
    "%Y-%m-%d",
    "%d/%m/%Y",
    "%d-%m-%Y",
    "%Y",
    "%d/%m/%y",
]

# Raw values that explicitly mean "no expiry / open-ended".
# Caller receives date=None + indefinido=True and should NOT emit a warning.
_INDEFINIDO_VALUES = {
    "indefinido",
    "indefinida",
    "indeterminado",
    "abierto",
    "sin vigencia",
}


class DateResult(NamedTuple):
    date: str | None  # ISO string "YYYY-MM-DD", or None
    indefinido: bool  # True  → value meant "open-ended", None is intentional
    error: bool  # True  → value was present but unparseable → emit WARNING


def parse_date(value: Any) -> DateResult:
    """
    Best-effort ISO date string from a raw cell value.

    Returns a DateResult(date, indefinido, error):
      - Null / empty          → DateResult(None, False, False)  — just absent
      - "indefinido" / etc.   → DateResult(None, True,  False)  — intentional open-end
      - Parseable             → DateResult("YYYY-MM-DD", False, False)
      - Present but bad       → DateResult(None, False, True)   — emit WARNING

    Caller pattern:
        result = parse_date(row.get(Col.VIGENCIA))
        if result.error:
            obs.append(make_obs("WARNING", ...))
        university["expires"] = result.date
    """
    if not value or str(value).strip() in {"", "None", "nan"}:
        return DateResult(None, False, False)

    text = str(value).strip()

    if normalize(text) in _INDEFINIDO_VALUES:
        return DateResult(None, True, False)

    for fmt in _DATE_FORMATS:
        try:
            return DateResult(
                datetime.strptime(text, fmt).strftime("%Y-%m-%d"), False, False
            )
        except ValueError:
            continue

    return DateResult(None, False, True)


# ── Utilization mapping ───────────────────────────────────────────────────────

_UTILIZATION_MAP = {
    "si": "Alta",
    "sí": "Alta",
    "poco": "Media",
    "no": "Baja",
}


def map_utilization(value: Any) -> str:
    """
    Map the Se_USA Excel value to a RefUtilization value string.
    Sí → Alta  |  Poco → Media  |  No → Baja  |  anything else → Nula
    """
    return _UTILIZATION_MAP.get(normalize(value), "Nula")


# ── Beneficiary splitting ─────────────────────────────────────────────────────


def split_beneficiarios(value: Any) -> list[str]:
    """
    Split the 'Área, Escuela o Facultad' cell into individual school tokens.
    Splits on comma or slash, strips whitespace, drops empty parts.
    Returns [] for null / empty input.

    'EN, IN / CC' → ['EN', 'IN', 'CC']
    """
    if not value or not isinstance(value, str):
        return []
    return [p.strip() for p in re.split(r"[,/]", value) if p.strip()]


_BENEFICIARY_ALIASES: dict[str, str] = {
    "abierto": "ZZ",
    "todas": "ZZ",
    "todas las escuelas": "ZZ",
    "estudios": "EG",
    "estudios generales": "EG",
    "deporte": "CD",
    "deportes": "CD",
    "comunicacion": "CC",
}


def resolve_beneficiary_token(token: str, ref_list: list[dict]) -> int | None:
    """
    Resolve a single beneficiary token to a ref_beneficiaries id.

    Resolution order:
      1. Alias map  — catches freeform words like "Abierto" → ZZ
      2. CVE match  — exact code like "EN", "CC"
      3. Name match — full name like "Ingeniería"
    """
    alias_cve = _BENEFICIARY_ALIASES.get(normalize(token))
    if alias_cve:
        bid = resolve_ref(alias_cve, ref_list, name_key="cve")
        if bid is not None:
            return bid

    bid = resolve_ref(token, ref_list, name_key="cve")
    if bid is not None:
        return bid

    return resolve_ref(token, ref_list, name_key="name")


# ── Reference table resolution ────────────────────────────────────────────────


def resolve_ref(value: Any, ref_list: list[dict], name_key: str = "name") -> int | None:
    """
    Exact-match lookup (after normalisation) against a ref table list.
    Returns the matching row's 'id', or None if no match.

    Args:
        value:     Raw cell value to look up.
        ref_list:  List of dicts, each with an 'id' and a name field.
        name_key:  The field to match against (default 'name', use 'value'
                   for RefStatus / RefUtilization).

    Example:
        resolve_ref("México", seed["ref_countries"])  → 42
    """
    needle = normalize(value)
    if not needle:
        return None
    for row in ref_list:
        if normalize(row.get(name_key, "")) == needle:
            return row["id"]
    return None


def resolve_or_create(
    value: Any,
    ref_list: list[dict],
    name_key: str = "name",
) -> tuple[int, bool]:
    """
    Resolve a value against a ref table, inserting a new row if absent.
    Mutates ref_list in place — the caller owns the list.

    Returns:
        (id, created)
          id      — the existing or newly assigned integer id
          created — True if a new row was appended

    Null / whitespace-only values resolve to id=0 (N/A sentinel) without
    inserting — the caller receives created=False so no WARNING is emitted.

    The new id is max(existing ids) + 1.
    Caller should log a WARNING observation when created=True.

    Example:
        region_id, created = resolve_or_create("Oceanía", seed["ref_regions"])
        if created:
            log_observation(WARNING, "etl_new_ref", f"New region: Oceanía")
    """
    # Empty / whitespace-only → N/A sentinel (id=0), never insert a blank row.
    if not normalize(value):
        return 0, False

    existing_id = resolve_ref(value, ref_list, name_key)
    if existing_id is not None:
        return existing_id, False

    display = str(value).strip()
    new_id = max((r["id"] for r in ref_list), default=-1) + 1
    ref_list.append({"id": new_id, name_key: display})
    return new_id, True


# ── URL resolution ────────────────────────────────────────────────────────────

_WEB_URL_RE = re.compile(
    r"^(?:http|ftp)s?://(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+(?:[a-zA-Z]{2,}))(?::\d+)?(?:/?|[/?]\S+)?$"
)
_LOCAL_PATH_RE = re.compile(
    r"^(?:\.{1,4}/|[a-zA-Z]:\\|/Users/|/home/|smb://|file://|%[0-9A-Fa-f]{2})"
)


def is_web_url(value: Any) -> bool:
    """True if value looks like a reachable web URL (http/https/ftp)."""
    return bool(value and _WEB_URL_RE.match(str(value).strip()))


def is_local_path(value: Any) -> bool:
    """True if value looks like a local or network file path."""
    return bool(value and _LOCAL_PATH_RE.match(str(value).strip()))


class UrlPairResult(NamedTuple):
    web_url: str | None  # best web URL found, or None
    local_path: str | None  # local/SharePoint path if present
    source: str  # "hyperlink" | "display_text" | "none"


def resolve_url_pair(display: Any, hyperlink: Any) -> UrlPairResult:
    """
    Resolve a (display_text, hyperlink_target) pair into the best available URL.

    Priority:
      1. Hyperlink target if it is a valid web URL  → source="hyperlink"
      2. Display text if it is a valid web URL       → source="display_text"
      3. Neither is a web URL                        → web_url=None

    Local/SharePoint paths (from link_convenio_url) are captured separately
    in local_path so the caller can store them and emit an INFO observation.

    Examples:
      ("UCA - Universidad...", "https://uca.edu.ar/")
          → UrlPairResult("https://uca.edu.ar/", None, "hyperlink")

      ("https://unam.mx/", None)
          → UrlPairResult("https://unam.mx/", None, "display_text")

      ("Convenio UAMX 2018", "../../../../personal/.../file.pdf")
          → UrlPairResult(None, "../../../../personal/.../file.pdf", "none")
    """
    hyp = str(hyperlink).strip() if hyperlink else None
    dis = str(display).strip() if display else None

    local = hyp if (hyp and is_local_path(hyp)) else None

    if hyp and is_web_url(hyp):
        return UrlPairResult(hyp, local, "hyperlink")
    if dis and is_web_url(dis):
        return UrlPairResult(dis, local, "display_text")
    return UrlPairResult(None, local, "none")


# ── Contact value classification ──────────────────────────────────────────────

_EMAIL_RE = re.compile(r"^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$")
_PHONE_RE = re.compile(
    r"^(?:[\+\d][\d\s\-\.\(\)]*|ext\.?\s*\d[\d\s\-]{2,})$", re.IGNORECASE
)


class ContactValueType(NamedTuple):
    type_name: str  # "EMAIL" | "PHONE" | "OTHER"
    valid: bool  # False → skip this contact, emit WARNING


def classify_contact(value: Any) -> ContactValueType:
    """
    Classify a raw contact cell value as EMAIL, PHONE, or OTHER.

    - EMAIL  → valid=True  — matches standard email pattern
    - PHONE  → valid=True  — digits, spaces, +, -, (), ext
    - OTHER  → valid=False — caller should skip and emit a WARNING observation

    Examples:
      "john@uni.edu"          → ContactValueType("EMAIL", True)
      "+52 55 1234 5678"      → ContactValueType("PHONE", True)
      "ext 4521"              → ContactValueType("PHONE", True)
      "N/A"                   → ContactValueType("OTHER", False)
      "See website"           → ContactValueType("OTHER", False)
    """
    if not value:
        return ContactValueType("OTHER", False)

    text = str(value).strip()

    if not text or normalize(text) in ("n/a", "na", "no aplica", "none", ""):
        return ContactValueType("OTHER", False)

    if _EMAIL_RE.match(text):
        return ContactValueType("EMAIL", True)

    if _PHONE_RE.match(text):
        return ContactValueType("PHONE", True)

    return ContactValueType("OTHER", False)
