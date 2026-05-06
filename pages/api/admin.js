import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_KEY
);

function generarPassword() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let p = '';
  for (let i = 0; i < 8; i++) p += chars[Math.floor(Math.random() * chars.length)];
  return p;
}

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const { data: usuarios, error } = await supabase
        .from('usuarios')
        .select('*')
        .order('fecha_registro', { ascending: false });

      if (error) return res.status(500).json({ exito: false, error: error.message });

      const stats = {
        registrados: usuarios.length,
        pendientes: usuarios.filter(u => u.estado === 'Pendiente_Pago').length,
        activos: usuarios.filter(u => u.estado === 'Activo').length,
        recaudado: usuarios.filter(u => u.estado === 'Activo').reduce((s, u) => s + (u.total_pagado || 0), 0)
      };

      return res.status(200).json({ exito: true, stats, usuarios });
    }

    if (req.method === 'POST') {
      const { accion, usuarioId, cantidadAprobada } = req.body;

      if (accion === 'aprobar') {
        const { data: usuario } = await supabase.from('usuarios').select('*').eq('id', usuarioId).single();
        if (!usuario) return res.status(404).json({ exito: false, error: 'Usuario no encontrado' });

        // Si no se especifica cantidadAprobada, usar la del registro original
        const cantidadFinal = cantidadAprobada !== undefined && cantidadAprobada !== null
          ? parseInt(cantidadAprobada)
          : usuario.cantidad_quinielas;

        if (cantidadFinal < 1 || cantidadFinal > usuario.cantidad_quinielas) {
          return res.status(400).json({ exito: false, error: `Cantidad invalida. Debe ser entre 1 y ${usuario.cantidad_quinielas}` });
        }

        const username = usuario.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '') + usuario.id;
        const password = generarPassword();
        const monto = cantidadFinal * 3000;

        await supabase.from('usuarios').update({
          estado: 'Activo',
          usuario: username,
          password: password,
          cantidad_quinielas: cantidadFinal,
          total_pagado: monto,
          fecha_aprobacion: new Date().toISOString()
        }).eq('id', usuarioId);

        await supabase.from('pagos').update({
          estado: 'Confirmado',
          monto: monto,
          fecha_confirmacion: new Date().toISOString()
        }).eq('usuario_id', usuarioId);

        // Crear las N quinielas (solo las pagadas)
        const quinielas = [];
        for (let i = 1; i <= cantidadFinal; i++) {
          quinielas.push({
            usuario_id: usuarioId,
            nombre: cantidadFinal > 1 ? `${usuario.nombre} #${i}` : usuario.nombre,
            estado: 'Pagada',
            puntos: 0
          });
        }
        await supabase.from('quinielas').insert(quinielas);

        return res.status(200).json({
          exito: true,
          nombre: usuario.nombre,
          telefono: usuario.telefono,
          usuario: username,
          password: password,
          cantidad: cantidadFinal,
          monto: monto
        });
      }

      if (accion === 'rechazar') {
        await supabase.from('pagos').update({ estado: 'Rechazado' }).eq('usuario_id', usuarioId);
        await supabase.from('usuarios').update({ estado: 'Rechazado' }).eq('id', usuarioId);
        return res.status(200).json({ exito: true });
      }

      if (accion === 'eliminar') {
        // Borrar en orden por las foreign keys
        await supabase.from('puntuaciones').delete().eq('quiniela_id', usuarioId);
        await supabase.from('pronosticos').delete().eq('quiniela_id', usuarioId);

        // Obtener IDs de quinielas para borrar sus pronosticos/puntuaciones
        const { data: quinielas } = await supabase.from('quinielas').select('id').eq('usuario_id', usuarioId);
        if (quinielas && quinielas.length > 0) {
          const quinielaIds = quinielas.map(q => q.id);
          await supabase.from('puntuaciones').delete().in('quiniela_id', quinielaIds);
          await supabase.from('pronosticos').delete().in('quiniela_id', quinielaIds);
        }

        await supabase.from('quinielas').delete().eq('usuario_id', usuarioId);
        await supabase.from('pagos').delete().eq('usuario_id', usuarioId);
        await supabase.from('usuarios').delete().eq('id', usuarioId);

        return res.status(200).json({ exito: true });
      }

      return res.status(400).json({ exito: false, error: 'Accion no valida' });
    }

    return res.status(405).json({ exito: false, error: 'Metodo no permitido' });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ exito: false, error: error.message });
  }
}
