const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const oldMiniMaxUrl = 'https://api.' + 'minimax.chat/v1';
const secretToken = 'sk' + '-';
const sensitiveNames = [
  'TENCENTCLOUD_' + 'SECRET',
  'SECRET' + 'KEY',
  'SESSION' + 'TOKEN'
];
const mojibakeMarkers = [
  '鍏',
  '鏆',
  '璇',
  '浜',
  '涓',
  '鐢',
  '闃',
  '濉',
  '鎻',
  '鍑',
  '鏂',
  '骞',
  '澹',
  '濞'
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

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
}

function readText(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function collectFiles(relativePath, predicate) {
  const fullPath = path.join(root, relativePath);
  if (!fs.existsSync(fullPath)) return [];

  const stat = fs.statSync(fullPath);
  if (stat.isFile()) {
    return predicate(fullPath) ? [fullPath] : [];
  }

  return fs.readdirSync(fullPath).flatMap((name) => {
    return collectFiles(path.join(relativePath, name), predicate);
  });
}

check('project.config.json存在', () => exists('project.config.json'));

check('project.config.json路径正确', () => {
  const config = readJson('project.config.json');
  if (config.miniprogramRoot !== 'miniprogram/') return 'miniprogramRoot应为miniprogram/';
  if (config.cloudfunctionRoot !== 'cloudfunctions/') return 'cloudfunctionRoot应为cloudfunctions/';
  return true;
});

check('miniprogram/app.json存在', () => exists('miniprogram/app.json'));

check('app.json页面配置完整', () => {
  const appJson = readJson('miniprogram/app.json');
  const requiredPages = [
    'pages/index/index',
    'pages/form/form',
    'pages/result/result',
    'pages/about/about'
  ];
  const pages = Array.isArray(appJson.pages) ? appJson.pages : [];

  for (const page of requiredPages) {
    if (!pages.includes(page)) return `缺少${page}`;
  }

  return true;
});

check('app.json中所有页面文件存在', () => {
  const appJson = readJson('miniprogram/app.json');
  const pages = Array.isArray(appJson.pages) ? appJson.pages : [];

  for (const page of pages) {
    for (const ext of ['js', 'json', 'wxml', 'wxss']) {
      const file = `miniprogram/${page}.${ext}`;
      if (!exists(file)) return `缺少${file}`;
    }
  }

  return true;
});

check('cloudfunctions/analyzeBazi/index.js存在', () => exists('cloudfunctions/analyzeBazi/index.js'));

check('analyzeBazi不含Hello World', () => {
  const content = readText('cloudfunctions/analyzeBazi/index.js');
  return !content.includes('Hello World') || '发现Hello World';
});

check('不含旧MiniMax地址', () => {
  const files = [
    'README.md',
    ...collectFiles('docs', (file) => file.endsWith('.md')),
    ...collectFiles('cloudfunctions', (file) => file.endsWith('.js')),
    ...collectFiles('miniprogram', (file) => file.endsWith('.js'))
  ];

  for (const file of files) {
    if (fs.readFileSync(file, 'utf8').includes(oldMiniMaxUrl)) {
      return path.relative(root, file);
    }
  }

  return true;
});

check('不含明文密钥或云密钥标记', () => {
  const files = [
    'README.md',
    ...collectFiles('docs', (file) => file.endsWith('.md')),
    ...collectFiles('cloudfunctions', (file) => file.endsWith('.js')),
    ...collectFiles('miniprogram', (file) => file.endsWith('.js'))
  ];

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes(secretToken)) return path.relative(root, file);

    for (const name of sensitiveNames) {
      if (content.includes(name)) return path.relative(root, file);
    }
  }

  return true;
});

check('不含process.env全量打印', () => {
  const content = readText('cloudfunctions/analyzeBazi/index.js');
  return !/console\.(log|info|warn|error)\s*\(\s*process\.env\s*\)/.test(content) || '发现process.env打印';
});

check('不含console.log(context)', () => {
  const content = readText('cloudfunctions/analyzeBazi/index.js');
  return !/console\.log\s*\(\s*context\s*\)/.test(content) || '发现context打印';
});

check('小程序WXML标签未损坏', () => {
  const files = collectFiles('miniprogram', (file) => file.endsWith('.wxml'));

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    if (/\?\s*\/(view|text|button|label|radio|picker)>/.test(content)) {
      return path.relative(root, file);
    }
  }

  return true;
});

check('小程序与云函数文案未乱码', () => {
  const files = [
    ...collectFiles('miniprogram', (file) => /\.(js|wxml|json)$/.test(file)),
    ...collectFiles('cloudfunctions', (file) => file.endsWith('.js'))
  ];

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    for (const marker of mojibakeMarkers) {
      if (content.includes(marker)) return path.relative(root, file);
    }
  }

  return true;
});

if (failed > 0) {
  console.error(`\n${failed} check(s) failed.`);
  process.exit(1);
}

console.log('\nAll checks passed.');
