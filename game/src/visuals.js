const ASSET_PATHS = {
  bgNormal: "assets/pixel/BG_NORMAL.png",
  bgElite: "assets/pixel/BG_ELITE.png",
  bgBoss: "assets/pixel/BG_BOSS.png",
  charAida: "assets/pixel/CH_AIDA_idle.png",
  charMarcus: "assets/pixel/CH_MARCUS_idle.png",
  charKara: "assets/pixel/CH_KARA_idle.png",
  charLi: "assets/pixel/CH_LI_idle.png",
  enemyCultist: "assets/pixel/EN_FOLLOWER_idle.png",
  enemyMutant: "assets/pixel/EN_MUTANT_idle.png",
  enemyWatcher: "assets/pixel/EN_OBSERVER_idle.png",
  enemyZealot: "assets/pixel/EL_CULTIST_idle.png",
  enemyDeepSpawn: "assets/pixel/EN_MUTANT_ELITE_idle.png",
  enemyMemoryEater: "assets/pixel/EN_MUTANT_ELITE_idle.png",
  bossUmrAtl: "assets/pixel/BOSS_UMR_ATL_idle.png",
  consHealth: "assets/pixel/CONS_HEALTH.png",
  consSanity: "assets/pixel/CONS_SANITY.png",
  buffIronWall: "assets/pixel/PERM_IRONWALL.png",
  weaponPistol: "assets/pixel/WP_PISTOL.png",
  weaponStaff: "assets/pixel/WP_STAFF.png",
  uiButton: "assets/pixel/UI_BUTTON.png"
};

function createVisualState() {
  return {
    images: {},
    total: Object.keys(ASSET_PATHS).length,
    loaded: 0,
    ready: false
  };
}

function initializeVisuals(visuals) {
  if (!visuals || !tt || !tt.createImage) {
    return visuals;
  }

  const keys = Object.keys(ASSET_PATHS);
  if (!keys.length) {
    visuals.ready = true;
    return visuals;
  }

  for (let i = 0; i < keys.length; i += 1) {
    loadImage(visuals, keys[i], ASSET_PATHS[keys[i]]);
  }
  return visuals;
}

function loadImage(visuals, key, src) {
  const image = tt.createImage();
  image.onload = function onload() {
    visuals.loaded += 1;
    visuals.ready = visuals.loaded >= visuals.total;
  };
  image.onerror = function onerror() {
    visuals.loaded += 1;
    visuals.ready = visuals.loaded >= visuals.total;
  };
  image.src = src;
  visuals.images[key] = image;
}

function getVisual(visuals, key) {
  if (!visuals || !visuals.images) {
    return null;
  }
  return visuals.images[key] || null;
}

function getCharacterVisualKey(characterId) {
  if (characterId === "MARCUS") {
    return "charMarcus";
  }
  if (characterId === "KARA") {
    return "charKara";
  }
  if (characterId === "LI") {
    return "charLi";
  }
  return "charAida";
}

function getEnemyVisualKey(enemyId) {
  if (enemyId === "mutant") {
    return "enemyMutant";
  }
  if (enemyId === "watcher") {
    return "enemyWatcher";
  }
  if (enemyId === "zealot") {
    return "enemyZealot";
  }
  if (enemyId === "deepSpawn") {
    return "enemyDeepSpawn";
  }
  if (enemyId === "memoryEater") {
    return "enemyMemoryEater";
  }
  if (enemyId === "boss") {
    return "bossUmrAtl";
  }
  return "enemyCultist";
}

function getRoomBackgroundVisualKey(roomType) {
  if (roomType === "elite") {
    return "bgElite";
  }
  if (roomType === "boss") {
    return "bgBoss";
  }
  return "bgNormal";
}

function getWeaponVisualKey(weaponId) {
  if (weaponId === "spiritArray" || weaponId === "madnessWand" || weaponId === "ancientOffer") {
    return "weaponStaff";
  }
  return "weaponPistol";
}

function getConsumableVisualKey(consumableId) {
  if (consumableId === "sanityEssence") {
    return "consSanity";
  }
  if (consumableId === "shield") {
    return "buffIronWall";
  }
  return "consHealth";
}

module.exports = {
  ASSET_PATHS,
  createVisualState,
  getCharacterVisualKey,
  getConsumableVisualKey,
  getEnemyVisualKey,
  getRoomBackgroundVisualKey,
  getVisual,
  getWeaponVisualKey,
  initializeVisuals
};
