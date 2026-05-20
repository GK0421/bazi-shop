const AUDIO_STORAGE_DIR = "crazy-abyss-audio";
const DEFAULT_SAMPLE_RATE = 22050;

function createAudioState(config, systemInfo) {
  return {
    enabled: true,
    ready: false,
    singleChannel: /android/i.test((systemInfo && systemInfo.platform) || ""),
    currentBgmKey: "",
    manifestPath: config.manifestPath,
    assetDir: "",
    paths: {},
    bgm: null,
    sfx: null
  };
}

function initializeAudio(audioState) {
  if (!audioState || !tt || !tt.getFileSystemManager || !tt.createInnerAudioContext || !tt.env || !tt.env.USER_DATA_PATH) {
    return audioState;
  }

  try {
    const fs = tt.getFileSystemManager();
    const assetDir = `${tt.env.USER_DATA_PATH}/${AUDIO_STORAGE_DIR}`;
    ensureDir(fs, assetDir);

    const specs = buildAudioSpecs();
    Object.keys(specs).forEach((key) => {
      const targetPath = `${assetDir}/${key}.wav`;
      audioState.paths[key] = targetPath;
      if (!fileExists(fs, targetPath)) {
        const wav = createWavBuffer(specs[key]);
        fs.writeFileSync(targetPath, wav, "binary");
      }
    });

    audioState.assetDir = assetDir;
    audioState.bgm = tt.createInnerAudioContext();
    audioState.bgm.loop = true;
    audioState.bgm.autoplay = false;
    audioState.bgm.volume = 0.62;
    audioState.bgm.obeyMuteSwitch = false;

    if (!audioState.singleChannel) {
      audioState.sfx = tt.createInnerAudioContext();
      audioState.sfx.loop = false;
      audioState.sfx.autoplay = false;
      audioState.sfx.volume = 0.92;
      audioState.sfx.obeyMuteSwitch = false;
    }

    audioState.ready = true;
  } catch (_error) {
    audioState.ready = false;
  }

  return audioState;
}

function setAudioEnabled(audioState, enabled) {
  if (!audioState) {
    return false;
  }

  audioState.enabled = Boolean(enabled);
  if (!audioState.enabled) {
    safeStop(audioState.bgm);
    safeStop(audioState.sfx);
    return false;
  }

  if (audioState.currentBgmKey) {
    playBgm(audioState, audioState.currentBgmKey);
  }
  return true;
}

function toggleAudioEnabled(audioState) {
  return setAudioEnabled(audioState, !audioState.enabled);
}

function syncSceneAudio(state) {
  if (!state || !state.audio) {
    return;
  }

  let bgmKey = "bgm_menu";
  if (state.scene === "battle" || state.scene === "room_intro" || state.scene === "reward" || state.scene === "event" || state.scene === "switch") {
    if (state.room && state.room.type === "boss") {
      bgmKey = "bgm_boss";
    } else if (state.room && state.room.type === "rest") {
      bgmKey = "bgm_safe";
    } else {
      bgmKey = "bgm_battle";
    }
  } else if (state.scene === "rest") {
    bgmKey = "bgm_safe";
  } else if (state.scene === "game_over") {
    bgmKey = state.victory ? "sting_victory" : "bgm_menu";
  }

  playBgm(state.audio, bgmKey);
}

function playUiTap(state) {
  playSfx(state, "ui_button");
}

function playAlert(state) {
  playSfx(state, "ui_alert");
}

function playSkill(state) {
  playSfx(state, "skill_mental_shock");
}

function playBossScream(state) {
  playSfx(state, "boss_scream");
}

function playRoomIntro(state) {
  playSfx(state, "sting_room_intro");
}

function playVictory(state) {
  playSfx(state, "sting_victory");
}

function vibrateLight() {
  if (tt && tt.vibrateShort) {
    try {
      tt.vibrateShort({ type: "light" });
    } catch (_error) {
      // ignore
    }
  }
}

function playBgm(audioState, key) {
  if (!audioState || !audioState.ready || !audioState.enabled || !audioState.bgm) {
    return;
  }

  const nextPath = audioState.paths[key];
  if (!nextPath) {
    return;
  }
  if (audioState.currentBgmKey === key) {
    return;
  }

  audioState.currentBgmKey = key;
  try {
    safeStop(audioState.bgm);
    audioState.bgm.src = nextPath;
    audioState.bgm.loop = key.indexOf("sting_") !== 0;
    audioState.bgm.play();
  } catch (_error) {
    // ignore
  }
}

function playSfx(state, key) {
  if (!state || !state.audio || !state.audio.ready || !state.audio.enabled) {
    return;
  }

  vibrateLight();
  if (state.audio.singleChannel || !state.audio.sfx) {
    return;
  }

  const nextPath = state.audio.paths[key];
  if (!nextPath) {
    return;
  }

  try {
    safeStop(state.audio.sfx);
    state.audio.sfx.src = nextPath;
    state.audio.sfx.play();
  } catch (_error) {
    // ignore
  }
}

function safeStop(ctx) {
  if (!ctx) {
    return;
  }
  try {
    ctx.stop();
  } catch (_error) {
    // ignore
  }
}

function ensureDir(fs, dirPath) {
  try {
    fs.accessSync(dirPath);
  } catch (_error) {
    fs.mkdirSync(dirPath, true);
  }
}

function fileExists(fs, filePath) {
  try {
    fs.accessSync(filePath);
    return true;
  } catch (_error) {
    return false;
  }
}

function buildAudioSpecs() {
  return {
    bgm_menu: {
      duration: 4.8,
      generator: function menuTone(t, duration) {
        return envelope(t, duration, 0.2) * (
          0.34 * Math.sin(Math.PI * 2 * 92 * t) +
          0.22 * Math.sin(Math.PI * 2 * 138 * t + 0.3) +
          0.12 * Math.sin(Math.PI * 2 * (180 + 12 * Math.sin(t * 2)) * t)
        );
      }
    },
    bgm_battle: {
      duration: 4.2,
      generator: function battleTone(t, duration) {
        const beat = Math.max(0, Math.sin(Math.PI * 2 * 2 * t));
        return envelope(t, duration, 0.18) * (
          0.22 * Math.sin(Math.PI * 2 * 110 * t) +
          0.18 * Math.sin(Math.PI * 2 * 220 * t) * beat +
          0.08 * pseudoNoise(t * 40)
        );
      }
    },
    bgm_boss: {
      duration: 4.6,
      generator: function bossTone(t, duration) {
        const wobble = 1 + 0.07 * Math.sin(t * 6);
        return envelope(t, duration, 0.16) * (
          0.28 * Math.sin(Math.PI * 2 * 74 * wobble * t) +
          0.15 * Math.sin(Math.PI * 2 * 147 * t + 1.2) +
          0.14 * pseudoNoise(t * 80)
        );
      }
    },
    bgm_safe: {
      duration: 4.4,
      generator: function safeTone(t, duration) {
        return envelope(t, duration, 0.2) * (
          0.26 * Math.sin(Math.PI * 2 * 164 * t) +
          0.18 * Math.sin(Math.PI * 2 * 246 * t + 0.5)
        );
      }
    },
    sting_room_intro: {
      duration: 0.9,
      generator: function introTone(t, duration) {
        const freq = 320 - 180 * (t / duration);
        return envelope(t, duration, 0.05) * 0.52 * Math.sin(Math.PI * 2 * freq * t);
      }
    },
    sting_victory: {
      duration: 1.1,
      generator: function victoryTone(t, duration) {
        const freq = t < duration * 0.45 ? 220 : 330;
        return envelope(t, duration, 0.08) * 0.48 * Math.sin(Math.PI * 2 * freq * t);
      }
    },
    ui_button: {
      duration: 0.08,
      generator: function buttonTone(t, duration) {
        return envelope(t, duration, 0.02) * 0.55 * Math.sin(Math.PI * 2 * 520 * t);
      }
    },
    ui_alert: {
      duration: 0.18,
      generator: function alertTone(t, duration) {
        const freq = 720 - 260 * (t / duration);
        return envelope(t, duration, 0.02) * 0.46 * Math.sin(Math.PI * 2 * freq * t);
      }
    },
    skill_mental_shock: {
      duration: 0.32,
      generator: function skillTone(t, duration) {
        const freq = 180 + 520 * (t / duration);
        return envelope(t, duration, 0.03) * (
          0.32 * Math.sin(Math.PI * 2 * freq * t) +
          0.18 * pseudoNoise(t * 120)
        );
      }
    },
    boss_scream: {
      duration: 0.42,
      generator: function bossScreamTone(t, duration) {
        const freq = 260 + 180 * Math.sin(t * 16);
        return envelope(t, duration, 0.04) * (
          0.26 * Math.sin(Math.PI * 2 * freq * t) +
          0.24 * pseudoNoise(t * 160)
        );
      }
    }
  };
}

function createWavBuffer(spec) {
  const sampleRate = spec.sampleRate || DEFAULT_SAMPLE_RATE;
  const duration = spec.duration || 0.2;
  const sampleCount = Math.max(1, Math.floor(sampleRate * duration));
  const byteRate = sampleRate * 2;
  const dataSize = sampleCount * 2;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  writeAscii(view, 0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeAscii(view, 8, "WAVE");
  writeAscii(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeAscii(view, 36, "data");
  view.setUint32(40, dataSize, true);

  for (let i = 0; i < sampleCount; i += 1) {
    const t = i / sampleRate;
    const value = clamp(spec.generator(t, duration), -1, 1);
    view.setInt16(44 + i * 2, Math.floor(value * 32767), true);
  }

  return buffer;
}

function writeAscii(view, offset, text) {
  for (let i = 0; i < text.length; i += 1) {
    view.setUint8(offset + i, text.charCodeAt(i));
  }
}

function envelope(t, duration, fade) {
  const attack = Math.max(0.01, fade);
  const release = Math.max(0.01, fade);
  const attackGain = Math.min(1, t / attack);
  const releaseGain = Math.min(1, Math.max(0, duration - t) / release);
  return Math.min(attackGain, releaseGain);
}

function pseudoNoise(seed) {
  const raw = Math.sin(seed * 12.9898) * 43758.5453;
  return (raw - Math.floor(raw)) * 2 - 1;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

module.exports = {
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
};
