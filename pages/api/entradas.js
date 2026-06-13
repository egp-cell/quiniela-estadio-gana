import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ exito: false, error: 'Metodo no permitido' });
  }

  try {
    const ahora = new Date();
    const ahoraIso = ahora.toISOString();
    const ahoraMs = ahora.getTime();

    // 1. Todos los partidos (para encabezados, aunque no hayan iniciado)
    const { data: partidos, error: ePart } = await supabase
      .from('partidos')
      .select('id, fase, grupo, local, visitante, fecha_hora, goles_local, goles_visitante, estado')
      .order('fecha_hora', { ascending: true });
    if (ePart) return res.status(500).json({ exito: false, error: ePart.message });

    // 2a. Quinielas SIN embed. El embed `usuarios(...)` puede comportarse como
    //     INNER JOIN silenciosamente cuando PostgREST no resuelve la FK para
    //     filas específicas, dejándolas afuera sin error. Lo evitamos haciendo
    //     dos queries y combinando en memoria. range(0, 9999) sube el LIMIT
    //     default de Supabase (1000) para soportar miles de filas.
    const { data: quinielas, error: eQ } = await supabase
      .from('quinielas')
      .select('id, usuario_id, nombre')
      .order('id')
      .range(0, 9999);
    if (eQ) return res.status(500).json({ exito: false, error: eQ.message });

    // 2b. Usuarios — solo lo mínimo para mostrar el username.
    const { data: usuariosData, error: eU } = await supabase
      .from('usuarios')
      .select('id, usuario')
      .range(0, 9999);
    if (eU) return res.status(500).json({ exito: false, error: eU.message });

    const usernameById = {};
    (usuariosData || []).forEach(u => { usernameById[u.id] = u.usuario; });

    // Paridad con la lógica de puntos: el cálculo de puntuaciones NO filtra
    // por estado del usuario ni por presencia del usuario. El grid debe
    // mostrar las MISMAS quinielas, todas.
    const todas = quinielas || [];

    // 3. CRÍTICO anti-trampa: solo IDs de partidos cuyo fecha_hora ya pasó.
    //    Comparación con Date.getTime() para evitar bug de comparar strings ISO
    //    con formatos distintos (+00:00 vs Z) — eso devolvía falsos negativos.
    const partidosIniciadosIds = (partidos || [])
      .filter(p => {
        if (!p.fecha_hora) return false;
        const t = new Date(p.fecha_hora).getTime();
        return !isNaN(t) && t <= ahoraMs;
      })
      .map(p => p.id);

    // 4. Pronósticos SOLO de partidos ya iniciados. Nunca se exponen al cliente
    //    los picks de partidos futuros.
    let pronosticos = [];
    if (partidosIniciadosIds.length > 0) {
      const { data: pr, error: ePr } = await supabase
        .from('pronosticos')
        .select('quiniela_id, partido_id, goles_local, goles_visitante')
        .in('partido_id', partidosIniciadosIds)
        .range(0, 99999);  // muchos pronósticos posibles, evitar corte a 1000
      if (ePr) return res.status(500).json({ exito: false, error: ePr.message });
      pronosticos = pr || [];
    }

    // No cache en CDN/cliente: la respuesta depende de la hora exacta
    res.setHeader('Cache-Control', 'no-store, max-age=0');

    return res.status(200).json({
      exito: true,
      ahora: ahoraIso,
      partidos: partidos || [],
      quinielas: todas.map(q => ({
        id: q.id,
        usuario_id: q.usuario_id,
        nombre: q.nombre,
        username: usernameById[q.usuario_id] || null
      })),
      pronosticos,
      diag: {
        quinielas_count: todas.length,
        usuarios_count: (usuariosData || []).length,
        pronosticos_count: pronosticos.length,
        partidos_iniciados_count: partidosIniciadosIds.length
      }
    });
  } catch (error) {
    console.error('Error entradas:', error);
    return res.status(500).json({ exito: false, error: error.message });
  }
}
