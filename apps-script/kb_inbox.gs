/**
 * 知识库入库收件箱（Apps Script）—— 通用版，各知识库粘贴同一份代码
 * 各库的差异（库名、分区上限、是否查YAML、是否做A级检查、子文件夹名等）不写在代码里，
 * 从主文件夹根目录的配置文件「_收件箱配置.json」（或英文名「_inbox.json」）读取，手工维护。
 * 配置键可全用中文或全用英文（对照见 CONFIG_KEYS）；子文件夹名、日志文件名、旧版后缀与快照前缀为可选字段，
 * 不填时取 DEFAULT_NAMES 中的默认值。下文以默认名称说明。
 *
 * 首次部署（每个库一个独立的 Apps Script 项目，不要多个库共用）：
 *   1. 粘贴本文件全部内容，把下方 MAIN_FOLDER_ID 填为本库主文件夹ID
 *   2. 运行 setup()：保存主文件夹ID、读配置、补建子文件夹、跑 selfTest、预演一次
 *   3. 核对执行日志无误后运行 enableAutoRun()：允许正式执行并安装定时触发器
 * 以后更新代码：整份粘贴覆盖即可，MAIN_FOLDER_ID 留空也照常运行（已存在脚本属性里），无须再运行 setup()。
 *
 * 把 kb-incremental 产出的交付 zip 原样上传到「入库收件箱」，本脚本负责：
 *   1. 解压：根目录 .md → 主文件夹；实体/*.md → 主文件夹下实体子文件夹；README.txt 不入库，随 zip 一起归档
 *   2. 归档同名旧版：与 kb-incremental 归档模式一致，旧份移入「归档」并改名为「主名_旧YYYYMMDDHHMMSS.md」
 *   3. 收尾：处理完的 zip 改名后移入「归档」；异常 zip 移入「入库收件箱/异常」，不做任何改动
 *   分区：根目录只收 00_ 至「分区上限」_ 开头的 .md；「议题区起始」之前为汇总文件，之后为议题文件
 *
 * 入口函数：
 *   setup()            首次部署或配置变更后运行：保存主文件夹ID、读配置、补建文件夹、自检、预演；不改知识文件
 *   preview()          只读预演：列出每个 zip 将新建、跳过（内容相同）、归档哪些文件，不改任何文件
 *   enableAutoRun()    允许正式执行，并按配置的间隔安装定时触发器
 *   disableAutoRun()   停止正式执行并删除定时触发器
 *   run()              手动执行一次（须先 enableAutoRun）
 *   selfTest()         只跑纯逻辑校验用例（文件名白名单、YAML检查、A级检查），不读写知识文件
 *   showStatus()       打印当前主文件夹、配置、触发器状态
 *
 * 安全规则：
 *   - 一个 zip 内只要有一个条目不合规（路径、文件名、编码），整个 zip 不处理，移入「异常」
 *   - 先新建、后归档：中途出错时最坏结果是主文件夹出现同名两份，可用 skill 的归档模式收拾
 *   - 与库内同名文件内容逐字节相同时跳过上传，因此同一个 zip 重复投放是安全的
 *   - 配置「检查A级信息」为 true 时，正文含疑似未遮挡的证件号、16至19位连续卡号/账号、分段卡号即整包拒收；
 *     拒收原因、日志、邮件只写文件名、行号和类别，不写号码原文。误报时（如长订单号）可临时在配置中关闭
 *   - 配置文件缺失、重复或字段不合法时一律停止，不按猜测的默认值处理
 *   - 日志：执行日志 + 追加到 归档/_入库收件箱日志.log；可选邮件通知；时间按项目设置的时区
 *     收件箱为空的定时检查只写执行日志，不改写日志文件（避免每次触发都产生 Drive 修订）
 */

// 首次部署填一次本库主文件夹ID；运行 setup() 后会保存到脚本属性，以后粘贴新代码时此处留空即可
const MAIN_FOLDER_ID = '';

// 各库相同的固定约定（不放进配置文件）
const FIXED = {
  // 主文件夹根目录，按顺序查找，只能有一份；下划线开头，skill 检索时按运行文件排除
  CONFIG_FILE_NAMES: ['_收件箱配置.json', '_inbox.json'],
  BATCH_SECONDS: 270,
  LOG_LEVEL: 'DEBUG'                      // DEBUG 时逐文件校验记录也写入日志文件（不进邮件）
};

const PROP_MAIN_ID = 'MAIN_FOLDER_ID';
const PROP_RUN_ENABLED = 'RUN_ENABLED';

// 运行时由 loadConfig_ 填入，字段见 CONFIG_SCHEMA
let CFG = null;

// ====================== 日志 ======================

const LEVELS = { DEBUG: 10, INFO: 20, WARN: 30, ERROR: 40 };
let LOG_BUFFER = [];
let MAIL_LINES = [];

// 时间（日志、归档后缀、zip 改名）按 Apps Script 项目设置的时区（项目设置 → 时区，即 appsscript.json 的 timeZone）
function fmtTime_(d, p) { return Utilities.formatDate(d, Session.getScriptTimeZone(), p); }

function log_(level, msg) {
  if (LEVELS[level] < LEVELS[FIXED.LOG_LEVEL]) return;
  const line = `${fmtTime_(new Date(), 'yyyy-MM-dd HH:mm:ss')} [${level}] ${msg}`;
  console.log(line);
  LOG_BUFFER.push(line);
  if (LEVELS[level] >= LEVELS.INFO) MAIL_LINES.push(line);
}

function flushLog_(archive) {
  if (!LOG_BUFFER.length) return;
  const add = LOG_BUFFER.join('\n') + '\n';
  try {
    const it = archive.getFilesByName(CFG.log_file);
    if (it.hasNext()) {
      const f = it.next();
      f.setContent(f.getBlob().getDataAsString('UTF-8') + add);
    } else {
      archive.createFile(CFG.log_file, add, 'text/plain');
    }
  } catch (e) {
    console.log('写日志文件失败：' + e.message);
  }
  LOG_BUFFER = [];
}

// ====================== 配置 ======================

const isName_ = v => typeof v === 'string' && v.trim().length > 0 && v.indexOf('/') < 0;

/**
 * 配置文件字段：内部键（英文）→ 中文键｜是否必填｜校验。
 * 一份配置的键全用中文或全用英文；内部统一换成英文键，后面的代码只认英文键。
 */
const CONFIG_KEYS = {
  version:          { zh: '配置版本',     required: true,  ok: v => v === 1 },
  library:          { zh: '库名',         required: true,  ok: v => typeof v === 'string' && v.trim().length > 0 },
  partition_max:    { zh: '分区上限',     required: true,  ok: v => Number.isInteger(v) && v >= 2 && v <= 99 },
  topic_start:      { zh: '议题区起始',   required: true,  ok: v => Number.isInteger(v) && v >= 0 && v <= 99 },
  check_yaml:       { zh: '检查YAML',     required: true,  ok: v => typeof v === 'boolean' },
  check_sensitive:  { zh: '检查A级信息',  required: true,  ok: v => typeof v === 'boolean' },
  entities_dir:     { zh: '实体文件夹',   required: true,  ok: isName_ },
  mail:             { zh: '邮件通知',     required: true,  ok: v => typeof v === 'boolean' },
  interval_minutes: { zh: '触发间隔分钟', required: true,  ok: v => [1, 5, 10, 15, 30].indexOf(v) >= 0 },
  archive_dir:      { zh: '归档文件夹',   required: false, ok: isName_ },
  inbox_dir:        { zh: '收件箱文件夹', required: false, ok: isName_ },
  error_dir:        { zh: '异常文件夹',   required: false, ok: isName_ },
  log_file:         { zh: '日志文件',     required: false, ok: isName_ },
  old_suffix:       { zh: '旧版后缀',     required: false, ok: isName_ },
  snapshot_prefix:  { zh: '快照前缀',     required: false, ok: isName_ }
};

/** 可选字段不填时的取值（与 kb-incremental 中文预设一致） */
const DEFAULT_NAMES = {
  archive_dir: '归档',
  inbox_dir: '入库收件箱',
  error_dir: '异常',              // 在收件箱文件夹下
  log_file: '_入库收件箱日志.log', // 写在归档文件夹下
  old_suffix: '_旧',
  snapshot_prefix: '快照_'
};

/**
 * 校验配置对象并换成英文键。返回 {cfg, errs}，errs 为空时 cfg 可用（已补默认值）。
 * 纯逻辑，selfTest 可直接调用。
 */
function parseConfig_(obj) {
  const errs = [];
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return { cfg: null, errs: ['配置文件内容不是一个 JSON 对象'] };
  const byZh = {};
  Object.keys(CONFIG_KEYS).forEach(k => { byZh[CONFIG_KEYS[k].zh] = k; });
  const keys = Object.keys(obj);
  const zhKeys = keys.filter(k => k in byZh), enKeys = keys.filter(k => k in CONFIG_KEYS);
  keys.forEach(k => { if (!(k in byZh) && !(k in CONFIG_KEYS)) errs.push(`未知字段「${k}」（拼写错误？）`); });
  if (zhKeys.length && enKeys.length) {
    errs.push(`键名中英混写（中文：${zhKeys.join('、')}；英文：${enKeys.join(', ')}），请统一用一种`);
    return { cfg: null, errs };
  }
  const zh = zhKeys.length > 0;
  const cfg = {};
  Object.keys(CONFIG_KEYS).forEach(k => {
    const d = CONFIG_KEYS[k], name = zh ? d.zh : k;
    if (!(name in obj)) {
      if (d.required) errs.push(`缺少字段「${name}」`);
      else cfg[k] = DEFAULT_NAMES[k];
    } else if (!d.ok(obj[name])) errs.push(`字段「${name}」取值不合法：${JSON.stringify(obj[name])}`);
    else cfg[k] = obj[name];
  });
  if (!errs.length && cfg.topic_start > cfg.partition_max) {
    errs.push(`「${zh ? '议题区起始' : 'topic_start'}」不能大于「${zh ? '分区上限' : 'partition_max'}」`);
  }
  return { cfg: errs.length ? null : cfg, errs };
}

/** 从主文件夹读配置文件并写入 CFG；缺失、重复、不合法时抛错 */
function loadConfig_(main) {
  const found = [];
  FIXED.CONFIG_FILE_NAMES.forEach(n => liveFilesByName_(main, n).forEach(f => found.push({ n, f })));
  const names = FIXED.CONFIG_FILE_NAMES.join(' 或 ');
  if (!found.length) {
    throw new Error(`主文件夹下未找到 ${names}。请按 README「收件箱配置文件」一节新建配置文件，再运行 setup()`);
  }
  if (found.length > 1) {
    throw new Error(`主文件夹下有 ${found.length} 份配置文件（${found.map(x => x.n).join('、')}），请只保留一份（旧份移入归档文件夹）`);
  }
  const fname = found[0].n;
  let obj;
  const text = found[0].f.getBlob().getDataAsString('UTF-8').replace(/^﻿/, '');
  try { obj = JSON.parse(text); }
  catch (e) { throw new Error(`${fname} 不是合法的 JSON：${e.message}`); }
  const r = parseConfig_(obj);
  if (r.errs.length) throw new Error(`${fname} 有误：${r.errs.join('；')}`);
  CFG = r.cfg;
  log_('DEBUG', `配置文件：${fname}`);
  return r.cfg;
}

function describeConfig_(c) {
  const p = n => (n < 10 ? '0' : '') + n;
  return `库名=${c.library}｜根目录 00_至${p(c.partition_max)}_｜议题区 ${p(c.topic_start)}至${p(c.partition_max)}` +
    `｜YAML检查=${c.check_yaml ? '开' : '关'}｜A级检查=${c.check_sensitive ? '开' : '关'}` +
    `｜实体文件夹=${c.entities_dir}｜邮件=${c.mail ? '开' : '关'}｜间隔=${c.interval_minutes}分钟` +
    `｜归档=${c.archive_dir}｜收件箱=${c.inbox_dir}/${c.error_dir}｜日志=${c.log_file}｜旧版后缀=${c.old_suffix}｜快照前缀=${c.snapshot_prefix}`;
}

// ====================== 纯逻辑 ======================

const reEsc_ = t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** 不应交付的文件名：含旧版后缀、以快照前缀或下划线开头 */
function isBadName_(n) {
  return new RegExp(`(${reEsc_(CFG.old_suffix)}|^${reEsc_(CFG.snapshot_prefix)}|^_)`).test(n);
}
const ZONE_FILE_RE = /^(\d{2})_[^/]+\.md$/;  // 恰好两位分区号；1_x.md、100_x.md 不匹配
const YAML_HEAD_RE = /^﻿?---\r?\n/;

function pad2_(n) { return (n < 10 ? '0' : '') + n; }

/** 根目录文件名的分区号（0 至 分区上限），不在白名单内返回 null */
function zoneOf_(name) {
  const m = ZONE_FILE_RE.exec(name);
  if (!m) return null;
  const z = Number(m[1]);
  return z <= CFG.partition_max ? z : null;
}

function zoneLabel_(z) { return `${pad2_(z)}区${z < CFG.topic_start ? '汇总文件' : '议题文件'}`; }

/** 是否须有 YAML 属性区：只针对根目录议题区文件 */
function needsYaml_(dest, name) {
  if (dest !== 'main') return false;
  const z = zoneOf_(name);
  return z !== null && z >= CFG.topic_start;
}

/**
 * 把 zip 条目路径归类。返回 {dest:'main'|'entity'|'readme'|'dir'|'junk'|null, name, rule, reason}
 * 允许整包多套一层外壳目录（如 xxx/01_文件名索引.md），由 stripPrefix 去掉。
 */
function classifyEntry_(path, stripPrefix) {
  let p = path.replace(/\\/g, '/');
  if (stripPrefix && p.startsWith(stripPrefix)) p = p.slice(stripPrefix.length);
  if (!p || p.endsWith('/')) return { dest: 'dir', name: p };
  if (p.indexOf('�') >= 0) return { dest: null, name: p, rule: '文件名编码', reason: '文件名乱码（zip未用UTF-8存文件名）' };
  if (/(^|\/)(__MACOSX|\.DS_Store)/.test(p) || /(^|\/)\._/.test(p)) return { dest: 'junk', name: p };
  const parts = p.split('/');
  if (parts.length === 1) {
    const n = parts[0];
    if (n === 'README.txt') return { dest: 'readme', name: n, rule: 'README.txt' };
    if (isBadName_(n)) return { dest: null, name: n, rule: '文件名黑名单', reason: `不应交付的文件名（含${CFG.old_suffix}、以${CFG.snapshot_prefix}或_开头）` };
    const z = zoneOf_(n);
    if (z !== null) return { dest: 'main', name: n, rule: `根目录白名单：${zoneLabel_(z)}` };
    return { dest: null, name: n, rule: '根目录白名单', reason: `根目录只允许 00_至${pad2_(CFG.partition_max)}_开头的.md 与 README.txt` };
  }
  if (parts.length === 2 && parts[0] === CFG.entities_dir) {
    const n = parts[1];
    if (isBadName_(n)) return { dest: null, name: p, rule: '文件名黑名单', reason: '不应交付的文件名' };
    if (/\.md$/.test(n)) return { dest: 'entity', name: n, rule: '实体页' };
    return { dest: null, name: p, rule: '实体子目录', reason: `${CFG.entities_dir}/ 下只允许 .md` };
  }
  return { dest: null, name: p, rule: '目录结构', reason: '不允许的子目录' };
}

/** 若所有条目共享同一个外壳目录（且不是实体文件夹），返回该前缀，否则返回 '' */
function commonPrefix_(paths) {
  const tops = new Set(paths.filter(p => p).map(p => p.replace(/\\/g, '/').split('/')[0]));
  const allNested = paths.every(p => p.replace(/\\/g, '/').indexOf('/') > 0 || p.endsWith('/'));
  if (tops.size === 1 && allNested) {
    const t = [...tops][0];
    if (t !== CFG.entities_dir) return t + '/';
  }
  return '';
}

/**
 * 查找疑似未遮挡的A级信息。只返回「第N行：类别」，不返回号码原文。
 * 已遮挡的写法（如 ************1234）不含长串数字，不会命中。
 */
const A_LEVEL_RULES = [
  { re: /(?<![0-9A-Za-z])\d{17}[\dXx](?![0-9A-Za-z])/, kind: '疑似18位证件号' },
  { re: /(?<!\d)\d{16,19}(?!\d)/, kind: '疑似16至19位卡号/账号' },
  { re: /(?<!\d)\d{4}(?:[ -]\d{4}){3}(?:[ -]?\d{1,3})?(?!\d)/, kind: '疑似分段书写的卡号' }
];

function findALevel_(text) {
  const hits = [];
  text.split(/\r?\n/).forEach((line, i) => {
    for (const r of A_LEVEL_RULES) {
      if (r.re.test(line)) { hits.push(`第${i + 1}行：${r.kind}`); break; }
    }
  });
  return hits;
}

function archiveName_(name, stamp, n) {
  const base = name.replace(/\.md$/i, '');
  return `${base}${CFG.old_suffix}${stamp}${n > 1 ? '_' + n : ''}.md`;
}

function md5_(bytes) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, bytes)
    .map(b => ('0' + ((b + 256) % 256).toString(16)).slice(-2)).join('');
}

// ====================== Drive 辅助 ======================

/** 主文件夹ID：代码顶部填写的优先，其次脚本属性 */
function mainFolderId_() {
  const id = (MAIN_FOLDER_ID || '').trim() || PropertiesService.getScriptProperties().getProperty(PROP_MAIN_ID);
  if (!id) throw new Error('未配置主文件夹ID：请在代码顶部填写 MAIN_FOLDER_ID 后运行 setup()');
  return id;
}

function subFolder_(parent, name, create) {
  const it = parent.getFoldersByName(name);
  if (it.hasNext()) {
    const f = it.next();
    if (it.hasNext()) log_('WARN', `${parent.getName()} 下有多个「${name}」文件夹，使用第一个（id=${f.getId()}）`);
    return f;
  }
  if (!create) return null;
  log_('INFO', `新建文件夹：${parent.getName()}/${name}`);
  return parent.createFolder(name);
}

/** 打开主文件夹、读配置、定位子文件夹。create 为 true 时补建缺失的文件夹（只在 setup 中使用） */
function folders_(create) {
  const main = DriveApp.getFolderById(mainFolderId_());
  loadConfig_(main);
  const archive = subFolder_(main, CFG.archive_dir, create);
  if (!archive) throw new Error(`主文件夹下未找到「${CFG.archive_dir}」，请先运行 setup()`);
  const inbox = subFolder_(main, CFG.inbox_dir, true);
  return { main, archive, inbox, sub: subFolder_ };
}

function liveFilesByName_(folder, name) {
  const out = [];
  const it = folder.getFilesByName(name);
  while (it.hasNext()) { const f = it.next(); if (!f.isTrashed()) out.push(f); }
  return out;
}

// ====================== 核心流程 ======================

/** 解析并校验一个 zip，返回计划；不改任何文件 */
function planZip_(zipFile, F) {
  const plan = { zip: zipFile.getName(), ok: true, errors: [], items: [], readme: null, junk: 0 };
  let blobs;
  try {
    blobs = Utilities.unzip(zipFile.getBlob().setContentType('application/zip'));
  } catch (e) {
    plan.ok = false; plan.errors.push('无法解压：' + e.message); return plan;
  }
  const names = blobs.map(b => b.getName());
  const prefix = commonPrefix_(names);
  if (prefix) log_('INFO', `${plan.zip}：去掉外壳目录 ${prefix}`);
  const seen = new Set();
  // 逐文件记录：文件名｜命中规则｜通过或拒收原因｜去向（DEBUG 级，写入日志文件，不进邮件）
  const reject = (name, rule, reason) => {
    plan.ok = false; plan.errors.push(`${name}：${reason}`);
    log_('DEBUG', `校验 ${plan.zip} ▸ ${name}｜规则：${rule}｜拒收：${reason}｜去向：整包移入异常`);
  };
  for (const b of blobs) {
    const c = classifyEntry_(b.getName(), prefix);
    if (c.dest === 'dir') continue;
    if (c.dest === 'junk') { plan.junk++; log_('DEBUG', `校验 ${plan.zip} ▸ ${c.name}｜规则：系统文件｜忽略`); continue; }
    if (c.dest === null) { reject(c.name, c.rule, c.reason); continue; }
    if (c.dest === 'readme') { plan.readme = b; log_('DEBUG', `校验 ${plan.zip} ▸ ${c.name}｜规则：${c.rule}｜通过｜去向：不入库，随zip处理`); continue; }
    const shown = c.dest === 'main' ? c.name : `${CFG.entities_dir}/${c.name}`;
    const key = c.dest + '/' + c.name;
    if (seen.has(key)) { reject(shown, c.rule, 'zip内重复'); continue; }
    seen.add(key);
    const bytes = b.getBytes();
    const text = Utilities.newBlob(bytes).getDataAsString('UTF-8');
    if (text.indexOf('�') >= 0) { reject(shown, c.rule, '内容不是UTF-8'); continue; }
    if (bytes.length === 0) { reject(shown, c.rule, '空文件'); continue; }
    const yamlChecked = CFG.check_yaml && needsYaml_(c.dest, c.name);
    if (yamlChecked && !YAML_HEAD_RE.test(text)) {
      reject(shown, c.rule, '议题文件缺YAML属性区（库为YAML模式）'); continue;
    }
    if (CFG.check_sensitive) {
      const hits = findALevel_(text);
      if (hits.length) {
        reject(shown, c.rule, `含疑似未遮挡的A级信息（${hits.slice(0, 5).join('；')}${hits.length > 5 ? `；另有${hits.length - 5}处` : ''}），请遮挡后重新打包`);
        continue;
      }
    }
    const folder = c.dest === 'main' ? F.main : F.sub(F.main, CFG.entities_dir, false);
    const existing = folder ? liveFilesByName_(folder, c.name) : [];
    const hash = md5_(bytes);
    const same = existing.some(f => { try { return md5_(f.getBlob().getBytes()) === hash; } catch (e) { return false; } });
    plan.items.push({ dest: c.dest, name: c.name, blob: b, size: bytes.length, existing: existing.length, same });
    const where = c.dest === 'main' ? '主文件夹' : `${CFG.entities_dir}/`;
    const fate = same ? `${where}（内容相同，跳过）` : (existing.length ? `${where}（同名旧版${existing.length}份移入归档）` : `${where}（新建）`);
    log_('DEBUG', `校验 ${plan.zip} ▸ ${shown}｜规则：${c.rule}${yamlChecked ? '＋YAML属性区' : ''}${CFG.check_sensitive ? '＋A级检查' : ''}｜通过｜去向：${fate}`);
  }
  if (!plan.items.length && plan.ok) { plan.ok = false; plan.errors.push('zip内没有可入库的文件'); }
  return plan;
}

function describePlan_(p) {
  const lines = [`zip：${p.zip}｜${p.ok ? '可处理' : '拒收'}｜条目${p.items.length}个${p.readme ? '＋README' : ''}${p.junk ? `｜忽略系统文件${p.junk}个` : ''}`];
  p.errors.forEach(e => lines.push(`  拒收原因：${e}`));
  p.items.forEach(it => {
    const where = it.dest === 'main' ? '主文件夹' : `${CFG.entities_dir}/`;
    const act = it.same ? '内容相同，跳过' : (it.existing ? `新建，并归档同名旧版${it.existing}份` : '新建（库内无同名）');
    lines.push(`  ${where} ${it.name}（${it.size}字节）：${act}`);
  });
  return lines;
}

function executePlan_(p, F) {
  const stamp = fmtTime_(new Date(), 'yyyyMMddHHmmss');
  const res = { created: 0, skipped: 0, archived: 0 };
  for (const it of p.items) {
    if (it.same) { res.skipped++; log_('INFO', `跳过（内容相同）：${it.name}`); continue; }
    const folder = it.dest === 'main' ? F.main : F.sub(F.main, CFG.entities_dir, true);
    const olds = liveFilesByName_(folder, it.name);
    const blob = it.blob.copyBlob().setName(it.name).setContentType('text/markdown');
    const nf = folder.createFile(blob);
    log_('INFO', `已新建：${it.dest === 'main' ? '' : CFG.entities_dir + '/'}${it.name}（id=${nf.getId()}）`);
    res.created++;
    let n = 0;
    for (const old of olds) {
      if (old.getId() === nf.getId()) continue;
      n++;
      let newName = archiveName_(it.name, stamp, n);
      while (F.archive.getFilesByName(newName).hasNext()) { n++; newName = archiveName_(it.name, stamp, n); }
      old.setName(newName);
      old.moveTo(F.archive);
      res.archived++;
      log_('INFO', `已归档旧版：${it.name} → ${CFG.archive_dir}/${newName}（id=${old.getId()}）`);
    }
  }
  return res;
}

function finishZip_(zipFile, p, F, ok) {
  const stamp = fmtTime_(new Date(), 'yyyyMMddHHmmss');
  if (ok) {
    const zname = `入库包_${stamp}_${zipFile.getName()}`;
    zipFile.setName(zname); zipFile.moveTo(F.archive);
    log_('INFO', `zip已移入归档：${zname}`);
    if (p.readme) {
      const rname = `入库包_${stamp}_README.txt`;
      F.archive.createFile(p.readme.copyBlob().setName(rname).setContentType('text/plain'));
      log_('INFO', `README已存入归档：${rname}`);
    }
  } else {
    const err = F.sub(F.inbox, CFG.error_dir, true);
    zipFile.moveTo(err);
    const note = describePlan_(p).join('\n') + '\n';
    err.createFile(`${zipFile.getName()}_拒收原因_${stamp}.txt`, note, 'text/plain');
    log_('WARN', `zip已移入 ${CFG.inbox_dir}/${CFG.error_dir}，原因见同目录说明文件`);
  }
}

function listZips_(inbox) {
  const out = [];
  const it = inbox.getFiles();
  while (it.hasNext()) {
    const f = it.next();
    if (f.isTrashed()) continue;
    if (/\.zip$/i.test(f.getName()) || f.getMimeType() === 'application/zip' || f.getMimeType() === 'application/x-zip-compressed') out.push(f);
    else log_('WARN', `收件箱中有非zip文件，未处理：${f.getName()}（${f.getMimeType()}）`);
  }
  out.sort((a, b) => a.getDateCreated() - b.getDateCreated());
  return out;
}

function process_(mode) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) { console.log('另一次执行正在进行，本次退出'); return; }
  let F = null;
  MAIL_LINES = [];
  let touched = false;
  try {
    F = folders_(false);
    const t0 = Date.now();
    const zips = listZips_(F.inbox);
    if (!zips.length) { log_('DEBUG', `[${CFG.library}] 收件箱为空`); return; }
    log_('INFO', `==== [${CFG.library}] ${mode === 'run' ? '执行' : '预演'}：收件箱中zip ${zips.length}个 ====`);
    log_('DEBUG', `配置：${describeConfig_(CFG)}`);
    for (const z of zips) {
      if (Date.now() - t0 > FIXED.BATCH_SECONDS * 1000) { log_('WARN', '接近时限，剩余zip留待下次处理'); break; }
      touched = true;
      const p = planZip_(z, F);
      describePlan_(p).forEach(l => log_(p.ok ? 'INFO' : 'WARN', l));
      if (mode !== 'run') continue;
      if (!p.ok) { finishZip_(z, p, F, false); continue; }
      try {
        const r = executePlan_(p, F);
        log_('INFO', `完成：新建${r.created}、跳过${r.skipped}、归档旧版${r.archived}`);
        finishZip_(z, p, F, true);
      } catch (e) {
        log_('ERROR', `执行中出错：${e.message}。zip留在收件箱，下次重试（已上传的同内容文件会自动跳过）`);
      }
    }
  } catch (e) {
    log_('ERROR', `运行失败：${e.message}`);
    touched = true;
    if (!F) throw e;   // 主文件夹或配置读不到：抛出，让 Apps Script 的失败通知提醒使用者
  } finally {
    // 只在处理过 zip 或出错时写日志文件；空收件箱的例行检查只留执行日志
    if (F && touched) flushLog_(F.archive);
    if (mode === 'run' && touched && CFG && CFG.mail && MAIL_LINES.length) {
      try {
        MailApp.sendEmail(Session.getEffectiveUser().getEmail(), `[${CFG.library}] 入库收件箱处理结果`, MAIL_LINES.join('\n'));
      } catch (e) { console.log('发送邮件失败：' + e.message); }
    }
    lock.releaseLock();
  }
}

// ====================== 自检 ======================

/**
 * 纯逻辑校验用例，用例按配置的分区上限生成。只调用纯逻辑函数，不读写知识文件。
 * 返回失败数；console 输出每例结果。
 */
function runSelfTest_(cfg) {
  const saved = CFG;
  CFG = cfg;
  try {
    const L = cfg.partition_max, T = cfg.topic_start;
    const accept = (path, text) => {
      const c = classifyEntry_(path, '');
      if (c.dest === 'readme' || c.dest === 'entity') return { got: true, c };
      if (c.dest !== 'main') return { got: false, c };
      if (cfg.check_yaml && needsYaml_(c.dest, c.name) && !YAML_HEAD_RE.test(text)) return { got: false, c, why: '缺YAML属性区' };
      if (cfg.check_sensitive && findALevel_(text).length) return { got: false, c, why: 'A级信息' };
      return { got: true, c };
    };
    const Y = '---\n类型: 资料\n---\n正文', N = '正文首行不是属性区';
    const cases = [
      [`${pad2_(L - 1)}_x.md`, Y, true],
      [`${pad2_(L)}_x.md`, Y, true],
      [`1_x.md`, Y, false],
      [`100_x.md`, Y, false],
      [`${pad2_(T)}_x.md`, N, !cfg.check_yaml],
      [`${pad2_(L)}_x.md`, N, !cfg.check_yaml],
      ['00_x.md', N, true],
      [`${pad2_(L)}_x${cfg.old_suffix}20261007.md`, Y, false],
      [`${cfg.snapshot_prefix}${pad2_(L)}_x.md`, Y, false],
      ['_x.md', Y, false],
      ['README.txt', N, true],
      [`${cfg.entities_dir}/x.md`, N, true],
      ['子目录/x.md', Y, false],
      [`${pad2_(L)}_x.md`, Y + '\n卡号 6222021234567890123', !cfg.check_sensitive],
      [`${pad2_(L)}_x.md`, Y + '\n卡号 ****************0123', true]
    ];
    if (L < 99) cases.push([`${pad2_(L + 1)}_x.md`, Y, false]);
    if (T > 1) cases.push([`${pad2_(T - 1)}_x.md`, N, true]);
    let fail = 0;
    cases.forEach(([path, text, want]) => {
      const r = accept(path, text);
      const pass = r.got === want;
      if (!pass) fail++;
      const why = r.c.reason || r.why || '';
      console.log(`${pass ? '通过' : '失败'}｜${path}｜首行${text.startsWith('---') ? '是' : '不是'}---｜期望${want ? '接受' : '拒收'}，实际${r.got ? '接受' : '拒收'}${why ? '（' + why + '）' : ''}`);
    });
    const zhCfg = { '配置版本': 1, '库名': '示例库', '分区上限': 9, '议题区起始': 2, '检查YAML': true,
      '检查A级信息': false, '实体文件夹': '实体', '邮件通知': true, '触发间隔分钟': 10 };
    const enCfg = { version: 1, library: 'Sample', partition_max: 9, topic_start: 2, check_yaml: true,
      check_sensitive: false, entities_dir: 'Entities', mail: true, interval_minutes: 10, archive_dir: 'Archive' };
    const cfgCases = [
      ['非法配置被拦下', parseConfig_({ '配置版本': 1, '库名': '', '分区上限': 100 }).errs.length >= 3],
      ['中文键配置合法，可选字段取默认值', (r => !r.errs.length && r.cfg.archive_dir === DEFAULT_NAMES.archive_dir &&
        r.cfg.inbox_dir === DEFAULT_NAMES.inbox_dir && r.cfg.old_suffix === DEFAULT_NAMES.old_suffix)(parseConfig_(zhCfg))],
      ['英文键配置合法，可选字段按配置', (r => !r.errs.length && r.cfg.archive_dir === 'Archive' &&
        r.cfg.entities_dir === 'Entities' && r.cfg.error_dir === DEFAULT_NAMES.error_dir)(parseConfig_(enCfg))],
      ['中英混写被拦下', parseConfig_(Object.assign({}, enCfg, { '库名': '示例库' })).errs.some(e => e.indexOf('混写') >= 0)],
      ['可选字段含 / 被拦下', parseConfig_(Object.assign({}, enCfg, { inbox_dir: 'a/b' })).errs.length === 1]
    ];
    cfgCases.forEach(([name, ok]) => { if (!ok) fail++; console.log(`${ok ? '通过' : '失败'}｜配置：${name}`); });
    console.log(`selfTest：${cases.length + cfgCases.length}例，失败${fail}例`);
    return fail;
  } finally {
    CFG = saved;
  }
}

function selfTest() {
  const main = DriveApp.getFolderById(mainFolderId_());
  const cfg = loadConfig_(main);
  console.log(`配置：${describeConfig_(cfg)}`);
  const fail = runSelfTest_(cfg);
  if (fail) throw new Error(`selfTest 失败 ${fail} 例`);
}

// ====================== 入口 ======================

function setup() {
  const id = mainFolderId_();
  const main = DriveApp.getFolderById(id);   // 打不开时这里直接报错
  PropertiesService.getScriptProperties().setProperty(PROP_MAIN_ID, id);
  console.log(`主文件夹：${main.getName()}（id=${id}），已保存到脚本属性`);
  console.log(`时区：${Session.getScriptTimeZone()}（项目设置中修改；日志与归档时间戳按此时区）`);
  const cfg = loadConfig_(main);
  console.log(`配置：${describeConfig_(cfg)}`);
  LOG_BUFFER = [];
  const F = folders_(true);
  const ent = subFolder_(main, cfg.entities_dir, true);
  const err = subFolder_(F.inbox, CFG.error_dir, true);
  console.log(`${cfg.archive_dir}：id=${F.archive.getId()}`);
  console.log(`${cfg.entities_dir}：id=${ent.getId()}`);
  console.log(`${CFG.inbox_dir}：id=${F.inbox.getId()}（把交付 zip 上传到这里）`);
  console.log(`${CFG.inbox_dir}/${CFG.error_dir}：id=${err.getId()}`);
  if (LOG_BUFFER.length) flushLog_(F.archive);   // 只有新建了文件夹才写日志文件
  const fail = runSelfTest_(cfg);
  if (fail) throw new Error(`selfTest 失败 ${fail} 例，请把执行日志发给维护者，暂不要运行 enableAutoRun()`);
  console.log('---- 收件箱预演 ----');
  process_('preview');
  const on = PropertiesService.getScriptProperties().getProperty(PROP_RUN_ENABLED) === 'true';
  console.log(on ? 'setup 完成。正式执行已开启，定时触发照常。'
                 : 'setup 完成。核对以上日志无误后，运行 enableAutoRun() 开启正式执行与定时触发。');
}

function preview() { process_('preview'); }

function run() {
  if (PropertiesService.getScriptProperties().getProperty(PROP_RUN_ENABLED) !== 'true') {
    throw new Error('正式执行未开启：请先运行 setup() 核对，确认后运行 enableAutoRun()');
  }
  process_('run');
}

function autoRun() {
  if (PropertiesService.getScriptProperties().getProperty(PROP_RUN_ENABLED) !== 'true') {
    console.log('正式执行未开启（未运行 enableAutoRun），本次跳过');
    return;
  }
  process_('run');
}

function enableAutoRun() {
  const main = DriveApp.getFolderById(mainFolderId_());
  const cfg = loadConfig_(main);
  PropertiesService.getScriptProperties().setProperty(PROP_RUN_ENABLED, 'true');
  removeTriggers_();
  ScriptApp.newTrigger('autoRun').timeBased().everyMinutes(cfg.interval_minutes).create();
  console.log(`[${cfg.library}] 已开启正式执行，并安装定时触发器：每${cfg.interval_minutes}分钟检查一次收件箱`);
}

function disableAutoRun() {
  PropertiesService.getScriptProperties().deleteProperty(PROP_RUN_ENABLED);
  removeTriggers_();
  console.log('已停止正式执行并删除定时触发器');
}

function showStatus() {
  const props = PropertiesService.getScriptProperties();
  console.log(`主文件夹ID：代码中=${MAIN_FOLDER_ID || '（空）'}，脚本属性中=${props.getProperty(PROP_MAIN_ID) || '（空）'}`);
  console.log(`正式执行：${props.getProperty(PROP_RUN_ENABLED) === 'true' ? '已开启' : '未开启'}`);
  console.log(`时区：${Session.getScriptTimeZone()}`);
  const n = ScriptApp.getProjectTriggers().filter(t => t.getHandlerFunction() === 'autoRun').length;
  console.log(`定时触发器：${n}个`);
  try { console.log(`配置：${describeConfig_(loadConfig_(DriveApp.getFolderById(mainFolderId_())))}`); }
  catch (e) { console.log(`配置读取失败：${e.message}`); }
}

function removeTriggers_() {
  ScriptApp.getProjectTriggers().filter(t => t.getHandlerFunction() === 'autoRun')
    .forEach(t => { ScriptApp.deleteTrigger(t); console.log('已删除一个定时触发器'); });
}

// 兼容旧版入口名
function installTrigger() { enableAutoRun(); }
function removeTrigger() { disableAutoRun(); }
