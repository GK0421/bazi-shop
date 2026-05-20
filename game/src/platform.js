const STORAGE_KEY = "crazy-abyss-save-v1";

function hydratePersistentState(state) {
  if (!tt || !tt.getStorageSync) {
    return;
  }

  try {
    const saved = tt.getStorageSync(STORAGE_KEY) || {};
    state.selectedCharacterId = saved.selectedCharacterId || state.selectedCharacterId || "AIDA";
    state.bestRecord = saved.bestRecord || createDefaultBestRecord();
    state.tutorialSeen = Boolean(saved.tutorialSeen);
    if (saved.audioEnabled === false) {
      state.audio.enabled = false;
    }
  } catch (_error) {
    state.bestRecord = createDefaultBestRecord();
  }
}

function persistPersistentState(state) {
  if (!tt || !tt.setStorageSync) {
    return;
  }

  try {
    tt.setStorageSync(STORAGE_KEY, {
      selectedCharacterId: state.selectedCharacterId,
      bestRecord: state.bestRecord || createDefaultBestRecord(),
      tutorialSeen: Boolean(state.tutorialSeen),
      audioEnabled: state.audio ? state.audio.enabled : true
    });
  } catch (_error) {
    // ignore
  }
}

function setupPlatformHooks(state, scenes) {
  if (tt && tt.showShareMenu) {
    try {
      tt.showShareMenu({ withShareTicket: false });
    } catch (_error) {
      // ignore
    }
  }

  if (tt && tt.onShow) {
    tt.onShow((launchInfo) => {
      state.platform.lastLaunchInfo = launchInfo || {};
      if (launchInfo && String(launchInfo.scene) === "021036") {
        state.platform.pendingSidebarReward = true;
      }
    });
  }

  if (tt && tt.onHide) {
    tt.onHide(() => {
      if (state.scene === scenes.BATTLE) {
        state.sceneBeforePause = state.scene;
        state.scene = scenes.PAUSE;
      }
      persistPersistentState(state);
    });
  }
}

function maybeConsumeSidebarReward(state) {
  if (!state.platform.pendingSidebarReward) {
    return false;
  }
  state.platform.pendingSidebarReward = false;
  return true;
}

function saveBestRecord(state) {
  const surviveSeconds = Math.max(0, Math.floor(state.now - state.runStartAt));
  const nextRecord = {
    roomsCleared: state.runStats.roomsCleared,
    kills: state.runStats.kills,
    surviveSeconds,
    victory: Boolean(state.victory),
    peakMadness: state.runStats.peakMadness,
    characterId: state.player.characterId
  };

  if (shouldReplaceRecord(state.bestRecord, nextRecord)) {
    state.bestRecord = nextRecord;
    persistPersistentState(state);
  }
}

function shouldReplaceRecord(currentRecord, nextRecord) {
  if (!currentRecord) {
    return true;
  }
  if (Boolean(nextRecord.victory) && !currentRecord.victory) {
    return true;
  }
  if (nextRecord.roomsCleared !== currentRecord.roomsCleared) {
    return nextRecord.roomsCleared > currentRecord.roomsCleared;
  }
  if (nextRecord.kills !== currentRecord.kills) {
    return nextRecord.kills > currentRecord.kills;
  }
  return nextRecord.surviveSeconds > currentRecord.surviveSeconds;
}

function shareRunResult(state) {
  if (!tt || !tt.shareAppMessage) {
    return false;
  }

  const title = state.victory
    ? `我在《疯狂深渊》击退了乌姆·亚特，最高疯狂值 ${state.runStats.peakMadness}`
    : `我在《疯狂深渊》撑过了 ${state.runStats.roomsCleared} 个房间，你能走得更深吗？`;

  try {
    tt.shareAppMessage({
      channel: "invite",
      title,
      query: `rooms=${state.runStats.roomsCleared}&kills=${state.runStats.kills}&peakMadness=${state.runStats.peakMadness}`
    });
    return true;
  } catch (_error) {
    return false;
  }
}

function openSidebarRevisit() {
  if (!tt || !tt.navigateToScene) {
    return false;
  }

  try {
    tt.navigateToScene({
      scene: "sidebar"
    });
    return true;
  } catch (_error) {
    return false;
  }
}

function markTutorialSeen(state) {
  state.tutorialSeen = true;
  persistPersistentState(state);
}

function createDefaultBestRecord() {
  return {
    roomsCleared: 0,
    kills: 0,
    surviveSeconds: 0,
    victory: false,
    peakMadness: 0,
    characterId: "AIDA"
  };
}

module.exports = {
  createDefaultBestRecord,
  hydratePersistentState,
  markTutorialSeen,
  maybeConsumeSidebarReward,
  openSidebarRevisit,
  persistPersistentState,
  saveBestRecord,
  setupPlatformHooks,
  shareRunResult
};
