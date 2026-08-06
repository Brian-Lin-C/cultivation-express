/* =========================================================
 * 我在修仙界送外卖 — 引擎
 * 纯前端 · localStorage 存档（键名前缀 cultexpress_）
 * v1.1：雇佣骑手自动化 + 离线收益 + 灵蝶机缘 + 成就加成 + 宿敌榜
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
      mount: 0,
      box: { warm: 0, seal: 0, space: 0 },
      arts: { shenfa: 0, hutu: 0, shenshi: 0, guixi: 0, dianjin: 0 },
      riders: 0, dispatch: 0,
      buffs: { speedUntil: 0, safeNext: 0 },
      flags: {},
      achievements: achievements || [],
      endings: endings || [],
      run: run || 1,
      legacySpeed: legacySpeed || 0,
      meditating: false,
    };
  }

  var S = freshState();
  var orders = [];          // 当前可接订单
  var delivery = null;      // 进行中的配送
  var modalOpen = false;
  var activeTab = 'orders';
  var lastSeenSave = 0;     // 上次存档时间戳（用于离线结算）
  var riderAcc = 0;         // 骑手自动配送进度
  var butterflyAt = Infinity; // 下一只灵蝶出现时间
  var rivalLineAt = Infinity; // 下一条宿敌传闻时间

  /* ---------------- 存档 ---------------- */
  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify({ v: 1, s: S, orders: orders, lastSeen: Date.now() }));
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
      orders = Array.isArray(data.orders) ? data.orders : [];
      lastSeenSave = data.lastSeen || 0;
      return true;
    } catch (e) { return false; }
  }

  /* ---------------- 派生数值 ---------------- */
  function level() {
    var lv = 1;
    for (var i = 0; i < DATA.LEVELS.length; i++) {
      if (S.exp >= DATA.LEVELS[i].exp) lv = i + 1;
    }
    return lv;
  }
  function levelTitle() { return DATA.LEVELS[level() - 1].title; }
  function speed() {
    var v = DATA.MOUNTS[S.mount].spd * (1 + 0.12 * S.arts.shenfa) * (1 + S.legacySpeed);
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
    // 每累计 25 单汇报一次，避免刷屏
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
  }

  /* ---------------- 订单生成 ---------------- */
  function baseTime(order) { return 10 + DATA.AREAS[order.area].dist * 10; }

  function genOrder(forceSpecial) {
    var lv = level();
    var avail = unlockedAreas();
    // 区域越高级权重越大，但低级区也保留
    var weights = avail.map(function (i) { return 1 + i * 1.2; });
    var sum = weights.reduce(function (a, b) { return a + b; }, 0);
    var r = Math.random() * sum, areaIdx = avail[0];
    for (var i = 0; i < avail.length; i++) {
      r -= weights[i];
      if (r <= 0) { areaIdx = avail[i]; break; }
    }
    var area = DATA.AREAS[areaIdx];

    // 特殊订单判定
    var sp = null;
    for (var j = 0; j < DATA.SPECIALS.length; j++) {
      var cand = DATA.SPECIALS[j];
      if (lv >= cand.minLv && cand.areas.indexOf(areaIdx) >= 0 && Math.random() < cand.chance) { sp = cand; break; }
    }
    if (forceSpecial) sp = forceSpecial;

    var customer;
    if (sp && sp.customer) {
      customer = sp.customer;
    } else {
      var pool = [];
      DATA.CUSTOMERS.forEach(function (row, idx) {
        if (idx === areaIdx) for (var k = 1; k < row.length; k++) pool.push(row[k]);
      });
      customer = pick(pool);
    }

    var pay = rnd(area.payMin, area.payMax) * (sp ? sp.payMul : 1);
    var limit = Math.ceil((10 + area.dist * 10) * (1.15 + Math.random() * 0.4) * (sp ? sp.timeMul : 1));

    return {
      id: Date.now() + '_' + Math.random().toString(36).slice(2, 7),
      customer: customer,
      food: pick(DATA.FOODS),
      area: areaIdx,
      pay: Math.round(pay),
      limit: limit,
      special: sp ? sp.id : null,
      note: sp ? sp.note : null,
    };
  }

  function refillOrders() {
    while (orders.length < 3) orders.push(genOrder());
    save();
  }

  /* ---------------- 配送流程 ---------------- */
  function startOrder(id) {
    if (delivery) return;
    var idx = orders.findIndex(function (o) { return o.id === id; });
    if (idx < 0) return;
    var order = orders.splice(idx, 1)[0];
    order.limit = Math.ceil(order.limit * timeMul());

    var expect = baseTime(order) / speed();
    var nEvt = order.area <= 1 ? rnd(0, 1) : order.area <= 2 ? rnd(1, 2) : rnd(1, 3);
    var fracs = [];
    for (var i = 0; i < nEvt; i++) fracs.push(0.18 + Math.random() * 0.64);
    fracs.sort(function (a, b) { return a - b; });

    var safeMode = S.buffs.safeNext > 0;
    S.buffs.safeNext = 0;

    delivery = {
      order: order,
      start: Date.now(),
      paused: 0,
      pauseStart: 0,
      expect: expect,
      integrity: 100,
      events: fracs,
      fired: 0,
      eventHurtMul: 1 - 0.2 * S.box.seal,
      safeMode: safeMode,
    };
    S.meditating = false;

    log('📦 接单：给' + order.customer + '送「' + order.food + '」（' + DATA.AREAS[order.area].name + '，时限 ' + order.limit + 's）', 'l-evt');
    if (safeMode) log('🛡️ 平安符生效：本单餐品零损耗。', 'l-good');
    refillOrders();
    render();
  }

  function elapsed(d) {
    var pauseTotal = d.paused + (d.pauseStart ? Date.now() - d.pauseStart : 0);
    return (Date.now() - d.start - pauseTotal) / 1000;
  }

  function eff(res) {
    var d = delivery;
    if (!d) return res;
    if (res.di) {
      var di = res.di;
      if (di < 0) {
        if (d.safeMode) { di = 0; res.log = (res.log || '') + '（平安符挡下了餐损）'; }
        else di = Math.round(di * (d.eventHurtMul || 1) * (1 - 0.15 * S.arts.hutu));
      }
      d.integrity = clamp(d.integrity + di, 0, 100);
    }
    if (res.dt) d.start -= res.dt * 1000; // dt>0 = 耗时增加；<0 = 抄近道
    if (res.ds) S.stones = Math.max(0, S.stones + res.ds);
    if (res.dm) S.merit = Math.max(0, S.merit + res.dm);
    if (res.log) log(res.log, res.cls || 'l-sys');
    return res;
  }

  function triggerEvent() {
    var d = delivery;
    var pool = DATA.EVENTS.filter(function (e) { return e.areas.indexOf(d.order.area) >= 0; });
    var totalW = pool.reduce(function (a, e) { return a + e.w; }, 0);
    var r = Math.random() * totalW, evt = pool[0];
    for (var i = 0; i < pool.length; i++) {
      r -= pool[i].w;
      if (r <= 0) { evt = pool[i]; break; }
    }

    var ctx = { s: S, order: d.order, eff: eff };
    var choices = evt.choices
      .filter(function (ch) { return !ch.cond || ch.cond(ctx); })
      .map(function (ch) {
        return {
          t: ch.t,
          run: function () {
            eff(ch.run(ctx) || {});
            closeModal();
            checkAchievements();
            save();
            render();
          },
        };
      });

    // 灵眸 1 级：预警绕路
    if (S.arts.shenshi >= 1) {
      choices.unshift({
        t: '👁️ 灵眸预警 · 绕路而行（耗时 +8s，规避此事）',
        run: function () {
          eff({ dt: 8, log: '灵眸微光一闪，你提前绕开了这场麻烦。', cls: 'l-good' });
          closeModal(); save(); render();
        },
      });
    }

    openModal('⚠️ ' + evt.title, evt.text, choices);
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

    // 结算报酬
    var pay = o.pay * (0.4 + ig / 160) * (stars >= 4 ? 1.2 : stars === 3 ? 0.9 : 0.6) * payMul();
    pay = Math.max(1, Math.round(pay));
    var tip = 0;
    var tipChance = 0.15 + 0.12 * S.arts.dianjin;
    if (good && Math.random() < tipChance) tip = Math.round(o.pay * (0.2 + Math.random() * 0.4));

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
      if (stars === 5) S.fiveStar++;
      log('✅ 送达！' + starStr + ' 好评 +' + pay + ' 灵石' + (tip ? '（小费 +' + tip + '）' : '') + '，功德 +' + meritGain, 'l-good');
      if (o.special === 'demon') {
        S.flags.demonServed = (S.flags.demonServed || 0) + 1;
        S.flags.demonCount = (S.flags.demonCount || 0) + 1;
        if (S.flags.demonCount >= 3) log('🌙 魔尊似乎对你另眼相看了……', 'l-gold');
      }
    } else if (bad) {
      S.bad++; S.badStreak++; S.goodStreak = 0;
      log('❌ 差评！' + starStr + (late ? '（超时）' : '') + ' 仅得 ' + pay + ' 灵石。' + o.customer + '扬言要给你点颜色看看。', 'l-bad');
    } else {
      S.goodStreak = 0; S.badStreak = 0;
      log('😐 送达，' + starStr + ' 对方没给评价。+' + pay + ' 灵石。', 'l-sys');
    }

    // 区域首送成就
    if (o.area >= 3) unlockAch('area4');
    if (o.area >= 4) unlockAch('area5');

    // 境界提升提示
    var lvBefore = S.flags.lastLevel || 1;
    var lvNow = level();
    if (lvNow > lvBefore) {
      log('🎉 境界突破！你已是「' + levelTitle() + '」！新区域/装备解锁。', 'l-gold');
      toast('境界突破 · ' + levelTitle());
      S.flags.lastLevel = lvNow;
    }

    checkAchievements();
    save();
    render();

    // 天谴判定（结算渲染之后弹）
    if (S.badStreak >= 3) {
      setTimeout(showWrath, 350);
    } else {
      checkDemonEnding();
    }
  }

  function showWrath() {
    var loss = Math.ceil(S.stones * 0.25);
    S.stones -= loss;
    S.merit = Math.max(0, S.merit - 10);
    S.badStreak = 0;
    unlockAch('wrath');
    log('⚡ 天谴降临！灵石 -' + loss + '，功德 -10。', 'l-bad');
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
    unlockAch('ending');
    log('📜 达成结局：' + e.name, 'l-gold');
    openModal('📜 ' + e.name, e.text + '\n\n—— 第 ' + S.run + ' 世 · 完 ——', [
      { t: '♻️ 进入轮回（保留成就，下一世速度 +5%）', run: reincarnate },
      { t: '继续这一世（自由模式）', run: function () { closeModal(); save(); render(); } },
    ]);
    save();
    render();
  }
  function reincarnate() {
    var legacy = Math.min(0.5, S.legacySpeed + 0.05);
    S = freshState(S.run + 1, legacy, S.achievements, S.endings);
    delivery = null;
    orders = [];
    riderAcc = 0;
    refillOrders();
    log('♻️ 第 ' + S.run + ' 世开始了。你带着一丝前世记忆——跑得比上一世快了一点。', 'l-gold');
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
    var r = Math.random();
    if (r < 0.4) {
      var g = clamp(Math.round(S.stones * 0.15) + 10, 10, 500);
      S.stones += g;
      toast('🦋 灵蝶赐福：灵石 +' + g);
      log('🦋 灵蝶落在你肩头，抖落一地灵石粉（+' + g + ' 灵石）。', 'l-gold');
    } else if (r < 0.65) {
      var m = rnd(8, 15);
      S.merit += m;
      toast('🦋 灵蝶赐福：功德 +' + m);
      log('🦋 灵蝶绕你飞了三圈，功德 +' + m + '。', 'l-gold');
    } else if (r < 0.85) {
      S.buffs.speedUntil = Date.now() + 60000;
      toast('🦋 灵蝶赐福：神速 60 秒！');
      log('🦋 灵蝶翅膀上的风灌进你的鞋底——60 秒内配送速度翻倍！', 'l-gold');
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
  function openModal(title, text, choices) {
    modalOpen = true;
    if (delivery && !delivery.pauseStart) delivery.pauseStart = Date.now();
    $('#modalTitle').textContent = title;
    $('#modalText').textContent = text;
    var box = $('#modalChoices');
    box.innerHTML = '';
    choices.forEach(function (ch) {
      var b = document.createElement('button');
      b.className = 'btn';
      b.textContent = ch.t;
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
    $('#stStones').textContent = S.stones;
    $('#stMerit').textContent = S.merit;
    var rate = goodRate();
    $('#stRate').textContent = rate === null ? '--' : rate + '%';
    $('#stRate').className = 'v ' + (rate !== null && rate >= 85 ? 'green' : rate !== null && rate < 60 ? 'red' : '');
    $('#stLevel').textContent = levelTitle();
    $('#stMount').textContent = DATA.MOUNTS[S.mount].name;
    $('#stTotal').textContent = S.total + ' 单';
    $('#runTag').textContent = S.run > 1 ? '第 ' + S.run + ' 世' : '';
  }

  function renderBanner() {
    var b = $('#banner');
    if (!delivery) { b.classList.add('hidden'); return; }
    b.classList.remove('hidden');
    var o = delivery.order;
    var el = elapsed(delivery);
    var prog = clamp(el / delivery.expect * 100, 0, 100);
    var left = Math.ceil(o.limit - el);
    $('#bannerOrder').innerHTML =
      '送给 <b>' + esc(o.customer) + '</b> · ' + esc(o.food) +
      ' <span class="muted small">（' + DATA.AREAS[o.area].name + '）</span>';
    $('#barProg').style.width = prog + '%';
    $('#barFood').style.width = delivery.integrity + '%';
    $('#txtFood').textContent = '完整 ' + Math.round(delivery.integrity) + '%';
    var t = $('#txtTime');
    t.textContent = left >= 0 ? '剩 ' + left + 's' : '超时 ' + (-left) + 's';
    t.className = 'bar-num' + (left < 0 ? ' late' : '');
  }

  function buffLine() {
    var parts = [];
    if (Date.now() < S.buffs.speedUntil) parts.push('⚡神速中（速度×2，剩 ' + Math.ceil((S.buffs.speedUntil - Date.now()) / 1000) + 's）');
    if (S.buffs.safeNext > 0) parts.push('🛡️平安符（下一单零损耗）');
    return parts.length ? '<div class="small buff-line center">' + parts.join(' · ') + '</div>' : '';
  }

  function renderOrders() {
    var pane = $('#pane-orders');
    if (delivery) {
      pane.innerHTML =
        '<div class="order"><div class="o-body center">🛵 配送进行中……留意途中变故。</div></div>' + buffLine();
      return;
    }
    var html = '';
    var rate = goodRate();
    if ((S.flags.demonCount || 0) >= 3 && S.endings.indexOf('demon') < 0) {
      html += '<div class="order special"><div class="o-body">🌙 魔尊给你留了言：「今夜，再来一趟。本尊有话对你说。」</div></div>';
    }
    orders.forEach(function (o) {
      var est = Math.ceil(baseTime(o) / speed());
      var risky = est > o.limit;
      html += '<div class="order' + (o.special ? ' special' : '') + '">' +
        '<div class="o-head"><span class="o-name">' + esc(o.customer) + '</span>' +
        '<span class="o-area">📍 ' + DATA.AREAS[o.area].name + '</span></div>' +
        '<div class="o-body">🍜 ' + esc(o.food) + (o.note ? '<br><span class="muted small">' + esc(o.note) + '</span>' : '') + '</div>' +
        '<div class="o-meta"><span>报酬 <b class="o-pay">' + o.pay + ' 灵石</b></span>' +
        '<span>时限 <b>' + o.limit + 's</b></span>' +
        '<span>预计 <b' + (risky ? ' class="red"' : '') + '>' + est + 's</b></span></div>' +
        '<button class="btn primary" data-accept="' + o.id + '">接单出发</button></div>';
    });
    html += '<div class="row-btns">' +
      '<button class="btn" id="btnReroll">🔄 换一批（-5 灵石）</button>' +
      '<button class="btn' + (S.meditating ? ' primary' : '') + '" id="btnMeditate">🧘 ' + (S.meditating ? '打坐中…' : '打坐积功德') + '</button></div>';
    html += buffLine();
    var ps = playerScore(), rs = rivalScore();
    html += '<div class="muted small center mt8">好评率 ' + (rate === null ? '--' : rate + '%') +
      ' · 连续好评 ' + S.goodStreak + ' · 连续差评 ' + S.badStreak + '（三连差评会遭天谴⚡）</div>' +
      '<div class="muted small center">🏆 骑手榜：你 ' + ps + ' 分' +
      (ps > rs ? ' 🥇榜一' : ' 🥈第二') + ' · 蓝袍宗·燕十三 ' + rs + ' 分</div>';
    pane.innerHTML = html;
  }

  function renderShop() {
    var pane = $('#pane-shop');
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
    // 回家符
    var homeOk = endingAvailable('home');
    html += '<div class="item">' +
      '<div class="i-info"><div class="i-name">跨界回家符<span class="lv">结局道具</span></div>' +
      '<div class="i-desc">撕开即可回到你原来的世界。需 6666 灵石，骑手长老（Lv.6）方可催动。</div></div>' +
      (S.endings.indexOf('home') >= 0
        ? '<button class="btn" disabled>已达成</button>'
        : '<button class="btn' + (homeOk ? ' primary' : '') + '" data-ending="home"' + (homeOk ? '' : ' disabled') + '>6666 灵石</button>') +
      '</div>';
    // 旺铺
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
    var next = lv < DATA.LEVELS.length ? DATA.LEVELS[lv] : null;
    var html = '<div class="sec-title">修为</div>' +
      '<div class="item"><div class="i-info"><div class="i-name">' + levelTitle() + '<span class="lv">Lv.' + lv + '</span></div>' +
      '<div class="i-desc">经验 ' + S.exp + (next ? ' / ' + next.exp + '（下一境：' + next.title + '）' : '（已至化境）') +
      ' · 当前速度 ' + speed().toFixed(2) + 'x' + (S.legacySpeed ? '（含轮回传承 +' + Math.round(S.legacySpeed * 100) + '%）' : '') + '</div></div></div>';

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
    var html = '<div class="sec-title">成就（' + S.achievements.length + '/' + DATA.ACHIEVEMENTS.length + '）' +
      '<span class="muted small"> · 每个成就永久 +2% 报酬</span></div>';
    DATA.ACHIEVEMENTS.forEach(function (a) {
      var done = S.achievements.indexOf(a.id) >= 0;
      html += '<div class="ach' + (done ? ' done' : '') + '"><div class="a-ico">' + a.ico + '</div>' +
        '<div><div class="a-name">' + a.name + '</div><div class="a-desc">' + a.desc + '</div></div></div>';
    });
    var ps = playerScore(), rs = rivalScore();
    html += '<div class="sec-title">骑手榜</div>' +
      '<div class="muted small">🥇 ' + (ps > rs ? '你' : '蓝袍宗·燕十三') + '：' + Math.max(ps, rs) + ' 分<br>' +
      '🥈 ' + (ps > rs ? '你' : '蓝袍宗·燕十三') + '：' + Math.min(ps, rs) + ' 分<br>' +
      (ps > rs ? '你压他一头，继续保持。' : '他压你一头。手动送单、雇佣小弟、攒功德都能涨分。') +
      '<br>（得分 = 手动单×2 + 自动单×1 + 五星×3 + 功德÷10，每世重新计）</div>';
    html += '<div class="sec-title">结局（' + S.endings.length + '/' + DATA.ENDINGS.length + '）</div>';
    DATA.ENDINGS.forEach(function (e) {
      var done = S.endings.indexOf(e.id) >= 0;
      html += '<div class="ach' + (done ? ' done' : '') + '"><div class="a-ico">' + (done ? '📜' : '🔒') + '</div>' +
        '<div><div class="a-name">' + (done ? e.name : '？？？') + '</div>' +
        '<div class="a-desc">' + (done ? '已达成' : e.need) + '</div></div></div>';
    });
    html += '<div class="sec-title">生涯</div>' +
      '<div class="muted small">第 ' + S.run + ' 世 · 手动 ' + S.total + ' 单 · 小弟代送 ' + (S.flags.autoOrders || 0) +
      ' 单 · 好评 ' + S.good + ' · 差评 ' + S.bad + ' · 五星 ' + S.fiveStar + ' 次 · 捕蝶 ' + (S.flags.butterflies || 0) + ' 次</div>';
    pane.innerHTML = html;
  }

  function renderSettings() {
    var pane = $('#pane-settings');
    pane.innerHTML =
      '<div class="sec-title">存档</div>' +
      '<div class="muted small">进度自动保存在本浏览器（localStorage，键名前缀 cultexpress_）。可导出存档码迁移设备。</div>' +
      '<div class="row-btns"><button class="btn" id="btnExport">📤 导出存档</button>' +
      '<button class="btn" id="btnImport">📥 导入存档</button></div>' +
      '<textarea id="saveBox" placeholder="存档码会出现在这里；粘贴存档码后点「导入存档」"></textarea>' +
      '<div class="sec-title">危险区</div>' +
      '<div class="row-btns"><button class="btn danger" id="btnReset">🗑️ 删除存档重新开始</button></div>' +
      '<div class="sec-title">关于</div>' +
      '<div class="muted small">《我在修仙界送外卖》v1.1 · 纯文字单机小游戏 · 无外链资源 · 无声音<br>' +
      '题材：修仙 × 外卖 · 玩法：接单配送 + 随机事件 + 经营养成 + 雇佣自动化 + 多结局轮回</div>';
  }

  function render() {
    renderStats();
    renderBanner();
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

    if (delivery && !modalOpen) {
      var d = delivery;
      // 餐品自然损耗（平安符护体则免）
      if (!d.safeMode) {
        d.integrity = clamp(d.integrity - 0.22 * dt * (1 - 0.25 * S.box.warm), 0, 100);
      }
      var prog = elapsed(d) / d.expect;
      // 触发事件
      if (d.fired < d.events.length && prog >= d.events[d.fired]) {
        d.fired++;
        triggerEvent();
      }
      // 送达
      if (delivery && elapsed(delivery) >= delivery.expect) {
        finishDelivery();
      }
      renderBanner();
    }

    // 骑手小弟自动配送（弹窗时也不停工）
    if (S.riders > 0) {
      riderAcc += dt;
      while (riderAcc >= DATA.RIDERS.interval) {
        riderAcc -= DATA.RIDERS.interval;
        completeAutoOrders(S.riders);
      }
    }

    // 打坐
    if (S.meditating && !delivery) {
      meditateAcc += dt;
      if (meditateAcc >= 8) {
        meditateAcc = 0;
        S.merit += 1;
        log('🧘 打坐静修，功德 +1。', 'l-sys');
        renderStats();
        if (activeTab === 'cult') renderCult();
        save();
      }
    }

    // 灵蝶
    if (!modalOpen && now >= butterflyAt) spawnButterfly();

    // 宿敌：分数自然增长 + 传闻
    S.flags.rivalScore = (S.flags.rivalScore || 0) + dt * (3 + level()) / 60;
    if (now >= rivalLineAt && !modalOpen) {
      rivalLineAt = now + rnd(200, 400) * 1000;
      log('📰 ' + pick(DATA.RIVAL.lines), 'l-sys');
    }
    // 榜一易主检测
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
    var t = ev.target.closest('[data-accept],[data-mount],[data-box],[data-art],[data-ending],[data-rider],[data-dispatch],#btnReroll,#btnMeditate,#btnExport,#btnImport,#btnReset,.tab');
    if (!t) return;

    if (t.classList.contains('tab')) {
      activeTab = t.dataset.tab;
      document.querySelectorAll('.tab').forEach(function (x) { x.classList.toggle('active', x === t); });
      document.querySelectorAll('.pane').forEach(function (p) { p.classList.toggle('active', p.id === 'pane-' + activeTab); });
      render();
      return;
    }
    if (t.dataset.accept) { startOrder(t.dataset.accept); return; }
    if (t.dataset.mount) { buyMount(parseInt(t.dataset.mount, 10)); return; }
    if (t.dataset.box) { buyBox(t.dataset.box); return; }
    if (t.dataset.art) { buyArt(t.dataset.art); return; }
    if (t.dataset.ending) { doEnding(t.dataset.ending); return; }
    if (t.dataset.rider) { buyRider(); return; }
    if (t.dataset.dispatch) { buyDispatch(parseInt(t.dataset.dispatch, 10)); return; }

    switch (t.id) {
      case 'btnReroll':
        if (S.stones < 5 || delivery) return;
        S.stones -= 5;
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
      case 'btnExport':
        try {
          $('#saveBox').value = btoa(unescape(encodeURIComponent(JSON.stringify({ s: S, orders: orders }))));
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
          orders = Array.isArray(data.orders) ? data.orders : [];
          delivery = null;
          riderAcc = 0;
          refillOrders();
          save();
          log('📥 存档导入成功。', 'l-gold');
          render();
        } catch (e) { toast('存档码无效'); }
        break;
      }
      case 'btnReset':
        openModal('🗑️ 确认删档？', '此操作会清空当前进度（成就与结局记录一并删除），不可恢复。', [
          { t: '确认删除，重新做人', run: function () {
            try { localStorage.removeItem(KEY); } catch (e) {}
            S = freshState();
            orders = [];
            delivery = null;
            riderAcc = 0;
            refillOrders();
            closeModal();
            log('🌱 新的一世开始了。', 'l-sys');
            render();
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
    log('☀️ 欢迎回来，' + levelTitle() + '。餐箱还温着。', 'l-sys');
  }
  if (!S.flags.lastLevel) S.flags.lastLevel = level();
  refillOrders();
  render();
  settleOffline();
  scheduleButterfly();
  rivalLineAt = Date.now() + rnd(120, 240) * 1000;
})();
