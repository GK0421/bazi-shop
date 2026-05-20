const { APP_NAME_CN, APP_NAME_EN, YEARS, HOURS, LOCATIONS, PALETTE } = require("./constants");

function createGame() {
  const systemInfo = tt.getSystemInfoSync();
  const canvas = tt.createCanvas();
  const ctx = canvas.getContext("2d");

  resizeCanvas(canvas, systemInfo);

  const state = {
    canvas,
    ctx,
    width: canvas.width,
    height: canvas.height,
    dpr: systemInfo.pixelRatio || 1,
    phase: "form",
    loadingAngle: 0,
    loadingPulse: 0,
    ticker: 0,
    error: "",
    resultScroll: 0,
    resultScrollMax: 0,
    resultLines: [],
    resultCards: [],
    resultDisclaimer: "",
    resultRaw: "",
    buttons: [],
    selectors: {
      yearIndex: YEARS.indexOf(1995),
      month: 8,
      day: 18,
      hourIndex: HOURS.findIndex((item) => item.value === 9),
      gender: "男",
      locationIndex: 0
    }
  };

  if (state.selectors.yearIndex < 0) {
    state.selectors.yearIndex = 0;
  }
  if (state.selectors.hourIndex < 0) {
    state.selectors.hourIndex = 0;
  }

  tt.onTouchStart((event) => handleTouch(state, event));
  tt.onTouchMove((event) => handleTouchMove(state, event));
  tt.onTouchEnd(() => {
    state.lastMoveY = null;
  });

  function tick() {
    state.ticker += 1;
    state.loadingAngle += 0.06;
    state.loadingPulse += 0.04;
    render(state);
    requestAnimationFrame(tick);
  }

  tick();
}

function resizeCanvas(canvas, systemInfo) {
  const width = systemInfo.windowWidth;
  const height = systemInfo.windowHeight;
  canvas.width = width;
  canvas.height = height;
}

function handleTouch(state, event) {
  const touch = event.touches && event.touches[0];
  if (!touch) {
    return;
  }

  const hit = state.buttons.find((button) => isInside(touch.clientX, touch.clientY, button.rect));
  if (!hit) {
    return;
  }

  if (typeof hit.onTap === "function") {
    hit.onTap();
  }
}

function handleTouchMove(state, event) {
  if (state.phase !== "result") {
    return;
  }

  const touch = event.touches && event.touches[0];
  if (!touch) {
    return;
  }

  const panel = state.scrollPanel;
  if (!panel || !isInside(touch.clientX, touch.clientY, panel)) {
    return;
  }

  if (typeof state.lastMoveY !== "number") {
    state.lastMoveY = touch.clientY;
    return;
  }

  const delta = state.lastMoveY - touch.clientY;
  state.lastMoveY = touch.clientY;
  state.resultScroll = clamp(state.resultScroll + delta, 0, state.resultScrollMax);
}

function render(state) {
  const { ctx, width, height } = state;

  ctx.clearRect(0, 0, width, height);
  drawBackground(ctx, width, height, state.ticker);

  state.buttons = [];
  state.scrollPanel = null;

  if (state.phase === "form") {
    drawFormScene(state);
    return;
  }

  if (state.phase === "loading") {
    drawLoadingScene(state);
    return;
  }

  drawResultScene(state);
}

function drawBackground(ctx, width, height, ticker) {
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, "#100C1E");
  gradient.addColorStop(0.4, "#1B1230");
  gradient.addColorStop(1, "#43210F");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  for (let i = 0; i < 26; i += 1) {
    const x = (width / 25) * i + ((ticker * 0.25 + i * 13) % 17);
    const y = ((i * 91 + ticker * 0.4) % (height + 120)) - 60;
    const radius = i % 5 === 0 ? 2.2 : 1.2;
    ctx.beginPath();
    ctx.fillStyle = i % 3 === 0 ? "rgba(255,219,128,0.9)" : "rgba(255,255,255,0.55)";
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.strokeStyle = "rgba(241,194,125,0.08)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(width * 0.84, height * 0.14, width * 0.24, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(width * 0.14, height * 0.88, width * 0.18, 0, Math.PI * 2);
  ctx.stroke();
}

function drawFormScene(state) {
  const { ctx, width, height, selectors } = state;
  const compact = height < 760;
  const cardX = 24;
  const cardY = compact ? 96 : 118;
  const cardWidth = width - 48;
  const cardHeight = height - (compact ? 138 : 178);

  drawBadge(ctx, width);
  drawPanel(ctx, cardX, cardY, cardWidth, cardHeight);

  drawText(ctx, APP_NAME_CN, width / 2, 64, {
    size: compact ? 30 : 34,
    weight: "700",
    color: PALETTE.ink,
    align: "center"
  });

  drawText(ctx, APP_NAME_EN, width / 2, 88, {
    size: 16,
    color: PALETTE.accent,
    align: "center"
  });

  drawText(ctx, "抽一张今日人设，看看你是哪一款风。", width / 2, 110, {
    size: 14,
    color: "rgba(244,237,225,0.72)",
    align: "center"
  });

  const left = cardX + 18;
  let top = cardY + 24;
  const contentWidth = cardWidth - 36;

  drawStepper(state, {
    label: "年份",
    value: `${YEARS[selectors.yearIndex]}`,
    helper: "1980 - 2010",
    x: left,
    y: top,
    width: contentWidth,
    compact,
    onMinus: () => updateSelector(state, "yearIndex", clamp(selectors.yearIndex - 1, 0, YEARS.length - 1)),
    onPlus: () => updateSelector(state, "yearIndex", clamp(selectors.yearIndex + 1, 0, YEARS.length - 1))
  });
  top += compact ? 72 : 92;

  drawDualStepperRow(state, top, left, contentWidth, compact);
  top += compact ? 72 : 92;

  drawStepper(state, {
    label: "时辰",
    value: HOURS[selectors.hourIndex].label,
    helper: `${HOURS[selectors.hourIndex].value}:00 命理入盘`,
    x: left,
    y: top,
    width: contentWidth,
    compact,
    onMinus: () => updateSelector(state, "hourIndex", clamp(selectors.hourIndex - 1, 0, HOURS.length - 1)),
    onPlus: () => updateSelector(state, "hourIndex", clamp(selectors.hourIndex + 1, 0, HOURS.length - 1))
  });
  top += compact ? 82 : 102;

  drawChoiceChips(state, {
    label: "性别",
    options: ["男", "女"],
    selected: selectors.gender,
    x: left,
    y: top,
    width: contentWidth,
    compact,
    onSelect: (value) => updateSelector(state, "gender", value)
  });
  top += compact ? 60 : 90;

  drawChoiceChips(state, {
    label: "出生地",
    options: LOCATIONS,
    selected: LOCATIONS[selectors.locationIndex],
    x: left,
    y: top,
    width: contentWidth,
    compact,
    onSelect: (value) => updateSelector(state, "locationIndex", LOCATIONS.indexOf(value))
  });
  top += compact ? 94 : 126;

  const summaryY = top;
  const summaryText = `已选择 ${YEARS[selectors.yearIndex]}-${padNumber(selectors.month)}-${padNumber(selectors.day)}  ${HOURS[selectors.hourIndex].label}  ·  ${selectors.gender}  ·  ${LOCATIONS[selectors.locationIndex]}`;
  drawText(ctx, "本次设定", left, summaryY, {
    size: compact ? 14 : 15,
    color: PALETTE.accent
  });
  drawWrappedText(ctx, summaryText, left, summaryY + (compact ? 20 : 24), contentWidth, compact ? 18 : 20, {
    size: compact ? 12 : 14,
    color: "rgba(244,237,225,0.86)"
  });

  const buttonY = cardY + cardHeight - (compact ? 70 : 84);
  const buttonRect = { x: left, y: buttonY, width: contentWidth, height: compact ? 48 : 52 };
  drawPrimaryButton(ctx, buttonRect, "抽今日人设签", "一键生成你的 Vibe Card");
  state.buttons.push({
    rect: buttonRect,
    onTap: () => submitAnalysis(state)
  });

  if (state.error) {
    drawText(ctx, state.error, left, buttonY - 18, {
      size: 12,
      color: PALETTE.warning
    });
  }
}

function drawLoadingScene(state) {
  const { ctx, width, height } = state;
  drawText(ctx, "人设签生成中", width / 2, height * 0.3, {
    size: 30,
    weight: "700",
    color: PALETTE.ink,
    align: "center"
  });
  drawText(ctx, "正在生成你的今日气质关键词", width / 2, height * 0.3 + 30, {
    size: 14,
    color: "rgba(244,237,225,0.7)",
    align: "center"
  });

  const cx = width / 2;
  const cy = height * 0.52;
  const radius = Math.min(width, height) * 0.16;
  const pulse = Math.sin(state.loadingPulse) * 8;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = "rgba(244,237,225,0.18)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.rotate(state.loadingAngle);
  ctx.strokeStyle = PALETTE.gold;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(0, 0, radius + pulse, 0, Math.PI * 1.35);
  ctx.stroke();

  for (let i = 0; i < 4; i += 1) {
    ctx.rotate(Math.PI / 2);
    ctx.fillStyle = i % 2 === 0 ? PALETTE.accent : PALETTE.jade;
    ctx.beginPath();
    ctx.arc(radius + 12, 0, 5 + ((i + state.ticker) % 3), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  drawText(ctx, "请稍等，结果会直接压成轻量卡片。", width / 2, height * 0.82, {
    size: 13,
    color: "rgba(244,237,225,0.6)",
    align: "center"
  });
}

function drawResultScene(state) {
  const { ctx, width, height } = state;
  const titleY = 70;
  drawText(ctx, APP_NAME_CN, width / 2, titleY, {
    size: 30,
    weight: "700",
    color: PALETTE.ink,
    align: "center"
  });
  drawText(ctx, `${APP_NAME_EN} · 短句直给`, width / 2, titleY + 24, {
    size: 13,
    color: "rgba(244,237,225,0.68)",
    align: "center"
  });

  const panel = {
    x: 22,
    y: 108,
    width: width - 44,
    height: height - 210
  };
  drawPanel(ctx, panel.x, panel.y, panel.width, panel.height);
  state.scrollPanel = panel;

  const innerX = panel.x + 18;
  const innerY = panel.y + 18;
  const innerWidth = panel.width - 36;
  const innerHeight = panel.height - 36;

  drawText(ctx, "今日 Vibe 结果", innerX, innerY, {
    size: 15,
    color: PALETTE.accent
  });

  const cards = state.resultCards.length ? state.resultCards : [{ title: "提示", text: "暂无结果，请重新生成。" }];
  let cardY = innerY + 32;
  const cardGap = 12;
  const cardHeight = 68;

  for (let i = 0; i < cards.length; i += 1) {
    const card = cards[i];
    drawResultCard(ctx, {
      x: innerX,
      y: cardY,
      width: innerWidth,
      height: cardHeight,
      title: card.title,
      text: card.text,
      accent: i % 2 === 0 ? PALETTE.accent : PALETTE.jade
    });
    cardY += cardHeight + cardGap;
  }

  const disclaimerY = cardY + 8;
  drawText(ctx, "说明", innerX, disclaimerY, {
    size: 13,
    color: "rgba(244,237,225,0.56)"
  });
  drawWrappedText(ctx, state.resultDisclaimer || "仅供娱乐和传统文化学习参考。", innerX, disclaimerY + 22, innerWidth, 18, {
    size: 12,
    color: "rgba(244,237,225,0.72)"
  });

  const bottomY = height - 78;
  const gap = 14;
  const buttonWidth = (width - 44 - gap) / 2;

  const retryRect = { x: 22, y: bottomY, width: buttonWidth, height: 50 };
  const resetRect = { x: 22 + buttonWidth + gap, y: bottomY, width: buttonWidth, height: 50 };

  drawSecondaryButton(ctx, retryRect, "换一张卡");
  drawPrimaryButton(ctx, resetRect, "重新选择");

  state.buttons.push({
    rect: retryRect,
    onTap: () => submitAnalysis(state)
  });
  state.buttons.push({
    rect: resetRect,
    onTap: () => {
      state.phase = "form";
      state.resultScroll = 0;
      state.lastMoveY = null;
    }
  });
}

function drawBadge(ctx, width) {
  const rect = { x: width / 2 - 58, y: 20, width: 116, height: 24 };
  roundRect(ctx, rect.x, rect.y, rect.width, rect.height, 999);
  ctx.fillStyle = "rgba(241,194,125,0.14)";
  ctx.fill();
  ctx.strokeStyle = "rgba(241,194,125,0.3)";
  ctx.lineWidth = 1;
  ctx.stroke();
  drawText(ctx, "PERSONA VIBE MINI GAME", width / 2, 36, {
    size: 10,
    color: PALETTE.accent,
    align: "center"
  });
}

function drawPanel(ctx, x, y, width, height) {
  ctx.save();
  const gradient = ctx.createLinearGradient(x, y, x + width, y + height);
  gradient.addColorStop(0, "rgba(24,18,40,0.95)");
  gradient.addColorStop(1, "rgba(39,25,59,0.92)");
  roundRect(ctx, x, y, width, height, 28);
  ctx.fillStyle = gradient;
  ctx.fill();
  ctx.strokeStyle = PALETTE.line;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}

function drawSectionTitle(ctx, label, x, y) {
  drawText(ctx, label, x, y, {
    size: 17,
    weight: "700",
    color: PALETTE.ink
  });
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.beginPath();
  ctx.moveTo(x, y + 14);
  ctx.lineTo(x + 72, y + 14);
  ctx.stroke();
}

function drawStepper(state, config) {
  const { ctx } = state;
  const { x, y, width, label, value, helper, onMinus, onPlus, compact } = config;
  const height = compact ? 58 : 74;
  const rect = { x, y, width, height };

  roundRect(ctx, rect.x, rect.y, rect.width, rect.height, 22);
  ctx.fillStyle = "rgba(255,255,255,0.04)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.stroke();

  drawText(ctx, label, x + 18, y + 24, {
    size: compact ? 12 : 14,
    color: "rgba(244,237,225,0.72)"
  });
  drawText(ctx, value, x + 18, y + (compact ? 44 : 52), {
    size: compact ? 20 : 24,
    weight: "700",
    color: PALETTE.ink
  });
  drawText(ctx, helper, x + width - (compact ? 88 : 94), y + 24, {
    size: compact ? 10 : 11,
    color: "rgba(244,237,225,0.48)",
    align: "left"
  });

  const minusRect = { x: x + width - 92, y: y + (compact ? 14 : 18), width: 30, height: 30 };
  const plusRect = { x: x + width - 46, y: y + (compact ? 14 : 18), width: 30, height: 30 };
  drawIconButton(ctx, minusRect, "-");
  drawIconButton(ctx, plusRect, "+");
  state.buttons.push({ rect: minusRect, onTap: onMinus });
  state.buttons.push({ rect: plusRect, onTap: onPlus });
}

function drawDualStepperRow(state, y, x, width, compact) {
  const gap = 12;
  const colWidth = (width - gap) / 2;
  const { selectors } = state;

  drawStepper(state, {
    label: "月份",
    value: `${padNumber(selectors.month)}`,
    helper: "01 - 12",
    x,
    y,
    width: colWidth,
    compact,
    onMinus: () => updateSelector(state, "month", wrap(selectors.month - 1, 1, 12)),
    onPlus: () => updateSelector(state, "month", wrap(selectors.month + 1, 1, 12))
  });

  drawStepper(state, {
    label: "日期",
    value: `${padNumber(selectors.day)}`,
    helper: "01 - 31",
    x: x + colWidth + gap,
    y,
    width: colWidth,
    compact,
    onMinus: () => updateSelector(state, "day", wrap(selectors.day - 1, 1, daysInMonth(YEARS[selectors.yearIndex], selectors.month))),
    onPlus: () => updateSelector(state, "day", wrap(selectors.day + 1, 1, daysInMonth(YEARS[selectors.yearIndex], selectors.month)))
  });
}

function drawChoiceChips(state, config) {
  const { ctx } = state;
  const { label, options, selected, x, y, width, onSelect, compact } = config;
  drawText(ctx, label, x, y + 12, {
    size: compact ? 12 : 14,
    color: "rgba(244,237,225,0.72)"
  });

  const chipY = y + 24;
  let chipX = x;
  let rowY = chipY;

  options.forEach((option) => {
    const chipWidth = option.length * (compact ? 15 : 18) + (compact ? 24 : 30);
    if (chipX + chipWidth > x + width) {
      chipX = x;
      rowY += compact ? 36 : 42;
    }

    const rect = { x: chipX, y: rowY, width: chipWidth, height: compact ? 28 : 30 };
    roundRect(ctx, rect.x, rect.y, rect.width, rect.height, 999);
    const active = option === selected;
    ctx.fillStyle = active ? "rgba(215,163,75,0.22)" : "rgba(255,255,255,0.05)";
    ctx.fill();
    ctx.strokeStyle = active ? "rgba(241,194,125,0.65)" : "rgba(255,255,255,0.08)";
    ctx.stroke();

    drawText(ctx, option, rect.x + rect.width / 2, rect.y + (compact ? 18 : 19), {
      size: compact ? 12 : 13,
      color: active ? PALETTE.ink : "rgba(244,237,225,0.78)",
      align: "center"
    });

    state.buttons.push({ rect, onTap: () => onSelect(option) });
    chipX += chipWidth + 8;
  });
}

function drawPrimaryButton(ctx, rect, title, subtitle) {
  const gradient = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.width, rect.y);
  gradient.addColorStop(0, PALETTE.goldSoft);
  gradient.addColorStop(1, PALETTE.ember);
  roundRect(ctx, rect.x, rect.y, rect.width, rect.height, 999);
  ctx.fillStyle = gradient;
  ctx.fill();

  drawText(ctx, title, rect.x + rect.width / 2, rect.y + (subtitle ? 22 : 32), {
    size: subtitle ? 16 : 17,
    weight: "700",
    color: "#FFF8EE",
    align: "center"
  });

  if (subtitle) {
    drawText(ctx, subtitle, rect.x + rect.width / 2, rect.y + 38, {
      size: 11,
      color: "rgba(255,248,238,0.8)",
      align: "center"
    });
  }
}

function drawSecondaryButton(ctx, rect, title) {
  roundRect(ctx, rect.x, rect.y, rect.width, rect.height, 999);
  ctx.fillStyle = "rgba(255,255,255,0.05)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.stroke();
  drawText(ctx, title, rect.x + rect.width / 2, rect.y + 31, {
    size: 16,
    weight: "700",
    color: PALETTE.ink,
    align: "center"
  });
}

function drawResultCard(ctx, config) {
  const { x, y, width, height, title, text, accent } = config;
  roundRect(ctx, x, y, width, height, 20);
  ctx.fillStyle = "rgba(255,255,255,0.045)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.stroke();

  ctx.fillStyle = accent;
  ctx.fillRect(x + 12, y + 14, 4, height - 28);

  drawText(ctx, title, x + 26, y + 24, {
    size: 13,
    color: accent
  });

  drawWrappedText(ctx, text, x + 26, y + 46, width - 40, 17, {
    size: 15,
    weight: "700",
    color: PALETTE.ink
  });
}

function drawIconButton(ctx, rect, label) {
  roundRect(ctx, rect.x, rect.y, rect.width, rect.height, 10);
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.fill();
  drawText(ctx, label, rect.x + rect.width / 2, rect.y + 21, {
    size: 18,
    weight: "700",
    color: PALETTE.ink,
    align: "center"
  });
}

function drawScrollbar(ctx, x, y, height, scroll, max) {
  ctx.fillStyle = "rgba(255,255,255,0.06)";
  roundRect(ctx, x, y, 4, height, 999);
  ctx.fill();

  if (!max) {
    ctx.fillStyle = "rgba(255,255,255,0.32)";
    roundRect(ctx, x, y, 4, height * 0.2, 999);
    ctx.fill();
    return;
  }

  const thumbHeight = Math.max(26, height * 0.22);
  const ratio = scroll / max;
  const thumbY = y + (height - thumbHeight) * ratio;
  ctx.fillStyle = "rgba(241,194,125,0.8)";
  roundRect(ctx, x, thumbY, 4, thumbHeight, 999);
  ctx.fill();
}

function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight, options) {
  const lines = wrapText(ctx, text, maxWidth, options);
  let currentY = y;
  for (let i = 0; i < lines.length; i += 1) {
    drawText(ctx, lines[i], x, currentY, options);
    currentY += lineHeight;
  }
}

function wrapText(ctx, text, maxWidth, options) {
  const normalized = String(text || "").replace(/\r/g, "");
  const segments = normalized.split("\n");
  const allLines = [];

  ctx.save();
  ctx.font = `${options.weight || "400"} ${options.size || 14}px sans-serif`;
  segments.forEach((segment) => {
    if (!segment) {
      allLines.push("");
      return;
    }

    let current = "";
    for (const char of segment) {
      const test = current + char;
      if (ctx.measureText(test).width > maxWidth && current) {
        allLines.push(current);
        current = char;
      } else {
        current = test;
      }
    }
    if (current) {
      allLines.push(current);
    }
  });
  ctx.restore();
  return allLines;
}

function drawText(ctx, text, x, y, options) {
  ctx.save();
  ctx.font = `${options.weight || "400"} ${options.size || 14}px sans-serif`;
  ctx.fillStyle = options.color || "#fff";
  ctx.textAlign = options.align || "left";
  ctx.textBaseline = options.baseline || "alphabetic";
  ctx.fillText(text, x, y);
  ctx.restore();
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

function updateSelector(state, key, value) {
  state.selectors[key] = value;

  if (key === "month" || key === "yearIndex") {
    const maxDays = daysInMonth(YEARS[state.selectors.yearIndex], state.selectors.month);
    if (state.selectors.day > maxDays) {
      state.selectors.day = maxDays;
    }
  }
}

function submitAnalysis(state) {
  state.error = "";
  state.phase = "loading";
  state.resultScroll = 0;
  state.lastMoveY = null;

  const selectors = state.selectors;
  const body = {
    birthday: `${YEARS[selectors.yearIndex]}-${padNumber(selectors.month)}-${padNumber(selectors.day)}`,
    hour: HOURS[selectors.hourIndex].value,
    gender: selectors.gender,
    location: LOCATIONS[selectors.locationIndex] === "未填写" ? "" : LOCATIONS[selectors.locationIndex]
  };

  tt.request({
    url: "http://127.0.0.1:8787/api/analyze-bazi",
    method: "POST",
    header: {
      "content-type": "application/json"
    },
    data: body,
    success: (response) => {
      const payload = response.data || {};
      if (response.statusCode === 200 && payload.success) {
        state.phase = "result";
        state.resultRaw = payload.result || "";
        state.resultLines = buildResultLines(state.ctx, state.resultRaw, state.width - 98);
        const parsed = parseResultSections(state.resultRaw);
        state.resultCards = parsed.cards;
        state.resultDisclaimer = parsed.disclaimer;
        return;
      }

      state.phase = "form";
      state.error = payload.error || "生成失败，请检查本地服务和密钥配置。";
    },
    fail: () => {
      state.phase = "form";
      state.error = "无法连接本地服务，请先运行 npm run dev:api。";
    }
  });
}

function buildResultLines(ctx, raw, width) {
  const normalized = String(raw || "")
    .replace(/\*\*/g, "")
    .replace(/^#+\s?/gm, "")
    .replace(/^\|.*\|$/gm, "")
    .replace(/^-{3,}$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  const lines = wrapText(ctx, normalized, width, { size: 14, weight: "400" });
  return lines.length ? lines : ["暂无结果。"];
}

function parseResultSections(raw) {
  const matches = String(raw || "").matchAll(/【([^】]+)】\n?([^【]*)/g);
  const cards = [];
  let disclaimer = "";

  for (const match of matches) {
    const title = (match[1] || "").trim();
    const text = (match[2] || "").replace(/\s+/g, " ").trim();
    if (!title || !text) {
      continue;
    }

    if (title === "免责声明") {
      disclaimer = text;
      continue;
    }

    cards.push({
      title,
      text: text.length > 34 ? `${text.slice(0, 34)}...` : text
    });
  }

  return {
    cards: cards.slice(0, 4),
    disclaimer
  };
}

function daysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

function padNumber(value) {
  return String(value).padStart(2, "0");
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function wrap(value, min, max) {
  if (value < min) {
    return max;
  }
  if (value > max) {
    return min;
  }
  return value;
}

function isInside(x, y, rect) {
  return x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height;
}

module.exports = {
  createGame
};
