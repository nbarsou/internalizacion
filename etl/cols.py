from typing import Final


class Col:
    """
    Normalised column names of the main universities DataFrame,
    exactly as produced by loader._clean_header().

    Sourced   — come directly from Excel headers.
    Generated — created by the loader at runtime.
    Dropped   — present in the Excel but excluded from the ETL.
    """

    # ── Sourced: identity ─────────────────────────────────────────────────────
    ROW_ID:        Final = "row_id"           # stable UUID added by loader
    UNIVERSIDAD:   Final = "universidad"
    CIUDAD:        Final = "ciudad"
    DIRECCION:     Final = "direccion"        # new — physical address

    # ── Sourced: dates ────────────────────────────────────────────────────────
    INICIO:        Final = "inicio"
    VIGENCIA:      Final = "vigencia"

    # ── Sourced: classification ───────────────────────────────────────────────
    REGION:        Final = "region"
    PAIS:          Final = "pais"
    GIRO:          Final = "giro"
    CAMPUS:        Final = "campus_titular"

    # ── Sourced: metadata ─────────────────────────────────────────────────────
    CATOLICA:      Final = "catolica"
    SE_USA:        Final = "se_usa"
    PAGINA_WEB:    Final = "pagina_web"       # display text; URL → PAGINA_WEB_URL
    OBSERVACIONES: Final = "observaciones"

    # ── Sourced: agreement type flags ─────────────────────────────────────────
    STUDY_ABROAD:  Final = "study_abroad"
    INTERCAMBIO:   Final = "intercambio"
    PLAZAS_LIC:    Final = "plazas_lic"
    PLAZAS_POS:    Final = "plazas_posgrado"
    PRACTICAS:     Final = "practicas"
    INVESTIGACION: Final = "investigacion"
    DOBLE_DIPLOMA: Final = "doble_diploma"
    COTUTELA:      Final = "cotutela"
    OTRO:          Final = "otro"

    # ── Sourced: accreditations ───────────────────────────────────────────────
    ABET:          Final = "abet"
    ACJMC:         Final = "acjmc"
    AACSB:         Final = "aacsb"
    AMBA:          Final = "amba"
    EFMD:          Final = "efmd"

    # ── Sourced: beneficiaries ────────────────────────────────────────────────
    BENEFICIARIOS: Final = "area_escuela_o_facultad"

    # ── Sourced: contacts ─────────────────────────────────────────────────────
    CONTACTO_ENT:  Final = "contacto_intercambios_entrantes"
    CONTACTO_SAL:  Final = "contacto_intercambios_salientes"

    # ── Sourced: agreement link ───────────────────────────────────────────────
    LINK_CONVENIO: Final = "link_convenio"   # display text; URL → LINK_CONVENIO_URL

    # ── Generated: hyperlink targets (loader appends _url) ────────────────────
    PAGINA_WEB_URL:    Final = "pagina_web_url"
    CONTACTO_ENT_URL:  Final = "contacto_intercambios_entrantes_url"
    CONTACTO_SAL_URL:  Final = "contacto_intercambios_salientes_url"
    OBSERVACIONES_URL: Final = "observaciones_url"
    LINK_CONVENIO_URL: Final = "link_convenio_url"

    # ── Dropped: present in Excel, excluded from ETL ──────────────────────────
    # QS_RANKING    = "qs_world_university_ranking"   # DROP
    # IDIOMA        = "idioma_de_clases"              # DROP
    # CALIFICACIONES= "calificaciones"                # DROP


class CommentCol:
    """
    Column names of the df_comments DataFrame,
    as produced by loader._extract_excel().
    One row per cell comment found in the Excel.
    """
    ROW_ID:        Final = "row_id"          # FK back to Col.ROW_ID
    COLUMN_SOURCE: Final = "column_source"   # normalised name of the commented cell
    COMMENT_TEXT:  Final = "comment_text"    # cleaned text (MS boilerplate stripped)
    AUTHOR:        Final = "author"          # comment author as stored in Excel