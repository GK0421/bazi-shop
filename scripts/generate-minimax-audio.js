const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

const rootDir = path.resolve(__dirname, "..");
const localEnvPath = path.join(rootDir, ".env.local");
const manifestPath = path.join(rootDir, "assets", "audio", "manifest.json");

dotenv.config({ path: localEnvPath });

const apiKey = process.env.MINIMAX_API_KEY || process.env.LLM_API_KEY || "";
const model = process.env.MINIMAX_MUSIC_MODEL || "music-2.6";
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const selectedIds = process.argv.slice(2);
const outputDir = path.join(rootDir, manifest.outputDir);

async function main() {
  if (!apiKey) {
    throw new Error("Missing MINIMAX_API_KEY in .env.local or process environment.");
  }

  ensureDir(outputDir);

  const entries = manifest.entries.filter((entry) => {
    if (entry.provider !== "music") {
      return false;
    }
    if (!selectedIds.length) {
      return true;
    }
    return selectedIds.indexOf(entry.id) >= 0;
  });

  if (!entries.length) {
    console.log("No matching music entries to generate.");
    return;
  }

  for (let i = 0; i < entries.length; i += 1) {
    const entry = entries[i];
    console.log(`Generating ${entry.id} -> ${entry.output}`);
    const audioBuffer = await generateMusic(entry);
    const outputPath = path.join(outputDir, entry.output);
    fs.writeFileSync(outputPath, audioBuffer);
    console.log(`Saved ${outputPath}`);
  }
}

async function generateMusic(entry) {
  const payload = {
    model,
    prompt: entry.prompt,
    stream: false,
    output_format: "hex",
    audio_setting: {
      sample_rate: 44100,
      bitrate: 256000,
      format: entry.format || "mp3"
    },
    is_instrumental: entry.mode === "instrumental"
  };

  const response = await fetch("https://api.minimax.io/v1/music_generation", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  if (data && data.base_resp && Number(data.base_resp.status_code) !== 0) {
    throw new Error(`MiniMax music generation failed for ${entry.id}: ${data.base_resp.status_msg}`);
  }

  if (!response.ok) {
    const message = data && data.base_resp && data.base_resp.status_msg
      ? data.base_resp.status_msg
      : `HTTP ${response.status}`;
    throw new Error(`MiniMax music generation failed for ${entry.id}: ${message}`);
  }

  if (!data || !data.data || !data.data.audio) {
    throw new Error(`MiniMax did not return audio for ${entry.id}.`);
  }

  return Buffer.from(data.data.audio, "hex");
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
