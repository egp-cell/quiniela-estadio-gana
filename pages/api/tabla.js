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
    // Traer todas las quinielas con sus dueños
    const { data: quinielas, error } = await supabase
      .from('quinielas')
      .select(`
        id,
        nombre,
        puntos,
        posicion,
        usuario_id,
        usuarios (
          nombre,
          usuario,
          estado
        )
      `)
      .order('puntos', { ascending: false });

    if (error) {
      return res.status(500).json({ exito: false, error: error.message });
    }

    // Filtrar solo quinielas de usuarios activos
    const activas = (quinielas || []).filter(q => q.usuarios && q.usuarios.estado === 'Activo');

    // Para cada quiniela, contar marcadores exactos y aciertos
    const idsQuinielas = activas.map(q => q.id);

    let estadisticas = {};
    if (idsQuinielas.length > 0) {
      const { data: punts } = await supabase
        .from('puntuaciones')
        .select('quiniela_id, puntos, tipo')
        .in('quiniela_id', idsQuinielas);

      (punts || []).forEach(p => {
        if (!estadisticas[p.quiniela_id]) {
          estadisticas[p.quiniela_id] = { exactos: 0, aciertos: 0, partidos: 0 };
        }
        estadisticas[p.quiniela_id].partidos++;
        if (p.tipo === 'Marcador exacto') estadisticas[p.quiniela_id].exactos++;
        if (p.tipo === 'Ganador acertado') estadisticas[p.quiniela_id].aciertos++;
      });
    }

    // Recalcular posiciones (por si hay empates, usa marcadores exactos como desempate)
    const ranking = activas
      .map(q => ({
        id: q.id,
        nombreQuiniela: q.nombre,
        nombreUsuario: q.usuarios.usuario || q.usuarios.nombre,
        puntos: q.puntos || 0,
        exactos: (estadisticas[q.id] && estadisticas[q.id].exactos) || 0,
        aciertos: (estadisticas[q.id] && estadisticas[q.id].aciertos) || 0,
        partidos_evaluados: (estadisticas[q.id] && estadisticas[q.id].partidos) || 0
      }))
      .sort((a, b) => {
        if (b.puntos !== a.puntos) return b.puntos - a.puntos;
        if (b.exactos !== a.exactos) return b.exactos - a.exactos;
        return b.aciertos - a.aciertos;
      })
      .map((q, i) => ({ ...q, posicion: i + 1 }));

    return res.status(200).json({ exito: true, ranking, total: ranking.length });

  } catch (error) {
    return res.status(500).json({ exito: false, error: error.message });
  }
}
