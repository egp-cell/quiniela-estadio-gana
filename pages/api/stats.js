import { createClient } from '@supabase/supabase-js';
import { SPONSOR } from '../../lib/brand';

export default async function handler(req, res) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_KEY
  );

  const { data, error } = await supabase
    .from('usuarios')
    .select('cantidad_quinielas')
    .eq('estado', 'Activo');

  if (error) return res.status(500).json({ error: error.message });

  const total = data.reduce((sum, u) => sum + (u.cantidad_quinielas || 0), 0);

  return res.status(200).json({
    totalQuinielas: total,
    bolsa: total * 3000 + SPONSOR.aporteBolsa
  });
}
