/**
 * agreements-export-transform.ts
 *
 * Pure function — no DB calls, no side effects.
 * Takes the data already fetched by the Route Handler and returns a
 * Buffer ready to stream back as an .xlsx response.
 *
 * Sheet layout:
 *   1. Convenios  — one row per beneficiary per agreement (fan-out)
 *   2. Info       — one row per agreement (metadata placeholders)
 *   3. Plazas     — one row per agreement (spots + dates)
 *   4. Catálogos  — all ref tables side-by-side
 */

import * as XLSX from 'xlsx';
import type { AgreementExportRow, ExportCatalogs } from './db';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(date: Date | null | undefined): string {
  if (!date) return '';
  return new Date(date).toISOString().split('T')[0]; // YYYY-MM-DD
}

// ── Sheet builders ────────────────────────────────────────────────────────────

/**
 * Sheet 1 — Convenios
 * One row per beneficiary. If an agreement has no beneficiaries, emit one
 * row with an empty Cve_Escuela (matches the POC's behaviour).
 */
function buildConveniosSheet(agreements: AgreementExportRow[]) {
  const rows: Record<string, unknown>[] = [];

  for (const ag of agreements) {
    const uni = ag.university;
    const base = {
      Nombre_Convenio: uni.name,
      Campus: uni.campus?.value ?? '',
      Giro: uni.institutionType?.value ?? '',
      Region: uni.region?.value ?? '',
      Pais: uni.country?.value ?? '',
      Bloque: '0',
      Contacto: '',
    };

    if (ag.beneficiaries.length === 0) {
      rows.push({ ...base, Cve_Escuela: '' });
      continue;
    }

    for (const b of ag.beneficiaries) {
      rows.push({
        Nombre_Convenio: base.Nombre_Convenio,
        Cve_Escuela: b.beneficiary.cve ?? '',
        Campus: base.Campus,
        Giro: base.Giro,
        Region: base.Region,
        Pais: base.Pais,
        Bloque: base.Bloque,
        Contacto: base.Contacto,
      });
    }
  }

  return XLSX.utils.json_to_sheet(rows);
}

/**
 * Sheet 2 — Info
 * One row per agreement. Several columns are left blank — they are filled
 * manually after export (ranking, objectives, language, etc.).
 */
function buildInfoSheet(
  agreements: AgreementExportRow[],
  canReadSensitive: boolean
) {
  const rows = agreements.map((ag) => ({
    Nombre_Convenio: ag.university.name,
    RankingQSWU: '',
    Objetivos: '',
    Idioma: '',
    Calificacion: '',
    Link: canReadSensitive ? (ag.link_convenio ?? '') : '',
    Comentario: '',
  }));

  return XLSX.utils.json_to_sheet(rows);
}

/**
 * Sheet 3 — Plazas
 * One row per agreement with spot counts and validity dates.
 */
function buildPlazasSheet(agreements: AgreementExportRow[]) {
  const rows = agreements.map((ag) => ({
    Nombre_Convenio: ag.university.name,
    Nivel: '',
    Tipo_Plaza: ag.type?.value ?? '',
    Plazas: ag.spots ?? '',
    Fecha_Inicio: fmt(ag.university.start),
    Fecha_Final: fmt(ag.university.expires),
  }));

  return XLSX.utils.json_to_sheet(rows);
}

/**
 * Sheet 4 — Catálogos
 * All reference tables rendered side-by-side. Empty strings fill short
 * columns so every row has the same number of cells.
 */
function buildCatalogosSheet(catalogs: ExportCatalogs) {
  const { regiones, paises, giros, tiposPlaza, beneficiarios } = catalogs;
  const maxLen = Math.max(
    regiones.length,
    paises.length,
    giros.length,
    tiposPlaza.length,
    beneficiarios.length
  );

  const rows: Record<string, unknown>[] = [];

  for (let i = 0; i < maxLen; i++) {
    rows.push({
      // A-B: Regiones
      Region: regiones[i]?.value ?? '',
      ID_Region: regiones[i]?.id ?? '',
      _gap1: '',
      // D-E: Países
      Pais: paises[i]?.value ?? '',
      ID_Pais: paises[i]?.id ?? '',
      _gap2: '',
      // G-H: Giros (TipoInstitución)
      Giro: giros[i]?.value ?? '',
      ID_Giro: giros[i]?.id ?? '',
      _gap3: '',
      _gap4: '',
      _gap5: '',
      _gap6: '',
      // M-N: Tipos de plaza
      Plaza: tiposPlaza[i]?.value ?? '',
      ID_Plaza: tiposPlaza[i]?.id ?? '',
      _gap7: '',
      // P-Q: Beneficiarios
      CVE: beneficiarios[i]?.cve ?? '',
      Descripcion: beneficiarios[i]?.value ?? '',
    });
  }

  return XLSX.utils.json_to_sheet(rows);
}

// ── Main export ───────────────────────────────────────────────────────────────

export function buildAgreementsExportWorkbook(
  agreements: AgreementExportRow[],
  catalogs: ExportCatalogs,
  canReadSensitive: boolean
): ArrayBuffer {
  const wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    wb,
    buildConveniosSheet(agreements),
    'Convenios'
  );
  XLSX.utils.book_append_sheet(
    wb,
    buildInfoSheet(agreements, canReadSensitive),
    'Info'
  );
  XLSX.utils.book_append_sheet(wb, buildPlazasSheet(agreements), 'Plazas');
  XLSX.utils.book_append_sheet(wb, buildCatalogosSheet(catalogs), 'Catálogos');

  // XLSX.write returns Uint8Array<ArrayBufferLike> — the "Like" union includes
  // SharedArrayBuffer, which Blob rejects. .slice() always produces a plain
  // ArrayBuffer copy with no SharedArrayBuffer ambiguity.
  const uint8 = XLSX.write(wb, {
    type: 'buffer',
    bookType: 'xlsx',
  }) as Uint8Array;
  return uint8.buffer.slice(
    uint8.byteOffset,
    uint8.byteOffset + uint8.byteLength
  ) as ArrayBuffer;
}
