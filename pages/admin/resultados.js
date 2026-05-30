import { useState, useEffect } from 'react';
import { COLORS, SPONSOR } from '../../lib/brand';

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

export default function AdminResultados() {
  const [partidos, setPartidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState('todos');
  const [resultados, setResultados] = useState({});
  const [guardando, setGuardando] = useState({});
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  async function cargar() {
    try {
      const r = await fetch('/api/listar-partidos-admin');
      const d = await r.json();
      if (d.exito) {
        setPartidos(d.partidos);
        const r2 = {};
        d.partidos.forEach(p => {
          if (p.goles_local !== null && p.goles_visitante !== null) {
            r2[p.id] = { gl: p.goles_local, gv: p.goles_visitante };
          }
        });
        setResultados(r2);
      }
    } catch (e) { console.error(e); }
    setCargando(false);
  }

  useEffect(() => { cargar(); }, []);
async function borrarResultado(partidoId) {
    if (!confirm('¿Borrar el resultado de este partido?\n\nEsto eliminará los puntos calculados de TODAS las quinielas para este partido y recalculará el ranking.')) return;

    setGuardando({ ...guardando, [partidoId]: true });

    try {
      const res = await fetch('/api/borrar-resultado', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partidoId })
      });
      const d = await res.json();

      if (d.exito) {
        alert(`✓ Resultado borrado. Puntos recalculados.`);
        const nuevos = { ...resultados };
        delete nuevos[partidoId];
        setResultados(nuevos);
        cargar();
      } else {
        alert('Error: ' + d.error);
      }
    } catch (e) {
      alert('Error de conexion');
    }

    setGuardando({ ...guardando, [partidoId]: false });
  }
  async function capturar(partidoId) {
    const r = resultados[partidoId];
    if (!r || r.gl === '' || r.gv === '' || r.gl === undefined || r.gv === undefined) {
      alert('Captura ambos goles antes de guardar');
      return;
    }

    if (!confirm(`Confirmar resultado: ${r.gl} - ${r.gv}?\n\nEsto calculara los puntos de TODAS las quinielas.`)) return;

    setGuardando({ ...guardando, [partidoId]: true });

    try {
      const res = await fetch('/api/capturar-resultado', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partidoId,
          golesLocal: r.gl,
          golesVisitante: r.gv
        })
      });
      const d = await res.json();

      if (d.exito) {
        alert(`✓ ${d.mensaje}`);
        cargar();
      } else {
        alert('Error: ' + d.error);
      }
    } catch (e) {
      alert('Error de conexion');
    }

    setGuardando({ ...guardando, [partidoId]: false });
  }

  function formatearFecha(fechaHora) {
    if (!fechaHora) return 'Por definir';
    const f = new Date(fechaHora);
    const dias = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${dias[f.getDay()]} ${f.getDate()} ${meses[f.getMonth()]} · ${f.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false })}`;
  }

  const partidosFiltrados = partidos.filter(p => {
    if (filtro === 'pendientes') return p.estado !== 'Finalizado';
    if (filtro === 'finalizados') return p.estado === 'Finalizado';
    return true;
  });

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', background: COLORS.fondoNeutro, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />

      <header style={{ background: `linear-gradient(135deg, ${COLORS.primario}, ${COLORS.primarioOscuro})`, color: 'white', padding: '20px 30px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
          <a href="/" style={{ display: 'inline-flex', alignItems: 'center', background: 'white', padding: '6px 12px', borderRadius: 8, textDecoration: 'none', flexShrink: 0 }}>
            <img src={SPONSOR.logo} alt={SPONSOR.nombre} style={{ height: isMobile ? 38 : 48, width: 'auto', display: 'block' }} />
          </a>
          <div style={{ flex: 1 }}>
            <a href="/admin" style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13, textDecoration: 'none' }}>← Panel admin</a>
            <h1 style={{ fontSize: 22, fontWeight: 800, marginTop: 4 }}>⚽ Capturar resultados</h1>
          </div>
          <button onClick={cargar} style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.25)', color: 'white', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>🔄 Refrescar</button>
        </div>
      </header>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: 30, flex: 1, width: '100%', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {[
            ['todos', 'Todos'],
            ['pendientes', 'Pendientes'],
            ['finalizados', 'Finalizados']
          ].map(([key, label]) => (
            <button key={key} onClick={() => setFiltro(key)} style={{
              padding: '10px 18px',
              background: filtro === key ? COLORS.primario : 'white',
              color: filtro === key ? 'white' : '#666',
              border: '1px solid #E0E0E0',
              borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 13
            }}>{label}</button>
          ))}
        </div>

        {cargando ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>Cargando...</div>
        ) : partidosFiltrados.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#888', background: 'white', borderRadius: 14 }}>No hay partidos</div>
        ) : (
          partidosFiltrados.map(p => {
            const finalizado = p.estado === 'Finalizado';
            const r = resultados[p.id] || {};

            return (
              <div key={p.id} style={{
                background: 'white', borderRadius: 14, padding: 18, marginBottom: 10,
                border: finalizado ? `2px solid ${COLORS.verdeExito}` : '1px solid #E0E0E0'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: 12, color: '#888' }}>
                  <span>{p.fase}{p.grupo ? ` · Grupo ${p.grupo}` : ''}</span>
                  <span>{formatearFecha(p.fecha_hora)} {finalizado && '· ✓ Finalizado'}</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr auto', gap: 12, alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{p.local || 'Por definir'}</span>
                    {BANDERAS[p.local] && <img src={`https://flagcdn.com/w40/${BANDERAS[p.local]}.png`} style={{ width: 24, height: 16, borderRadius: 2 }} />}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <input
                      type="number" min="0" max="20"
                      value={r.gl !== undefined ? r.gl : ''}
                      onChange={e => setResultados({ ...resultados, [p.id]: { ...r, gl: e.target.value } })}
                      style={{ width: 50, height: 40, textAlign: 'center', fontSize: 18, fontWeight: 800, border: '2px solid #E0E0E0', borderRadius: 8 }}
                    />
                    <span style={{ fontSize: 16, color: '#888' }}>-</span>
                    <input
                      type="number" min="0" max="20"
                      value={r.gv !== undefined ? r.gv : ''}
                      onChange={e => setResultados({ ...resultados, [p.id]: { ...r, gv: e.target.value } })}
                      style={{ width: 50, height: 40, textAlign: 'center', fontSize: 18, fontWeight: 800, border: '2px solid #E0E0E0', borderRadius: 8 }}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {BANDERAS[p.visitante] && <img src={`https://flagcdn.com/w40/${BANDERAS[p.visitante]}.png`} style={{ width: 24, height: 16, borderRadius: 2 }} />}
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{p.visitante || 'Por definir'}</span>
                  </div>

                 <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <button
                      onClick={() => capturar(p.id)}
                      disabled={guardando[p.id]}
                      style={{
                        padding: '8px 14px',
                        background: finalizado ? '#EF9F27' : COLORS.verdeExito,
                        color: 'white', border: 'none', borderRadius: 8,
                        cursor: 'pointer', fontWeight: 700, fontSize: 12, whiteSpace: 'nowrap'
                      }}
                    >
                      {guardando[p.id] ? '...' : (finalizado ? '✓ Recalcular' : 'Guardar')}
                    </button>
                    {finalizado && (
                      <button
                        onClick={() => borrarResultado(p.id)}
                        disabled={guardando[p.id]}
                        style={{
                          padding: '8px 14px',
                          background: '#FFE5E5',
                          color: '#C62828', border: '1px solid #FFCDD2', borderRadius: 8,
                          cursor: 'pointer', fontWeight: 700, fontSize: 12, whiteSpace: 'nowrap'
                        }}
                      >
                        🗑️ Borrar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <footer style={{ background: `linear-gradient(135deg, ${COLORS.primario}, ${COLORS.primarioOscuro})`, color: 'white', padding: '40px 20px', textAlign: 'center' }}>
        <div style={{ display: 'inline-block', background: 'white', padding: 16, borderRadius: 16, marginBottom: 16 }}>
          <img src={SPONSOR.logo} alt={SPONSOR.nombre} style={{ height: 60, width: 'auto', display: 'block' }} />
        </div>
        <div style={{ fontSize: 13, opacity: 0.9, marginBottom: 6 }}>Patrocinador oficial · {SPONSOR.nombre}</div>
        <div style={{ fontWeight: 700 }}>⚽ Quiniela Estadio Gana</div>
      </footer>
    </div>
  );
}
