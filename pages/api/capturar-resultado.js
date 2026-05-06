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
    const { partidoId, golesLocal, golesVisitante } = req.body;

    if (partidoId === undefined || golesLocal === undefined || golesVisitante === undefined) {
      return res.status(400).json({ exito: false, error: 'Faltan datos' });
    }

    const gl = parseInt(golesLocal);
    const gv = parseInt(golesVisitante);

    if (isNaN(gl) || isNaN(gv) || gl < 0 || gv < 0) {
      return res.status(400).json({ exito: false, error: 'Goles invalidos' });
    }

    // 1. Actualizar el partido con el resultado
    const { error: errorPartido } = await supabase
      .from('partidos')
      .update({
        goles_local: gl,
        goles_visitante: gv,
        estado: 'Finalizado'
      })
      .eq('id', partidoId);

    if (errorPartido) {
      return res.status(500).json({ exito: false, error: errorPartido.message });
    }

    // 2. Obtener TODOS los pronosticos de este partido
    const { data: pronosticos } = await supabase
      .from('pronosticos')
      .select('*')
      .eq('partido_id', partidoId);

    if (!pronosticos || pronosticos.length === 0) {
      return res.status(200).json({
        exito: true,
        mensaje: 'Resultado capturado. Nadie pronostico este partido.',
        pronosticos_evaluados: 0
      });
    }

    // 3. Borrar puntuaciones anteriores de este partido (por si se recalcula)
    await supabase
      .from('puntuaciones')
      .delete()
      .eq('partido_id', partidoId);

    // 4. Calcular puntos para cada pronostico
    const puntuaciones = [];
    let exactos = 0;
    let aciertos = 0;

    for (const pron of pronosticos) {
      let puntos = 0;
      let tipo = 'Sin acierto';

      // Marcador exacto: 5 puntos
      if (pron.goles_local === gl && pron.goles_visitante === gv) {
        puntos = 5;
        tipo = 'Marcador exacto';
        exactos++;
      } else {
        // Verificar si acerto el ganador o empate
        const resultadoReal = gl > gv ? 'local' : (gl < gv ? 'visitante' : 'empate');
        const resultadoPron = pron.goles_local > pron.goles_visitante ? 'local' :
                              (pron.goles_local < pron.goles_visitante ? 'visitante' : 'empate');

        if (resultadoReal === resultadoPron) {
          puntos = 3;
          tipo = 'Ganador acertado';
          aciertos++;
        }
      }

      puntuaciones.push({
        quiniela_id: pron.quiniela_id,
        partido_id: partidoId,
        puntos: puntos,
        tipo: tipo
      });
    }

    // 5. Insertar todas las puntuaciones
    if (puntuaciones.length > 0) {
      const { error: errorPunt } = await supabase
        .from('puntuaciones')
        .insert(puntuaciones);

      if (errorPunt) {
        console.error('Error insertando puntuaciones:', errorPunt);
        return res.status(500).json({ exito: false, error: errorPunt.message });
      }
    }

    // 6. Recalcular puntos totales de cada quiniela afectada
    const quinielaIds = [...new Set(pronosticos.map(p => p.quiniela_id))];

    for (const qId of quinielaIds) {
      const { data: punts } = await supabase
        .from('puntuaciones')
        .select('puntos')
        .eq('quiniela_id', qId);

      const totalPuntos = (punts || []).reduce((s, p) => s + (p.puntos || 0), 0);

      await supabase
        .from('quinielas')
        .update({ puntos: totalPuntos })
        .eq('id', qId);
    }

    // 7. Recalcular posiciones globales
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
      mensaje: `Resultado capturado. ${exactos} marcadores exactos, ${aciertos} ganadores acertados.`,
      pronosticos_evaluados: pronosticos.length,
      exactos,
      aciertos
    });

  } catch (error) {
    console.error('Error general:', error);
    return res.status(500).json({ exito: false, error: error.message });
  }
}
