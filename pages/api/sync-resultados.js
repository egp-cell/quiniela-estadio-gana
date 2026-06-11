// SYNC RESULTADOS desde API-Football → Supabase (cron cada 10 min)
//
// Reglas:
//  - Solo partidos con fixture_id ya guardado.
//  - Solo aplica si el partido en API-Football está FT/AET/PEN.
//  - Usa score.fulltime (minuto 90), nunca extratime/penalty.
//  - Asigna marcador POR EQUIPO comparando nombres normalizados, no por
//    posición: si home_api coincide con mi `local`, asigna directo; si no,
//    invierte.
//  - Si yo ya capturé un marcador (goles_local + goles_visitante != null y
//    estado = 'Finalizado'), NO sobreescribe. Para forzar re-sync hay que
//    borrar el resultado desde /admin/resultados.
//
// Auth: header `Authorization: Bearer <token>` o `?token=<token>` donde
// el token debe coincidir con SYNC_SECRET o CRON_SECRET (Vercel Cron usa
// CRON_SECRET automáticamente).

import { createClient } from '@supabase/supabase-js';

const API_BASE = 'https://v3.football.api-sports.io';
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_KEY
);

const ALIAS = {
  'México': ['Mexico'],
  'Sudáfrica': ['South Africa'],
  'Corea del Sur': ['South Korea', 'Korea Republic', 'Republic of Korea', 'Korea'],
  'Chequia': ['Czech Republic', 'Czechia'],
  'Canada': ['Canada'],
  'Bosnia': ['Bosnia and Herzegovina', 'Bosnia & Herzegovina', 'Bosnia'],
  'Catar': ['Qatar'],
  'Suiza': ['Switzerland'],
  'Brasil': ['Brazil'],
  'Marruecos': ['Morocco'],
  'Haití': ['Haiti'],
  'Escocia': ['Scotland'],
  'Estados Unidos': ['USA', 'United States', 'United States of America'],
  'Paraguay': ['Paraguay'],
  'Australia': ['Australia'],
  'Turquía': ['Turkey', 'Türkiye', 'Turkiye'],
  'Alemania': ['Germany'],
  'Curazao': ['Curacao', 'Curaçao'],
  'Costa de Marfil': ['Ivory Coast', "Cote d'Ivoire", "Côte d'Ivoire"],
  'Ecuador': ['Ecuador'],
  'Países Bajos': ['Netherlands', 'Holland'],
  'Japón': ['Japan'],
  'Suecia': ['Sweden'],
  'Túnez': ['Tunisia'],
  'Bélgica': ['Belgium'],
  'Irán': ['Iran', 'IR Iran'],
  'Egipto': ['Egypt'],
  'Nueva Zelanda': ['New Zealand'],
  'España': ['Spain'],
  'Uruguay': ['Uruguay'],
  'Arabia Saudita': ['Saudi Arabia'],
  'Cabo Verde': ['Cape Verde Islands', 'Cape Verde', 'Cabo Verde'],
  'Francia': ['France'],
  'Senegal': ['Senegal'],
  'Noruega': ['Norway'],
  'Irak': ['Iraq'],
  'Argentina': ['Argentina'],
  'Austria': ['Austria'],
  'Argelia': ['Algeria'],
  'Jordania': ['Jordan'],
  'Portugal': ['Portugal'],
  'Colombia': ['Colombia'],
  'Uzbekistán': ['Uzbekistan'],
  'RD Congo': ['DR Congo', 'Congo DR', 'Democratic Republic of Congo'],
  'Inglaterra': ['England'],
  'Croacia': ['Croatia'],
  'Ghana': ['Ghana'],
  'Panamá': ['Panama']
};

function normalizar(s) {
  return (s || '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function matchEquipo(nombreEs, nombreApi) {
  const target = normalizar(nombreApi);
  if (normalizar(nombreEs) === target) return true;
  const variantes = ALIAS[nombreEs] || [];
  return variantes.some(v => normalizar(v) === target);
}

export default async function handler(req, res) {
  // Anti-cache: cualquier respuesta (200, 401, 500) debe ser fresca siempre.
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  res.setHeader('CDN-Cache-Control', 'no-store');
  res.setHeader('Vercel-CDN-Cache-Control', 'no-store');

  // Auth — acepta SYNC_SECRET (manual) o CRON_SECRET (Vercel Cron)
  const syncSecret = process.env.SYNC_SECRET;
  const cronSecret = process.env.CRON_SECRET;
  if (!syncSecret && !cronSecret) {
    return res.status(500).json({ exito: false, error: 'Falta SYNC_SECRET o CRON_SECRET en env vars' });
  }
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : (req.query.token || '');
  const ok = (syncSecret && token === syncSecret) || (cronSecret && token === cronSecret);
  if (!ok) {
    return res.status(401).json({ exito: false, error: 'Unauthorized' });
  }

  const apiKey = process.env.API_FOOTBALL_KEY;
  if (!apiKey) {
    return res.status(500).json({ exito: false, error: 'Falta API_FOOTBALL_KEY en env vars' });
  }

  try {
    // 1) Cargar partidos con fixture_id
    const { data: partidos, error: ePart } = await supabase
      .from('partidos')
      .select('id, local, visitante, fecha_hora, fixture_id, goles_local, goles_visitante, estado')
      .not('fixture_id', 'is', null);
    if (ePart) return res.status(500).json({ exito: false, error: ePart.message });

    const total = (partidos || []).length;
    // Filtrar candidatos: NO tocar los que ya tienen marcador y están Finalizado
    const candidatos = (partidos || []).filter(p => {
      const yaTieneMarcador = p.goles_local !== null && p.goles_local !== undefined &&
                              p.goles_visitante !== null && p.goles_visitante !== undefined;
      const yaFinalizado = p.estado === 'Finalizado';
      return !(yaTieneMarcador && yaFinalizado);
    });
    const protegidos = total - candidatos.length;

    if (candidatos.length === 0) {
      return res.status(200).json({
        exito: true,
        mensaje: 'No hay partidos pendientes para sincronizar',
        resumen: {
          total_con_fixture_id: total,
          protegidos_captura_manual: protegidos,
          candidatos: 0,
          actualizados: 0
        }
      });
    }

    // 2) UNA sola llamada a API-Football: todos los fixtures del Mundial 2026
    const fixRes = await fetch(`${API_BASE}/fixtures?league=1&season=2026`, {
      headers: { 'x-apisports-key': apiKey }
    });
    const fixJson = await fixRes.json();
    if (!fixJson.response) {
      return res.status(502).json({
        exito: false,
        error: 'API-Football no devolvió fixtures',
        respuesta_api: fixJson
      });
    }
    const fixturesMap = {};
    for (const f of fixJson.response) {
      if (f.fixture && f.fixture.id) fixturesMap[f.fixture.id] = f;
    }

    // 3) Procesar cada candidato
    const actualizados = [];
    const noFinalizados = [];
    const sinCambio = [];
    const errores = [];

    for (const p of candidatos) {
      const fix = fixturesMap[p.fixture_id];
      if (!fix) {
        errores.push({ partido_id: p.id, fixture_id: p.fixture_id, error: 'fixture_id no encontrado en API' });
        continue;
      }
      const status = fix.fixture?.status?.short;
      // Solo si terminó (FT = full time, AET = extra time, PEN = penalties)
      if (status !== 'FT' && status !== 'AET' && status !== 'PEN') {
        noFinalizados.push({
          partido_id: p.id, fixture_id: p.fixture_id,
          status_short: status, status_long: fix.fixture?.status?.long
        });
        continue;
      }
      // Marcador de los 90 min (NUNCA extra o penaltis)
      const fulltime = fix.score?.fulltime;
      if (!fulltime || fulltime.home === null || fulltime.away === null ||
          fulltime.home === undefined || fulltime.away === undefined) {
        errores.push({ partido_id: p.id, fixture_id: p.fixture_id, error: 'score.fulltime ausente o null' });
        continue;
      }
      // Matching POR EQUIPO (no por posición)
      const homeApi = fix.teams?.home?.name || '';
      const awayApi = fix.teams?.away?.name || '';
      const homeMatchaLocal = matchEquipo(p.local, homeApi);
      const awayMatchaLocal = matchEquipo(p.local, awayApi);

      let nuevoLocal, nuevoVisitante, orden;
      if (homeMatchaLocal) {
        nuevoLocal = fulltime.home;
        nuevoVisitante = fulltime.away;
        orden = 'directo';
      } else if (awayMatchaLocal) {
        nuevoLocal = fulltime.away;
        nuevoVisitante = fulltime.home;
        orden = 'invertido';
      } else {
        errores.push({
          partido_id: p.id, fixture_id: p.fixture_id,
          error: 'mi `local` no coincide con home ni away de la API',
          mi_local: p.local, api_home: homeApi, api_away: awayApi
        });
        continue;
      }

      // ¿Cambió respecto a lo que ya está en BD?
      if (p.goles_local === nuevoLocal && p.goles_visitante === nuevoVisitante && p.estado === 'Finalizado') {
        sinCambio.push({
          partido_id: p.id, marcador: `${nuevoLocal}-${nuevoVisitante}`
        });
        continue;
      }

      const { error: eUpd } = await supabase
        .from('partidos')
        .update({
          goles_local: nuevoLocal,
          goles_visitante: nuevoVisitante,
          estado: 'Finalizado'
        })
        .eq('id', p.id);

      if (eUpd) {
        errores.push({ partido_id: p.id, error: eUpd.message });
        continue;
      }

      actualizados.push({
        partido_id: p.id,
        local: p.local, visitante: p.visitante,
        marcador: `${nuevoLocal}-${nuevoVisitante}`,
        orden_api: orden,
        api_home: homeApi, api_away: awayApi,
        status_api: status
      });
    }

    return res.status(200).json({
      exito: true,
      resumen: {
        total_con_fixture_id: total,
        protegidos_captura_manual: protegidos,
        candidatos_revisados: candidatos.length,
        actualizados: actualizados.length,
        sin_cambio: sinCambio.length,
        aun_no_finalizados: noFinalizados.length,
        errores: errores.length
      },
      actualizados,
      sin_cambio: sinCambio,
      no_finalizados: noFinalizados,
      errores
    });
  } catch (error) {
    console.error('Error sync-resultados:', error);
    return res.status(500).json({ exito: false, error: error.message });
  }
}
