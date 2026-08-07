/* =========================================================
 * 我在修仙界送外卖 — 数据表 v2.0
 * 所有游戏内容均由本文件驱动，加内容不需要动引擎。
 *
 * 事件选项新格式：
 *   { t: '按钮文字', hint: '后果提示', cond: (c)=>bool, 可选,
 *     outs: [
 *       { w: 权重, good: true|false,          // good/bad 会被气运与灵眸2级偏移
 *         res: { di,dt,ds,dm,dl,dr,log,cls }, // 静态结果
 *         run: (c)=>res,                       // 或动态结果函数
 *         set: { flagKey: 1 } }                // 因果链：设置状态旗标
 *     ] }
 * ========================================================= */
const DATA = {

  /* ---------- 骑手境界（按经验值晋升） ---------- */
  LEVELS: [
    { exp: 0,    title: '见习骑手' },
    { exp: 60,   title: '铜牌骑手' },
    { exp: 150,  title: '银牌骑手' },
    { exp: 300,  title: '金牌骑手' },
    { exp: 500,  title: '王牌骑手' },
    { exp: 780,  title: '骑手长老' },
    { exp: 1150, title: '骑手宗师' },
    { exp: 1650, title: '外卖道君' },
    { exp: 2350, title: '外卖天尊' },
    { exp: 3300, title: '配送圣人' },
  ],

  /* ---------- 配送区域 ---------- */
  AREAS: [
    { name: '坊市',   dist: 1, payMin: 10,  payMax: 18,  lv: 1, desc: '修士云集的集市，路况平坦，老少咸宜。' },
    { name: '外门',   dist: 2, payMin: 20,  payMax: 34,  lv: 2, desc: '宗门外门弟子驻地，山路十八弯。' },
    { name: '内门',   dist: 3, payMin: 40,  payMax: 66,  lv: 4, desc: '内门重地，护山大阵得走后门绕。' },
    { name: '秘境',   dist: 4, payMin: 90,  payMax: 155, lv: 6, desc: '破碎空间，灵气乱流，餐损自负。' },
    { name: '魔域',   dist: 5, payMin: 195, payMax: 360, lv: 8, desc: '魔修地盘，命可以丢，餐不能洒。' },
  ],

  /* ---------- 境界试炼（到达门槛后需完成试炼单才能突破） ---------- */
  TRIALS: [
    { gate: 4, area: 1, customer: '内门接引使', food: '拜山帖',
      title: '内门考核', desc: '把拜山帖完好送到外门关口的接引使手中' },
    { gate: 6, area: 2, customer: '秘境引路人', food: '秘境信标',
      title: '秘境试炼', desc: '把秘境信标送到引路人处，证明你扛得住灵气乱流' },
    { gate: 8, area: 3, customer: '魔域暗桩', food: '投名状礼盒',
      title: '魔域投名状', desc: '魔域只认实力：把礼盒安全送到暗桩手里' },
  ],

  /* ---------- 坐骑 ---------- */
  MOUNTS: [
    { name: '一双腿',   spd: 1.0,  cost: 0,    lv: 1, desc: '凡人之躯，跑断腿也只够温饱。' },
    { name: '纸鹤',     spd: 1.35, cost: 150,  lv: 2, desc: '符纸折的鹤，下雨天得收起来。' },
    { name: '飞剑',     spd: 1.9,  cost: 600,  lv: 4, desc: '御剑送外卖，剑穗上挂着餐箱。' },
    { name: '祥云',     spd: 2.8,  cost: 2500, lv: 6, desc: '一朵会认路的云，坐着能眯一会儿。' },
    { name: '挪移玉符', spd: 4.2,  cost: 9000, lv: 8, desc: '缩地成寸，骑手界的传说。' },
  ],

  /* ---------- 外卖箱法宝（三条强化线） ---------- */
  BOX: [
    { id: 'warm',  name: '保温结界', max: 3, costs: [80, 320, 1300],
      desc: '每级：餐品路上损耗 -25%', line: 'box' },
    { id: 'seal',  name: '定餐禁制', max: 3, costs: [80, 320, 1300],
      desc: '每级：意外事件餐损 -20%', line: 'box' },
    { id: 'space', name: '乾坤扩容', max: 3, costs: [110, 420, 1700],
      desc: '每级：送餐报酬 +8%', line: 'box' },
  ],

  /* ---------- 功法（功德兑换） ---------- */
  ARTS: [
    { id: 'shenfa',  name: '草上飞',   max: 3, costs: [25, 70, 160], desc: '每级：配送速度 +12%；硬闯类选择更稳' },
    { id: 'hutu',    name: '金钟罩',   max: 3, costs: [25, 70, 160], desc: '每级：意外损失 -15%；渡劫可用金钟护体' },
    { id: 'shenshi', name: '灵眸',     max: 2, costs: [35, 95],      desc: '1级：消耗道心施展绕路（连用递减）；2级：事件逢凶化吉' },
    { id: 'guixi',   name: '龟息术',   max: 2, costs: [30, 80],      desc: '每级：订单时限 +12%' },
    { id: 'dianjin', name: '点金手',   max: 2, costs: [35, 95],      desc: '每级：小费概率 +12%' },
  ],

  /* ---------- 客户名册 ---------- */
  CUSTOMERS: [
    ['坊市', '摆摊卖符的赵老三', '坊市', '丹房小学徒', '坊市', '算命瞎子陈半仙', '坊市', '散修刘大剑'],
    ['外门', '外门弟子·王二狗', '外门', '灵膳堂帮厨', '外门', '看守药园的老孙头', '外门', '练气三层的小师妹'],
    ['内门', '内门执事·铁面人', '内门', '闭关冲境的周师兄', '内门', '炼器峰的暴躁师姐', '内门', '戒律堂暗访弟子'],
    ['秘境', '秘境探险队队长', '秘境', '被困阵中的倒霉修士', '秘境', '寻宝世家的少东家', '秘境', '一缕残魂前辈'],
    ['魔域', '魔教外坛香主', '魔域', '血刀门少主', '魔域', '深居简出的老魔头', '魔域', '魔尊·独孤饿'],
  ],

  /* ---------- 餐品 ---------- */
  FOODS: [
    '灵米八宝粥', '培元丹（外卖盒装）', '炭烤灵鸡翅', '悟道茶一杯',
    '龙须面（加蛋）', '辟谷套餐', '烈焰椒炒灵菇', '冰镇酸梅灵露',
    '九转大肠（慎点）', '筑基汉堡', '飞剑串烤灵牛肉', '清心莲子羹',
    '麻辣烫（微辣也是烈焰椒）', '灵兽肉夹馍', '云霞桂花糕', '十全大补汤',
  ],

  /* ---------- 特殊订单 ---------- */
  SPECIALS: [
    {
      id: 'bigshot', minLv: 4, areas: [2, 3], chance: 0.08,
      customer: '闭关三百年的元婴老怪',
      note: '预约单：老怪出关在即，点名要吃热乎的。报酬三倍，超时不罚。',
      payMul: 3, timeMul: 3,
    },
    {
      id: 'demon', minLv: 8, areas: [4], chance: 0.12,
      customer: '魔尊·独孤饿',
      note: '神秘大单：魔尊深夜点餐，备注写着「不要葱」。',
      payMul: 2.5, timeMul: 1.3,
    },
    {
      id: 'rush', minLv: 2, areas: [0, 1, 2, 3], chance: 0.10,
      customer: null,
      note: '加急单：客人催得紧，时限减半，报酬 +60%。',
      payMul: 1.6, timeMul: 0.55,
    },
  ],

  /* ---------- 途中随机事件（多结果 · 因果链 · 属性偏移） ----------
   * ctx: { s, order }；res 字段：di 餐品 / dt 耗时秒 / ds 灵石 / dm 功德 / dl 气运 / dr 道心 / instant 瞬间送达
   */
  EVENTS: [
    {
      id: 'robber', w: 10, areas: [1, 2, 3, 4],
      title: '路遇劫修',
      text: '半空落下一个蒙面修士，拦住去路：「此山是我开！把餐箱留下！」',
      choices: [
        { t: '硬闯！', hint: '赌身法 · 成功脱身，失败餐损', outs: [
          { w: 42, good: true, res: { dm: 2, dr: 3, log: '你一个漂亮的蛇皮走位甩开劫修，对方吃了满嘴灰。', cls: 'l-good' } },
          { w: 18, good: true, res: { ds: 12, log: '劫修扑了个空摔了个狗啃泥，钱袋都摔出来了，你顺手捡走。', cls: 'l-gold' } },
          { w: 20, res: { di: -10, dt: 4, log: '你挣脱是挣脱了，但餐箱被他的袖风扫了一下。', cls: 'l-sys' } },
          { w: 20, bad: true, res: { di: -25, dt: 8, log: '劫修一掌拍歪了你的餐箱，汤汁洒了小半。', cls: 'l-bad' } },
        ] },
        { t: '破财消灾', hint: '付 15% 报酬 · 大体稳妥，但有人不讲武德', outs: [
          { w: 65, res: { ds: -8, log: '你塞了几块灵石。劫修掂了掂，放你走了。', cls: 'l-sys' } },
          { w: 20, good: true, res: { dm: 2, log: '劫修接过灵石忽然叹了口气，说起他修炼走火入魔的师父。你们聊了会儿，他亲自送你下山。', cls: 'l-good' } },
          { w: 15, bad: true, res: { ds: -15, di: -8, log: '劫修嫌少，又加收了「开箱检查费」，还顺走了一份小吃。', cls: 'l-bad' } },
        ] },
        { t: '请他一起吃', hint: '餐品 -20 · 可能结下善缘（因果）', outs: [
          { w: 45, good: true, set: { sparedRobber: 1 }, res: { di: -20, dm: 5, dl: 3, log: '劫修吃得热泪盈眶，说好久没吃过家常味，当场改邪归正。他记住了你的名字。', cls: 'l-good' } },
          { w: 35, res: { di: -20, log: '劫修吃完抹抹嘴走了，还顺走了筷子。', cls: 'l-sys' } },
          { w: 20, bad: true, res: { di: -28, log: '劫修吃完嫌淡，又打开餐箱加了把「料」——你的烈焰椒全没了。', cls: 'l-bad' } },
        ] },
        { t: '亮出长老令牌', hint: '需骑手长老境界 · 不战而屈人之兵', cond: (c) => c.s.__lv >= 6, outs: [
          { w: 80, good: true, res: { dm: 3, dr: 2, log: '劫修看清令牌脸色一白：「不知是长老当面！」躬身让路。', cls: 'l-gold' } },
          { w: 20, bad: true, res: { di: -12, log: '劫修冷笑：「长老？打的就是长老！」看来他上面有人。', cls: 'l-bad' } },
        ] },
      ],
    },
    {
      id: 'rain', w: 9, areas: [0, 1, 2],
      title: '灵雨突至',
      text: '天边毫无征兆地泼下一场灵雨。纸鹤怕水，餐箱怕潮。',
      choices: [
        { t: '冒雨赶路', hint: '餐品多半受损 · 偶尔有意外之喜', outs: [
          { w: 55, res: { di: -12, log: '你护着餐箱在雨里狂奔，像个落汤的修士。', cls: 'l-sys' } },
          { w: 25, good: true, res: { di: -5, dm: 2, log: '灵雨竟滋养了餐里的灵米，粥香更浓了。', cls: 'l-good' } },
          { w: 20, bad: true, res: { di: -22, dt: 5, log: '一个惊雷劈在旁边，你手一抖，汤洒了。', cls: 'l-bad' } },
        ] },
        { t: '找屋檐躲雨', hint: '耗时 +10s · 安稳，或有际遇', outs: [
          { w: 60, res: { dt: 10, dm: 1, log: '雨停得很快。屋檐下有只猫冲你喵了一声。', cls: 'l-sys' } },
          { w: 25, good: true, res: { dt: 10, dm: 3, dr: 2, log: '同躲雨的是位老茶客，请你喝了半盏热茶，浑身暖洋洋的。', cls: 'l-good' } },
          { w: 15, bad: true, res: { dt: 20, log: '这场雨没完没了，你等到怀疑人生。', cls: 'l-bad' } },
        ] },
      ],
    },
    {
      id: 'lostchild', w: 7, areas: [0, 1],
      title: '迷路的小童',
      text: '街角有个小童在哭，说找不到回家的路了。餐箱里的粥还烫着。',
      choices: [
        { t: '送他回家', hint: '耗时 +14s · 攒功德积气运，或许有报答', outs: [
          { w: 40, good: true, res: { dt: 14, dm: 6, dl: 4, log: '小童破涕为笑。你觉得这单跑得值，心里亮堂堂的。', cls: 'l-good' } },
          { w: 25, good: true, res: { dt: 14, dm: 6, ds: 20, dl: 2, log: '小童的爹竟是坊市富商，硬塞给你一袋灵石。', cls: 'l-gold' } },
          { w: 20, res: { dt: 18, log: '小童一路哭着指错三次路，总算送到了。', cls: 'l-sys' } },
          { w: 15, bad: true, res: { dt: 16, di: -10, log: '小童好奇掀开了你的餐箱，还把手伸了进去……', cls: 'l-bad' } },
        ] },
        { t: '指个路就走', hint: '不耗时 · 道心或有愧', outs: [
          { w: 70, res: { log: '你指了个方向。希望是对的。', cls: 'l-sys' } },
          { w: 30, bad: true, res: { dr: -3, log: '走出两条街，那哭声还黏在你后脑勺上。道心微瑕。', cls: 'l-sys' } },
        ] },
      ],
    },
    {
      id: 'crane', w: 8, areas: [2, 3],
      title: '仙鹤抢食',
      text: '一只仙鹤盯上了你的餐箱，翅膀一掀就要来啄！',
      choices: [
        { t: '挥袖驱赶', hint: '赌一把 · 护住或有战利品', outs: [
          { w: 45, good: true, res: { ds: 8, log: '你袖风如雷，仙鹤悻悻飞走，临走留下一根羽毛（据说能卖钱）。', cls: 'l-good' } },
          { w: 30, res: { di: -6, log: '仙鹤被赶跑了，但扑腾的翅膀扇翻了酱料碟。', cls: 'l-sys' } },
          { w: 25, bad: true, res: { di: -15, log: '仙鹤叼走了一个鸡翅，姿态优雅，十分可恶。', cls: 'l-bad' } },
        ] },
        { t: '分它一口', hint: '餐品 -8 · 结善缘（因果）', outs: [
          { w: 55, good: true, set: { fedCrane: 1 }, res: { di: -8, dm: 3, dl: 2, log: '仙鹤吃完冲你点头致意，翩翩而去。它记住了你的气味。', cls: 'l-good' } },
          { w: 30, res: { di: -8, log: '仙鹤吃了还想要，你抱着餐箱跑了。', cls: 'l-sys' } },
          { w: 15, bad: true, res: { di: -18, log: '仙鹤唤来了它全家。你落荒而逃。', cls: 'l-bad' } },
        ] },
      ],
    },
    {
      id: 'array', w: 8, areas: [2, 3, 4],
      title: '误入迷阵',
      text: '四周景色忽然重复起来——你踏进了一座残破的迷阵。',
      choices: [
        { t: '以力破阵', hint: '耗时为主 · 稳妥', outs: [
          { w: 60, res: { dt: 12, log: '你绕到阵眼踹了一脚，阵纹碎了一地。', cls: 'l-sys' } },
          { w: 20, good: true, res: { dt: 8, dm: 2, log: '阵眼里竟嵌着块灵晶，你抠下来换了功德。', cls: 'l-good' } },
          { w: 20, bad: true, res: { dt: 16, di: -8, log: '阵法反噬，一股气浪把你掀了个跟头。', cls: 'l-bad' } },
        ] },
        { t: '推演生门', hint: '赌悟性（灵眸加成）· 成则大有收获', outs: [
          { w: 40, good: true, res: { dm: 4, dr: 3, log: '你三步踏出生门，还顺手参悟了一缕阵道至理。', cls: 'l-good' } },
          { w: 25, good: true, res: { dm: 6, ds: 30, log: '生门之后是前人遗留的坐化石室，你取走供奉多年的灵石，替他烧了三炷香。', cls: 'l-gold' } },
          { w: 35, bad: true, res: { dt: 18, di: -5, log: '你在阵里转了八圈，最后是从狗洞爬出来的。', cls: 'l-bad' } },
        ] },
      ],
    },
    {
      id: 'market', w: 7, areas: [0, 1, 2],
      title: '路边捡漏',
      text: '一个地摊上摆着枚灰扑扑的玉简，摊主开价 10 灵石。',
      choices: [
        { t: '买！', hint: '-10 灵石 · 赌运气（气运影响很大）', outs: [
          { w: 25, good: true, res: { ds: 80, dl: 2, log: '玉简里竟是失传功法残页，转手卖了 80 灵石！', cls: 'l-gold' } },
          { w: 30, good: true, res: { dm: 4, dr: 2, log: '玉简记载着前辈修行心得，你若有所悟。', cls: 'l-good' } },
          { w: 25, res: { ds: -10, log: '玉简是空的。摊主也是空的——人早跑了。', cls: 'l-bad' } },
          { w: 20, bad: true, res: { ds: -10, dr: -2, log: '玉简是前朝的催债符，贴上你手腕念叨了一路。', cls: 'l-bad' } },
        ] },
        { t: '不买了，赶路要紧', hint: '无消耗', outs: [
          { w: 80, res: { log: '你压下捡漏的心，继续赶路。', cls: 'l-sys' } },
          { w: 20, res: { dr: 1, log: '克制住贪念，道心微涨。', cls: 'l-good' } },
        ] },
      ],
    },
    {
      id: 'demonpatrol', w: 9, areas: [3, 4],
      title: '魔修巡逻队',
      text: '一队魔修拦路盘查：「站住！箱子里装的什么？打开检查！」',
      choices: [
        { t: '配合检查', hint: '餐品多半受损 · 息事宁人', outs: [
          { w: 55, res: { di: -15, log: '他们翻得乱七八糟，汤都晃浑了，好歹放了行。', cls: 'l-bad' } },
          { w: 25, good: true, res: { di: -5, dm: 1, log: '带队的魔修意外地讲道理，翻完还帮你码整齐了。', cls: 'l-sys' } },
          { w: 20, bad: true, res: { di: -20, ds: -10, log: '他们不仅翻了餐，还以「形迹可疑」为由罚了款。', cls: 'l-bad' } },
        ] },
        { t: '塞点好处', hint: '-20 灵石 · 花钱买顺畅', outs: [
          { w: 70, res: { ds: -20, log: '为首的魔修掂了掂灵石，挥手放行，还祝用餐愉快。', cls: 'l-sys' } },
          { w: 30, bad: true, set: { offendedDemon: 0 }, res: { ds: -20, di: -10, log: '钱收了，餐照翻。魔修的规矩就是没规矩。', cls: 'l-bad' } },
        ] },
        { t: '呵斥他们', hint: '需金牌骑手境界 · 赌气势，小心结仇（因果）', cond: (c) => c.s.__lv >= 4, outs: [
          { w: 40, good: true, res: { dm: 4, dr: 4, log: '你一声断喝气贯长虹，魔修们竟被镇住，讪讪放行。', cls: 'l-gold' } },
          { w: 35, bad: true, set: { offendedDemon: 1 }, res: { di: -12, dt: 6, log: '为首的魔修眯起眼：「记住你了。」看来这梁子结下了。', cls: 'l-bad' } },
          { w: 25, res: { dt: 8, log: '僵持了半天，各退半步，你被多盘查了一刻钟。', cls: 'l-sys' } },
        ] },
        { t: '报出魔尊的名号', hint: '需给魔尊送过餐 · 一路绿灯', cond: (c) => (c.s.flags.demonCount || 0) > 0, outs: [
          { w: 90, good: true, res: { dm: 2, dr: 2, log: '「魔尊的餐也敢查？」巡逻队齐刷刷跪下，恭送你离开。', cls: 'l-gold' } },
          { w: 10, bad: true, res: { dt: 10, log: '有个新兵不信邪非要检查，被队长一巴掌拍翻。你等了半天热闹看完才走。', cls: 'l-sys' } },
        ] },
      ],
    },
    {
      id: 'bridge', w: 6, areas: [1, 2, 3],
      title: '断桥',
      text: '前方的吊桥断了，崖下云雾深不见底。',
      choices: [
        { t: '绕远路', hint: '耗时 +15s · 稳妥', outs: [
          { w: 75, res: { dt: 15, log: '绕是绕了点，好歹人车餐三全。', cls: 'l-sys' } },
          { w: 25, good: true, res: { dt: 15, ds: 10, log: '远路上有棵野灵果树，你摘了两枚卖钱。', cls: 'l-good' } },
        ] },
        { t: '飞过去', hint: '需纸鹤以上坐骑 · 潇洒高效', cond: (c) => c.s.mount >= 1, outs: [
          { w: 80, good: true, res: { dm: 1, dr: 1, log: '你催动坐骑掠过断崖，山风灌了满袖。', cls: 'l-good' } },
          { w: 20, bad: true, res: { di: -10, log: '崖谷妖风突起，你被吹得七荤八素，餐箱差点脱手。', cls: 'l-bad' } },
        ] },
        { t: '跳过去', hint: '赌命 · 成则一段佳话', outs: [
          { w: 30, good: true, res: { dm: 5, dr: 5, log: '你纵身一跃稳稳落地，只觉得自己帅极了。', cls: 'l-gold' } },
          { w: 30, res: { di: -12, dt: 10, log: '勉强扒住对岸，餐箱晃洒了些，人是上来了。', cls: 'l-sys' } },
          { w: 40, bad: true, res: { di: -30, dt: 20, log: '你挂在崖壁的松树上，餐箱比你先到了对岸——被扔过去的。', cls: 'l-bad' } },
        ] },
      ],
    },
    {
      id: 'foodspirit', w: 5, areas: [2, 3, 4],
      title: '餐品成精',
      text: '餐箱里传来动静——那份灵米粥吸足了天地灵气，成精了，正试图逃跑！',
      choices: [
        { t: '镇压！', hint: '餐品 -10 · 果断处置', outs: [
          { w: 70, res: { di: -10, dm: 2, log: '你一巴掌把粥精拍回了碗里，它还委屈地冒了个泡。', cls: 'l-sys' } },
          { w: 30, bad: true, res: { di: -18, log: '粥精负隅顽抗，碗里打了一架，撒了不少。', cls: 'l-bad' } },
        ] },
        { t: '跟它讲道理', hint: '赌口才 · 或成一段奇缘', outs: [
          { w: 45, good: true, res: { dm: 6, dr: 3, log: '粥精被你说服，自愿躺回碗里：「记得给我五星好评。」', cls: 'l-good' } },
          { w: 20, good: true, set: { fedCrane: 1 }, res: { dm: 8, ds: 25, log: '粥精感动于你的诚意，赠你一滴本命灵浆，可卖个好价钱。', cls: 'l-gold' } },
          { w: 35, bad: true, res: { di: -20, log: '谈判破裂，粥精洒了一路，只留下一句「我还会回来的」。', cls: 'l-bad' } },
        ] },
      ],
    },
    {
      id: 'oldman', w: 6, areas: [0, 1, 2, 3],
      title: '扫地老翁',
      text: '路边扫地的老翁忽然开口：「小友，老朽观你骨骼清奇，是个送外卖的好苗子。」',
      choices: [
        { t: '请教一二', hint: '耗时 +8s · 长者之言，或有后缘（因果）', outs: [
          { w: 60, good: true, set: { metOldman: 1 }, res: { dt: 8, dm: 8, dr: 3, log: '老翁传你三句配送心法：「餐要稳，路要熟，心要快。」你醍醐灌顶。', cls: 'l-gold' } },
          { w: 25, res: { dt: 8, dm: 3, log: '老翁讲了一堆陈年旧事，有用的就一句。', cls: 'l-sys' } },
          { w: 15, bad: true, res: { dt: 15, log: '老翁拉着你说个没完，你找借口溜了，耳朵还在嗡嗡。', cls: 'l-bad' } },
        ] },
        { t: '婉拒赶路', hint: '无消耗', outs: [
          { w: 85, res: { log: '老翁笑了笑，继续扫地，落叶没沾你一片衣角。', cls: 'l-sys' } },
          { w: 15, res: { dr: -1, log: '老翁望着你的背影叹了口气。你假装没听见。', cls: 'l-sys' } },
        ] },
      ],
    },
    {
      id: 'windfall', w: 5, areas: [0, 1, 2, 3, 4],
      title: '天降横财',
      text: '前方两名修士斗法，一只储物袋打着旋儿掉在你脚边。',
      choices: [
        { t: '捡起来', hint: '可能发财 · 也可能惹祸（气运影响大）', outs: [
          { w: 35, good: true, res: { ds: 35, log: '储物袋无主，里面灵石叮当作响。', cls: 'l-gold' } },
          { w: 20, good: true, res: { ds: 60, dl: 3, log: '袋里竟有瓶培元丹！你运气简直了。', cls: 'l-gold' } },
          { w: 25, res: { di: -12, dt: 10, log: '失主杀回来索袋，你被剑气削掉了半边筐。', cls: 'l-bad' } },
          { w: 20, bad: true, res: { dl: -4, dr: -3, log: '袋上附了追踪咒，你被追出三里地才甩掉。亏心事先败了气运。', cls: 'l-bad' } },
        ] },
        { t: '目不斜视走过去', hint: '攒道心积气运', outs: [
          { w: 80, res: { dm: 2, dr: 2, log: '不是自己的钱不捡，你把外卖箱抱得更紧了。', cls: 'l-good' } },
          { w: 20, good: true, res: { dm: 3, dl: 3, dr: 2, log: '斗法的胜者注意到你的品格，遥遥点头致意。', cls: 'l-good' } },
        ] },
      ],
    },
    {
      id: 'shortcut', w: 7, areas: [1, 2, 3, 4],
      title: '神秘小路',
      text: '地图上没标的一条小路，看起来能抄近道，也可能通向狼窝。',
      choices: [
        { t: '走小路', hint: '赌 · 成则省时，败则耗时', outs: [
          { w: 45, good: true, res: { dt: -8, log: '果然是近道！你在心里给这条路标了颗星。', cls: 'l-good' } },
          { w: 15, good: true, res: { dt: -10, ds: 15, log: '近道尽头有个无人看守的灵草园，你礼貌地只拿了一点。', cls: 'l-gold' } },
          { w: 40, bad: true, res: { dt: 12, di: -5, log: '小路尽头是片沼泽，你深一脚浅一脚地拔了出来。', cls: 'l-bad' } },
        ] },
        { t: '老老实实走大路', hint: '无消耗', outs: [
          { w: 90, res: { log: '大路朝天，稳字当先。', cls: 'l-sys' } },
          { w: 10, res: { dr: 1, log: '稳也是一种修行。', cls: 'l-good' } },
        ] },
      ],
    },
    {
      id: 'courier', w: 4, areas: [0, 1, 2, 3],
      title: '同行相遇',
      text: '对面来了个蓝袍宗的骑手，车把上挂着七八个餐箱，冲你扬了扬下巴。',
      choices: [
        { t: '交流心得', hint: '攒功德 · 或得情报', outs: [
          { w: 60, good: true, res: { dm: 3, dr: 1, log: '你们交换了各区域的抄近道心得，惺惺相惜。', cls: 'l-good' } },
          { w: 25, good: true, res: { dm: 3, ds: 15, log: '他悄悄卖给你一张「魔域暗道图」，说是退役前的心意。', cls: 'l-gold' } },
          { w: 15, res: { dt: 5, log: '聊得太投入，耽误了些脚程。', cls: 'l-sys' } },
        ] },
        { t: '比一场速度', hint: '赌身法 · 赢了涨道心', outs: [
          { w: 40, good: true, res: { dm: 4, dt: -5, dr: 4, log: '你险胜半个身位！蓝袍骑手心服口服。', cls: 'l-gold' } },
          { w: 25, res: { dt: 4, log: '不分胜负，约定下回再比。', cls: 'l-sys' } },
          { w: 35, bad: true, res: { dt: 6, dr: -2, log: '你输了。对方留下一个潇洒的背影和一句「黄袍宗不过如此」。', cls: 'l-bad' } },
        ] },
      ],
    },
    {
      id: 'beast', w: 8, areas: [3, 4],
      title: '灵兽拦路',
      text: '一头獠牙灵兽蹲在路中央，眼睛直勾勾盯着你的餐箱。',
      choices: [
        { t: '硬闯', hint: '重伤风险（金钟罩减伤）', outs: [
          { w: 30, good: true, res: { dm: 3, dr: 4, log: '灵兽被你的气势吓退，夹着尾巴跑了。', cls: 'l-good' } },
          { w: 25, res: { di: -15, dt: 8, log: '灵兽扑了个空，利爪在餐箱上留下三道痕。', cls: 'l-sys' } },
          { w: 45, bad: true, res: { di: -28, dt: 12, log: '灵兽一爪掀翻餐箱，你抢救回了大半，十分狼狈。', cls: 'l-bad' } },
        ] },
        { t: '丢一份小吃引开', hint: '餐品 -12 · 稳妥', outs: [
          { w: 80, res: { di: -12, log: '灵兽扑向小吃，你趁机溜之大吉。', cls: 'l-sys' } },
          { w: 20, good: true, res: { di: -8, dm: 2, log: '灵兽吃完竟帮你把掉落的小零件叼了回来。', cls: 'l-good' } },
        ] },
      ],
    },
    {
      id: 'spring', w: 4, areas: [2, 3],
      title: '灵泉眼',
      text: '路边一眼灵泉汩汩冒着灵气，据说喝一口能解乏。',
      choices: [
        { t: '喝一口', hint: '耗时 +5s · 恢复状态', outs: [
          { w: 65, good: true, res: { dt: 5, di: 10, dr: 3, log: '泉水甘甜，你顺手把餐箱里的灵露也续满了。', cls: 'l-good' } },
          { w: 20, good: true, res: { dt: 5, di: 8, dl: 3, log: '泉底沉着前人祈福的铜钱，你摸了两枚，沾沾福气。', cls: 'l-good' } },
          { w: 15, bad: true, res: { dt: 12, log: '泉水太凉，你蹲旁边缓了半天。', cls: 'l-bad' } },
        ] },
        { t: '不渴，赶路', hint: '无消耗', outs: [
          { w: 100, res: { log: '你咽了口唾沫，继续跑。', cls: 'l-sys' } },
        ] },
      ],
    },

    /* ---------- 因果链事件（由之前的选择解锁） ---------- */
    {
      id: 'robberReturn', w: 8, areas: [1, 2, 3, 4],
      cond: (c) => c.s.flags.sparedRobber >= 1,
      title: '劫修报恩',
      text: '一个熟悉的身影落在路边——是那位被你请过饭的劫修。他如今换上了镖师的制服：「恩公！我可等到你了！」',
      choices: [
        { t: '收下谢礼', hint: '善缘结果', outs: [
          { w: 60, good: true, res: { ds: 40, dm: 3, log: '他塞给你一包灵石：「如今走镖挣的，干净！」你俩都笑了。', cls: 'l-gold' } },
          { w: 40, good: true, res: { dm: 8, dr: 5, log: '他执意护送你一程，一路畅通无阻。', cls: 'l-gold' } },
        ] },
        { t: '婉拒，请他喝酒', hint: '再结善缘 · 气运小涨', outs: [
          { w: 100, good: true, res: { dt: 8, dm: 5, dl: 5, log: '路边小摊，两碗浊酒。他说这辈子没服过谁，就服你。', cls: 'l-gold' } },
        ] },
      ],
    },
    {
      id: 'craneReturn', w: 8, areas: [2, 3, 4],
      cond: (c) => c.s.flags.fedCrane >= 1,
      title: '仙鹤引路',
      text: '头顶一声清唳——是那只仙鹤！它盘旋两圈，示意你跟上。',
      choices: [
        { t: '跟它走', hint: '善缘结果 · 大幅省时', outs: [
          { w: 70, good: true, res: { dt: -12, dm: 2, log: '仙鹤带你穿过一条云中小径，省了大段山路。', cls: 'l-gold' } },
          { w: 30, good: true, res: { ds: 30, dm: 2, log: '仙鹤落在一处岩缝前——里面竟藏着前人埋的灵石匣。', cls: 'l-gold' } },
        ] },
      ],
    },
    {
      id: 'demonAmbush', w: 12, areas: [3, 4],
      cond: (c) => c.s.flags.offendedDemon >= 1,
      title: '魔修伏击',
      text: '「果然是你。」路前后各落下两名魔修，为首的正是巡逻队那位：「上次不是很能耐吗？」',
      choices: [
        { t: '迎战', hint: '赌实力 · 成则扬名，败则重伤', outs: [
          { w: 35, good: true, set: { offendedDemon: 0 }, res: { dm: 8, dr: 6, log: '你且战且退，最后一记回马枪逼得对方罢手：「好本事，一笔勾销。」', cls: 'l-gold' } },
          { w: 30, res: { di: -18, dt: 10, log: '你寻了个空档突围而出，餐箱挨了好几下。', cls: 'l-bad' } },
          { w: 35, bad: true, res: { di: -35, dt: 15, ds: -30, log: '双拳难敌四手，你被「教育」了一顿，钱也被搜了去。', cls: 'l-bad' } },
        ] },
        { t: '认怂赔罪', hint: '-30 灵石 · 了结恩怨', outs: [
          { w: 80, set: { offendedDemon: 0 }, res: { ds: -30, log: '你奉上灵石鞠躬赔罪。魔修哼了一声：「下回放聪明点。」恩怨两清。', cls: 'l-sys' } },
          { w: 20, bad: true, res: { ds: -30, di: -15, log: '钱收了，人还是挨了一脚。「这是利息。」', cls: 'l-bad' } },
        ] },
      ],
    },
    {
      id: 'oldmanTest', w: 6, areas: [0, 1, 2, 3],
      cond: (c) => c.s.flags.metOldman >= 1 && c.s.merit >= 60,
      title: '扫地老翁的考验',
      text: '又是那位扫地老翁。他放下扫帚，浑浊的眼睛忽然清明：「小友，老朽且问你——送的到底是餐，还是人心？」',
      choices: [
        { t: '「送的是人心。」', hint: '以道心作答', outs: [
          { w: 70, good: true, res: { dm: 15, dr: 8, log: '老翁大笑三声，扫地声远去：「善。」一缕金光没入你眉心。', cls: 'l-gold' } },
          { w: 30, res: { dm: 5, log: '老翁点点头又摇摇头：「答得好，但还差些火候。」', cls: 'l-sys' } },
        ] },
        { t: '「送的是餐，热乎的餐。」', hint: '以本分作答', outs: [
          { w: 60, good: true, res: { dm: 12, ds: 50, log: '老翁怔了怔，抚掌道：「大巧若拙！」硬塞给你一袋灵石。', cls: 'l-gold' } },
          { w: 40, res: { dm: 4, log: '老翁笑而不语，继续扫地。你隐隐觉得错过了什么。', cls: 'l-sys' } },
        ] },
      ],
    },
    {
      id: 'timeslip', w: 1, areas: [0, 1, 2, 3, 4],
      title: '时空裂隙（彩蛋）',
      text: '前方的空间忽然像水面一样荡开，露出一条流光溢彩的缝隙——直通往……目的地门口？！',
      choices: [
        { t: '穿过去！', hint: '瞬间送达 · 天赐良机', outs: [
          { w: 90, good: true, res: { instant: true, dm: 3, log: '你一步跨过裂隙，直接站在了客人家门口。时间？不存在的。', cls: 'l-gold' } },
          { w: 10, bad: true, res: { dt: 10, log: '裂隙在你脚前合拢了，还夹掉了你一只鞋。', cls: 'l-bad' } },
        ] },
      ],
    },
  ],

  /* ---------- 差评三连 · 天谴 ---------- */
  WRATH: {
    title: '天谴！！',
    text: '三连差评惊动了天道。\n\n乌云在你头顶拧成一个漩涡，一道紫色天雷精准地劈在你的餐箱上。\n\n「检测到骑手服务质量恶劣，予以雷罚。」\n\n灵石损失 25%，功德 -10，气运 -5。餐箱冒着青烟，你闻着像烤糊的灵米粥。',
  },

  /* ---------- 雇佣骑手（自动化配送） ---------- */
  RIDERS: {
    baseCost: 120, costMul: 2.1, max: 8,
    interval: 40,
    efficiency: 0.6,
    offlineCap: 8 * 3600,
  },

  /* ---------- 调度令牌（扩展自动配送区域，需按顺序购买） ---------- */
  DISPATCH: [
    { name: '外门调度令', cost: 500,  area: 2, eff: 0.55, desc: '骑手小弟可自动配送外门订单，报酬系数 55%。' },
    { name: '内门调度令', cost: 1500, area: 3, eff: 0.5,  desc: '骑手小弟可自动配送内门订单，报酬系数 50%。' },
    { name: '秘境调度令', cost: 5000, area: 4, eff: 0.45, desc: '骑手小弟可自动配送秘境订单，报酬系数 45%。（魔域太险，小弟不去）' },
  ],

  /* ---------- 灵蝶 · 天降机缘（变率奖励） ---------- */
  BUTTERFLY: {
    minGap: 45,
    maxGap: 90,
    life: 6,
  },

  /* ---------- 宿敌 · 蓝袍宗燕十三 ---------- */
  RIVAL: {
    name: '燕十三',
    lines: [
      '传闻蓝袍宗·燕十三完成了一趟魔域配送，餐箱纹丝未损。',
      '燕十三在坊市放话：黄袍宗不过如此。',
      '有食客给燕十三写了首赞美诗，贴在了坊市告示栏。',
      '燕十三新换了一柄飞剑，剑穗是纯金的。',
      '蓝袍宗宣布：燕十三本月零差评。',
      '燕十三送餐途中顺手镇压了一头妖兽，围观者众。',
      '燕十三接受《修仙快报》采访：「我从不把黄袍宗的骑手放在眼里。」',
      '有人看见燕十三深夜还在跑单，卷得令人发指。',
      '燕十三的灵鹤坐骑生了二胎，他请客摆了三桌。',
      '坊市赌档开出盘口：本月骑手榜，燕十三一骑绝尘。',
    ],
    taunt: '这一世，燕十三也来了。他在榜上留了言：「好久不见，手下败将。」',
  },

  /* ---------- 轮回天赋（天道印记兑换，跨世永久生效） ---------- */
  TALENTS: [
    { id: 'feet',   name: '脚力传承', max: 3, costs: [1, 2, 3], desc: '每级：每一世开局配送速度 +5%' },
    { id: 'wealth', name: '黄袍世家', max: 2, costs: [1, 2],    desc: '每级：每一世开局灵石 +150' },
    { id: 'scout',  name: '伯乐之眼', max: 1, costs: [2],       desc: '每一世开局自带 1 名骑手小弟' },
    { id: 'shield', name: '天道庇护', max: 2, costs: [2, 3],    desc: '每级：每一世可免疫 1 次天谴' },
    { id: 'eye',    name: '慧眼识单', max: 2, costs: [1, 2],    desc: '每级：可选订单 +1 张' },
    { id: 'bond',   name: '前世旧识', max: 1, costs: [3],       desc: '轮回后熟客好感全部保留' },
  ],

  /* ---------- 成就 ---------- */
  ACHIEVEMENTS: [
    { id: 'first',     ico: '🍱', name: '初入江湖',   desc: '送出第一单' },
    { id: 'orders50',  ico: '🛵', name: '熟门熟路',   desc: '累计送出 50 单' },
    { id: 'orders200', ico: '🏆', name: '配送传奇',   desc: '累计送出 200 单' },
    { id: 'five30',    ico: '⭐', name: '五星专业户', desc: '拿到 30 次五星好评' },
    { id: 'streak10',  ico: '🔥', name: '零差评神话', desc: '连续 10 次好评' },
    { id: 'wrath',     ico: '⚡', name: '渡劫失败',   desc: '遭遇一次天谴' },
    { id: 'allmounts', ico: '🗡️', name: '坐骑收藏家', desc: '集齐全部坐骑' },
    { id: 'area4',     ico: '🌀', name: '秘境首送',   desc: '完成一次秘境配送' },
    { id: 'area5',     ico: '😈', name: '魔域首送',   desc: '完成一次魔域配送' },
    { id: 'merit500',  ico: '🙏', name: '功德无量',   desc: '功德累计达 500' },
    { id: 'rich',      ico: '💰', name: '灵石大亨',   desc: '存款达到 5000 灵石' },
    { id: 'demon1',    ico: '🌙', name: '魔尊的食客', desc: '给魔尊送过一次餐' },
    { id: 'ending',    ico: '📜', name: '一段传说',   desc: '达成任意结局' },
    { id: 'hire1',     ico: '🐣', name: '招兵买马',   desc: '雇佣第一名骑手小弟' },
    { id: 'butterfly5', ico: '🦋', name: '捕蝶达人',  desc: '点中 5 次灵蝶' },
    { id: 'top1',      ico: '🥇', name: '黄袍第一人', desc: '在骑手榜上超越燕十三登顶' },
    { id: 'regular3',  ico: '❤️', name: '人情练达',   desc: '拥有 3 位熟客' },
    { id: 'trialpass', ico: '⚔️', name: '持证上岗',   desc: '完成一次境界试炼' },
  ],

  /* ---------- 结局 ---------- */
  ENDINGS: [
    {
      id: 'home', name: '还乡结局 · 回家',
      need: '在商铺购买「跨界回家符」（6666 灵石，骑手长老可购）',
      text: '你捏碎玉符，熟悉的白光裹住全身。\n\n再睁眼，你站在自家楼下，手里还攥着那个餐箱。\n手机响了，是新订单提示音。\n你笑了笑，骑上电动车冲进了晚高峰。\n\n——这一世，你依然是全城最快的骑手。',
    },
    {
      id: 'tycoon', name: '商业结局 · 外卖帝国',
      need: '存款 9999 灵石 + 好评率 ≥ 85% + 累计 80 单，在商铺盘下旺铺',
      text: '你盘下坊市最旺的铺面，挂上「黄袍宗总舵」的匾额。\n\n三年后，修仙界七十二宗门，门门都有你的外卖分号。\n魔域开设专线那日，魔尊亲自剪彩。\n\n——修仙界史书记载：配送之道，自此大兴。',
    },
    {
      id: 'ascend', name: '飞升结局 · 配送证道',
      need: '功德满 1000，在修炼页飞升',
      text: '功德圆满那日，九天之上垂下金光。\n\n你回望人间：坊市的粥还温着，内门的路还熟着。\n原来这些年你送的不是餐——\n是深夜里的一口热乎，是闭关者的人间烟火。\n\n——天道册封：配送真君。三界六道，有求必达。',
    },
    {
      id: 'demon', name: '隐藏结局 · 魔尊的深夜食堂',
      need: '给魔尊送餐三次且全获好评',
      text: '第三次送餐，魔尊叫住了你。\n\n「本尊等一个人，等了三千年。」\n他揭开斗篷——斗篷下是一张你无比熟悉的脸。\n那是上辈子总给你五星好评的那位老主顾。\n\n——原来最深的执念，是深夜里没人送的那碗粥。',
    },
  ],
};
