// Colores del patrocinador "Estadio Gana".
// Extraídos del logo oficial (public/sponsor/estadio-gana-color.png)
// con PIL (quantize a 8 colores). Porcentajes = cobertura de píxeles del logo.

export const ESTADIO_GANA = {
  // Rojo del bloque "GANA" (19.2% del logo, el más dominante).
  rojoEstadio: '#CD232C',

  // Verde del texto "ESTADIO" (9.5%).
  verdeCampo: '#619B50',

  // Contorno y sombras del logo (1.9%).
  negroCarbon: '#242421',

  // Texto "GANA".
  blanco: '#FFFFFF',
};

export const BRAND_PRIMARIO = ESTADIO_GANA.rojoEstadio;
export const BRAND_SECUNDARIO = ESTADIO_GANA.verdeCampo;
export const BRAND_ACENTO = ESTADIO_GANA.negroCarbon;

// Theme global del sitio tras el rebrandeo Estadio Gana.
//
// - primario        → verde Estadio Gana. Va en headers, footers, fondos primarios.
// - acentoCTA       → rojo Estadio Gana. Solo en CTAs principales (Inscribirme, Entrar, Pronosticar).
// - dorado          → se conserva ÚNICAMENTE en sección de premios (medallas y "2026").
// - azulDetalle     → texto sobre fondos claros (títulos de modales, h2).
// - verdeExito      → se conserva para indicadores de éxito (bolsa, badge "Guardado").
export const COLORS = {
  primario: '#619B50',
  primarioOscuro: '#4A7D3D',
  acentoCTA: '#CD232C',
  acentoCTAOscuro: '#A11B22',
  dorado: '#FAC775',
  doradoOscuro: '#EF9F27',
  azulDetalle: '#042C53',
  verdeExito: '#1D9E75',
  fondoNeutro: '#F8F9FB',
  blanco: '#FFFFFF',
  textoSobreDorado: '#412402',
};

export const SPONSOR = {
  nombre: 'Estadio Gana',
  logo: '/sponsor/estadio-gana-color.png',
  url: '#', // placeholder hasta tener la URL real
  aporteBolsa: 100000,
};
