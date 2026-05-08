// Fire-and-forget — never awaited, never blocks the download.
export function logClientExport(
  entity: 'agreement' | 'university',
  count: number,
  filename: string
): void {
  fetch('/api/audit/export', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ entity, count, filename }),
  }).catch((err) => console.error('[logClientExport]', err));
}
