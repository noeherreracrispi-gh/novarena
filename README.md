# Novarena

Estructura base del portal:

- `index.html`: portada principal
- `games.html`: cataleg general
- `leaderboard.html`: base del ranking
- `profile.html`: reserva per al perfil
- `community.html`: reserva per a comunitat
- `assets/`: recursos compartits del portal
- `games/`: un directori per joc, amb els seus fitxers encapsulats
- `data/games.json`: metadades del cataleg
- `data/players.json`: dades de jugadors i puntuacions

Criteri utilitzat:

- El portal viu a l'arrel.
- Els recursos comuns del portal viuen a `assets/`.
- Cada joc mante els seus fitxers propis dins de la seva carpeta sota `games/`.
- Els jocs no s'han reescrit; s'han reubicat per deixar la plataforma preparada per creixer.
