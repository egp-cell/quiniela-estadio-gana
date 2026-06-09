import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_KEY
);

function csvField(v) {
  if (v === null || v === undefined) return '';
  const s = String(v);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).send('Método no permitido');
  }

  try {
    const [{ data: usuarios }, { data: quinielas }, { data: pronosticos }, { data: partidos }, { data: puntuaciones }] = await Promise.all([
      supabase.from('usuarios').select('id, nombre, usuario, email, estado, es_cortesia'),
      supabase.from('quinielas').select('id, usuario_id, nombre, puntos, posicion'),
      supabase.from('pronosticos').select('quiniela_id, partido_id, goles_local, goles_visitante'),
      supabase.from('partidos').select('id, fase, grupo, local, visitante, fecha_hora, goles_local, goles_visitante, estado').order('fecha_hora', { ascending: true }),
      supabase.from('puntuaciones').select('quiniela_id, partido_id, puntos, tipo')
    ]);

    const usuariosMap = {};
    (usuarios || []).forEach(u => { usuariosMap[u.id] = u; });

    const quinielasMap = {};
    (quinielas || []).forEach(q => { quinielasMap[q.id] = q; });

    const partidosMap = {};
    (partidos || []).forEach(p => { partidosMap[p.id] = p; });

    const puntKey = (qid, pid) => `${qid}_${pid}`;
    const puntMap = {};
    (puntuaciones || []).forEach(p => { puntMap[puntKey(p.quiniela_id, p.partido_id)] = p; });

    const headers = [
      'Usuario', 'Username', 'Email', 'Estado_Usuario', 'Es_Cortesia',
      'Quiniela', 'Quiniela_ID', 'Quiniela_Puntos_Total', 'Quiniela_Posicion',
      'Partido_ID', 'Fase', 'Grupo', 'Fecha_Hora_MX',
      'Local', 'Visitante',
      'Pronostico_Local', 'Pronostico_Visitante',
      'Resultado_Local', 'Resultado_Visitante', 'Estado_Partido',
      'Puntos_Obtenidos', 'Tipo_Acierto'
    ];

    const rows = [headers.join(',')];

    (pronosticos || []).forEach(pr => {
      const q = quinielasMap[pr.quiniela_id];
      if (!q) return;
      const u = usuariosMap[q.usuario_id];
      const p = partidosMap[pr.partido_id];
      if (!u || !p) return;

      const punt = puntMap[puntKey(pr.quiniela_id, pr.partido_id)];
      const fechaMx = p.fecha_hora ? new Date(p.fecha_hora).toLocaleString('es-MX', { timeZone: 'America/Mexico_City' }) : '';

      rows.push([
        csvField(u.nombre), csvField(u.usuario), csvField(u.email), csvField(u.estado), csvField(u.es_cortesia ? 'Si' : 'No'),
        csvField(q.nombre), csvField(q.id), csvField(q.puntos || 0), csvField(q.posicion || ''),
        csvField(p.id), csvField(p.fase), csvField(p.grupo), csvField(fechaMx),
        csvField(p.local), csvField(p.visitante),
        csvField(pr.goles_local), csvField(pr.goles_visitante),
        csvField(p.goles_local), csvField(p.goles_visitante), csvField(p.estado),
        csvField(punt ? punt.puntos : ''), csvField(punt ? punt.tipo : '')
      ].join(','));
    });

    const fecha = new Date().toISOString().slice(0, 10);
    const filename = `pronosticos_estadio_gana_${fecha}.csv`;

    // BOM UTF-8 para que Excel respete acentos
    const csv = '﻿' + rows.join('\r\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(csv);
  } catch (error) {
    console.error('Error exportando:', error);
    return res.status(500).send('Error: ' + error.message);
  }
}
