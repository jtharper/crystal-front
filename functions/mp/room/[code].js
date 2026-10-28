// Pages Function: play.crystalfront.fun/mp/room/<CODE> -> the "Room" Durable Object of the crystal-front-mp Worker.
// The binding (ROOMS) is declared in /wrangler.toml; the Worker itself lives in /server.
export async function onRequest({ request, env, params }) {
  if (!env.ROOMS) return new Response('Online play is not connected on this deployment', { status: 503 });
  const code = String(params.code || '').toUpperCase();
  if (!/^[A-Z0-9]{4,8}$/.test(code)) return new Response('Bad room code', { status: 400 });
  return env.ROOMS.get(env.ROOMS.idFromName(code)).fetch(request);
}
