"""
network.py — URL connectivity checking, no config, no IO, no side effects.

Two layers:

  check_url(url)
    → Single URL → UrlResult (dataclass)
    Pure function. Used by the ETL to check individual URLs and decide
    whether to emit an Observation.

  check_urls(urls, max_workers)
    → list[str] → list[UrlResult]
    Threaded batch check. Used by analysis to check a whole column at once.

  summarize(results)
    → list[UrlResult] → pl.DataFrame
    Aggregate results into a stats table. Analysis / reporting use this.

The caller controls whether to run at all (check enabled flag before calling).
"""

import logging
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass

import polars as pl
import requests

log = logging.getLogger(__name__)

# ── Result type ───────────────────────────────────────────────────────────────


@dataclass(frozen=True)
class UrlResult:
    url: str
    http_code: int
    status: str  # "OK" | "Client Error" | "Server Error" | "Timeout" | "Connection Error" | "Unknown"

    @property
    def ok(self) -> bool:
        return self.http_code == 200

    @property
    def observation_level(self) -> str:
        """Maps result to an ObservationLevel string for the ETL."""
        if self.ok:
            return "INFO"
        if self.status == "Timeout":
            return "WARNING"
        return "ERROR"


# ── Single URL ────────────────────────────────────────────────────────────────


def check_url(
    url: str,
    timeout: int = 5,
    user_agent: str = "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
) -> UrlResult:
    """
    Ping a single URL and return a UrlResult.
    Never raises — all exceptions are caught and encoded in the result.

    Args:
        url:        The URL to check.
        timeout:    Request timeout in seconds.
        user_agent: User-Agent header value. University servers often block
                    requests without one.
    """
    try:
        resp = requests.get(url, timeout=timeout, headers={"User-Agent": user_agent})
        code = resp.status_code
        if code == 200:
            status = "OK"
        elif 400 <= code < 500:
            status = "Client Error"
        elif code >= 500:
            status = "Server Error"
        else:
            status = f"Code {code}"
        return UrlResult(url=url, http_code=code, status=status)

    except requests.exceptions.Timeout:
        return UrlResult(url=url, http_code=408, status="Timeout")
    except requests.exceptions.ConnectionError:
        return UrlResult(url=url, http_code=0, status="Connection Error")
    except Exception as exc:
        log.debug(f"Unexpected error checking {url}: {exc}")
        return UrlResult(url=url, http_code=0, status="Unknown")


# ── Batch (threaded) ──────────────────────────────────────────────────────────


def check_urls(
    urls: list[str],
    max_workers: int = 10,
    timeout: int = 5,
) -> list[UrlResult]:
    """
    Check a list of URLs concurrently. Deduplicates before checking so
    the same URL is never pinged twice regardless of how many rows share it.

    Args:
        urls:        Raw list — duplicates are handled internally.
        max_workers: Thread pool size.
        timeout:     Per-request timeout in seconds.

    Returns:
        One UrlResult per *unique* URL (not one per input item).
        The caller can build a lookup dict: {r.url: r for r in results}.
    """
    unique = list(
        dict.fromkeys(u for u in urls if u)
    )  # dedupe, preserve order, drop None
    log.info(
        f"Checking {len(unique)} unique URLs ({max_workers} workers, {timeout}s timeout)"
    )

    results: list[UrlResult] = []
    with ThreadPoolExecutor(max_workers=max_workers) as pool:
        futures = {pool.submit(check_url, url, timeout): url for url in unique}
        for i, future in enumerate(as_completed(futures), 1):
            results.append(future.result())
            if i % 10 == 0:
                log.debug(f"  {i}/{len(unique)} checked")

    log.info(f"URL check complete — {sum(r.ok for r in results)}/{len(results)} OK")
    return results


# ── Analysis helpers ──────────────────────────────────────────────────────────


def summarize(results: list[UrlResult]) -> pl.DataFrame:
    """
    Aggregate a list of UrlResults into a stats table.
    Used by analysis / reporting — not by the ETL pipeline.

    Returns columns: [status, count, percentage]
    """
    if not results:
        return pl.DataFrame({"status": [], "count": [], "percentage": []})

    df = pl.DataFrame(
        {
            "status": [r.status for r in results],
            "http_code": [r.http_code for r in results],
        }
    )
    return (
        df.group_by("status")
        .agg(pl.len().alias("count"))
        .with_columns(
            (pl.col("count") / len(results) * 100).round(2).alias("percentage")
        )
        .sort("count", descending=True)
    )


def failed(results: list[UrlResult]) -> list[UrlResult]:
    """Return only the results that were not HTTP 200."""
    return [r for r in results if not r.ok]
