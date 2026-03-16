# Cloudflare Scores and Leaderboard

Novarena pot desplegar la capa remota de scores sense tocar els jocs existents.

## Estructura

- `wrangler.jsonc`
- `functions/api/score.js`
- `functions/api/leaderboard.js`
- `cloudflare/lib/novarena-api.js`
- `cloudflare/schema.sql`

`functions/` queda reservat a rutes reals de Pages Functions. Els helpers compartits van fora, a `cloudflare/lib/`, per evitar confusions amb el routing de Pages.

## Flux

1. Els jocs continuen cridant `Novarena.submitScore(...)`.
2. El SDK decideix si treballa en `local` o `remote`.
3. En `remote`, el SDK envia `POST /api/score`.
4. El leaderboard remot es llegeix amb `GET /api/leaderboard`.
5. Si el remot falla, el SDK conserva fallback local per no bloquejar la plataforma.

## Crear el projecte de Pages

### 1. Crear el projecte

Si el repositori ja existeix:

1. Ves a Cloudflare Dashboard.
2. Obre `Workers & Pages`.
3. Clica `Create application`.
4. Tria `Pages`.
5. Connecta el repositori NOVARENA o fes `Direct Upload`.

Configuracio minima recomanada del projecte:

- Framework preset: `None`
- Build command: cap o `exit 0`
- Build output directory: `.`
- Root directory: buit, o l'arrel del repositori

### 2. Crear la base D1

```bash
npx wrangler d1 create novarena-scores
```

Guarda el `database_id` que et retorna Cloudflare i substitueix el placeholder de [wrangler.jsonc](/c:/Users/alanh/Desktop/CODI%20VS%20Code/NOVARENA/wrangler.jsonc#L1).

### 3. Aplicar l'esquema SQL

```bash
npx wrangler d1 execute novarena-scores --remote --file cloudflare/schema.sql
```

### 4. Lligar D1 al projecte Pages

Opcio A, des del Dashboard:

1. Obre el projecte de Pages.
2. Ves a `Settings`.
3. Obre `Functions`.
4. Afegeix un binding D1 amb el nom `NOVARENA_DB`.
5. Selecciona la base `novarena-scores`.

Opcio B, com a config del repo:

1. Mantingues [wrangler.jsonc](/c:/Users/alanh/Desktop/CODI%20VS%20Code/NOVARENA/wrangler.jsonc#L1) al repo.
2. Omple `database_id`.
3. Quan el projecte es desplegui, Pages llegira aquesta configuracio.

### 5. Desplegar l'arrel del projecte

Cal desplegar l'arrel del projecte. A Pages han d'entrar:

- fitxers HTML estatics
- `assets/`
- `games/`
- `data/`
- `functions/`
- `cloudflare/`
- `wrangler.jsonc`

Si uses `wrangler` amb Pages:

```bash
npx wrangler pages deploy . --project-name novarena
```

## Provar els endpoints

### POST /api/score

```bash
curl -X POST https://novarena.io/api/score ^
  -H "Content-Type: application/json" ^
  -d "{\"game\":\"snake\",\"playerId\":\"guest-test-a\",\"playerName\":\"Guest TEST\",\"score\":320,\"scoreType\":\"points\",\"createdAt\":\"2026-03-16T12:00:00.000Z\"}"
```

### GET /api/leaderboard

Global:

```bash
curl "https://novarena.io/api/leaderboard?limit=10"
```

Per joc:

```bash
curl "https://novarena.io/api/leaderboard?game=snake&limit=10"
```

## Activar el mode remote

El SDK queda preparat per:

- usar `remote` per defecte a `novarena.io`
- usar `local` per defecte a localhost o entorns locals
- funcionar a Pages sense tocar els jocs, perque la base URL remota per defecte es `/api`

Si vols forcar el mode manualment abans de carregar el SDK:

```html
<script>
  window.NovarenaConfig = {
    storageMode: 'remote',
    apiBaseUrl: '/api',
    remoteFallback: true
  };
</script>
```

Per forcar `local`:

```html
<script>
  window.NovarenaConfig = {
    storageMode: 'local'
  };
</script>
```

## Com provar-ho

### Prova 1: score compartida

1. Obre un joc a `novarena.io` en un navegador A.
2. Fes `game over` i envia una score.
3. Obre `leaderboard.html` o el mateix joc en un navegador B o en mode incognit.
4. La score ha d'apareixer tambe al navegador B.

### Prova 2: leaderboard global real

1. Envia scores des de dos navegadors diferents.
2. Obre `leaderboard.html` a un tercer navegador.
3. Si el mode `remote` esta actiu, el ranking ha de mostrar les dues entrades encara que no comparteixin `localStorage`.

## Herencia del model Static Assets Worker

No hi ha cap `_worker.js` ni configuracio de Worker d'assets que sigui necessari conservar per aquesta fase.

Pots ignorar:

- [server.js](/c:/Users/alanh/Desktop/CODI%20VS%20Code/NOVARENA/server.js): nomes serveix com a helper local
- [data/players.json](/c:/Users/alanh/Desktop/CODI%20VS%20Code/NOVARENA/data/players.json): continua sent dada mock/local per altres pantalles, no per al leaderboard remot

Si l'antic desplegament tenia rutes o bindings propis d'un Static Assets Worker al dashboard, no s'han d'aprofitar per aquesta capa nova: l'objectiu ara es Pages + Pages Functions + D1.

## Notes per la fase seguent

- Encara no hi ha login real ni sessions persistents.
- Encara no hi ha deduplicacio per millor score per jugador.
- Encara no hi ha autenticacio del sender de score.
- La capa actual resol nomes score shared + leaderboard shared.
