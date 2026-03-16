# Novarena Game Development

Aquesta guia defineix el contracte minim per als jocs que es vulguin integrar a Novarena.

## Estructura obligatoria

Cada joc ha de viure a:

```text
/games/<game-id>/
```

I ha de contenir com a minim:

```text
/games/<game-id>/
  index.html
  game.js
  game.json
```

`style.css` es recomana quan el joc te estil propi.

## Regles comunes

- Cada joc ha de carregar `../../assets/js/novarena-sdk.js`.
- Cada joc ha de tenir un `game.json` local amb la seva metadata basica.
- Els jocs no han d'implementar el seu propi login.
- El jugador base de la plataforma es resol des del SDK amb un perfil local o guest.
- Les puntuacions s'han d'enviar sempre via `Novarena.submitScore()`.
- Els jocs han de ser compatibles amb hosting estatic.
- No s'han d'afegir dependencias noves ni backend propi dins del joc.

## SDK v1

El fitxer compartit es:

```text
/assets/js/novarena-sdk.js
```

Funcions disponibles:

- `Novarena.getPlayer()`
  Retorna el jugador actual de plataforma. En v1 es un perfil guest guardat en localStorage.

- `Novarena.getLanguage()`
  Retorna l'idioma actual de la plataforma. Prioritza `novarena_language` i, si no existeix, usa l'idioma del document o del navegador.

- `Novarena.getGameContext(gameId)`
  Retorna una `Promise` amb la metadata del joc. Intenta llegir primer `games/<game-id>/game.json` i, si no el troba, fa fallback a `data/games.json`.

- `Novarena.submitScore(payload)`
  Desa una puntuacio en el magatzem comu de plataforma a localStorage.

- `Novarena.getLeaderboard(gameId)`
  Retorna el ranking local d'un joc ordenat de mes puntuacio a menys.

## Model de score comu

Totes les puntuacions guardades per la plataforma han de seguir aquest format:

```json
{
  "game": "snake",
  "playerId": "guest-7f2c4a1b",
  "playerName": "Guest 7F2C",
  "score": 320,
  "scoreType": "points",
  "createdAt": "2026-03-15T18:00:00.000Z"
}
```

Camps obligatoris:

- `game`
- `playerId`
- `playerName`
- `score`
- `scoreType`
- `createdAt`

## game.json recomanat

Exemple minim:

```json
{
  "id": "snake",
  "title": "Snake",
  "description": "Menja, creix i no et tanquis.",
  "path": "games/snake/index.html",
  "thumbnail": "assets/img/game-snake.svg",
  "category": "Classic",
  "scoreType": "points"
}
```

## Integracio minima d'un joc

1. Crear la carpeta del joc a `/games/<game-id>/`.
2. Afegir `index.html`, `game.js`, `game.json` i, si cal, `style.css`.
3. Carregar el SDK compartit.
4. Obtenir el context amb `Novarena.getGameContext(gameId)` si el joc necessita metadata.
5. Enviar la puntuacio final amb `Novarena.submitScore({ game, score, scoreType })`.
6. Si el joc necessita un top local, usar `Novarena.getLeaderboard(gameId)`.

## Bones practiques

- Mantingues la logica del joc dins de `game.js`.
- Deixa el `index.html` el mes net possible.
- Reutilitza el contracte comu en lloc de crear claus locals noves per a ranking, jugador o idioma.
- Si el joc te una millor puntuacio local visual, es pot conservar, pero la plataforma ha de continuar rebent la score final via SDK.
