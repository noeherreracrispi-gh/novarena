// ─── PlayArena · servidor local ──────────────────────────────────────────────
// Executa amb:  node server.js
// Obre:         http://localhost:3000
// ─────────────────────────────────────────────────────────────────────────────
const http = require('http');
const fs   = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT      = 3000;
const DATA_FILE = path.join(__dirname, 'data', 'players.json');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript',
  '.css':  'text/css',
  '.json': 'application/json',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
};

// ── Init ──────────────────────────────────────────────────────────────────────
if (!fs.existsSync(path.join(__dirname, 'data'))) {
  fs.mkdirSync(path.join(__dirname, 'data'));
}
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify({ players: [] }, null, 2), 'utf8');
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function readData() {
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); }
  catch { return { players: [] }; }
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

function sanitizePlayer(player) {
  return {
    name: player.name,
    registeredAt: player.registeredAt,
    scores: player.scores || {}
  };
}

function hashSecret(secret, saltHex) {
  const salt = saltHex ? Buffer.from(saltHex, 'hex') : crypto.randomBytes(16);
  const hash = crypto.scryptSync(secret, salt, 64);
  return {
    salt: salt.toString('hex'),
    hash: hash.toString('hex')
  };
}

function verifySecret(secret, saltHex, expectedHex) {
  if (!saltHex || !expectedHex) return false;
  const { hash } = hashSecret(secret, saltHex);
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(expectedHex, 'hex'));
}

function issueSession(player) {
  const token = crypto.randomBytes(24).toString('hex');
  const tokenPair = hashSecret(token);
  player.auth = {
    ...(player.auth || {}),
    tokenSalt: tokenPair.salt,
    tokenHash: tokenPair.hash,
    tokenIssuedAt: new Date().toISOString()
  };
  return token;
}

function setCORS(res) {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function sendJSON(res, status, payload) {
  setCORS(res);
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload, null, 2));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', chunk => raw += chunk);
    req.on('end', () => { try { resolve(JSON.parse(raw)); } catch { reject(); } });
    req.on('error', reject);
  });
}

// ── Server ────────────────────────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  const u        = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = u.pathname;

  setCORS(res);

  // Preflight
  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }

  // ── GET /api/players ──
  if (pathname === '/api/players' && req.method === 'GET') {
    const data = readData();
    return sendJSON(res, 200, { players: (data.players || []).map(sanitizePlayer) });
  }

  // ── POST /api/players — registra o actualitza un jugador ──
  if (pathname === '/api/players' && req.method === 'POST') {
    try {
      const { name, password } = await readBody(req);
      if (!name || !name.trim()) return sendJSON(res, 400, { error: 'Cal un nom' });
      if (!password || typeof password !== 'string' || password.trim().length < 4) {
        return sendJSON(res, 400, { error: 'La contrasenya ha de tenir almenys 4 caràcters' });
      }

      const trimmed = name.trim().slice(0, 16);
      const secret  = password.trim();
      const data    = readData();
      let player    = data.players.find(p => p.name.toLowerCase() === trimmed.toLowerCase());
      let isNew     = false;

      if (!player) {
        const passPair = hashSecret(secret);
        player = {
          name:         trimmed,
          registeredAt: new Date().toISOString(),
          scores:       {},
          auth: {
            passwordSalt: passPair.salt,
            passwordHash: passPair.hash
          }
        };
        const token = issueSession(player);
        data.players.push(player);
        writeData(data);
        console.log(`[+] Nou jugador: ${trimmed}`);
        isNew = true;
        return sendJSON(res, 200, { player: sanitizePlayer(player), isNew, token });
      }

      if (!player.auth?.passwordHash || !player.auth?.passwordSalt) {
        const passPair = hashSecret(secret);
        player.auth = {
          ...(player.auth || {}),
          passwordSalt: passPair.salt,
          passwordHash: passPair.hash
        };
        const token = issueSession(player);
        writeData(data);
        return sendJSON(res, 200, { player: sanitizePlayer(player), isNew: false, token, claimed: true });
      }

      if (!verifySecret(secret, player.auth.passwordSalt, player.auth.passwordHash)) {
        return sendJSON(res, 401, { error: 'Contrasenya incorrecta per a aquest nom' });
      }

      const token = issueSession(player);
      writeData(data);
      return sendJSON(res, 200, { player: sanitizePlayer(player), isNew, token });
    } catch {
      return sendJSON(res, 400, { error: 'Petició invàlida' });
    }
  }

  // ── POST /api/scores — desa una puntuació ──
  if (pathname === '/api/scores' && req.method === 'POST') {
    try {
      const { name, game, score, token } = await readBody(req);
      if (!name || !game || score === undefined) return sendJSON(res, 400, { error: 'name, game i score són obligatoris' });

      const data   = readData();
      const player = data.players.find(p => p.name.toLowerCase() === name.trim().toLowerCase());

      if (!player) return sendJSON(res, 404, { error: 'Jugador no trobat' });
      if (player.auth?.passwordHash) {
        if (!token || !verifySecret(token, player.auth.tokenSalt, player.auth.tokenHash)) {
          return sendJSON(res, 401, { error: 'Sessió invàlida. Torna a iniciar sessió al portal.' });
        }
      }

      if (!player.scores[game] || score > player.scores[game].best) {
        player.scores[game] = { best: score, updatedAt: new Date().toISOString() };
        writeData(data);
        console.log(`[★] ${player.name} → ${game}: ${score}`);
      }

      return sendJSON(res, 200, { player: sanitizePlayer(player) });
    } catch {
      return sendJSON(res, 400, { error: 'Petició invàlida' });
    }
  }

  // ── Fitxers estàtics ──
  let filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);

  // Seguretat: evitar path traversal
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403); res.end('Forbidden'); return;
  }

  fs.readFile(filePath, (err, content) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(content);
  });
});

server.listen(PORT, () => {
  console.log('');
  console.log('  🎮  PlayArena  →  http://localhost:' + PORT);
  console.log('  📁  Dades     →  ' + DATA_FILE);
  console.log('');
});
