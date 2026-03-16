var SUPPORTED_LANGUAGES = ['ca', 'es', 'en', 'it'];
var LANGUAGE_STORAGE_KEY = 'novarena_language';
var CURRENT_LANGUAGE = 'en';

var I18N = {
  ca: {
    aria: {
      backHome: 'Torna a la portada de Novarena',
      language: 'Canvia idioma',
      nav: 'Navegacio principal'
    },
    nav: {
      home: 'Home',
      games: 'Jocs',
      leaderboard: 'Classificacio',
      profile: 'Perfil',
      community: 'Comunitat'
    },
    brand: {
      home: 'Portal de jocs',
      games: 'Cataleg de jocs',
      leaderboard: 'Classificacio',
      profile: 'Perfil',
      community: 'Comunitat'
    },
    common: {
      play: 'Jugar',
      playNow: 'Jugar ara',
      viewAllGames: 'Veure tots els jocs',
      openLeaderboard: 'Obrir leaderboard',
      loadingGames: 'Carregant jocs...',
      loadingLeaderboard: 'Carregant leaderboard...',
      loadingTopPlayers: 'Carregant top players...',
      emptyLeaderboard: 'Encara no hi ha puntuacions guardades.',
      emptyTopPlayers: 'Encara no hi ha top players guardats. La primera gran partida pot ser la teva.',
      position: 'Posicio',
      player: 'Jugador',
      bestAt: 'Millor a',
      noScores: 'Sense puntuacions'
    },
    gamesData: {
      tetris: {
        description: 'Col.loca les peces, completa linies i aguanta la pressio partida rere partida.',
        category: 'Puzzle'
      },
      snake: {
        description: 'Menja, creix i no et tanquis. El classic continua sent una maquina de reflexos.',
        category: 'Classic'
      },
      runner3d: {
        description: 'Corre per una pista neon, esquiva obstacles i intenta allargar la partida al maxim.',
        category: 'Runner'
      },
      'break-block': {
        description: 'Rebota la pilota, neteja la pantalla i mantingues el ritme de l\'arcade.',
        category: 'Arcade'
      }
    },
    home: {
      hero: {
        title: 'Juga. Competeix.',
        accent: 'Puja al ranking.',
        tagline: 'Tria joc, entra en partida i torna per superar la teva millor marca.',
        gamesSuffix: 'jocs',
        statRecords: 'Records actius',
        statArcade: 'Arcade modern'
      },
      pulse: {
        title: 'Entra i juga en segons',
        body: 'Classics, reflexos i ritme arcade des de la portada, sense donar voltes.'
      },
      jump: {
        eyebrow: 'Salta directe',
        title: 'Obre un joc ara mateix'
      },
      featured: {
        eyebrow: 'Jocs destacats',
        title: 'Comenca per aqui'
      },
      top: {
        eyebrow: 'Top players',
        title: 'Els 5 que marquen el ritme'
      },
      activity: {
        eyebrow: 'Activitat',
        title: 'Novetats de Novarena',
        runner: {
          title: 'Runner 3D arriba a Novarena',
          body: 'La pista neon ja forma part del cataleg i dona mes velocitat a la plataforma.',
          meta: 'Nou destacat'
        },
        snake: {
          title: 'Snake continua dominant el ranking',
          body: 'El classic segueix sent un dels punts d\'entrada mes forts per a sessions rapides.',
          meta: 'Ara mateix'
        },
        breakblock: {
          title: 'Break Block es el joc mes addictiu',
          body: 'Una vegada entres, es facil acabar dient una altra partida i prou.',
          meta: 'Favorit arcade'
        }
      },
      final: {
        eyebrow: 'Entra a l\'arena',
        title: 'Tot preparat per jugar i competir.',
        body: 'Explora el cataleg complet o mira el leaderboard per veure qui esta dominant Novarena.'
      },
      footer: 'Una home pensada per comencar a jugar en menys de 3 segons.',
      featuredCards: {
        tetris: 'El classic de peces i reflexos per entrar a l\'arena des del primer segon.',
        snake: 'Ritme, memoria i precisio en una partida rapida que sempre demana una altra.',
        runner3d: 'Velocitat neon i obstacles constants per qui vol sensacio de cursa immediata.',
        'break-block': 'Arcade directe, rebot addictiu i ganes de netejar la pantalla una vegada mes.'
      }
    },
    pages: {
      games: {
        eyebrow: 'Tria i juga',
        title: 'Explora els jocs',
        body: 'Obre un joc, entra en partida i comenca a pujar al ranking en segons.',
        cta: 'Veure jocs',
        countSuffix: 'jocs',
        accent: 'llestos per jugar.',
        bodyLead: 'Obre un joc, entra en partida i comenca a pujar al ranking en segons.',
        bodyTail: 'Troba el teu proxim repte sense perdre temps en explicacions.',
        library: 'Biblioteca',
        availableSuffix: 'jocs disponibles',
        footer: 'Un cataleg pensat per trobar partida rapida i tornar-hi quan vulguis.'
      },
      leaderboard: {
        eyebrow: 'Leaderboard',
        title: 'Leaderboard',
        accent: 'de Novarena.',
        bodyLead: 'Consulta qui domina la plataforma',
        bodyTail: 'i compara els millors resultats globals, d\'avui o de la setmana.',
        footer: 'Segueix el ritme de la competicio i mira qui esta pujant mes fort.'
      },
      profile: {
        eyebrow: 'Jugador actual',
        title: 'Perfil',
        accent: 'de jugador.',
        body: 'Consulta el teu nom, les teves millors puntuacions i l\'activitat recent en un sol lloc.',
        cards: {
          identityTitle: 'Identitat',
          identityBody: 'Nom public, avatar i presentacio curta del jugador.',
          progressTitle: 'Progressio',
          progressBody: 'Historial de punts, jocs preferits i objectius desbloquejats.',
          settingsTitle: 'Configuracio',
          settingsBody: 'Base per a preferencies, privacitat i connexio amb la comunitat.'
        },
        footer: 'El teu espai per seguir progres, resultats i reptes actius.'
      },
      community: {
        eyebrow: 'Comunitat',
        title: 'Comunitat',
        accent: 'en moviment.',
        body: 'Segueix novetats, reptes destacats i espais de participacio per mantenir Novarena viva.',
        cards: {
          challengesTitle: 'Reptes',
          challengesBody: 'Base per a reptes de la setmana i partides destacades.',
          updatesTitle: 'Novetats',
          updatesBody: 'Espai per anunciar nous jocs, actualitzacions i millores del portal.',
          participationTitle: 'Participacio',
          participationBody: 'Base per a suggeriments, comentaris i activitats de comunitat.'
        },
        footer: 'Un espai per connectar el que passa a Novarena amb la seva comunitat.'
      }
    }
  },
  es: {
    aria: {
      backHome: 'Volver a la portada de Novarena',
      language: 'Cambiar idioma',
      nav: 'Navegacion principal'
    },
    nav: {
      home: 'Inicio',
      games: 'Juegos',
      leaderboard: 'Clasificacion',
      profile: 'Perfil',
      community: 'Comunidad'
    },
    brand: {
      home: 'Portal de juegos',
      games: 'Catalogo de juegos',
      leaderboard: 'Clasificacion',
      profile: 'Perfil',
      community: 'Comunidad'
    },
    common: {
      play: 'Jugar',
      playNow: 'Jugar ahora',
      viewAllGames: 'Ver todos los juegos',
      openLeaderboard: 'Abrir leaderboard',
      loadingGames: 'Cargando juegos...',
      loadingLeaderboard: 'Cargando leaderboard...',
      loadingTopPlayers: 'Cargando top players...',
      emptyLeaderboard: 'Todavia no hay puntuaciones guardadas.',
      emptyTopPlayers: 'Todavia no hay top players guardados. La primera gran partida puede ser la tuya.',
      position: 'Posicion',
      player: 'Jugador',
      bestAt: 'Mejor en',
      noScores: 'Sin puntuaciones'
    },
    gamesData: {
      tetris: {
        description: 'Coloca las piezas, completa lineas y aguanta la presion partida tras partida.',
        category: 'Puzzle'
      },
      snake: {
        description: 'Come, crece y no te encierres. El clasico sigue siendo una maquina de reflejos.',
        category: 'Clasico'
      },
      runner3d: {
        description: 'Corre por una pista neon, esquiva obstaculos e intenta alargar la partida al maximo.',
        category: 'Runner'
      },
      'break-block': {
        description: 'Haz rebotar la pelota, limpia la pantalla y manten el ritmo del arcade.',
        category: 'Arcade'
      }
    },
    home: {
      hero: {
        title: 'Juega. Compite.',
        accent: 'Sube al ranking.',
        tagline: 'Elige juego, entra en partida y vuelve para superar tu mejor marca.',
        gamesSuffix: 'juegos',
        statRecords: 'Records activos',
        statArcade: 'Arcade moderno'
      },
      pulse: {
        title: 'Entra y juega en segundos',
        body: 'Clasicos, reflejos y ritmo arcade desde la portada, sin rodeos.'
      },
      jump: {
        eyebrow: 'Salta directo',
        title: 'Abre un juego ahora mismo'
      },
      featured: {
        eyebrow: 'Juegos destacados',
        title: 'Empieza por aqui'
      },
      top: {
        eyebrow: 'Top players',
        title: 'Los 5 que marcan el ritmo'
      },
      activity: {
        eyebrow: 'Actividad',
        title: 'Novedades de Novarena',
        runner: {
          title: 'Runner 3D llega a Novarena',
          body: 'La pista neon ya forma parte del catalogo y da mas velocidad a la plataforma.',
          meta: 'Nuevo destacado'
        },
        snake: {
          title: 'Snake sigue dominando el ranking',
          body: 'El clasico sigue siendo uno de los puntos de entrada mas fuertes para sesiones rapidas.',
          meta: 'Ahora mismo'
        },
        breakblock: {
          title: 'Break Block es el juego mas adictivo',
          body: 'Una vez entras, es facil acabar diciendo una partida mas y ya esta.',
          meta: 'Favorito arcade'
        }
      },
      final: {
        eyebrow: 'Entra en la arena',
        title: 'Todo preparado para jugar y competir.',
        body: 'Explora el catalogo completo o mira el leaderboard para ver quien domina Novarena.'
      },
      footer: 'Una home pensada para empezar a jugar en menos de 3 segundos.',
      featuredCards: {
        tetris: 'El clasico de piezas y reflejos para entrar en la arena desde el primer segundo.',
        snake: 'Ritmo, memoria y precision en una partida rapida que siempre pide otra.',
        runner3d: 'Velocidad neon y obstaculos constantes para quien quiere sensacion de carrera inmediata.',
        'break-block': 'Arcade directo, rebote adictivo y ganas de limpiar la pantalla una vez mas.'
      }
    },
    pages: {
      games: {
        eyebrow: 'Elige y juega',
        title: 'Explora los juegos',
        body: 'Abre un juego, entra en partida y empieza a subir en el ranking en segundos.',
        cta: 'Ver juegos',
        countSuffix: 'juegos',
        accent: 'listos para jugar.',
        bodyLead: 'Abre un juego, entra en partida y empieza a subir en el ranking en segundos.',
        bodyTail: 'Encuentra tu siguiente reto sin perder tiempo en explicaciones.',
        library: 'Biblioteca',
        availableSuffix: 'juegos disponibles',
        footer: 'Un catalogo pensado para encontrar partida rapida y volver cuando quieras.'
      },
      leaderboard: {
        eyebrow: 'Leaderboard',
        title: 'Clasificacion',
        accent: 'de Novarena.',
        bodyLead: 'Consulta quien domina la plataforma',
        bodyTail: 'y compara los mejores resultados globales, de hoy o de la semana.',
        footer: 'Sigue el ritmo de la competicion y mira quien esta subiendo con mas fuerza.'
      },
      profile: {
        eyebrow: 'Jugador actual',
        title: 'Perfil',
        accent: 'de jugador.',
        body: 'Consulta tu nombre, tus mejores puntuaciones y la actividad reciente en un solo lugar.',
        cards: {
          identityTitle: 'Identidad',
          identityBody: 'Nombre publico, avatar y presentacion corta del jugador.',
          progressTitle: 'Progresion',
          progressBody: 'Historial de puntos, juegos favoritos y objetivos desbloqueados.',
          settingsTitle: 'Configuracion',
          settingsBody: 'Base para preferencias, privacidad y conexion con la comunidad.'
        },
        footer: 'Tu espacio para seguir progreso, resultados y retos activos.'
      },
      community: {
        eyebrow: 'Comunidad',
        title: 'Comunidad',
        accent: 'en movimiento.',
        body: 'Sigue novedades, retos destacados y espacios de participacion para mantener Novarena viva.',
        cards: {
          challengesTitle: 'Retos',
          challengesBody: 'Base para retos de la semana y partidas destacadas.',
          updatesTitle: 'Novedades',
          updatesBody: 'Espacio para anunciar nuevos juegos, actualizaciones y mejoras del portal.',
          participationTitle: 'Participacion',
          participationBody: 'Base para sugerencias, comentarios y actividad de comunidad.'
        },
        footer: 'Un espacio para conectar lo que pasa en Novarena con su comunidad.'
      }
    }
  },
  en: {
    aria: {
      backHome: 'Return to the Novarena home page',
      language: 'Change language',
      nav: 'Primary navigation'
    },
    nav: {
      home: 'Home',
      games: 'Games',
      leaderboard: 'Leaderboard',
      profile: 'Profile',
      community: 'Community'
    },
    brand: {
      home: 'Game portal',
      games: 'Game catalog',
      leaderboard: 'Leaderboard',
      profile: 'Profile',
      community: 'Community'
    },
    common: {
      play: 'Play',
      playNow: 'Play now',
      viewAllGames: 'View all games',
      openLeaderboard: 'Open leaderboard',
      loadingGames: 'Loading games...',
      loadingLeaderboard: 'Loading leaderboard...',
      loadingTopPlayers: 'Loading top players...',
      emptyLeaderboard: 'There are no saved scores yet.',
      emptyTopPlayers: 'There are no saved top players yet. The first great run could be yours.',
      position: 'Position',
      player: 'Player',
      bestAt: 'Best at',
      noScores: 'No scores'
    },
    gamesData: {
      tetris: {
        description: 'Place the pieces, clear lines and keep the pressure under control round after round.',
        category: 'Puzzle'
      },
      snake: {
        description: 'Eat, grow and do not trap yourself. This classic is still a reflex machine.',
        category: 'Classic'
      },
      runner3d: {
        description: 'Run across a neon track, dodge obstacles and try to keep the run going.',
        category: 'Runner'
      },
      'break-block': {
        description: 'Bounce the ball, clear the screen and keep the arcade rhythm going.',
        category: 'Arcade'
      }
    },
    home: {
      hero: {
        title: 'Play. Compete.',
        accent: 'Climb the leaderboard.',
        tagline: 'Pick a game, jump into a match and come back to beat your best score.',
        gamesSuffix: 'games',
        statRecords: 'Live records',
        statArcade: 'Modern arcade'
      },
      pulse: {
        title: 'Jump in and play in seconds',
        body: 'Classics, reflexes and arcade energy right from the homepage, no detours.'
      },
      jump: {
        eyebrow: 'Jump right in',
        title: 'Open a game right now'
      },
      featured: {
        eyebrow: 'Featured games',
        title: 'Start here'
      },
      top: {
        eyebrow: 'Top players',
        title: 'The 5 players setting the pace'
      },
      activity: {
        eyebrow: 'Activity',
        title: 'What is happening in Novarena',
        runner: {
          title: 'Runner 3D lands on Novarena',
          body: 'The neon track is now part of the catalog and adds more speed to the platform.',
          meta: 'New highlight'
        },
        snake: {
          title: 'Snake keeps owning the leaderboard',
          body: 'The classic is still one of the strongest entry points for fast sessions.',
          meta: 'Right now'
        },
        breakblock: {
          title: 'Break Block is the most addictive game',
          body: 'Once you start, it is easy to say just one more match and keep going.',
          meta: 'Arcade favorite'
        }
      },
      final: {
        eyebrow: 'Enter the arena',
        title: 'Everything is ready to play and compete.',
        body: 'Explore the full catalog or open the leaderboard to see who is dominating Novarena.'
      },
      footer: 'A homepage designed to get you playing in under 3 seconds.',
      featuredCards: {
        tetris: 'The classic game of pieces and reflexes to enter the arena from the very first second.',
        snake: 'Rhythm, memory and precision in a fast match that always asks for one more try.',
        runner3d: 'Neon speed and constant obstacles for players who want instant racing energy.',
        'break-block': 'Direct arcade action, addictive rebounds and the urge to clear the board once more.'
      }
    },
    pages: {
      games: {
        eyebrow: 'Pick and play',
        title: 'Explore the games',
        body: 'Open a game, jump into a run and start climbing the leaderboard in seconds.',
        cta: 'View games',
        countSuffix: 'games',
        accent: 'ready to play.',
        bodyLead: 'Open a game, jump into a run and start climbing the leaderboard in seconds.',
        bodyTail: 'Find your next challenge without wading through intro text.',
        library: 'Library',
        availableSuffix: 'games available',
        footer: 'A catalog built to get you into a quick match and bring you back for more.'
      },
      leaderboard: {
        eyebrow: 'Leaderboard',
        title: 'Leaderboard',
        accent: 'for Novarena.',
        bodyLead: 'See who is leading the platform',
        bodyTail: 'and compare the best all-time, today and this week results.',
        footer: 'Track the competition and see who is climbing the fastest.'
      },
      profile: {
        eyebrow: 'Current player',
        title: 'Profile',
        accent: 'hub.',
        body: 'Check your name, best scores and recent activity in one place.',
        cards: {
          identityTitle: 'Identity',
          identityBody: 'Public name, avatar and short player intro.',
          progressTitle: 'Progress',
          progressBody: 'Score history, favorite games and unlocked goals.',
          settingsTitle: 'Settings',
          settingsBody: 'Base for preferences, privacy and community connection.'
        },
        footer: 'Your space to follow progress, results and active challenges.'
      },
      community: {
        eyebrow: 'Community',
        title: 'Community',
        accent: 'in motion.',
        body: 'Follow news, highlighted challenges and participation spaces that keep Novarena alive.',
        cards: {
          challengesTitle: 'Challenges',
          challengesBody: 'Base for weekly challenges and featured matches.',
          updatesTitle: 'Updates',
          updatesBody: 'Space to announce new games, updates and portal improvements.',
          participationTitle: 'Participation',
          participationBody: 'Base for suggestions, comments and community activity.'
        },
        footer: 'A place to connect what happens in Novarena with the players around it.'
      }
    }
  },
  it: {
    aria: {
      backHome: 'Torna alla home di Novarena',
      language: 'Cambia lingua',
      nav: 'Navigazione principale'
    },
    nav: {
      home: 'Home',
      games: 'Giochi',
      leaderboard: 'Classifica',
      profile: 'Profilo',
      community: 'Comunita'
    },
    brand: {
      home: 'Portale giochi',
      games: 'Catalogo giochi',
      leaderboard: 'Classifica',
      profile: 'Profilo',
      community: 'Comunita'
    },
    common: {
      play: 'Gioca',
      playNow: 'Gioca ora',
      viewAllGames: 'Vedi tutti i giochi',
      openLeaderboard: 'Apri classifica',
      loadingGames: 'Caricamento giochi...',
      loadingLeaderboard: 'Caricamento classifica...',
      loadingTopPlayers: 'Caricamento top players...',
      emptyLeaderboard: 'Non ci sono ancora punteggi salvati.',
      emptyTopPlayers: 'Non ci sono ancora top players salvati. La prima grande partita potrebbe essere la tua.',
      position: 'Posizione',
      player: 'Giocatore',
      bestAt: 'Migliore in',
      noScores: 'Nessun punteggio'
    },
    gamesData: {
      tetris: {
        description: 'Posiziona i pezzi, completa le linee e reggi la pressione partita dopo partita.',
        category: 'Puzzle'
      },
      snake: {
        description: 'Mangia, cresci e non bloccarti. Il classico resta una macchina di riflessi.',
        category: 'Classico'
      },
      runner3d: {
        description: 'Corri su una pista neon, evita gli ostacoli e prova ad allungare la partita al massimo.',
        category: 'Runner'
      },
      'break-block': {
        description: 'Fai rimbalzare la palla, pulisci lo schermo e mantieni il ritmo arcade.',
        category: 'Arcade'
      }
    },
    home: {
      hero: {
        title: 'Gioca. Competi.',
        accent: 'Sali in classifica.',
        tagline: 'Scegli un gioco, entra in partita e torna per battere il tuo record.',
        gamesSuffix: 'giochi',
        statRecords: 'Record attivi',
        statArcade: 'Arcade moderno'
      },
      pulse: {
        title: 'Entra e gioca in pochi secondi',
        body: 'Classici, riflessi ed energia arcade direttamente dalla home, senza giri inutili.'
      },
      jump: {
        eyebrow: 'Salta dentro',
        title: 'Apri un gioco subito'
      },
      featured: {
        eyebrow: 'Giochi in evidenza',
        title: 'Inizia da qui'
      },
      top: {
        eyebrow: 'Top players',
        title: 'I 5 giocatori che danno il ritmo'
      },
      activity: {
        eyebrow: 'Attivita',
        title: 'Novita di Novarena',
        runner: {
          title: 'Runner 3D arriva su Novarena',
          body: 'La pista neon ora fa parte del catalogo e porta piu velocita alla piattaforma.',
          meta: 'Nuovo highlight'
        },
        snake: {
          title: 'Snake continua a dominare la classifica',
          body: 'Il classico resta uno dei punti di ingresso piu forti per sessioni rapide.',
          meta: 'Adesso'
        },
        breakblock: {
          title: 'Break Block e il gioco piu coinvolgente',
          body: 'Una volta iniziato, e facile dire ancora una partita e continuare.',
          meta: 'Preferito arcade'
        }
      },
      final: {
        eyebrow: 'Entra nell\'arena',
        title: 'Tutto e pronto per giocare e competere.',
        body: 'Esplora il catalogo completo o apri la classifica per vedere chi sta dominando Novarena.'
      },
      footer: 'Una home pensata per iniziare a giocare in meno di 3 secondi.',
      featuredCards: {
        tetris: 'Il classico dei pezzi e dei riflessi per entrare nell\'arena dal primo secondo.',
        snake: 'Ritmo, memoria e precisione in una partita veloce che chiede sempre un altro tentativo.',
        runner3d: 'Velocita neon e ostacoli continui per chi vuole energia da corsa immediata.',
        'break-block': 'Arcade diretto, rimbalzi coinvolgenti e voglia di pulire lo schermo ancora una volta.'
      }
    },
    pages: {
      games: {
        eyebrow: 'Scegli e gioca',
        title: 'Esplora i giochi',
        body: 'Apri un gioco, entra subito in partita e inizia a salire in classifica in pochi secondi.',
        cta: 'Vedi giochi',
        countSuffix: 'giochi',
        accent: 'pronti da giocare.',
        bodyLead: 'Apri un gioco, entra subito in partita e inizia a salire in classifica in pochi secondi.',
        bodyTail: 'Trova la tua prossima sfida senza perdere tempo in spiegazioni.',
        library: 'Biblioteca',
        availableSuffix: 'giochi disponibili',
        footer: 'Un catalogo pensato per trovare una partita veloce e tornare quando vuoi.'
      },
      leaderboard: {
        eyebrow: 'Leaderboard',
        title: 'Classifica',
        accent: 'di Novarena.',
        bodyLead: 'Guarda chi guida la piattaforma',
        bodyTail: 'e confronta i migliori risultati globali, di oggi o della settimana.',
        footer: 'Segui il ritmo della competizione e scopri chi sta salendo piu forte.'
      },
      profile: {
        eyebrow: 'Giocatore attuale',
        title: 'Profilo',
        accent: 'giocatore.',
        body: 'Controlla il tuo nome, i tuoi migliori punteggi e l\'attivita recente in un solo posto.',
        cards: {
          identityTitle: 'Identita',
          identityBody: 'Nome pubblico, avatar e breve presentazione del giocatore.',
          progressTitle: 'Progressione',
          progressBody: 'Storico punteggi, giochi preferiti e obiettivi sbloccati.',
          settingsTitle: 'Impostazioni',
          settingsBody: 'Base per preferenze, privacy e connessione con la community.'
        },
        footer: 'Il tuo spazio per seguire progressi, risultati e sfide attive.'
      },
      community: {
        eyebrow: 'Community',
        title: 'Comunita',
        accent: 'in movimento.',
        body: 'Segui novita, sfide in evidenza e spazi di partecipazione per tenere viva Novarena.',
        cards: {
          challengesTitle: 'Sfide',
          challengesBody: 'Base per sfide della settimana e partite in evidenza.',
          updatesTitle: 'Novita',
          updatesBody: 'Spazio per annunciare nuovi giochi, aggiornamenti e miglioramenti del portale.',
          participationTitle: 'Partecipazione',
          participationBody: 'Base per suggerimenti, commenti e attivita della community.'
        },
        footer: 'Uno spazio per collegare quello che succede in Novarena con la sua community.'
      }
    }
  }
};

function getNestedValue(source, key) {
  return key.split('.').reduce(function (current, part) {
    if (!current || typeof current !== 'object' || !(part in current)) {
      return null;
    }
    return current[part];
  }, source);
}

function resolveLanguage(lang) {
  var normalized = String(lang || '').toLowerCase().split('-')[0];
  return SUPPORTED_LANGUAGES.indexOf(normalized) >= 0 ? normalized : 'en';
}

function getSavedLanguage() {
  try {
    return localStorage.getItem(LANGUAGE_STORAGE_KEY);
  } catch (error) {
    return null;
  }
}

function detectLanguage() {
  var candidates = [];

  if (navigator.languages && navigator.languages.length) {
    candidates = navigator.languages.slice();
  } else if (navigator.language) {
    candidates = [navigator.language];
  }

  for (var i = 0; i < candidates.length; i += 1) {
    var normalized = String(candidates[i] || '').toLowerCase().split('-')[0];
    if (SUPPORTED_LANGUAGES.indexOf(normalized) >= 0) {
      return normalized;
    }
  }

  return 'en';
}

function getCurrentLanguage() {
  return CURRENT_LANGUAGE;
}

function getTranslation(key, lang) {
  var value = getNestedValue(I18N[lang] || {}, key);
  if (value !== null && value !== undefined) {
    return value;
  }

  value = getNestedValue(I18N.en, key);
  return value !== undefined ? value : null;
}

function t(key, fallbackText) {
  var value = getTranslation(key, CURRENT_LANGUAGE);
  return value === null || value === undefined ? fallbackText || null : value;
}

function applyTranslations(lang) {
  CURRENT_LANGUAGE = resolveLanguage(lang);
  document.documentElement.lang = CURRENT_LANGUAGE;

  document.querySelectorAll('[data-i18n]').forEach(function (node) {
    var key = node.dataset.i18n;
    var value = getTranslation(key, CURRENT_LANGUAGE);

    if (value === null || value === undefined) {
      return;
    }

    if (node.dataset.i18nAttr) {
      node.setAttribute(node.dataset.i18nAttr, value);
      return;
    }

    node.textContent = value;
  });
}

function renderLanguageSwitcher() {
  document.querySelectorAll('[data-language-switcher]').forEach(function (switcher) {
    switcher.setAttribute('aria-label', t('aria.language', 'Change language'));
  });

  document.querySelectorAll('.lang-option').forEach(function (button) {
    var isActive = button.dataset.lang === CURRENT_LANGUAGE;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });
}

function setLanguage(lang, persist) {
  var resolved = resolveLanguage(lang);

  applyTranslations(resolved);
  renderLanguageSwitcher();

  if (persist !== false) {
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, resolved);
    } catch (error) {
      // Ignore localStorage failures silently.
    }
  }

  if (typeof renderGames === 'function') {
    renderGames();
  }
  if (typeof renderLeaderboard === 'function') {
    renderLeaderboard();
  }
  if (typeof renderTopPlayers === 'function') {
    renderTopPlayers();
  }
  if (typeof renderCurrentChallenge === 'function') {
    renderCurrentChallenge();
  }
  if (typeof renderHomeActivity === 'function') {
    renderHomeActivity();
  }
  if (typeof renderProfilePage === 'function') {
    renderProfilePage();
  }
  if (typeof renderActivityPage === 'function') {
    renderActivityPage();
  }
}

function initLanguageSelector() {
  document.querySelectorAll('[data-language-switcher]').forEach(function (switcher) {
    if (switcher.dataset.ready === 'true') {
      return;
    }

    switcher.dataset.ready = 'true';
    switcher.querySelectorAll('.lang-option').forEach(function (button) {
      button.addEventListener('click', function () {
        setLanguage(button.dataset.lang, true);
      });
    });
  });
}
