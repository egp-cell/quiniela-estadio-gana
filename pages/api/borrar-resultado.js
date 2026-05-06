import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ exito: false, error: 'Metodo no permitido' });
  }

  try {
    const { partidoId } = req.body;

    if (!partidoId) {
      return res.status(400).json({ exito: false, error: 'Falta partidoId' });
    }

    // 1. Limpiar el resultado del partido
    const { error: errorPartido } = await supabase
      .from('partidos')
      .update({
        goles_local: null,
        goles_visitante: null,
        estado: 'Programado'
      })
      .eq('id', partidoId);

    if (errorPartido) {
      return res.status(500).json({ exito: false, error: errorPartido.message });
    }

    // 2. Obtener IDs de quinielas que tenian puntos en este partido (antes de borrar)
    const { data: punts } = await supabase
      .from('puntuaciones')
      .select('quiniela_id')
      .eq('partido_id', partidoId);

    const quinielaIds = [...new Set((punts || []).map(p => p.quiniela_id))];

    // 3. Borrar puntuaciones de este partido
    await supabase
      .from('puntuaciones')
      .delete()
      .eq('partido_id', partidoId);

    // 4. Recalcular puntos totales de cada quiniela afectada
    for (const qId of quinielaIds) {
      const { data: pts } = await supabase
        .from('puntuaciones')
        .select('puntos')
        .eq('quiniela_id', qId);

      const total = (pts || []).reduce((s, p) => s + (p.puntos || 0), 0);

      await supabase
        .from('quinielas')
        .update({ puntos: total })
        .eq('id', qId);
    }

    // 5. Recalcular posiciones globales
    const { data: todas } = await supabase
      .from('quinielas')
      .select('id, puntos')
      .order('puntos', { ascending: false });

    if (todas) {
      for (let i = 0; i < todas.length; i++) {
        await supabase
          .from('quinielas')
          .update({ posicion: i + 1 })
          .eq('id', todas[i].id);
      }
    }

    return res.status(200).json({
      exito: true,
      mensaje: `Resultado borrado. Recalculadas ${quinielaIds.length} quinielas.`
    });

  } catch (error) {
    return res.status(500).json({ exito: false, error: error.message });
  }
}
