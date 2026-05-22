# CLAUDE.md

Guía para que Claude (o cualquier asistente) entienda este proyecto rápido.

## Sobre el usuario

- **Dueño:** Emiliano (WhatsApp +52 55 6916 1882, `525569161882`).
- **NO programa.** Habla en español casual y directo. Evita jerga técnica, no expliques cosas que no se preguntaron, no des tutoriales de Next/Supabase ni propongas refactors gigantes salvo que él los pida.
- Cuando haya que tocar código, primero dile en lenguaje normal qué va a pasar y por qué. Si la respuesta es larga, resúmela en bullets cortos.
- Es responsable de **dinero real** (quiniela en producción con pagos). Antes de tocar APIs de pago, base de datos o el panel admin, **confirma** con él. Nada de borrar tablas, columnas ni datos sin preguntar.

## Qué es esto

Sitio web público de una **quiniela privada del Mundial FIFA 2026**. Los participantes pagan, pronostican los marcadores de los 104 partidos, suman puntos y se reparte una bolsa.

Producción: https://quiniela-mundial-2026-rouge-nu.vercel.app

## Stack

- **Next.js 14.2.5** (Pages Router, no App Router).
- **React 18**, JavaScript puro (`.js`) — hay `tsconfig.json` pero no se usa TS.
- **Supabase** como base de datos y backend (`@supabase/supabase-js` ^2.45). Acceso desde las API routes con la **anon key pública**: `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_KEY`. No hay service role key. La seguridad depende de RLS y de que el admin no esté expuesto.
- **Vercel** para deploy (push a `main` = deploy automático).
- Sin librería de estilos: todo el CSS es inline en cada componente.
- Fuente: Inter (Google Fonts), banderas de `flagcdn.com`.

## Estructura de archivos

```
pages/
  index.js               Landing pública con formulario de inscripción
  jugar.js               Login y lista de quinielas del usuario
  tabla.js               Ranking global (refresca cada 30s)
  quiniela/[id].js       Pantalla de pronósticos de una quiniela
  admin.js               Panel admin (aprobar pagos, ver accesos, eliminar)  -- SIN auth
  admin/resultados.js    Capturar/borrar resultados de partidos              -- SIN auth
  api/
    registrar.js         POST  crea usuario Pendiente_Pago + pago Pendiente
    login.js             POST  valida usuario/password y devuelve sus quinielas
    partidos.js          GET   ?quinielaId=  lista partidos + pronósticos de esa quiniela
    pronosticar.js       POST  upsert/borrado de un pronóstico (bloquea si partido empezó)
    stats.js             GET   total de quinielas activas y bolsa actual
    tabla.js             GET   ranking ordenado con desempate por exactos/aciertos
    admin.js             GET/POST  acciones: aprobar, rechazar, eliminar
    listar-partidos-admin.js  GET  todos los partidos para el panel
    capturar-resultado.js     POST guarda resultado y RECALCULA puntos+posiciones
    borrar-resultado.js       POST limpia resultado y recalcula
lib/
  supabase.js            Cliente de Supabase (no se usa mucho, los handlers crean el suyo)
  pages/api/registrar.js DUPLICADO/HUÉRFANO del de pages/api/registrar.js — no se llama
next.config.js, package.json, tsconfig.json, .gitignore
```

Notas importantes:
- `lib/pages/api/registrar.js` es **código viejo huérfano** (Next sólo enruta desde `pages/api/`). El real es `pages/api/registrar.js`. Si vas a cambiar el registro, edita el de `pages/api/`.
- Las API routes crean su propio cliente Supabase con `createClient(...)` en vez de importar `lib/supabase.js`. Consistencia: usa el patrón que veas en archivos vecinos.
- La lista de **12 grupos / 48 equipos** está hardcodeada en `pages/index.js`. El diccionario `BANDERAS` (nombre → código de bandera) está duplicado en `pages/admin/resultados.js` y `pages/quiniela/[id].js`. Si se cambia un nombre de equipo, hay que actualizarlo en los tres lugares.

## Reglas de negocio

- **Costo:** $3,000 MXN por quiniela. Una persona puede comprar varias.
- **Pago:** se hace fuera del sitio en MoneyPool → https://www.moneypool.mx/p/myMV4GY. El admin (Emiliano) confirma a mano desde `/admin` y manda usuario+password por WhatsApp.
- **Sistema de puntos:**
  - **5 pts** si aciertas el **marcador exacto** (NO se suman los 3 aparte).
  - **3 pts** si aciertas sólo el **ganador o empate**.
  - 0 pts si fallas o si no pronosticaste.
  - Sólo cuenta el marcador al minuto 90 (no tiempo extra ni penales).
- **Pronósticos:**
  - Se pueden editar hasta el segundo en que arranca el partido. Después se bloquean (lo valida el server, no sólo el cliente).
  - Auto-guardado: cuando ambos campos tienen valor, se guarda solo con debounce de 800ms.
- **Premios (de la bolsa total):**
  - 1er lugar: **56%**
  - 2do lugar: **23%**
  - 3er lugar: **14%**
  - Comisión organizador: **7%**
  - Suma 100%.
- **Desempate en el ranking:** más marcadores exactos → más aciertos de ganador → reparto en partes iguales.
- **Cierre de inscripciones:** 10 de junio 2026 (un día antes del partido inaugural). Se aceptan tardías pero sólo cuentan partidos que aún no inician.

## Modelo de datos (Supabase)

Las tablas y columnas se infieren del código (no hay archivo de migraciones en el repo).

- **usuarios** — `id`, `nombre`, `email` (único), `telefono` (int), `cantidad_quinielas`, `total_pagado`, `estado` (`Pendiente_Pago` | `Activo` | `Rechazado`), `usuario` (login generado: email-sin-@ + id), `password` (texto plano, ojo), `fecha_registro`, `fecha_aprobacion`.
- **quinielas** — `id`, `usuario_id` (FK), `nombre` (ej. "Juan #2"), `estado` (`Pagada`), `puntos`, `posicion`. Se crean N quinielas al aprobar al usuario.
- **partidos** — `id`, `fase`, `grupo`, `local`, `visitante`, `fecha_hora` (timestamptz), `estado` (`Programado` | `Finalizado`), `goles_local`, `goles_visitante`.
- **pronosticos** — `quiniela_id`, `partido_id`, `goles_local`, `goles_visitante`. Único por par `(quiniela_id, partido_id)` — se hace `upsert` con `onConflict`.
- **pagos** — `usuario_id`, `monto`, `estado` (`Pendiente` | `Confirmado` | `Rechazado`), `fecha_confirmacion`.
- **puntuaciones** — `quiniela_id`, `partido_id`, `puntos`, `tipo` (`Marcador exacto` | `Ganador acertado` | `Sin acierto`). Se genera al capturar el resultado del partido.

Cuando se captura un resultado, el handler:
1. Update al partido (goles + `Finalizado`).
2. Borra puntuaciones viejas de ese partido (para permitir recalcular).
3. Inserta una puntuación por cada pronóstico existente.
4. Recalcula el total de puntos de cada quiniela afectada.
5. Recalcula `posicion` de TODAS las quinielas (loop, no SQL).

## Variables de entorno (en Vercel)

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_KEY`

Ambas son la URL pública del proyecto Supabase y la anon key. Si Vercel no las tiene seteadas, el sitio rompe con "Error del servidor".

## URLs y enlaces importantes

- **Producción:** https://quiniela-mundial-2026-rouge-nu.vercel.app
- **MoneyPool (pagos):** https://www.moneypool.mx/p/myMV4GY
- **WhatsApp organizador:** `https://wa.me/525569161882`
- **Panel admin:** `/admin` (¡público, sin login!)
- **Capturar resultados:** `/admin/resultados`
- Repo en GitHub: branch `main` = lo que está en producción.

## Cosas que conviene saber antes de proponer cambios

- **`/admin` no tiene autenticación.** Cualquiera con el link aprueba pagos, ve passwords, elimina usuarios y captura resultados. Antes de tocar nada de admin, vale la pena preguntarle a Emiliano si quiere proteger esa ruta.
- **Las passwords se guardan en texto plano** (`usuarios.password`). El login compara strings tal cual.
- En `pages/api/admin.js` la acción `eliminar` tiene una línea extra (la primera del bloque) que borra puntuaciones por `quiniela_id = usuarioId`, lo cual está mal — pero más abajo ya hace la limpieza correcta usando los IDs reales de las quinielas. Es código redundante, no rompe nada, pero está raro.
- El recálculo de `posicion` recorre TODAS las quinielas con un `UPDATE` por cada una al capturar/borrar resultado. Si crece mucho la base, esto se vuelve lento. Por ahora está bien.
- La hora de México está hardcodeada en `pages/quiniela/[id].js` como `UTC-6` (`offset = -6 * 60`). Mientras siga siendo CDMX, ok.

## Scripts

```
npm run dev     # local en http://localhost:3000
npm run build   # build de producción
npm run start   # arranca el build
```

No hay tests, ni linter configurado, ni CI propio (Vercel hace el build).
