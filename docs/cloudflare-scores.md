# Cloudflare Scores and Leaderboard

Novarena pot desplegar la capa remota de scores sense tocar els jocs existents.

## Estructura

- `functions/api/score.js`
- `functions/api/leaderboard.js`
- `functions/_shared/novarena-api.js`
- `cloudflare/schema.sql`

`functions/` esta pensat per Cloudflare Pages Functions, que corre sobre Workers runtime i encaixa be amb el hosting static actual.

## Flux

1. Els jocs continuen cridant `Novarena.submitScore(...)`.
2. El SDK decideix si treballa en `local` o `remote`.
3. En `remote`, el SDK envia `POST /api/score`.
4. El leaderboard remot es llegeix amb `GET /api/leaderboard`.
5. Si el remot falla, el SDK conserva fallback local per no bloquejar la plataforma.

## Desplegament a Cloudflare

### 1. Crear la base D1

```bash
npx wrangler d1 create novarena-scores
```

Guarda el `database_id` que et retorna Cloudflare.

### 2. Aplicar l'esquema SQL

```bash
npx wrangler d1 execute novarena-scores --remote --file cloudflare/schema.sql
```

### 3. Lligar D1 al projecte

Si `novarena.io` ja viu a Cloudflare Pages:

1. Obre el projecte a Cloudflare Pages.
2. Ves a `Settings`.
3. Obre `Functions`.
4. Afegeix un binding D1 amb el nom `NOVARENA_DB`.
5. Selecciona la base `novarena-scores`.

### 4. Desplegar els fitxers

Cal desplegar l'arrel del projecte, incloent:

- fitxers HTML estatics
- `assets/`
- `games/`
- `data/`
- `functions/`

Si uses `wrangler` amb Pages:

```bash
npx wrangler pages deploy . --project-name novarena
```

## Activar el mode remote

El SDK queda preparat per:

- usar `remote` per defecte a `novarena.io`
- usar `local` per defecte a localhost o entorns locals

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

## Notes per la fase seguent

- Encara no hi ha login real ni sessions persistents.
- Encara no hi ha deduplicacio per millor score per jugador.
- Encara no hi ha autenticacio del sender de score.
- La capa actual resol nomes score shared + leaderboard shared.
