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
    const { nombre, email, telefono, cantidad } = req.body;

    if (!nombre || !email || !telefono || !cantidad) {
      return res.status(400).json({ exito: false, error: 'Faltan datos' });
    }

    const { data: existente } = await supabase
      .from('usuarios')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existente) {
      return res.status(400).json({ exito: false, error: 'Ese email ya esta registrado' });
    }

    const monto = parseInt(cantidad) * 3000;

    const { data: usuario, error: errorUsuario } = await supabase
      .from('usuarios')
      .insert({
        nombre: nombre,
        email: email,
        telefono: parseInt(telefono),
        estado: 'Pendiente_Pago',
        cantidad_quinielas: parseInt(cantidad),
        total_pagado: 0
      })
      .select()
      .single();

    if (errorUsuario) {
      console.error('Error crear usuario:', errorUsuario);
      return res.status(500).json({ exito: false, error: errorUsuario.message });
    }

    const { error: errorPago } = await supabase
      .from('pagos')
      .insert({
        usuario_id: usuario.id,
        monto: monto,
        estado: 'Pendiente'
      });

    if (errorPago) {
      console.error('Error crear pago:', errorPago);
    }

    return res.status(200).json({
      exito: true,
      usuarioId: usuario.id,
      nombre: usuario.nombre,
      monto: monto,
      cantidad: parseInt(cantidad),
      linkMoneyPool: 'https://www.moneypool.mx/p/myMV4GY'
    });

  } catch (error) {
    console.error('Error general:', error);
    return res.status(500).json({ exito: false, error: error.message });
  }
}
