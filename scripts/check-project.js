const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const oldMiniMaxUrl = 'https://api.' + 'minimax.chat/v1';
const secretToken = 'sk' + '-';
const llmApiKeyAssignment = 'LLM_API_KEY' + '=';
const sampleText = 'Hello ' + 'World';
const sensitiveNames = [
  'TENCENTCLOUD_' + 'SECRET',
  'SECRET' + 'KEY',
  'SESSION' + 'TOKEN'
];
const riskyPhrases = [
  '算' + '命',
  '算' + '命大师',
  '改' + '运',
  '发' + '财',
  '灾' + '祸',
  '死' + '亡',
  '疾' + '病',
  '姻' + '缘必成',
  '精准' + '预测',
  '改变' + '命运',
  '转' + '运',
  '开' + '运',
  '破解' + '灾厄',
  '趋吉' + '避凶',
  '投资' + '建议',
  '医疗' + '建议'
];

let failed = 0;

function pass(name) {
  console.log(`PASS ${name}`);
}

function fail(name, detail) {
  failed += 1;
  console.error(`FAIL ${name}${detail ? ` - ${detail}` : ''}`);
}

function check(name, fn) {
  try {
    const detail = fn();
    if (detail === true || detail === undefined) {
      pass(name);
    } else {
      fail(name, detail || '');
    }
  } catch (error) {
    fail(name, error.message);
  }
}

function fullPath(relativePath) {
  return path.join(root, relativePath);
}

function relativePath(file) {
  return path.relative(root, file).replace(/\\/g, '/');
}

function exists(relativePath) {
  return fs.existsSync(fullPath(relativePath));
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(fullPath(relativePath), 'utf8'));
}

function readText(relativePath) {
  return fs.readFileSync(fullPath(relativePath), 'utf8');
}

function collectFiles(relativePath, predicate) {
  const start = fullPath(relativePath);
  if (!fs.existsSync(start)) return [];

  const stat = fs.statSync(start);
  if (stat.isFile()) {
    return predicate(start) ? [start] : [];
  }

  return fs.readdirSync(start).flatMap((name) => {
    return collectFiles(path.join(relativePath, name), predicate);
  });
}

function projectFiles() {
  return [
    'project.config.json',
    'README.md',
    ...collectFiles('docs', (file) => file.endsWith('.md')).map(relativePath),
    ...collectFiles('scripts', (file) => file.endsWith('.js')).map(relativePath),
    ...collectFiles('cloudfunctions', (file) => /\.(js|json)$/.test(file)).map(relativePath),
    ...collectFiles('miniprogram', (file) => /\.(js|json|wxml|wxss)$/.test(file)).map(relativePath)
  ].filter((file) => exists(file));
}

function scanFiles(files, matcher) {
  for (const file of files) {
    const content = readText(file);
    const found = matcher(content, file);
    if (found) return found;
  }

  return null;
}

check('project.config.json exists', () => exists('project.config.json'));

check('project config is usable by WeChat DevTools', () => {
  const config = readJson('project.config.json');
  if (config.miniprogramRoot !== 'miniprogram/') return 'miniprogramRoot must be miniprogram/';
  if (config.cloudfunctionRoot !== 'cloudfunctions/') return 'cloudfunctionRoot must be cloudfunctions/';
  if (config.compileType !== 'miniprogram') return 'compileType must be miniprogram';
  return true;
});

check('miniprogram/app.json exists', () => exists('miniprogram/app.json'));

check('required pages are registered', () => {
  const appJson = readJson('miniprogram/app.json');
  const pages = Array.isArray(appJson.pages) ? appJson.pages : [];
  const requiredPages = [
    'pages/index/index',
    'pages/form/form',
    'pages/result/result',
    'pages/about/about'
  ];

  for (const page of requiredPages) {
    if (!pages.includes(page)) return `missing ${page}`;
  }

  return true;
});

check('all registered page files exist', () => {
  const appJson = readJson('miniprogram/app.json');
  const pages = Array.isArray(appJson.pages) ? appJson.pages : [];

  for (const page of pages) {
    for (const ext of ['js', 'json', 'wxml', 'wxss']) {
      const file = `miniprogram/${page}.${ext}`;
      if (!exists(file)) return `missing ${file}`;
    }
  }

  return true;
});

check('analyzeBazi cloud function exists', () => exists('cloudfunctions/analyzeBazi/index.js'));

check('analyzeBazi is not the default sample', () => {
  const content = readText('cloudfunctions/analyzeBazi/index.js');
  return !content.includes(sampleText) || 'contains default sample text';
});

check('generateAudio cloud function exists', () => {
  if (!exists('cloudfunctions/generateAudio/index.js')) return 'missing index.js';
  if (!exists('cloudfunctions/generateAudio/package.json')) return 'missing package.json';
  return true;
});

check('generateAudio reads required environment variables', () => {
  const content = readText('cloudfunctions/generateAudio/index.js');
  for (const name of ['LLM_PROVIDER', 'LLM_BASE_URL', 'LLM_API_KEY', 'TTS_MODEL']) {
    if (!content.includes(name)) return `missing ${name}`;
  }

  return true;
});

check('result page has audio summary entry', () => {
  const js = readText('miniprogram/pages/result/result.js');
  const wxml = readText('miniprogram/pages/result/result.wxml');
  if (!js.includes("name: 'generateAudio'")) return 'result page does not call generateAudio';
  if (!js.includes('createInnerAudioContext')) return 'result page does not play audio';
  if (!wxml.includes('听听文化摘要')) return 'missing audio button text';
  if (!js.includes('语音摘要生成失败，请稍后重试')) return 'missing required failure message';
  return true;
});

check('result flow does not persist user birth info locally', () => {
  const files = [
    'miniprogram/pages/form/form.js',
    'miniprogram/pages/result/result.js'
  ];
  const found = scanFiles(files, (content, file) => {
    if (content.includes("wx.setStorageSync('latestBaziResult'")) return file;
    if (content.includes('wx.setStorageSync("latestBaziResult"')) return file;
    if (content.includes("wx.getStorageSync('latestBaziResult'")) return file;
    if (content.includes('wx.getStorageSync("latestBaziResult"')) return file;
    return null;
  });

  return !found || `persistent latestBaziResult usage in ${found}`;
});

check('project has no old MiniMax URL', () => {
  const found = scanFiles(projectFiles(), (content, file) => {
    return content.includes(oldMiniMaxUrl) ? file : null;
  });

  return !found || found;
});

check('project has no committed secret markers', () => {
  const found = scanFiles(projectFiles(), (content, file) => {
    if (content.includes(secretToken)) return file;
    if (content.includes(llmApiKeyAssignment)) return file;
    for (const name of sensitiveNames) {
      if (content.includes(name)) return file;
    }
    return null;
  });

  return !found || found;
});

check('cloud functions do not print env or context', () => {
  const files = collectFiles('cloudfunctions', (file) => file.endsWith('.js')).map(relativePath);
  const found = scanFiles(files, (content, file) => {
    if (/console\.(log|info|warn|error)\s*\(\s*process\.env\s*\)/.test(content)) return file;
    if (/console\.log\s*\(\s*context\s*\)/.test(content)) return file;
    return null;
  });

  return !found || found;
});

check('mini program and cloud copy avoid high-risk phrases', () => {
  const files = [
    ...collectFiles('miniprogram', (file) => /\.(js|json|wxml)$/.test(file)).map(relativePath),
    ...collectFiles('cloudfunctions', (file) => file.endsWith('.js')).map(relativePath)
  ];
  const found = scanFiles(files, (content, file) => {
    for (const phrase of riskyPhrases) {
      if (content.includes(phrase)) return `${file} contains ${phrase}`;
    }
    return null;
  });

  return !found || found;
});

if (failed > 0) {
  console.error(`\n${failed} check(s) failed.`);
  process.exit(1);
}

console.log('\nAll checks passed.');
