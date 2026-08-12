/* =========================================================
 * 我在修仙界送外卖 — 引擎
 * 纯前端 · localStorage 存档（键名前缀 cultexpress_）
 * v2.0：多结果摇号 + 因果链 + 气运/道心 + 灵眸改版 + 命名
 *       + 境界试炼 + 配送史册 + 彩蛋 + 实时 UI
 * v2.1：门派悬赏 + 五星连击 + 事件冷却防重复 + 因果标记清理
 *       + 10 个新事件 + App 式视口布局 + buff 实时计时
 * v2.2：配送神通（灵力/冷却）+ 路线选择 + 天机轮换 + 传奇分层
 *       + 行为标签/人脉/流派接口预埋 + 决策密度统计
 * v2.3：情报型事件（灵眸揭示）+ 人格影响事件池 + 失败剧情 + NPC 人脉基础版
 * v2.4：流派被动神通（9 大流派落地）+ 流派播报 + 路线偏好画像
 * v2.4.1：新手引导五步任务链 + 开局欢迎剧情 + 玩法说明 + 情境提示
 * v2.4.2：三档难度（清闲/标准/修罗）+ 高境界餐损加压 + 修罗道成就
 * v2.4.3：修复事件耗时符号反转（仙鹤引路等 7 处省时结果曾重置行程）；
 *       神速对进行中配送实时生效；buff 倒计时每 tick 刷新
 * ========================================================= */
(function () {
  'use strict';

  var KEY = 'cultexpress_save_v1';
  var $ = function (s) { return document.querySelector(s); };
  var rnd = function (a, b) { return a + Math.floor(Math.random() * (b - a + 1)); };
  var pick = function (arr) { return arr[Math.floor(Math.random() * arr.length)]; };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };

  /* ---------------- 状态 ---------------- */
  function freshState(run, legacySpeed, achievements, endings) {
    return {
      stones: 30, merit: 0,
      good: 0, bad: 0, fiveStar: 0, total: 0,
      goodStreak: 0, badStreak: 0,
      exp: 0,
      luck: 50, resolve: 30,
      mount: 0,
      box: { warm: 0, seal: 0, space: 0 },
      arts: { shenfa: 0, hutu: 0, shenshi: 0, guixi: 0, dianjin: 0 },
      riders: 0, dispatch: 0,
      buffs: { speedUntil: 0, safeNext: 0 },
      flags: {},
      quests: [],
      personality: { kindness: 0, adventure: 0, business: 0, cautious: 0 }, // v2.2 预埋：行为标签
      relationships: {}, // v2.2 预埋：NPC 关系网（{ npcId: { level, trust, flags:[] } }）
      achievements: achievements || [],
      endings: endings || [],
      run: run || 1,
      legacySpeed: legacySpeed || 0,
      meditating: false,
    };
  }

  var S = freshState();
  var META = { marks: 0, talents: {}, name: '', history: [] }; // 跨轮回永久数据
  var orders = [];
  var delivery = null;
  var modalOpen = false;
  var activeTab = 'orders';
  var lastSeenSave = 0;
  var riderAcc = 0;
  var butterflyAt = Infinity;
  var rivalLineAt = Infinity;
  var pendingWrath = false;
  var statAcc = 0;
  var lastStones = null;

  /* ---------------- 存档 ---------------- */
  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify({ v: 1, s: S, meta: META, orders: orders, lastSeen: Date.now() }));
    } catch (e) { /* 隐私模式下静默失败 */ }
  }
  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return false;
      var data = JSON.parse(raw);
      if (!data || !data.s) return false;
      S = Object.assign(freshState(), data.s);
      S.box = Object.assign({ warm: 0, seal: 0, space: 0 }, data.s.box);
      S.arts = Object.assign({ shenfa: 0, hutu: 0, shenshi: 0, guixi: 0, dianjin: 0 }, data.s.arts);
      S.buffs = Object.assign({ speedUntil: 0, safeNext: 0 }, data.s.buffs);
      S.flags = data.s.flags || {};
      S.personality = Object.assign({ kindness: 0, adventure: 0, business: 0, cautious: 0 }, data.s.personality);
      S.relationships = data.s.relationships || {};
      META = Object.assign({ marks: 0, talents: {}, name: '', history: [] }, data.meta);
      META.talents = META.talents || {};
      META.history = Array.isArray(META.history) ? META.history : [];
      orders = Array.isArray(data.orders) ? data.orders : [];
      lastSeenSave = data.lastSeen || 0;
      return true;
    } catch (e) { return false; }
  }

  /* ---------------- 派生数值 ---------------- */
  function tLv(id) { return META.talents[id] || 0; }
  function rawLevel() {
    var lv = 1;
    for (var i = 0; i < DATA.LEVELS.length; i++) {
      if (S.exp >= DATA.LEVELS[i].exp) lv = i + 1;
    }
    return lv;
  }
  function level() {
    var lv = rawLevel();
    DATA.TRIALS.forEach(function (t) {
      if (lv >= t.gate && !S.flags['trial' + t.gate]) lv = t.gate - 1;
    });
    return lv;
  }
  function pendingGate() {
    var raw = rawLevel(), lv = level();
    return raw > lv ? lv + 1 : null;
  }
  function levelTitle() { return DATA.LEVELS[level() - 1].title; }
  function displayName() { return META.name || '你'; }
  function speed() {
    var v = DATA.MOUNTS[S.mount].spd * (1 + 0.12 * S.arts.shenfa) * (1 + S.legacySpeed) * (1 + 0.05 * tLv('feet'));
    if (hasBuild('铁壁快送流')) v *= 1.05;
    if (Date.now() < S.buffs.speedUntil) v *= 2;
    return v;
  }
  function timeMul() { return 1 + 0.12 * S.arts.guixi; }
  function payMul() { return (1 + 0.08 * S.box.space) * (1 + 0.02 * S.achievements.length); }
  function goodRate() {
    var rated = S.good + S.bad;
    return rated === 0 ? null : Math.round(S.good / rated * 100);
  }
  function unlockedAreas() {
    var lv = level();
    return DATA.AREAS.map(function (a, i) { return i; }).filter(function (i) {
      return DATA.AREAS[i].lv <= lv;
    });
  }
  function orderSlots() { return 3 + tLv('eye'); }
  function regulars() { return S.flags.regulars || {}; }
  function regularCount() {
    var n = 0, rg = regulars();
    Object.keys(rg).forEach(function (k) { if (rg[k].good >= 3) n++; });
    return n;
  }
  function dodgeChance() {
    return clamp(85 - 20 * (S.flags.dodges || 0) + 5 * (S.arts.shenshi - 1), 20, 90);
  }

  /* ---------------- 天机（修仙历 · 每 8 小时轮换） ---------------- */
  function weatherWindow() { return Math.floor(Date.now() / (8 * 3600 * 1000)); }
  function currentWeather() {
    var w = weatherWindow();
    return DATA.WEATHERS[(w * 7 + 3) % DATA.WEATHERS.length];
  }
  function routeDef(id) {
    return DATA.ROUTES.find(function (r) { return r.id === id; });
  }
  function routeStats(route) {
    var w = currentWeather();
    var m = (w.mods && w.mods[route.id]) || {};
    var evtMul = route.event * (m.event || 1);
    // 铁牛护航：结识后魔修峡谷事件密度 -30%
    if (route.id === 'canyon' && relOf('biao').trust >= 1) evtMul *= 0.7;
    var timeMulR = route.time * (m.time || 1);
    // 天涯信使流：全路线耗时 -8%
    if (hasBuild('天涯信使流')) timeMulR *= 0.92;
    return {
      time: timeMulR,
      event: evtMul,
      pay: route.pay * (m.pay || 1),
      boosted: !!w.mods[route.id],
    };
  }
  function skillCost(sk) {
    var c = sk.cost;
    if (sk.id === 'dunying' && currentWeather().id === 'mist') c = Math.ceil(c / 2);
    if (sk.id === 'zhenshi' && hasBuild('金瞳铁壁流')) c -= 10;
    if (sk.id === 'yufeng' && hasBuild('赏金急脚流')) c -= 5;
    return Math.max(5, c);
  }
  function skillCd(sk) {
    var cd = sk.cd;
    if (sk.id === 'yufeng' && hasBuild('风行剑送流')) cd -= 3;
    if (sk.id === 'dunying' && hasBuild('洞玄静观流')) cd -= 10;
    return Math.max(5, cd);
  }
  function hasBuild(name) {
    var b = computeBuild();
    return !!(b && b.name === name);
  }
  /* ---------------- 难度（v2.4.2） ---------------- */
  function difficulty() {
    var id = S.flags.difficulty || 'easy';
    return DATA.DIFFICULTIES.find(function (d) { return d.id === id; }) || DATA.DIFFICULTIES[0];
  }
  function setDifficulty(id) {
    var d = DATA.DIFFICULTIES.find(function (x) { return x.id === id; });
    if (!d || (S.flags.difficulty || 'easy') === id) return;
    S.flags.difficulty = id;
    log(d.ico + ' 难度切换为「' + d.name + '」：' + d.desc, 'l-gold');
    toast(d.ico + ' 难度 · ' + d.name);
    save(); render();
  }

  /* ---------------- 行为标签 / 流派（v2.2 预埋接口） ---------------- */
  function bumpPersonality(key, n) {
    if (!S.personality) S.personality = { kindness: 0, adventure: 0, business: 0, cautious: 0 };
    S.personality[key] = (S.personality[key] || 0) + (n || 1);
  }
  function personalityTotal() {
    var p = S.personality || {};
    return (p.kindness || 0) + (p.adventure || 0) + (p.business || 0) + (p.cautious || 0);
  }
  function computeBuild() {
    // 取功法最高的两门（均 ≥2 层）查流派表；人格冒险值高时偏好「天涯信使流」
    var entries = Object.keys(S.arts).map(function (k) { return [k, S.arts[k]]; })
      .sort(function (a, b) { return b[1] - a[1]; });
    if (entries.length < 2 || entries[1][1] < 2) return null;
    var pair = [entries[0][0], entries[1][0]];
    var build = DATA.BUILDS.find(function (b) {
      return pair.indexOf(b.need[0]) >= 0 && pair.indexOf(b.need[1]) >= 0;
    });
    if (build && (S.personality.adventure || 0) >= 15 && S.arts.shenfa >= 3) {
      var alt = DATA.BUILDS.find(function (b) { return b.name === '天涯信使流'; });
      if (alt) return alt;
    }
    return build || null;
  }
  function countDecision() { S.flags.decisions = (S.flags.decisions || 0) + 1; }

  /* ---------------- 新手引导（v2.4.1） ---------------- */
  function guideStep() { return S.flags.guideStep || 0; }
  function guideDone() { return guideStep() >= DATA.GUIDES.length; }
  function guideAdvance(id) {
    if (guideDone()) return;
    var g = DATA.GUIDES[guideStep()];
    if (!g || g.id !== id) return;
    S.flags.guideStep = guideStep() + 1;
    var rw = [];
    if (g.reward.stones) { S.stones += g.reward.stones; rw.push(g.reward.stones + ' 灵石'); }
    if (g.reward.merit) { S.merit += g.reward.merit; rw.push(g.reward.merit + ' 功德'); }
    log('🎓 新手引导「' + g.name + '」完成！奖励 ' + rw.join(' + '), 'l-gold');
    toast('🎓 ' + g.name + ' · 奖励 ' + rw.join(' + '));
    pushHistory('🎓 完成新手引导「' + g.name + '」');
    if (guideDone()) {
      unlockAch('guide');
      log('🎓 新手引导全部完成！你已是一名合格的修仙骑手——流派、人脉、轮回……更大的世界等着你。', 'l-gold');
    }
  }
  function guideHtml() {
    if (guideDone()) return '';
    var g = DATA.GUIDES[guideStep()];
    var rw = [];
    if (g.reward.stones) rw.push(g.reward.stones + ' 灵石');
    if (g.reward.merit) rw.push(g.reward.merit + ' 功德');
    return '<div class="order special"><div class="o-head"><span class="o-name">🎓 新手引导 (' + (guideStep() + 1) + '/' + DATA.GUIDES.length + ') · ' + g.name + '</span>' +
      '<span class="o-area">奖励 ' + rw.join(' + ') + '</span></div>' +
      '<div class="o-body small">' + g.desc + '<br><span class="muted">💡 ' + g.hint + '</span></div></div>';
  }
  function showWelcome() {
    var choices = DATA.DIFFICULTIES.map(function (d) {
      return {
        t: d.ico + ' ' + d.name,
        hint: d.desc,
        run: function () {
          S.flags.difficulty = d.id;
          log(d.ico + ' 你踏上了「' + d.name + '」之道：' + d.desc + '（设置页可随时更换）', 'l-gold');
          closeModal(); save(); render();
        },
      };
    });
    openModal('🌩️ 黄袍加身',
      '一道天雷把你劈进了修仙界。回家的日子遥遥无期，饭总得吃——\n好在你还有一门手艺：送外卖。\n\n核心循环一句话：接单 → 择路 → 应对途中变故 → 拿好评 → 赚灵石与功德 → 买坐骑、修功法 → 送更远更危险的单。\n\n跟着顶部「新手引导」五步走，每步都有奖励。\n\n上路之前，选择你的修行之道（之后可随时更换）：',
      choices);
  }
  function showHelp() {
    openModal('📖 玩法说明',
      '【目标】送单赚灵石、攒功德，提升境界，解锁更远的区域，最终达成结局（还乡/外卖帝国/功德飞升/隐藏结局）。结局后可轮回，保留成就并获得传承。\n\n' +
      '【接单】每次 3 张订单符任选：看报酬、时限、预计耗时。预计标红说明大概率超时，超时就别想好评了。\n' +
      '【择路】官道稳、山径快、峡谷险而多金；天机（天象）每 8 小时轮换，会改变各路线数值。\n' +
      '【变故】途中会触发事件：抉择影响餐品完整度与耗时，完整度决定星级。选项灰字是后果提示；修灵眸可看内幕、可消耗道心绕路。\n' +
      '【神通】配送中可放技能：御风诀冲刺、镇食诀保餐、遁影诀暗中观察。耗灵力（自动回复）、有冷却。\n' +
      '【养成】灵石买坐骑/外卖箱/骑手小弟（自动送单、离线也跑）；功德修功法，两门 2 层悟出流派神通。\n' +
      '【资源】气运影响随机事件好坏；道心是灵眸的燃料；好评/打坐回复道心，差评扣减。三连差评遭天谴⚡。\n' +
      '【难度】清闲/标准/修罗三档（设置页随时切换）：难度越高，时限越紧、餐损越快、变故越多、天谴越狠，但报酬也越高。\n' +
      '【其他】门派悬赏每天换着花样发奖；熟客报酬 +30%；骑手榜上压着燕十三就是榜一。',
      [{ t: '明白了', run: function () { closeModal(); render(); } }]);
  }

  /* ---------------- NPC 人脉 ---------------- */
  function npcDef(id) { return DATA.NPCS.find(function (n) { return n.id === id; }); }
  function relOf(id) { return S.relationships[id] || { trust: 0 }; }
  function npcLevel(npc, trust) {
    var lv = 0;
    npc.tiers.forEach(function (t) { if (trust >= t) lv++; });
    return lv;
  }
  function gainTrust(id, n) {
    var npc = npcDef(id);
    if (!npc) return;
    var rel = S.relationships[id] || { trust: 0 };
    var before = npcLevel(npc, rel.trust);
    rel.trust = Math.max(0, rel.trust + n);
    S.relationships[id] = rel;
    var after = npcLevel(npc, rel.trust);
    if (after > before) {
      log('🤝 ' + npc.name + '（' + npc.title + '）好感升至 ' + rel.trust + '：' + npc.perks[after - 1], 'l-gold');
      toast('🤝 ' + npc.name + ' 关系升温');
      pushHistory('🤝 与' + npc.name + '的关系更进一步（好感 ' + rel.trust + '）');
      if (id === 'pill' && after >= 1) {
        S.flags.pillBuff = (S.flags.pillBuff || 0) + 1;
        log('💊 温九塞给你一枚回春丹：下一单餐损减半。', 'l-gold');
      }
    }
  }

  /* ---------------- 门派悬赏（滚动任务） ---------------- */
  function questDef(id) {
    return DATA.QUESTS.find(function (d) { return d.id === id; });
  }
  function ensureQuests() {
    if (!Array.isArray(S.quests)) S.quests = [];
    S.quests = S.quests.filter(function (q) { return questDef(q.id); });
    var lv = level();
    var pool = DATA.QUESTS.filter(function (d) {
      return (!d.minLv || d.minLv <= lv) && !S.quests.some(function (q) { return q.id === d.id; });
    });
    while (S.quests.length < 3 && pool.length) {
      var d = pick(pool);
      pool = pool.filter(function (x) { return x !== d; });
      S.quests.push({ id: d.id, prog: 0 });
    }
  }
  function questProgress(key, n, absolute) {
    ensureQuests();
    var changed = false;
    S.quests.forEach(function (q) {
      var d = questDef(q.id);
      if (!d || d.key !== key || q.prog >= d.target) return;
      q.prog = absolute ? Math.max(q.prog, Math.min(d.target, n)) : Math.min(d.target, q.prog + (n || 1));
      if (q.prog >= d.target) {
        changed = true;
        var rw = d.reward || {};
        if (rw.ds) S.stones += rw.ds;
        if (rw.dm) S.merit += rw.dm;
        if (rw.dl) S.luck = clamp(S.luck + rw.dl, 0, 100);
        if (rw.dr) S.resolve = clamp(S.resolve + rw.dr, 0, 100);
        S.flags.questsDone = (S.flags.questsDone || 0) + 1;
        log('📜 悬赏完成「' + d.name + '」：灵石 +' + (rw.ds || 0) + '、功德 +' + (rw.dm || 0) + '！', 'l-gold');
        toast('📜 悬赏完成 · ' + d.name);
        pushHistory('📜 完成门派悬赏「' + d.name + '」');
        if (S.flags.questsDone >= 10) unlockAch('quest10');
      }
    });
    // 三张全部完成 → 全勤奖 + 换新一批
    if (S.quests.length === 3 && S.quests.every(function (q) {
      var d = questDef(q.id);
      return d && q.prog >= d.target;
    })) {
      S.quests = [];
      S.stones += 50;
      changed = true;
      log('📜 三张悬赏全部完成！门派发了 50 灵石全勤奖，新悬赏已贴出。', 'l-gold');
      ensureQuests();
    }
    if (changed) { save(); if (activeTab === 'orders' && !delivery) renderOrders(); }
  }

  /* ---------------- 骑手自动化 ---------------- */
  function riderCost() { return Math.round(DATA.RIDERS.baseCost * Math.pow(DATA.RIDERS.costMul, S.riders)); }
  function autoArea() { return Math.min(1 + S.dispatch, DATA.AREAS.length - 1); }
  function autoPay() {
    var a = DATA.AREAS[autoArea()];
    var eff = autoArea() <= 1 ? DATA.RIDERS.efficiency : DATA.DISPATCH[autoArea() - 2].eff;
    return Math.max(1, Math.round((a.payMin + a.payMax) / 2 * eff));
  }
  function completeAutoOrders(n) {
    if (n <= 0) return;
    var gain = autoPay() * n;
    var prev = S.flags.autoOrders || 0;
    S.stones += gain;
    S.flags.autoOrders = prev + n;
    if (Math.floor(prev / 25) < Math.floor(S.flags.autoOrders / 25)) {
      log('🐣 小弟们已累计代送 ' + S.flags.autoOrders + ' 单（ +' + gain + ' 灵石入账）。', 'l-sys');
    }
  }

  /* ---------------- 宿敌榜 ---------------- */
  function rivalScore() { return Math.floor(S.flags.rivalScore || 0); }
  function playerScore() {
    return S.total * 2 + (S.flags.autoOrders || 0) + S.fiveStar * 3 + Math.floor(S.merit / 10);
  }

  /* ---------------- 日志 / 提示 ---------------- */
  function log(msg, cls) {
    var el = $('#log');
    var line = document.createElement('div');
    if (cls) line.className = cls;
    line.textContent = msg;
    el.appendChild(line);
    while (el.children.length > 120) el.removeChild(el.firstChild);
    el.scrollTop = el.scrollHeight;
  }
  var toastTimer = null;
  function toast(msg) {
    var t = $('#toast');
    t.textContent = msg;
    t.classList.remove('hidden');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.add('hidden'); }, 2600);
  }
  function pushHistory(txt) {
    META.history.unshift(txt);
    META.history = META.history.slice(0, 40);
  }

  /* ---------------- 成就 ---------------- */
  function unlockAch(id) {
    if (S.achievements.indexOf(id) >= 0) return;
    var a = DATA.ACHIEVEMENTS.find(function (x) { return x.id === id; });
    if (!a) return;
    S.achievements.push(id);
    toast('成就解锁 · ' + a.name);
    log('🏅 成就「' + a.name + '」达成！', 'l-gold');
    save();
  }
  function checkAchievements() {
    if (S.total >= 1) unlockAch('first');
    if (S.total >= 50) unlockAch('orders50');
    if (S.total >= 200) unlockAch('orders200');
    if (S.fiveStar >= 30) unlockAch('five30');
    if (S.goodStreak >= 10) unlockAch('streak10');
    if (S.mount >= DATA.MOUNTS.length - 1) unlockAch('allmounts');
    if (S.merit >= 500) unlockAch('merit500');
    if (S.stones >= 5000) unlockAch('rich');
    if ((S.flags.demonServed || 0) >= 1) unlockAch('demon1');
    if (S.riders >= 1) unlockAch('hire1');
    if ((S.flags.butterflies || 0) >= 5) unlockAch('butterfly5');
    if (regularCount() >= 3) unlockAch('regular3');
    if (S.flags.trial4 || S.flags.trial6 || S.flags.trial8) unlockAch('trialpass');
  }

  /* ---------------- 订单生成 ---------------- */
  function baseTime(order) { return 10 + DATA.AREAS[order.area].dist * 10; }

  function genOrder(forceSpecial) {
    var lv = level();
    var avail = unlockedAreas();
    var weights = avail.map(function (i) { return 1 + i * 1.2; });
    var sum = weights.reduce(function (a, b) { return a + b; }, 0);
    var r = Math.random() * sum, areaIdx = avail[0];
    for (var i = 0; i < avail.length; i++) {
      r -= weights[i];
      if (r <= 0) { areaIdx = avail[i]; break; }
    }
    var area = DATA.AREAS[areaIdx];

    var sp = null;
    for (var j = 0; j < DATA.SPECIALS.length; j++) {
      var cand = DATA.SPECIALS[j];
      if (lv >= cand.minLv && cand.areas.indexOf(areaIdx) >= 0 && Math.random() < cand.chance) { sp = cand; break; }
    }
    if (forceSpecial) sp = forceSpecial;

    var customer;
    var npcId = null;
    if (!sp && Math.random() < 0.06) {
      // 招牌 NPC 亲自下单
      var cands = DATA.NPCS.filter(function (n) {
        return (n.id === 'sword' || n.id === 'pill') && DATA.AREAS[n.area].lv <= lv;
      });
      if (cands.length) {
        var npc = pick(cands);
        customer = npc.name;
        npcId = npc.id;
      }
    }
    if (sp && sp.customer) {
      customer = sp.customer;
    } else if (!customer) {
      var pool = [];
      DATA.CUSTOMERS.forEach(function (row, idx) {
        if (idx === areaIdx) for (var k = 1; k < row.length; k++) pool.push(row[k]);
      });
      customer = pick(pool);
    }

    var pay = rnd(area.payMin, area.payMax) * (sp ? sp.payMul : 1);
    var limit = Math.ceil((10 + area.dist * 10) * (1.15 + Math.random() * 0.4) * difficulty().limitMul * (sp ? sp.timeMul : 1));

    var rg = regulars()[customer];
    var isRegular = !!(rg && rg.good >= 3);
    if (isRegular) pay *= 1.3;
    // 剑修急单：沈孤鸿好感 3+ 后他的单报酬 ×1.8、时限 ×0.8
    var swordRush = npcId === 'sword' && relOf('sword').trust >= 3;
    if (swordRush) {
      pay *= 1.8;
      limit = Math.ceil(limit * 0.8);
    }

    return {
      id: Date.now() + '_' + Math.random().toString(36).slice(2, 7),
      customer: customer,
      food: pick(DATA.FOODS),
      area: areaIdx,
      pay: Math.round(pay),
      limit: limit,
      special: sp ? sp.id : null,
      npc: npcId,
      regular: isRegular,
      note: sp ? sp.note : (swordRush ? '🗡️ 剑修急单：报酬 ×1.8，时限更紧，师兄等着练剑前用膳。' : npcId ? '🤝 招牌人物的单：好评可提升你们的关系。' : isRegular ? '❤️ 熟客单：报酬 +30%，送达必有小费。' : null),
    };
  }

  function makeTrialOrder(gate) {
    var tr = DATA.TRIALS.find(function (t) { return t.gate === gate; });
    var area = DATA.AREAS[tr.area];
    return {
      id: 'trial_' + gate + '_' + Date.now(),
      customer: tr.customer,
      food: tr.food,
      area: tr.area,
      pay: Math.round((area.payMin + area.payMax) / 2 * 1.5),
      limit: Math.ceil((10 + area.dist * 10) * 1.5),
      special: 'trial',
      trial: gate,
      regular: false,
      note: '⚔️ ' + tr.title + '：' + tr.desc + '。好评送达即完成试炼，可突破至「' + DATA.LEVELS[gate - 1].title + '」！',
    };
  }

  function refillOrders() {
    var gate = pendingGate();
    while (orders.length < orderSlots()) orders.push(genOrder());
    if (gate && !orders.some(function (o) { return o.trial; })) {
      orders[orders.length - 1] = makeTrialOrder(gate);
    }
    save();
  }

  /* ---------------- 配送流程 ---------------- */
  function startOrder(id) {
    if (delivery) return;
    var order = orders.find(function (o) { return o.id === id; });
    if (!order) return;
    var w = currentWeather();
    var choices = DATA.ROUTES.map(function (route) {
      var st = routeStats(route);
      var est = Math.ceil(baseTime(order) * st.time / speed());
      var risky = est > order.limit * timeMul();
      return {
        t: route.ico + ' ' + route.name + (st.boosted ? ' ✨' : ''),
        hint: route.desc + ' 预计 ' + est + 's' + (risky ? '（可能超时！）' : '') +
          ' · 事件密度 ×' + st.event.toFixed(1) + ' · 报酬 ×' + st.pay.toFixed(2),
        run: function () { closeModal(); beginDelivery(id, route.id); },
      };
    });
    choices.push({ t: '再想想', hint: '不着急，货比三家', run: closeModal });
    openModal('🗺️ 择路而行', '给「' + order.customer + '」送「' + order.food + '」（' + DATA.AREAS[order.area].name + '，时限 ' + Math.ceil(order.limit * timeMul()) + 's）\n\n当前天机：' + w.ico + ' ' + w.name + '——' + w.desc, choices);
  }

  function beginDelivery(id, routeId) {
    if (delivery) return;
    var idx = orders.findIndex(function (o) { return o.id === id; });
    if (idx < 0) return;
    var order = orders.splice(idx, 1)[0];
    order.limit = Math.ceil(order.limit * timeMul());
    var route = routeDef(routeId) || DATA.ROUTES[0];
    var st = routeStats(route);
    order.pay = Math.max(1, Math.round(order.pay * st.pay));

    var expect = baseTime(order) * st.time / speed();
    var baseEvt = order.area <= 1 ? rnd(0, 1) : order.area <= 2 ? rnd(1, 2) : rnd(1, 3);
    var nEvt = clamp(Math.round(baseEvt * st.event * difficulty().eventMul), 0, 4);
    var fracs = [];
    for (var i = 0; i < nEvt; i++) fracs.push(0.18 + Math.random() * 0.64);
    fracs.sort(function (a, b) { return a - b; });

    var safeMode = S.buffs.safeNext > 0;
    S.buffs.safeNext = 0;
    var pill = (S.flags.pillBuff || 0) > 0;
    if (pill) S.flags.pillBuff--;

    delivery = {
      order: order,
      route: route.id,
      start: Date.now(),
      speedAtStart: speed(),
      paused: 0,
      pauseStart: 0,
      expect: expect,
      integrity: 100,
      events: fracs,
      fired: 0,
      eventHurtMul: (1 - 0.2 * S.box.seal) * (pill ? 0.5 : 1),
      safeMode: safeMode,
      pill: pill,
      mana: 100,
      cds: {},
      yufengUntil: 0,
      shield: false,
      stealth: false,
    };
    S.meditating = false;
    bumpPersonality(route.pers, 1);
    var ru = S.flags.routeUse || {};
    ru[route.id] = (ru[route.id] || 0) + 1;
    S.flags.routeUse = ru;
    countDecision();
    if (!S.flags.tipFirst) {
      S.flags.tipFirst = 1;
      log('💡 第一单上路：顶部进度条走完即送达；途中会跳出变故弹窗，抉择影响餐品完整度与耗时。配送暂停于弹窗期间，放心慢慢选。', 'l-sys');
    }
    guideAdvance('accept');

    log('📦 接单：给' + order.customer + '送「' + order.food + '」（' + DATA.AREAS[order.area].name + ' · ' + route.name + '，时限 ' + order.limit + 's）', 'l-evt');
    if (safeMode) log('🛡️ 平安符生效：本单餐品零损耗。', 'l-good');
    if (pill) log('💊 回春丹的温气护住餐箱：本单餐损减半（存 ' + (S.flags.pillBuff || 0) + ' 枚）。', 'l-good');
    refillOrders();
    render();
  }

  function elapsed(d) {
    var pauseTotal = d.paused + (d.pauseStart ? Date.now() - d.pauseStart : 0);
    return (Date.now() - d.start - pauseTotal) / 1000;
  }

  function eff(res) {
    var d = delivery;
    if (res.di !== undefined && d) {
      var di = res.di;
      if (di < 0) {
        if (d.shield) { d.shield = false; di = 0; res.log = (res.log || '') + '（镇食诀挡下了餐损）'; }
        else if (d.safeMode) { di = 0; res.log = (res.log || '') + '（平安符挡下了餐损）'; }
        else di = Math.round(di * (d.eventHurtMul || 1) * (1 - 0.15 * S.arts.hutu));
      }
      d.integrity = clamp(d.integrity + di, 0, 100);
    }
    if (res.dt && d) d.expect = Math.max(5, d.expect + res.dt); // 耗时增减=剩余行程增减：省时进度前跳，耗时增速放缓（v2.4.3 修正符号）
    if (res.ds) S.stones = Math.max(0, S.stones + res.ds);
    if (res.dm) S.merit = Math.max(0, S.merit + res.dm);
    if (res.dl) S.luck = clamp(S.luck + res.dl, 0, 100);
    if (res.dr) S.resolve = clamp(S.resolve + res.dr, 0, 100);
    if (res.log) log(res.log, res.cls || 'l-sys');
    if (res.instant) setTimeout(function () { if (delivery) finishDelivery(); }, 80);
    return res;
  }

  /* ---------------- 事件摇号（多结果 · 属性偏移） ---------------- */
  function rollOutcome(ch, ctx) {
    var outs = ch.outs;
    var luckF = 0.7 + S.luck / 100;              // 气运 50 → 1.2；100 → 1.7；0 → 0.7
    var badF = 1.3 - S.luck / 150;               // 气运 50 → 0.97；100 → 0.63；0 → 1.3
    var ji2 = S.arts.shenshi >= 2 ? 1.25 : 1;    // 灵眸 2 级：逢凶化吉
    var ws = outs.map(function (o) {
      var w = o.w;
      if (o.good) w *= luckF * ji2;
      if (o.bad) w *= badF / ji2;
      return w;
    });
    var sum = ws.reduce(function (a, b) { return a + b; }, 0);
    var r = Math.random() * sum, out = outs[outs.length - 1];
    for (var i = 0; i < outs.length; i++) {
      r -= ws[i];
      if (r <= 0) { out = outs[i]; break; }
    }
    if (out.set) {
      Object.keys(out.set).forEach(function (k) { S.flags[k] = out.set[k]; });
    }
    var res = out.run ? out.run(ctx) : (out.res || {});
    eff(res);
    if (out.good) questProgress('evtgood', 1);
  }

  function triggerEvent() {
    var d = delivery;
    S.__lv = level();
    var ctx = { s: S, order: d.order, eff: eff };
    var recent = S.flags.recentEvents || [];
    var p = S.personality || {};
    // 人格偏移：善良者多遇求助，精明者多遇商机，冒险者多遇险境——世界开始认识你
    function persFactor(e) {
      if (!e.tags) return 1;
      var f = 1;
      e.tags.forEach(function (tag) {
        if (tag === 'kind') f *= 1 + 0.03 * (p.kindness || 0);
        else if (tag === 'biz') f *= 1 + 0.03 * (p.business || 0);
        else if (tag === 'danger') f *= 1 + 0.03 * (p.adventure || 0);
        else if (tag === 'wild') f *= 1 + 0.015 * (p.adventure || 0);
      });
      return Math.min(f, 2);
    }
    function evtWeight(e) {
      return e.w * (recent.indexOf(e.id) >= 0 ? 0.15 : 1) * persFactor(e);
    }
    var pool = DATA.EVENTS.filter(function (e) {
      return e.areas.indexOf(d.order.area) >= 0 && (!e.cond || e.cond(ctx));
    });
    // 事件冷却：最近 4 个出现过的事件降权，避免连续重复
    var totalW = pool.reduce(function (a, e) { return a + evtWeight(e); }, 0);
    var r = Math.random() * totalW, evt = pool[0];
    for (var i = 0; i < pool.length; i++) {
      r -= evtWeight(pool[i]);
      if (r <= 0) { evt = pool[i]; break; }
    }
    recent.push(evt.id);
    S.flags.recentEvents = recent.slice(-4);

    // 遁影诀：变故化为「暗中观察」——不参与事件本身，因果标记也不消耗
    if (d.stealth) {
      d.stealth = false;
      countDecision();
      openModal('🫥 暗中观察',
        '你隐去身形，远远望见前方——「' + evt.title + '」。\n' + evt.text,
        [
          { t: '悄悄绕开', hint: '耗时 +3s · 安然无恙', run: function () {
            eff({ dt: 3, log: '你隐在暗处等风波平息，悄然绕开了「' + evt.title + '」。', cls: 'l-sys' });
            closeModal(); save(); render();
          } },
          { t: '伺机而动', hint: '赌一把 · 或有旁观者红利', run: function () {
            var r = Math.random();
            if (r < 0.4) eff({ ds: rnd(15, 35), log: '你趁乱摸到些好处——「' + evt.title + '」的旁观者红利。', cls: 'l-gold' });
            else if (r < 0.7) eff({ dr: 3, log: '你静观风波起落，道心微有领悟。', cls: 'l-good' });
            else eff({ di: -5, log: '你被发现了！仓促脱身，餐箱晃了一下。', cls: 'l-bad' });
            closeModal(); checkAchievements(); save(); render();
          } },
        ]);
      log('🫥 遁影诀生效：你暗中观察了「' + evt.title + '」。', 'l-evt');
      return;
    }

    // 因果链事件触发一次后清除标记，不会反复刷出
    if (evt.flag) S.flags[evt.flag] = 0;
    // 劫修报恩后，铁牛加入人脉（魔修峡谷护航）
    if (evt.id === 'robberReturn') gainTrust('biao', 1);

    var choices = evt.choices
      .filter(function (ch) { return !ch.cond || ch.cond(ctx); })
      .map(function (ch) {
        return {
          t: ch.t, hint: ch.hint,
          run: function () {
            countDecision();
            if (ch.pers) bumpPersonality(ch.pers, 1);
            if (ch.outs) rollOutcome(ch, ctx);
            else if (ch.run) { var res = ch.run(ctx); if (res) eff(res); }
            closeModal();
            checkAchievements();
            save();
            render();
          },
        };
      });

    // 灵眸 1 级：消耗道心的绕路（成功率随连用递减）
    if (S.arts.shenshi >= 1) {
      var cost = hasBuild('风行剑送流') ? 6 : 8;
      var dc = dodgeChance();
      choices.unshift({
        t: '👁️ 灵眸绕路',
        hint: S.resolve >= cost
          ? '消耗 ' + cost + ' 道心 · 当前成功率 ' + dc + '%（连续使用递减，失败遭反噬）'
          : '道心不足（需 ' + cost + ' 道心，打坐/好评可回复）',
        run: function () {
          if (S.resolve < cost) { toast('道心不足，灵眸无法施展'); return; }
          S.resolve -= cost;
          S.flags.dodges = (S.flags.dodges || 0) + 1;
          if (Math.random() * 100 < dc) {
            eff({ dt: 4, log: '灵眸微光一闪，你提前绕开了这场麻烦（道心 -' + cost + '）。', cls: 'l-good' });
          } else {
            eff({ di: -5, log: '灵眸被识破！对方冷笑：「雕虫小技。」（道心 -' + cost + '）', cls: 'l-bad' });
          }
          closeModal();
          save();
          render();
        },
      });
    }

    // 情报揭示：灵眸 1 级起可见事件内幕（灵眸 3 级或气运 70+ 看得更透）
    var evtText = evt.text;
    if (evt.intel && S.arts.shenshi >= 1) {
      var clearView = S.arts.shenshi >= 3 || S.luck >= 70;
      evtText += '\n\n👁️ ' + (clearView ? '灵眸观察：' + evt.intel : '灵眸微光一闪，你隐约觉得此事另有玄机……（灵眸 3 级或气运 70 可看清）');
    }
    if (!S.flags.tipEvent) {
      S.flags.tipEvent = 1;
      evtText = '【第一次遇到变故】你的抉择会影响餐品完整度与耗时，进而决定星级评价；选项下的灰字是后果提示。修炼「灵眸」后还能看破事件内幕。\n\n' + evtText;
    }
    openModal('⚠️ ' + evt.title, evtText, choices);
    log('⚠️ 途中变故：' + evt.title, 'l-evt');
  }

  function finishDelivery() {
    var d = delivery;
    delivery = null;
    var o = d.order;
    var late = elapsed(d) > o.limit;
    var ig = Math.round(d.integrity);

    var stars;
    if (ig >= 85) stars = 5;
    else if (ig >= 70) stars = 4;
    else if (ig >= 55) stars = 3;
    else if (ig >= 40) stars = 2;
    else stars = 1;
    if (late) stars = Math.min(stars, 3);

    var good = stars >= 4 && !late;
    var bad = stars <= 2 || late;

    var heat = S.flags.heat || 0;
    var heatCap = hasBuild('赏金急脚流') ? 0.35 : 0.25; // 流派加成：连击封顶 25%→35%
    var heatMul = 1 + Math.min(heat * 0.05, heatCap); // 五星连击：每连 +5% 报酬
    var pay = o.pay * (0.4 + ig / 160) * (stars >= 4 ? 1.2 : stars === 3 ? 0.9 : 0.6) * payMul() * heatMul * difficulty().payMul;
    pay = Math.max(1, Math.round(pay));
    var tip = 0;
    var tipChance = 0.15 + 0.12 * S.arts.dianjin + (hasBuild('因果商人流') ? 0.15 : 0);
    if (good && (o.regular || Math.random() < tipChance)) {
      tip = Math.round(o.pay * (0.2 + Math.random() * 0.4));
      if (hasBuild('因果商人流')) tip = Math.round(tip * 1.25);
    }

    var meritGain = 0;
    if (good) meritGain = 3 + o.area + (o.special === 'bigshot' ? 10 : 0) + (o.special === 'demon' ? 8 : 0);
    var expGain = 8 + o.area * 5 + (good ? 4 : 0) + (o.special ? 10 : 0);

    S.stones += pay + tip;
    S.merit += meritGain;
    S.exp += expGain;
    S.total++;

    var starStr = '★★★★★'.slice(0, stars) + '☆☆☆☆☆'.slice(0, 5 - stars);
    if (good) {
      S.good++; S.goodStreak++; S.badStreak = 0;
      if (stars === 5) {
        S.fiveStar++;
        S.luck = clamp(S.luck + 1, 0, 100);
        S.flags.heat = heat + 1;
        if (S.flags.heat >= 2) log('🔥 五星连击 ×' + S.flags.heat + '！报酬加成 +' + Math.min(S.flags.heat * 5, Math.round(heatCap * 100)) + '%', 'l-gold');
        if (S.flags.heat >= 5) unlockAch('heat5');
      }
      S.resolve = clamp(S.resolve + 2, 0, 100);
      log('✅ 送达！' + starStr + ' 好评 +' + pay + ' 灵石' + (tip ? '（小费 +' + tip + '）' : '') + '，功德 +' + meritGain, 'l-good');
      if (o.special === 'demon') {
        S.flags.demonServed = (S.flags.demonServed || 0) + 1;
        S.flags.demonCount = (S.flags.demonCount || 0) + 1;
        if (S.flags.demonCount >= 3) log('🌙 魔尊似乎对你另眼相看了……', 'l-gold');
      }
    } else if (bad) {
      S.bad++; S.badStreak++; S.goodStreak = 0;
      S.flags.heat = 0;
      if (hasBuild('不动明王流')) {
        S.resolve = clamp(S.resolve - 2, 0, 100);
        S.luck = clamp(S.luck - 1, 0, 100);
      } else {
        S.resolve = clamp(S.resolve - 4, 0, 100);
        S.luck = clamp(S.luck - 2, 0, 100);
      }
      log('❌ 差评！' + starStr + (late ? '（超时）' : '') + ' 仅得 ' + pay + ' 灵石。' + o.customer + '扬言要给你点颜色看看。', 'l-bad');
    } else {
      S.goodStreak = 0; S.badStreak = 0;
      S.flags.heat = 0;
      log('😐 送达，' + starStr + ' 对方没给评价。+' + pay + ' 灵石。', 'l-sys');
    }

    // 门派悬赏进度
    questProgress('deliver', 1);
    if (good && stars === 5) questProgress('five', 1);
    if (good && o.area >= 3) questProgress('far', 1);
    if (!late && ig >= 90) questProgress('perfect', 1);
    if (tip > 0) questProgress('tip', 1);
    questProgress('streak', S.goodStreak, true);

    // 史册
    pushHistory((good ? '✅' : bad ? '❌' : '😐') + ' ' + DATA.AREAS[o.area].name + ' · ' + o.customer + ' ' + starStr + ' +' + (pay + tip) + ' 灵石');

    // 熟客好感累积
    var rgMap = S.flags.regulars || {};
    var wasRegular = !!(rgMap[o.customer] && rgMap[o.customer].good >= 3);
    var rg = rgMap[o.customer] || { n: 0, good: 0 };
    rg.n++;
    if (good) rg.good++;
    rgMap[o.customer] = rg;
    S.flags.regulars = rgMap;
    if (!wasRegular && rg.good >= 3) {
      log('❤️ ' + o.customer + '把你当成了熟客！以后他的单报酬 +30%，小费管够。', 'l-gold');
    }

    // NPC 人脉：招牌人物的单影响关系
    var npcId = o.npc || (o.special === 'demon' ? 'demon' : null);
    if (npcId) {
      if (good) gainTrust(npcId, stars === 5 ? 2 : 1);
      else if (bad) gainTrust(npcId, -1);
    }
    // 温九好感 8+：每 10 次好评赠一枚回春丹
    if (good && relOf('pill').trust >= 8) {
      S.flags.pillCounter = (S.flags.pillCounter || 0) + 1;
      if (S.flags.pillCounter % 10 === 0) {
        S.flags.pillBuff = (S.flags.pillBuff || 0) + 1;
        log('💊 温九又寄来一枚回春丹（存 ' + S.flags.pillBuff + ' 枚）。', 'l-gold');
      }
    }

    // 试炼判定
    if (o.trial && good) {
      S.flags['trial' + o.trial] = 1;
      log('⚔️ 试炼通过！「' + DATA.LEVELS[o.trial - 1].title + '」之境为你敞开，新区域/装备解锁！', 'l-gold');
      toast('⚔️ 试炼通过 · ' + DATA.LEVELS[o.trial - 1].title);
    } else if (o.trial && !good) {
      log('⚔️ 试炼失败……接引者摇了摇头。试炼单会再次出现，备好状态再来。', 'l-bad');
    }

    // 传奇事件（分层 · 命格修正：气运/功德/人格越厚，概率越高）
    var fateP = Math.min(0.003, 0.0001 * (1 + S.luck / 50 + S.merit / 500 + personalityTotal() / 100));
    var legendP = 0.001 * (1 + S.luck / 100);
    var wonderP = 0.01 * (1 + S.luck / 200);
    var roll = Math.random();
    if (roll < fateP) {
      META.marks++;
      log('🌟🌟🌟 天命订单！你送的这一单，改变了修仙界的历史——天道降下金旨：永久天赋印记 +1！', 'l-gold');
      toast('🌟 天命订单 · 天道印记 +1');
      pushHistory('🌟 天命订单：天道印记 +1（第 ' + S.run + ' 世）');
      unlockAch('fate1');
    } else if (roll < fateP + legendP) {
      if (Math.random() < 0.5) {
        S.stones += 500;
        log('✨ 小传奇！客人竟是微服的长老，一出手就是 500 灵石打赏！', 'l-gold');
      } else {
        S.merit += 50;
        log('✨ 小传奇！你的善举被路过的游仙记入《功德异闻录》：功德 +50！', 'l-gold');
      }
      pushHistory('✨ 小传奇降临');
    } else if (roll < fateP + legendP + wonderP) {
      var egg = Math.random();
      if (egg < 0.4) {
        S.exp += 100; S.merit += 30;
        log('🥚 奇遇！餐箱夹层里掉出一页《配送真经》，你顿悟了：经验 +100，功德 +30！', 'l-gold');
      } else if (egg < 0.75) {
        S.stones += 200;
        log('🥚 奇遇！天降灵石雨，你张开餐箱接了满满一箱：灵石 +200！', 'l-gold');
      } else {
        S.luck = clamp(S.luck + 10, 0, 100);
        S.resolve = clamp(S.resolve + 20, 0, 100);
        log('🥚 奇遇！一道七彩霞光落在你头顶：气运 +10，道心 +20！', 'l-gold');
      }
    }

    // 区域首送成就
    if (o.area >= 3) unlockAch('area4');
    if (o.area >= 4) unlockAch('area5');

    guideAdvance('deliver');

    // 修罗道成就（v2.4.2）
    if (difficulty().id === 'hard') {
      S.flags.hardOrders = (S.flags.hardOrders || 0) + 1;
      if (S.flags.hardOrders >= 30) unlockAch('hard30');
    }

    // 境界提升提示
    var lvBefore = S.flags.lastLevel || 1;
    var lvNow = level();
    if (lvNow > lvBefore) {
      log('🎉 境界突破！你已是「' + levelTitle() + '」！', 'l-gold');
      toast('境界突破 · ' + levelTitle());
      S.flags.lastLevel = lvNow;
    }

    checkAchievements();
    save();
    render();

    // 失败剧情（25%）→ 渡劫（Lv.3 起）→ 天谴 → 魔尊结局链，按时序排队
    var proceed = function () {
      if (lvNow > lvBefore && lvNow >= 3) {
        pendingWrath = S.badStreak >= 3;
        showTribulation(lvNow);
      } else if (S.badStreak >= 3) {
        showWrath();
      } else {
        checkDemonEnding();
      }
    };
    var fs = pickFailureStory(late, bad);
    if (fs) setTimeout(function () { showFailureStory(fs, proceed); }, 350);
    else setTimeout(proceed, 350);
  }

  /* ---------------- 失败剧情（失败也是内容） ---------------- */
  function pickFailureStory(late, bad) {
    if (!late && !bad) return null;
    if (Math.random() > 0.25) return null;
    var pool = DATA.FAILURES.filter(function (f) {
      return (f.when === 'late' && late) || (f.when === 'bad' && bad);
    });
    if (!pool.length) return null;
    var total = pool.reduce(function (a, f) { return a + f.w; }, 0);
    var r = Math.random() * total;
    for (var i = 0; i < pool.length; i++) { r -= pool[i].w; if (r <= 0) return pool[i]; }
    return pool[pool.length - 1];
  }
  function showFailureStory(f, next) {
    var rawChoices = f.choices || [{ t: '擦擦餐箱，继续赶路', res: f.res, set: f.set }];
    var choices = rawChoices.map(function (ch) {
      return {
        t: ch.t, hint: ch.hint,
        run: function () {
          if (ch.pers) bumpPersonality(ch.pers, 1);
          if (ch.set) Object.keys(ch.set).forEach(function (k) { S.flags[k] = ch.set[k]; });
          if (ch.res) eff(ch.res);
          closeModal();
          save();
          render();
          next();
        },
      };
    });
    openModal('📖 ' + f.title, f.text, choices);
  }

  /* ---------------- 渡劫仪式 ---------------- */
  function showTribulation(lv) {
    var choices = [
      { t: '💪 硬抗天雷', hint: '赌！成则功德 +15、灵石 +80，败则 -60 灵石（身法提高胜率）', run: function () {
        var p = 0.55 + S.arts.shenfa * 0.1;
        if (Math.random() < p) {
          S.merit += 15; S.stones += 80;
          log('⚡ 你硬抗三道天雷毫发无损，天道叹服：功德 +15，灵石 +80！', 'l-gold');
        } else {
          var loss = Math.min(S.stones, 60);
          S.stones -= loss;
          log('⚡ 天雷把你劈成了爆炸头，灵石 -' + loss + '。好在境界还是突破了。', 'l-bad');
        }
        afterTribulation();
      } },
      { t: '💰 孝敬雷神', hint: '-60 灵石 · 功德 +10 + 神速 60s', run: function () {
        var cost = Math.min(S.stones, 60);
        S.stones -= cost;
        S.merit += 10;
        S.buffs.speedUntil = Date.now() + 60000;
        log('⚡ 雷神掂了掂你的灵石，点了点头：功德 +10，赐你 60 秒神速。', 'l-gold');
        afterTribulation();
      } },
      { t: '🙏 顺其自然', hint: '无奖无惩 · 道心 +5', run: function () {
        S.resolve = clamp(S.resolve + 5, 0, 100);
        log('⚡ 你盘坐受劫，雷过天晴，心如止水。道心 +5。', 'l-sys');
        afterTribulation();
      } },
    ];
    if (S.arts.hutu >= 1) {
      choices.splice(1, 0, { t: '🛡️ 金钟护体', hint: '金钟罩渡劫 · 稳妥功德 +8', run: function () {
        S.merit += 8;
        log('⚡ 金钟罩嗡鸣一声，天雷绕道而走。功德 +8。', 'l-good');
        afterTribulation();
      } });
    }
    openModal('⚡ 渡劫 · 突破「' + DATA.LEVELS[lv - 1].title + '」',
      '你的修为引来了劫云。渡得好，天道有奖；渡不好……也就是劈一下的事。\n\n选择你的渡劫方式：',
      choices);
  }
  function afterTribulation() {
    closeModal();
    save();
    render();
    if (pendingWrath) {
      pendingWrath = false;
      setTimeout(showWrath, 350);
    } else {
      checkDemonEnding();
    }
  }

  function showWrath() {
    if ((S.flags.wrathShield || 0) > 0) {
      S.flags.wrathShield--;
      S.badStreak = 0;
      log('🛡️ 天道庇护发动：劫云凝聚了一半，又悻悻散去。本次天谴免疫！', 'l-gold');
      toast('天道庇护 · 天谴免疫');
      checkDemonEnding();
      save();
      render();
      return;
    }
    var dwr = difficulty();
    var loss = Math.ceil(S.stones * dwr.wrathLoss);
    S.stones -= loss;
    S.merit = Math.max(0, S.merit - dwr.wrathMerit);
    S.luck = clamp(S.luck - 5, 0, 100);
    S.badStreak = 0;
    unlockAch('wrath');
    log('⚡ 天谴降临！灵石 -' + loss + '，功德 -' + dwr.wrathMerit + '，气运 -5。', 'l-bad');
    openModal('⚡ ' + DATA.WRATH.title, DATA.WRATH.text, [
      { t: '默默扶起餐箱，继续送单', run: function () { closeModal(); checkDemonEnding(); save(); render(); } },
    ]);
    save();
    render();
  }

  /* ---------------- 结局 ---------------- */
  function endingAvailable(id) {
    if (S.endings.indexOf(id) >= 0) return false;
    if (id === 'home') return S.stones >= 6666 && level() >= 6;
    if (id === 'tycoon') {
      var rate = goodRate();
      return S.stones >= 9999 && rate !== null && rate >= 85 && S.total >= 80;
    }
    if (id === 'ascend') return S.merit >= 1000;
    if (id === 'demon') return (S.flags.demonCount || 0) >= 3;
    return false;
  }
  function checkDemonEnding() {
    if (endingAvailable('demon')) doEnding('demon');
  }
  function doEnding(id) {
    var e = DATA.ENDINGS.find(function (x) { return x.id === id; });
    if (!e) return;
    if (id === 'home') S.stones -= 6666;
    if (id === 'tycoon') S.stones -= 9999;
    S.endings.push(id);
    S.flags.lifeEndings = (S.flags.lifeEndings || 0) + 1;
    unlockAch('ending');
    log('📜 达成结局：' + e.name, 'l-gold');
    openModal('📜 ' + e.name, e.text + '\n\n—— 第 ' + S.run + ' 世 · 完 ——', [
      { t: '♻️ 进入轮回（结算天道印记，下一世速度 +5%）', run: reincarnate },
      { t: '继续这一世（自由模式）', run: function () { closeModal(); save(); render(); } },
    ]);
    save();
    render();
  }
  function reincarnate() {
    var earned = 1 + (S.flags.lifeEndings || 0) + Math.floor(S.total / 100);
    META.marks += earned;

    var legacy = Math.min(0.5, S.legacySpeed + 0.05);
    var keepRegulars = tLv('bond') >= 1 ? (S.flags.regulars || {}) : null;

    S = freshState(S.run + 1, legacy, S.achievements, S.endings);
    S.stones += 150 * tLv('wealth');
    if (tLv('scout') >= 1) S.riders = 1;
    S.flags.wrathShield = tLv('shield');
    if (keepRegulars) S.flags.regulars = keepRegulars;

    delivery = null;
    orders = [];
    riderAcc = 0;
    pendingWrath = false;
    refillOrders();
    log('♻️ 第 ' + S.run + ' 世开始了。你带着一丝前世记忆——跑得比上一世快了一点。', 'l-gold');
    log('🌀 天道结算：获得 ' + earned + ' 枚天道印记（现有 ' + META.marks + ' 枚，可在「修炼」页兑换轮回天赋）。', 'l-gold');
    if (tLv('scout') >= 1) log('🐣 伯乐之眼生效：这一世开局便有一名骑手小弟追随你。', 'l-good');
    if (keepRegulars && Object.keys(keepRegulars).length) log('❤️ 前世旧识生效：老熟客们还记得你。', 'l-good');
    log(DATA.RIVAL.taunt, 'l-evt');
    closeModal();
    save();
    render();
  }

  /* ---------------- 商铺 ---------------- */
  function buyMount(i) {
    var m = DATA.MOUNTS[i];
    if (S.mount >= i || S.stones < m.cost || level() < m.lv) return;
    S.stones -= m.cost;
    S.mount = i;
    log('🐎 购入坐骑「' + m.name + '」！配送速度提升至 ' + speed().toFixed(2) + 'x。', 'l-gold');
    checkAchievements(); save(); render();
  }
  function buyBox(id) {
    var def = DATA.BOX.find(function (x) { return x.id === id; });
    var cur = S.box[id];
    if (cur >= def.max || S.stones < def.costs[cur]) return;
    S.stones -= def.costs[cur];
    S.box[id]++;
    log('🧰 外卖箱强化「' + def.name + '」升至 ' + S.box[id] + ' 级。', 'l-gold');
    save(); render();
  }
  function buyArt(id) {
    var def = DATA.ARTS.find(function (x) { return x.id === id; });
    var cur = S.arts[id];
    if (cur >= def.max || S.merit < def.costs[cur]) return;
    S.merit -= def.costs[cur];
    S.arts[id]++;
    log('📖 参悟功法「' + def.name + '」' + S.arts[id] + ' 层。', 'l-gold');
    guideAdvance('art');
    save(); render();
  }
  function buyRider() {
    if (S.riders >= DATA.RIDERS.max || S.stones < riderCost()) return;
    S.stones -= riderCost();
    S.riders++;
    log('🐣 第 ' + S.riders + ' 名骑手小弟入职！他会自动帮你送「' + DATA.AREAS[autoArea()].name + '」的单。', 'l-gold');
    checkAchievements(); save(); render();
  }
  function buyDispatch(i) {
    var dsp = DATA.DISPATCH[i];
    if (S.dispatch !== i || S.stones < dsp.cost) return;
    S.stones -= dsp.cost;
    S.dispatch = i + 1;
    log('🗺️ 购得「' + dsp.name + '」！小弟们现在能送「' + DATA.AREAS[dsp.area].name + '」的单了。', 'l-gold');
    save(); render();
  }
  function buyTalent(id) {
    var def = DATA.TALENTS.find(function (x) { return x.id === id; });
    var cur = tLv(id);
    if (!def || cur >= def.max || META.marks < def.costs[cur]) return;
    META.marks -= def.costs[cur];
    META.talents[id] = cur + 1;
    log('🌀 轮回天赋「' + def.name + '」升至 ' + (cur + 1) + ' 级，自下一世起生效。', 'l-gold');
    if (id === 'eye') refillOrders();
    save(); render();
  }

  /* ---------------- 灵蝶 · 天降机缘 ---------------- */
  function scheduleButterfly() {
    butterflyAt = Date.now() + rnd(DATA.BUTTERFLY.minGap, DATA.BUTTERFLY.maxGap) * 1000;
  }
  function spawnButterfly() {
    butterflyAt = Infinity;
    var b = document.createElement('button');
    b.className = 'butterfly';
    b.textContent = '🦋';
    b.style.left = rnd(8, 82) + 'vw';
    b.style.top = rnd(12, 62) + 'vh';
    b.title = '灵蝶！快点它！';
    b.addEventListener('click', function () {
      if (b.parentNode) b.parentNode.removeChild(b);
      butterflyReward();
      scheduleButterfly();
    });
    document.body.appendChild(b);
    setTimeout(function () {
      if (b.parentNode) {
        b.parentNode.removeChild(b);
        log('🦋 灵蝶扇了扇翅膀，飞走了。', 'l-sys');
      }
      scheduleButterfly();
    }, DATA.BUTTERFLY.life * 1000);
  }
  function butterflyReward() {
    var boost = S.luck >= 70 ? 1.5 : 1; // 气运旺盛，灵蝶也更慷慨
    var r = Math.random();
    if (r < 0.4) {
      var g = Math.round(clamp(Math.round(S.stones * 0.15) + 10, 10, 500) * boost);
      S.stones += g;
      toast('🦋 灵蝶赐福：灵石 +' + g);
      log('🦋 灵蝶落在你肩头，抖落一地灵石粉（+' + g + ' 灵石）。', 'l-gold');
    } else if (r < 0.65) {
      var m = Math.round(rnd(8, 15) * boost);
      S.merit += m;
      toast('🦋 灵蝶赐福：功德 +' + m);
      log('🦋 灵蝶绕你飞了三圈，功德 +' + m + '。', 'l-gold');
    } else if (r < 0.85) {
      S.buffs.speedUntil = Date.now() + 60000 * boost;
      toast('🦋 灵蝶赐福：神速 ' + Math.round(60 * boost) + ' 秒！');
      log('🦋 灵蝶翅膀上的风灌进你的鞋底——配送速度翻倍！', 'l-gold');
    } else {
      S.buffs.safeNext = 1;
      toast('🦋 灵蝶赐福：平安符（下一单零损耗）');
      log('🦋 灵蝶化作一道平安符贴在餐箱上：下一单餐品零损耗。', 'l-gold');
    }
    S.flags.butterflies = (S.flags.butterflies || 0) + 1;
    checkAchievements();
    save();
    render();
  }

  /* ---------------- 弹窗 ---------------- */
  function openModal(title, text, choices, opts) {
    modalOpen = true;
    if (delivery && !delivery.pauseStart) delivery.pauseStart = Date.now();
    $('#modalTitle').textContent = title;
    var mt = $('#modalText');
    mt.textContent = text;
    if (opts && opts.input) {
      mt.appendChild(document.createElement('br'));
      var inp = document.createElement('input');
      inp.id = 'modalInput';
      inp.className = 'text-input';
      inp.maxLength = 12;
      inp.placeholder = opts.input.placeholder || '';
      inp.value = opts.input.value || '';
      mt.appendChild(inp);
      setTimeout(function () { inp.focus(); }, 60);
    }
    var box = $('#modalChoices');
    box.innerHTML = '';
    choices.forEach(function (ch) {
      var b = document.createElement('button');
      b.className = 'btn';
      if (ch.hint) {
        b.innerHTML = esc(ch.t) + '<span class="hint">' + esc(ch.hint) + '</span>';
      } else {
        b.textContent = ch.t;
      }
      b.addEventListener('click', ch.run);
      box.appendChild(b);
    });
    $('#modalMask').classList.remove('hidden');
  }
  function closeModal() {
    modalOpen = false;
    if (delivery && delivery.pauseStart) {
      delivery.paused += Date.now() - delivery.pauseStart;
      delivery.pauseStart = 0;
    }
    $('#modalMask').classList.add('hidden');
  }

  /* ---------------- 命名 ---------------- */
  function promptName() {
    openModal('🖋️ 敢问骑手尊姓大名？',
      '踏入修仙界，总得有个名号。它将刻在骑手榜上，与燕十三一争高下。',
      [{ t: '就叫这个了', run: function () {
        var inp = $('#modalInput');
        var v = (inp && inp.value || '').trim();
        META.name = v || '无名骑手';
        log('🖋️ 从此修仙界多了一位骑手：' + META.name + '。', 'l-gold');
        closeModal();
        save();
        render();
        if (!S.flags.welcomed) {
          S.flags.welcomed = 1;
          setTimeout(showWelcome, 350);
        }
      } }],
      { input: { placeholder: '输入你的骑手名号（12 字内）', value: '' } });
  }

  /* ---------------- 离线结算 ---------------- */
  function settleOffline() {
    if (!lastSeenSave || S.riders <= 0) return;
    var away = Math.min((Date.now() - lastSeenSave) / 1000, DATA.RIDERS.offlineCap);
    if (away < DATA.RIDERS.interval) return;
    var trips = Math.floor(away / DATA.RIDERS.interval);
    var n = trips * S.riders;
    if (n <= 0) return;
    var gain = autoPay() * n;
    var prev = S.flags.autoOrders || 0;
    S.stones += gain;
    S.flags.autoOrders = prev + n;
    var hours = away >= 3600 ? (away / 3600).toFixed(1) + ' 小时' : Math.round(away / 60) + ' 分钟';
    openModal('🌙 你离开了 ' + hours,
      '你不在的这段时间，' + S.riders + ' 名骑手小弟顶着寒风酷暑，替你送了 ' + n + ' 单。\n\n' +
      '自动入账：' + gain + ' 灵石。\n\n（离线收益以 8 小时为上限）',
      [{ t: '辛苦了，晚上加鸡腿', run: function () { closeModal(); save(); render(); } }]);
    log('🌙 离线结算：小弟代送 ' + n + ' 单，+' + gain + ' 灵石。', 'l-gold');
  }

  /* ---------------- 渲染 ---------------- */
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function renderStats() {
    var st = $('#stStones');
    if (lastStones !== null && lastStones !== S.stones) {
      var p = st.parentNode;
      p.classList.remove('flash');
      void p.offsetWidth;
      p.classList.add('flash');
    }
    lastStones = S.stones;
    st.textContent = S.stones;
    $('#stMerit').textContent = S.merit;
    var rate = goodRate();
    $('#stRate').textContent = rate === null ? '--' : rate + '%';
    $('#stRate').className = 'v ' + (rate !== null && rate >= 85 ? 'green' : rate !== null && rate < 60 ? 'red' : '');
    $('#stLevel').textContent = levelTitle();
    $('#stMount').textContent = DATA.MOUNTS[S.mount].name;
    $('#stTotal').textContent = S.total + ' 单';
    $('#stLuck').textContent = S.luck;
    $('#stResolve').textContent = S.resolve;
    $('#runTag').textContent = (META.name ? META.name + (S.run > 1 ? ' · ' : '') : '') + (S.run > 1 ? '第 ' + S.run + ' 世' : '');
  }

  function renderBanner() {
    var b = $('#banner');
    if (!delivery) { b.classList.add('hidden'); renderSkills(); return; }
    b.classList.remove('hidden');
    var o = delivery.order;
    var el = elapsed(delivery);
    var prog = clamp(el / delivery.expect * 100, 0, 100);
    var left = Math.ceil(o.limit - el);
    $('#bannerOrder').innerHTML =
      '送给 <b>' + esc(o.customer) + '</b> · ' + esc(o.food) +
      ' <span class="muted small">（' + DATA.AREAS[o.area].name + '）</span>' +
      (modalOpen ? ' <span class="muted small">⏸ 抉择中</span>' : '');
    $('#barProg').style.width = prog + '%';
    $('#barFood').style.width = delivery.integrity + '%';
    $('#txtFood').textContent = '完整 ' + Math.round(delivery.integrity) + '%';
    var t = $('#txtTime');
    t.textContent = left >= 0 ? '剩 ' + left + 's' : '超时 ' + (-left) + 's';
    t.className = 'bar-num' + (left < 0 ? ' late' : '');
    renderSkills();
  }

  function buffLine() {
    var parts = [];
    if (Date.now() < S.buffs.speedUntil) parts.push('⚡神速中（速度×2，剩 ' + Math.ceil((S.buffs.speedUntil - Date.now()) / 1000) + 's）');
    if (S.buffs.safeNext > 0) parts.push('🛡️平安符（下一单零损耗）');
    if ((S.flags.wrathShield || 0) > 0) parts.push('🌀天道庇护 ×' + S.flags.wrathShield);
    return parts.length ? '<div class="small buff-line center">' + parts.join(' · ') + '</div>' : '';
  }
  function renderBuffs() {
    var bar = $('#buffBar');
    if (!bar) return;
    var html = buffLine();
    if (html) { bar.innerHTML = html; bar.classList.remove('hidden'); }
    else { bar.innerHTML = ''; bar.classList.add('hidden'); }
  }

  /* ---------------- 配送神通 ---------------- */
  var lastSkillsHtml = null;
  function castSkill(id) {
    var d = delivery;
    if (!d) return;
    var sk = DATA.SKILLS.find(function (x) { return x.id === id; });
    if (!sk) return;
    var now = Date.now();
    var cost = skillCost(sk);
    var cdLeft = d.cds[id] ? Math.ceil((d.cds[id] - now) / 1000) : 0;
    if (cdLeft > 0) { toast(sk.name + '尚在调息（剩 ' + cdLeft + 's）'); return; }
    if (d.mana < cost) { toast('灵力不足（需 ' + cost + '）'); return; }
    d.mana -= cost;
    d.cds[id] = now + skillCd(sk) * 1000;
    countDecision();
    if (id === 'yufeng') {
      d.yufengUntil = now + sk.dur * 1000;
      log('🌀 御风诀！你足下生风，身法陡然加快（' + sk.dur + 's 速度 ×1.8）。', 'l-good');
    } else if (id === 'zhenshi') {
      d.shield = true;
      log('🛡️ 镇食诀！一层微光裹住餐箱：下一次餐损免疫。', 'l-good');
    } else if (id === 'dunying') {
      d.stealth = true;
      log('🫥 遁影诀！你身形淡去——下一个变故将被暗中观察。', 'l-good');
    }
    renderSkills(true);
  }
  function renderSkills(force) {
    var box = $('#skills');
    if (!box) return;
    if (!delivery) {
      if (lastSkillsHtml !== '') { box.innerHTML = ''; box.classList.add('hidden'); lastSkillsHtml = ''; }
      return;
    }
    var d = delivery, now = Date.now();
    var html = '<div class="mana-row">🌀 灵力 <b>' + Math.floor(d.mana) + '</b>/100</div>';
    DATA.SKILLS.forEach(function (sk) {
      var cost = skillCost(sk);
      var cdLeft = d.cds[sk.id] ? Math.ceil((d.cds[sk.id] - now) / 1000) : 0;
      var active = (sk.id === 'yufeng' && now < d.yufengUntil) ||
                   (sk.id === 'zhenshi' && d.shield) ||
                   (sk.id === 'dunying' && d.stealth);
      var dis = d.mana < cost || cdLeft > 0 || !!active;
      html += '<button class="skill-btn' + (active ? ' active' : '') + '" data-skill="' + sk.id + '"' +
        (dis ? ' disabled' : '') + ' title="' + esc(sk.desc) + '">' +
        sk.ico + ' ' + sk.name +
        (active ? '·生效中' : cdLeft > 0 ? '（' + cdLeft + 's）' : '<span class="mana-cost">' + cost + '</span>') +
        '</button>';
    });
    if (force || html !== lastSkillsHtml) {
      box.innerHTML = html;
      box.classList.remove('hidden');
      lastSkillsHtml = html;
    }
  }

  function questHtml() {
    ensureQuests();
    var html = '<div class="order quest"><div class="o-head"><span class="o-name">📜 门派悬赏</span>' +
      '<span class="o-area">全清奖 50 灵石 · 自动刷新</span></div>';
    S.quests.forEach(function (q) {
      var d = questDef(q.id);
      if (!d) return;
      var done = q.prog >= d.target;
      html += '<div class="q-row' + (done ? ' done' : '') + '"><span>' + (done ? '✅' : '▫️') + ' ' + esc(d.name) + '：' + esc(d.desc) + '</span>' +
        '<span class="q-prog">' + Math.min(q.prog, d.target) + '/' + d.target + '</span></div>';
    });
    return html + '</div>';
  }

  function renderOrders() {
    var pane = $('#pane-orders');
    if (delivery) {
      pane.innerHTML =
        '<div class="order"><div class="o-body center">🛵 配送进行中……留意途中变故。</div></div>';
      return;
    }
    var html = '';
    var rate = goodRate();
    if ((S.flags.demonCount || 0) >= 3 && S.endings.indexOf('demon') < 0) {
      html += '<div class="order special"><div class="o-body">🌙 魔尊给你留了言：「今夜，再来一趟。本尊有话对你说。」</div></div>';
    }
    html += questHtml();
    var cw = currentWeather();
    html = '<div class="order weather"><div class="o-head"><span class="o-name">🌌 天机：' + cw.ico + ' ' + cw.name + '</span>' +
      '<span class="o-area">8 小时一换</span></div><div class="o-body small">' + cw.desc + '</div></div>' + html;
    html = guideHtml() + html;
    orders.forEach(function (o) {
      var est = Math.ceil(baseTime(o) / speed());
      var risky = est > o.limit;
      html += '<div class="order' + (o.trial ? ' trial' : o.special ? ' special' : '') + '">' +
        '<div class="o-head"><span class="o-name">' + (o.trial ? '⚔️ ' : o.regular ? '❤️ ' : '') + esc(o.customer) + '</span>' +
        '<span class="o-area">📍 ' + DATA.AREAS[o.area].name + '</span></div>' +
        '<div class="o-body">🍜 ' + esc(o.food) + (o.note ? '<br><span class="muted small">' + esc(o.note) + '</span>' : '') + '</div>' +
        '<div class="o-meta"><span>报酬 <b class="o-pay">' + o.pay + ' 灵石</b></span>' +
        '<span>时限 <b>' + o.limit + 's</b></span>' +
        '<span>预计 <b' + (risky ? ' class="red"' : '') + '>' + est + 's</b></span></div>' +
        '<button class="btn primary" data-accept="' + o.id + '">' + (o.trial ? '迎接试炼' : '接单出发') + '</button></div>';
    });
    var rerollCost = hasBuild('慧眼识珠流') ? 3 : 5;
    html += '<div class="row-btns">' +
      '<button class="btn" id="btnReroll">🔄 换一批（-' + rerollCost + ' 灵石）</button>' +
      '<button class="btn' + (S.meditating ? ' primary' : '') + '" id="btnMeditate">🧘 ' + (S.meditating ? '打坐中…' : '打坐（功德+道心）') + '</button></div>';
    var ps = playerScore(), rs = rivalScore();
    html += '<div class="muted small center mt8">难度 ' + difficulty().ico + difficulty().name +
      ' · 好评率 ' + (rate === null ? '--' : rate + '%') +
      ' · 连续好评 ' + S.goodStreak + ' · 连续差评 ' + S.badStreak + '（三连差评会遭天谴⚡）</div>' +
      ((S.flags.heat || 0) >= 2 ? '<div class="small center" style="color:var(--gold)">🔥 五星连击 ×' + S.flags.heat + ' · 报酬 +' + Math.min(S.flags.heat * 5, hasBuild('赏金急脚流') ? 35 : 25) + '%</div>' : '') +
      '<div class="muted small center">🏆 骑手榜：' + esc(displayName()) + ' ' + ps + ' 分' +
      (ps > rs ? ' 🥇榜一' : ' 🥈第二') + ' · 蓝袍宗·燕十三 ' + rs + ' 分</div>';
    pane.innerHTML = html;
  }

  function renderShop() {
    var pane = $('#pane-shop');
    guideAdvance('shop');
    var lv = level();
    var html = '<div class="sec-title">坐骑</div>';
    DATA.MOUNTS.forEach(function (m, i) {
      var owned = S.mount >= i;
      var locked = lv < m.lv;
      html += '<div class="item' + (owned ? ' owned' : '') + (locked ? ' locked' : '') + '">' +
        '<div class="i-info"><div class="i-name">' + m.name + '<span class="lv">速度 ' + m.spd + 'x</span></div>' +
        '<div class="i-desc">' + m.desc + '</div></div>' +
        (owned
          ? '<button class="btn" disabled>' + (S.mount === i ? '当前骑乘' : '已拥有') + '</button>'
          : locked
            ? '<button class="btn" disabled>需 ' + DATA.LEVELS[m.lv - 1].title + '</button>'
            : '<button class="btn" data-mount="' + i + '">' + m.cost + ' 灵石</button>') +
        '</div>';
    });

    html += '<div class="sec-title">外卖箱法宝</div>';
    DATA.BOX.forEach(function (b) {
      var cur = S.box[b.id];
      var maxed = cur >= b.max;
      html += '<div class="item' + (cur > 0 ? ' owned' : '') + '">' +
        '<div class="i-info"><div class="i-name">' + b.name + '<span class="lv">Lv.' + cur + '/' + b.max + '</span></div>' +
        '<div class="i-desc">' + b.desc + '</div></div>' +
        (maxed ? '<button class="btn" disabled>已满级</button>'
          : '<button class="btn" data-box="' + b.id + '">' + b.costs[cur] + ' 灵石</button>') +
        '</div>';
    });

    html += '<div class="sec-title">雇佣骑手（自动配送 · 离线也跑单）</div>';
    var full = S.riders >= DATA.RIDERS.max;
    html += '<div class="item' + (S.riders > 0 ? ' owned' : '') + '">' +
      '<div class="i-info"><div class="i-name">骑手小弟 ×' + S.riders + '<span class="lv">上限 ' + DATA.RIDERS.max + '</span></div>' +
      '<div class="i-desc">每名小弟每 ' + DATA.RIDERS.interval + 's 自动送一单，当前送往「' + DATA.AREAS[autoArea()].name +
      '」，约 ' + autoPay() + ' 灵石/单。离线也会继续跑单（收益 8 小时封顶）。</div></div>' +
      (full ? '<button class="btn" disabled>已满员</button>'
        : '<button class="btn" data-rider="1">' + riderCost() + ' 灵石</button>') +
      '</div>';
    DATA.DISPATCH.forEach(function (dsp, i) {
      var owned = S.dispatch > i;
      var needPrev = S.dispatch < i;
      html += '<div class="item' + (owned ? ' owned' : '') + (needPrev ? ' locked' : '') + '">' +
        '<div class="i-info"><div class="i-name">' + dsp.name + '</div>' +
        '<div class="i-desc">' + dsp.desc + '</div></div>' +
        (owned ? '<button class="btn" disabled>已持有</button>'
          : '<button class="btn" data-dispatch="' + i + '"' + (needPrev ? ' disabled' : '') + '>' + dsp.cost + ' 灵石</button>') +
        '</div>';
    });

    html += '<div class="sec-title">传说之物</div>';
    var homeOk = endingAvailable('home');
    html += '<div class="item">' +
      '<div class="i-info"><div class="i-name">跨界回家符<span class="lv">结局道具</span></div>' +
      '<div class="i-desc">撕开即可回到你原来的世界。需 6666 灵石，骑手长老（Lv.6）方可催动。</div></div>' +
      (S.endings.indexOf('home') >= 0
        ? '<button class="btn" disabled>已达成</button>'
        : '<button class="btn' + (homeOk ? ' primary' : '') + '" data-ending="home"' + (homeOk ? '' : ' disabled') + '>6666 灵石</button>') +
      '</div>';
    var tycoonOk = endingAvailable('tycoon');
    html += '<div class="item">' +
      '<div class="i-info"><div class="i-name">坊市旺铺<span class="lv">结局道具</span></div>' +
      '<div class="i-desc">盘下这间铺面，开创你的外卖帝国。需 9999 灵石 + 好评率≥85% + 累计 80 单。</div></div>' +
      (S.endings.indexOf('tycoon') >= 0
        ? '<button class="btn" disabled>已达成</button>'
        : '<button class="btn' + (tycoonOk ? ' primary' : '') + '" data-ending="tycoon"' + (tycoonOk ? '' : ' disabled') + '>9999 灵石</button>') +
      '</div>';

    pane.innerHTML = html;
  }

  function renderCult() {
    var pane = $('#pane-cult');
    var lv = level();
    var raw = rawLevel();
    var next = raw < DATA.LEVELS.length ? DATA.LEVELS[raw] : null;
    var html = '<div class="sec-title">修为</div>' +
      '<div class="item"><div class="i-info"><div class="i-name">' + levelTitle() + '<span class="lv">Lv.' + lv + '</span></div>' +
      '<div class="i-desc">经验 ' + S.exp + (next ? ' / ' + next.exp + '（下一境：' + next.title + '）' : '（已至化境）') +
      ' · 当前速度 ' + speed().toFixed(2) + 'x' + (S.legacySpeed ? '（含轮回传承 +' + Math.round(S.legacySpeed * 100) + '%）' : '') +
      '<br>气运 ' + S.luck + '（影响事件结果与机缘） · 道心 ' + S.resolve + '（灵眸绕路的燃料）</div></div></div>';

    var gate = pendingGate();
    if (gate) {
      var tr = DATA.TRIALS.find(function (t) { return t.gate === gate; });
      html += '<div class="item"><div class="i-info"><div class="i-name">⚔️ 突破受阻：' + tr.title + '</div>' +
        '<div class="i-desc">' + tr.desc + '。试炼单已派发到「接单」页，好评送达即可突破至「' + DATA.LEVELS[gate - 1].title + '」。</div></div></div>';
    }

    html += '<div class="sec-title">功法（消耗功德）</div>';
    DATA.ARTS.forEach(function (a) {
      var cur = S.arts[a.id];
      var maxed = cur >= a.max;
      html += '<div class="item' + (cur > 0 ? ' owned' : '') + '">' +
        '<div class="i-info"><div class="i-name">' + a.name + '<span class="lv">' + cur + '/' + a.max + ' 层</span></div>' +
        '<div class="i-desc">' + a.desc + '</div></div>' +
        (maxed ? '<button class="btn" disabled>已圆满</button>'
          : '<button class="btn" data-art="' + a.id + '">' + a.costs[cur] + ' 功德</button>') +
        '</div>';
    });

    html += '<div class="sec-title">轮回天赋（天道印记 ×' + META.marks + '）' +
      '<span class="muted small"> · 轮回时结算，跨世永久生效</span></div>';
    DATA.TALENTS.forEach(function (tl) {
      var cur = tLv(tl.id);
      var maxed = cur >= tl.max;
      html += '<div class="item' + (cur > 0 ? ' owned' : '') + '">' +
        '<div class="i-info"><div class="i-name">' + tl.name + '<span class="lv">' + cur + '/' + tl.max + ' 级</span></div>' +
        '<div class="i-desc">' + tl.desc + '</div></div>' +
        (maxed ? '<button class="btn" disabled>已圆满</button>'
          : '<button class="btn" data-talent="' + tl.id + '">' + tl.costs[cur] + ' 印记</button>') +
        '</div>';
    });

    html += '<div class="sec-title">飞升</div>';
    var ascOk = endingAvailable('ascend');
    html += '<div class="item">' +
      '<div class="i-info"><div class="i-name">功德飞升<span class="lv">结局</span></div>' +
      '<div class="i-desc">攒满 1000 功德，以配送之道证道飞升。当前功德 ' + S.merit + '。</div></div>' +
      (S.endings.indexOf('ascend') >= 0
        ? '<button class="btn" disabled>已飞升</button>'
        : '<button class="btn' + (ascOk ? ' primary' : '') + '" data-ending="ascend"' + (ascOk ? '' : ' disabled') + '>需 1000 功德</button>') +
      '</div>';

    pane.innerHTML = html;
  }

  function renderCodex() {
    var pane = $('#pane-codex');
    guideAdvance('codex');
    var html = '';

    // 流派称号（功法组合 + 人格自动生成）
    var build = computeBuild();
    html += '<div class="sec-title">流派</div>';
    if (build) {
      html += '<div class="ach done"><div class="a-ico">🥋</div><div><div class="a-name">' + build.name + '</div>' +
        '<div class="a-desc">' + build.desc + '</div>' +
        '<div class="a-desc" style="color:var(--gold)">✦ 流派神通：' + build.perk + '</div></div></div>';
    } else {
      html += '<div class="muted small">尚无流派——任意两门功法修至 2 层，自会悟出你的流派，并获得专属流派神通（被动加成）。</div>';
    }
    // 路线偏好画像（v2.4）
    var routeUse = S.flags.routeUse || {};
    var ruNames = { road: '官道', trail: '山径', canyon: '峡谷' };
    var ruBest = null, ruTotal = 0;
    Object.keys(routeUse).forEach(function (rid) {
      ruTotal += routeUse[rid];
      if (!ruBest || routeUse[rid] > routeUse[ruBest]) ruBest = rid;
    });
    if (ruBest && ruTotal >= 3) {
      html += '<div class="muted small center">惯走之路：' + (ruNames[ruBest] || ruBest) +
        '（' + Math.round(routeUse[ruBest] / ruTotal * 100) + '% 的行程都选了它）</div>';
    }
    var p = S.personality || {};
    if (personalityTotal() > 0) {
      html += '<div class="muted small center">性情：仁善 ' + (p.kindness || 0) + ' · 冒险 ' + (p.adventure || 0) +
        ' · 精明 ' + (p.business || 0) + ' · 谨慎 ' + (p.cautious || 0) + '</div>';
    }
    var playMin = (S.flags.playSecs || 0) / 60;
    if (playMin >= 1) {
      html += '<div class="muted small center">本世决策密度：' + ((S.flags.decisions || 0) / playMin).toFixed(1) + ' 次/分（' + (S.flags.decisions || 0) + ' 次决策）</div>';
    }

    html += '<div class="sec-title">成就（' + S.achievements.length + '/' + DATA.ACHIEVEMENTS.length + '）' +
      '<span class="muted small"> · 每个成就永久 +2% 报酬</span></div>';
    DATA.ACHIEVEMENTS.forEach(function (a) {
      var done = S.achievements.indexOf(a.id) >= 0;
      html += '<div class="ach' + (done ? ' done' : '') + '"><div class="a-ico">' + a.ico + '</div>' +
        '<div><div class="a-name">' + a.name + '</div><div class="a-desc">' + a.desc + '</div></div></div>';
    });
    var ps = playerScore(), rs = rivalScore();
    html += '<div class="sec-title">骑手榜</div>' +
      '<div class="muted small">🥇 ' + (ps > rs ? esc(displayName()) : '蓝袍宗·燕十三') + '：' + Math.max(ps, rs) + ' 分<br>' +
      '🥈 ' + (ps > rs ? '蓝袍宗·燕十三' : esc(displayName())) + '：' + Math.min(ps, rs) + ' 分<br>' +
      (ps > rs ? '你压他一头，继续保持。' : '他压你一头。手动送单、雇佣小弟、攒功德都能涨分。') +
      '<br>（得分 = 手动单×2 + 自动单×1 + 五星×3 + 功德÷10，每世重新计）</div>';

    var rg = regulars();
    var rgKeys = Object.keys(rg);
    html += '<div class="sec-title">人脉</div>';
    var metAny = false;
    DATA.NPCS.forEach(function (npc) {
      var rel = S.relationships[npc.id];
      if (!rel || rel.trust <= 0) return;
      metAny = true;
      var lv = npcLevel(npc, rel.trust);
      var nextT = npc.tiers[lv];
      html += '<div class="ach done"><div class="a-ico">' + npc.ico + '</div>' +
        '<div><div class="a-name">' + npc.name + ' · ' + npc.title + '</div>' +
        '<div class="a-desc">好感 ' + rel.trust + (nextT ? '/' + nextT : ' · 至交') +
        (lv > 0 ? ' · ' + npc.perks[lv - 1] : ' · 继续送他的单，会有故事') + '</div></div></div>';
    });
    if (!metAny) {
      html += '<div class="muted small">尚未结识招牌人物。多送内门、魔域的单，善待途中遇到的每一个人。</div>';
    }

    html += '<div class="sec-title">熟客（' + regularCount() + ' 位）</div>';
    if (!rgKeys.length) {
      html += '<div class="muted small">给同一位客人送出 3 次好评，他就会成为你的熟客。熟客单报酬 +30%，必给小费。</div>';
    }
    rgKeys.forEach(function (k) {
      var r = rg[k];
      var isR = r.good >= 3;
      html += '<div class="ach' + (isR ? ' done' : '') + '"><div class="a-ico">' + (isR ? '❤️' : '🙂') + '</div>' +
        '<div><div class="a-name">' + esc(k) + '</div>' +
        '<div class="a-desc">' + (isR ? '熟客 · 好评 ' + r.good + ' 次' : '好感 ' + r.good + '/3 · 累计 ' + r.n + ' 单') + '</div></div></div>';
    });

    html += '<div class="sec-title">史册（最近配送）</div>';
    if (!META.history.length) {
      html += '<div class="muted small">暂无记录，去送一单吧。</div>';
    }
    META.history.slice(0, 12).forEach(function (h) {
      html += '<div class="muted small">· ' + esc(h) + '</div>';
    });

    html += '<div class="sec-title">结局（' + S.endings.length + '/' + DATA.ENDINGS.length + '）</div>';
    DATA.ENDINGS.forEach(function (e) {
      var done = S.endings.indexOf(e.id) >= 0;
      html += '<div class="ach' + (done ? ' done' : '') + '"><div class="a-ico">' + (done ? '📜' : '🔒') + '</div>' +
        '<div><div class="a-name">' + (done ? e.name : '？？？') + '</div>' +
        '<div class="a-desc">' + (done ? '已达成' : e.need) + '</div></div></div>';
    });
    html += '<div class="sec-title">生涯</div>' +
      '<div class="muted small">' + esc(displayName()) + ' · 第 ' + S.run + ' 世 · 手动 ' + S.total + ' 单 · 小弟代送 ' + (S.flags.autoOrders || 0) +
      ' 单 · 好评 ' + S.good + ' · 差评 ' + S.bad + ' · 五星 ' + S.fiveStar + ' 次 · 捕蝶 ' + (S.flags.butterflies || 0) +
      ' 次 · 天道印记 ' + META.marks + ' 枚</div>';
    pane.innerHTML = html;
  }

  function renderSettings() {
    var pane = $('#pane-settings');
    pane.innerHTML =
      '<div class="sec-title">骑手名号</div>' +
      '<div class="muted small">当前名号：<b>' + esc(displayName()) + '</b>（显示在顶栏与骑手榜，跨轮回保留）</div>' +
      '<div class="row-btns"><input id="nameBox" class="text-input" maxlength="12" placeholder="输入新名号（12 字内）">' +
      '<button class="btn" id="btnRename">✏️ 改名</button></div>' +
      '<div class="sec-title">存档</div>' +
      '<div class="muted small">进度自动保存在本浏览器（localStorage，键名前缀 cultexpress_）。可导出存档码迁移设备。</div>' +
      '<div class="row-btns"><button class="btn" id="btnExport">📤 导出存档</button>' +
      '<button class="btn" id="btnImport">📥 导入存档</button></div>' +
      '<textarea id="saveBox" placeholder="存档码会出现在这里；粘贴存档码后点「导入存档」"></textarea>' +
      '<div class="sec-title">玩法</div>' +
      '<div class="row-btns"><button class="btn" id="btnHelp">📖 玩法说明</button></div>' +
      '<div class="sec-title">难度</div>' +
      '<div class="muted small">当前：' + difficulty().ico + ' ' + difficulty().name + '——' + difficulty().desc + '</div>' +
      '<div class="row-btns">' + DATA.DIFFICULTIES.map(function (d) {
        return '<button class="btn' + (difficulty().id === d.id ? ' primary' : '') + '" data-diff="' + d.id + '">' + d.ico + ' ' + d.name + '</button>';
      }).join('') + '</div>' +
      '<div class="sec-title">危险区</div>' +
      '<div class="row-btns"><button class="btn danger" id="btnReset">🗑️ 删除存档重新开始</button></div>' +
      '<div class="sec-title">关于</div>' +
      '<div class="muted small">《我在修仙界送外卖》v2.4.3 · 纯文字单机小游戏 · 无外链资源 · 无声音<br>' +
      '题材：修仙 × 外卖 · 玩法：择路配送 + 神通操作 + 情报事件 + 人脉经营 + 因果链 + 轮回天赋 + 多结局</div>';
  }

  function render() {
    renderStats();
    renderBanner();
    renderBuffs();
    // 流派变化播报（v2.4）
    var curBuild = computeBuild();
    var curBuildName = curBuild ? curBuild.name : '';
    if (curBuildName !== (S.flags.buildName || '')) {
      if (curBuild) {
        log('🥋 你悟出了流派「' + curBuild.name + '」——' + curBuild.perk, 'l-gold');
        toast('🥋 自成一派 · ' + curBuild.name);
        pushHistory('悟出流派「' + curBuild.name + '」');
        unlockAch('build1');
      }
      S.flags.buildName = curBuildName;
    }
    if (activeTab === 'orders') renderOrders();
    else if (activeTab === 'shop') renderShop();
    else if (activeTab === 'cult') renderCult();
    else if (activeTab === 'codex') renderCodex();
    else if (activeTab === 'settings') renderSettings();
  }

  /* ---------------- 主循环 ---------------- */
  var lastTick = Date.now();
  var meditateAcc = 0;
  setInterval(function () {
    var now = Date.now();
    var dt = (now - lastTick) / 1000;
    lastTick = now;

    if (delivery) {
      // 灵力回复（弹窗时也回复）
      delivery.mana = clamp(delivery.mana + 4 * dt, 0, 100);
      if (!modalOpen) {
        var d = delivery;
        if (!d.safeMode) {
          d.integrity = clamp(d.integrity - 0.22 * dt * difficulty().decayMul * (1 + 0.03 * Math.max(0, level() - 4)) * (1 - 0.25 * S.box.warm) * (d.pill ? 0.5 : 1), 0, 100);
        }
        // 御风诀生效中：进度按 ×1.8 推进
        if (now < d.yufengUntil) d.start -= dt * 0.8 * 1000;
        // 神速等实时速度变化：按「当前速度 / 出发时速度」动态加减速（v2.4.3，起步价已含神速则不重复加速）
        var spdRatio = speed() / (d.speedAtStart || speed());
        if (spdRatio !== 1) d.start -= dt * (spdRatio - 1) * 1000;
        var prog = elapsed(d) / d.expect;
        if (d.fired < d.events.length && prog >= d.events[d.fired]) {
          d.fired++;
          triggerEvent();
        }
        if (delivery && elapsed(delivery) >= delivery.expect) {
          finishDelivery();
        }
      }
      renderBanner(); // 倒计时常驻实时刷新，弹窗时显示「抉择中」
    }

    // buff 倒计时每 tick 实时刷新（200ms）
    renderBuffs();

    // 顶栏资源每秒自动重绘（含骑手入账）
    statAcc += dt;
    if (statAcc >= 1) {
      statAcc = 0;
      renderStats();
    }

    // 骑手小弟自动配送（弹窗时也不停工）
    if (S.riders > 0) {
      riderAcc += dt;
      while (riderAcc >= DATA.RIDERS.interval) {
        riderAcc -= DATA.RIDERS.interval;
        completeAutoOrders(S.riders);
      }
    }

    // 打坐：功德 + 道心
    if (S.meditating && !delivery) {
      meditateAcc += dt;
      if (meditateAcc >= (hasBuild('洞玄静观流') ? 6 : 8)) {
        meditateAcc = 0;
        S.merit += 1;
        S.resolve = clamp(S.resolve + 1, 0, 100);
        log('🧘 打坐静修，功德 +1，道心 +1。', 'l-sys');
        questProgress('meditate', 1);
        renderStats();
        if (activeTab === 'cult') renderCult();
        save();
      }
    }

    // 灵蝶
    if (!modalOpen && now >= butterflyAt) spawnButterfly();

    // 宿敌：分数自然增长 + 传闻
    S.flags.rivalScore = (S.flags.rivalScore || 0) + dt * (3 + level()) / 60;
    S.flags.playSecs = (S.flags.playSecs || 0) + dt;

    // 天机轮换检测（修仙历 · 8 小时一时辰）
    var ww = weatherWindow();
    if (S.flags.weatherWindow !== ww) {
      S.flags.weatherWindow = ww;
      var cw = currentWeather();
      log('🌌 天机流转：' + cw.ico + ' ' + cw.name + '——' + cw.desc, 'l-evt');
      if (activeTab === 'orders' && !delivery && !modalOpen) renderOrders();
    }
    if (now >= rivalLineAt && !modalOpen) {
      rivalLineAt = now + rnd(200, 400) * 1000;
      log('📰 ' + pick(DATA.RIVAL.lines), 'l-sys');
    }
    var ahead = playerScore() > rivalScore();
    if (ahead && !S.flags.wasAhead) {
      S.flags.wasAhead = 1;
      log('🥇 你的骑手积分超过了燕十三，登顶骑手榜！黄袍宗扬眉吐气！', 'l-gold');
      unlockAch('top1');
      if (activeTab === 'orders' || activeTab === 'codex') render();
    } else if (!ahead && S.flags.wasAhead) {
      S.flags.wasAhead = 0;
      log('📰 燕十三反超了你，重回骑手榜第一。他托人捎来一句：「承让。」', 'l-sys');
      if (activeTab === 'orders' || activeTab === 'codex') render();
    }
  }, 200);

  setInterval(save, 10000);

  /* ---------------- 事件绑定 ---------------- */
  document.addEventListener('click', function (ev) {
    var t = ev.target.closest('[data-accept],[data-skill],[data-mount],[data-box],[data-art],[data-ending],[data-rider],[data-dispatch],[data-talent],[data-diff],#btnReroll,#btnMeditate,#btnExport,#btnImport,#btnReset,#btnRename,#btnHelp,.tab');
    if (!t) return;

    if (t.classList.contains('tab')) {
      activeTab = t.dataset.tab;
      document.querySelectorAll('.tab').forEach(function (x) { x.classList.toggle('active', x === t); });
      document.querySelectorAll('.pane').forEach(function (p) { p.classList.toggle('active', p.id === 'pane-' + activeTab); });
      render();
      return;
    }
    if (t.dataset.accept) { startOrder(t.dataset.accept); return; }
    if (t.dataset.skill) { castSkill(t.dataset.skill); return; }
    if (t.dataset.mount) { buyMount(parseInt(t.dataset.mount, 10)); return; }
    if (t.dataset.box) { buyBox(t.dataset.box); return; }
    if (t.dataset.art) { buyArt(t.dataset.art); return; }
    if (t.dataset.ending) { doEnding(t.dataset.ending); return; }
    if (t.dataset.rider) { buyRider(); return; }
    if (t.dataset.dispatch) { buyDispatch(parseInt(t.dataset.dispatch, 10)); return; }
    if (t.dataset.talent) { buyTalent(t.dataset.talent); return; }
    if (t.dataset.diff) { setDifficulty(t.dataset.diff); return; }

    switch (t.id) {
      case 'btnReroll':
        if (S.stones < (hasBuild('慧眼识珠流') ? 3 : 5) || delivery) return;
        S.stones -= hasBuild('慧眼识珠流') ? 3 : 5;
        orders = [];
        refillOrders();
        log('🔄 换了新一批订单。', 'l-sys');
        render();
        break;
      case 'btnMeditate':
        if (delivery) return;
        S.meditating = !S.meditating;
        log(S.meditating ? '🧘 你盘腿坐下，开始吐纳灵气。' : '🧘 你站起身，拍拍道袍上的灰。', 'l-sys');
        render();
        break;
      case 'btnHelp':
        showHelp();
        break;
      case 'btnRename': {
        var v = ($('#nameBox') && $('#nameBox').value || '').trim();
        if (!v) { toast('先输入一个新名号'); return; }
        META.name = v;
        log('🖋️ 你换了名号：' + META.name + '。骑手榜同步更新。', 'l-gold');
        save();
        render();
        break;
      }
      case 'btnExport':
        try {
          $('#saveBox').value = btoa(unescape(encodeURIComponent(JSON.stringify({ s: S, meta: META, orders: orders }))));
          toast('存档码已生成，可复制保存');
        } catch (e) { toast('导出失败'); }
        break;
      case 'btnImport': {
        var code = $('#saveBox').value.trim();
        if (!code) { toast('请先粘贴存档码'); return; }
        try {
          var data = JSON.parse(decodeURIComponent(escape(atob(code))));
          if (!data.s) throw new Error('bad');
          S = Object.assign(freshState(), data.s);
          S.box = Object.assign({ warm: 0, seal: 0, space: 0 }, data.s.box);
          S.arts = Object.assign({ shenfa: 0, hutu: 0, shenshi: 0, guixi: 0, dianjin: 0 }, data.s.arts);
          S.buffs = Object.assign({ speedUntil: 0, safeNext: 0 }, data.s.buffs);
          S.flags = data.s.flags || {};
          S.personality = Object.assign({ kindness: 0, adventure: 0, business: 0, cautious: 0 }, data.s.personality);
          S.relationships = data.s.relationships || {};
          META = Object.assign({ marks: 0, talents: {}, name: '', history: [] }, data.meta);
          META.talents = META.talents || {};
          META.history = Array.isArray(META.history) ? META.history : [];
          orders = Array.isArray(data.orders) ? data.orders : [];
          delivery = null;
          riderAcc = 0;
          pendingWrath = false;
          refillOrders();
          save();
          log('📥 存档导入成功。', 'l-gold');
          render();
        } catch (e) { toast('存档码无效'); }
        break;
      }
      case 'btnReset':
        openModal('🗑️ 确认删档？', '此操作会清空当前进度（成就、结局、天道印记、名号一并删除），不可恢复。', [
          { t: '确认删除，重新做人', run: function () {
            try { localStorage.removeItem(KEY); } catch (e) {}
            S = freshState();
            META = { marks: 0, talents: {}, name: '', history: [] };
            orders = [];
            delivery = null;
            riderAcc = 0;
            pendingWrath = false;
            refillOrders();
            closeModal();
            log('🌱 新的一世开始了。', 'l-sys');
            render();
            setTimeout(promptName, 400);
          } },
          { t: '再想想', run: closeModal },
        ]);
        break;
    }
  });

  /* ---------------- 启动 ---------------- */
  var loaded = load();
  if (!loaded) {
    log('🌅 你，一个现代外卖小哥，被一道天雷劈进了修仙界。', 'l-sys');
    log('身上只剩下：一个餐箱，一部手机（没信号），和一身黄袍。', 'l-sys');
    log('坊市的告示牌写着：黄袍宗招骑手，计件结灵石，差评遭天谴。', 'l-sys');
    log('——先接一单糊口吧。', 'l-gold');
    log('📰 骑手榜上，蓝袍宗·燕十三的名字排在第一，已经很久了。', 'l-sys');
  } else {
    log('☀️ 欢迎回来，' + (META.name || levelTitle()) + '。餐箱还温着。', 'l-sys');
  }
  if (!S.flags.lastLevel) S.flags.lastLevel = level();
  refillOrders();
  render();
  settleOffline();
  scheduleButterfly();
  rivalLineAt = Date.now() + rnd(120, 240) * 1000;
  if (!META.name) setTimeout(promptName, 600);
})();
