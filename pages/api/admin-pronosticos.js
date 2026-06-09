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
    const { usuarioId } = req.query;
    if (!usuarioId) return res.status(400).json({ exito: false, error: 'Falta usuarioId' });

    const { data: usuario } = await supabase
      .from('usuarios')
      .select('id, nombre, usuario, email')
      .eq('id', usuarioId)
      .single();
    if (!usuario) return res.status(404).json({ exito: false, error: 'Usuario no encontrado' });

    const { data: quinielas, error: eQ } = await supabase
      .from('quinielas')
      .select('id, nombre, puntos, posicion')
      .eq('usuario_id', usuarioId)
      .order('id');
    if (eQ) return res.status(500).json({ exito: false, error: eQ.message });

    const quinielaIds = (quinielas || []).map(q => q.id);
    let pronosticos = [];
    if (quinielaIds.length > 0) {
      const { data: pr, error: eP } = await supabase
        .from('pronosticos')
        .select('quiniela_id, partido_id, goles_local, goles_visitante')
        .in('quiniela_id', quinielaIds);
      if (eP) return res.status(500).json({ exito: false, error: eP.message });
      pronosticos = pr || [];
    }

    const { data: partidos, error: ePart } = await supabase
      .from('partidos')
      .select('id, fase, grupo, local, visitante, fecha_hora, goles_local, goles_visitante, estado')
      .order('fecha_hora', { ascending: true });
    if (ePart) return res.status(500).json({ exito: false, error: ePart.message });

    return res.status(200).json({
      exito: true,
      usuario,
      quinielas: quinielas || [],
      pronosticos,
      partidos: partidos || []
    });
  } catch (error) {
    console.error('Error admin-pronosticos:', error);
    return res.status(500).json({ exito: false, error: error.message });
  }
}
