#!/usr/bin/env node
/**
 * check-project.js
 * 轻量项目完整性 + 安全检查脚本
 * 运行：node scripts/check-project.js
 * 退出码：0 = 全部通过，1 = 存在问题
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

let exitCode = 0;
const results = [];

function check(name, fn) {
  try {
    const ok = fn();
    results.push({ name, ok });
    if (!ok) exitCode = 1;
  } catch (e) {
    results.push({ name, ok: false, error: e.message });
    exitCode = 1;
  }
}

function fail(name, detail) {
  results.push({ name, ok: false, detail });
  exitCode = 1;
}

// ── 1. app.json 页面路径存在性 ───────────────────────────────────────────────
check('app.json 存在', () => fs.existsSync(path.join(ROOT, 'miniprogram/app.json')));

const appJson = JSON.parse(fs.readFileSync(path.join(ROOT, 'miniprogram/app.json'), 'utf8'));
const expectedPages = appJson.pages || [];
check('app.json pages 数组非空', () => expectedPages.length > 0);

for (const pagePath of expectedPages) {
  const jsFile   = path.join(ROOT, 'miniprogram', pagePath + '.js');
  const jsonFile = path.join(ROOT, 'miniprogram', pagePath + '.json');
  const wxmlFile = path.join(ROOT, 'miniprogram', pagePath + '.wxml');
  const wxssFile = path.join(ROOT, 'miniprogram', pagePath + '.wxss');
  check(`页面存在: ${pagePath}`,  () => fs.existsSync(jsFile));
  check(`页面配置: ${pagePath}`,  () => fs.existsSync(jsonFile));
  check(`页面模板: ${pagePath}`,  () => fs.existsSync(wxmlFile));
  check(`页面样式: ${pagePath}`,  () => fs.existsSync(wxssFile));
}

// ── 2. 云函数文件存在 ────────────────────────────────────────────────────────
const cfRoot = path.join(ROOT, 'cloudfunctions/analyzeBazi');
check('cloudfunctions/analyzeBazi/index.js 存在',     () => fs.existsSync(path.join(cfRoot, 'index.js')));
check('cloudfunctions/analyzeBazi/package.json 存在',  () => fs.existsSync(path.join(cfRoot, 'package.json')));

// ── 3. 密钥泄露检查（跳过 scripts/ 和 .git/）────────────────────────────────
const SKIP_DIRS = ['.git', 'node_modules'];
const JS_FILES  = [];
function findJs(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) findJs(full);
    else if (entry.name.endsWith('.js')) JS_FILES.push(full);
  }
}
findJs(ROOT);

for (const file of JS_FILES) {
  const rel = path.relative(ROOT, file);
  // Skip this script itself and any test mocks
  if (rel.startsWith('scripts' + path.sep)) continue;
  const content = fs.readFileSync(file, 'utf8');
  if (/sk-[A-Za-z0-9]{20,}/.test(content)) {
    fail(`[SECURITY] sk- found in ${rel}`);
  }
  if (/TENCENTCLOUD_SECRET/.test(content)) {
    fail(`[SECURITY] TENCENTCLOUD_SECRET in ${rel}`);
  }
}

// ── 4. .gitignore 检查 ───────────────────────────────────────────────────────
const giContent = fs.readFileSync(path.join(ROOT, '.gitignore'), 'utf8');
check('.gitignore 包含 .env',                    () => giContent.includes('.env'));
check('.gitignore 包含 project.private.config',   () => giContent.includes('project.private.config'));

// ── 5. 云函数安全检查 ─────────────────────────────────────────────────────────
const cfIndex  = path.join(cfRoot, 'index.js');
const cfContent = fs.readFileSync(cfIndex, 'utf8');
check('云函数不打印 process.env',   () => !cfContent.includes('console.log(process.env'));
check('云函数不打印 API Key',        () => !cfContent.includes('console.log(config.apiKey'));
check('云函数不打印 context 对象',   () => !cfContent.includes('console.log(context)'));

// ── 6. app.js 有 wx.cloud.init ────────────────────────────────────────────────
const appJsContent = fs.readFileSync(path.join(ROOT, 'miniprogram/app.js'), 'utf8');
check('app.js 包含 wx.cloud.init',  () => appJsContent.includes('wx.cloud.init'));

// ── 7. components 存在 ────────────────────────────────────────────────────────
check('components/disclaimer 存在',   () => fs.existsSync(path.join(ROOT, 'miniprogram/components/disclaimer/index.js')));
check('components/report-card 存在',  () => fs.existsSync(path.join(ROOT, 'miniprogram/components/report-card/index.js')));

// ── 8. project.config.json 合规 ─────────────────────────────────────────────
const projConfig = JSON.parse(fs.readFileSync(path.join(ROOT, 'project.config.json'), 'utf8'));
check('project.config.json appid 不是真实ID', () =>
  projConfig.appid === 'touristappid' || projConfig.appid.startsWith('tourist'));

// ── 输出结果 ───────────────────────────────────────────────────────────────────
console.log('\n=== check-project.js results ===\n');
for (const r of results) {
  const icon = r.ok ? 'PASS' : 'FAIL';
  console.log(`[${icon}] ${r.name}${r.detail ? ' -- ' + r.detail : ''}`);
}
const passed = results.filter(r => r.ok).length;
const failed = results.filter(r => !r.ok).length;
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(exitCode);
