// v2.0 冒烟测试：桩 DOM 启动 + 数据一致性检查（按实际 schema：events.areas[] / TRIALS[]）
'use strict';
const fs = require('fs');
const path = require('path');

// ---------- mkEl 桩 ----------
function mkEl(tag) {
  const el = {
    tagName: (tag || 'div').toUpperCase(),
    children: [], dataset: {}, style: {}, classList: {
      _s: new Set(),
      add(c) { this._s.add(c); }, remove(c) { this._s.delete(c); },
      contains(c) { return this._s.has(c); }, toggle(c, f) { f ? this._s.add(c) : this._s.delete(c); }
    },
    attrs: {}, _listeners: {},
    set innerHTML(v) { this._html = v; this.children = []; }, get innerHTML() { return this._html || ''; },
    set textContent(v) { this._txt = String(v); }, get textContent() { return this._txt || ''; },
    set className(v) { this._cls = v; }, get className() { return this._cls || ''; },
    appendChild(c) { this.children.push(c); return c; },
    insertBefore(c) { this.children.unshift(c); return c; },
    remove() {},
    setAttribute(k, v) { this.attrs[k] = v; }, getAttribute(k) { return this.attrs[k]; },
    addEventListener(t, f) { (this._listeners[t] = this._listeners[t] || []).push(f); },
    querySelector() { return mkEl('div'); },
    querySelectorAll() { return []; },
    click() { (this._listeners.click || []).forEach(f => f({ preventDefault() {} })); },
    focus() {}, blur() {},
    value: '', disabled: false, hidden: false,
    getContext() { return null; },
  };
  Object.defineProperty(el, 'id', { get() { return this._id || ''; }, set(v) { this._id = v; } });
  return el;
}
const ids = {};
function byId(id) { return ids[id] || (ids[id] = mkEl('div')); }

global.document = {
  getElementById: byId,
  createElement: mkEl,
  querySelector() { return mkEl('div'); },
  querySelectorAll() { return []; },
  body: mkEl('body'),
  addEventListener() {},
  hidden: false,
};
const store = {};
global.localStorage = {
  getItem(k) { return k in store ? store[k] : null; },
  setItem(k, v) { store[k] = String(v); },
  removeItem(k) { delete store[k]; },
};
global.window = global;
global.requestAnimationFrame = () => 0;
global.cancelAnimationFrame = () => {};

// ---------- 载入 data.js ----------
let dataSrc = fs.readFileSync(path.join(__dirname, 'js', 'data.js'), 'utf8');
dataSrc = dataSrc.replace(/const DATA\s*=/, 'globalThis.DATA =');
eval(dataSrc);
const DATA = globalThis.DATA;
if (!DATA) throw new Error('DATA not defined');

// ---------- 数据一致性检查 ----------
const errs = [];
const ok = (cond, msg) => { if (!cond) errs.push(msg); };

// 1) TALENTS
ok(Array.isArray(DATA.TALENTS) && DATA.TALENTS.length >= 3, 'TALENTS 数量不足');
(DATA.TALENTS || []).forEach((t, i) => {
  ok(t.id && t.name && Array.isArray(t.costs), `TALENTS[${i}] 字段缺失`);
  t.costs.forEach((c, j) => ok(typeof c === 'number' && c > 0, `TALENTS[${i}].costs[${j}] 非正数`));
});

// 2) TRIALS（数组，gate 门槛）
ok(Array.isArray(DATA.TRIALS) && DATA.TRIALS.length === 3, 'TRIALS 应为 3 条');
(DATA.TRIALS || []).forEach((tr) => {
  ok([4, 6, 8].includes(tr.gate), `TRIALS gate 异常: ${tr.gate}`);
  ok(tr.area >= 0 && tr.area <= 4, `TRIALS[${tr.gate}].area 越界`);
  ok(tr.title && tr.desc && tr.customer && tr.food, `TRIALS[${tr.gate}] 字段缺失`);
});

// 3) 事件库（areas 数组）
const events = DATA.EVENTS || [];
let multiOutChoices = 0;
ok(events.length === 20, `事件数量应为 20，实际 ${events.length}`);
let totalOuts = 0;
events.forEach((ev, i) => {
  ok(ev.id, `EVENTS[${i}] 缺 id`);
  ok(Array.isArray(ev.areas) && ev.areas.every(a => a >= 0 && a <= 4), `${ev.id} areas 异常`);
  ok(ev.title && ev.text, `${ev.id} 缺 title/text`);
  ok(typeof ev.w === 'number' && ev.w > 0, `${ev.id} 缺 w`);
  ok(Array.isArray(ev.choices) && ev.choices.length >= 1, `${ev.id} choices 缺失`);
  ev.choices.forEach((ch, j) => {
    ok(ch.t, `${ev.id}.choices[${j}] 缺 t`);
    const hasOuts = Array.isArray(ch.outs) && ch.outs.length >= 1;
    const hasRun = typeof ch.run === 'function';
    ok(hasOuts || hasRun, `${ev.id}.choices[${j}] 既无 outs 又无 run`);
    if (hasOuts && ch.outs.length >= 3) multiOutChoices++;
    if (hasOuts) {
      ch.outs.forEach((o, k) => {
        totalOuts++;
        ok(typeof o.w === 'number' && o.w > 0, `${ev.id}.choices[${j}].outs[${k}] 权重非正`);
        ok(o.res && typeof o.res.log === 'string' && o.res.log.length >= 4, `${ev.id}.choices[${j}].outs[${k}] 缺 res.log`);
      });
    }
  });
});

// 4) 因果链/彩蛋事件
const idsSet = new Set(events.map(e => e.id));
['robberReturn', 'craneReturn', 'demonAmbush', 'oldmanTest', 'timeslip'].forEach(id =>
  ok(idsSet.has(id), `因果链/彩蛋事件缺失: ${id}`));

// 5) 因果链 flag 有产出方（set 在前置事件中）与触发方（cond 引用）
const src = dataSrc;
['sparedRobber', 'fedCrane', 'offendedDemon', 'metOldman'].forEach(flag => {
  const hasSet = src.includes(`set: { ${flag}`) || src.includes(`set: {${flag}`) || src.includes(`{ ${flag}: 1 }`) || src.includes(`${flag}: 1`);
  ok(hasSet, `因果 flag 无产出方: ${flag}`);
});

// 6) 成就唯一 + trialpass
const achIds = (DATA.ACHIEVEMENTS || []).map(a => a.id);
ok(new Set(achIds).size === achIds.length, '成就 id 重复');
ok(achIds.includes('trialpass'), '缺少 trialpass 成就');

// 7) 基础表
ok((DATA.AREAS || []).length === 5, 'AREAS 应为 5');
ok((DATA.LEVELS || []).length >= 9, 'LEVELS 不足');

if (errs.length) {
  console.log('DATA_ERR:');
  errs.forEach(e => console.log(' -', e));
  process.exit(1);
}
console.log(`DATA_OK events=${events.length} totalOuts=${totalOuts} talents=${DATA.TALENTS.length} achievements=${achIds.length}`);

// ---------- 载入 game.js（桩启动） ----------
const gameSrc = fs.readFileSync(path.join(__dirname, 'js', 'game.js'), 'utf8');
// 引擎引用的关键函数/特征存在性
['rollOutcome', 'dodgeChance', 'makeTrialOrder', 'promptName', 'pushHistory', 'renderBanner', 'pendingGate', 'rawLevel'].forEach(fn => {
  if (!gameSrc.includes(fn)) { console.log('GAME_MISSING: ' + fn); process.exit(1); }
});
try {
  eval(gameSrc);
  console.log('BOOT_OK');
} catch (e) {
  console.log('BOOT_FAIL: ' + e.message);
  console.log(e.stack.split('\n').slice(0, 6).join('\n'));
  process.exit(1);
}

// ---------- 摇号分布抽查（复现 rollOutcome 权重逻辑） ----------
function rollLuck(outs, luck, shenshiLv) {
  const ws = outs.map(o => {
    let w = o.w;
    if (o.good) { w *= (0.7 + luck / 100); if (shenshiLv >= 2) w *= 1.25; }
    if (o.bad) { w *= (1.3 - luck / 150); if (shenshiLv >= 2) w /= 1.25; }
    return w;
  });
  const sum = ws.reduce((s, x) => s + x, 0);
  let r = Math.random() * sum;
  for (let i = 0; i < ws.length; i++) { r -= ws[i]; if (r <= 0) return i; }
  return ws.length - 1;
}
const ev0 = events.find(e => e.id === 'robber');
const outs0 = ev0.choices[0].outs;
function dist(luck, lv) {
  const cnt = [0, 0, 0, 0];
  for (let i = 0; i < 20000; i++) cnt[rollLuck(outs0, luck, lv)]++;
  return cnt.map(c => (c / 200).toFixed(1) + '%').join(' / ');
}
console.log('robber硬闯分布 气运50灵眸0: ' + dist(50, 0));
console.log('robber硬闯分布 气运90灵眸2: ' + dist(90, 2));
console.log('robber硬闯分布 气运10灵眸0: ' + dist(10, 0));

// 灵眸递减概率
function dodgeChance(dodges, shenshi) {
  return Math.max(20, Math.min(90, 85 - 20 * dodges + 5 * (shenshi - 1)));
}
console.log('灵眸概率 0次1级=' + dodgeChance(0, 1) + '% 1次=' + dodgeChance(1, 1) + '% 2次=' + dodgeChance(2, 1) + '% 0次3级=' + dodgeChance(0, 3) + '%');
console.log('ALL_OK multiOutChoices=' + multiOutChoices);
process.exit(0);
