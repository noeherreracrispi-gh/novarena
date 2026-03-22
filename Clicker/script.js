const STORAGE_KEY = "novarena_idle_save_v1";
const INTRO_BANNER_DURATION = 5200;

// Upgrades repetibles per fer créixer els números de manera constant.
const productionUpgrades = [
  {
    id: "coffee",
    name: "Dades+",
    baseCost: 22,
    type: "click",
    value: 1,
    costMultiplier: 1.18,
    effectLabel: "+1 per clic"
  },
  {
    id: "macro",
    name: "Macro",
    baseCost: 95,
    type: "click",
    value: 3,
    costMultiplier: 1.22,
    effectLabel: "+3 per clic"
  },
  {
    id: "stream",
    name: "Viral",
    baseCost: 270,
    type: "click",
    value: 8,
    costMultiplier: 1.25,
    effectLabel: "+8 per clic"
  },
  {
    id: "pulse",
    name: "Pulse",
    baseCost: 620,
    type: "click",
    value: 14,
    costMultiplier: 1.27,
    effectLabel: "+14 per clic"
  },
  {
    id: "over",
    name: "Over",
    baseCost: 2100,
    type: "click",
    value: 26,
    costMultiplier: 1.28,
    effectLabel: "+26 per clic"
  },
  {
    id: "botfarm",
    name: "Bots",
    baseCost: 60,
    type: "auto",
    value: 1,
    costMultiplier: 1.2,
    effectLabel: "+1 per segon"
  },
  {
    id: "nightshift",
    name: "Clúster",
    baseCost: 220,
    type: "auto",
    value: 3,
    costMultiplier: 1.24,
    effectLabel: "+3 per segon"
  },
  {
    id: "agency",
    name: "Agents",
    baseCost: 820,
    type: "auto",
    value: 10,
    costMultiplier: 1.28,
    effectLabel: "+10 per segon"
  },
  {
    id: "turbo",
    name: "Turbo",
    baseCost: 650,
    type: "click",
    value: 18,
    costMultiplier: 1.27,
    effectLabel: "+18 per clic"
  },
  {
    id: "quantum",
    name: "Quàntic",
    baseCost: 4200,
    type: "click",
    value: 54,
    costMultiplier: 1.29,
    effectLabel: "+54 per clic"
  },
  {
    id: "nitro",
    name: "Nitro",
    baseCost: 9800,
    type: "click",
    value: 92,
    costMultiplier: 1.31,
    effectLabel: "+92 per clic"
  },
  {
    id: "omegaClick",
    name: "Omega",
    baseCost: 34000,
    type: "click",
    value: 180,
    costMultiplier: 1.33,
    effectLabel: "+180 per clic"
  },
  {
    id: "forge",
    name: "Forge",
    baseCost: 950,
    type: "auto",
    value: 18,
    costMultiplier: 1.28,
    effectLabel: "+18 per segon"
  },
  {
    id: "nexus",
    name: "Nexus",
    baseCost: 6200,
    type: "auto",
    value: 48,
    costMultiplier: 1.3,
    effectLabel: "+48 per segon"
  },
  {
    id: "vault",
    name: "Vault",
    baseCost: 26000,
    type: "auto",
    value: 120,
    costMultiplier: 1.32,
    effectLabel: "+120 per segon"
  },
  {
    id: "lucky",
    name: "Lucky",
    baseCost: 145,
    type: "crit",
    chance: 0.02,
    costMultiplier: 1.23,
    effectLabel: "+2% critico"
  },
  {
    id: "critCore",
    name: "Critico",
    baseCost: 560,
    type: "crit",
    chance: 0.03,
    costMultiplier: 1.27,
    effectLabel: "+3% critico"
  },
  {
    id: "jackpot",
    name: "Jackpot",
    baseCost: 2100,
    type: "crit",
    chance: 0.05,
    costMultiplier: 1.3,
    effectLabel: "+5% critico"
  },
  {
    id: "fortuna",
    name: "Fortuna",
    baseCost: 4800,
    type: "crit",
    chance: 0.06,
    costMultiplier: 1.31,
    effectLabel: "+6% critico"
  },
  {
    id: "oracle",
    name: "Oracle",
    baseCost: 18000,
    type: "crit",
    chance: 0.07,
    costMultiplier: 1.33,
    effectLabel: "+7% critico"
  }
];

// Upgrades únics que també canvien l'escena i la forma del robot.
const hardwareUpgrades = [
  {
    id: "repairScreen",
    name: "Cap",
    cost: 50,
    value: 0,
    auto: 0,
    visualClass: "hardware-head",
    effectLabel: "+0 per clic"
  },
  {
    id: "keyboardSwap",
    name: "Visor",
    cost: 180,
    value: 2,
    auto: 0,
    visualClass: "hardware-visor",
    effectLabel: "+2 per clic"
  },
  {
    id: "mouseBoost",
    name: "Cos",
    cost: 380,
    value: 3,
    auto: 0,
    visualClass: "hardware-body",
    effectLabel: "+3 per clic"
  },
  {
    id: "cpuUpgrade",
    name: "Braços",
    cost: 900,
    value: 6,
    auto: 2,
    visualClass: "hardware-arms",
    effectLabel: "+6 per clic i +2/s"
  },
  {
    id: "gpuUpgrade",
    name: "Cames",
    cost: 2300,
    value: 0,
    auto: 8,
    visualClass: "hardware-legs",
    effectLabel: "+8/s"
  },
  {
    id: "rgbFans",
    name: "Nucli",
    cost: 4800,
    value: 7,
    auto: 12,
    visualClass: "hardware-core",
    effectLabel: "+7 per clic i +12/s"
  },
  {
    id: "dualMonitor",
    name: "Halo",
    cost: 9800,
    value: 12,
    auto: 18,
    visualClass: "hardware-halo",
    effectLabel: "+12 per clic i +18/s"
  },
  {
    id: "gamingChair",
    name: "Panells",
    cost: 22000,
    value: 8,
    auto: 34,
    visualClass: "hardware-panels",
    effectLabel: "+8 per clic i +34/s"
  },
  {
    id: "proSetup",
    name: "Tron",
    cost: 52000,
    value: 18,
    auto: 85,
    visualClass: "hardware-throne",
    effectLabel: "+18 per clic i +85/s"
  },
  {
    id: "sensorPack",
    name: "Sensors",
    cost: 78000,
    value: 24,
    auto: 95,
    visualClass: "hardware-sensors",
    effectLabel: "+24 per clic i +95/s"
  },
  {
    id: "shieldFrame",
    name: "Escut",
    cost: 115000,
    value: 10,
    auto: 150,
    visualClass: "hardware-armor",
    effectLabel: "+10 per clic i +150/s"
  },
  {
    id: "matrixGrid",
    name: "Matrix",
    cost: 165000,
    value: 32,
    auto: 210,
    visualClass: "hardware-matrix",
    effectLabel: "+32 per clic i +210/s"
  },
  {
    id: "swarmNode",
    name: "Eixam",
    cost: 245000,
    value: 45,
    auto: 320,
    visualClass: "hardware-swarm",
    effectLabel: "+45 per clic i +320/s"
  },
  {
    id: "singularityCore",
    name: "Singular",
    cost: 380000,
    value: 70,
    auto: 550,
    visualClass: "hardware-singularity",
    effectLabel: "+70 per clic i +550/s"
  }
];

// Cada tram fa créixer l'aspecte general del robot.
const stageData = [
  {
    threshold: 0,
    name: "Portàtil vell",
    shortHint: "Compra Cap",
    flavor: "Només tens un portàtil vell. Compra peces per començar a construir el robot."
  },
  {
    threshold: 150,
    name: "Cap del robot",
    shortHint: "Munta el cos",
    flavor: "El projecte desperta: ja tens les primeres parts del robot."
  },
  {
    threshold: 708,
    name: "Robot en muntatge",
    shortHint: "Falten peces",
    flavor: "Cada compra afegeix una nova peça física al robot."
  },
  {
    threshold: 1428,
    name: "Robot funcional",
    shortHint: "Acaba'l",
    flavor: "El robot ja pren forma, però encara no està complet."
  },
  {
    threshold: 1704,
    name: "Robot complet",
    shortHint: "Ja pots millorar-lo",
    flavor: "Totes les peces bàsiques estan muntades. Ara ja pots fer millores avançades."
  },
  {
    threshold: 3300,
    name: "Robot millorat",
    shortHint: "Segueix millorant",
    flavor: "Les millores avançades comencen a transformar el robot en una bèstia tecnològica."
  },
  {
    threshold: 6459,
    name: "Titan IA",
    shortHint: "Màxim assolit",
    flavor: "El portàtil inicial és història. Ara tens una supermàquina completa."
  }
];

const state = {
  money: 0,
  totalEarned: 0,
  manualClicks: 0,
  productionCounts: Object.fromEntries(productionUpgrades.map((item) => [item.id, 0])),
  hardwareOwned: Object.fromEntries(hardwareUpgrades.map((item) => [item.id, false]))
};

const elements = {
  moneyDisplay: document.getElementById("moneyDisplay"),
  clickValueDisplay: document.getElementById("clickValueDisplay"),
  autoValueDisplay: document.getElementById("autoValueDisplay"),
  stageNameDisplay: document.getElementById("stageNameDisplay"),
  nextStageDisplay: document.getElementById("nextStageDisplay"),
  stageFlavorDisplay: document.getElementById("stageFlavorDisplay"),
  stageProgressBar: document.getElementById("stageProgressBar"),
  scene: document.getElementById("scene"),
  introBanner: document.getElementById("introBanner"),
  pcButton: document.getElementById("pcButton"),
  floatingLayer: document.getElementById("floatingLayer"),
  robotUpgradeLayer: document.getElementById("robotUpgradeLayer"),
  setupBadge: document.getElementById("setupBadge"),
  productionShop: document.getElementById("productionShop"),
  hardwareShop: document.getElementById("hardwareShop"),
  resetButton: document.getElementById("resetButton"),
  shopDrawer: document.getElementById("shopDrawer"),
  tabButtons: Array.from(document.querySelectorAll(".tab-button")),
  tabPanels: Array.from(document.querySelectorAll("[data-tab-panel]")),
  shopTemplate: document.getElementById("shopItemTemplate")
};

const shopButtons = new Map();
const visibleRobotUpgrades = new Set();
let introBannerTimeoutId = null;
const basePartIds = [
  "repairScreen",
  "keyboardSwap",
  "mouseBoost",
  "cpuUpgrade",
  "gpuUpgrade",
  "rgbFans",
  "dualMonitor",
  "gamingChair"
];
const advancedUpgradeIds = [
  "proSetup",
  "sensorPack",
  "shieldFrame",
  "matrixGrid",
  "swarmNode",
  "singularityCore"
];
const robotUpgradeVisuals = {
  proSetup: "module-throne",
  sensorPack: "module-sensors",
  shieldFrame: "module-armor",
  matrixGrid: "module-matrix",
  swarmNode: "module-swarm",
  singularityCore: "module-singularity"
};

function formatNumber(value) {
  const rounded = value >= 100 ? Math.floor(value) : Number(value.toFixed(1));
  return new Intl.NumberFormat("ca-ES", {
    maximumFractionDigits: rounded >= 100 ? 0 : 1
  }).format(rounded);
}

function getProductionCost(item) {
  const owned = state.productionCounts[item.id];
  if (item.type === "crit") {
    return item.baseCost;
  }
  return Math.floor(item.baseCost * item.costMultiplier ** owned);
}

function getClickPower() {
  let total = 1;

  productionUpgrades.forEach((item) => {
    if (item.type === "click") {
      total += state.productionCounts[item.id] * item.value;
    }
  });

  hardwareUpgrades.forEach((item) => {
    if (state.hardwareOwned[item.id]) {
      total += item.value;
    }
  });

  return total;
}

function getAutoIncome() {
  let total = 0;

  productionUpgrades.forEach((item) => {
    if (item.type === "auto") {
      total += state.productionCounts[item.id] * item.value;
    }
  });

  hardwareUpgrades.forEach((item) => {
    if (state.hardwareOwned[item.id]) {
      total += item.auto;
    }
  });

  return total;
}

function getCritStats() {
  let chance = 0;

  productionUpgrades.forEach((item) => {
    if (item.type === "crit") {
      const owned = state.productionCounts[item.id];
      chance += owned * item.chance;
    }
  });

  return {
    chance: Math.min(chance, 0.25),
    multiplier: 2
  };
}

function isBasePart(id) {
  return basePartIds.includes(id);
}

function isAdvancedUpgrade(id) {
  return advancedUpgradeIds.includes(id);
}

function getBuiltBasePartsCount() {
  return basePartIds.filter((id) => state.hardwareOwned[id]).length;
}

function isRobotBuilt() {
  return getBuiltBasePartsCount() === basePartIds.length;
}

function isHardwareUnlocked(item) {
  if (state.hardwareOwned[item.id]) {
    return true;
  }

  if (isAdvancedUpgrade(item.id)) {
    return isRobotBuilt();
  }

  if (!isBasePart(item.id)) {
    return true;
  }

  const partIndex = basePartIds.indexOf(item.id);

  if (partIndex <= 0) {
    return true;
  }

  return basePartIds.slice(0, partIndex).every((id) => state.hardwareOwned[id]);
}

function getHardwareProgressScore() {
  let score = 0;

  hardwareUpgrades.forEach((item, index) => {
    if (state.hardwareOwned[item.id]) {
      score += isBasePart(item.id) ? 150 + index * 18 : 320 + index * 45;
    }
  });

  return score;
}

function getStageIndex() {
  const stageScore = getHardwareProgressScore();
  let currentStage = 0;

  stageData.forEach((stage, index) => {
    if (stageScore >= stage.threshold) {
      currentStage = index;
    }
  });

  return currentStage;
}

function getNextStageInfo(stageIndex) {
  return stageData[stageIndex + 1] || null;
}

function createShopItem(item, category) {
  const fragment = elements.shopTemplate.content.cloneNode(true);
  const button = fragment.querySelector(".shop-item");

  button.dataset.itemId = item.id;
  button.dataset.category = category;
  button.addEventListener("click", () => {
    if (category === "production") {
      buyProductionUpgrade(item.id);
      return;
    }

    buyHardwareUpgrade(item.id);
  });

  shopButtons.set(`${category}:${item.id}`, button);
  return fragment;
}

function renderShop() {
  productionUpgrades.forEach((item) => {
    elements.productionShop.appendChild(createShopItem(item, "production"));
  });

  hardwareUpgrades.forEach((item) => {
    elements.hardwareShop.appendChild(createShopItem(item, "hardware"));
  });
}

function updateShop() {
  productionUpgrades.forEach((item) => {
    const button = shopButtons.get(`production:${item.id}`);
    const cost = getProductionCost(item);
    const canAfford = state.money >= cost;
    const count = state.productionCounts[item.id];
    const isCritUpgrade = item.type === "crit";
    const owned = isCritUpgrade && count > 0;
    const available = canAfford && !owned;

    button.disabled = owned;
    button.classList.toggle("locked", (!canAfford && !owned));
    button.classList.toggle("owned", owned);
    button.classList.toggle("available", available);
    button.querySelector(".shop-name").textContent = item.name;
    button.querySelector(".shop-price").textContent = owned ? "Comprat" : `${formatNumber(cost)} €`;
    button.querySelector(".shop-effect").textContent = item.effectLabel;
    button.querySelector(".shop-count").textContent = isCritUpgrade ? "" : `Nivell ${count}`;
  });

  hardwareUpgrades.forEach((item) => {
    const button = shopButtons.get(`hardware:${item.id}`);
    const owned = state.hardwareOwned[item.id];
    const canAfford = state.money >= item.cost;
    const unlocked = isHardwareUnlocked(item);
    const available = unlocked && canAfford && !owned;

    button.classList.toggle("locked", (!canAfford && !owned) || !unlocked);
    button.classList.toggle("owned", owned);
    button.classList.toggle("available", available);
    button.disabled = owned || !unlocked;
    button.querySelector(".shop-name").textContent = item.name;
    button.querySelector(".shop-price").textContent = owned
      ? "Instal·lat"
      : unlocked
        ? `${formatNumber(item.cost)} €`
        : "Bloquejat";
    button.querySelector(".shop-effect").textContent = unlocked ? item.effectLabel : "Completa el robot";
    button.querySelector(".shop-count").textContent = "";
  });
}

// La fase visual puja tant pels diners totals com pels grans upgrades de hardware.
function updateVisualStage() {
  const stageIndex = getStageIndex();
  const stage = stageData[stageIndex];
  const nextStage = getNextStageInfo(stageIndex);
  const score = getHardwareProgressScore();
  const baseParts = getBuiltBasePartsCount();
  const currentThreshold = stage.threshold;
  const nextThreshold = nextStage ? nextStage.threshold : currentThreshold + 1;
  const progress = nextStage
    ? ((score - currentThreshold) / (nextThreshold - currentThreshold)) * 100
    : 100;

  elements.scene.className = `scene stage-${stageIndex + 1}`;
  elements.scene.classList.toggle("robot-start", baseParts === 0);
  elements.scene.classList.toggle("robot-building", baseParts > 0);
  elements.scene.classList.toggle("robot-complete", isRobotBuilt());

  hardwareUpgrades.forEach((item) => {
    if (state.hardwareOwned[item.id]) {
      elements.scene.classList.add(item.visualClass);
    }
  });

  if (elements.stageNameDisplay) {
    elements.stageNameDisplay.textContent = stage.name;
  }

  if (elements.stageFlavorDisplay) {
    elements.stageFlavorDisplay.textContent = stage.flavor;
  }

  elements.setupBadge.textContent = `Fase ${stageIndex + 1}`;

  if (elements.stageProgressBar) {
    elements.stageProgressBar.style.width = `${Math.max(8, Math.min(progress, 100))}%`;
  }
}

function updateStats() {
  const clickPower = getClickPower();
  const autoIncome = getAutoIncome();
  const currentStage = getStageIndex();
  const nextStage = getNextStageInfo(currentStage);

  elements.moneyDisplay.textContent = `${formatNumber(state.money)} €`;
  elements.clickValueDisplay.textContent = `${formatNumber(clickPower)} €`;
  elements.autoValueDisplay.textContent = `${formatNumber(autoIncome)} €`;
  if (elements.stageNameDisplay) {
    elements.stageNameDisplay.textContent = stageData[currentStage].name;
  }

  if (elements.nextStageDisplay) {
    elements.nextStageDisplay.textContent = nextStage ? nextStage.shortHint : "Màxim";
  }

  updateVisualStage();
  updateRobotUpgradeLayer();
  updateShop();
}

function spawnFloatingText(text, className = "float-text") {
  const node = document.createElement("div");
  node.className = className;
  node.textContent = text;
  node.style.left = `${36 + Math.random() * 28}%`;
  node.style.top = `${34 + Math.random() * 20}%`;
  elements.floatingLayer.appendChild(node);

  setTimeout(() => {
    node.remove();
  }, 850);
}

function triggerPurchaseBurst() {
  const burst = document.createElement("div");
  burst.className = "purchase-burst";
  elements.floatingLayer.appendChild(burst);

  setTimeout(() => {
    burst.remove();
  }, 700);
}

function triggerAutoIncomeBurst(amount) {
  const burst = document.createElement("div");
  burst.className = "auto-income-burst";
  elements.floatingLayer.appendChild(burst);
  spawnFloatingText(`+${formatNumber(amount)} €`, "float-text");

  setTimeout(() => {
    burst.remove();
  }, 700);
}

function updateRobotUpgradeLayer() {
  const activeUpgrades = hardwareUpgrades.filter((item) => state.hardwareOwned[item.id] && isAdvancedUpgrade(item.id));

  elements.robotUpgradeLayer.innerHTML = "";

  activeUpgrades.forEach((item) => {
    const visualClass = robotUpgradeVisuals[item.id];

    if (!visualClass) {
      return;
    }

    const module = document.createElement("div");
    const key = `hardware:${item.id}`;
    module.className = `robot-module ${visualClass}`;

    if (!visibleRobotUpgrades.has(key)) {
      module.classList.add("is-new");
      visibleRobotUpgrades.add(key);
    }

    elements.robotUpgradeLayer.appendChild(module);
  });

  const activeKeys = new Set(activeUpgrades.map((item) => `hardware:${item.id}`));
  Array.from(visibleRobotUpgrades).forEach((key) => {
    if (!activeKeys.has(key)) {
      visibleRobotUpgrades.delete(key);
    }
  });
}

function addMoney(amount) {
  state.money += amount;
  state.totalEarned += amount;
}

function hideIntroBanner() {
  if (!elements.introBanner) {
    return;
  }

  elements.introBanner.classList.remove("is-visible");

  if (introBannerTimeoutId) {
    window.clearTimeout(introBannerTimeoutId);
    introBannerTimeoutId = null;
  }
}

function showIntroBanner() {
  if (!elements.introBanner) {
    return;
  }

  elements.introBanner.classList.add("is-visible");
  introBannerTimeoutId = window.setTimeout(() => {
    hideIntroBanner();
  }, INTRO_BANNER_DURATION);
}

function handleClick() {
  hideIntroBanner();
  const clickPower = getClickPower();
  const critStats = getCritStats();
  const isCrit = Math.random() < critStats.chance;
  const clickAmount = isCrit ? clickPower * critStats.multiplier : clickPower;

  addMoney(clickAmount);
  state.manualClicks += 1;

  elements.pcButton.classList.remove("pulse");
  void elements.pcButton.offsetWidth;
  elements.pcButton.classList.add("pulse");

  spawnFloatingText(`${isCrit ? "CRITICO " : "+"}${formatNumber(clickAmount)} €`);
  updateStats();
}

function buyProductionUpgrade(id) {
  const item = productionUpgrades.find((entry) => entry.id === id);
  const cost = getProductionCost(item);

  if (state.money < cost || (item.type === "crit" && state.productionCounts[id] >= 1)) {
    return;
  }

  state.money -= cost;
  state.productionCounts[id] += 1;
  triggerPurchaseBurst();
  spawnFloatingText("+ boost");
  updateStats();
  saveGame();
}

function buyHardwareUpgrade(id) {
  const item = hardwareUpgrades.find((entry) => entry.id === id);

  if (state.hardwareOwned[id] || state.money < item.cost || !isHardwareUnlocked(item)) {
    return;
  }

  state.money -= item.cost;
  state.hardwareOwned[id] = true;
  triggerPurchaseBurst();
  spawnFloatingText("Peça nova");
  updateStats();
  saveGame();
}

function saveGame() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadGame() {
  const rawSave = localStorage.getItem(STORAGE_KEY);

  if (!rawSave) {
    return;
  }

  try {
    const parsed = JSON.parse(rawSave);

    state.money = Number(parsed.money) || 0;
    state.totalEarned = Number(parsed.totalEarned) || 0;
    state.manualClicks = Number(parsed.manualClicks) || 0;

    productionUpgrades.forEach((item) => {
      state.productionCounts[item.id] = Number(parsed.productionCounts?.[item.id]) || 0;
    });

    hardwareUpgrades.forEach((item) => {
      state.hardwareOwned[item.id] = Boolean(parsed.hardwareOwned?.[item.id]);
    });
  } catch (error) {
    console.warn("No s'ha pogut carregar la partida guardada.", error);
  }
}

function resetGame() {
  const confirmed = window.confirm("Vols esborrar tot el progrés i tornar al robot d'IA avariat?");

  if (!confirmed) {
    return;
  }

  state.money = 0;
  state.totalEarned = 0;
  state.manualClicks = 0;

  productionUpgrades.forEach((item) => {
    state.productionCounts[item.id] = 0;
  });

  hardwareUpgrades.forEach((item) => {
    state.hardwareOwned[item.id] = false;
  });

  localStorage.removeItem(STORAGE_KEY);
  updateStats();
}

function activateTab(tab) {
  elements.tabButtons.forEach((item) => {
    item.classList.toggle("active", item.dataset.tab === tab);
  });

  elements.tabPanels.forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.tabPanel === tab);
  });
}

function setupTabs() {
  elements.tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      activateTab(button.dataset.tab);
    });
  });
}

function startIncomeLoop() {
  setInterval(() => {
    const autoIncome = getAutoIncome();

    if (autoIncome > 0) {
      addMoney(autoIncome);
      triggerAutoIncomeBurst(autoIncome);
      updateStats();
    }
  }, 1000);
}

function startAutosaveLoop() {
  setInterval(() => {
    saveGame();
  }, 5000);
}

function bindEvents() {
  elements.pcButton.addEventListener("click", handleClick);
  elements.pcButton.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleClick();
    }
  });

  elements.resetButton.addEventListener("click", resetGame);
  window.addEventListener("beforeunload", saveGame);
}

function init() {
  renderShop();
  loadGame();
  setupTabs();
  bindEvents();
  updateStats();
  showIntroBanner();
  startIncomeLoop();
  startAutosaveLoop();
}

init();
