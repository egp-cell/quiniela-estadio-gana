import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
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

export default function PronosticosQuiniela() {
  const router = useRouter();
  const { id } = router.query;

  const [data, setData] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [diaActivo, setDiaActivo] = useState(null);
  const [guardando, setGuardando] = useState({});
  const [pronosticos, setPronosticos] = useState({});
  const [logueado, setLogueado] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    const sesion = sessionStorage.getItem('quiniela_sesion');
    if (!sesion) {
      router.push('/jugar');
      return;
    }
    setLogueado(JSON.parse(sesion));
  }, []);

  useEffect(() => {
    if (!id || !logueado) return;
    cargarDatos();
  }, [id, logueado]);

  async function cargarDatos() {
    try {
      const r = await fetch(`/api/partidos?quinielaId=${id}`);
      const d = await r.json();
      if (d.exito) {
        // Verificar que esta quiniela sea del usuario logueado
        if (d.quiniela && d.quiniela.usuario_id !== logueado.id) {
          alert('Esta quiniela no es tuya');
          router.push('/jugar');
          return;
        }
        setData(d);
        setPronosticos(d.pronosticos);

        // Set primer día con partidos como activo
        const dias = agruparPorDia(d.partidos);
        const primerDia = Object.keys(dias)[0];
        if (primerDia) setDiaActivo(primerDia);
      }
    } catch (e) {
      console.error(e);
    }
    setCargando(false);
  }

  function agruparPorDia(partidos) {
    const grupos = {};
    partidos.forEach(p => {
      let claveDia;
      if (!p.fecha_hora) {
        claveDia = 'zzz_Por definir'; // prefijo para que quede al final
      } else {
        const fecha = new Date(p.fecha_hora);
        // Usar hora local de México para agrupar
        const offset = -6 * 60; // CDMX UTC-6 en minutos
        const fechaMx = new Date(fecha.getTime() + offset * 60 * 1000);
        claveDia = fechaMx.toISOString().split('T')[0];
      }
      if (!grupos[claveDia]) grupos[claveDia] = [];
      grupos[claveDia].push(p);
    });

    // Ordenar partidos dentro de cada día por hora ascendente
    Object.keys(grupos).forEach(dia => {
      grupos[dia].sort((a, b) => {
        if (!a.fecha_hora) return 1;
        if (!b.fecha_hora) return -1;
        return new Date(a.fecha_hora).getTime() - new Date(b.fecha_hora).getTime();
      });
    });

    // Re-ordenar las claves: días con fecha primero, "Por definir" al final
    const ordenado = {};
    const claves = Object.keys(grupos).sort();
    claves.forEach(k => {
      const claveLimpia = k.replace('zzz_', '');
      ordenado[claveLimpia] = grupos[k];
    });

    return ordenado;
  }

  function formatearDia(claveDia) {
    if (claveDia === 'Por definir') return 'Por definir';
    const fecha = new Date(claveDia + 'T12:00:00');
    const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${dias[fecha.getDay()]} ${fecha.getDate()} ${meses[fecha.getMonth()]}`;
  }

  function formatearHora(fechaHora) {
    if (!fechaHora) return '';
    const f = new Date(fechaHora);
    return f.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false });
  }

  function partidoEmpezado(fechaHora) {
    if (!fechaHora) return false;
    return new Date() >= new Date(fechaHora);
  }

  async function guardarPronostico(partidoId, golesLocal, golesVisitante) {
    const key = `${partidoId}`;
    setGuardando({ ...guardando, [key]: 'guardando' });

    try {
      const r = await fetch('/api/pronosticar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quinielaId: parseInt(id),
          partidoId,
          golesLocal,
          golesVisitante
        })
      });
      const d = await r.json();

      if (d.exito) {
        setGuardando({ ...guardando, [key]: 'guardado' });
        setTimeout(() => {
          setGuardando(prev => {
            const nuevo = { ...prev };
            delete nuevo[key];
            return nuevo;
          });
        }, 1500);
      } else {
        setGuardando({ ...guardando, [key]: 'error' });
        alert('Error: ' + d.error);
      }
    } catch (e) {
      setGuardando({ ...guardando, [key]: 'error' });
    }
  }

  function cambiarPronostico(partidoId, lado, valor) {
    const actual = pronosticos[partidoId] || {};
    const nuevo = { ...actual };
    if (lado === 'local') nuevo.goles_local = valor;
    else nuevo.goles_visitante = valor;

    setPronosticos({ ...pronosticos, [partidoId]: nuevo });

    // Solo guardar si ambos campos tienen valor
    if (nuevo.goles_local !== undefined && nuevo.goles_local !== '' && nuevo.goles_visitante !== undefined && nuevo.goles_visitante !== '') {
      // Debounce: esperar 800ms después del último cambio
      clearTimeout(window[`debounce_${partidoId}`]);
      window[`debounce_${partidoId}`] = setTimeout(() => {
        guardarPronostico(partidoId, nuevo.goles_local, nuevo.goles_visitante);
      }, 800);
    }
  }

  function logout() {
    sessionStorage.removeItem('quiniela_sesion');
    router.push('/jugar');
  }

  if (cargando || !data) {
    return (
      <div style={{ fontFamily: 'Inter, system-ui, sans-serif', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        Cargando...
      </div>
    );
  }

  const dias = agruparPorDia(data.partidos);
  const clavesDias = Object.keys(dias);
  const partidosDelDia = diaActivo ? dias[diaActivo] || [] : [];
  const totalPronosticados = Object.keys(pronosticos).filter(k => pronosticos[k] && pronosticos[k].goles_local !== undefined).length;

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', background: COLORS.fondoNeutro, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />

      <header style={{ background: `linear-gradient(135deg, ${COLORS.primario}, ${COLORS.primarioOscuro})`, color: 'white', padding: isMobile ? '14px 14px' : '20px 30px', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: isMobile ? 10 : 16 }}>
          <a href="/" style={{ display: 'inline-flex', alignItems: 'center', background: 'white', padding: '6px 12px', borderRadius: 8, textDecoration: 'none', flexShrink: 0 }}>
            <img src={SPONSOR.logo} alt={SPONSOR.nombre} style={{ height: isMobile ? 38 : 48, width: 'auto', display: 'block' }} />
          </a>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
              <a href="/jugar" style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13, textDecoration: 'none', whiteSpace: 'nowrap' }}>← {isMobile ? 'Volver' : 'Mis quinielas'}</a>
              <a href="/tabla" style={{ padding: isMobile ? '6px 12px' : '10px 20px', background: COLORS.acentoCTA, color: 'white', borderRadius: 10, textDecoration: 'none', fontWeight: 800, fontSize: isMobile ? 12 : 14, boxShadow: '0 3px 10px rgba(205,35,44,0.4)', whiteSpace: 'nowrap' }}>🏆 {isMobile ? 'Tabla' : 'Ver Tabla'}</a>
            </div>
            <h1 style={{ fontSize: isMobile ? 16 : 22, fontWeight: 800, marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{data.quiniela?.nombre || 'Quiniela'}</h1>
            <div style={{ fontSize: isMobile ? 11 : 13, opacity: 0.9, marginTop: 2 }}>
              {totalPronosticados} de {data.partidos.length} partidos pronosticados
            </div>
          </div>
          <button onClick={logout} style={{ padding: isMobile ? '6px 12px' : '8px 16px', background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.25)', color: 'white', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: isMobile ? 12 : 14, whiteSpace: 'nowrap' }}>Salir</button>
        </div>
      </header>

      {/* Tabs de días */}
      <div style={{ background: 'white', borderBottom: '1px solid #E0E0E0', overflowX: 'auto', position: 'sticky', top: 90, zIndex: 50 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', gap: 4, padding: '12px 16px' }}>
          {clavesDias.map(clave => {
            const partidosDia = dias[clave];
            const pronosticadosDia = partidosDia.filter(p => pronosticos[p.id] && pronosticos[p.id].goles_local !== undefined).length;
            const completo = pronosticadosDia === partidosDia.length;
            return (
              <button
                key={clave}
                onClick={() => setDiaActivo(clave)}
                style={{
                  padding: '10px 16px',
                  background: diaActivo === clave ? COLORS.primario : '#F0F2F5',
                  color: diaActivo === clave ? 'white' : '#666',
                  border: 'none',
                  borderRadius: 10,
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: 13,
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                {formatearDia(clave)}
                <span style={{
                  fontSize: 11,
                  padding: '2px 6px',
                  background: completo ? COLORS.verdeExito : (diaActivo === clave ? 'rgba(255,255,255,0.25)' : '#E0E0E0'),
                  color: completo ? 'white' : (diaActivo === clave ? 'white' : '#888'),
                  borderRadius: 6
                }}>
                  {pronosticadosDia}/{partidosDia.length}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: isMobile ? '20px 12px' : '30px 20px', flex: 1, width: '100%', boxSizing: 'border-box' }}>
        {partidosDelDia.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#888', padding: 40 }}>No hay partidos en este día</div>
        ) : (
          partidosDelDia.map(p => {
            const empezado = partidoEmpezado(p.fecha_hora);
            const pron = pronosticos[p.id] || {};
            const estadoGuardado = guardando[p.id];

            return (
              <div key={p.id} style={{
                background: 'white',
                borderRadius: 14,
                padding: isMobile ? 14 : 20,
                marginBottom: 12,
                border: '1px solid #E0E0E0',
                opacity: empezado ? 0.6 : 1
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14, fontSize: 12, color: '#888' }}>
                  <span>{p.fase}{p.grupo ? ` · Grupo ${p.grupo}` : ''}</span>
                  <span>{formatearHora(p.fecha_hora)}{empezado ? ' · 🔒' : ''}</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr auto 1fr' : '1fr auto 1fr', gap: isMobile ? 6 : 12, alignItems: 'center' }}>
                  {/* Local */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 6 : 10, justifyContent: 'flex-end', minWidth: 0 }}>
                    <span style={{ fontWeight: 600, textAlign: 'right', fontSize: isMobile ? 12 : 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.local}</span>
                    {BANDERAS[p.local] && <img src={`https://flagcdn.com/w80/${BANDERAS[p.local]}.png`} style={{ width: isMobile ? 24 : 32, height: isMobile ? 16 : 22, borderRadius: 3, flexShrink: 0 }} />}
                  </div>

                  {/* Inputs */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 4 : 6 }}>
                    <input
                      type="number"
                      min="0"
                      max="20"
                      disabled={empezado}
                      value={pron.goles_local !== undefined ? pron.goles_local : ''}
                      onChange={e => cambiarPronostico(p.id, 'local', e.target.value)}
                      style={{
                        width: isMobile ? 42 : 50,
                        height: isMobile ? 42 : 50,
                        textAlign: 'center',
                        fontSize: isMobile ? 18 : 22,
                        fontWeight: 800,
                        border: '2px solid ' + (estadoGuardado === 'guardado' ? COLORS.verdeExito : estadoGuardado === 'error' ? '#E04444' : '#E0E0E0'),
                        borderRadius: 10,
                        background: empezado ? '#F0F2F5' : 'white',
                        padding: 0,
                        boxSizing: 'border-box'
                      }}
                    />
                    <span style={{ fontSize: 16, fontWeight: 700, color: '#888' }}>-</span>
                    <input
                      type="number"
                      min="0"
                      max="20"
                      disabled={empezado}
                      value={pron.goles_visitante !== undefined ? pron.goles_visitante : ''}
                      onChange={e => cambiarPronostico(p.id, 'visitante', e.target.value)}
                      style={{
                        width: isMobile ? 42 : 50,
                        height: isMobile ? 42 : 50,
                        textAlign: 'center',
                        fontSize: isMobile ? 18 : 22,
                        fontWeight: 800,
                        border: '2px solid ' + (estadoGuardado === 'guardado' ? COLORS.verdeExito : estadoGuardado === 'error' ? '#E04444' : '#E0E0E0'),
                        borderRadius: 10,
                        background: empezado ? '#F0F2F5' : 'white',
                        padding: 0,
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  {/* Visitante */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 6 : 10, minWidth: 0 }}>
                    {BANDERAS[p.visitante] && <img src={`https://flagcdn.com/w80/${BANDERAS[p.visitante]}.png`} style={{ width: isMobile ? 24 : 32, height: isMobile ? 16 : 22, borderRadius: 3, flexShrink: 0 }} />}
                    <span style={{ fontWeight: 600, fontSize: isMobile ? 12 : 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.visitante}</span>
                  </div>
                </div>

                {estadoGuardado && (
                  <div style={{ textAlign: 'center', marginTop: 10, fontSize: 11, fontWeight: 600, color: estadoGuardado === 'guardado' ? COLORS.verdeExito : estadoGuardado === 'error' ? '#E04444' : '#888' }}>
                    {estadoGuardado === 'guardando' && '💾 Guardando...'}
                    {estadoGuardado === 'guardado' && '✓ Guardado'}
                    {estadoGuardado === 'error' && '✕ Error'}
                  </div>
                )}
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
