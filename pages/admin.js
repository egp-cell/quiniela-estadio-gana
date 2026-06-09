import { useState, useEffect } from 'react';
import { COLORS, SPONSOR } from '../lib/brand';

export default function Admin() {
  const [data, setData] = useState({ stats: { registrados: 0, pendientes: 0, activos: 0, recaudado: 0 }, usuarios: [] });
  const [tab, setTab] = useState('Pendiente_Pago');
  const [busqueda, setBusqueda] = useState('');
  const [accesos, setAccesos] = useState(null);
  const [verAccesos, setVerAccesos] = useState(null);
  const [aprobarModal, setAprobarModal] = useState(null);
  const [pronosticosModal, setPronosticosModal] = useState(null);
  const [cargandoPron, setCargandoPron] = useState(false);
  const [cantidadAprobar, setCantidadAprobar] = useState(1);
  const [cargando, setCargando] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  async function cargar() {
    try {
      const r = await fetch('/api/admin');
      const d = await r.json();
      if (d.exito) setData(d);
    } catch (e) { console.error(e); }
    setCargando(false);
  }

  useEffect(() => {
    cargar();
    const t = setInterval(cargar, 30000);
    return () => clearInterval(t);
  }, []);

  function abrirAprobar(u) {
    setAprobarModal(u);
    setCantidadAprobar(u.cantidad_quinielas);
  }

  async function confirmarAprobar() {
    if (!aprobarModal) return;
    const r = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accion: 'aprobar',
        usuarioId: aprobarModal.id,
        cantidadAprobada: cantidadAprobar
      })
    });
    const d = await r.json();
    if (d.exito) {
      setAprobarModal(null);
      setAccesos(d);
      cargar();
    } else {
      alert('Error: ' + d.error);
    }
  }

  async function rechazar(id) {
    if (!confirm('¿Rechazar este pago?')) return;
    const r = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accion: 'rechazar', usuarioId: id })
    });
    const d = await r.json();
    if (d.exito) cargar();
  }

  async function eliminar(id, nombre) {
    if (!confirm(`ELIMINAR PERMANENTEMENTE a ${nombre}?\n\nEsto borrará:\n- El usuario\n- Sus quinielas\n- Sus pronósticos\n- Sus pagos\n\nEsta acción NO se puede deshacer.`)) return;
    const r = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accion: 'eliminar', usuarioId: id })
    });
    const d = await r.json();
    if (d.exito) {
      alert('Usuario eliminado');
      cargar();
    } else {
      alert('Error: ' + d.error);
    }
  }

  async function toggleCortesia(u) {
    const mensaje = u.es_cortesia
      ? `¿Quitar cortesía de ${u.nombre}? Esta quiniela volverá a contar en la bolsa.`
      : `¿Marcar como cortesía? Esta quiniela NO se contará en la bolsa pero sigue participando en el ranking.`;
    if (!confirm(mensaje)) return;
    const r = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accion: 'toggle_cortesia', usuarioId: u.id })
    });
    const d = await r.json();
    if (d.exito) cargar();
    else alert('Error: ' + d.error);
  }

  async function verPronosticos(u) {
    setCargandoPron(true);
    setPronosticosModal({ cargando: true, usuario: u });
    try {
      const r = await fetch(`/api/admin-pronosticos?usuarioId=${u.id}`);
      const d = await r.json();
      if (d.exito) {
        setPronosticosModal({ ...d });
      } else {
        alert('Error: ' + d.error);
        setPronosticosModal(null);
      }
    } catch (e) {
      alert('Error de conexión');
      setPronosticosModal(null);
    }
    setCargandoPron(false);
  }

  const filtrados = data.usuarios
    .filter(u => tab === 'Todos' ? true : u.estado === tab)
    .filter(u => {
      const q = busqueda.trim().toLowerCase();
      if (!q) return true;
      return (
        (u.nombre || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.usuario || '').toLowerCase().includes(q) ||
        String(u.telefono || '').includes(q)
      );
    });

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', background: COLORS.fondoNeutro, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />

      <header style={{ background: `linear-gradient(135deg, ${COLORS.primario}, ${COLORS.primarioOscuro})`, color: 'white', padding: '20px 30px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
          <a href="/" style={{ display: 'inline-flex', alignItems: 'center', background: 'white', padding: '6px 12px', borderRadius: 8, textDecoration: 'none', flexShrink: 0 }}>
            <img src={SPONSOR.logo} alt={SPONSOR.nombre} style={{ height: isMobile ? 38 : 48, width: 'auto', display: 'block' }} />
          </a>
          <h1 style={{ fontSize: 22, fontWeight: 800, flex: 1 }}>⚙️ Panel Admin · Quiniela Estadio Gana</h1>
          <div style={{ display: 'flex', gap: 8 }}>
            <a href="/api/admin-exportar-pronosticos" style={{ padding: '8px 16px', background: COLORS.azulDetalle, color: 'white', borderRadius: 8, textDecoration: 'none', fontWeight: 700, fontSize: 13 }}>📥 Descargar pronósticos</a>
            <a href="/admin/resultados" style={{ padding: '8px 16px', background: COLORS.acentoCTA, color: 'white', borderRadius: 8, textDecoration: 'none', fontWeight: 700, fontSize: 13 }}>⚽ Capturar resultados</a>
            <button onClick={cargar} style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.25)', color: 'white', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>🔄 Refrescar</button>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: 30, flex: 1, width: '100%', boxSizing: 'border-box' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 30 }}>
          {[
            ['Registrados', data.stats.registrados, COLORS.azulDetalle],
            ['Pendientes', data.stats.pendientes, '#EF9F27'],
            ['Activos', data.stats.activos, COLORS.verdeExito],
            ['Recaudado', '$' + (data.stats.recaudado || 0).toLocaleString(), COLORS.primario]
          ].map(([t, v, c], i) => (
            <div key={i} style={{ background: 'white', padding: 24, borderRadius: 14, border: '1px solid #E0E0E0' }}>
              <div style={{ fontSize: 11, color: '#888', letterSpacing: 1.5, fontWeight: 600 }}>{t.toUpperCase()}</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: c, marginTop: 6 }}>{v}</div>
            </div>
          ))}
        </div>

        <input
          type="text"
          placeholder="🔍 Buscar por nombre, email, username o teléfono..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          style={{ width: '100%', padding: 14, border: '1px solid #E0E0E0', borderRadius: 12, fontSize: 14, marginBottom: 16, boxSizing: 'border-box', background: 'white' }}
        />

        <div style={{ background: 'white', borderRadius: 14, border: '1px solid #E0E0E0', overflow: 'hidden' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid #E0E0E0' }}>
            {[
              ['Pendiente_Pago', 'Pendientes'],
              ['Activo', 'Activos'],
              ['Todos', 'Todos']
            ].map(([key, label]) => (
              <button key={key} onClick={() => setTab(key)} style={{
                flex: 1, padding: 16, background: tab === key ? COLORS.primario : 'white',
                color: tab === key ? 'white' : '#666', border: 'none', cursor: 'pointer',
                fontWeight: 700, fontSize: 14
              }}>{label}</button>
            ))}
          </div>

          {cargando ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>Cargando...</div>
          ) : filtrados.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>No hay usuarios en esta categoría</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: COLORS.fondoNeutro }}>
                  <th style={{ padding: 12, textAlign: 'left', fontSize: 12, color: '#666', textTransform: 'uppercase' }}>Nombre</th>
                  <th style={{ padding: 12, textAlign: 'left', fontSize: 12, color: '#666', textTransform: 'uppercase' }}>Email</th>
                  <th style={{ padding: 12, textAlign: 'left', fontSize: 12, color: '#666', textTransform: 'uppercase' }}>WhatsApp</th>
                  <th style={{ padding: 12, textAlign: 'center', fontSize: 12, color: '#666', textTransform: 'uppercase' }}>Quinielas</th>
                  <th style={{ padding: 12, textAlign: 'right', fontSize: 12, color: '#666', textTransform: 'uppercase' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map(u => (
                  <tr key={u.id} style={{ borderTop: '1px solid #F0F2F5' }}>
                    <td style={{ padding: 14, fontWeight: 600 }}>
                      {u.nombre}
                      {u.es_cortesia && (
                        <span style={{ marginLeft: 8, padding: '2px 8px', background: '#FFF3E0', color: '#854F0B', borderRadius: 10, fontSize: 10, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                          🎁 Cortesía
                        </span>
                      )}
                    </td>
                    <td style={{ padding: 14, fontSize: 13, color: '#666' }}>{u.email}</td>
                    <td style={{ padding: 14, fontSize: 13, color: '#666' }}>
                      <a href={`https://wa.me/52${u.telefono}`} target="_blank" rel="noreferrer" style={{ color: '#25D366', textDecoration: 'none' }}>{u.telefono}</a>
                    </td>
                    <td style={{ padding: 14, textAlign: 'center' }}>
                      <div style={{ fontWeight: 700 }}>{u.cantidad_quinielas}</div>
                      {u.estado === 'Activo' && (
                        <div style={{ fontSize: 11, marginTop: 2, color: u.es_cortesia ? '#EF9F27' : '#888', fontWeight: 600 }}>
                          {u.es_cortesia ? '🎁 Cortesía' : `$${((u.cantidad_quinielas || 0) * 3000).toLocaleString()} MXN`}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: 14, textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {u.estado === 'Pendiente_Pago' && (
                        <>
                          <button onClick={() => abrirAprobar(u)} style={{ padding: '6px 12px', background: COLORS.verdeExito, color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', marginRight: 6, fontWeight: 600, fontSize: 12 }}>✓ Aprobar</button>
                          <button onClick={() => rechazar(u.id)} style={{ padding: '6px 12px', background: '#E04444', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', marginRight: 6, fontWeight: 600, fontSize: 12 }}>✕ Rechazar</button>
                        </>
                      )}
                      {u.estado === 'Activo' && (
                        <>
                          <button onClick={() => setVerAccesos(u)} style={{ padding: '6px 12px', background: COLORS.primario, color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', marginRight: 6, fontWeight: 600, fontSize: 12 }}>🔑 Ver accesos</button>
                          <button onClick={() => verPronosticos(u)} style={{ padding: '6px 12px', background: COLORS.azulDetalle, color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', marginRight: 6, fontWeight: 600, fontSize: 12 }}>👁 Pronósticos</button>
                          <button onClick={() => toggleCortesia(u)} style={{
                            padding: '6px 12px',
                            background: u.es_cortesia ? '#EF9F27' : '#F0F2F5',
                            color: u.es_cortesia ? 'white' : '#666',
                            border: u.es_cortesia ? 'none' : '1px solid #E0E0E0',
                            borderRadius: 6, cursor: 'pointer', marginRight: 6, fontWeight: 600, fontSize: 12
                          }}>
                            {u.es_cortesia ? '✓ Cortesía activa' : '🎁 Marcar cortesía'}
                          </button>
                        </>
                      )}
                      <button onClick={() => eliminar(u.id, u.nombre)} style={{ padding: '6px 10px', background: '#1A1A1A', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 12 }} title="Eliminar permanentemente">🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {aprobarModal && (
        <div onClick={() => setAprobarModal(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: 20, maxWidth: 500, width: '100%', padding: 36 }}>
            <div style={{ fontSize: 48, color: COLORS.verdeExito, textAlign: 'center', marginBottom: 12 }}>✓</div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: COLORS.azulDetalle, textAlign: 'center', marginBottom: 8 }}>Aprobar inscripción</h2>
            <p style={{ color: '#666', textAlign: 'center', marginBottom: 8, fontSize: 14 }}>{aprobarModal.nombre} se inscribió con</p>
            <p style={{ color: COLORS.azulDetalle, textAlign: 'center', marginBottom: 24, fontSize: 18, fontWeight: 800 }}>{aprobarModal.cantidad_quinielas} {aprobarModal.cantidad_quinielas === 1 ? 'quiniela' : 'quinielas'}</p>

            <div style={{ background: COLORS.fondoNeutro, padding: 20, borderRadius: 14, marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: '#888', textTransform: 'uppercase', fontWeight: 600, marginBottom: 12, textAlign: 'center' }}>¿Cuántas pagó?</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button onClick={() => setCantidadAprobar(Math.max(1, cantidadAprobar - 1))} style={{ width: 44, height: 44, borderRadius: 10, border: `1.5px solid ${COLORS.primario}`, background: 'white', color: COLORS.primario, fontSize: 22, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>−</button>
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ fontSize: 36, fontWeight: 800, color: COLORS.azulDetalle }}>{cantidadAprobar}</div>
                  <div style={{ fontSize: 11, color: '#666', textTransform: 'uppercase' }}>quinielas</div>
                </div>
                <button onClick={() => setCantidadAprobar(Math.min(aprobarModal.cantidad_quinielas, cantidadAprobar + 1))} style={{ width: 44, height: 44, borderRadius: 10, border: `1.5px solid ${COLORS.primario}`, background: 'white', color: COLORS.primario, fontSize: 22, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>+</button>
              </div>
              <div style={{ marginTop: 14, padding: 12, background: COLORS.primario, color: 'white', borderRadius: 10, textAlign: 'center' }}>
                <div style={{ fontSize: 11, opacity: 0.9 }}>TOTAL COBRADO</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: COLORS.dorado }}>${(cantidadAprobar * 3000).toLocaleString()}</div>
              </div>
            </div>

            {cantidadAprobar < aprobarModal.cantidad_quinielas && (
              <div style={{ padding: 12, background: '#FFF3E0', borderLeft: '3px solid #EF9F27', borderRadius: 6, marginBottom: 16, fontSize: 12, color: '#854F0B' }}>
                ⚠️ Se aprobarán solo {cantidadAprobar} de {aprobarModal.cantidad_quinielas}. Las quinielas no pagadas no se crearán.
              </div>
            )}

            <button onClick={confirmarAprobar} style={{ width: '100%', padding: 14, background: COLORS.verdeExito, color: 'white', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer', marginBottom: 8, fontSize: 14 }}>✓ Aprobar {cantidadAprobar} {cantidadAprobar === 1 ? 'quiniela' : 'quinielas'}</button>
            <button onClick={() => setAprobarModal(null)} style={{ width: '100%', padding: 12, background: '#F0F2F5', color: '#666', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600 }}>Cancelar</button>
          </div>
        </div>
      )}

      {verAccesos && (
        <div onClick={() => setVerAccesos(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: 20, maxWidth: 500, width: '100%', padding: 36 }}>
            <div style={{ fontSize: 48, color: COLORS.primario, textAlign: 'center', marginBottom: 12 }}>🔑</div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: COLORS.azulDetalle, textAlign: 'center', marginBottom: 8 }}>Accesos de {verAccesos.nombre}</h2>
            <p style={{ color: '#666', textAlign: 'center', marginBottom: 20, fontSize: 13 }}>{verAccesos.email}</p>

            <div style={{ background: COLORS.fondoNeutro, padding: 18, borderRadius: 12, marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', fontWeight: 600 }}>Usuario</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.azulDetalle, fontFamily: 'monospace' }}>{verAccesos.usuario || '(no generado)'}</div>
              <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', fontWeight: 600, marginTop: 12 }}>Password</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.azulDetalle, fontFamily: 'monospace' }}>{verAccesos.password || '(no generado)'}</div>
            </div>

            {verAccesos.usuario && verAccesos.password && (
              <a href={`https://wa.me/52${verAccesos.telefono}?text=${encodeURIComponent(`Hola ${verAccesos.nombre}! Aquí tus accesos para la Quiniela Estadio Gana:\n\nUsuario: ${verAccesos.usuario}\nPassword: ${verAccesos.password}\n\nIngresa a https://quiniela.estadiogana.mx/jugar`)}`} target="_blank" rel="noreferrer" style={{ display: 'block', textAlign: 'center', padding: 14, background: '#25D366', color: 'white', borderRadius: 10, textDecoration: 'none', fontWeight: 700, marginBottom: 8 }}>📱 Reenviar por WhatsApp</a>
            )}
            <button onClick={() => setVerAccesos(null)} style={{ width: '100%', padding: 12, background: '#F0F2F5', color: '#666', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600 }}>Cerrar</button>
          </div>
        </div>
      )}

      {accesos && (
        <div onClick={() => setAccesos(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: 20, maxWidth: 500, width: '100%', padding: 36 }}>
            <div style={{ fontSize: 48, color: COLORS.verdeExito, textAlign: 'center', marginBottom: 12 }}>✓</div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: COLORS.azulDetalle, textAlign: 'center', marginBottom: 8 }}>Pago aprobado</h2>
            <p style={{ color: '#666', textAlign: 'center', marginBottom: 8 }}>Comparte estos accesos con {accesos.nombre} por WhatsApp</p>
            <p style={{ color: COLORS.azulDetalle, textAlign: 'center', marginBottom: 20, fontSize: 13, fontWeight: 700 }}>{accesos.cantidad} {accesos.cantidad === 1 ? 'quiniela' : 'quinielas'} · ${accesos.monto.toLocaleString()}</p>

            <div style={{ background: COLORS.fondoNeutro, padding: 18, borderRadius: 12, marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', fontWeight: 600 }}>Usuario</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.azulDetalle, fontFamily: 'monospace' }}>{accesos.usuario}</div>
              <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', fontWeight: 600, marginTop: 12 }}>Password</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.azulDetalle, fontFamily: 'monospace' }}>{accesos.password}</div>
            </div>

            <a href={`https://wa.me/52${accesos.telefono}?text=${encodeURIComponent(`Hola ${accesos.nombre}! Tu pago de la Quiniela Estadio Gana fue confirmado (${accesos.cantidad} ${accesos.cantidad === 1 ? 'quiniela' : 'quinielas'}). Tus accesos:\n\nUsuario: ${accesos.usuario}\nPassword: ${accesos.password}\n\nIngresa a https://quiniela.estadiogana.mx para hacer tus pronósticos. ¡Suerte!`)}`} target="_blank" rel="noreferrer" style={{ display: 'block', textAlign: 'center', padding: 14, background: '#25D366', color: 'white', borderRadius: 10, textDecoration: 'none', fontWeight: 700, marginBottom: 8 }}>📱 Enviar por WhatsApp</a>
            <button onClick={() => setAccesos(null)} style={{ width: '100%', padding: 12, background: '#F0F2F5', color: '#666', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600 }}>Cerrar</button>
          </div>
        </div>
      )}

      {pronosticosModal && (
        <div onClick={() => setPronosticosModal(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: 20, maxWidth: 800, width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '24px 28px 16px', borderBottom: '1px solid #E0E0E0' }}>
              <div style={{ fontSize: 11, color: '#888', letterSpacing: 2, fontWeight: 700 }}>PRONÓSTICOS</div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: COLORS.azulDetalle, margin: '4px 0 0' }}>{pronosticosModal.usuario?.nombre}</h2>
              {pronosticosModal.usuario?.usuario && <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>@{pronosticosModal.usuario.usuario}</div>}
            </div>
            <div style={{ overflowY: 'auto', padding: 20, flex: 1 }}>
              {pronosticosModal.cargando ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>Cargando pronósticos...</div>
              ) : (pronosticosModal.quinielas || []).length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>Este usuario no tiene quinielas</div>
              ) : (
                (pronosticosModal.quinielas || []).map(q => {
                  const pronDeEstaQ = (pronosticosModal.pronosticos || []).filter(p => p.quiniela_id === q.id);
                  const indexPron = {};
                  pronDeEstaQ.forEach(p => { indexPron[p.partido_id] = p; });
                  return (
                    <div key={q.id} style={{ marginBottom: 24, border: '1px solid #E0E0E0', borderRadius: 12, overflow: 'hidden' }}>
                      <div style={{ background: COLORS.fondoNeutro, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontWeight: 800, color: COLORS.azulDetalle }}>{q.nombre}</div>
                        <div style={{ fontSize: 12, color: '#666' }}>
                          {pronDeEstaQ.length} de {(pronosticosModal.partidos || []).length} pronosticados · {q.puntos || 0} pts
                          {q.posicion ? ` · #${q.posicion}` : ''}
                        </div>
                      </div>
                      {(pronosticosModal.partidos || []).filter(p => indexPron[p.id]).length === 0 ? (
                        <div style={{ padding: 20, textAlign: 'center', color: '#888', fontSize: 13 }}>Sin pronósticos</div>
                      ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                          <thead>
                            <tr style={{ background: 'white', borderBottom: '1px solid #E0E0E0' }}>
                              <th style={{ padding: 10, textAlign: 'left', fontSize: 11, color: '#666', textTransform: 'uppercase' }}>Partido</th>
                              <th style={{ padding: 10, textAlign: 'center', fontSize: 11, color: '#666', textTransform: 'uppercase' }}>Pronóstico</th>
                              <th style={{ padding: 10, textAlign: 'center', fontSize: 11, color: '#666', textTransform: 'uppercase' }}>Resultado</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(pronosticosModal.partidos || []).filter(p => indexPron[p.id]).map(p => {
                              const pr = indexPron[p.id];
                              const tieneRes = p.goles_local !== null && p.goles_visitante !== null;
                              return (
                                <tr key={p.id} style={{ borderTop: '1px solid #F0F2F5' }}>
                                  <td style={{ padding: 10 }}>
                                    <div style={{ fontWeight: 600 }}>{p.local} vs {p.visitante}</div>
                                    <div style={{ fontSize: 11, color: '#888' }}>{p.fase}{p.grupo ? ` · Grupo ${p.grupo}` : ''}</div>
                                  </td>
                                  <td style={{ padding: 10, textAlign: 'center', fontWeight: 800, color: COLORS.azulDetalle }}>{pr.goles_local} - {pr.goles_visitante}</td>
                                  <td style={{ padding: 10, textAlign: 'center', fontWeight: 800, color: tieneRes ? COLORS.verdeExito : '#888' }}>{tieneRes ? `${p.goles_local} - ${p.goles_visitante}` : '—'}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      )}
                    </div>
                  );
                })
              )}
            </div>
            <div style={{ padding: 16, borderTop: '1px solid #E0E0E0' }}>
              <button onClick={() => setPronosticosModal(null)} style={{ width: '100%', padding: 12, background: '#F0F2F5', color: '#666', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600 }}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

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
