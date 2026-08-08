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
      tags: ['danger'],
      intel: '此人气息虚浮、色厉内荏——多半不敢真拼命。',
      title: '路遇劫修',
      text: '半空落下一个蒙面修士，拦住去路：「此山是我开！把餐箱留下！」',
      choices: [
        { t: '硬闯！', pers: 'adventure', hint: '赌身法 · 成功脱身，失败餐损', outs: [
          { w: 42, good: true, res: { dm: 2, dr: 3, log: '你一个漂亮的蛇皮走位甩开劫修，对方吃了满嘴灰。', cls: 'l-good' } },
          { w: 18, good: true, res: { ds: 12, log: '劫修扑了个空摔了个狗啃泥，钱袋都摔出来了，你顺手捡走。', cls: 'l-gold' } },
          { w: 20, res: { di: -10, dt: 4, log: '你挣脱是挣脱了，但餐箱被他的袖风扫了一下。', cls: 'l-sys' } },
          { w: 20, bad: true, res: { di: -25, dt: 8, log: '劫修一掌拍歪了你的餐箱，汤汁洒了小半。', cls: 'l-bad' } },
        ] },
        { t: '破财消灾', pers: 'business', hint: '付 15% 报酬 · 大体稳妥，但有人不讲武德', outs: [
          { w: 65, res: { ds: -8, log: '你塞了几块灵石。劫修掂了掂，放你走了。', cls: 'l-sys' } },
          { w: 20, good: true, res: { dm: 2, log: '劫修接过灵石忽然叹了口气，说起他修炼走火入魔的师父。你们聊了会儿，他亲自送你下山。', cls: 'l-good' } },
          { w: 15, bad: true, res: { ds: -15, di: -8, log: '劫修嫌少，又加收了「开箱检查费」，还顺走了一份小吃。', cls: 'l-bad' } },
        ] },
        { t: '请他一起吃', pers: 'kindness', hint: '餐品 -20 · 可能结下善缘（因果）', outs: [
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
        { t: '冒雨赶路', pers: 'adventure', hint: '餐品多半受损 · 偶尔有意外之喜', outs: [
          { w: 55, res: { di: -12, log: '你护着餐箱在雨里狂奔，像个落汤的修士。', cls: 'l-sys' } },
          { w: 25, good: true, res: { di: -5, dm: 2, log: '灵雨竟滋养了餐里的灵米，粥香更浓了。', cls: 'l-good' } },
          { w: 20, bad: true, res: { di: -22, dt: 5, log: '一个惊雷劈在旁边，你手一抖，汤洒了。', cls: 'l-bad' } },
        ] },
        { t: '找屋檐躲雨', pers: 'cautious', hint: '耗时 +10s · 安稳，或有际遇', outs: [
          { w: 60, res: { dt: 10, dm: 1, log: '雨停得很快。屋檐下有只猫冲你喵了一声。', cls: 'l-sys' } },
          { w: 25, good: true, res: { dt: 10, dm: 3, dr: 2, log: '同躲雨的是位老茶客，请你喝了半盏热茶，浑身暖洋洋的。', cls: 'l-good' } },
          { w: 15, bad: true, res: { dt: 20, log: '这场雨没完没了，你等到怀疑人生。', cls: 'l-bad' } },
        ] },
      ],
    },
    {
      id: 'lostchild', w: 7, areas: [0, 1],
      tags: ['kind'],
      intel: '孩子腰间挂着一枚内门玉佩——送他回家，或有厚报。',
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
      tags: ['kind','wild'],
      intel: '鹤羽沾着秘境的灵气——它认得捷径。',
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
      tags: ['danger'],
      intel: '阵纹有一处旧损——生门在东南。',
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
      tags: ['biz'],
      intel: '今日灵材行看涨——讨价还价有赚头。',
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
      tags: ['danger'],
      intel: '为首魔修腰挂「罚」字牌——他们只想捞钱，不想动手。',
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
      tags: ['biz'],
      intel: '食灵气机纯正，以诚待之可得馈赠。',
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
      tags: ['kind'],
      intel: '老翁扫地暗合道韵——绝非凡人，善待之。',
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
      tags: ['luck'],
      intel: '宝光外泄却无禁制——当真是无主之物？',
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
      tags: ['danger'],
      intel: '近路上有新鲜脚印——刚有人走过，未必安全。',
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
      tags: ['biz'],
      intel: '对方的货单鼓鼓囊囊——是笔大买卖。',
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
      tags: ['wild'],
      intel: '灵兽嘴角有食渍——它刚吃饱，只是馋。',
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

    /* ---------- v2.1 扩充事件（8 常规 + 2 因果链） ---------- */
    {
      id: 'peer', w: 7, areas: [0, 1, 2, 3, 4],
      tags: ['kind'],
      intel: '青袍骑手的餐箱印着同行大坊的徽记——结个善缘有用。',
      title: '迷路的外卖同行',
      text: '一个穿青袍的骑手在路边急得团团转：「道友！这单送去哪儿啊？地图玉简碎了！」',
      choices: [
        { t: '帮他指路', pers: 'kindness', hint: '耗时 +6s · 结善缘，或有回报', outs: [
          { w: 45, good: true, res: { dt: 6, dm: 4, dr: 2, log: '你给他指了条近路。他千恩万谢，说改天请你喝灵茶。', cls: 'l-good' } },
          { w: 30, good: true, res: { dt: 6, ds: 15, log: '他硬塞给你几块灵石当谢礼：「同行的规矩不能坏！」', cls: 'l-gold' } },
          { w: 25, res: { dt: 10, log: '你俩对着碎玉简研究了半天，路是指明了，你也耽误了。', cls: 'l-sys' } },
        ] },
        { t: '赶时间，爱莫能助', pers: 'cautious', hint: '无消耗 · 但可能败人品', outs: [
          { w: 80, res: { log: '你喊了句「去问土地庙」就飞远了。', cls: 'l-sys' } },
          { w: 20, bad: true, res: { dl: -2, log: '他幽怨的眼神在你背后盯了一路，你心里有点发毛。', cls: 'l-bad' } },
        ] },
        { t: '比比谁快', pers: 'adventure', hint: '赌身法 · 赢了有彩头', outs: [
          { w: 40, good: true, res: { ds: 20, dt: -4, log: '你一骑绝尘！他服气地掏出彩头：「黄袍宗果然名不虚传！」', cls: 'l-gold' } },
          { w: 30, res: { dt: 6, log: '并驾齐驱三里地，不分胜负，各自赶路。', cls: 'l-sys' } },
          { w: 30, bad: true, res: { dt: 8, di: -8, log: '过弯时你俩的餐箱撞在一起，你的汤洒了，他笑得很大声。', cls: 'l-bad' } },
        ] },
      ],
    },
    {
      id: 'wrongfood', w: 7, areas: [0, 1, 2, 3, 4],
      intel: '掌柜语气发虚——点麻辣灵蛙那位客人，不好惹。',
      title: '出餐错误！',
      text: '餐箱里的传音符响了，是餐馆掌柜：「小道友！方才那份餐装错了，装成隔壁桌的麻辣灵蛙了！」',
      choices: [
        { t: '折返换餐', pers: 'kindness', hint: '耗时 +12s · 保住口碑', outs: [
          { w: 55, good: true, res: { dt: 12, dm: 2, log: '你折回餐馆换了餐。掌柜过意不去，往餐箱里多塞了份点心。', cls: 'l-good' } },
          { w: 45, res: { dt: 15, log: '换餐折腾了好一阵，掌柜连连作揖。', cls: 'l-sys' } },
        ] },
        { t: '将错就错', pers: 'adventure', hint: '赌客人不介意 · 可能大翻车', outs: [
          { w: 35, good: true, res: { ds: 10, log: '客人尝了一口眼睛一亮：「我正想换换口味！」还加了小费。', cls: 'l-gold' } },
          { w: 30, res: { di: -10, log: '客人嘀咕着「好像不是我点的」，但也没追究。', cls: 'l-sys' } },
          { w: 35, bad: true, res: { di: -30, log: '客人暴跳如雷：「老夫吃素三百年！」餐盒差点扣你头上。', cls: 'l-bad' } },
        ] },
      ],
    },
    {
      id: 'swordrace', w: 6, areas: [2, 3, 4],
      tags: ['wild','danger'],
      intel: '为首剑修气息浮躁——赢他不难，别被群嘲就行。',
      title: '飞剑飙车党',
      text: '三道剑光从你耳边呼啸而过，为首的回头挑衅：「送外卖的，敢不敢比划比划？」',
      choices: [
        { t: '应战！', pers: 'adventure', hint: '赌身法 · 赢了省时又扬名', outs: [
          { w: 40, good: true, res: { dt: -8, dm: 3, log: '你一个漂亮的甩尾超过他们，剑修们心服口服，还帮你开道。', cls: 'l-gold' } },
          { w: 30, res: { dt: 4, log: '你追得气喘，他们等你半天，最后笑着散了。', cls: 'l-sys' } },
          { w: 30, bad: true, res: { di: -15, dt: 6, log: '他们故意掀起剑气乱流，你的餐箱被吹得翻了个面。', cls: 'l-bad' } },
        ] },
        { t: '让行不陪玩', pers: 'cautious', hint: '耗时 +3s · 稳妥', outs: [
          { w: 85, res: { dt: 3, log: '你靠边让行，剑光卷着笑声远去了。', cls: 'l-sys' } },
          { w: 15, bad: true, res: { dt: 6, di: -5, log: '他们绕着你转了三圈取乐，餐盒被剑风刮开一条缝。', cls: 'l-bad' } },
        ] },
      ],
    },
    {
      id: 'beggar', w: 6, areas: [0, 1, 2],
      tags: ['kind'],
      intel: '老修士指尖有常年捏诀的厚茧——是隐居高人。',
      title: '路边乞修',
      text: '一个衣衫褴褛的老修士缩在墙角，面前摆着个破碗：「行行好……三天没吃东西了……」',
      choices: [
        { t: '分他一份餐', pers: 'kindness', hint: '餐品 -12 · 结善缘（因果）', outs: [
          { w: 60, good: true, set: { fedBeggar: 1 }, res: { di: -12, dm: 5, dl: 2, log: '老修士狼吞虎咽，吃完深深看了你一眼：「好心肠的小哥。」', cls: 'l-good' } },
          { w: 40, res: { di: -12, dm: 2, log: '老修士吃完倒头就睡，鼾声如雷。', cls: 'l-sys' } },
        ] },
        { t: '给几块灵石', pers: 'business', hint: '-10 灵石 · 功德一件', outs: [
          { w: 70, good: true, res: { ds: -10, dm: 3, log: '老修士捧着灵石连连道谢。', cls: 'l-good' } },
          { w: 30, res: { ds: -10, log: '他接过灵石掂了掂，嘟囔了句「成色一般」。嘿这老头！', cls: 'l-sys' } },
        ] },
        { t: '绕开走', pers: 'cautious', hint: '无消耗', outs: [
          { w: 85, res: { log: '你低头快步走过。江湖险恶，先顾好自己。', cls: 'l-sys' } },
          { w: 15, bad: true, res: { dl: -3, log: '你走过时带起的风把他的破碗刮翻了，硬币滚了一地。他叹了口气。', cls: 'l-bad' } },
        ] },
      ],
    },
    {
      id: 'seal', w: 6, areas: [1, 2, 3],
      title: '宗门大比封路',
      text: '前方锣鼓喧天——宗门大比，主路封了！告示写着：「绕行三里，或持贵宾令通行。」',
      choices: [
        { t: '老实绕行', pers: 'cautious', hint: '耗时 +10s · 稳妥', outs: [
          { w: 80, res: { dt: 10, log: '你绕了三里山路，腿肚子转筋。', cls: 'l-sys' } },
          { w: 20, good: true, res: { dt: 10, ds: 12, log: '绕路时捡到一个观赛者掉的荷包，里面有几块灵石。', cls: 'l-gold' } },
        ] },
        { t: '翻观众席溜过去', pers: 'adventure', hint: '赌身法 · 失败很丢人', outs: [
          { w: 45, good: true, res: { dt: 2, dm: 1, log: '你猫着腰从观众席下钻过，神不知鬼不觉。', cls: 'l-good' } },
          { w: 30, res: { dt: 8, log: '被执事弟子发现，好说歹说才被放行，耽误了工夫。', cls: 'l-sys' } },
          { w: 25, bad: true, res: { dt: 12, di: -10, log: '你被当成捣乱的拎上擂台示众，全场哄笑，餐都颠洒了。', cls: 'l-bad' } },
        ] },
        { t: '看会儿比赛', pers: 'adventure', hint: '耗时 +8s · 或有意外收获', outs: [
          { w: 50, res: { dt: 8, dr: 3, log: '台上打得精彩，你看得道心通透，浑身是劲。', cls: 'l-good' } },
          { w: 30, good: true, res: { dt: 8, ds: 18, log: '你押注的那位爆冷获胜，庄家黑着脸赔了灵石。', cls: 'l-gold' } },
          { w: 20, bad: true, res: { dt: 15, log: '比赛打到加时，你看到天黑才想起餐还没送。', cls: 'l-bad' } },
        ] },
      ],
    },
    {
      id: 'barter', w: 5, areas: [0, 1, 2],
      tags: ['biz'],
      intel: '货郎袖中灵砂泛着真光——这买卖做得。',
      title: '以物易物',
      text: '货郎拦住你，盯着你餐箱直搓手：「小哥，箱里那碟灵果酱……我拿好东西跟你换！」',
      choices: [
        { t: '换了！', pers: 'business', hint: '餐品 -15 · 赌他的货值不值', outs: [
          { w: 40, good: true, res: { di: -15, ds: 35, log: '货郎掏出一小袋灵砂，成色极好，转手就值 35 灵石！', cls: 'l-gold' } },
          { w: 35, res: { di: -15, ds: 12, log: '换了几块灵石，小赚不亏。', cls: 'l-sys' } },
          { w: 25, bad: true, res: { di: -15, log: '他递来个「上古法器」——上手一看，义乌货。', cls: 'l-bad' } },
        ] },
        { t: '餐品概不外售', pers: 'cautious', hint: '无消耗 · 职业道德', outs: [
          { w: 90, res: { dr: 2, log: '你抱紧餐箱拒绝。货郎竖了个大拇指：「讲究！」', cls: 'l-good' } },
          { w: 10, bad: true, res: { dt: 5, log: '他缠着你讨价还价半天才罢休。', cls: 'l-bad' } },
        ] },
      ],
    },
    {
      id: 'pengci', w: 6, areas: [1, 2, 3],
      tags: ['danger'],
      intel: '他倒地前先瞄了一眼你的餐箱——碰瓷老手。',
      title: '碰瓷老修士',
      text: '一个老修士忽然在你面前「哎哟」一声倒下，抱着腿直哼：「撞了人还想跑？赔钱！」',
      choices: [
        { t: '破财免灾', pers: 'business', hint: '-15 灵石 · 息事宁人', outs: [
          { w: 80, res: { ds: -15, log: '你丢下灵石就走。背后传来他数钱的欢快声音。', cls: 'l-sys' } },
          { w: 20, bad: true, res: { ds: -25, log: '他嫌少，拉着你袖子又加价十块。', cls: 'l-bad' } },
        ] },
        { t: '当场理论', pers: 'adventure', hint: '赌口才 · 小心被缠上', outs: [
          { w: 45, good: true, res: { dm: 2, dr: 2, log: '你条理清晰一番分析，围观修士纷纷叫好，老头灰溜溜爬起来了。', cls: 'l-good' } },
          { w: 30, res: { dt: 8, log: '争论了半天谁也说服不了谁，你趁乱溜了。', cls: 'l-sys' } },
          { w: 25, bad: true, res: { dt: 12, ds: -20, log: '他往地上一躺开始哭天抢地，人越围越多，你只能掏钱脱身。', cls: 'l-bad' } },
        ] },
        { t: '灵眸识破', hint: '需灵眸 1 级 · 拆穿幻术', cond: (c) => c.s.arts.shenshi >= 1, outs: [
          { w: 85, good: true, res: { dm: 3, dl: 2, log: '灵眸一扫——哪有什么伤，裤腿里塞着鸡血符！老头讪笑着跑了。', cls: 'l-gold' } },
          { w: 15, bad: true, res: { dt: 6, ds: -10, log: '你盯着他看太久，他反咬一口说你「用邪术窥探」，只好赔钱了事。', cls: 'l-bad' } },
        ] },
      ],
    },
    {
      id: 'spiritbeast', w: 6, areas: [2, 3, 4],
      tags: ['wild','kind'],
      intel: '它肚子咕咕叫——是真饿，不是凶。',
      title: '灵兽拦路',
      text: '一头圆滚滚的食铁灵兽坐在路中央，眼巴巴盯着你的餐箱，口水流了一地。',
      choices: [
        { t: '分它点吃的', pers: 'kindness', hint: '餐品 -10 · 结善缘（因果）', outs: [
          { w: 65, good: true, set: { fedBeast: 1 }, res: { di: -10, dm: 3, log: '灵兽吃得眉开眼笑，蹭了蹭你的腿，记住了你的气味。', cls: 'l-good' } },
          { w: 35, res: { di: -12, log: '它吃完还想扒拉你的餐箱，你费了好大劲才护住。', cls: 'l-sys' } },
        ] },
        { t: '挥手驱赶', pers: 'adventure', hint: '有风险 · 灵兽不好惹', outs: [
          { w: 45, res: { dt: 4, log: '灵兽撇撇嘴，慢吞吞挪开了。', cls: 'l-sys' } },
          { w: 30, bad: true, res: { di: -15, dt: 5, log: '它被惹恼了，一爪子拍歪你的餐箱，扬长而去。', cls: 'l-bad' } },
          { w: 25, good: true, res: { dm: 2, log: '它居然听懂了，还给你作了个揖才走。', cls: 'l-good' } },
        ] },
        { t: '绕道走', pers: 'cautious', hint: '耗时 +6s · 稳妥', outs: [
          { w: 90, res: { dt: 6, log: '你绕了个大弯，它全程目送你，口水滴成了小水洼。', cls: 'l-sys' } },
          { w: 10, bad: true, res: { dt: 10, log: '绕道的路全是烂泥，你深一脚浅一脚。', cls: 'l-bad' } },
        ] },
      ],
    },
    {
      id: 'beggarReturn', w: 7, areas: [0, 1, 2],
      cond: (c) => c.s.flags.fedBeggar >= 1,
      flag: 'fedBeggar',
      title: '乞修的真面目',
      text: '又是那个墙角。老修士站起身，掸了掸破衣——褴褛尽褪，竟化作一身云纹道袍：「小友，那日一餐，老朽记下了。」',
      choices: [
        { t: '收下谢礼', pers: 'kindness', hint: '善缘结果 · 厚报', outs: [
          { w: 60, good: true, res: { ds: 80, dm: 8, log: '他袖袍一挥，一袋灵石落入你怀中：「云游道人，别的不多，灵石管够。」', cls: 'l-gold' } },
          { w: 40, good: true, res: { dm: 12, dr: 8, log: '他并指在你眉心一点：「赠你一段清心咒。」你顿觉灵台空明。', cls: 'l-gold' } },
        ] },
        { t: '「前辈折煞我了」', hint: '谦逊作答 · 另有机缘', outs: [
          { w: 70, good: true, res: { dm: 15, dl: 5, log: '道人抚须大笑：「不骄不躁，难得！」一缕紫气没入你体内，气运大涨。', cls: 'l-gold' } },
          { w: 30, good: true, res: { dm: 8, dr: 5, log: '道人点点头：「去吧，你的路还长。」身影化作青烟散了。', cls: 'l-gold' } },
        ] },
      ],
    },
    {
      id: 'beastReturn', w: 7, areas: [2, 3, 4],
      cond: (c) => c.s.flags.fedBeast >= 1,
      flag: 'fedBeast',
      title: '灵兽报恩',
      text: '地面微微震动——那头食铁灵兽不知从哪冒出来，欢快地朝你奔来，然后趴下身子，回头看你。',
      choices: [
        { t: '骑上去！', hint: '善缘结果 · 它要驮你一程', outs: [
          { w: 70, good: true, res: { dt: -16, dm: 2, log: '灵兽四蹄生风，翻山越岭如履平地，直接把你驮到了目的地附近！', cls: 'l-gold' } },
          { w: 30, good: true, res: { ds: 35, dm: 2, log: '它领你到一个山坳，用爪子刨出一窝亮晶晶的灵矿石。', cls: 'l-gold' } },
        ] },
      ],
    },

    /* ---------- 因果链事件（由之前的选择解锁，触发后清除标记） ---------- */
    {
      id: 'robberReturn', w: 8, areas: [1, 2, 3, 4],
      cond: (c) => c.s.flags.sparedRobber >= 1,
      flag: 'sparedRobber',
      title: '劫修报恩',
      text: '一个熟悉的身影落在路边——是那位被你请过饭的劫修。他如今换上了镖师的制服：「恩公！我可等到你了！」',
      choices: [
        { t: '收下谢礼', pers: 'kindness', hint: '善缘结果', outs: [
          { w: 60, good: true, res: { ds: 40, dm: 3, log: '他塞给你一包灵石：「如今走镖挣的，干净！」你俩都笑了。', cls: 'l-gold' } },
          { w: 40, good: true, res: { dm: 8, dr: 5, log: '他执意护送你一程，一路畅通无阻。', cls: 'l-gold' } },
        ] },
        { t: '婉拒，请他喝酒', pers: 'kindness', hint: '再结善缘 · 气运小涨', outs: [
          { w: 100, good: true, res: { dt: 8, dm: 5, dl: 5, log: '路边小摊，两碗浊酒。他说这辈子没服过谁，就服你。', cls: 'l-gold' } },
        ] },
      ],
    },
    {
      id: 'craneReturn', w: 8, areas: [2, 3, 4],
      cond: (c) => c.s.flags.fedCrane >= 1,
      flag: 'fedCrane',
      title: '仙鹤引路',
      text: '头顶一声清唳——是那只仙鹤！它盘旋两圈，示意你跟上。',
      choices: [
        { t: '跟它走', pers: 'adventure', hint: '善缘结果 · 大幅省时', outs: [
          { w: 70, good: true, res: { dt: -12, dm: 2, log: '仙鹤带你穿过一条云中小径，省了大段山路。', cls: 'l-gold' } },
          { w: 30, good: true, res: { ds: 30, dm: 2, log: '仙鹤落在一处岩缝前——里面竟藏着前人埋的灵石匣。', cls: 'l-gold' } },
        ] },
      ],
    },
    {
      id: 'demonAmbush', w: 12, areas: [3, 4],
      cond: (c) => c.s.flags.offendedDemon >= 1,
      flag: 'offendedDemon',
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
        { t: '🗡️ 长啸呼援：沈孤鸿！', hint: '人脉 · 沈孤鸿好感 8 · 御剑来援', cond: (c) => ((c.s.relationships.sword || {}).trust || 0) >= 8, outs: [
          { w: 85, good: true, set: { offendedDemon: 0 }, res: { dm: 6, dr: 4, log: '一道剑光自天外而至！沈孤鸿按剑而立：「动我的朋友？」魔修们作鸟兽散。', cls: 'l-gold' } },
          { w: 15, set: { offendedDemon: 0 }, res: { dt: 6, log: '剑光迟迟未到……你硬着头皮周旋半天，魔修们自觉没趣散了。', cls: 'l-sys' } },
        ] },
      ],
    },
    {
      id: 'oldmanTest', w: 6, areas: [0, 1, 2, 3],
      cond: (c) => c.s.flags.metOldman >= 1 && c.s.merit >= 60,
      flag: 'metOldman',
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

  /* ---------- 门派悬赏（滚动任务，3 张一组，全清有全勤奖） ---------- */
  QUESTS: [
    { id: 'q_deliver',  name: '跑腿营生',   desc: '完成 5 单配送',              key: 'deliver',  target: 5, reward: { ds: 50,  dm: 5 } },
    { id: 'q_five',     name: '五星专业户', desc: '拿到 3 个五星好评',          key: 'five',     target: 3, reward: { ds: 60,  dm: 8 } },
    { id: 'q_far',      name: '远征试炼',   desc: '送达 2 单秘境或魔域订单',    key: 'far',      target: 2, reward: { ds: 120, dm: 10 }, minLv: 6 },
    { id: 'q_perfect',  name: '完璧归赵',   desc: '以 90%+ 完整度送达 3 单',    key: 'perfect',  target: 3, reward: { ds: 50,  dm: 6 } },
    { id: 'q_evtgood',  name: '逢凶化吉',   desc: '在途中事件里拿到 2 次好结果', key: 'evtgood',  target: 2, reward: { ds: 40,  dm: 8, dl: 3 } },
    { id: 'q_streak',   name: '连战连捷',   desc: '当前连续好评达到 5 单',      key: 'streak',   target: 5, reward: { ds: 80,  dm: 8 } },
    { id: 'q_tip',      name: '额外打赏',   desc: '收到 3 次小费',              key: 'tip',      target: 3, reward: { ds: 60,  dm: 5 } },
    { id: 'q_meditate', name: '吐纳养生',   desc: '打坐静修 5 次',              key: 'meditate', target: 5, reward: { ds: 30,  dm: 10, dr: 5 } },
  ],

  /* ---------- 配送神通（v2.2 · 配送中主动操作，消耗灵力，有冷却） ---------- */
  SKILLS: [
    { id: 'yufeng',  ico: '🌀', name: '御风诀', cost: 25, cd: 15, dur: 5,
      desc: '5 秒内速度 ×1.8。快超时时的一搏。' },
    { id: 'zhenshi', ico: '🛡️', name: '镇食诀', cost: 30, cd: 30,
      desc: '镇住餐箱：挡下一次餐品损失（挂身直到被消耗）。保五星连击的关键。' },
    { id: 'dunying', ico: '🫥', name: '遁影诀', cost: 35, cd: 45,
      desc: '隐去身形：下一个变故化为「暗中观察」——不参与，但可伺机取利。迷雾天消耗减半。' },
  ],

  /* ---------- 配送路线（v2.2 · 接单后选择，数值受天机影响） ---------- */
  ROUTES: [
    { id: 'road',   ico: '🛤️', name: '官道',     tag: 'safe',
      desc: '平稳大道，风波最少。',
      time: 1, event: 0.7, pay: 1, pers: 'cautious' },
    { id: 'trail',  ico: '⛰️', name: '灵兽山径', tag: 'wild',
      desc: '山间近路，快两成，偶有灵兽灵草。',
      time: 0.85, event: 1.2, pay: 1.1, pers: 'adventure' },
    { id: 'canyon', ico: '🌋', name: '魔修峡谷', tag: 'danger',
      desc: '凶险近路，快三成，报酬 +25%。',
      time: 0.7, event: 1.5, pay: 1.25, pers: 'adventure' },
  ],

  /* ---------- 天机（v2.2 · 修仙历，每 8 小时轮换，影响路线数值） ---------- */
  WEATHERS: [
    { id: 'clear', ico: '☀️', name: '天朗气清', desc: '天光正好，全路线耗时 -10%。',
      mods: { road: { time: 0.9 }, trail: { time: 0.9 }, canyon: { time: 0.9 } } },
    { id: 'storm', ico: '⛈️', name: '雷雨', desc: '山径泥泞耗时 +30%；雷雨淬体，全路线报酬 +10%。',
      mods: { road: { pay: 1.1 }, trail: { time: 1.3, pay: 1.1 }, canyon: { pay: 1.1 } } },
    { id: 'beast', ico: '🐗', name: '妖兽暴动', desc: '山径峡谷事件增多 +30%，峡谷报酬再 +20%。',
      mods: { trail: { event: 1.3 }, canyon: { event: 1.3, pay: 1.2 } } },
    { id: 'mist',  ico: '🌫️', name: '迷雾锁山', desc: '事件增多 +20%，但遁影诀消耗减半。',
      mods: { road: { event: 1.2 }, trail: { event: 1.2 }, canyon: { event: 1.2 } } },
  ],

  /* ---------- 流派（v2.4 · 功法组合+性情+习惯自动生成，带实质被动） ---------- */
  BUILDS: [
    { need: ['shenfa', 'shenshi'], name: '风行剑送流', desc: '身法配灵眸：来去如风，算无遗策。',
      perk: '灵眸绕路道心消耗 8→6，御风诀冷却 15s→12s' },
    { need: ['dianjin', 'guixi'],  name: '因果商人流', desc: '点金配龟息：小费翻倍，时限宽裕，闷声发财。',
      perk: '小费概率 +15%，小费金额 +25%' },
    { need: ['hutu', 'shenfa'],    name: '铁壁快送流', desc: '护体配身法：又快又稳，餐箱纹丝不动。',
      perk: '配送速度 +5%，途中自然餐损 -30%' },
    { need: ['shenfa', 'guixi'],   name: '天涯信使流', desc: '身法配龟息：千里转瞬，使命必达。',
      perk: '全路线耗时 -8%' },
    { need: ['shenshi', 'hutu'],   name: '金瞳铁壁流', desc: '灵眸配护体：看破凶险，四平八稳。',
      perk: '镇食诀灵力消耗 30→20' },
    { need: ['dianjin', 'shenfa'], name: '赏金急脚流', desc: '点金配身法：快送快赚，赏金猎人。',
      perk: '五星连击加成上限 25%→35%，御风诀灵力消耗 25→20' },
    { need: ['guixi', 'hutu'],     name: '不动明王流', desc: '龟息配护体：稳如泰山，细水长流。',
      perk: '差评的道心/气运损失减半' },
    { need: ['shenshi', 'dianjin'], name: '慧眼识珠流', desc: '灵眸配点金：专挑肥单，逢凶化吉。',
      perk: '换一批订单 5→2 灵石' },
    { need: ['guixi', 'shenshi'],  name: '洞玄静观流', desc: '龟息配灵眸：以静制动，后发先至。',
      perk: '打坐间隔 8s→6s，遁影诀冷却 45s→35s' },
  ],

  /* ---------- NPC 人脉（v2.3 · 招牌客人，信任升级解锁实质内容） ---------- */
  NPCS: [
    { id: 'sword', ico: '🗡️', name: '沈孤鸿', title: '剑宗大师兄', area: 2,
      tiers: [3, 8, 15],
      perks: ['好感 3：偶尔发来高报酬「剑修急单」', '好感 8：魔修伏击中可呼他御剑来援', '好感 15：??（敬请期待）'] },
    { id: 'pill', ico: '💊', name: '温九', title: '丹阁长老', area: 2,
      tiers: [3, 8],
      perks: ['好感 3：赠你一枚回春丹（下一单餐损减半）', '好感 8：此后每 10 次好评赠一枚回春丹'] },
    { id: 'biao', ico: '🛡️', name: '铁牛', title: '镖师（昔日劫修）', area: 1,
      tiers: [1],
      perks: ['结识：魔修峡谷有他护航，事件密度 -30%'] },
    { id: 'demon', ico: '🌙', name: '魔尊', title: '魔域之主', area: 4,
      tiers: [3, 10],
      perks: ['好感 3：他对你另眼相看……', '好感 10：??（敬请期待）'] },
  ],

  /* ---------- 失败剧情（v2.3 · 失败也是内容，差评/超时 25% 概率触发） ---------- */
  FAILURES: [
    { id: 'late_seclusion', when: 'late', w: 3,
      title: '迟到的这碗粥',
      text: '客人打开门，怔怔看着餐箱，半晌叹了口气：「无妨……只是方才，是我百年一遇的突破契机。等这口热粥定心，没等到。」\n\n他没有骂你，默默关了门。你站在门外，心里堵得慌。',
      res: { dr: 3, log: '你把这件事记在了心里。道心 +3。', cls: 'l-sys' } },
    { id: 'late_shared', when: 'late', w: 2,
      title: '凉掉的餐，热乎的人',
      text: '「超时这么久，餐都凉了吧？」客人揭开盖子看了看，忽然笑了：「罢了，我一个人也吃不完——坐下，陪我吃一半。」\n\n你们分食了那份凉掉的餐。他给你讲了三个修仙界的古老段子。',
      res: { dr: 5, dm: 2, log: '差评没能避免，但你收获了一个朋友般的黄昏。道心 +5，功德 +2。', cls: 'l-good' } },
    { id: 'bad_critic', when: 'bad', w: 3,
      title: '美食家的毒舌',
      text: '客人尝了一口，掏出一册小本子唰唰记录：「黄袍宗，餐品撒漏三成，温控失当——记一笔。」\n\n你认出那是《九州食评》。完了，要上报了。',
      res: { dl: -3, log: '《九州食评》的差评让你脸上无光。气运 -3。', cls: 'l-bad' } },
    { id: 'bad_grudge', when: 'bad', w: 2,
      title: '记仇的客人',
      text: '客人把餐盒摔在地上：「好，好得很！我记住你了！」\n\n他拂袖而去。你隐隐觉得这梁子结下了——日后路过他的地盘，还是绕着点好。',
      res: { log: '你多了一个记仇的客人。', cls: 'l-bad' },
      set: { hasGrudge: 1 } },
    { id: 'bad_elder', when: 'bad', w: 2,
      title: '大能的洞府',
      text: '慌乱中你才发现：洒出来的灵汤，顺着石缝渗进了旁边一座洞府——那是位闭关大能的门前！\n\n你赶紧俯身擦拭。洞府里传出一声苍老的轻笑：「小友有心了，去吧。」',
      choices: [
        { t: '留下几块灵石赔罪', hint: '-10 灵石 · 心安', pers: 'kindness', res: { ds: -10, dm: 3, dr: 2, log: '大能收了灵石，赠你一句「勤能补拙」。功德 +3，道心 +2。', cls: 'l-good' } },
        { t: '鞠个躬就溜', hint: '无消耗', pers: 'cautious', res: { log: '你长鞠一躬，落荒而逃。', cls: 'l-sys' } },
      ] },
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
    { id: 'quest10',   ico: '📜', name: '悬赏猎人',   desc: '完成 10 张门派悬赏' },
    { id: 'heat5',     ico: '🔥', name: '手感滚烫',   desc: '达成五星五连击' },
    { id: 'fate1',     ico: '🌟', name: '天命所归',   desc: '触发一次天命订单' },
    { id: 'build1',    ico: '🥋', name: '自成一派',   desc: '悟出你的第一个流派' },
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
