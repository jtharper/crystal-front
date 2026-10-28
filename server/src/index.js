// Crystal Front online relay.
// Each game room is a Durable Object holding the two players' WebSockets. It does not run the game:
// both browsers simulate the same battle from the same commands (lockstep), and the room only passes
// those small messages between them, in order.
//
//   GET /mp/room/<CODE>?role=host   first player, creates the room
//   GET /mp/room/<CODE>?role=join   second player
import { DurableObject } from 'cloudflare:workers';

const CODE_RE = /^\/mp\/room\/([A-Z0-9]{4,8})$/;

function originAllowed(req, env) {
  const o = req.headers.get('Origin');
  if (!o) return true; // non-browser clients (tests)
  let host;
  try { host = new URL(o).hostname; } catch { return false; }
  return String(env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean)
    .some(a => (a.startsWith('.') ? host.endsWith(a) : host === a));
}

export class Room extends DurableObject {
  async fetch(req) {
    if (req.headers.get('Upgrade') !== 'websocket') return new Response('Expected a WebSocket', { status: 426 });
    const url = new URL(req.url);
    const role = url.searchParams.get('role') === 'host' ? 'host' : 'join';
    const slots = new Set(this.ctx.getWebSockets().map(ws => (ws.deserializeAttachment() || {}).slot));

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    // refuse politely: accept, explain, close (browsers can't read the reason of a failed handshake)
    const refuse = (msg) => {
      server.accept();
      server.send(JSON.stringify({ t: 'err', msg }));
      server.close(4000, msg);
      return new Response(null, { status: 101, webSocket: client });
    };
    let slot;
    if (role === 'host') {
      if (slots.size) return refuse('That room code is already in use. Create a new game.');
      slot = 0;
    } else {
      if (!slots.has(0)) return refuse('No game with that code. Check the code and try again.');
      if (slots.has(1)) return refuse('That game already has two players.');
      slot = 1;
    }
    this.ctx.acceptWebSocket(server, ['s' + slot]);
    server.serializeAttachment({ slot });
    server.send(JSON.stringify({ t: 'hello', slot }));
    if (slot === 1) for (const h of this.ctx.getWebSockets('s0')) try { h.send(JSON.stringify({ t: 'peer' })); } catch {}
    return new Response(null, { status: 101, webSocket: client });
  }

  // relay every message to the other player, unchanged and in order
  webSocketMessage(ws, msg) {
    const me = (ws.deserializeAttachment() || {}).slot;
    if (typeof msg === 'string' && msg === 'ping') { try { ws.send('pong'); } catch {} return; }
    for (const o of this.ctx.getWebSockets('s' + (1 - me))) try { o.send(msg); } catch {}
  }

  webSocketClose(ws, code, reason) { this.leave(ws); }
  webSocketError(ws) { this.leave(ws); }
  leave(ws) {
    const me = (ws.deserializeAttachment() || {}).slot;
    for (const o of this.ctx.getWebSockets('s' + (1 - me))) try { o.send(JSON.stringify({ t: 'left' })); } catch {}
    try { ws.close(1000, 'bye'); } catch {}
  }
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const m = url.pathname.match(CODE_RE);
    if (!m) return new Response('Crystal Front relay', { status: 404 });
    if (!originAllowed(req, env)) return new Response('Forbidden', { status: 403 });
    return env.ROOMS.get(env.ROOMS.idFromName(m[1])).fetch(req);
  },
};
