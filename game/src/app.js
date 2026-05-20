const {
  APP_NAME_CN,
  APP_NAME_EN,
  APP_NAME_SUB,
  AUDIO_CONFIG,
  BUFFS,
  CHARACTERS,
  CHARACTER_ORDER,
  CONFIG,
  CONSUMABLES,
  ENEMIES,
  PALETTE,
  ROOM_FLOW,
  SHRINE_EVENTS,
  WEAPONS
} = require("./constants");
const {
  createAudioState,
  initializeAudio,
  playAlert,
  playBossScream,
  playRoomIntro,
  playSkill,
  playUiTap,
  playVictory,
  setAudioEnabled,
  syncSceneAudio,
  toggleAudioEnabled
} = require("./audio");
const {
  createDefaultBestRecord,
  hydratePersistentState,
  markTutorialSeen,
  maybeConsumeSidebarReward,
  openSidebarRevisit,
  persistPersistentState,
  saveBestRecord,
  setupPlatformHooks,
  shareRunResult
} = require("./platform");
const {
  createVisualState,
  getCharacterVisualKey,
  getConsumableVisualKey,
  getEnemyVisualKey,
  getRoomBackgroundVisualKey,
  getVisual,
  getWeaponVisualKey,
  initializeVisuals
} = require("./visuals");

const SCENES = {
  START: "start",
  ROOM_INTRO: "room_intro",
  BATTLE: "battle",
  REWARD: "reward",
  EVENT: "event",
  REST: "rest",
  SWITCH: "switch",
  PAUSE: "pause",
  GAME_OVER: "game_over"
};

function createGame() {
  const systemInfo = tt.getSystemInfoSync();
  const canvas = tt.createCanvas();
  const ctx = canvas.getContext("2d");

  canvas.width = systemInfo.windowWidth;
  canvas.height = systemInfo.windowHeight;

  const state = {
    canvas,
    ctx,
    width: canvas.width,
    height: canvas.height,
    scale: Math.min(canvas.width / CONFIG.width, canvas.height / CONFIG.height),
    now: 0,
    lastFrameAt: 0,
    scene: SCENES.START,
    buttons: [],
    touches: [],
    joystick: {
      active: false,
      touchId: null,
      startX: 0,
      startY: 0,
      x: 0,
      y: 0
    },
    roomIndex: -1,
    room: null,
    roomIntroTimer: 0,
    roomElapsed: 0,
    runStartAt: 0,
    selectedCharacterId: "AIDA",
    runStats: {
      kills: 0,
      peakMadness: 0,
      roomsCleared: 0,
      lastTraceAt: 0,
      madnessTrace: []
    },
    player: createPlayer("AIDA"),
    enemies: [],
    bullets: [],
    enemyBullets: [],
    effects: [],
    drops: [],
    rewardOptions: [],
    eventOptions: [],
    notifications: [],
    ambientParticles: createAmbientParticles(34),
    arenaRect: null,
    bottomButtons: null,
    victory: false,
    tutorialSeen: false,
    showTutorial: false,
    sceneBeforePause: SCENES.BATTLE,
    bestRecord: createDefaultBestRecord(),
    platform: {
      pendingSidebarReward: false,
      pendingRunShield: 0,
      lastLaunchInfo: null
    },
    audio: createAudioState(AUDIO_CONFIG, systemInfo),
    visuals: createVisualState(),
    releaseFlags: {
      shareEnabled: Boolean(tt.shareAppMessage),
      sidebarEnabled: Boolean(tt.navigateToScene)
    }
  };

  hydratePersistentState(state);
  state.showTutorial = !state.tutorialSeen;
  initializeAudio(state.audio);
  initializeVisuals(state.visuals);
  setAudioEnabled(state.audio, state.audio.enabled);
  setupPlatformHooks(state, SCENES);
  syncSceneAudio(state);

  tt.onTouchStart((event) => onTouchStart(state, event));
  tt.onTouchMove((event) => onTouchMove(state, event));
  tt.onTouchEnd((event) => onTouchEnd(state, event));

  requestAnimationFrame((timestamp) => tick(state, timestamp));
}

function tick(state, timestamp) {
  if (!state.lastFrameAt) {
    state.lastFrameAt = timestamp;
  }
  const dt = Math.min(0.033, Math.max(0.008, (timestamp - state.lastFrameAt) / 1000));
  state.lastFrameAt = timestamp;
  state.now += dt;

  updateAmbientParticles(state, dt);
  updateScene(state, dt);
  render(state);

  requestAnimationFrame((nextTimestamp) => tick(state, nextTimestamp));
}

function updateScene(state, dt) {
  syncSceneAudio(state);

  if (maybeConsumeSidebarReward(state)) {
    if (state.scene === SCENES.START || state.scene === SCENES.GAME_OVER) {
      state.platform.pendingRunShield += 1;
      addNotification(state, "侧边栏回访奖励已存入下一局：开局获得 1 层护盾。", "success");
    } else {
      state.player.consumables.shield += 1;
      addNotification(state, "侧边栏回访奖励：当前获得 1 层护盾。", "success");
    }
  }

  if (state.scene === SCENES.START || state.scene === SCENES.GAME_OVER) {
    updateNotifications(state, dt);
    return;
  }

  if (state.scene === SCENES.PAUSE) {
    updateNotifications(state, dt);
    return;
  }

  if (state.scene === SCENES.ROOM_INTRO) {
    state.roomIntroTimer -= dt;
    if (state.roomIntroTimer <= 0) {
      enterRoomContent(state);
    }
    updateNotifications(state, dt);
    return;
  }

  if (state.scene === SCENES.BATTLE) {
    updateBattle(state, dt);
  }

  if (state.scene === SCENES.REWARD || state.scene === SCENES.EVENT || state.scene === SCENES.REST || state.scene === SCENES.SWITCH) {
    updateEffects(state, dt);
  }

  updateNotifications(state, dt);
}

function updateBattle(state, dt) {
  const player = state.player;
  state.roomElapsed += dt;

  updatePlayer(state, dt);
  updateEffects(state, dt);
  updateBullets(state, dt);
  updateEnemyBullets(state, dt);
  updateEnemies(state, dt);
  handleDrops(state);
  updateRoomFlow(state);
  updateRunTrace(state, dt);

  if (player.hp <= 0) {
    enterGameOver(state, false, "调查员被深渊吞没了。");
  }
}

function createPlayer(characterId) {
  const charData = CHARACTERS[characterId];
  return {
    characterId,
    characterOrderIndex: CHARACTER_ORDER.indexOf(characterId),
    x: CONFIG.width / 2,
    y: 640,
    radius: 18,
    hp: charData.hp,
    maxHp: charData.hp,
    baseMaxHp: charData.hp,
    sanity: charData.sanity,
    maxSanity: charData.sanity,
    baseMaxSanity: charData.sanity,
    madness: 0,
    maxMadness: 100,
    speed: charData.speed,
    baseDamage: charData.damage,
    color: charData.color,
    attackCooldown: 0,
    skillCooldown: 0,
    switchCooldown: 0,
    markTimer: 0,
    markedEnemyId: "",
    outOfControlTimer: 0,
    speedBoostTimer: 0,
    shield: 0,
    reviveUsed: false,
    roomHealPending: 0,
    exposedTimer: 0,
    predictionTimer: 0,
    weapons: ["pistol"],
    currentWeapon: "pistol",
    consumables: {
      healthPotion: 1,
      sanityEssence: 1,
      shield: 0
    },
    buffs: {}
  };
}

function updateRunTrace(state, dt) {
  state.runStats.lastTraceAt += dt;
  if (state.runStats.lastTraceAt < 0.2) {
    return;
  }

  state.runStats.lastTraceAt = 0;
  state.runStats.madnessTrace.push(Math.round(state.player.madness));
  if (state.runStats.madnessTrace.length > 42) {
    state.runStats.madnessTrace.shift();
  }
}

function enterGameOver(state, victory, message) {
  if (state.scene === SCENES.GAME_OVER) {
    return;
  }

  state.scene = SCENES.GAME_OVER;
  state.victory = Boolean(victory);
  addNotification(state, message, victory ? "success" : "danger");
  saveBestRecord(state);
  if (victory) {
    playVictory(state);
  } else {
    playAlert(state);
  }
  persistPersistentState(state);
}

function startRun(state) {
  state.player = createPlayer(state.selectedCharacterId || "AIDA");
  if (state.platform.pendingRunShield > 0) {
    state.player.consumables.shield += state.platform.pendingRunShield;
    state.platform.pendingRunShield = 0;
  }
  state.enemies = [];
  state.bullets = [];
  state.enemyBullets = [];
  state.effects = [];
  state.drops = [];
  state.rewardOptions = [];
  state.eventOptions = [];
  state.notifications = [];
  state.roomIndex = -1;
  state.roomElapsed = 0;
  state.runStartAt = state.now;
  state.runStats = {
    kills: 0,
    peakMadness: 0,
    roomsCleared: 0,
    lastTraceAt: 0,
    madnessTrace: []
  };
  state.victory = false;
  state.sceneBeforePause = SCENES.BATTLE;
  state.showTutorial = false;
  startNextRoom(state);
}

function startNextRoom(state) {
  state.roomIndex += 1;
  if (state.roomIndex >= ROOM_FLOW.length) {
    enterGameOver(state, true, "你暂时压住了深渊的心跳。");
    return;
  }

  state.room = cloneRoom(ROOM_FLOW[state.roomIndex]);
  state.roomElapsed = 0;
  state.roomIntroTimer = CONFIG.roomIntroMs / 1000;
  state.scene = SCENES.ROOM_INTRO;
  state.enemies = [];
  state.bullets = [];
  state.enemyBullets = [];
  state.effects = [];
  state.drops = [];
  state.rewardOptions = [];
  state.eventOptions = [];
  state.player.x = CONFIG.width / 2;
  state.player.y = 652;
  addNotification(state, `${state.room.name}`, "accent");
  playRoomIntro(state);
}

function enterRoomContent(state) {
  if (!state.room) {
    return;
  }

  if (state.room.type === "shrine") {
    state.scene = SCENES.EVENT;
    state.eventOptions = buildShrineOptions();
    return;
  }

  if (state.room.type === "rest") {
    state.scene = SCENES.REST;
    healPlayer(state.player, 30);
    restoreSanity(state.player, 20);
    addNotification(state, "短暂喘息，恢复生命与理智。", "success");
    return;
  }

  state.scene = SCENES.BATTLE;
  state.room.currentWave = 0;
  spawnWave(state);
}

function cloneRoom(room) {
  const copy = {};
  Object.keys(room).forEach((key) => {
    if (Array.isArray(room[key])) {
      copy[key] = JSON.parse(JSON.stringify(room[key]));
      return;
    }
    copy[key] = room[key];
  });
  return copy;
}

function spawnWave(state) {
  const room = state.room;
  if (!room || !room.waves || room.currentWave >= room.waves.length) {
    return;
  }

  const wave = room.waves[room.currentWave];
  const difficultyScale = 1 + state.roomIndex * 0.12;
  for (let i = 0; i < wave.length; i += 1) {
    const enemyId = wave[i];
    state.enemies.push(createEnemy(enemyId, i, difficultyScale));
  }
  room.currentWave += 1;
  addNotification(state, `第 ${room.currentWave} 波敌人出现`, "accent");
}

function createEnemy(enemyId, index, scaleFactor) {
  const template = ENEMIES[enemyId];
  const spawnPoints = [
    { x: 120, y: 170 + index * 80 },
    { x: 600, y: 170 + index * 80 },
    { x: 160 + index * 60, y: 220 },
    { x: 560 - index * 60, y: 880 }
  ];
  const point = spawnPoints[index % spawnPoints.length];

  return {
    id: `${enemyId}_${Date.now()}_${Math.floor(Math.random() * 100000)}_${index}`,
    type: enemyId,
    name: template.name,
    x: point.x,
    y: point.y,
    hp: template.hp * scaleFactor,
    maxHp: template.hp * scaleFactor,
    damage: template.damage * Math.min(1.8, scaleFactor),
    radius: template.radius,
    speed: template.speed * Math.min(1.5, scaleFactor),
    color: template.color,
    madnessGain: template.madnessGain,
    shooter: Boolean(template.shooter),
    expose: Boolean(template.expose),
    sanityBurn: Boolean(template.sanityBurn),
    aoe: Boolean(template.aoe),
    elite: Boolean(template.elite),
    boss: Boolean(template.boss),
    attackCooldown: 0,
    patternCooldown: 1.5,
    summonCooldown: 6,
    telegraphTimer: 0,
    marked: false,
    dead: false
  };
}

function updatePlayer(state, dt) {
  const player = state.player;
  const charData = CHARACTERS[player.characterId];

  if (player.attackCooldown > 0) {
    player.attackCooldown -= dt;
  }
  if (player.skillCooldown > 0) {
    player.skillCooldown -= dt;
  }
  if (player.switchCooldown > 0) {
    player.switchCooldown -= dt;
  }
  if (player.markTimer > 0) {
    player.markTimer -= dt;
    if (player.markTimer <= 0) {
      player.markedEnemyId = "";
    }
  }
  if (player.speedBoostTimer > 0) {
    player.speedBoostTimer -= dt;
  }
  if (player.predictionTimer > 0) {
    player.predictionTimer -= dt;
  }
  if (player.exposedTimer > 0) {
    player.exposedTimer -= dt;
  }
  if (player.outOfControlTimer > 0) {
    player.outOfControlTimer -= dt;
  }

  const moveVector = getInputVector(state);
  let inputX = moveVector.x;
  let inputY = moveVector.y;

  if (player.outOfControlTimer > 0) {
    inputX = Math.sin(state.now * 8.4);
    inputY = Math.cos(state.now * 6.6);
  }

  const speed = getPlayerSpeed(player, charData);
  player.x += inputX * speed * dt;
  player.y += inputY * speed * dt;

  const arena = getArenaRect();
  player.x = clamp(player.x, arena.x + player.radius, arena.x + arena.width - player.radius);
  player.y = clamp(player.y, arena.y + player.radius, arena.y + arena.height - player.radius);

  autoAttack(state);

  if (player.madness >= player.maxMadness) {
    triggerMadnessBreak(state);
  }

  if (player.madness > state.runStats.peakMadness) {
    state.runStats.peakMadness = Math.round(player.madness);
  }
}

function getInputVector(state) {
  if (!state.joystick.active) {
    return { x: 0, y: 0 };
  }
  return {
    x: state.joystick.x,
    y: state.joystick.y
  };
}

function getPlayerSpeed(player, charData) {
  let speed = charData.speed;
  if (player.madness >= 31 && player.madness <= 60) {
    speed *= 1.1;
  }
  if (player.madness >= 81) {
    speed *= 1.22;
  }
  if (player.speedBoostTimer > 0) {
    speed *= 1.22;
  }
  if (player.characterId === "MARCUS" && player.hp / player.maxHp <= 0.3) {
    speed *= 1.4;
  }
  if (player.predictionTimer > 0) {
    speed *= 1.15;
  }
  return speed;
}

function autoAttack(state) {
  const player = state.player;
  if (player.attackCooldown > 0) {
    return;
  }

  const target = getNearestEnemy(state, player.x, player.y, CONFIG.attackRange);
  if (!target) {
    return;
  }

  const weapon = WEAPONS[player.currentWeapon];
  const attackInterval = getAttackInterval(player, weapon);
  player.attackCooldown = attackInterval;

  const angle = Math.atan2(target.y - player.y, target.x - player.x);
  const pellets = weapon.pellets || 1;

  for (let i = 0; i < pellets; i += 1) {
    const spreadOffset = pellets === 1 ? 0 : (i - (pellets - 1) / 2) * (weapon.spread || 0.14);
    const bulletAngle = angle + spreadOffset + getMadnessSpread(player);
    const speed = weapon.bulletSpeed * (player.madness >= 81 ? 1.16 : 1);
    state.bullets.push({
      id: `b_${Date.now()}_${i}_${Math.random()}`,
      owner: "player",
      weaponId: weapon.id,
      x: player.x,
      y: player.y,
      vx: Math.cos(bulletAngle) * speed,
      vy: Math.sin(bulletAngle) * speed,
      damage: getBulletDamage(state, weapon, target),
      radius: weapon.id === "shotgun" ? 6 : 5,
      color: weapon.color,
      life: 1.6,
      homing: Boolean(weapon.homing),
      ricochet: weapon.ricochet ? 1 : 0,
      penetrate: getPenetrationCount(player)
    });
  }

  emitFlash(state, player.x, player.y, weapon.color, 0.12);
}

function getAttackInterval(player, weapon) {
  let interval = weapon.interval;
  if (player.madness >= 31 && player.madness <= 60) {
    interval *= 0.95;
  }
  if (player.madness >= 81) {
    interval *= 0.7;
  }
  return interval;
}

function getBulletDamage(state, weapon, target) {
  const player = state.player;
  let damage = state.player.baseDamage + weapon.damage;
  if (weapon.madnessBonus) {
    damage += player.madness * weapon.madnessBonus;
  }
  if (player.characterId === "KARA" && Math.random() < getCritChance(player)) {
    damage *= 1.6;
    emitFlash(state, target.x, target.y, "#FFCC66", 0.15);
  }
  if (player.madness >= 61 && player.madness <= 80) {
    damage *= 1.25;
  }
  if (player.madness >= 81) {
    damage *= 1.5;
  }
  if (player.characterId === "MARCUS" && player.hp / player.maxHp <= 0.3) {
    damage *= 1.2;
  }
  if (player.markedEnemyId && player.markedEnemyId === target.id) {
    damage *= 1.5;
  }
  return damage;
}

function getCritChance(player) {
  let chance = 0.06;
  if (player.characterId === "KARA") {
    chance += 0.15;
  }
  if (player.buffs.critBlessing) {
    chance += BUFFS.critBlessing.value;
  }
  return chance;
}

function getMadnessSpread(player) {
  if (player.madness < 61) {
    return 0;
  }
  if (player.madness < 81) {
    return randomRange(-0.04, 0.04);
  }
  return randomRange(-0.12, 0.12);
}

function getPenetrationCount(player) {
  let value = 0;
  if (player.buffs.bulletPenetrate) {
    value += BUFFS.bulletPenetrate.value;
  }
  return value;
}

function updateBullets(state, dt) {
  const aliveBullets = [];
  for (let i = 0; i < state.bullets.length; i += 1) {
    const bullet = state.bullets[i];
    bullet.life -= dt;
    if (bullet.life <= 0) {
      continue;
    }

    if (bullet.homing) {
      const target = getNearestEnemy(state, bullet.x, bullet.y, 180);
      if (target) {
        const angle = Math.atan2(target.y - bullet.y, target.x - bullet.x);
        const speed = Math.sqrt(bullet.vx * bullet.vx + bullet.vy * bullet.vy);
        bullet.vx += Math.cos(angle) * speed * 0.08;
        bullet.vy += Math.sin(angle) * speed * 0.08;
        const length = Math.max(1, Math.sqrt(bullet.vx * bullet.vx + bullet.vy * bullet.vy));
        bullet.vx = (bullet.vx / length) * speed;
        bullet.vy = (bullet.vy / length) * speed;
      }
    }

    bullet.x += bullet.vx * dt;
    bullet.y += bullet.vy * dt;

    if (isOutsideArena(bullet.x, bullet.y, 24)) {
      if (bullet.ricochet > 0) {
        bullet.ricochet -= 1;
        if (bullet.x < 88 || bullet.x > 632) {
          bullet.vx *= -1;
        }
        if (bullet.y < 120 || bullet.y > 1080) {
          bullet.vy *= -1;
        }
      } else {
        continue;
      }
    }

    const hitEnemy = findBulletEnemyCollision(state, bullet);
    if (hitEnemy) {
      damageEnemy(state, hitEnemy, bullet.damage);
      if (state.player.buffs.madnessResonance && state.player.madness >= 50) {
        splashMadnessDamage(state, hitEnemy.x, hitEnemy.y, BUFFS.madnessResonance.value);
      }
      if (bullet.penetrate > 0) {
        bullet.penetrate -= 1;
      } else {
        continue;
      }
    }

    aliveBullets.push(bullet);
  }
  state.bullets = aliveBullets;
}

function updateEnemyBullets(state, dt) {
  const alive = [];
  for (let i = 0; i < state.enemyBullets.length; i += 1) {
    const bullet = state.enemyBullets[i];
    bullet.life -= dt;
    if (bullet.life <= 0) {
      continue;
    }
    bullet.x += bullet.vx * dt;
    bullet.y += bullet.vy * dt;

    if (isOutsideArena(bullet.x, bullet.y, 26)) {
      continue;
    }

    if (distance(bullet.x, bullet.y, state.player.x, state.player.y) <= bullet.radius + state.player.radius) {
      playerTakeDamage(state, bullet.damage, bullet.type === "scream" ? 18 : 5);
      emitFlash(state, bullet.x, bullet.y, "#FF7B7B", 0.16);
      continue;
    }

    alive.push(bullet);
  }
  state.enemyBullets = alive;
}

function updateEnemies(state, dt) {
  const aliveEnemies = [];
  for (let i = 0; i < state.enemies.length; i += 1) {
    const enemy = state.enemies[i];
    if (enemy.dead) {
      continue;
    }

    if (enemy.attackCooldown > 0) {
      enemy.attackCooldown -= dt;
    }
    if (enemy.patternCooldown > 0) {
      enemy.patternCooldown -= dt;
    }
    if (enemy.summonCooldown > 0) {
      enemy.summonCooldown -= dt;
    }
    if (enemy.telegraphTimer > 0) {
      enemy.telegraphTimer -= dt;
    }

    if (enemy.boss) {
      updateBoss(state, enemy, dt);
      aliveEnemies.push(enemy);
      continue;
    }

    const dx = state.player.x - enemy.x;
    const dy = state.player.y - enemy.y;
    const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
    const desiredDistance = enemy.shooter ? 220 : 0;

    if (dist > desiredDistance + 6) {
      enemy.x += (dx / dist) * enemy.speed * dt;
      enemy.y += (dy / dist) * enemy.speed * dt;
    }

    if (enemy.expose && enemy.attackCooldown <= 0 && dist < 250) {
      state.player.exposedTimer = Math.max(state.player.exposedTimer, 2.4);
      enemy.attackCooldown = 2.8;
      emitCircle(state, state.player.x, state.player.y, 42, "#6D82D9", 0.35);
    } else if (enemy.shooter && enemy.attackCooldown <= 0 && dist < 340) {
      fireEnemyBullet(state, enemy, state.player, 240, 8, "spit");
      enemy.attackCooldown = 1.4;
    } else if (!enemy.shooter && dist <= enemy.radius + state.player.radius + 4 && enemy.attackCooldown <= 0) {
      playerTakeDamage(state, enemy.damage, enemy.sanityBurn ? 10 : 5);
      enemy.attackCooldown = 1.2;
      if (enemy.sanityBurn) {
        addMadness(state.player, 10, state);
      }
    }

    aliveEnemies.push(enemy);
  }

  state.enemies = aliveEnemies;
}

function updateBoss(state, boss, dt) {
  const phase = getBossPhase(boss);
  const dx = state.player.x - boss.x;
  const dy = state.player.y - boss.y;
  const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
  if (dist > 220) {
    boss.x += (dx / dist) * boss.speed * dt;
    boss.y += (dy / dist) * boss.speed * dt;
  }

  if (boss.patternCooldown <= 0) {
    spawnBossSweep(state, boss, phase);
    boss.patternCooldown = phase === 3 ? 2.6 : (phase === 2 ? 3.2 : 4.2);
  }

  if (phase >= 2 && randomRange(0, 1) > 0.985) {
    spawnBossBomb(state, boss);
  }

  if (phase === 3 && boss.summonCooldown <= 0) {
    spawnBossScream(state, boss);
    boss.summonCooldown = 10.5;
  }

  if (phase <= 2 && boss.summonCooldown <= 0) {
    summonAdds(state, phase === 1 ? "cultist" : "mutant", phase === 1 ? 2 : 3);
    boss.summonCooldown = 7.5;
  }

  if (dist <= boss.radius + state.player.radius + 10 && boss.attackCooldown <= 0) {
    playerTakeDamage(state, boss.damage, 10);
    boss.attackCooldown = 1.1;
  }
}

function getBossPhase(boss) {
  const percent = boss.hp / boss.maxHp;
  if (percent > 0.66) {
    return 1;
  }
  if (percent > 0.33) {
    return 2;
  }
  return 3;
}

function spawnBossSweep(state, boss, phase) {
  const direction = Math.random() > 0.5 ? 1 : -1;
  const y = randomRange(220, 860);
  state.effects.push({
    type: "telegraph_line",
    x1: direction > 0 ? 90 : 630,
    y1: y,
    x2: direction > 0 ? 630 : 90,
    y2: y,
    color: "#FF7B7B",
    timer: 0.55
  });
  state.effects.push({
    type: "delayed_action",
    timer: 0.55,
    action: function delayedSweep() {
      for (let i = 0; i < 7 + phase * 2; i += 1) {
        const x = direction > 0 ? 90 + i * 76 : 630 - i * 76;
        state.enemyBullets.push({
          x,
          y,
          vx: direction * 220,
          vy: 0,
          radius: 10,
          damage: 12 + phase * 3,
          type: "sweep",
          life: 2.2
        });
      }
    }
  });
}

function spawnBossBomb(state, boss) {
  const x = randomRange(140, 580);
  const y = randomRange(240, 840);
  state.effects.push({
    type: "telegraph_circle",
    x,
    y,
    radius: 54,
    color: "#FFB16D",
    timer: 0.9
  });
  state.effects.push({
    type: "delayed_action",
    timer: 0.9,
    action: function delayedBomb() {
      state.enemyBullets.push({
        x,
        y,
        vx: 0,
        vy: 0,
        radius: 44,
        damage: 22,
        type: "bomb",
        life: 0.2
      });
    }
  });
}

function spawnBossScream(state, boss) {
  playBossScream(state);
  state.effects.push({
    type: "banner",
    text: "疯狂尖啸",
    color: "#FF5CFF",
    timer: 1.1
  });
  state.effects.push({
    type: "delayed_action",
    timer: 1.1,
    action: function delayedScream() {
      state.enemyBullets.push({
        x: boss.x,
        y: boss.y,
        vx: 0,
        vy: 0,
        radius: 999,
        damage: 10,
        type: "scream",
        life: 0.1
      });
      addMadness(state.player, 22, state);
      emitFlash(state, boss.x, boss.y, "#FF5CFF", 0.25);
    }
  });
}

function summonAdds(state, enemyId, count) {
  for (let i = 0; i < count; i += 1) {
    state.enemies.push(createEnemy(enemyId, i + 1, 1.4 + state.roomIndex * 0.1));
  }
  addNotification(state, "深渊召来新的信徒。", "danger");
}

function fireEnemyBullet(state, enemy, player, speed, radius, type) {
  const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
  state.enemyBullets.push({
    x: enemy.x,
    y: enemy.y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    radius,
    damage: enemy.damage,
    type,
    life: 3
  });
}

function playerTakeDamage(state, amount, madnessGain) {
  const player = state.player;
  if (player.shield > 0) {
    player.shield -= 1;
    emitCircle(state, player.x, player.y, 32, "#F7D05A", 0.25);
    playAlert(state);
    return;
  }

  player.hp -= amount;
  addMadness(player, madnessGain, state);
  emitFlash(state, player.x, player.y, "#FF7B7B", 0.22);
  playAlert(state);

  if (player.hp <= 0 && player.buffs.guardianAngel && !player.reviveUsed) {
    player.reviveUsed = true;
    player.hp = 50;
    emitCircle(state, player.x, player.y, 62, "#FFF0AE", 0.32);
    addNotification(state, "守护天使触发，侥幸续命。", "success");
  }
}

function addMadness(player, amount, state) {
  let finalAmount = amount;
  if (player.characterId === "AIDA") {
    finalAmount *= 0.8;
  }
  player.madness = clamp(player.madness + finalAmount, 0, player.maxMadness);
  if (player.madness > state.runStats.peakMadness) {
    state.runStats.peakMadness = Math.round(player.madness);
  }
}

function healPlayer(player, amount) {
  player.hp = clamp(player.hp + amount, 0, player.maxHp);
}

function restoreSanity(player, amount) {
  player.sanity = clamp(player.sanity + amount, 0, player.maxSanity);
}

function triggerMadnessBreak(state) {
  const player = state.player;
  player.madness = 50;
  player.outOfControlTimer = 1.1;
  player.hp -= 15;
  emitFlash(state, player.x, player.y, "#FF2D72", 0.3);
  addNotification(state, "疯狂失控，短暂失去身体控制。", "danger");
  playAlert(state);
}

function damageEnemy(state, enemy, amount) {
  enemy.hp -= amount;
  emitFlash(state, enemy.x, enemy.y, enemy.color, 0.12);
  if (enemy.hp > 0) {
    return;
  }

  enemy.dead = true;
  state.runStats.kills += 1;
  addMadness(state.player, enemy.madnessGain, state);
  if (state.player.buffs.lifeSteal) {
    healPlayer(state.player, BUFFS.lifeSteal.value);
  }
  if (enemy.id === state.player.markedEnemyId && state.player.characterId === "KARA") {
    state.player.skillCooldown = 0;
    state.player.markedEnemyId = "";
    state.player.markTimer = 0;
  }
  spawnDrop(state, enemy);
}

function splashMadnessDamage(state, x, y, amount) {
  for (let i = 0; i < state.enemies.length; i += 1) {
    const enemy = state.enemies[i];
    if (enemy.dead) {
      continue;
    }
    if (distance(x, y, enemy.x, enemy.y) <= 72) {
      enemy.hp -= amount;
      if (enemy.hp <= 0) {
        damageEnemy(state, enemy, 0);
      }
    }
  }
  emitCircle(state, x, y, 74, "#9B70FF", 0.18);
}

function spawnDrop(state, enemy) {
  if (enemy.boss) {
    return;
  }
  const roll = Math.random();
  if (roll < 0.42) {
    state.drops.push({
      kind: "madnessShard",
      x: enemy.x,
      y: enemy.y,
      radius: 12,
      color: "#6B2D8B",
      life: 8
    });
    return;
  }
  if (roll < 0.62) {
    state.drops.push({
      kind: "sanityOrb",
      x: enemy.x,
      y: enemy.y,
      radius: 12,
      color: "#4A90D9",
      life: 8
    });
  }
}

function handleDrops(state) {
  const alive = [];
  for (let i = 0; i < state.drops.length; i += 1) {
    const drop = state.drops[i];
    drop.life -= 1 / 60;
    if (drop.life <= 0) {
      continue;
    }
    if (distance(drop.x, drop.y, state.player.x, state.player.y) <= drop.radius + state.player.radius + 8) {
      if (drop.kind === "madnessShard") {
        addMadness(state.player, 6, state);
      } else if (drop.kind === "sanityOrb") {
        restoreSanity(state.player, 8);
      }
      emitCircle(state, drop.x, drop.y, 26, drop.color, 0.16);
      continue;
    }
    alive.push(drop);
  }
  state.drops = alive;
}

function updateRoomFlow(state) {
  if (!state.room || state.scene !== SCENES.BATTLE) {
    return;
  }

  const livingEnemies = state.enemies.filter((enemy) => !enemy.dead);
  if (livingEnemies.length > 0 || state.enemyBullets.length > 0) {
    return;
  }

  if (state.room.currentWave < state.room.waves.length) {
    spawnWave(state);
    return;
  }

  state.runStats.roomsCleared += 1;
  if (state.room.type === "boss") {
    enterGameOver(state, true, "乌姆·亚特倒下了。");
    return;
  }

  state.rewardOptions = buildRewardOptions(state.room.type === "elite");
  state.scene = SCENES.REWARD;
}

function buildRewardOptions(isElite) {
  const options = [];
  const weaponIds = Object.keys(WEAPONS);
  const buffIds = Object.keys(BUFFS);
  const consumableIds = Object.keys(CONSUMABLES);

  options.push({
    kind: "weapon",
    id: randomPick(weaponIds.slice(isElite ? 1 : 0))
  });
  options.push({
    kind: "buff",
    id: randomPick(buffIds)
  });
  options.push({
    kind: "consumable",
    id: randomPick(consumableIds)
  });
  return options;
}

function buildShrineOptions() {
  return [
    { kind: "event", id: "blessing" },
    { kind: "event", id: "curse" },
    { kind: "event", id: "merchant" }
  ];
}

function applyReward(state, option) {
  if (!option) {
    return;
  }

  if (option.kind === "weapon") {
    if (state.player.weapons.indexOf(option.id) === -1) {
      state.player.weapons.push(option.id);
    }
    state.player.currentWeapon = option.id;
    addNotification(state, `获得武器：${WEAPONS[option.id].name}`, "success");
  } else if (option.kind === "buff") {
    state.player.buffs[option.id] = true;
    applyBuff(state.player, option.id);
    addNotification(state, `获得强化：${BUFFS[option.id].name}`, "success");
  } else if (option.kind === "consumable") {
    state.player.consumables[option.id] += 1;
    addNotification(state, `获得补给：${CONSUMABLES[option.id].name}`, "success");
  }

  startNextRoom(state);
}

function applyBuff(player, buffId) {
  if (buffId === "ironWall") {
    player.maxHp += BUFFS.ironWall.value;
    player.hp += BUFFS.ironWall.value;
  } else if (buffId === "madnessWill") {
    player.maxMadness += BUFFS.madnessWill.value;
  }
}

function applyEventChoice(state, option) {
  const eventData = SHRINE_EVENTS[option.id];
  if (!eventData) {
    return;
  }

  if (option.id === "blessing") {
    const rewardId = randomPick(eventData.rewards);
    state.player.buffs[rewardId] = true;
    applyBuff(state.player, rewardId);
    addNotification(state, `祝福生效：${BUFFS[rewardId].name}`, "success");
  } else if (option.id === "curse") {
    addMadness(state.player, 25, state);
    state.player.baseDamage += 6;
    addNotification(state, "黑暗低语加深了疯狂，也强化了火力。", "danger");
  } else if (option.id === "merchant") {
    const reward = randomPick(eventData.rewards);
    state.player.consumables[reward] += 1;
    state.player.madness = Math.max(0, state.player.madness - 12);
    addNotification(state, `从商人处换来：${CONSUMABLES[reward].name}`, "accent");
  }

  startNextRoom(state);
}

function useSkill(state) {
  const player = state.player;
  const charId = player.characterId;
  if (player.skillCooldown > 0) {
    addNotification(state, "技能还在冷却。", "danger");
    return;
  }

  if (charId === "AIDA") {
    if (player.sanity < 30) {
      addNotification(state, "理智不足，无法释放精神冲击。", "danger");
      return;
    }
    player.sanity -= 30;
    player.skillCooldown = CHARACTERS.AIDA.skillCooldown;
    emitCircle(state, player.x, player.y, 130, "#7DD6FF", 0.28);
    playSkill(state);
    for (let i = 0; i < state.enemies.length; i += 1) {
      const enemy = state.enemies[i];
      if (!enemy.dead && distance(player.x, player.y, enemy.x, enemy.y) <= 128) {
        damageEnemy(state, enemy, state.player.baseDamage * 2.2);
      }
    }
    addNotification(state, "精神冲击释放成功。", "success");
    return;
  }

  if (charId === "MARCUS") {
    player.skillCooldown = CHARACTERS.MARCUS.skillCooldown;
    healPlayer(player, 40);
    emitCircle(state, player.x, player.y, 54, "#4A9D4A", 0.25);
    playSkill(state);
    addNotification(state, "急救术恢复了生命。", "success");
    return;
  }

  if (charId === "KARA") {
    const target = getNearestEnemy(state, player.x, player.y, 420);
    if (!target) {
      addNotification(state, "附近没有可以标记的敌人。", "danger");
      return;
    }
    player.markedEnemyId = target.id;
    player.markTimer = 5;
    player.skillCooldown = CHARACTERS.KARA.skillCooldown;
    emitCircle(state, target.x, target.y, 34, "#D95448", 0.2);
    playSkill(state);
    addNotification(state, `已标记 ${target.name}。`, "accent");
    return;
  }

  player.predictionTimer = 5;
  player.skillCooldown = CHARACTERS.LI.skillCooldown;
  emitCircle(state, player.x, player.y, 48, "#4A90D9", 0.2);
  playSkill(state);
  addNotification(state, "预判强化开启，危险预警更清晰。", "success");
}

function useConsumable(state) {
  const player = state.player;
  if (player.consumables.healthPotion > 0 && player.hp < player.maxHp * 0.7) {
    player.consumables.healthPotion -= 1;
    healPlayer(player, 40);
    emitCircle(state, player.x, player.y, 42, "#D95448", 0.22);
    playUiTap(state);
    addNotification(state, "使用治疗药水。", "success");
    return;
  }
  if (player.consumables.sanityEssence > 0 && player.madness > 40) {
    player.consumables.sanityEssence -= 1;
    player.madness = Math.max(0, player.madness - 30);
    emitCircle(state, player.x, player.y, 42, "#4A90D9", 0.22);
    playUiTap(state);
    addNotification(state, "理智精华压低了疯狂。", "success");
    return;
  }
  if (player.consumables.shield > 0) {
    player.consumables.shield -= 1;
    player.shield += 1;
    emitCircle(state, player.x, player.y, 42, "#F7D05A", 0.22);
    playUiTap(state);
    addNotification(state, "护盾符咒已激活。", "success");
    return;
  }
  addNotification(state, "当前没有合适的消耗品可用。", "danger");
}

function switchCharacter(state, index) {
  if (state.player.switchCooldown > 0) {
    addNotification(state, "角色切换还在冷却。", "danger");
    return;
  }
  const nextId = CHARACTER_ORDER[index];
  if (!nextId || nextId === state.player.characterId) {
    state.scene = SCENES.BATTLE;
    return;
  }

  const currentHpRatio = state.player.maxHp > 0 ? state.player.hp / state.player.maxHp : 1;
  const currentMadness = state.player.madness;
  const currentWeapons = state.player.weapons.slice();
  const currentWeapon = state.player.currentWeapon;
  const currentConsumables = copyConsumables(state.player.consumables);
  const currentBuffs = copyBuffs(state.player.buffs);
  const currentShield = state.player.shield;
  const currentReviveUsed = state.player.reviveUsed;

  state.player = createPlayer(nextId);
  state.player.weapons = currentWeapons;
  state.player.currentWeapon = currentWeapons.indexOf(currentWeapon) >= 0 ? currentWeapon : currentWeapons[0];
  state.player.consumables = currentConsumables;
  state.player.buffs = currentBuffs;
  state.player.shield = currentShield;
  state.player.reviveUsed = currentReviveUsed;
  reapplyAllBuffs(state.player);
  state.player.madness = clamp(currentMadness + CONFIG.switchMadnessCost, 0, state.player.maxMadness);
  state.player.hp = clamp(state.player.maxHp * currentHpRatio, 1, state.player.maxHp);
  state.player.x = clamp(state.player.x, 110, 610);
  state.player.y = clamp(state.player.y, 150, 1010);
  state.player.switchCooldown = 3;
  state.scene = SCENES.BATTLE;
  playUiTap(state);
  addNotification(state, `切换为 ${CHARACTERS[nextId].title}${CHARACTERS[nextId].shortName}`, "accent");
}

function reapplyAllBuffs(player) {
  const keys = Object.keys(player.buffs);
  for (let i = 0; i < keys.length; i += 1) {
    applyBuff(player, keys[i]);
  }
}

function copyConsumables(consumables) {
  return {
    healthPotion: consumables.healthPotion,
    sanityEssence: consumables.sanityEssence,
    shield: consumables.shield
  };
}

function copyBuffs(buffs) {
  const copy = {};
  Object.keys(buffs).forEach((key) => {
    copy[key] = buffs[key];
  });
  return copy;
}

function updateEffects(state, dt) {
  const alive = [];
  for (let i = 0; i < state.effects.length; i += 1) {
    const effect = state.effects[i];
    effect.timer -= dt;
    if (effect.type === "delayed_action" && effect.timer <= 0) {
      effect.action();
      continue;
    }
    if (effect.timer > 0) {
      alive.push(effect);
    }
  }
  state.effects = alive;
}

function updateNotifications(state, dt) {
  const alive = [];
  for (let i = 0; i < state.notifications.length; i += 1) {
    const item = state.notifications[i];
    item.timer -= dt;
    item.y -= dt * 20;
    if (item.timer > 0) {
      alive.push(item);
    }
  }
  state.notifications = alive;
}

function addNotification(state, text, tone) {
  state.notifications.push({
    text,
    tone: tone || "accent",
    timer: 2.4,
    y: 134
  });
}

function emitFlash(state, x, y, color, timer) {
  state.effects.push({
    type: "flash",
    x,
    y,
    radius: 18,
    color,
    timer: timer || 0.15
  });
}

function emitCircle(state, x, y, radius, color, timer) {
  state.effects.push({
    type: "circle",
    x,
    y,
    radius,
    color,
    timer: timer || 0.2
  });
}

function createAmbientParticles(count) {
  const items = [];
  for (let i = 0; i < count; i += 1) {
    items.push({
      x: randomRange(0, CONFIG.width),
      y: randomRange(0, CONFIG.height),
      radius: i % 5 === 0 ? 2.4 : 1.2,
      speed: randomRange(4, 18),
      alpha: randomRange(0.12, 0.55)
    });
  }
  return items;
}

function updateAmbientParticles(state, dt) {
  for (let i = 0; i < state.ambientParticles.length; i += 1) {
    const particle = state.ambientParticles[i];
    particle.y += particle.speed * dt;
    if (particle.y > CONFIG.height + 10) {
      particle.y = -10;
      particle.x = randomRange(0, CONFIG.width);
    }
  }
}

function onTouchStart(state, event) {
  const touches = event.touches || [];
  state.touches = touches;
  const changedTouch = touches[touches.length - 1];
  if (!changedTouch) {
    return;
  }

  const point = toGamePoint(state, changedTouch.clientX, changedTouch.clientY);

  if (handleButtonTap(state, point.x, point.y)) {
    return;
  }

  if (state.scene === SCENES.START) {
    return;
  }
  if (state.scene === SCENES.GAME_OVER) {
    return;
  }
  if (state.scene === SCENES.BATTLE && point.x < CONFIG.width * 0.45 && point.y > CONFIG.height * 0.55) {
    state.joystick.active = true;
    state.joystick.touchId = changedTouch.identifier;
    state.joystick.startX = point.x;
    state.joystick.startY = point.y;
    state.joystick.x = 0;
    state.joystick.y = 0;
  }
}

function onTouchMove(state, event) {
  const touches = event.touches || [];
  state.touches = touches;
  if (!state.joystick.active) {
    return;
  }

  for (let i = 0; i < touches.length; i += 1) {
    if (touches[i].identifier === state.joystick.touchId) {
      const point = toGamePoint(state, touches[i].clientX, touches[i].clientY);
      const dx = point.x - state.joystick.startX;
      const dy = point.y - state.joystick.startY;
      const distanceValue = Math.max(1, Math.sqrt(dx * dx + dy * dy));
      const ratio = Math.min(1, distanceValue / CONFIG.joystickRadius);
      state.joystick.x = (dx / distanceValue) * ratio;
      state.joystick.y = (dy / distanceValue) * ratio;
      return;
    }
  }
}

function onTouchEnd(state, event) {
  const touches = event.touches || [];
  state.touches = touches;

  if (!state.joystick.active) {
    return;
  }
  let stillExists = false;
  for (let i = 0; i < touches.length; i += 1) {
    if (touches[i].identifier === state.joystick.touchId) {
      stillExists = true;
      break;
    }
  }

  if (!stillExists) {
    state.joystick.active = false;
    state.joystick.touchId = null;
    state.joystick.x = 0;
    state.joystick.y = 0;
  }
}

function handleButtonTap(state, x, y) {
  for (let i = state.buttons.length - 1; i >= 0; i -= 1) {
    const button = state.buttons[i];
    if (isInsideRect(x, y, button.rect)) {
      playUiTap(state);
      button.onTap();
      return true;
    }
  }
  return false;
}

function render(state) {
  const ctx = state.ctx;
  ctx.clearRect(0, 0, state.width, state.height);
  fitCanvasToReference(state);

  ctx.save();
  ctx.scale(state.scale, state.scale);
  ctx.imageSmoothingEnabled = false;
  drawBackground(state);
  state.buttons = [];

  if (state.scene === SCENES.START) {
    drawStartScene(state);
  } else if (state.scene === SCENES.ROOM_INTRO) {
    drawBattleScene(state);
    drawRoomIntroCard(state);
  } else if (state.scene === SCENES.BATTLE) {
    drawBattleScene(state);
  } else if (state.scene === SCENES.REWARD) {
    drawBattleScene(state);
    drawRewardScene(state);
  } else if (state.scene === SCENES.EVENT) {
    drawBattleScene(state);
    drawEventScene(state);
  } else if (state.scene === SCENES.REST) {
    drawBattleScene(state);
    drawRestScene(state);
  } else if (state.scene === SCENES.SWITCH) {
    drawBattleScene(state);
    drawSwitchScene(state);
  } else if (state.scene === SCENES.PAUSE) {
    drawBattleScene(state);
    drawPauseScene(state);
  } else if (state.scene === SCENES.GAME_OVER) {
    drawBattleScene(state);
    drawGameOverScene(state);
  }

  if (state.showTutorial) {
    drawTutorialOverlay(state);
  }

  drawNotifications(state);
  ctx.restore();
}

function fitCanvasToReference(state) {
  state.scale = Math.min(state.width / CONFIG.width, state.height / CONFIG.height);
}

function getRoomCount() {
  return ROOM_FLOW.length;
}

function getCurrentRoomType(state) {
  if (state.room && state.room.type) {
    return state.room.type;
  }
  return "normal";
}

function getVisualImage(state, key) {
  return getVisual(state.visuals, key);
}

function drawCoverImage(ctx, image, x, y, width, height, alpha) {
  if (!image || !image.width || !image.height) {
    return false;
  }

  const scale = Math.max(width / image.width, height / image.height);
  const drawWidth = image.width * scale;
  const drawHeight = image.height * scale;
  const offsetX = x + (width - drawWidth) / 2;
  const offsetY = y + (height - drawHeight) / 2;

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  if (alpha !== undefined) {
    ctx.globalAlpha = alpha;
  }
  ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
  ctx.restore();
  return true;
}

function drawContainedImage(ctx, image, x, y, width, height, alpha) {
  if (!image || !image.width || !image.height) {
    return false;
  }

  const scale = Math.min(width / image.width, height / image.height);
  const drawWidth = image.width * scale;
  const drawHeight = image.height * scale;
  const offsetX = x + (width - drawWidth) / 2;
  const offsetY = y + (height - drawHeight) / 2;

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  if (alpha !== undefined) {
    ctx.globalAlpha = alpha;
  }
  ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
  ctx.restore();
  return true;
}

function drawBackground(state) {
  const ctx = state.ctx;
  const backgroundKey = getRoomBackgroundVisualKey(getCurrentRoomType(state));
  const backgroundImage = getVisualImage(state, backgroundKey);

  if (!drawCoverImage(ctx, backgroundImage, 0, 0, CONFIG.width, CONFIG.height, 1)) {
    const gradient = ctx.createLinearGradient(0, 0, 0, CONFIG.height);
    gradient.addColorStop(0, PALETTE.bg);
    gradient.addColorStop(0.65, "#120B22");
    gradient.addColorStop(1, "#06060B");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CONFIG.width, CONFIG.height);
  }

  const overlay = ctx.createLinearGradient(0, 0, 0, CONFIG.height);
  overlay.addColorStop(0, "rgba(6,6,10,0.18)");
  overlay.addColorStop(0.55, "rgba(8,6,16,0.34)");
  overlay.addColorStop(1, "rgba(4,4,8,0.68)");
  ctx.fillStyle = overlay;
  ctx.fillRect(0, 0, CONFIG.width, CONFIG.height);

  for (let i = 0; i < state.ambientParticles.length; i += 1) {
    const particle = state.ambientParticles[i];
    ctx.fillStyle = i % 4 === 0 ? `rgba(212,196,168,${particle.alpha})` : `rgba(255,255,255,${particle.alpha * 0.7})`;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.strokeStyle = "rgba(107,45,139,0.12)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(92, 1120, 104, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(640, 168, 130, 0, Math.PI * 2);
  ctx.stroke();

  if (state.player && state.player.madness >= 31) {
    const intensity = (state.player.madness - 30) / Math.max(1, state.player.maxMadness - 30);
    ctx.strokeStyle = `rgba(107,45,139,${0.2 + intensity * 0.18})`;
    ctx.lineWidth = 18 * intensity;
    ctx.strokeRect(10, 10, CONFIG.width - 20, CONFIG.height - 20);
  }
}

function drawStartScene(state) {
  const ctx = state.ctx;
  const selectedCharacter = CHARACTERS[state.selectedCharacterId];
  const selectedVisual = getVisualImage(state, getCharacterVisualKey(state.selectedCharacterId));

  drawText(ctx, APP_NAME_CN, CONFIG.width / 2, 154, {
    size: 54,
    weight: "700",
    color: PALETTE.white,
    align: "center"
  });
  drawText(ctx, APP_NAME_SUB, CONFIG.width / 2, 204, {
    size: 22,
    color: PALETTE.gold,
    align: "center"
  });
  drawText(ctx, APP_NAME_EN, CONFIG.width / 2, 238, {
    size: 18,
    color: PALETTE.parchmentDim,
    align: "center"
  });
  drawText(ctx, "更长关卡、更强像素风、更完整的深渊推进", CONFIG.width / 2, 278, {
    size: 18,
    color: PALETTE.parchment,
    align: "center"
  });

  drawPanel(ctx, 58, 320, 604, 314, 28);
  drawText(ctx, "像素调查简报", 92, 364, {
    size: 22,
    weight: "700",
    color: PALETTE.parchment
  });
  drawParagraph(ctx, [
    "1. 四名调查员可随时切换，每人都有不同的保命与爆发手段。",
    "2. 疯狂值越高，伤害越夸张，但满槽失控会立刻反咬你。",
    `3. 本版共有 ${getRoomCount()} 个房间，战斗波次明显加长，祭坛、安全区与 Boss 都还在。`
  ], 92, 404, 330, 34, {
    size: 16,
    color: PALETTE.parchmentDim
  });
  if (selectedVisual) {
    drawContainedImage(ctx, selectedVisual, 446, 352, 170, 246, 1);
  }
  drawText(ctx, `${selectedCharacter.title} · ${selectedCharacter.shortName}`, 528, 598, {
    size: 16,
    color: selectedCharacter.color,
    align: "center"
  });

  drawText(ctx, "选择本局起始调查员", 92, 674, {
    size: 20,
    weight: "700",
    color: PALETTE.white
  });

  const chars = CHARACTER_ORDER;
  for (let i = 0; i < chars.length; i += 1) {
    const charData = CHARACTERS[chars[i]];
    const rect = { x: 48 + i * 157, y: 712, width: 146, height: 182 };
    drawCardPanel(ctx, rect, charData.color);
    if (state.selectedCharacterId === chars[i]) {
      ctx.strokeStyle = PALETTE.gold;
      ctx.lineWidth = 3;
      roundRect(ctx, rect.x - 4, rect.y - 4, rect.width + 8, rect.height + 8, 4);
      ctx.stroke();
    }
    drawText(ctx, charData.title, rect.x + rect.width / 2, rect.y + 24, {
      size: 14,
      color: charData.color,
      align: "center"
    });
    drawContainedImage(ctx, getVisualImage(state, getCharacterVisualKey(chars[i])), rect.x + 18, rect.y + 28, 110, 92, 1);
    drawText(ctx, charData.shortName, rect.x + rect.width / 2, rect.y + 134, {
      size: 22,
      weight: "700",
      color: PALETTE.white,
      align: "center"
    });
    drawText(ctx, `HP ${charData.hp} · ${charData.skillName}`, rect.x + rect.width / 2, rect.y + 158, {
      size: 11,
      color: PALETTE.parchmentDim,
      align: "center"
    });
    drawText(ctx, state.selectedCharacterId === chars[i] ? "本局起点" : "点击选择", rect.x + rect.width / 2, rect.y + 174, {
      size: 12,
      color: state.selectedCharacterId === chars[i] ? PALETTE.gold : PALETTE.parchmentDim,
      align: "center"
    });
    state.buttons.push({
      rect,
      onTap: function onSelectCharacter() {
        state.selectedCharacterId = chars[i];
        persistPersistentState(state);
      }
    });
  }

  const startButton = { x: 118, y: 918, width: 484, height: 92 };
  drawPrimaryButton(ctx, startButton, "进入深渊", `以 ${CHARACTERS[state.selectedCharacterId].shortName} 作为本局主角`);
  state.buttons.push({
    rect: startButton,
    onTap: function onStartTap() {
      startRun(state);
    }
  });

  const tutorialButton = { x: 118, y: 1030, width: 230, height: 68 };
  const audioButton = { x: 372, y: 1030, width: 230, height: 68 };
  drawGhostButton(ctx, tutorialButton, "玩法说明");
  drawGhostButton(ctx, audioButton, state.audio.enabled ? "音频：开启" : "音频：关闭");
  state.buttons.push({
    rect: tutorialButton,
    onTap: function onTutorialTap() {
      state.showTutorial = true;
    }
  });
  state.buttons.push({
    rect: audioButton,
    onTap: function onAudioTap() {
      toggleAudioEnabled(state.audio);
      persistPersistentState(state);
    }
  });

  if (state.platform.pendingRunShield > 0) {
    drawText(ctx, `已存入回访奖励：下一局护盾 +${state.platform.pendingRunShield}`, CONFIG.width / 2, 1112, {
      size: 15,
      color: PALETTE.gold,
      align: "center"
    });
  }
  drawText(ctx, `最佳记录：${state.bestRecord.victory ? "已通关" : "未通关"} · 房间 ${state.bestRecord.roomsCleared} · 击杀 ${state.bestRecord.kills}`, CONFIG.width / 2, 1140, {
    size: 16,
    color: PALETTE.parchmentDim,
    align: "center"
  });
  drawText(ctx, "左手摇杆移动，武器自动射击，右侧技能与换人决定你的 Build 节奏。", CONFIG.width / 2, 1172, {
    size: 15,
    color: PALETTE.parchmentDim,
    align: "center"
  });
}

function drawBattleScene(state) {
  drawArena(state);
  drawTopHud(state);
  drawBottomHud(state);
  drawEntities(state);
  drawEffects(state);
  drawJoystick(state);
}

function drawArena(state) {
  const ctx = state.ctx;
  const arena = getArenaRect();
  state.arenaRect = arena;

  drawPanel(ctx, arena.x, arena.y, arena.width, arena.height, 26);
  ctx.save();
  ctx.beginPath();
  roundRect(ctx, arena.x, arena.y, arena.width, arena.height, 26);
  ctx.clip();

  const roomTint = getRoomTint(state.room ? state.room.type : "normal");
  const bgImage = getVisualImage(state, getRoomBackgroundVisualKey(getCurrentRoomType(state)));
  if (!drawCoverImage(ctx, bgImage, arena.x, arena.y, arena.width, arena.height, 0.92)) {
    const gradient = ctx.createLinearGradient(arena.x, arena.y, arena.x + arena.width, arena.y + arena.height);
    gradient.addColorStop(0, roomTint.top);
    gradient.addColorStop(1, roomTint.bottom);
    ctx.fillStyle = gradient;
    ctx.fillRect(arena.x, arena.y, arena.width, arena.height);
  }
  ctx.fillStyle = withAlpha(roomTint.bottom, 0.38);
  ctx.fillRect(arena.x, arena.y, arena.width, arena.height);

  for (let i = 0; i < 6; i += 1) {
    const lineY = arena.y + 100 + i * 135 + Math.sin(state.now * 0.8 + i) * 6;
    ctx.strokeStyle = "rgba(255,255,255,0.04)";
    ctx.beginPath();
    ctx.moveTo(arena.x + 24, lineY);
    ctx.lineTo(arena.x + arena.width - 24, lineY);
    ctx.stroke();
  }

  ctx.restore();
}

function getRoomTint(roomType) {
  if (roomType === "elite") {
    return { top: "#2A1527", bottom: "#120911" };
  }
  if (roomType === "shrine") {
    return { top: "#16301C", bottom: "#0D1311" };
  }
  if (roomType === "rest") {
    return { top: "#1B2538", bottom: "#0D1019" };
  }
  if (roomType === "boss") {
    return { top: "#16070F", bottom: "#050408" };
  }
  return { top: "#1E1432", bottom: "#110C1D" };
}

function drawTopHud(state) {
  const ctx = state.ctx;
  const player = state.player;
  const charData = CHARACTERS[player.characterId];
  const portrait = getVisualImage(state, getCharacterVisualKey(player.characterId));

  drawCardPanel(ctx, { x: 20, y: 14, width: 62, height: 62 }, charData.color);
  drawContainedImage(ctx, portrait, 23, 17, 56, 56, 1);

  drawText(ctx, APP_NAME_CN, 94, 40, {
    size: 20,
    weight: "700",
    color: PALETTE.parchment
  });
  drawText(ctx, `${charData.title} · ${charData.shortName}`, 94, 68, {
    size: 14,
    color: charData.color
  });

  drawHudBar(ctx, 224, 24, 220, 18, player.hp / Math.max(1, player.maxHp), PALETTE.blood);
  drawText(ctx, `HP ${Math.max(0, Math.round(player.hp))}/${player.maxHp}`, 334, 39, {
    size: 12,
    color: PALETTE.white,
    align: "center"
  });

  drawHudBar(ctx, 470, 24, 116, 12, player.madness / Math.max(1, player.maxMadness), PALETTE.accent);
  drawText(ctx, `狂 ${Math.round(player.madness)}`, 594, 36, {
    size: 12,
    color: PALETTE.parchment,
    align: "right"
  });

  drawHudBar(ctx, 470, 48, 116, 12, player.sanity / Math.max(1, player.maxSanity), PALETTE.blue);
  drawText(ctx, `智 ${Math.round(player.sanity)}`, 594, 60, {
    size: 12,
    color: PALETTE.parchment,
    align: "right"
  });

  drawText(ctx, state.room ? `房间 ${state.room.id}/${getRoomCount()} · ${state.room.name}` : `房间 0/${getRoomCount()}`, 454, 82, {
    size: 14,
    color: PALETTE.gold
  });
  drawText(ctx, `击杀 ${state.runStats.kills} · 疯狂峰值 ${state.runStats.peakMadness}`, 688, 84, {
    size: 13,
    color: PALETTE.parchmentDim,
    align: "right"
  });

  const pauseRect = { x: 620, y: 18, width: 74, height: 44 };
  roundRect(ctx, pauseRect.x, pauseRect.y, pauseRect.width, pauseRect.height, 16);
  ctx.fillStyle = "rgba(255,255,255,0.05)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.stroke();
  drawText(ctx, "暂停", pauseRect.x + pauseRect.width / 2, pauseRect.y + 28, {
    size: 15,
    color: PALETTE.parchment,
    align: "center"
  });
  state.buttons.push({
    rect: pauseRect,
    onTap: function onPauseTap() {
      state.sceneBeforePause = state.scene;
      state.scene = SCENES.PAUSE;
    }
  });
}

function drawBottomHud(state) {
  const ctx = state.ctx;
  const player = state.player;
  const charData = CHARACTERS[player.characterId];
  const y = CONFIG.height - CONFIG.bottomHudHeight;
  const weaponIcon = getVisualImage(state, getWeaponVisualKey(player.currentWeapon));
  const supplyIcon = getVisualImage(state, player.consumables.healthPotion > 0 ? "consHealth" : getConsumableVisualKey("sanityEssence"));
  const activePortrait = getVisualImage(state, getCharacterVisualKey(player.characterId));

  drawPanel(ctx, 18, y, CONFIG.width - 36, 140, 28);

  const weaponRect = { x: 36, y: y + 18, width: 180, height: 94 };
  drawCardPanel(ctx, weaponRect, WEAPONS[player.currentWeapon].color);
  drawContainedImage(ctx, weaponIcon, weaponRect.x + 10, weaponRect.y + 14, 52, 52, 1);
  drawText(ctx, WEAPONS[player.currentWeapon].name, weaponRect.x + 74, weaponRect.y + 30, {
    size: 17,
    weight: "700",
    color: PALETTE.white
  });
  drawText(ctx, WEAPONS[player.currentWeapon].description, weaponRect.x + 74, weaponRect.y + 54, {
    size: 12,
    color: PALETTE.parchmentDim
  });
  drawText(ctx, `武器 ${player.weapons.length} / 5`, weaponRect.x + 74, weaponRect.y + 78, {
    size: 12,
    color: PALETTE.gold
  });

  const skillRect = { x: 238, y: y + 18, width: 122, height: 94 };
  const itemRect = { x: 378, y: y + 18, width: 122, height: 94 };
  const switchRect = { x: 518, y: y + 18, width: 166, height: 94 };

  drawActionButton(ctx, skillRect, charData.skillName, player.skillCooldown > 0 ? `${Math.ceil(player.skillCooldown)}s` : "技能", player.skillCooldown <= 0);
  drawActionButton(ctx, itemRect, "补给", `药 ${player.consumables.healthPotion} / 智 ${player.consumables.sanityEssence}`, true);
  drawActionButton(ctx, switchRect, "切换调查员", player.switchCooldown > 0 ? `${Math.ceil(player.switchCooldown)}s` : "四人可切换", player.switchCooldown <= 0);
  drawContainedImage(ctx, activePortrait, skillRect.x + 36, skillRect.y + 6, 50, 40, 0.88);
  drawContainedImage(ctx, supplyIcon, itemRect.x + 34, itemRect.y + 8, 52, 42, 0.9);
  drawContainedImage(ctx, activePortrait, switchRect.x + 56, switchRect.y + 8, 54, 42, 0.72);

  state.buttons.push({
    rect: skillRect,
    onTap: function onSkillTap() {
      if (state.scene === SCENES.BATTLE) {
        useSkill(state);
      }
    }
  });
  state.buttons.push({
    rect: itemRect,
    onTap: function onItemTap() {
      if (state.scene === SCENES.BATTLE) {
        useConsumable(state);
      }
    }
  });
  state.buttons.push({
    rect: switchRect,
    onTap: function onSwitchTap() {
      if (state.scene === SCENES.BATTLE) {
        state.scene = SCENES.SWITCH;
      }
    }
  });
}

function drawEntities(state) {
  const ctx = state.ctx;

  for (let i = 0; i < state.drops.length; i += 1) {
    const drop = state.drops[i];
    ctx.fillStyle = drop.color;
    ctx.beginPath();
    ctx.arc(drop.x, drop.y, drop.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  for (let i = 0; i < state.bullets.length; i += 1) {
    const bullet = state.bullets[i];
    ctx.fillStyle = bullet.color;
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  for (let i = 0; i < state.enemyBullets.length; i += 1) {
    const bullet = state.enemyBullets[i];
    ctx.fillStyle = bullet.type === "scream" ? "rgba(255,92,255,0.18)" : "#FF8A7A";
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  for (let i = 0; i < state.enemies.length; i += 1) {
    drawEnemy(state, state.enemies[i]);
  }

  drawPlayer(state);
}

function drawPlayer(state) {
  const ctx = state.ctx;
  const player = state.player;
  const sprite = getVisualImage(state, getCharacterVisualKey(player.characterId));

  if (sprite && sprite.width) {
    ctx.save();
    ctx.translate(player.x, player.y);
    if (player.outOfControlTimer > 0) {
      ctx.rotate(Math.sin(state.now * 18) * 0.24);
    }
    ctx.translate(-player.x, -player.y);
    drawContainedImage(ctx, sprite, player.x - 34, player.y - 46, 68, 88, 1);
    ctx.restore();
  } else {
    ctx.save();
    ctx.translate(player.x, player.y);
    if (player.outOfControlTimer > 0) {
      ctx.rotate(Math.sin(state.now * 18) * 0.24);
    }
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.lineTo(15, 0);
    ctx.lineTo(0, 18);
    ctx.lineTo(-15, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  if (player.shield > 0) {
    ctx.strokeStyle = "#F7D05A";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(player.x, player.y, 30, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawEnemy(state, enemy) {
  const ctx = state.ctx;
  const sprite = getVisualImage(state, getEnemyVisualKey(enemy.id));

  if (sprite && sprite.width) {
    const width = enemy.boss ? 168 : enemy.radius * 3.2;
    const height = enemy.boss ? 190 : enemy.radius * 3.6;
    drawContainedImage(ctx, sprite, enemy.x - width / 2, enemy.y - height / 2, width, height, 1);
  } else {
    ctx.save();
    ctx.translate(enemy.x, enemy.y);

    if (enemy.boss) {
      ctx.fillStyle = enemy.color;
      ctx.beginPath();
      ctx.arc(0, 0, enemy.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#FFF5D8";
      ctx.beginPath();
      ctx.arc(0, 0, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#120812";
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = enemy.color;
      ctx.beginPath();
      ctx.arc(0, 0, enemy.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.14)";
      ctx.fillRect(-enemy.radius * 0.75, -enemy.radius * 0.3, enemy.radius * 1.5, enemy.radius * 0.6);
    }

    ctx.restore();
  }

  if (state.player.markedEnemyId === enemy.id) {
    ctx.strokeStyle = "#FFD166";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y, enemy.radius + 10, 0, Math.PI * 2);
    ctx.stroke();
  }

  drawMiniHpBar(ctx, enemy.x - 24, enemy.y - enemy.radius - 16, 48, enemy.hp / enemy.maxHp, enemy.boss ? "#FF8A7A" : enemy.color);
}

function drawEffects(state) {
  const ctx = state.ctx;
  for (let i = 0; i < state.effects.length; i += 1) {
    const effect = state.effects[i];
    const alpha = clamp(effect.timer / 0.6, 0, 1);
    if (effect.type === "flash") {
      ctx.fillStyle = withAlpha(effect.color, alpha * 0.48);
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, 22 * alpha + 8, 0, Math.PI * 2);
      ctx.fill();
    } else if (effect.type === "circle") {
      ctx.strokeStyle = withAlpha(effect.color, alpha * 0.85);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, effect.radius * (1.18 - alpha * 0.18), 0, Math.PI * 2);
      ctx.stroke();
    } else if (effect.type === "telegraph_line") {
      ctx.strokeStyle = withAlpha(effect.color, 0.42 + alpha * 0.32);
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.moveTo(effect.x1, effect.y1);
      ctx.lineTo(effect.x2, effect.y2);
      ctx.stroke();
    } else if (effect.type === "telegraph_circle") {
      ctx.strokeStyle = withAlpha(effect.color, 0.46 + alpha * 0.28);
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
      ctx.stroke();
    } else if (effect.type === "banner") {
      drawBanner(ctx, effect.text, effect.color, alpha);
    }
  }
}

function drawNotifications(state) {
  const ctx = state.ctx;
  for (let i = 0; i < state.notifications.length; i += 1) {
    const item = state.notifications[i];
    drawText(ctx, item.text, CONFIG.width / 2, item.y, {
      size: 16,
      color: getToneColor(item.tone),
      align: "center"
    });
  }
}

function drawRoomIntroCard(state) {
  const ctx = state.ctx;
  const room = state.room;
  if (!room) {
    return;
  }

  drawOverlay(ctx, 0.42);
  drawPanel(ctx, 120, 402, 480, 220, 28);
  drawText(ctx, `房间 ${room.id} / ${getRoomCount()}`, CONFIG.width / 2, 470, {
    size: 20,
    color: PALETTE.gold,
    align: "center"
  });
  drawText(ctx, room.name, CONFIG.width / 2, 522, {
    size: 34,
    weight: "700",
    color: PALETTE.white,
    align: "center"
  });
  drawText(ctx, room.subtitle, CONFIG.width / 2, 564, {
    size: 18,
    color: PALETTE.parchmentDim,
    align: "center"
  });
}

function drawRewardScene(state) {
  const ctx = state.ctx;
  drawOverlay(ctx, 0.58);
  drawSelectionPanel(ctx, "战利品选择", "选一项带进下一间房");

  for (let i = 0; i < state.rewardOptions.length; i += 1) {
    const option = state.rewardOptions[i];
    const rect = { x: 92, y: 372 + i * 132, width: 536, height: 112 };
    drawOptionCard(ctx, rect, formatRewardTitle(option), formatRewardBody(option), getRewardColor(option));
    state.buttons.push({
      rect,
      onTap: function onRewardTap() {
        applyReward(state, option);
      }
    });
  }
}

function drawEventScene(state) {
  const ctx = state.ctx;
  drawOverlay(ctx, 0.58);
  drawSelectionPanel(ctx, "古神祭坛", "祝福、诅咒与商人都会改变你的下一段节奏");

  for (let i = 0; i < state.eventOptions.length; i += 1) {
    const option = state.eventOptions[i];
    const eventData = SHRINE_EVENTS[option.id];
    const rect = { x: 92, y: 340 + i * 146, width: 536, height: 126 };
    drawOptionCard(ctx, rect, eventData.title, eventData.body, option.id === "curse" ? PALETTE.blood : (option.id === "merchant" ? PALETTE.gold : PALETTE.green));
    state.buttons.push({
      rect,
      onTap: function onEventTap() {
        applyEventChoice(state, option);
      }
    });
  }
}

function drawRestScene(state) {
  const ctx = state.ctx;
  drawOverlay(ctx, 0.52);
  drawSelectionPanel(ctx, "过渡安全区", "生命 +30，理智 +20，准备迎接最终战");

  const nextRoom = ROOM_FLOW[state.roomIndex + 1];
  if (nextRoom) {
    drawOptionCard(
      ctx,
      { x: 102, y: 360, width: 516, height: 150 },
      `下一间：${nextRoom.name}`,
      nextRoom.type === "boss"
        ? "终点是乌姆·亚特。建议先补满状态，再决定由谁打首轮输出。"
        : `类型：${nextRoom.type}。${nextRoom.subtitle}`,
      nextRoom.type === "boss" ? PALETTE.blood : PALETTE.gold
    );
  }

  const rect = { x: 172, y: 604, width: 376, height: 86 };
  drawPrimaryButton(ctx, rect, "继续下潜", "前往深渊心室");
  state.buttons.push({
    rect,
    onTap: function onRestTap() {
      startNextRoom(state);
    }
  });
}

function drawSwitchScene(state) {
  const ctx = state.ctx;
  drawOverlay(ctx, 0.62);
  drawSelectionPanel(ctx, "切换调查员", `切换会额外获得 ${CONFIG.switchMadnessCost} 点疯狂值`);

  for (let i = 0; i < CHARACTER_ORDER.length; i += 1) {
    const charId = CHARACTER_ORDER[i];
    const charData = CHARACTERS[charId];
    const rect = {
      x: 84 + (i % 2) * 282,
      y: 354 + Math.floor(i / 2) * 156,
      width: 270,
      height: 132
    };
    drawOptionCard(ctx, rect, `${charData.title} · ${charData.shortName}`, charData.description, charData.color);
    state.buttons.push({
      rect,
      onTap: function onCharTap() {
        switchCharacter(state, i);
      }
    });
  }

  const closeRect = { x: 222, y: 698, width: 276, height: 72 };
  drawGhostButton(ctx, closeRect, "继续当前战斗");
  state.buttons.push({
    rect: closeRect,
    onTap: function onCloseTap() {
      state.scene = SCENES.BATTLE;
    }
  });
}

function drawGameOverScene(state) {
  const ctx = state.ctx;
  drawOverlay(ctx, 0.7);

  const title = state.victory ? "深渊暂时沉默了" : "疯狂吞噬了你";
  const subtitle = state.victory ? "乌姆·亚特被击退，本轮调查成功" : "再来一局，重新找到疯狂与力量的平衡";

  drawPanel(ctx, 84, 220, 552, 620, 34);
  drawText(ctx, title, CONFIG.width / 2, 330, {
    size: 40,
    weight: "700",
    color: state.victory ? PALETTE.gold : PALETTE.white,
    align: "center"
  });
  drawText(ctx, subtitle, CONFIG.width / 2, 372, {
    size: 18,
    color: PALETTE.parchmentDim,
    align: "center"
  });

  const surviveSeconds = Math.max(0, Math.floor(state.now - state.runStartAt));
  const stats = [
    `存活时长：${formatClock(surviveSeconds)}`,
    `击杀敌人：${state.runStats.kills}`,
    `最高疯狂：${state.runStats.peakMadness}`,
    `通过房间：${state.runStats.roomsCleared}`
  ];
  drawParagraph(ctx, stats, 138, 432, 450, 38, {
    size: 20,
    color: PALETTE.white
  });

  drawText(ctx, "本局疯狂曲线", 138, 592, {
    size: 18,
    weight: "700",
    color: PALETTE.parchment
  });
  drawMadnessChart(ctx, state.runStats.madnessTrace, { x: 138, y: 610, width: 444, height: 92 });

  drawText(ctx, `最佳记录：${state.bestRecord.victory ? "已通关" : "未通关"} · 房间 ${state.bestRecord.roomsCleared} · 击杀 ${state.bestRecord.kills}`, CONFIG.width / 2, 730, {
    size: 15,
    color: PALETTE.parchmentDim,
    align: "center"
  });

  const restartRect = { x: 152, y: 754, width: 416, height: 86 };
  drawPrimaryButton(ctx, restartRect, "重新开局", "点击再探一次深渊");
  state.buttons.push({
    rect: restartRect,
    onTap: function onRestartTap() {
      startRun(state);
    }
  });

  const shareRect = { x: 152, y: 680, width: 200, height: 56 };
  const reviewRect = { x: 368, y: 680, width: 200, height: 56 };
  drawGhostButton(ctx, shareRect, "分享战绩");
  drawGhostButton(ctx, reviewRect, "打开侧边栏");
  state.buttons.push({
    rect: shareRect,
    onTap: function onShareTap() {
      shareRunResult(state);
    }
  });
  state.buttons.push({
    rect: reviewRect,
    onTap: function onSidebarTap() {
      openSidebarRevisit();
    }
  });
}

function drawPauseScene(state) {
  const ctx = state.ctx;
  const surviveSeconds = Math.max(0, Math.floor(state.now - state.runStartAt));
  const progressTitle = state.room ? `房间 ${state.room.id}/${getRoomCount()} · ${state.room.name}` : "暂停中";

  drawOverlay(ctx, 0.72);
  drawPanel(ctx, 74, 182, 572, 760, 34);
  drawText(ctx, "暂停整理", CONFIG.width / 2, 258, {
    size: 38,
    weight: "700",
    color: PALETTE.white,
    align: "center"
  });
  drawText(ctx, progressTitle, CONFIG.width / 2, 296, {
    size: 18,
    color: PALETTE.gold,
    align: "center"
  });

  const summaryRect = { x: 112, y: 334, width: 496, height: 150 };
  drawCardPanel(ctx, summaryRect, PALETTE.accent);
  drawText(ctx, `存活 ${formatClock(surviveSeconds)}`, summaryRect.x + 28, summaryRect.y + 40, {
    size: 22,
    weight: "700",
    color: PALETTE.white
  });
  drawText(ctx, `击杀 ${state.runStats.kills} · 已通关房间 ${state.runStats.roomsCleared} · 峰值疯狂 ${state.runStats.peakMadness}`, summaryRect.x + 28, summaryRect.y + 74, {
    size: 14,
    color: PALETTE.parchmentDim
  });
  drawText(ctx, `当前护盾 ${state.player.shield + state.player.consumables.shield} · 角色 ${CHARACTERS[state.player.characterId].shortName} · 音频 ${state.audio.enabled ? "开启" : "关闭"}`, summaryRect.x + 28, summaryRect.y + 104, {
    size: 14,
    color: PALETTE.parchmentDim
  });
  drawText(ctx, "你可以继续推进，也可以在这里切换音频、查看教程和分享战绩。", summaryRect.x + 28, summaryRect.y + 132, {
    size: 14,
    color: PALETTE.parchmentDim
  });

  const resumeRect = { x: 136, y: 526, width: 448, height: 84 };
  drawPrimaryButton(ctx, resumeRect, "继续下潜", "回到当前战斗");
  state.buttons.push({
    rect: resumeRect,
    onTap: function onResumeTap() {
      state.scene = state.sceneBeforePause || SCENES.BATTLE;
    }
  });

  const tutorialRect = { x: 136, y: 632, width: 214, height: 68 };
  const audioRect = { x: 370, y: 632, width: 214, height: 68 };
  const shareRect = { x: 136, y: 716, width: 214, height: 68 };
  const sidebarRect = { x: 370, y: 716, width: 214, height: 68 };
  const restartRect = { x: 136, y: 808, width: 448, height: 72 };

  drawGhostButton(ctx, tutorialRect, "查看教程");
  drawGhostButton(ctx, audioRect, state.audio.enabled ? "音频：开启" : "音频：关闭");
  drawGhostButton(ctx, shareRect, state.releaseFlags.shareEnabled ? "分享战绩" : "分享待接入");
  drawGhostButton(ctx, sidebarRect, state.releaseFlags.sidebarEnabled ? "打开侧边栏" : "侧边栏待接入");
  drawGhostButton(ctx, restartRect, "重新开始本局");

  state.buttons.push({
    rect: tutorialRect,
    onTap: function onPauseTutorialTap() {
      state.showTutorial = true;
    }
  });
  state.buttons.push({
    rect: audioRect,
    onTap: function onPauseAudioTap() {
      toggleAudioEnabled(state.audio);
      persistPersistentState(state);
    }
  });
  state.buttons.push({
    rect: shareRect,
    onTap: function onPauseShareTap() {
      shareRunResult(state);
    }
  });
  state.buttons.push({
    rect: sidebarRect,
    onTap: function onPauseSidebarTap() {
      openSidebarRevisit();
    }
  });
  state.buttons.push({
    rect: restartRect,
    onTap: function onPauseRestartTap() {
      startRun(state);
    }
  });
}

function drawTutorialOverlay(state) {
  const ctx = state.ctx;

  drawOverlay(ctx, 0.82);
  drawPanel(ctx, 54, 118, 612, 1042, 36);
  drawText(ctx, "深渊行动手册", CONFIG.width / 2, 184, {
    size: 36,
    weight: "700",
    color: PALETTE.white,
    align: "center"
  });
  drawText(ctx, `更长的一局，目标是在疯狂失控前穿过 ${getRoomCount()} 个房间。`, CONFIG.width / 2, 224, {
    size: 18,
    color: PALETTE.gold,
    align: "center"
  });

  drawCardPanel(ctx, { x: 92, y: 264, width: 536, height: 170 }, PALETTE.accent);
  drawText(ctx, "核心循环", 118, 306, {
    size: 22,
    weight: "700",
    color: PALETTE.white
  });
  drawParagraph(ctx, [
    "1. 普通房与精英房负责堆装备和 Buff。",
    "2. 第 6 房是古神祭坛，给你祝福、交易或诅咒。",
    "3. 第 7 房是安全屋，补状态并准备最终 Boss。",
    "4. 第 8 房直面乌姆·亚特，撑住即可通关。"
  ], 118, 342, 484, 28, {
    size: 16,
    color: PALETTE.parchmentDim
  });

  drawCardPanel(ctx, { x: 92, y: 458, width: 536, height: 200 }, PALETTE.blue);
  drawText(ctx, "操作与风险", 118, 500, {
    size: 22,
    weight: "700",
    color: PALETTE.white
  });
  drawParagraph(ctx, [
    "左手拖动摇杆走位，武器会自动锁定最近敌人。",
    "右下技能决定瞬时爆发，换人会额外吃 30 点疯狂值。",
    "疯狂值越高，战斗越凶，但满槽会短暂失控。",
    "血量、理智和护盾都在顶部与底部 HUD 实时反馈。"
  ], 118, 536, 484, 28, {
    size: 16,
    color: PALETTE.parchmentDim
  });

  drawCardPanel(ctx, { x: 92, y: 682, width: 536, height: 242 }, PALETTE.gold);
  drawText(ctx, "四位调查员分工", 118, 724, {
    size: 22,
    weight: "700",
    color: PALETTE.white
  });
  drawParagraph(ctx, [
    "艾达：稳控场，技能是精神冲击，适合开荒与清怪。",
    "马库斯：最能扛，技能是急救术，适合保底续航。",
    "卡拉：爆发最高，标记狙击专打精英和 Boss。",
    "阿黎：视野最稳，预判技能更容易躲弹幕与找安全位。"
  ], 118, 760, 484, 30, {
    size: 16,
    color: PALETTE.parchmentDim
  });

  drawText(ctx, "上线建议：先补正式像素资源、真实 SFX/BGM、广告位 ID，再进开发者工具做真机长测。", CONFIG.width / 2, 968, {
    size: 15,
    color: PALETTE.parchmentDim,
    align: "center"
  });

  const closeRect = { x: 152, y: 1032, width: 416, height: 82 };
  drawPrimaryButton(ctx, closeRect, "我知道了", "返回当前界面");
  state.buttons.push({
    rect: closeRect,
    onTap: function onCloseTutorial() {
      state.showTutorial = false;
      markTutorialSeen(state);
    }
  });
}

function drawMadnessChart(ctx, values, rect) {
  drawCardPanel(ctx, rect, PALETTE.accent);

  const inner = {
    x: rect.x + 18,
    y: rect.y + 14,
    width: rect.width - 36,
    height: rect.height - 28
  };

  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 2; i += 1) {
    const y = inner.y + (inner.height / 2) * i;
    ctx.beginPath();
    ctx.moveTo(inner.x, y);
    ctx.lineTo(inner.x + inner.width, y);
    ctx.stroke();
  }

  drawText(ctx, "100", rect.x + rect.width - 8, inner.y + 8, {
    size: 10,
    color: PALETTE.parchmentDim,
    align: "right"
  });
  drawText(ctx, "50", rect.x + rect.width - 8, inner.y + inner.height / 2 + 4, {
    size: 10,
    color: PALETTE.parchmentDim,
    align: "right"
  });
  drawText(ctx, "0", rect.x + rect.width - 8, inner.y + inner.height, {
    size: 10,
    color: PALETTE.parchmentDim,
    align: "right",
    baseline: "bottom"
  });

  if (!values || values.length < 2) {
    drawText(ctx, "本局时间太短，暂未生成疯狂曲线。", rect.x + rect.width / 2, rect.y + rect.height / 2 + 6, {
      size: 14,
      color: PALETTE.parchmentDim,
      align: "center"
    });
    return;
  }

  ctx.beginPath();
  for (let i = 0; i < values.length; i += 1) {
    const x = inner.x + (inner.width * i) / Math.max(1, values.length - 1);
    const y = inner.y + inner.height * (1 - clamp(values[i], 0, 100) / 100);
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.strokeStyle = PALETTE.gold;
  ctx.lineWidth = 3;
  ctx.stroke();

  const lastValue = clamp(values[values.length - 1], 0, 100);
  const lastX = inner.x + inner.width;
  const lastY = inner.y + inner.height * (1 - lastValue / 100);
  ctx.fillStyle = PALETTE.gold;
  ctx.beginPath();
  ctx.arc(lastX, lastY, 4, 0, Math.PI * 2);
  ctx.fill();
}

function drawSelectionPanel(ctx, title, subtitle) {
  drawPanel(ctx, 58, 204, 604, 610, 30);
  drawText(ctx, title, CONFIG.width / 2, 256, {
    size: 34,
    weight: "700",
    color: PALETTE.white,
    align: "center"
  });
  drawText(ctx, subtitle, CONFIG.width / 2, 292, {
    size: 17,
    color: PALETTE.parchmentDim,
    align: "center"
  });
}

function drawOverlay(ctx, alpha) {
  ctx.fillStyle = `rgba(0,0,0,${alpha})`;
  ctx.fillRect(0, 0, CONFIG.width, CONFIG.height);
}

function drawOptionCard(ctx, rect, title, body, accent) {
  drawCardPanel(ctx, rect, accent);
  drawText(ctx, title, rect.x + 22, rect.y + 34, {
    size: 20,
    weight: "700",
    color: accent
  });
  drawParagraph(ctx, [body], rect.x + 22, rect.y + 68, rect.width - 44, 22, {
    size: 14,
    color: PALETTE.parchmentDim
  });
}

function drawPixelFrame(ctx, x, y, width, height, fill, stroke, shadow) {
  const notch = 8;

  ctx.save();
  if (shadow) {
    ctx.fillStyle = shadow;
    tracePixelFrame(ctx, x + 6, y + 6, width, height, notch);
    ctx.fill();
  }

  ctx.fillStyle = fill;
  tracePixelFrame(ctx, x, y, width, height, notch);
  ctx.fill();

  ctx.strokeStyle = stroke;
  ctx.lineWidth = 2;
  tracePixelFrame(ctx, x + 1, y + 1, width - 2, height - 2, Math.max(4, notch - 2));
  ctx.stroke();
  ctx.restore();
}

function tracePixelFrame(ctx, x, y, width, height, notch) {
  ctx.beginPath();
  ctx.moveTo(x + notch, y);
  ctx.lineTo(x + width - notch, y);
  ctx.lineTo(x + width, y + notch);
  ctx.lineTo(x + width, y + height - notch);
  ctx.lineTo(x + width - notch, y + height);
  ctx.lineTo(x + notch, y + height);
  ctx.lineTo(x, y + height - notch);
  ctx.lineTo(x, y + notch);
  ctx.closePath();
}

function drawCardPanel(ctx, rect, accent) {
  drawPixelFrame(ctx, rect.x, rect.y, rect.width, rect.height, "rgba(12,10,22,0.90)", withAlpha(accent, 0.82), "rgba(0,0,0,0.32)");
}

function drawPrimaryButton(ctx, rect, title, subtitle) {
  const fill = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.height);
  fill.addColorStop(0, "#A84A56");
  fill.addColorStop(1, "#61203D");
  drawPixelFrame(ctx, rect.x, rect.y, rect.width, rect.height, fill, "#E4B96B", "rgba(0,0,0,0.36)");
  drawText(ctx, title, rect.x + rect.width / 2, rect.y + 32, {
    size: 24,
    weight: "700",
    color: "#FFF8EE",
    align: "center"
  });
  if (subtitle) {
    drawText(ctx, subtitle, rect.x + rect.width / 2, rect.y + 56, {
      size: 13,
      color: "rgba(255,248,238,0.82)",
      align: "center"
    });
  }
}

function drawGhostButton(ctx, rect, title) {
  drawPixelFrame(ctx, rect.x, rect.y, rect.width, rect.height, "rgba(16,14,28,0.92)", "rgba(212,196,168,0.28)", "rgba(0,0,0,0.24)");
  drawText(ctx, title, rect.x + rect.width / 2, rect.y + 44, {
    size: 18,
    color: PALETTE.parchment,
    align: "center"
  });
}

function drawActionButton(ctx, rect, title, subtitle, enabled) {
  drawPixelFrame(
    ctx,
    rect.x,
    rect.y,
    rect.width,
    rect.height,
    enabled ? "rgba(34,20,54,0.92)" : "rgba(22,20,30,0.88)",
    enabled ? "rgba(232,185,109,0.68)" : "rgba(255,255,255,0.12)",
    "rgba(0,0,0,0.24)"
  );
  drawText(ctx, title, rect.x + rect.width / 2, rect.y + 34, {
    size: 18,
    weight: "700",
    color: enabled ? PALETTE.white : PALETTE.parchmentDim,
    align: "center"
  });
  drawText(ctx, subtitle, rect.x + rect.width / 2, rect.y + 62, {
    size: 12,
    color: PALETTE.parchmentDim,
    align: "center"
  });
}

function drawPanel(ctx, x, y, width, height, radius) {
  const fill = ctx.createLinearGradient(x, y, x, y + height);
  fill.addColorStop(0, "rgba(21,17,36,0.96)");
  fill.addColorStop(1, "rgba(8,7,14,0.96)");
  drawPixelFrame(ctx, x, y, width, height, fill, "rgba(212,196,168,0.16)", "rgba(0,0,0,0.36)");
}

function drawHudBar(ctx, x, y, width, height, percent, color) {
  roundRect(ctx, x, y, width, height, 999);
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.fill();

  roundRect(ctx, x, y, width * clamp(percent, 0, 1), height, 999);
  ctx.fillStyle = color;
  ctx.fill();
}

function drawMiniHpBar(ctx, x, y, width, percent, color) {
  roundRect(ctx, x, y, width, 6, 999);
  ctx.fillStyle = "rgba(0,0,0,0.36)";
  ctx.fill();
  roundRect(ctx, x, y, width * clamp(percent, 0, 1), 6, 999);
  ctx.fillStyle = color;
  ctx.fill();
}

function drawJoystick(state) {
  if (!state.joystick.active || state.scene !== SCENES.BATTLE) {
    return;
  }

  const ctx = state.ctx;
  const centerX = state.joystick.startX;
  const centerY = state.joystick.startY;
  const knobX = centerX + state.joystick.x * CONFIG.joystickRadius;
  const knobY = centerY + state.joystick.y * CONFIG.joystickRadius;

  ctx.beginPath();
  ctx.fillStyle = "rgba(255,255,255,0.06)";
  ctx.arc(centerX, centerY, CONFIG.joystickRadius, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.fillStyle = "rgba(107,45,139,0.55)";
  ctx.arc(knobX, knobY, 34, 0, Math.PI * 2);
  ctx.fill();
}

function drawBanner(ctx, text, color, alpha) {
  drawText(ctx, text, CONFIG.width / 2, 156, {
    size: 28,
    weight: "700",
    color: withAlpha(color, alpha),
    align: "center"
  });
}

function drawText(ctx, text, x, y, options) {
  ctx.save();
  ctx.font = `${options.weight || "400"} ${options.size || 16}px sans-serif`;
  ctx.fillStyle = options.color || "#FFFFFF";
  ctx.textAlign = options.align || "left";
  ctx.textBaseline = options.baseline || "alphabetic";
  ctx.fillText(String(text), x, y);
  ctx.restore();
}

function drawParagraph(ctx, lines, x, y, maxWidth, lineHeight, options) {
  let cursorY = y;
  for (let i = 0; i < lines.length; i += 1) {
    const wrapped = wrapText(ctx, lines[i], maxWidth, options);
    for (let j = 0; j < wrapped.length; j += 1) {
      drawText(ctx, wrapped[j], x, cursorY, options);
      cursorY += lineHeight;
    }
  }
}

function wrapText(ctx, text, maxWidth, options) {
  const normalized = String(text || "");
  const result = [];
  let current = "";

  ctx.save();
  ctx.font = `${options.weight || "400"} ${options.size || 16}px sans-serif`;
  for (let i = 0; i < normalized.length; i += 1) {
    const next = current + normalized[i];
    if (ctx.measureText(next).width > maxWidth && current) {
      result.push(current);
      current = normalized[i];
    } else {
      current = next;
    }
  }
  ctx.restore();

  if (current) {
    result.push(current);
  }
  return result;
}

function roundRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function findBulletEnemyCollision(state, bullet) {
  for (let i = 0; i < state.enemies.length; i += 1) {
    const enemy = state.enemies[i];
    if (!enemy.dead && distance(bullet.x, bullet.y, enemy.x, enemy.y) <= bullet.radius + enemy.radius) {
      return enemy;
    }
  }
  return null;
}

function getNearestEnemy(state, x, y, maxDistance) {
  let winner = null;
  let best = maxDistance || 999999;
  for (let i = 0; i < state.enemies.length; i += 1) {
    const enemy = state.enemies[i];
    if (enemy.dead) {
      continue;
    }
    const dist = distance(x, y, enemy.x, enemy.y);
    if (dist < best) {
      best = dist;
      winner = enemy;
    }
  }
  return winner;
}

function getArenaRect() {
  return {
    x: 90,
    y: 110,
    width: 540,
    height: 950
  };
}

function isOutsideArena(x, y, margin) {
  const arena = getArenaRect();
  const extra = margin || 0;
  return x < arena.x - extra || x > arena.x + arena.width + extra || y < arena.y - extra || y > arena.y + arena.height + extra;
}

function toGamePoint(state, clientX, clientY) {
  const offsetX = (state.width - CONFIG.width * state.scale) / 2;
  const offsetY = (state.height - CONFIG.height * state.scale) / 2;
  return {
    x: (clientX - offsetX) / state.scale,
    y: (clientY - offsetY) / state.scale
  };
}

function isInsideRect(x, y, rect) {
  return x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height;
}

function getToneColor(tone) {
  if (tone === "danger") {
    return "#FF8A7A";
  }
  if (tone === "success") {
    return "#81E1BF";
  }
  return PALETTE.parchment;
}

function formatRewardTitle(option) {
  if (option.kind === "weapon") {
    return WEAPONS[option.id].name;
  }
  if (option.kind === "buff") {
    return BUFFS[option.id].name;
  }
  return CONSUMABLES[option.id].name;
}

function formatRewardBody(option) {
  if (option.kind === "weapon") {
    return WEAPONS[option.id].description;
  }
  if (option.kind === "buff") {
    return BUFFS[option.id].description;
  }
  return CONSUMABLES[option.id].description;
}

function getRewardColor(option) {
  if (option.kind === "weapon") {
    return WEAPONS[option.id].color;
  }
  if (option.kind === "buff") {
    return getBuffColor(BUFFS[option.id].rarity);
  }
  return CONSUMABLES[option.id].color;
}

function getBuffColor(rarity) {
  if (rarity === "legendary") {
    return "#FF6B35";
  }
  if (rarity === "epic") {
    return "#FFD700";
  }
  if (rarity === "rare") {
    return "#9370DB";
  }
  return "#B8860B";
}

function formatClock(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function distance(x1, y1, x2, y2) {
  const dx = x1 - x2;
  const dy = y1 - y2;
  return Math.sqrt(dx * dx + dy * dy);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function randomRange(min, max) {
  return min + Math.random() * (max - min);
}

function randomPick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function withAlpha(hexColor, alpha) {
  if (hexColor.indexOf("rgba") === 0) {
    return hexColor;
  }
  const normalized = hexColor.replace("#", "");
  const value = normalized.length === 3
    ? normalized.split("").map((item) => item + item).join("")
    : normalized;
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

module.exports = {
  createGame
};
