import { createClient } from '@supabase/supabase-js';
import { SPONSOR } from '../../lib/brand';

export default async function handler(req, res) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_KEY
  );

  const { data, error } = await supabase
    .from('usuarios')
    .select('cantidad_quinielas, total_pagado, es_cortesia')
    .eq('estado', 'Activo');

  if (error) return res.status(500).json({ error: error.message });

  const noCortesia = data.filter(u => !u.es_cortesia);
  const totalQuinielas = noCortesia.reduce((sum, u) => sum + (u.cantidad_quinielas || 0), 0);
  const bolsaBase = noCortesia.reduce((sum, u) => sum + (u.total_pagado || 0), 0);

  return res.status(200).json({
    totalQuinielas,
    bolsa: bolsaBase + SPONSOR.aporteBolsa
  });
}
