const fs = require("fs");
const path = require("path");
const express = require("express");
const dotenv = require("dotenv");

const rootDir = path.resolve(__dirname, "..");
const localEnvPath = path.join(rootDir, ".env.local");
const backendEnvPath = path.join(__dirname, ".env");
const manifestPath = path.join(rootDir, "assets", "audio", "manifest.json");

dotenv.config({ path: localEnvPath });
dotenv.config({ path: backendEnvPath });

const app = express();
const port = Number(process.env.PORT || 8787);

app.use(express.json({ limit: "512kb" }));
app.use("/assets", express.static(path.join(rootDir, "assets")));

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "crazy-abyss-tools",
    appName: "疯狂深渊",
    minimaxConfigured: Boolean(resolveMiniMaxKey()),
    audioManifestExists: fs.existsSync(manifestPath)
  });
});

app.get("/api/game-config", (_req, res) => {
  res.json({
    appName: "疯狂深渊",
    appNameEn: "Cthulhu Pixel Roguelike",
    appid: "ttf41382ae6a74c90b02",
    audioManifestPath: "assets/audio/manifest.json",
    minimaxConfigured: Boolean(resolveMiniMaxKey())
  });
});

app.get("/api/audio-manifest", (_req, res) => {
  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    res.json({
      success: true,
      manifest
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: `音频清单读取失败: ${error.message}`
    });
  }
});

app.listen(port, () => {
  console.log(`crazy-abyss tools listening on http://127.0.0.1:${port}`);
});

function resolveMiniMaxKey() {
  return process.env.MINIMAX_API_KEY || process.env.LLM_API_KEY || "";
}
