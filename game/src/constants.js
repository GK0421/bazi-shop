const APP_NAME_CN = "疯狂深渊";
const APP_NAME_EN = "Cthulhu Pixel Roguelike";

const ANALYSIS_CONFIG = {
  remoteUrl: "",
  localUrl: "",
  useLocalFallback: false
};

const AUDIO_CONFIG = {
  manifestPath: "assets/audio/manifest.json",
  minimaxEnvKey: "MINIMAX_API_KEY",
  useGeneratedSfx: true
};

const PALETTE = {
  bg: "#0A0812",
  panel: "#1E1432",
  panelAlt: "#25173E",
  line: "rgba(255,255,255,0.10)",
  parchment: "#D4C4A8",
  parchmentDim: "rgba(212,196,168,0.72)",
  accent: "#6B2D8B",
  accentGlow: "rgba(107,45,139,0.35)",
  blood: "#8B1E1E",
  gold: "#B8860B",
  green: "#4A9D4A",
  blue: "#4A90D9",
  danger: "#FF5C5C",
  white: "#F7F2E8",
  shadow: "rgba(0,0,0,0.42)"
};

const CONFIG = {
  width: 720,
  height: 1280,
  topHudHeight: 102,
  bottomHudHeight: 170,
  footerHeight: 64,
  roomDuration: 180,
  roomIntroMs: 1200,
  switchMadnessCost: 30,
  joystickRadius: 86,
  attackRange: 520
};

const CHARACTERS = {
  AIDA: {
    id: "AIDA",
    shortName: "艾达",
    title: "考古学家",
    hp: 100,
    speed: 232,
    damage: 15,
    sanity: 100,
    skillName: "精神冲击",
    skillCooldown: 10,
    passive: "疯狂值获取降低 20%",
    color: "#D4C4A8",
    description: "稳健的精神系输出，适合控场和清场。"
  },
  MARCUS: {
    id: "MARCUS",
    shortName: "马库斯",
    title: "医生",
    hp: 120,
    speed: 204,
    damage: 12,
    sanity: 90,
    skillName: "急救术",
    skillCooldown: 15,
    passive: "低血线时移动与伤害提升",
    color: "#4A9D4A",
    description: "生存最稳，适合长期拉扯。"
  },
  KARA: {
    id: "KARA",
    shortName: "卡拉",
    title: "猎人",
    hp: 80,
    speed: 260,
    damage: 20,
    sanity: 80,
    skillName: "标记射击",
    skillCooldown: 8,
    passive: "暴击率与暴击伤害更高",
    color: "#D95448",
    description: "高爆发脆皮，适合快速点杀精英。"
  },
  LI: {
    id: "LI",
    shortName: "阿黎",
    title: "侦探",
    hp: 90,
    speed: 228,
    damage: 18,
    sanity: 95,
    skillName: "预判",
    skillCooldown: 12,
    passive: "更容易看到危险预警与隐藏收益",
    color: "#4878D9",
    description: "策略向角色，安全感最强。"
  }
};

const CHARACTER_ORDER = ["AIDA", "MARCUS", "KARA", "LI"];

const WEAPONS = {
  pistol: {
    id: "pistol",
    name: "圣水手枪",
    damage: 15,
    interval: 0.3,
    bulletSpeed: 540,
    spread: 0,
    color: "#D4C4A8",
    description: "稳定射速，适合开局。"
  },
  shotgun: {
    id: "shotgun",
    name: "双管猎枪",
    damage: 24,
    interval: 0.6,
    bulletSpeed: 500,
    pellets: 3,
    spread: 0.18,
    color: "#E0B56C",
    description: "高伤害扩散弹幕。"
  },
  madnessWand: {
    id: "madnessWand",
    name: "疯狂法杖",
    damage: 12,
    interval: 0.42,
    bulletSpeed: 520,
    madnessBonus: 0.08,
    color: "#9B70FF",
    description: "疯狂越高，伤害越强。"
  },
  spiritArray: {
    id: "spiritArray",
    name: "精神法阵",
    damage: 18,
    interval: 0.52,
    bulletSpeed: 430,
    homing: true,
    color: "#7DD6FF",
    description: "会轻微追踪最近目标。"
  },
  ancientOffer: {
    id: "ancientOffer",
    name: "古神祭品",
    damage: 38,
    interval: 0.82,
    bulletSpeed: 580,
    ricochet: true,
    color: "#FF6B35",
    description: "高伤害，命中后会反弹一次。"
  }
};

const CONSUMABLES = {
  healthPotion: {
    id: "healthPotion",
    name: "治疗药水",
    description: "恢复 40 点生命",
    color: "#C64D4D"
  },
  sanityEssence: {
    id: "sanityEssence",
    name: "理智精华",
    description: "疯狂值 -30",
    color: "#4A90D9"
  },
  shield: {
    id: "shield",
    name: "护盾符咒",
    description: "抵挡下一次伤害",
    color: "#F7D05A"
  }
};

const BUFFS = {
  ironWall: {
    id: "ironWall",
    name: "铁壁",
    type: "maxHp",
    value: 10,
    rarity: "common",
    description: "最大生命 +10"
  },
  lifeSteal: {
    id: "lifeSteal",
    name: "生命汲取",
    type: "killHeal",
    value: 4,
    rarity: "rare",
    description: "击杀敌人时回复生命"
  },
  madnessWill: {
    id: "madnessWill",
    name: "疯狂意志",
    type: "maxMadness",
    value: 20,
    rarity: "common",
    description: "疯狂上限 +20"
  },
  critBlessing: {
    id: "critBlessing",
    name: "暴击精髓",
    type: "crit",
    value: 0.12,
    rarity: "rare",
    description: "暴击率 +12%"
  },
  bulletPenetrate: {
    id: "bulletPenetrate",
    name: "子弹穿透",
    type: "penetrate",
    value: 1,
    rarity: "epic",
    description: "子弹可额外穿透 1 个敌人"
  },
  madnessResonance: {
    id: "madnessResonance",
    name: "疯狂共鸣",
    type: "madnessAoE",
    value: 24,
    rarity: "legendary",
    description: "高疯狂时命中附带范围伤害"
  }
};

const ENEMIES = {
  cultist: {
    id: "cultist",
    name: "信徒",
    hp: 22,
    speed: 112,
    damage: 10,
    radius: 18,
    color: "#8B1E1E",
    madnessGain: 3
  },
  mutant: {
    id: "mutant",
    name: "变异体",
    hp: 34,
    speed: 88,
    damage: 14,
    radius: 20,
    color: "#4A9D4A",
    madnessGain: 5,
    shooter: true
  },
  watcher: {
    id: "watcher",
    name: "观察者",
    hp: 18,
    speed: 128,
    damage: 8,
    radius: 14,
    color: "#6B2D8B",
    madnessGain: 2,
    expose: true
  },
  zealot: {
    id: "zealot",
    name: "狂信徒",
    hp: 82,
    speed: 118,
    damage: 18,
    radius: 24,
    color: "#D95448",
    madnessGain: 8,
    elite: true
  },
  deepSpawn: {
    id: "deepSpawn",
    name: "深渊之子",
    hp: 122,
    speed: 82,
    damage: 22,
    radius: 26,
    color: "#3E7A6F",
    madnessGain: 12,
    elite: true,
    aoe: true
  },
  memoryEater: {
    id: "memoryEater",
    name: "记忆侵蚀者",
    hp: 62,
    speed: 102,
    damage: 10,
    radius: 22,
    color: "#6D82D9",
    madnessGain: 10,
    elite: true,
    sanityBurn: true
  },
  boss: {
    id: "boss",
    name: "乌姆·亚特",
    hp: 500,
    speed: 46,
    damage: 22,
    radius: 72,
    color: "#B12E58",
    madnessGain: 20,
    elite: true,
    boss: true
  }
};

const ROOM_FLOW = [
  {
    id: 1,
    type: "normal",
    name: "外环祭室",
    subtitle: "教学与热身",
    waves: [["cultist", "cultist", "cultist"], ["cultist", "cultist", "watcher"]]
  },
  {
    id: 2,
    type: "normal",
    name: "符文长廊",
    subtitle: "普通敌人混编",
    waves: [["cultist", "mutant", "cultist"], ["cultist", "mutant", "watcher", "cultist"]]
  },
  {
    id: 3,
    type: "elite",
    name: "鲜血回廊",
    subtitle: "首个精英压力点",
    waves: [["zealot", "cultist", "cultist", "watcher"], ["cultist", "cultist", "mutant"]]
  },
  {
    id: 4,
    type: "normal",
    name: "低语祭坑",
    subtitle: "密集波次",
    waves: [["mutant", "cultist", "cultist"], ["watcher", "mutant", "cultist", "cultist"], ["mutant", "mutant", "watcher"]]
  },
  {
    id: 5,
    type: "elite",
    name: "深渊窥口",
    subtitle: "高压精英房",
    waves: [["deepSpawn", "mutant", "watcher"], ["cultist", "mutant", "cultist"], ["memoryEater", "watcher", "watcher"]]
  },
  {
    id: 6,
    type: "shrine",
    name: "古神祭坛",
    subtitle: "在祝福与诅咒间选择",
    choices: ["blessing", "curse", "merchant"]
  },
  {
    id: 7,
    type: "rest",
    name: "过渡安全区",
    subtitle: "恢复生命与理智"
  },
  {
    id: 8,
    type: "boss",
    name: "深渊心室",
    subtitle: "乌姆·亚特",
    waves: [["boss"]]
  }
];

const SHRINE_EVENTS = {
  blessing: {
    id: "blessing",
    title: "神谕降临",
    body: "获得一项正面强化，并为接下来的房间蓄势。",
    rewards: ["ironWall", "lifeSteal", "critBlessing"]
  },
  curse: {
    id: "curse",
    title: "黑暗低语",
    body: "立刻获得 25 点疯狂，换取更强的临时火力。",
    rewards: ["madnessWill", "bulletPenetrate"]
  },
  merchant: {
    id: "merchant",
    title: "疯狂商人",
    body: "消耗疯狂值，换取更稳定的补给。",
    rewards: ["healthPotion", "sanityEssence", "shield"]
  }
};

module.exports = {
  ANALYSIS_CONFIG,
  APP_NAME_CN,
  APP_NAME_EN,
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
};
