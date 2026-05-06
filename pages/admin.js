import { useState, useEffect } from 'react';

export default function Admin() {
  const [data, setData] = useState(null);
  const [filtro, setFiltro] = useState('Pendiente_Pago');
  const [cargando, setCargando] = useState(false);
  const [aprobado, setAprobado] = useState(null);

  async function cargar() {
    setCargando(true);
    try {
      const res = await fetch('/api/admin');
      const d = await res.json();
      setData(d);
    } catch (e) {
      alert('Error: ' + e.message);
    }
    setCargando(false);
  }

  useEffect(() => {
    cargar();
    const t = setInterval(cargar, 30000);
    return () => clearInterval(t);
  }, []);

  async function aprobar(id) {
    if (!confirm('Confirmar aprobacion? Verificaste el pago en MoneyPool?')) return;
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accion: 'aprobar', id })
      });
      const r = await res.json();
      if (r.exito) {
        setAprobado(r.datos);
        cargar();
      } else {
        alert('Error: ' + r.error);
      }
    } catch (e) {
      alert('Error: ' + e.message);
    }
  }

  async function rechazar(id) {
    if (!confirm('Rechazar este registro?')) return;
    await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accion: 'rechazar', id })
    });
    cargar();
  }

  const usuarios = data?.usuarios || [];
  const filtrados = filtro === 'todos' ? usuarios : usuarios.filter(u => u.estado === filtro);
  const counts = { Pendiente_Pago: 0, Activo: 0 };
  usuarios.forEach(u => { if (counts[u.estado] !== undefined) counts[u.estado]++; });

  function iniciales(n) {
    const p = (n || '').split(' ').filter(x => x.length > 0);
    if (p.length === 0) return '?';
    if (p.length === 1) return p[0].substring(0, 2).toUpperCase();
    return (p[0][0] + p[p.length - 1][0]).toUpperCase();
  }

  function whatsapp(u) {
    let tel = String(u.telefono).replace(/[^0-9]/g, '');
    if (tel.length === 10) tel = '52' + tel;
    const msg = `Hola ${u.nombre}! Tu pago fue confirmado.\n\nUsuario: ${u.usuario}\nPassword: ${u.password}\n\nTienes ${u.cantidad_quinielas} quiniela${u.cantidad_quinielas > 1 ? 's' : ''}.`;
    return `https://wa.me/${tel}?text=${encodeURIComponent(msg)}`;
  }

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', background: '#F0F2F5', minHeight: '100vh', padding: 20 }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />

      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ background: 'linear-gradient(135deg, #042C53, #0C447C)', color: 'white', padding: 24, borderRadius: 14, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: 2, opacity: 0.7 }}>PANEL ADMIN</div>
            <div style={{ fontSize: 22, fontWeight: 800 }}>Quiniela Mundial 2026</div>
          </div>
          <button onClick={cargar} disabled={cargando} style={{ padding: '9px 16px', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', color: 'white', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
            {cargando ? 'Cargando...' : '🔄 Recargar'}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 20 }}>
          {[
            ['REGISTRADOS', data?.stats?.registrados ?? '-', '#042C53'],
            ['PENDIENTES', data?.stats?.pendientes ?? '-', '#BA7517'],
            ['ACTIVOS', data?.stats?.activos ?? '-', '#1D9E75'],
            ['RECAUDADO', data?.stats?.recaudado != null ? '$' + Number(data.stats.recaudado).toLocaleString() : '-', '#042C53']
          ].map(([l, v, c], i) => (
            <div key={i} style={{ background: 'white', padding: 18, borderRadius: 12, border: '1px solid #E0E0E0' }}>
              <div style={{ fontSize: 11, color: '#888', letterSpacing: 1.5, fontWeight: 600 }}>{l}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: c, marginTop: 6 }}>{v}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
          {[
            ['Pendiente_Pago', `Pendientes (${counts.Pendiente_Pago})`, '#FAEEDA', '#854F0B'],
            ['Activo', `Activos (${counts.Activo})`, '#E1F5EE', '#085041'],
            ['todos', 'Todos', '#F0F2F5', '#666']
          ].map(([f, l, bg, c]) => (
            <button key={f} onClick={() => setFiltro(f)} style={{ padding: '9px 16px', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontWeight: 600, background: filtro === f ? bg : 'white', color: filtro === f ? c : '#666', border: '1px solid ' + (filtro === f ? bg : '#E0E0E0') }}>
              {l}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtrados.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 50, color: '#888', background: 'white', borderRadius: 12, border: '1px solid #E0E0E0' }}>
              No hay registros
            </div>
          ) : filtrados.map(u => (
            <div key={u.id} style={{ background: 'white', border: '1px solid #E0E0E0', borderRadius: 12, padding: 16, display: 'grid', gridTemplateColumns: '44px 1fr auto', gap: 14, alignItems: 'center' }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'white', background: u.estado === 'Activo' ? '#1D9E75' : '#185FA5' }}>
                {iniciales(u.nombre)}
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#042C53', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  {u.nombre}
                  {u.estado === 'Activo' && <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, fontWeight: 700, background: '#E1F5EE', color: '#085041' }}>ACTIVO</span>}
                  {u.estado === 'Pendiente_Pago' && <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, fontWeight: 700, background: '#FAEEDA', color: '#633806' }}>PENDIENTE</span>}
                </div>
                <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                  📧 {u.email} · 📱 {u.telefono} · {u.cantidad_quinielas} quiniela{u.cantidad_quinielas > 1 ? 's' : ''} · ${(u.cantidad_quinielas * 3000).toLocaleString()}
                </div>
                {u.estado === 'Activo' && u.usuario && (
                  <div style={{ background: '#FAEEDA', border: '1px dashed #EF9F27', borderRadius: 8, padding: '6px 10px', fontSize: 12, marginTop: 6, display: 'inline-block' }}>
                    🔑 Usuario: <code style={{ background: 'white', padding: '1px 6px', borderRadius: 3, fontWeight: 700, color: '#042C53' }}>{u.usuario}</code>
                    {' Pass: '}
                    <code style={{ background: 'white', padding: '1px 6px', borderRadius: 3, fontWeight: 700, color: '#042C53' }}>{u.password}</code>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {u.estado === 'Pendiente_Pago' && (
                  <>
                    <button onClick={() => aprobar(u.id)} style={{ padding: '9px 14px', background: '#1D9E75', color: 'white', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>✓ Aprobar</button>
                    <button onClick={() => rechazar(u.id)} style={{ padding: '9px 12px', background: '#F0F2F5', color: '#666', border: 'none', borderRadius: 8, cursor: 'pointer' }}>✗</button>
                  </>
                )}
                {u.estado === 'Activo' && (
                  <a href={whatsapp(u)} target="_blank" rel="noreferrer" style={{ padding: '9px 14px', background: '#25D366', color: 'white', borderRadius: 8, fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>💬 WhatsApp</a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {aprobado && (
        <div onClick={() => setAprobado(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: 20, maxWidth: 480, width: '100%', padding: 32 }}>
            <div style={{ fontSize: 56, color: '#1D9E75', textAlign: 'center', marginBottom: 12 }}>✓</div>
            <h2 style={{ fontSize: 22, fontWeight: 800, textAlign: 'center', color: '#042C53', marginBottom: 8 }}>Usuario aprobado!</h2>
            <p style={{ textAlign: 'center', color: '#666', fontSize: 14, marginBottom: 24 }}>Ya puedes mandar los accesos por WhatsApp</p>
            <div style={{ background: '#F8F9FB', border: '1px solid #E0E0E0', borderRadius: 12, padding: 16, marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13 }}><strong>Nombre:</strong><span>{aprobado.nombre}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13 }}><strong>Usuario:</strong><code style={{ background: '#FAC775', color: '#412402', padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>{aprobado.usuario}</code></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13 }}><strong>Password:</strong><code style={{ background: '#FAC775', color: '#412402', padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>{aprobado.password}</code></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13 }}><strong>Quinielas:</strong><span>{aprobado.cantidad}</span></div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setAprobado(null)} style={{ flex: 1, padding: 12, background: '#F0F2F5', color: '#666', border: 'none', borderRadius: 10, fontWeight: 600, cursor: 'pointer' }}>Cerrar</button>
              <a href={whatsapp(aprobado)} target="_blank" rel="noreferrer" style={{ flex: 2, padding: 12, background: '#25D366', color: 'white', borderRadius: 10, fontWeight: 700, textDecoration: 'none', textAlign: 'center' }}>💬 WhatsApp</a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
