const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");

const ui = {
  score: document.querySelector("#score"),
  warnings: document.querySelector("#warnings"),
  teacherState: document.querySelector("#teacher-state"),
  timeLeft: document.querySelector("#time-left"),
  difficulty: document.querySelector("#difficulty"),
  missionTitle: document.querySelector("#mission-title"),
  missionDescription: document.querySelector("#mission-description"),
  missionPoints: document.querySelector("#mission-points"),
  bonusPoints: document.querySelector("#bonus-points"),
  missionProgress: document.querySelector("#mission-progress"),
  statusMessage: document.querySelector("#status-message"),
  prompt: document.querySelector("#prompt"),
  teacherWarning: document.querySelector("#teacher-warning"),
  teacherJumpscare: document.querySelector("#teacher-jumpscare"),
  teacherJumpscareImage: document.querySelector("#teacher-jumpscare-image"),
  teacherJumpscareCopy: document.querySelector("#teacher-jumpscare-copy"),
  startScreen: document.querySelector("#start-screen"),
  startButton: document.querySelector("#start-button"),
  gameOverScreen: document.querySelector("#game-over-screen"),
  gameOverTitle: document.querySelector("#game-over-title"),
  gameOverReason: document.querySelector("#game-over-reason"),
  finalScore: document.querySelector("#final-score"),
  finalMissions: document.querySelector("#final-missions"),
  finalTime: document.querySelector("#final-time"),
  restartButton: document.querySelector("#restart-button"),
};

const CLASS_DURATION_SECONDS = 300;
const WARNING_TIME_PENALTY_SECONDS = 20;

const keys = {
  KeyW: false,
  KeyA: false,
  KeyS: false,
  KeyD: false,
  ShiftLeft: false,
  ShiftRight: false,
  KeyE: false,
};

const classroom = {
  left: -13.5,
  right: 13.5,
  front: -15.5,
  back: 15.5,
};

const interactables = {
  teacherDesk: { id: "teacherDesk", label: "pupitre del professor", x: 1.6, z: -6.9, radius: 1.3 },
  classmateDesk: { id: "classmateDesk", label: "apunts d'un company", x: 3.1, z: -1.8, radius: 1.2 },
  paperBallDesk: { id: "paperBallDesk", label: "pila de papers", x: -2.8, z: 3.1, radius: 1.2 },
  board: { id: "board", label: "pissarra", x: 0, z: -13.1, radius: 1.3 },
  backpackPair: { id: "backpackPair", label: "dues motxilles", x: -2.2, z: 2.4, radius: 1.35 },
  frontDesk: { id: "frontDesk", label: "notes amb respostes", x: -2.8, z: -1.8, radius: 1.2 },
};

const seatRows = [-2.5, 2.3, 7.1, 11.9];
const seatCols = [-8.2, -2.75, 2.75, 8.2];

const desks = [];
const students = [];
const bags = [];
const boardMarks = [];
const projectiles = [];

let animationFrame = 0;
let lastTime = 0;
let teacherWarningTimeout = 0;
let teacherJumpscareTimeout = 0;

const DEFAULT_JUMPSCARE = {
  imageSrc: "./teacher-jumpscare.svg",
  imageAlt: "Cara del professor enfadat",
  copy: "No t'aixequis sense el meu permis",
  imageFit: "cover",
};

const missionTemplates = [
  {
    id: "teacher-exam",
    title: "Roba l'examen corregit",
    description: "Ves al pupitre del professor i agafa el grapat d'exàmens.",
    difficulty: "Fàcil",
    points: 1800,
    bonus: 700,
    duration: 2.8,
    targetId: "teacherDesk",
  },
  {
    id: "copy-homework",
    title: "Copia els deures",
    description: "Fes una ullada als apunts d'un company abans que es giri.",
    difficulty: "Fàcil",
    points: 250,
    bonus: 100,
    duration: 1.6,
    targetId: "classmateDesk",
  },
  {
    id: "paper-ball",
    title: "Llença una bola de paper",
    description: "Agafa paper i envia'l a un altre alumne sense fer soroll.",
    difficulty: "Mitjana",
    points: 700,
    bonus: 280,
    duration: 1.5,
    targetId: "paperBallDesk",
  },
  {
    id: "draw-board",
    title: "Llença un avió de paper",
    description: "Corre fins a la pissarra i fes-hi un gargot ràpid.",
    difficulty: "Mitjana",
    points: 850,
    bonus: 320,
    duration: 4,
    targetId: "teacherDesk",
  },
  {
    id: "swap-backpacks",
    title: "Canvia dues motxilles",
    description: "Intercanvia les motxilles del mig de l'aula.",
    difficulty: "Difícil",
    points: 1400,
    bonus: 520,
    duration: 1.35,
    targetId: "backpackPair",
  },
  {
    id: "grab-answers",
    title: "Agafa les respostes",
    description: "Pispa unes notes amagades d'un pupitre de davant.",
    difficulty: "Difícil",
    points: 1400,
    bonus: 520,
    duration: 2.4,
    targetId: "frontDesk",
  },
];

const game = {
  running: false,
  ended: false,
  elapsed: 0,
  timeLeft: CLASS_DURATION_SECONDS,
  score: 0,
  warnings: 0,
  missionsCompleted: 0,
  teacherState: "looking",
  teacherStateTimer: 0,
  teacherStateDuration: 4,
  feedbackTimer: 0,
  difficultyLevel: "Calma",
  activeMission: null,
  missionProgress: 0,
  missionNoticeFlag: false,
  currentInteractable: null,
  teacherWarningShown: false,
  awaitingSeatForNextMission: false,
  paperAim: 0,
  paperThrowCooldown: 0,
  paperTargetIndex: -1,
  lastMissionId: "",
  homeworkTargetPool: [],
  homeworkTargetIndex: -1,
  teacherAngryCooldown: 0,
};

const player = {
  seatX: -2.75,
  seatZ: 13.35,
  x: -2.75,
  z: 13.35,
  standing: false,
  facing: 0,
  speed: 4.2,
  runSpeed: 6.2,
  radius: 0.6,
};

const teacher = {
  x: 0,
  z: -7.3,
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function formatTime(seconds) {
  const safeSeconds = Math.max(0, Math.ceil(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const secs = safeSeconds % 60;
  return `${minutes}:${String(secs).padStart(2, "0")}`;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function lerpPoint(a, b, t) {
  return {
    x: lerp(a.x, b.x, t),
    y: lerp(a.y, b.y, t),
  };
}

function quadPoint(quad, u, v) {
  const top = lerpPoint(quad[0], quad[1], u);
  const bottom = lerpPoint(quad[3], quad[2], u);
  return lerpPoint(top, bottom, v);
}

function distance(aX, aZ, bX, bZ) {
  return Math.hypot(aX - bX, aZ - bZ);
}

function applyTimePenalty(seconds) {
  game.elapsed = Math.min(CLASS_DURATION_SECONDS, game.elapsed + seconds);
  game.timeLeft = Math.max(0, CLASS_DURATION_SECONDS - game.elapsed);
  ui.timeLeft.textContent = formatTime(game.timeLeft);
}

function setStatus(message, duration = 2.2) {
  ui.statusMessage.textContent = message;
  game.feedbackTimer = duration;
}

function setTeacherWarning(visible, message = "Atencio: el professor es girara en 4 segons.") {
  if (!ui.teacherWarning) {
    return;
  }

  ui.teacherWarning.textContent = message;
  ui.teacherWarning.classList.toggle("hidden", !visible);
}

function flashTeacherWarning(message, duration = 2200) {
  window.clearTimeout(teacherWarningTimeout);
  setTeacherWarning(true, message);
  teacherWarningTimeout = window.setTimeout(() => {
    setTeacherWarning(false);
  }, duration);
}

function hideTeacherJumpscare() {
  if (!ui.teacherJumpscare) {
    return;
  }

  window.clearTimeout(teacherJumpscareTimeout);
  ui.teacherJumpscare.classList.remove("visible");
  ui.teacherJumpscare.classList.remove("contain-image");
  ui.teacherJumpscare.setAttribute("aria-hidden", "true");
}

function setTeacherJumpscareContent(options = {}) {
  if (!ui.teacherJumpscareImage || !ui.teacherJumpscareCopy) {
    return;
  }

  const { imageSrc, imageAlt, copy, imageFit } = { ...DEFAULT_JUMPSCARE, ...options };
  ui.teacherJumpscareImage.src = imageSrc;
  ui.teacherJumpscareImage.alt = imageAlt;
  ui.teacherJumpscareCopy.textContent = copy;
  ui.teacherJumpscare.classList.toggle("contain-image", imageFit === "contain");
}

function showTeacherJumpscare(options = {}) {
  if (!ui.teacherJumpscare) {
    return;
  }

  const { duration = 2600, ...content } = options;
  setTeacherJumpscareContent(content);
  window.clearTimeout(teacherJumpscareTimeout);
  ui.teacherJumpscare.classList.add("visible");
  ui.teacherJumpscare.setAttribute("aria-hidden", "false");
  teacherJumpscareTimeout = window.setTimeout(() => {
    hideTeacherJumpscare();
  }, duration);
}

function syncTeacherVisualState() {
  document.body.classList.toggle("teacher-writing", game.teacherState === "writing");
  document.body.classList.toggle("teacher-looking", game.teacherState !== "writing");
}

function resizeCanvas() {
  canvas.width = window.innerWidth * Math.min(window.devicePixelRatio || 1, 2);
  canvas.height = window.innerHeight * Math.min(window.devicePixelRatio || 1, 2);
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(Math.min(window.devicePixelRatio || 1, 2), Math.min(window.devicePixelRatio || 1, 2));
}

function project(x, z) {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const depth = clamp((z - classroom.front) / (classroom.back - classroom.front), 0, 1);
  const depthCurve = depth * 0.78 + depth ** 0.95 * 0.22;
  const scale = 0.62 + depthCurve * 1.48;
  return {
    x: width * 0.5 + x * (14 + depthCurve * 22),
    y: 96 + depth * (height - 170),
    scale,
    depth,
  };
}

function getDifficultyPhase() {
  if (game.elapsed < 35) {
    return "Calma";
  }
  if (game.elapsed < 80) {
    return "Neguit";
  }
  return "Caos";
}

function scheduleTeacherState(forcedDuration) {
  const intensity = clamp(game.elapsed / 180, 0, 1);
  const isWritingPhase = game.teacherState === "writing";
  const minTime = isWritingPhase ? lerp(12, 5.5, intensity) : lerp(3, 2, intensity);
  const maxTime = isWritingPhase ? lerp(18, 9, intensity) : lerp(6.4, 4.6, intensity);
  game.teacherStateTimer = 0;
  game.teacherStateDuration = forcedDuration ?? (minTime + Math.random() * (maxTime - minTime));
  game.teacherWarningShown = false;
  setTeacherWarning(false);
}

function buildClassroom() {
  desks.length = 0;
  students.length = 0;
  bags.length = 0;

  let studentIndex = 0;
  seatRows.forEach((z, rowIndex) => {
    seatCols.forEach((x, colIndex) => {
      const seatZ = z + 1.45;
      const desk = { x, z, seatX: x, seatZ };
      desks.push(desk);

      bags.push({
        x,
        z: seatZ + 0.24,
        color: colIndex % 2 === 0 ? "#df6f5f" : "#5f7ce0",
      });

      const isPlayerSeat = rowIndex === seatRows.length - 1 && colIndex === 1;
      if (isPlayerSeat) {
        player.seatX = x;
        player.seatZ = seatZ;
        player.x = x;
        player.z = seatZ;
        return;
      }

      students.push({
        x,
        z: seatZ,
        behavior: ["writing", "reading", "hand", "looking"][studentIndex % 4],
        seed: studentIndex * 0.71,
        reaction: 0,
        suspicionTime: 0,
        sleeping: studentIndex === 5,
      });
      studentIndex += 1;
    });
  });

  game.homeworkTargetPool = students.map((_, index) => index);
}

function chooseMissionTemplate() {
  const availableTemplates = missionTemplates.filter((mission) => mission.id !== game.lastMissionId);
  const source = availableTemplates.length > 0 ? availableTemplates : missionTemplates;
  const weights = source.map((mission) => {
    if (mission.id === "teacher-exam") {
      return game.elapsed < 50 ? 0.35 : 2.9;
    }
    if (mission.difficulty === "Fàcil") {
      return game.elapsed < 40 ? 3 : 1.2;
    }
    if (mission.difficulty === "Mitjana") {
      return game.elapsed < 20 ? 1 : game.elapsed < 80 ? 2.3 : 1.9;
    }
    return game.elapsed < 50 ? 0.5 : 2.5;
  });

  const total = weights.reduce((sum, value) => sum + value, 0);
  let roll = Math.random() * total;
  for (let i = 0; i < source.length; i += 1) {
    roll -= weights[i];
    if (roll <= 0) {
      return source[i];
    }
  }
  return source[0];
}

function activateMission() {
  const template = chooseMissionTemplate();
  let target = interactables[template.targetId];

  if (isThrowMission(template.id)) {
    game.paperAim = 0;
    game.paperThrowCooldown = 0;
    target = null;
    if (template.id === "paper-ball" && students.length > 0) {
      game.paperTargetIndex = Math.floor(Math.random() * students.length);
    } else {
      game.paperTargetIndex = -1;
    }
  } else if (isGuidedPlaneMission(template.id)) {
    game.paperThrowCooldown = 0;
    game.paperTargetIndex = -1;
    target = null;
  } else if (template.id === "copy-homework" && students.length > 0) {
    game.paperTargetIndex = -1;
    if (game.homeworkTargetPool.length === 0) {
      game.homeworkTargetPool = students.map((_, index) => index).filter((index) => index !== game.homeworkTargetIndex);
    }

    const poolIndex = Math.floor(Math.random() * game.homeworkTargetPool.length);
    game.homeworkTargetIndex = game.homeworkTargetPool.splice(poolIndex, 1)[0];
    const targetStudent = students[game.homeworkTargetIndex];
    interactables.classmateDesk.x = targetStudent.x;
    interactables.classmateDesk.z = targetStudent.z;
    target = interactables.classmateDesk;
  } else {
    game.paperTargetIndex = -1;
  }

  game.activeMission = {
    ...template,
    target,
  };
  game.missionProgress = 0;
  game.missionNoticeFlag = false;
  game.currentInteractable = null;

  ui.missionTitle.textContent = template.title;
  ui.missionDescription.textContent =
    template.id === "draw-board"
      ? "Prem E per llencar l'avio i guia'l amb WASD fins al professor."
      : template.description;
  ui.missionPoints.textContent = `${template.points} punts`;
  ui.bonusPoints.textContent = `Bonus ${template.bonus}`;
  ui.missionProgress.style.width = "0%";
}

function completeMission() {
  if (!game.activeMission) {
    return;
  }

  const mission = game.activeMission;
  game.lastMissionId = mission.id;
  let reward = mission.points;
  if (!game.missionNoticeFlag) {
    reward += mission.bonus;
    setStatus(`Missió completada. Bonus discret +${mission.bonus}!`, 2.7);
  } else {
    setStatus(`Missió completada. +${mission.points} punts.`, 2.3);
  }

  game.score += reward;
  game.missionsCompleted += 1;
  ui.score.textContent = `${game.score}`;

  if (mission.id === "swap-backpacks" && bags[5] && bags[6]) {
    const temp = bags[5].color;
    bags[5].color = bags[6].color;
    bags[6].color = temp;
  }

  game.activeMission = null;
  game.currentInteractable = null;
  game.missionProgress = 0;
  game.paperTargetIndex = -1;
  game.paperThrowCooldown = 0;
  ui.missionProgress.style.width = "0%";

  window.setTimeout(() => {
    if (game.running && !game.ended) {
      activateMission();
    }
  }, 650);
}

function endGame(title, reason) {
  game.running = false;
  game.ended = true;
  ui.gameOverTitle.textContent = title;
  ui.gameOverReason.textContent = reason;
  ui.finalScore.textContent = `${game.score}`;
  ui.finalMissions.textContent = `${game.missionsCompleted}`;
  ui.finalTime.textContent = `${Math.floor(game.elapsed)}s`;
  ui.gameOverScreen.classList.add("visible");
}

function evaluateTeacherCatch() {
  if (!player.standing) {
    setStatus("Has passat desapercebut.", 1.4);
    return;
  }

  const seatDistance = distance(player.x, player.z, player.seatX, player.seatZ);
  const missionRisk = game.activeMission && game.missionProgress > 0.05;

  if (missionRisk) {
    showTeacherJumpscare();
    endGame("Enxampat en plena missió", "El professor t'ha vist fent trapelleries. Cap a direcció.");
    return;
  }

  showTeacherJumpscare();
  game.warnings += 1;
  if (game.warnings >= 2) {
    endGame("Dos avisos", "El professor t'ha advertit massa vegades.");
    return;
  }

  applyTimePenalty(WARNING_TIME_PENALTY_SECONDS);

  player.x = player.seatX;
  player.z = player.seatZ;
  player.standing = false;
  game.missionProgress = 0;
  ui.missionProgress.style.width = "0%";

  if (game.timeLeft <= 0) {
    endGame("S'ha acabat la classe", "Has perdut massa temps i ha sonat el timbre.");
    return;
  }

  if (seatDistance > 1.3) {
    setStatus("T'ha vist lluny del teu lloc. Aquest es el teu ultim avis.", 2.4);
    flashTeacherWarning("Ultim avis del professor!", 2400);
  } else if (game.warnings === 1) {
    flashTeacherWarning("Primer avis del professor!", 2400);
    setStatus("Primer avís. Seu immediatament.", 2.4);
  } else {
    setStatus("Últim avís. Una altra i s'ha acabat.", 2.4);
  }
}

function triggerTeacherAngryTurn() {
  game.teacherState = "looking";
  game.teacherStateTimer = 0;
  game.teacherStateDuration = 1.7;
  game.teacherWarningShown = false;
  game.teacherAngryCooldown = 1.7;
  ui.teacherState.textContent = "Enfadat";
  syncTeacherVisualState();
  setTeacherWarning(false);
  setStatus("El professor s'ha girat enfadat, pero no sap qui ha estat.", 2.2);
}

function triggerTeacherReportCatch() {
  game.teacherState = "looking";
  game.teacherStateTimer = 0;
  game.teacherStateDuration = 1.2;
  game.teacherWarningShown = false;
  ui.teacherState.textContent = "Mirant la classe";
  syncTeacherVisualState();
  setTeacherWarning(false);
  endGame("T'han delatat", "Un alumne ha avisat el professor i t'ha enxampat.");
}

function triggerPaperPlaneTurnCatch() {
  showTeacherJumpscare({
    imageSrc: "./paper-plane-jumpscare.png.png",
    copy: "fora de classe",
    imageAlt: "Professor enxampant l'alumne amb un avio de paper",
    imageFit: "cover",
  });
  endGame("Fora de classe", "El professor s'ha girat just quan l'avio de paper volava per l'aula.");
}

function updateTeacher(delta) {
  if (!game.running || game.ended) {
    return;
  }

  if (game.teacherAngryCooldown > 0) {
    game.teacherAngryCooldown = Math.max(0, game.teacherAngryCooldown - delta);
  }

  game.teacherStateTimer += delta;
  const timeLeft = game.teacherStateDuration - game.teacherStateTimer;

  if (game.teacherState === "writing" && !game.teacherWarningShown && timeLeft <= 4) {
    game.teacherWarningShown = true;
    setTeacherWarning(true);
    setStatus("Atenció: el professor es girarà en 2 segons.", 1.9);
  }

  if (game.teacherStateTimer < game.teacherStateDuration) {
    return;
  }

  game.teacherState = game.teacherState === "writing" ? "looking" : "writing";
  scheduleTeacherState();

  if (game.teacherState === "writing") {
    ui.teacherState.textContent = "Escrivint a la pissarra";
    syncTeacherVisualState();
    setStatus("El professor escriu. És la teva oportunitat.", 2.2);
    return;
  }

  ui.teacherState.textContent = "Mirant la classe";
  syncTeacherVisualState();
  if (game.activeMission && isGuidedPlaneMission(game.activeMission.id) && getActivePaperPlane()) {
    triggerPaperPlaneTurnCatch();
    return;
  }
  evaluateTeacherCatch();
}

function updatePlayer(delta) {
  if (!game.running || game.ended) {
    return;
  }

  if (!player.standing) {
    player.x = lerp(player.x, player.seatX, clamp(delta * 7, 0, 1));
    player.z = lerp(player.z, player.seatZ, clamp(delta * 7, 0, 1));
    return;
  }

  const moveX = (keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0);
  const moveZ = (keys.KeyS ? 1 : 0) - (keys.KeyW ? 1 : 0);

  if (moveX === 0 && moveZ === 0) {
    return;
  }

  const length = Math.hypot(moveX, moveZ) || 1;
  const speed = keys.ShiftLeft || keys.ShiftRight ? player.runSpeed : player.speed;
  let nextX = player.x + (moveX / length) * speed * delta;
  let nextZ = player.z + (moveZ / length) * speed * delta;
  nextX = clamp(nextX, classroom.left + 0.6, classroom.right - 0.6);
  nextZ = clamp(nextZ, classroom.front + 0.9, classroom.back - 0.6);

  const blockers = [
    ...desks.map((desk) => ({ x: desk.x, z: desk.z + 0.2, radius: 0.48 })),
    ...students.map((student) => ({ x: student.x, z: student.z, radius: 0.58 })),
    { x: teacher.x, z: teacher.z, radius: 0.85 },
  ];

  blockers.forEach((blocker) => {
    const dx = nextX - blocker.x;
    const dz = nextZ - blocker.z;
    const minDistance = player.radius + blocker.radius;
    const actualDistance = Math.hypot(dx, dz);

    if (actualDistance === 0) {
      nextZ = blocker.z + minDistance;
      return;
    }

    if (actualDistance < minDistance) {
      const push = (minDistance - actualDistance) / actualDistance;
      nextX += dx * push;
      nextZ += dz * push;
    }
  });

  player.x = clamp(nextX, classroom.left + 0.6, classroom.right - 0.6);
  player.z = clamp(nextZ, classroom.front + 0.9, classroom.back - 0.6);
  player.facing = Math.atan2(moveX, moveZ);
}

function findNearbyInteractable() {
  if (!player.standing || game.teacherState !== "writing" || !game.activeMission || !game.activeMission.target) {
    return null;
  }

  const target = game.activeMission.target;
  return distance(player.x, player.z, target.x, target.z) <= target.radius ? target : null;
}

function isThrowMission(missionId) {
  return missionId === "paper-ball";
}

function isGuidedPlaneMission(missionId) {
  return missionId === "draw-board";
}

function getActivePaperPlane() {
  return projectiles.find((item) => item.type === "plane" && item.controlled);
}

function getPaperTargetAim() {
  const targetStudent = students[game.paperTargetIndex];
  if (!targetStudent) {
    return 0;
  }
  return clamp(targetStudent.x / 9.2, -1, 1);
}

function getThrowTargetAim() {
  if (!game.activeMission) {
    return 0;
  }

  if (game.activeMission.id === "draw-board") {
    return clamp((teacher.x + Math.sin(game.elapsed * 2.2) * 0.55) / 9.2, -1, 1);
  }

  return getPaperTargetAim();
}

function throwPaperBall() {
  if (!game.activeMission || !isThrowMission(game.activeMission.id)) {
    return;
  }

  if (game.teacherState !== "writing") {
    setStatus("Ara no. El professor està vigilant.", 1.5);
    return;
  }

  if (player.standing) {
    setStatus("Aquesta missió es fa des del teu lloc.", 1.8);
    return;
  }

  if (game.paperThrowCooldown > 0) {
    return;
  }

  const isTeacherThrow = game.activeMission.id === "draw-board";
  const targetStudent = isTeacherThrow ? null : students[game.paperTargetIndex];
  if (!isTeacherThrow && !targetStudent) {
    return;
  }

  const targetAim = getThrowTargetAim();
  const success = Math.abs(game.paperAim - targetAim) <= (isTeacherThrow ? 0.1 : 0.14);
  projectiles.push({
    fromX: player.seatX,
    fromZ: player.seatZ - 0.2,
    toX: success
      ? (isTeacherThrow ? teacher.x : targetStudent.x)
      : (isTeacherThrow ? teacher.x + (game.paperAim - targetAim) * 7 : targetStudent.x + (game.paperAim - targetAim) * 6),
    toZ: success
      ? (isTeacherThrow ? teacher.z : targetStudent.z)
      : (isTeacherThrow ? teacher.z + 0.8 : targetStudent.z - 1.4),
    progress: 0,
  });

  game.paperThrowCooldown = 0.8;
  if (success) {
    completeMission();
  } else {
    game.missionNoticeFlag = true;
    setStatus(isTeacherThrow ? "El paper no ha tocat el profe. Torna a apuntar." : "Has fallat el tir. Reajusta la punteria.", 1.6);
  }
}

function launchPaperPlane() {
  if (!game.activeMission || !isGuidedPlaneMission(game.activeMission.id)) {
    return;
  }

  if (game.teacherState !== "writing") {
    setStatus("Ara no. El professor està vigilant.", 1.5);
    return;
  }

  if (player.standing) {
    setStatus("Aquesta missió es fa des del teu lloc.", 1.8);
    return;
  }

  if (getActivePaperPlane()) {
    return;
  }

  projectiles.push({
    type: "plane",
    controlled: true,
    x: player.seatX,
    z: player.seatZ - 0.25,
    vx: 0,
    vz: -6.1,
    life: game.activeMission.duration,
  });
  game.missionProgress = 0.08;
  ui.missionProgress.style.width = "8%";
  setStatus("Guia l'avió fins al professor.", 1.6);
}

function updateMission(delta) {
  if (!game.running || game.ended || !game.activeMission) {
    ui.prompt.classList.add("hidden");
    return;
  }

  if (isGuidedPlaneMission(game.activeMission.id)) {
    const activePlane = getActivePaperPlane();

    if (game.teacherState !== "writing") {
      ui.prompt.classList.add("hidden");
      if (activePlane) {
        activePlane.life = 0;
      }
      return;
    }

    if (player.standing) {
      ui.prompt.textContent = "Seu al teu lloc: aquesta missió es fa sense aixecar-se";
      ui.prompt.classList.remove("hidden");
      return;
    }

    if (!activePlane) {
      game.missionProgress = 0;
      ui.missionProgress.style.width = "0%";
      ui.prompt.textContent = "Prem E per llencar l'avio de paper";
      ui.prompt.classList.remove("hidden");
      return;
    }

    game.missionProgress = 1 - clamp(distance(activePlane.x, activePlane.z, teacher.x, teacher.z) / 18, 0, 1);
    ui.missionProgress.style.width = `${game.missionProgress * 100}%`;
    ui.prompt.textContent = "WASD per guiar l'avio fins al profe";
    ui.prompt.classList.remove("hidden");
    return;
  }

  if (isThrowMission(game.activeMission.id)) {
    game.paperThrowCooldown = Math.max(0, game.paperThrowCooldown - delta);

    if (game.teacherState !== "writing") {
      ui.prompt.classList.add("hidden");
      return;
    }

    if (player.standing) {
      ui.prompt.textContent = "Seu al teu lloc: aquesta missió es fa sense aixecar-se";
      ui.prompt.classList.remove("hidden");
      return;
    }

    const aimInput = (keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0);
    game.paperAim = clamp(game.paperAim + aimInput * delta * 1.8, -1, 1);

    const accuracy = 1 - clamp(Math.abs(game.paperAim - getThrowTargetAim()) / (game.activeMission.id === "draw-board" ? 0.22 : 0.35), 0, 1);
    game.missionProgress = accuracy;
    ui.missionProgress.style.width = `${accuracy * 100}%`;
    ui.prompt.textContent =
      game.activeMission.id === "draw-board"
        ? "A/D per apuntar al profe, E per llencar"
        : "A/D per apuntar, E per llencar el paper";
    ui.prompt.classList.remove("hidden");
    return;
  }

  const nearby = findNearbyInteractable();
  game.currentInteractable = nearby;

  if (!nearby) {
    ui.prompt.classList.add("hidden");
    if (!keys.KeyE) {
      game.missionProgress = 0;
      ui.missionProgress.style.width = "0%";
    }
    return;
  }

  ui.prompt.textContent = `Mantén E per ${game.activeMission.title.toLowerCase()}`;
  ui.prompt.classList.remove("hidden");

  if (!keys.KeyE) {
    game.missionProgress = Math.max(0, game.missionProgress - delta * 1.4);
    ui.missionProgress.style.width = `${(game.missionProgress / game.activeMission.duration) * 100}%`;
    return;
  }

  game.missionProgress += delta;
  ui.missionProgress.style.width = `${clamp((game.missionProgress / game.activeMission.duration) * 100, 0, 100)}%`;

  if (game.missionProgress >= game.activeMission.duration) {
    completeMission();
  }
}

function updateStudents(delta, time) {
  const intensity = clamp(game.elapsed / 110, 0, 1);
  students.forEach((student, index) => {
    if (student.sleeping) {
      student.reaction = 0;
      student.suspicionTime = 0;
      student.offset = Math.sin(time * 0.9 + student.seed) * 0.04;
      return;
    }

    const range = lerp(2.5, 4.8, intensity);
    const protectedHomeworkStudent =
      game.activeMission &&
      game.activeMission.id === "copy-homework" &&
      index === game.homeworkTargetIndex;
    const backpackWitness =
      game.activeMission &&
      game.activeMission.id === "swap-backpacks" &&
      distance(student.x, student.z, interactables.backpackPair.x, interactables.backpackPair.z) < 3.1;
    const noticingRange = backpackWitness ? range + 0.8 : range;
    const noticing = !protectedHomeworkStudent && player.standing && distance(player.x, player.z, student.x, student.z) < noticingRange;
    const target = noticing ? (backpackWitness ? 1 : lerp(0.3, 1, intensity)) : 0;
    student.reaction = lerp(student.reaction, target, clamp(delta * 4, 0, 1));
    student.suspicionTime = noticing ? student.suspicionTime + (backpackWitness ? delta * 1.7 : delta) : 0;
    if (student.suspicionTime > (backpackWitness ? 3.2 : 5)) {
      triggerTeacherReportCatch();
      return;
    }
    if (student.reaction > 0.22) {
      game.missionNoticeFlag = true;
    }

    student.offset = Math.sin(time * 1.8 + student.seed) * 0.08;
  });
}

function updateProjectiles(delta) {
  for (let i = projectiles.length - 1; i >= 0; i -= 1) {
    const projectile = projectiles[i];

    if (projectile.type === "plane" && projectile.controlled) {
      projectile.life -= delta;

      const steerX = (keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0);
      const steerZ = (keys.KeyS ? 1 : 0) - (keys.KeyW ? 1 : 0);
      projectile.vx = lerp(projectile.vx, steerX * 5.2, clamp(delta * 5, 0, 1));
      projectile.vz = -6.2 + steerZ * 2.2;
      projectile.x += projectile.vx * delta;
      projectile.z += projectile.vz * delta;

      if (distance(projectile.x, projectile.z, teacher.x, teacher.z) <= 0.95) {
        projectiles.splice(i, 1);
        if (game.activeMission && isGuidedPlaneMission(game.activeMission.id)) {
          triggerTeacherAngryTurn();
          completeMission();
        }
        continue;
      }

      const outOfBounds =
        projectile.x < classroom.left - 1 ||
        projectile.x > classroom.right + 1 ||
        projectile.z < classroom.front - 1 ||
        projectile.z > classroom.back + 1;

      if (projectile.life <= 0 || outOfBounds || game.teacherState !== "writing") {
        projectiles.splice(i, 1);
        if (game.activeMission && isGuidedPlaneMission(game.activeMission.id)) {
          game.missionNoticeFlag = true;
          game.missionProgress = 0;
          ui.missionProgress.style.width = "0%";
          setStatus("L'avio de paper ha caigut abans d'arribar al professor.", 1.8);
        }
      }
      continue;
    }

    projectile.progress += delta * 2;
    if (projectile.progress >= 1) {
      projectiles.splice(i, 1);
    }
  }

  for (let i = boardMarks.length - 1; i >= 0; i -= 1) {
    boardMarks[i].life -= delta;
    if (boardMarks[i].life <= 0) {
      boardMarks.splice(i, 1);
    }
  }
}

function updateUi(delta) {
  if (game.feedbackTimer > 0) {
    game.feedbackTimer -= delta;
  } else if (game.running && !game.ended) {
    if (game.teacherState === "looking") {
      ui.statusMessage.textContent = "Queda't assegut i fes veure que estudies.";
    } else if (player.standing) {
      ui.statusMessage.textContent = "Mou-te de pressa, completa la missió i torna al seient.";
    } else {
      ui.statusMessage.textContent = "El professor escriu. Prem espai per aixecar-te.";
    }
  }

  game.difficultyLevel = getDifficultyPhase();
  ui.difficulty.textContent = game.difficultyLevel;
  ui.warnings.textContent = `${Math.min(game.warnings, 2)} / 2`;
  ui.timeLeft.textContent = formatTime(game.timeLeft);
}

function tryToggleStand() {
  if (!game.running || game.ended) {
    return;
  }

  if (!player.standing) {
    if (game.teacherState !== "writing") {
      setStatus("És massa arriscat. Espera que el professor escrigui.", 2);
      return;
    }
    player.standing = true;
    setStatus("T'has aixecat del seient.", 1.6);
    return;
  }

  if (distance(player.x, player.z, player.seatX, player.seatZ) > 1.35) {
    setStatus("Torna al teu seient abans d'asseure't.", 1.8);
    return;
  }

  player.x = player.seatX;
  player.z = player.seatZ;
  player.standing = false;
  game.missionProgress = 0;
  ui.missionProgress.style.width = "0%";
  setStatus("Ja tornes a ser al teu lloc.", 1.6);
}

function resetGame() {
  game.running = false;
  game.ended = false;
  game.elapsed = 0;
  game.timeLeft = CLASS_DURATION_SECONDS;
  game.score = 0;
  game.warnings = 0;
  game.missionsCompleted = 0;
  game.teacherState = "looking";
  game.feedbackTimer = 0;
  game.difficultyLevel = "Calma";
  game.activeMission = null;
  game.missionProgress = 0;
  game.missionNoticeFlag = false;
  game.currentInteractable = null;
  game.teacherWarningShown = false;
  game.lastMissionId = "";
  game.homeworkTargetPool = students.map((_, index) => index);
  game.homeworkTargetIndex = -1;
  game.paperTargetIndex = -1;
  game.teacherAngryCooldown = 0;

  player.x = player.seatX;
  player.z = player.seatZ;
  player.standing = false;

  projectiles.length = 0;
  boardMarks.length = 0;
  hideTeacherJumpscare();

  ui.score.textContent = "0";
  ui.warnings.textContent = "0 / 2";
  ui.teacherState.textContent = "Mirant la classe";
  ui.timeLeft.textContent = formatTime(CLASS_DURATION_SECONDS);
  ui.difficulty.textContent = "Calma";
  ui.missionTitle.textContent = "Espera la teva oportunitat";
  ui.missionDescription.textContent = "El professor encara mira la classe. Queda't assegut.";
  ui.missionPoints.textContent = "0 punts";
  ui.bonusPoints.textContent = "Bonus 0";
  ui.missionProgress.style.width = "0%";
  ui.prompt.classList.add("hidden");
  ui.gameOverScreen.classList.remove("visible");

  scheduleTeacherState(2.5);
  syncTeacherVisualState();
  setStatus("Espera que el professor es giri cap a la pissarra.", 2.4);
}

function startGame() {
  resetGame();
  game.running = true;
  ui.startScreen.classList.remove("visible");
  activateMission();
}

function drawRoundedRect(x, y, width, height, radius, fillStyle) {
  ctx.fillStyle = fillStyle;
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
  ctx.fill();
}

function drawDesk(x, z) {
  const p = project(x, z);
  const width = 56 * p.scale;
  const depth = 30 * p.scale;
  const legHeight = 34 * p.scale;
  const topY = p.y - 28 * p.scale;

  ctx.fillStyle = "rgba(0, 0, 0, 0.16)";
  ctx.fillRect(p.x - width * 0.45, p.y - 3, width * 0.9, 8 * p.scale);
  drawRoundedRect(p.x - width * 0.5, topY, width, depth, 8 * p.scale, "#cf8e4d");
  ctx.fillStyle = "#7c583b";
  ctx.fillRect(p.x - width * 0.42, topY + depth - 1, 5 * p.scale, legHeight);
  ctx.fillRect(p.x + width * 0.37, topY + depth - 1, 5 * p.scale, legHeight);
  ctx.fillRect(p.x - width * 0.42, topY + 2, 5 * p.scale, legHeight);
  ctx.fillRect(p.x + width * 0.37, topY + 2, 5 * p.scale, legHeight);

  drawRoundedRect(p.x - width * 0.23, topY + 4 * p.scale, 24 * p.scale, 14 * p.scale, 4 * p.scale, "#f7f2e7");
  drawRoundedRect(p.x - width * 0.06, topY + 8 * p.scale, 12 * p.scale, 10 * p.scale, 3 * p.scale, "#79d2b2");

  drawRoundedRect(p.x - width * 0.33, p.y - 2 * p.scale, 32 * p.scale, 8 * p.scale, 4 * p.scale, "#5299cc");
  ctx.fillRect(p.x - width * 0.3, p.y + 5 * p.scale, 5 * p.scale, 18 * p.scale);
  ctx.fillRect(p.x + width * 0.18, p.y + 5 * p.scale, 5 * p.scale, 18 * p.scale);
}

function drawTeacherDesk() {
  const p = project(0, -6.9);
  drawRoundedRect(p.x - 66 * p.scale, p.y - 30 * p.scale, 132 * p.scale, 30 * p.scale, 9 * p.scale, "#cf8e4d");
  ctx.fillStyle = "#7c583b";
  ctx.fillRect(p.x - 56 * p.scale, p.y - 1 * p.scale, 7 * p.scale, 29 * p.scale);
  ctx.fillRect(p.x + 49 * p.scale, p.y - 1 * p.scale, 7 * p.scale, 29 * p.scale);
  drawRoundedRect(p.x + 14 * p.scale, p.y - 23 * p.scale, 30 * p.scale, 15 * p.scale, 4 * p.scale, "#f7f2e7");
}

function drawTeacherStateCue() {
  const p = project(teacher.x, teacher.z);

  if (game.teacherState === "writing") {
    ctx.fillStyle = "rgba(93, 207, 132, 0.18)";
    ctx.beginPath();
    ctx.moveTo(p.x - 48 * p.scale, p.y - 10 * p.scale);
    ctx.lineTo(p.x + 48 * p.scale, p.y - 10 * p.scale);
    ctx.lineTo(p.x, p.y - 92 * p.scale);
    ctx.closePath();
    ctx.fill();
    return;
  }

  ctx.fillStyle = "rgba(255, 111, 97, 0.14)";
  ctx.beginPath();
  ctx.moveTo(p.x - 132 * p.scale, p.y + 8 * p.scale);
  ctx.lineTo(p.x + 132 * p.scale, p.y + 8 * p.scale);
  ctx.lineTo(p.x, p.y + 132 * p.scale);
  ctx.closePath();
  ctx.fill();
}

function drawTeacherSpeechBubble() {
  const p = project(teacher.x, teacher.z);
  const bubbleW = 138 * p.scale;
  const bubbleH = 34 * p.scale;
  const bubbleX = p.x + 26 * p.scale;
  const bubbleY = p.y - 108 * p.scale;

  drawRoundedRect(bubbleX, bubbleY, bubbleW, bubbleH, 10 * p.scale, "rgba(255, 252, 244, 0.96)");

  ctx.fillStyle = "rgba(255, 252, 244, 0.96)";
  ctx.beginPath();
  ctx.moveTo(bubbleX + 14 * p.scale, bubbleY + bubbleH - 2 * p.scale);
  ctx.lineTo(bubbleX + 26 * p.scale, bubbleY + bubbleH + 10 * p.scale);
  ctx.lineTo(bubbleX + 34 * p.scale, bubbleY + bubbleH - 2 * p.scale);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "rgba(69, 61, 48, 0.22)";
  ctx.lineWidth = 1.6 * p.scale;
  ctx.strokeRect(bubbleX + 1, bubbleY + 1, bubbleW - 2, bubbleH - 2);

  ctx.fillStyle = "#4a4030";
  ctx.font = `800 ${Math.max(8, 8.5 * p.scale)}px Trebuchet MS`;
  ctx.fillText("(coses aburrides)", bubbleX + 8 * p.scale, bubbleY + 21 * p.scale);
}

function drawSleepBubble(x, z) {
  const p = project(x, z);
  const cloudX = p.x - 16 * p.scale;
  const cloudY = p.y - 52 * p.scale;

  ctx.fillStyle = "rgba(255, 255, 255, 0.82)";
  ctx.beginPath();
  ctx.arc(p.x + 3 * p.scale, p.y - 34 * p.scale, 3.5 * p.scale, 0, Math.PI * 2);
  ctx.arc(p.x + 8 * p.scale, p.y - 42 * p.scale, 5 * p.scale, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(255, 255, 255, 0.96)";
  ctx.beginPath();
  ctx.arc(cloudX, cloudY, 8 * p.scale, 0, Math.PI * 2);
  ctx.arc(cloudX + 10 * p.scale, cloudY - 4 * p.scale, 10 * p.scale, 0, Math.PI * 2);
  ctx.arc(cloudX + 22 * p.scale, cloudY, 8 * p.scale, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#6b5d8f";
  ctx.font = `800 ${Math.max(8, 9 * p.scale)}px Trebuchet MS`;
  ctx.fillText("zzz", cloudX + 4 * p.scale, cloudY + 3 * p.scale);
}

function drawPaperTargetMarker(student) {
  const p = project(student.x, student.z);
  const markerY = p.y - 72 * p.scale;
  const pulse = 0.82 + Math.sin(performance.now() * 0.01) * 0.18;

  ctx.fillStyle = "rgba(255, 244, 164, 0.96)";
  ctx.beginPath();
  ctx.arc(p.x, markerY, 9 * p.scale * pulse, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#d66739";
  ctx.font = `900 ${Math.max(9, 12 * p.scale)}px Trebuchet MS`;
  ctx.fillText("X", p.x - 3.8 * p.scale, markerY + 4 * p.scale);
}

function drawBag(bag) {
  const p = project(bag.x, bag.z);
  const bagW = 22 * p.scale;
  const bagH = 25 * p.scale;
  const bagTopY = p.y - 20 * p.scale;

  ctx.fillStyle = "rgba(0, 0, 0, 0.14)";
  ctx.beginPath();
  ctx.ellipse(p.x, p.y + 6 * p.scale, 11 * p.scale, 4 * p.scale, 0, 0, Math.PI * 2);
  ctx.fill();

  drawRoundedRect(p.x - bagW * 0.5, bagTopY, bagW, bagH, 6 * p.scale, bag.color);
  drawRoundedRect(p.x - bagW * 0.4, bagTopY + 8 * p.scale, bagW * 0.8, 8 * p.scale, 3 * p.scale, "#ffd29f");

  ctx.strokeStyle = "#8f633f";
  ctx.lineWidth = 1.8 * p.scale;
  ctx.beginPath();
  ctx.arc(p.x, bagTopY + 3 * p.scale, 5 * p.scale, Math.PI, 0);
  ctx.stroke();
}

function drawCharacter(x, z, palette, seated, alertState, bob = 0, sizeMultiplier = 1, backpack = false) {
  const p = project(x, z);
  const bodyH = (seated ? 28 * p.scale : 42 * p.scale) * sizeMultiplier;
  const bodyW = 22 * p.scale * sizeMultiplier;
  const headR = 10 * p.scale * sizeMultiplier;
  const baseY = p.y + bob * p.scale;
  const anchorY = seated ? baseY + 6 * p.scale * sizeMultiplier : baseY;
  const torsoH = seated ? bodyH * 0.68 : bodyH * 0.64;
  const legsH = seated ? bodyH * 0.24 : bodyH * 0.4;

  ctx.fillStyle = "rgba(0, 0, 0, 0.16)";
  ctx.beginPath();
  ctx.ellipse(
    p.x,
    anchorY + 6 * p.scale,
    (seated ? 11 : 13) * p.scale * sizeMultiplier,
    (seated ? 4.2 : 5) * p.scale * sizeMultiplier,
    0,
    0,
    Math.PI * 2,
  );
  ctx.fill();

  if (seated) {
    const stoolY = anchorY - 0.2 * p.scale * sizeMultiplier;
    const stoolW = bodyW * 0.82;
    const stoolH = 3 * p.scale * sizeMultiplier;
    const legH = 7 * p.scale * sizeMultiplier;

    drawRoundedRect(p.x - stoolW * 0.5, stoolY, stoolW, stoolH, 3 * p.scale, "#c98a52");
    drawRoundedRect(p.x - stoolW * 0.42, stoolY + 0.5 * p.scale, stoolW * 0.84, 1.2 * p.scale * sizeMultiplier, 2 * p.scale, "#ddb17a");

    ctx.fillStyle = "#805534";
    ctx.fillRect(p.x - stoolW * 0.32, stoolY + stoolH - 0.5, 2.1 * p.scale * sizeMultiplier, legH);
    ctx.fillRect(p.x + stoolW * 0.18, stoolY + stoolH - 0.5, 2.1 * p.scale * sizeMultiplier, legH);
  }

  if (backpack && !seated) {
    const packW = bodyW * (seated ? 0.72 : 0.92);
    const packH = seated ? bodyH * 0.42 : bodyH * 0.72;
    const packX = seated ? p.x + bodyW * 0.34 : p.x - packW * 0.5;
    const packY = seated ? anchorY - bodyH * 0.46 : anchorY - bodyH * 0.96;
    drawRoundedRect(packX, packY, packW, packH, 7 * p.scale, "#4f7fcb");
    drawRoundedRect(packX + packW * 0.16, packY + packH * 0.18, packW * 0.68, packH * 0.22, 4 * p.scale, "#7fc5dc");

    ctx.strokeStyle = "#355c97";
    ctx.lineWidth = 2.2 * p.scale * sizeMultiplier;
    ctx.beginPath();
    if (seated) {
      ctx.moveTo(packX + packW * 0.18, packY + 4 * p.scale);
      ctx.lineTo(p.x + bodyW * 0.18, anchorY - bodyH * 0.58);
      ctx.moveTo(packX + packW * 0.18, packY + packH - 3 * p.scale);
      ctx.lineTo(p.x + bodyW * 0.12, anchorY - bodyH * 0.14);
    } else {
      ctx.moveTo(p.x - bodyW * 0.28, anchorY - bodyH * 0.98);
      ctx.lineTo(p.x - bodyW * 0.44, anchorY - bodyH * 0.38);
      ctx.moveTo(p.x + bodyW * 0.28, anchorY - bodyH * 0.98);
      ctx.lineTo(p.x + bodyW * 0.44, anchorY - bodyH * 0.38);
    }
    ctx.stroke();
  }

  drawRoundedRect(p.x - bodyW * 0.5, anchorY - bodyH, bodyW, torsoH, 8 * p.scale, palette.body);

  if (seated) {
    drawRoundedRect(p.x - bodyW * 0.34, anchorY - legsH, bodyW * 0.68, legsH, 6 * p.scale, palette.legs);
  } else {
    drawRoundedRect(p.x - bodyW * 0.34, anchorY - legsH, bodyW * 0.24, legsH, 4 * p.scale, palette.legs);
    drawRoundedRect(p.x + bodyW * 0.1, anchorY - legsH, bodyW * 0.24, legsH, 4 * p.scale, palette.legs);
    ctx.fillStyle = "#2e4f7b";
    ctx.beginPath();
    ctx.ellipse(p.x - bodyW * 0.18, anchorY + 2 * p.scale, 4.5 * p.scale * sizeMultiplier, 2.4 * p.scale * sizeMultiplier, 0, 0, Math.PI * 2);
    ctx.ellipse(p.x + bodyW * 0.18, anchorY + 2 * p.scale, 4.5 * p.scale * sizeMultiplier, 2.4 * p.scale * sizeMultiplier, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = palette.skin;
  ctx.beginPath();
  ctx.arc(p.x, anchorY - bodyH - headR * 0.45, headR, 0, Math.PI * 2);
  ctx.fill();

  if (alertState) {
    const symbol = alertState === "alert" ? "!" : "?";
    const bubbleX = p.x + 16 * p.scale * sizeMultiplier;
    const bubbleY = anchorY - bodyH - 20 * p.scale * sizeMultiplier;

    ctx.fillStyle = alertState === "alert" ? "#ffefb8" : "#f7fbff";
    ctx.beginPath();
    ctx.arc(bubbleX, bubbleY, 8 * p.scale * sizeMultiplier, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = alertState === "alert" ? "#d6593f" : "#49617f";
    ctx.font = `900 ${Math.max(9, 11 * p.scale * sizeMultiplier)}px Trebuchet MS`;
    ctx.fillText(symbol, bubbleX - 3.2 * p.scale * sizeMultiplier, bubbleY + 3.5 * p.scale * sizeMultiplier);
  }
}

function drawBoard() {
  const p = project(0, -14.1);
  drawRoundedRect(p.x - 146 * p.scale, p.y - 64 * p.scale, 292 * p.scale, 108 * p.scale, 11 * p.scale, "#875e37");
  drawRoundedRect(p.x - 134 * p.scale, p.y - 57 * p.scale, 268 * p.scale, 94 * p.scale, 9 * p.scale, "#274f3f");
  drawRoundedRect(p.x - 136 * p.scale, p.y + 34 * p.scale, 272 * p.scale, 8 * p.scale, 3 * p.scale, "#d4c0a1");

  boardMarks.forEach((mark) => {
    const mp = project(mark.x, mark.z);
    const alpha = clamp(mark.life / 9, 0.15, 1);
    ctx.strokeStyle = `rgba(242, 242, 242, ${alpha})`;
    ctx.lineWidth = 3 * mp.scale;
    ctx.beginPath();
    ctx.moveTo(mp.x - 14 * mp.scale, mp.y - 12 * mp.scale);
    ctx.lineTo(mp.x + 14 * mp.scale, mp.y + 12 * mp.scale);
    ctx.moveTo(mp.x + 14 * mp.scale, mp.y - 12 * mp.scale);
    ctx.lineTo(mp.x - 14 * mp.scale, mp.y + 12 * mp.scale);
    ctx.stroke();
  });
}

function drawProjectiles() {
  projectiles.forEach((item) => {
    const t = clamp(item.progress ?? 0, 0, 1);
    const x = item.type === "plane" ? item.x : lerp(item.fromX, item.toX, t);
    const z = item.type === "plane" ? item.z : lerp(item.fromZ, item.toZ, t);
    const p = project(x, z);
    if (item.type === "plane") {
      ctx.fillStyle = "#f5f2eb";
      ctx.beginPath();
      ctx.moveTo(p.x, p.y - 26 * p.scale);
      ctx.lineTo(p.x - 10 * p.scale, p.y - 18 * p.scale);
      ctx.lineTo(p.x - 1.5 * p.scale, p.y - 14 * p.scale);
      ctx.lineTo(p.x + 10 * p.scale, p.y - 18 * p.scale);
      ctx.closePath();
      ctx.fill();
      return;
    }

    const arc = Math.sin(t * Math.PI) * 24 * p.scale;
    ctx.fillStyle = "#f0efea";
    ctx.beginPath();
    ctx.arc(p.x, p.y - 24 * p.scale - arc, 5 * p.scale, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawInteractableMarker(item) {
  if (!game.activeMission || !game.activeMission.target || game.activeMission.target.id !== item.id || !game.running || game.ended) {
    return;
  }

  const pulse = 0.78 + Math.sin(performance.now() * 0.008) * 0.22;
  const p = project(item.x, item.z);
  const beamHeight = 70 * p.scale * pulse;

  ctx.strokeStyle = "rgba(255, 174, 76, 0.98)";
  ctx.lineWidth = 4 * p.scale;
  ctx.beginPath();
  ctx.moveTo(p.x, p.y - 8 * p.scale);
  ctx.lineTo(p.x, p.y - beamHeight);
  ctx.stroke();

  ctx.fillStyle = "rgba(255, 205, 84, 0.22)";
  ctx.beginPath();
  ctx.moveTo(p.x - 20 * p.scale, p.y - beamHeight + 10 * p.scale);
  ctx.lineTo(p.x + 20 * p.scale, p.y - beamHeight + 10 * p.scale);
  ctx.lineTo(p.x, p.y - beamHeight - 22 * p.scale);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#ff8a3d";
  ctx.beginPath();
  ctx.moveTo(p.x - 10 * p.scale, p.y - beamHeight + 4 * p.scale);
  ctx.lineTo(p.x + 10 * p.scale, p.y - beamHeight + 4 * p.scale);
  ctx.lineTo(p.x, p.y - beamHeight - 14 * p.scale);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "rgba(255, 174, 76, 0.98)";
  ctx.lineWidth = 3 * p.scale;
  ctx.beginPath();
  ctx.ellipse(p.x, p.y + 2 * p.scale, 22 * p.scale * pulse, 9 * p.scale * pulse, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = "rgba(255, 255, 255, 0.92)";
  ctx.lineWidth = 2 * p.scale;
  ctx.beginPath();
  ctx.ellipse(p.x, p.y + 2 * p.scale, 30 * p.scale * pulse, 13 * p.scale * pulse, 0, 0, Math.PI * 2);
  ctx.stroke();

  const label = game.activeMission.title.toUpperCase();
  ctx.font = `800 ${Math.max(10, 10 * p.scale)}px Trebuchet MS`;
  const labelWidth = ctx.measureText(label).width;
  const labelPadding = 7 * p.scale;
  const labelHeight = 18 * p.scale;
  const labelX = p.x - labelWidth * 0.5 - labelPadding;
  const labelY = p.y - beamHeight - 32 * p.scale;
  drawRoundedRect(labelX, labelY, labelWidth + labelPadding * 2, labelHeight, 8 * p.scale, "rgba(23, 47, 70, 0.9)");
  ctx.fillStyle = "#fff7ea";
  ctx.fillText(label, p.x - labelWidth * 0.5, labelY + 12.5 * p.scale);
}

function drawFloor() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const floorTop = 126;

  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, "#ffe7aa");
  gradient.addColorStop(1, "#f2efd7");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "#fff4cf";
  ctx.fillRect(width * 0.09, 36, width * 0.82, 52);

  ctx.fillStyle = "#a5d89b";
  ctx.beginPath();
  ctx.moveTo(width * 0.03, height - 14);
  ctx.lineTo(width * 0.24, floorTop);
  ctx.lineTo(width * 0.76, floorTop);
  ctx.lineTo(width * 0.97, height - 14);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "rgba(255,255,255,0.18)";
  for (let i = 0; i <= 7; i += 1) {
    const y = lerp(floorTop, height - 14, i / 7);
    ctx.beginPath();
    ctx.moveTo(width * 0.24 + i * 3, y);
    ctx.lineTo(width * 0.76 - i * 3, y);
    ctx.stroke();
  }
}

function drawRoomShell() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  const topLeft = { x: width * 0.1, y: 88 };
  const topRight = { x: width * 0.9, y: 88 };
  const floorLeft = { x: width * 0.24, y: 126 };
  const floorRight = { x: width * 0.76, y: 126 };
  const bottomLeft = { x: width * 0.03, y: height - 14 };
  const bottomRight = { x: width * 0.97, y: height - 14 };

  ctx.fillStyle = "#ffe6b8";
  ctx.beginPath();
  ctx.moveTo(topLeft.x, topLeft.y);
  ctx.lineTo(floorLeft.x, floorLeft.y);
  ctx.lineTo(bottomLeft.x, bottomLeft.y);
  ctx.lineTo(0, height - 14);
  ctx.lineTo(width * 0.03, 72);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#f8ddb0";
  ctx.beginPath();
  ctx.moveTo(topRight.x, topRight.y);
  ctx.lineTo(floorRight.x, floorRight.y);
  ctx.lineTo(bottomRight.x, bottomRight.y);
  ctx.lineTo(width, height - 14);
  ctx.lineTo(width * 0.97, 72);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#fff1cf";
  ctx.fillRect(width * 0.1, 34, width * 0.8, 54);

  ctx.strokeStyle = "rgba(117, 84, 54, 0.28)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(topLeft.x, topLeft.y);
  ctx.lineTo(topRight.x, topRight.y);
  ctx.lineTo(width * 0.97, 72);
  ctx.stroke();
}

function drawWindows() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const leftWall = [
    { x: width * 0.03, y: 72 },
    { x: width * 0.14, y: 96 },
    { x: width * 0.08, y: height - 18 },
    { x: width * 0.03, y: height - 18 },
  ];
  const frames = [
    { u0: 0.3, u1: 0.76, v0: 0.18, v1: 0.38 },
    { u0: 0.34, u1: 0.84, v0: 0.46, v1: 0.72 },
  ];

  frames.forEach(({ u0, u1, v0, v1 }) => {
    const outer = [
      quadPoint(leftWall, u0, v0),
      quadPoint(leftWall, u1, v0),
      quadPoint(leftWall, u1, v1),
      quadPoint(leftWall, u0, v1),
    ];
    const center = outer.reduce(
      (acc, point) => ({ x: acc.x + point.x / 4, y: acc.y + point.y / 4 }),
      { x: 0, y: 0 },
    );
    const inner = outer.map((point) => lerpPoint(center, point, 0.82));

    ctx.fillStyle = "#b67844";
    ctx.beginPath();
    ctx.moveTo(outer[0].x, outer[0].y);
    outer.slice(1).forEach((point) => ctx.lineTo(point.x, point.y));
    ctx.closePath();
    ctx.fill();

    const glass = ctx.createLinearGradient(inner[0].x, inner[0].y, inner[2].x, inner[2].y);
    glass.addColorStop(0, "#dff6ff");
    glass.addColorStop(1, "#94d0f0");
    ctx.fillStyle = glass;
    ctx.beginPath();
    ctx.moveTo(inner[0].x, inner[0].y);
    inner.slice(1).forEach((point) => ctx.lineTo(point.x, point.y));
    ctx.closePath();
    ctx.fill();

    const topMid = lerpPoint(inner[0], inner[1], 0.5);
    const bottomMid = lerpPoint(inner[3], inner[2], 0.5);
    const leftMid = lerpPoint(inner[0], inner[3], 0.5);
    const rightMid = lerpPoint(inner[1], inner[2], 0.5);

    ctx.strokeStyle = "rgba(255,255,255,0.78)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(topMid.x, topMid.y);
    ctx.lineTo(bottomMid.x, bottomMid.y);
    ctx.moveTo(leftMid.x, leftMid.y);
    ctx.lineTo(rightMid.x, rightMid.y);
    ctx.stroke();

    ctx.strokeStyle = "rgba(255,255,255,0.42)";
    ctx.beginPath();
    ctx.moveTo(inner[0].x + 4, inner[0].y + 6);
    ctx.lineTo(inner[1].x - 8, inner[1].y + 8);
    ctx.stroke();
  });

  ctx.fillStyle = "#9ad17b";
  ctx.beginPath();
  ctx.arc(width * 0.055, height - 56, 52, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#7f5839";
  ctx.fillRect(width * 0.05, height - 56, 10, 48);
}

function drawBookshelf() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const shelf = [
    { x: width * 0.84, y: 132 },
    { x: width * 0.955, y: 106 },
    { x: width * 0.955, y: height * 0.7 },
    { x: width * 0.885, y: height * 0.74 },
  ];

  ctx.fillStyle = "#9a6a42";
  ctx.beginPath();
  ctx.moveTo(shelf[0].x, shelf[0].y);
  shelf.slice(1).forEach((point) => ctx.lineTo(point.x, point.y));
  ctx.closePath();
  ctx.fill();

  const innerShelf = shelf.map((point, index) =>
    lerpPoint(
      {
        x: (shelf[0].x + shelf[1].x + shelf[2].x + shelf[3].x) / 4,
        y: (shelf[0].y + shelf[1].y + shelf[2].y + shelf[3].y) / 4,
      },
      point,
      index < 2 ? 0.88 : 0.83,
    ),
  );

  ctx.fillStyle = "#b68155";
  ctx.beginPath();
  ctx.moveTo(innerShelf[0].x, innerShelf[0].y);
  innerShelf.slice(1).forEach((point) => ctx.lineTo(point.x, point.y));
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "#754d2d";
  ctx.lineWidth = 5;
  for (let i = 1; i <= 3; i += 1) {
    const t = i / 4;
    const left = quadPoint(innerShelf, 0.08, t);
    const right = quadPoint(innerShelf, 0.92, t);
    ctx.beginPath();
    ctx.moveTo(left.x, left.y);
    ctx.lineTo(right.x, right.y);
    ctx.stroke();
  }

  const bookColors = ["#df6f5f", "#5f7ce0", "#79d2b2", "#ffd669", "#ed8da7"];
  for (let row = 0; row < 4; row += 1) {
    const rowTop = row / 4;
    const rowBottom = (row + 1) / 4 - 0.03;

    for (let i = 0; i < 5; i += 1) {
      const u0 = 0.11 + i * 0.16;
      const u1 = u0 + 0.1;
      const heightFactor = 0.18 + ((row + i) % 3) * 0.06;
      const topV = Math.max(rowTop + 0.03, rowBottom - heightFactor);
      const book = [
        quadPoint(innerShelf, u0, topV),
        quadPoint(innerShelf, u1, topV),
        quadPoint(innerShelf, u1, rowBottom),
        quadPoint(innerShelf, u0, rowBottom),
      ];

      ctx.fillStyle = bookColors[(row + i) % bookColors.length];
      ctx.beginPath();
      ctx.moveTo(book[0].x, book[0].y);
      book.slice(1).forEach((point) => ctx.lineTo(point.x, point.y));
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = "rgba(63, 41, 24, 0.35)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }
}

function drawClassroomProps() {
  const width = window.innerWidth;

  drawRoundedRect(width * 0.72, 116, 84, 24, 8, "#d8dce5");
  ctx.fillStyle = "#747f93";
  ctx.fillRect(width * 0.755, 140, 10, 36);
  ctx.fillRect(width * 0.742, 122, 56, 8);
  ctx.fillStyle = "#58647a";
  ctx.fillRect(width * 0.782, 122, 14, 8);

  drawRoundedRect(width * 0.12, 94, 86, 28, 8, "#f4c76b");
  ctx.fillStyle = "#1a2940";
  ctx.font = "700 13px Trebuchet MS";
  ctx.fillText("MATEMÀTIQUES", width * 0.12 + 10, 112);

  drawRoundedRect(width * 0.74, 96, 68, 68, 10, "#f6efe3");
  ctx.strokeStyle = "#ec7b54";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(width * 0.755, 115);
  ctx.lineTo(width * 0.785, 145);
  ctx.lineTo(width * 0.805, 122);
  ctx.stroke();
}

function drawForegroundDesk() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const deskY = height - 128;
  const deskW = Math.min(width * 0.54, 620);
  const deskH = 116;
  const deskX = width * 0.5 - deskW * 0.5;

  ctx.fillStyle = "rgba(0, 0, 0, 0.16)";
  ctx.beginPath();
  ctx.ellipse(width * 0.5, height - 18, deskW * 0.42, 24, 0, 0, Math.PI * 2);
  ctx.fill();

  drawRoundedRect(deskX, deskY, deskW, deskH, 24, "#c9894b");
  drawRoundedRect(deskX + 26, deskY + 18, deskW - 52, deskH - 42, 18, "#d89c5e");
  ctx.fillStyle = "#7c583b";
  ctx.fillRect(deskX + 34, deskY + deskH - 10, 18, 56);
  ctx.fillRect(deskX + deskW - 52, deskY + deskH - 10, 18, 56);

  drawRoundedRect(deskX + 34, deskY + 26, 116, 46, 10, "#f7f2e7");
  drawRoundedRect(deskX + 164, deskY + 32, 92, 36, 10, "#79d2b2");
  drawRoundedRect(deskX + deskW - 158, deskY + 30, 108, 42, 10, "#df6f5f");
  drawRoundedRect(width * 0.5 - 26, deskY + 18, 52, 58, 14, "#4f7fcb");
}

function render(timeSeconds) {
  drawFloor();
  drawRoomShell();
  drawBoard();
  drawCharacter(teacher.x, teacher.z, { body: "#ec7b54", legs: "#3c567c", skin: "#f3c28c" }, false, null, 0, 1.28);
  drawTeacherDesk();
  drawTeacherStateCue();
  if (game.teacherState === "looking") {
    drawTeacherSpeechBubble();
  }
  drawInteractableMarker(interactables.teacherDesk);
  drawInteractableMarker(interactables.board);

  const classroomScene = [
    ...desks.map((desk) => ({ type: "desk", z: desk.z, item: desk })),
    ...bags.map((bag) => ({ type: "bag", z: bag.z, item: bag })),
    ...students.map((student) => ({ type: "student", z: student.z, item: student })),
  ];

  classroomScene
    .sort((a, b) => a.z - b.z)
    .forEach((entry) => {
      if (entry.type === "desk") {
        drawDesk(entry.item.x, entry.item.z);
        return;
      }

      if (entry.type === "bag") {
        drawBag(entry.item);
        return;
      }

      const alertState =
        entry.item.suspicionTime > 4
          ? "alert"
          : entry.item.reaction > 0.22
            ? "question"
            : null;
      drawCharacter(entry.item.x, entry.item.z, { body: "#7cc3e8", legs: "#495670", skin: "#f6c48d" }, true, alertState, entry.item.offset);
      if (entry.item.sleeping) {
        drawSleepBubble(entry.item.x, entry.item.z);
      }
    });

  drawInteractableMarker(interactables.classmateDesk);
  drawInteractableMarker(interactables.paperBallDesk);
  drawInteractableMarker(interactables.backpackPair);
  drawInteractableMarker(interactables.frontDesk);

  if (game.activeMission && game.activeMission.id === "paper-ball" && students[game.paperTargetIndex]) {
    drawPaperTargetMarker(students[game.paperTargetIndex]);
  }

  drawProjectiles();
  drawCharacter(
    player.x,
    player.z,
    { body: "#ffbf54", legs: "#365c8d", skin: "#f3c28c" },
    !player.standing,
    null,
    player.standing ? Math.sin(timeSeconds * 8) * 0.05 : 0,
    1,
    true,
  );
}

function tick(timestamp) {
  const time = timestamp * 0.001;
  const delta = Math.min(time - lastTime || 0, 0.05);
  lastTime = time;

  if (game.running && !game.ended) {
    game.elapsed += delta;
    game.timeLeft = Math.max(0, CLASS_DURATION_SECONDS - game.elapsed);
    if (game.timeLeft <= 0) {
      endGame("S'ha acabat la classe", "Ha sonat el timbre. Aquesta és la teva puntuació final.");
    }
  }

  updateTeacher(delta);
  updatePlayer(delta);
  updateMission(delta);
  updateStudents(delta, time);
  updateProjectiles(delta);
  updateUi(delta);
  render(time);

  animationFrame = window.requestAnimationFrame(tick);
}

function onKeyChange(event, pressed) {
  if (event.code in keys) {
    keys[event.code] = pressed;
  }

  if (pressed && event.code === "KeyE" && game.activeMission && isThrowMission(game.activeMission.id)) {
    event.preventDefault();
    throwPaperBall();
    return;
  }

  if (pressed && event.code === "KeyE" && game.activeMission && isGuidedPlaneMission(game.activeMission.id)) {
    event.preventDefault();
    launchPaperPlane();
    return;
  }

  if (pressed && event.code === "Space") {
    event.preventDefault();
    tryToggleStand();
  }
}

window.addEventListener("resize", resizeCanvas);
window.addEventListener("keydown", (event) => onKeyChange(event, true));
window.addEventListener("keyup", (event) => onKeyChange(event, false));

ui.startButton.addEventListener("click", startGame);
ui.restartButton.addEventListener("click", () => {
  ui.gameOverScreen.classList.remove("visible");
  startGame();
});

buildClassroom();
resizeCanvas();
resetGame();
syncTeacherVisualState();
cancelAnimationFrame(animationFrame);
animationFrame = window.requestAnimationFrame(tick);
