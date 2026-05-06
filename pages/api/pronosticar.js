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
    const { quinielaId, partidoId, golesLocal, golesVisitante } = req.body;

    if (quinielaId === undefined || partidoId === undefined) {
      return res.status(400).json({ exito: false, error: 'Faltan datos' });
    }

    // Verificar que el partido no haya empezado
    const { data: partido } = await supabase
      .from('partidos')
      .select('fecha_hora, estado')
      .eq('id', partidoId)
      .single();

    if (!partido) {
      return res.status(404).json({ exito: false, error: 'Partido no encontrado' });
    }

    const ahora = new Date();
    const fechaPartido = new Date(partido.fecha_hora);

    if (ahora >= fechaPartido) {
      return res.status(403).json({ exito: false, error: 'Este partido ya empezo, no se puede pronosticar' });
    }

    // Si vienen como null, eliminar el pronostico
    if (golesLocal === null || golesVisitante === null || golesLocal === '' || golesVisitante === '') {
      await supabase
        .from('pronosticos')
        .delete()
        .eq('quiniela_id', quinielaId)
        .eq('partido_id', partidoId);

      return res.status(200).json({ exito: true, eliminado: true });
    }

    // Validar que sean numeros
    const gl = parseInt(golesLocal);
    const gv = parseInt(golesVisitante);

    if (isNaN(gl) || isNaN(gv) || gl < 0 || gv < 0 || gl > 20 || gv > 20) {
      return res.status(400).json({ exito: false, error: 'Goles invalidos' });
    }

    // Upsert: si ya existe lo actualiza, si no lo crea
    const { error } = await supabase
      .from('pronosticos')
      .upsert({
        quiniela_id: quinielaId,
        partido_id: partidoId,
        goles_local: gl,
        goles_visitante: gv
      }, {
        onConflict: 'quiniela_id,partido_id'
      });

    if (error) {
      console.error('Error pronosticar:', error);
      return res.status(500).json({ exito: false, error: error.message });
    }

    return res.status(200).json({ exito: true });

  } catch (error) {
    console.error('Error general:', error);
    return res.status(500).json({ exito: false, error: error.message });
  }
}
