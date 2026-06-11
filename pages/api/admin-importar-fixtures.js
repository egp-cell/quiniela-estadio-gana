// ENDPOINT TEMPORAL — Cruza partidos locales con API-Football y guarda fixture_id.
//
// Uso:
//   GET /api/admin-importar-fixtures           → dry-run, solo reporte
//   GET /api/admin-importar-fixtures?apply=true → aplica los matches a Supabase
//
// Requiere env var API_FOOTBALL_KEY en Vercel.

import { createClient } from '@supabase/supabase-js';

const API_BASE = 'https://v3.football.api-sports.io';
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_KEY
);

// Nombres en español del sistema → variantes posibles en API-Football
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

function diaIso(fechaIso) {
  if (!fechaIso) return '';
  return new Date(fechaIso).toISOString().slice(0, 10);
}

export default async function handler(req, res) {
  const apiKey = process.env.API_FOOTBALL_KEY;
  if (!apiKey) {
    return res.status(500).json({
      exito: false,
      error: 'Falta API_FOOTBALL_KEY en variables de entorno de Vercel.'
    });
  }

  const apply = req.query.apply === 'true';

  try {
    // 1) Verificar el season correcto para league=1
    const ligaRes = await fetch(`${API_BASE}/leagues?id=1`, {
      headers: { 'x-apisports-key': apiKey }
    });
    const ligaJson = await ligaRes.json();
    if (!ligaJson.response || ligaJson.response.length === 0) {
      return res.status(502).json({
        exito: false,
        error: 'No se obtuvo info de la liga 1 desde API-Football',
        respuesta_api: ligaJson
      });
    }
    const ligaInfo = ligaJson.response[0];
    const seasons = ligaInfo.seasons || [];
    const season2026 = seasons.find(s => s.year === 2026);
    const seasonCurrent = seasons.find(s => s.current);

    if (!season2026) {
      return res.status(400).json({
        exito: false,
        error: 'No existe season 2026 en API-Football para league=1',
        season_actual_en_api: seasonCurrent ? seasonCurrent.year : null,
        seasons_disponibles: seasons.map(s => ({
          year: s.year, current: s.current, start: s.start, end: s.end
        }))
      });
    }

    // 2) Jalar fixtures del Mundial 2026
    const fixRes = await fetch(`${API_BASE}/fixtures?league=1&season=2026`, {
      headers: { 'x-apisports-key': apiKey }
    });
    const fixJson = await fixRes.json();
    if (!fixJson.response) {
      return res.status(502).json({
        exito: false,
        error: 'No se obtuvieron fixtures de API-Football',
        respuesta_api: fixJson
      });
    }
    const fixtures = fixJson.response;

    // 3) Traer todos los partidos locales (con su fixture_id actual si lo tienen)
    const { data: partidos, error: ePart } = await supabase
      .from('partidos')
      .select('id, local, visitante, fecha_hora, fixture_id')
      .order('fecha_hora', { ascending: true });
    if (ePart) return res.status(500).json({ exito: false, error: ePart.message });

    // 4) Cruzar
    const cuadraron = [];
    const noCuadraron = [];
    const yaTienen = [];

    for (const p of (partidos || [])) {
      if (p.fixture_id) {
        yaTienen.push({
          partido_id: p.id, local: p.local, visitante: p.visitante,
          fixture_id: p.fixture_id
        });
        continue;
      }

      if (!p.fecha_hora || !p.local || !p.visitante) {
        noCuadraron.push({
          partido_id: p.id, local: p.local, visitante: p.visitante,
          fecha_local: p.fecha_hora,
          razon: 'partido local incompleto (sin fecha o sin equipos)'
        });
        continue;
      }

      const diaLocal = diaIso(p.fecha_hora);

      // Filtrar por día y por nombres (en orden directo o invertido)
      const candidatos = fixtures.filter(f => {
        const home = f.teams?.home?.name || '';
        const away = f.teams?.away?.name || '';
        const fechaApi = f.fixture?.date || '';
        if (diaIso(fechaApi) !== diaLocal) return false;
        const directo = matchEquipo(p.local, home) && matchEquipo(p.visitante, away);
        const invertido = matchEquipo(p.local, away) && matchEquipo(p.visitante, home);
        return directo || invertido;
      });

      if (candidatos.length === 1) {
        const m = candidatos[0];
        cuadraron.push({
          partido_id: p.id,
          local: p.local, visitante: p.visitante, fecha_local: p.fecha_hora,
          fixture_id: m.fixture.id,
          api_home: m.teams.home.name,
          api_away: m.teams.away.name,
          api_date: m.fixture.date,
          venue: m.fixture?.venue?.name || null
        });
      } else {
        noCuadraron.push({
          partido_id: p.id,
          local: p.local, visitante: p.visitante, fecha_local: p.fecha_hora,
          matches_encontrados: candidatos.length,
          razon: candidatos.length === 0 ? 'sin coincidencia' : 'múltiples coincidencias en el mismo día',
          candidatos: candidatos.map(c => ({
            fixture_id: c.fixture.id,
            home: c.teams.home.name,
            away: c.teams.away.name,
            date: c.fixture.date
          }))
        });
      }
    }

    // 5) Aplicar updates si apply=true
    let actualizados = 0;
    const erroresUpdate = [];
    if (apply && cuadraron.length > 0) {
      for (const c of cuadraron) {
        const { error } = await supabase
          .from('partidos')
          .update({ fixture_id: c.fixture_id })
          .eq('id', c.partido_id);
        if (error) erroresUpdate.push({ partido_id: c.partido_id, error: error.message });
        else actualizados++;
      }
    }

    return res.status(200).json({
      exito: true,
      modo: apply ? 'APLICADO' : 'DRY-RUN (no se escribió nada — agrega ?apply=true para guardar)',
      api_football: {
        liga_nombre: ligaInfo.league?.name,
        liga_pais: ligaInfo.country?.name,
        season_2026: season2026,
        season_actual_en_api: seasonCurrent ? seasonCurrent.year : null
      },
      resumen: {
        total_partidos_locales: (partidos || []).length,
        total_fixtures_api: fixtures.length,
        ya_tenian_fixture_id: yaTienen.length,
        cuadraron: cuadraron.length,
        no_cuadraron: noCuadraron.length,
        actualizados_ahora: actualizados,
        errores_de_update: erroresUpdate.length
      },
      detalle_cuadraron: cuadraron,
      detalle_no_cuadraron: noCuadraron,
      ya_existentes: yaTienen,
      errores_update: erroresUpdate
    });

  } catch (error) {
    console.error('Error import fixtures:', error);
    return res.status(500).json({
      exito: false,
      error: error.message,
      stack: error.stack
    });
  }
}
