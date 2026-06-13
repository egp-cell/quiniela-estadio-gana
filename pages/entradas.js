import { useState, useEffect, useMemo, Fragment } from 'react';
import { useRouter } from 'next/router';
import { COLORS, SPONSOR } from '../lib/brand';

const BANDERAS = {
  'México': 'mx', 'Sudáfrica': 'za', 'Corea del Sur': 'kr', 'Chequia': 'cz',
  'Canada': 'ca', 'Bosnia': 'ba', 'Catar': 'qa', 'Suiza': 'ch',
  'Brasil': 'br', 'Marruecos': 'ma', 'Haití': 'ht', 'Escocia': 'gb-sct',
  'Estados Unidos': 'us', 'Paraguay': 'py', 'Australia': 'au', 'Turquía': 'tr',
  'Alemania': 'de', 'Curazao': 'cw', 'Costa de Marfil': 'ci', 'Ecuador': 'ec',
  'Países Bajos': 'nl', 'Japón': 'jp', 'Suecia': 'se', 'Túnez': 'tn',
  'Bélgica': 'be', 'Irán': 'ir', 'Egipto': 'eg', 'Nueva Zelanda': 'nz',
  'España': 'es', 'Uruguay': 'uy', 'Arabia Saudita': 'sa', 'Cabo Verde': 'cv',
  'Francia': 'fr', 'Senegal': 'sn', 'Noruega': 'no', 'Irak': 'iq',
  'Argentina': 'ar', 'Austria': 'at', 'Argelia': 'dz', 'Jordania': 'jo',
  'Portugal': 'pt', 'Colombia': 'co', 'Uzbekistán': 'uz', 'RD Congo': 'cd',
  'Inglaterra': 'gb-eng', 'Croacia': 'hr', 'Ghana': 'gh', 'Panamá': 'pa'
};

const COL_PRIMERA = 200;   // ancho de la columna fija "Entrada"
const COL_PARTIDO = 78;    // ancho de cada columna de partido

export default function Entradas() {
  const router = useRouter();
  const [logueado, setLogueado] = useState(null);
  const [data, setData] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [tick, setTick] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Sesión: si no hay, manda a /jugar
  useEffect(() => {
    const sesion = sessionStorage.getItem('quiniela_sesion');
    if (!sesion) {
      router.push('/jugar');
      return;
    }
    try { setLogueado(JSON.parse(sesion)); }
    catch (e) { router.push('/jugar'); }
  }, []);

  async function cargar() {
    try {
      const r = await fetch('/api/entradas');
      const d = await r.json();
      if (d.exito) setData(d);
    } catch (e) { console.error(e); }
    setCargando(false);
  }

  useEffect(() => {
    if (!logueado) return;
    cargar();
    // Polling cada 60s para refrescar pronósticos/resultados
    const poll = setInterval(cargar, 60000);
    // Tick cada 30s solo para revaluar "ahora" y abrir columnas al inicio
    const t = setInterval(() => setTick(x => x + 1), 30000);
    return () => { clearInterval(poll); clearInterval(t); };
  }, [logueado]);

  function logout() {
    sessionStorage.removeItem('quiniela_sesion');
    router.push('/jugar');
  }

  // ─────────────────────────────────────────────────────────────────
  // Cálculos derivados (índices y orden de filas)
  // ─────────────────────────────────────────────────────────────────
  const ahora = useMemo(() => new Date(), [tick, data]);

  const partidos = (data && data.partidos) || [];
  const quinielas = (data && data.quinielas) || [];

  // Set de IDs de partidos que YA iniciaron (según hora local del cliente).
  // Comparación con Date.getTime() — string ISO comparison falla cuando los
  // formatos difieren (+00:00 vs Z).
  const partidosIniciados = useMemo(() => {
    const ahoraMs = ahora.getTime();
    return new Set(partidos.filter(p => {
      if (!p.fecha_hora) return false;
      const t = new Date(p.fecha_hora).getTime();
      return !isNaN(t) && t <= ahoraMs;
    }).map(p => p.id));
  }, [partidos, ahora]);

  // pron[quinielaId][partidoId] = { gl, gv }
  const pronMap = useMemo(() => {
    const m = {};
    ((data && data.pronosticos) || []).forEach(p => {
      if (!m[p.quiniela_id]) m[p.quiniela_id] = {};
      m[p.quiniela_id][p.partido_id] = { gl: p.goles_local, gv: p.goles_visitante };
    });
    return m;
  }, [data]);

  // Filas ordenadas: primero las del usuario logueado (alfabético), luego el resto
  const filas = useMemo(() => {
    if (!logueado) return [];
    const cmp = (a, b) => (a.nombre || '').localeCompare((b.nombre || ''), 'es');
    const mias = quinielas.filter(q => q.usuario_id === logueado.id).sort(cmp);
    const otras = quinielas.filter(q => q.usuario_id !== logueado.id).sort(cmp);
    return [...mias, ...otras];
  }, [quinielas, logueado]);

  // Tema visual de cada celda según estado + comparación con resultado
  function estiloCelda(quinielaId, p) {
    if (!partidosIniciados.has(p.id)) {
      return { bg: '#FAFBFC', text: '🔒', color: '#BBB', fontSize: 14, weight: 400 };
    }
    const pr = pronMap[quinielaId] && pronMap[quinielaId][p.id];
    if (!pr) {
      return { bg: '#F4F5F7', text: '—', color: '#999', fontSize: 12, weight: 600 };
    }
    const txt = `${pr.gl}-${pr.gv}`;
    const tieneRes = p.goles_local !== null && p.goles_local !== undefined &&
                     p.goles_visitante !== null && p.goles_visitante !== undefined;
    if (!tieneRes) {
      // Iniciado pero sin marcador todavía: muestra el pronóstico en gris
      return { bg: '#F8F9FB', text: txt, color: '#666', fontSize: 12, weight: 700 };
    }
    const exacto = pr.gl === p.goles_local && pr.gv === p.goles_visitante;
    if (exacto) {
      return { bg: COLORS.dorado, text: txt, color: COLORS.azulDetalle, fontSize: 12, weight: 800 };
    }
    const resReal = p.goles_local > p.goles_visitante ? 'L' : (p.goles_local < p.goles_visitante ? 'V' : 'E');
    const resPron = pr.gl > pr.gv ? 'L' : (pr.gl < pr.gv ? 'V' : 'E');
    if (resReal === resPron) {
      return { bg: '#D6EFE0', text: txt, color: '#0F5D2F', fontSize: 12, weight: 700 };
    }
    return { bg: '#FAD8DA', text: txt, color: '#7B1E22', fontSize: 12, weight: 700 };
  }

  // ─────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────

  if (!logueado || cargando || !data) {
    return (
      <div style={{ fontFamily: 'Inter, system-ui, sans-serif', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
        Cargando entradas...
      </div>
    );
  }

  const formatFecha = (iso) => {
    if (!iso) return 'Por definir';
    const d = new Date(iso);
    return d.toLocaleString('es-MX', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
      timeZone: 'America/Mexico_City'
    });
  };

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', background: COLORS.fondoNeutro, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />

      <header style={{ background: `linear-gradient(135deg, ${COLORS.primario}, ${COLORS.primarioOscuro})`, color: 'white', padding: isMobile ? '14px 14px' : '20px 30px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: isMobile ? 8 : 16 }}>
          <a href="/" style={{ display: 'inline-flex', alignItems: 'center', background: 'white', padding: '6px 12px', borderRadius: 8, textDecoration: 'none', flexShrink: 0 }}>
            <img src={SPONSOR.logo} alt={SPONSOR.nombre} style={{ height: isMobile ? 38 : 48, width: 'auto', display: 'block' }} />
          </a>
          <div style={{ flex: 1, minWidth: 0 }}>
            <a href="/jugar" style={{ color: 'rgba(255,255,255,0.9)', fontSize: isMobile ? 11 : 13, textDecoration: 'none' }}>← {isMobile ? 'Volver' : 'Mis quinielas'}</a>
            <h1 style={{ fontSize: isMobile ? 16 : 22, fontWeight: 800, marginTop: 4 }}>🎟️ Entradas</h1>
            <div style={{ fontSize: isMobile ? 11 : 12, opacity: 0.9, marginTop: 2 }}>
              {quinielas.length} entradas · {partidosIniciados.size} de {partidos.length} partidos iniciados
            </div>
          </div>
          <a href="/tabla" style={{ padding: isMobile ? '6px 10px' : '8px 16px', background: COLORS.acentoCTA, color: 'white', borderRadius: 8, textDecoration: 'none', fontWeight: 700, fontSize: isMobile ? 11 : 13, whiteSpace: 'nowrap', flexShrink: 0 }}>🏆 {isMobile ? 'Tabla' : 'Tabla'}</a>
          <button onClick={logout} style={{ padding: isMobile ? '6px 10px' : '8px 16px', background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.25)', color: 'white', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: isMobile ? 12 : 14, whiteSpace: 'nowrap', flexShrink: 0 }}>Salir</button>
        </div>
      </header>

      {/* Leyenda */}
      <div style={{ background: 'white', borderBottom: '1px solid #E0E0E0', padding: isMobile ? '8px 12px' : '12px 20px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 12, color: '#555', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, color: COLORS.azulDetalle }}>Leyenda:</span>
          <span><span style={{ display: 'inline-block', width: 14, height: 14, background: COLORS.dorado, borderRadius: 3, verticalAlign: 'middle', marginRight: 4 }}/> Exacto</span>
          <span><span style={{ display: 'inline-block', width: 14, height: 14, background: '#D6EFE0', borderRadius: 3, verticalAlign: 'middle', marginRight: 4 }}/> Resultado</span>
          <span><span style={{ display: 'inline-block', width: 14, height: 14, background: '#FAD8DA', borderRadius: 3, verticalAlign: 'middle', marginRight: 4 }}/> Falló</span>
          <span>🔒 Por iniciar</span>
          <span>— Sin pronóstico</span>
        </div>
      </div>

      {/* Grid */}
      <div style={{ flex: 1, padding: isMobile ? 8 : 16, maxWidth: 1400, margin: '0 auto', width: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>
        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E0E0E0', overflow: 'auto', maxHeight: isMobile ? 'calc(100vh - 240px)' : 'calc(100vh - 260px)', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ borderCollapse: 'separate', borderSpacing: 0, fontSize: 12 }}>
            <thead>
              <tr>
                <th style={{
                  position: 'sticky', top: 0, left: 0, zIndex: 5,
                  background: COLORS.fondoNeutro, padding: '10px 12px', textAlign: 'left',
                  borderRight: '2px solid #E0E0E0', borderBottom: '1px solid #E0E0E0',
                  fontSize: 11, color: '#666', textTransform: 'uppercase', fontWeight: 700,
                  minWidth: COL_PRIMERA, width: COL_PRIMERA
                }}>
                  Entrada
                </th>
                {partidos.map(p => (
                  <th key={p.id} style={{
                    position: 'sticky', top: 0, zIndex: 4,
                    background: COLORS.fondoNeutro, padding: '6px 4px', textAlign: 'center',
                    borderRight: '1px solid #F0F2F5', borderBottom: '1px solid #E0E0E0',
                    minWidth: COL_PARTIDO, width: COL_PARTIDO, verticalAlign: 'top'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3, justifyContent: 'center' }}>
                      {BANDERAS[p.local]
                        ? <img src={`https://flagcdn.com/w40/${BANDERAS[p.local]}.png`} style={{ width: 18, height: 12, borderRadius: 1, display: 'block' }} alt={p.local} />
                        : <span style={{ fontSize: 9, fontWeight: 700, color: '#444' }}>{(p.local || '?').slice(0,3).toUpperCase()}</span>}
                      <span style={{ fontSize: 9, color: '#888' }}>vs</span>
                      {BANDERAS[p.visitante]
                        ? <img src={`https://flagcdn.com/w40/${BANDERAS[p.visitante]}.png`} style={{ width: 18, height: 12, borderRadius: 1, display: 'block' }} alt={p.visitante} />
                        : <span style={{ fontSize: 9, fontWeight: 700, color: '#444' }}>{(p.visitante || '?').slice(0,3).toUpperCase()}</span>}
                    </div>
                    <div style={{ fontSize: 9, color: '#999', marginTop: 3, whiteSpace: 'nowrap' }}>
                      {formatFecha(p.fecha_hora)}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filas.length === 0 ? (
                <tr>
                  <td colSpan={partidos.length + 1} style={{ padding: 40, textAlign: 'center', color: '#888' }}>
                    Aún no hay entradas activas
                  </td>
                </tr>
              ) : filas.map(q => {
                const esMia = q.usuario_id === logueado.id;
                const bgFila = esMia ? '#FFF9E6' : 'white';
                return (
                  <tr key={q.id}>
                    <th scope="row" style={{
                      position: 'sticky', left: 0, zIndex: 2,
                      background: bgFila, padding: '8px 12px', textAlign: 'left',
                      borderRight: '2px solid #E0E0E0', borderBottom: '1px solid #F0F2F5',
                      borderLeft: esMia ? `4px solid ${COLORS.dorado}` : '4px solid transparent',
                      minWidth: COL_PRIMERA, width: COL_PRIMERA, fontWeight: esMia ? 700 : 500,
                      color: COLORS.azulDetalle, fontSize: 13
                    }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.nombre}</span>
                        {esMia && (
                          <span style={{ padding: '1px 6px', background: COLORS.dorado, color: COLORS.azulDetalle, borderRadius: 8, fontSize: 9, fontWeight: 800, letterSpacing: 0.5, flexShrink: 0 }}>TÚ</span>
                        )}
                      </div>
                    </th>
                    {partidos.map(p => {
                      const c = estiloCelda(q.id, p);
                      return (
                        <td key={p.id} style={{
                          background: c.bg,
                          borderRight: '1px solid #F0F2F5',
                          borderBottom: '1px solid #F0F2F5',
                          padding: '6px 4px', textAlign: 'center',
                          fontSize: c.fontSize, fontWeight: c.weight, color: c.color,
                          minWidth: COL_PARTIDO, width: COL_PARTIDO, height: 36
                        }}>
                          {c.text}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: 10, fontSize: 11, color: '#888', textAlign: 'center' }}>
          🔒 Los pronósticos de cada partido se revelan al inicio del mismo. Actualización automática cada minuto.
        </div>
      </div>

      <footer style={{ background: `linear-gradient(135deg, ${COLORS.primario}, ${COLORS.primarioOscuro})`, color: 'white', padding: '20px', textAlign: 'center', fontSize: 12 }}>
        Patrocinador oficial · {SPONSOR.nombre} · ⚽ Quiniela Estadio Gana
      </footer>
    </div>
  );
}
