const YEARS = [];
for (let year = 1980; year <= 2010; year += 1) {
  YEARS.push(year);
}

const HOURS = [
  { label: "子时", value: 23 },
  { label: "丑时", value: 1 },
  { label: "寅时", value: 3 },
  { label: "卯时", value: 5 },
  { label: "辰时", value: 7 },
  { label: "巳时", value: 9 },
  { label: "午时", value: 11 },
  { label: "未时", value: 13 },
  { label: "申时", value: 15 },
  { label: "酉时", value: 17 },
  { label: "戌时", value: 19 },
  { label: "亥时", value: 21 }
];

const LOCATIONS = ["北京", "上海", "广州", "深圳", "杭州", "成都", "西安", "未填写"];

const PALETTE = {
  ink: "#F4EDE1",
  gold: "#D7A34B",
  goldSoft: "#A77929",
  ember: "#C05E2B",
  plum: "#2A1838",
  night: "#120E1E",
  smoke: "#8A7E98",
  jade: "#4FA089",
  panel: "#1A1228",
  panelAlt: "#251839",
  line: "rgba(255,255,255,0.10)",
  accent: "#F1C27D",
  warning: "#FF8A5B"
};

module.exports = {
  APP_NAME_CN: "今日人设签",
  APP_NAME_EN: "Vibe Card",
  YEARS,
  HOURS,
  LOCATIONS,
  PALETTE
};
