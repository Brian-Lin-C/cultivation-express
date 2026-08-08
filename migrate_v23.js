// 一次性迁移脚本：为 v2.3 事件库批量注入 tags / intel / pers
'use strict';
const fs = require('fs');
const p = 'js/data.js';
let src = fs.readFileSync(p, 'utf8');
let totalOps = 0;

function rep(oldStr, newStr, expect) {
  const n = src.split(oldStr).length - 1;
  if (n !== (expect || 1)) {
    console.error(`COUNT_MISMATCH (${n}!=${expect || 1}): ${oldStr.slice(0, 60)}`);
    process.exit(1);
  }
  src = src.split(oldStr).join(newStr);
  totalOps++;
}

// ---------- 事件 tags + intel ----------
const TAGS = {
  robber:      { tags: "['danger']",        intel: '此人气息虚浮、色厉内荏——多半不敢真拼命。' },
  lostchild:   { tags: "['kind']",          intel: '孩子腰间挂着一枚内门玉佩——送他回家，或有厚报。' },
  crane:       { tags: "['kind','wild']",   intel: '鹤羽沾着秘境的灵气——它认得捷径。' },
  array:       { tags: "['danger']",        intel: '阵纹有一处旧损——生门在东南。' },
  market:      { tags: "['biz']",           intel: '今日灵材行看涨——讨价还价有赚头。' },
  demonpatrol: { tags: "['danger']",        intel: '为首魔修腰挂「罚」字牌——他们只想捞钱，不想动手。' },
  foodspirit:  { tags: "['biz']",           intel: '食灵气机纯正，以诚待之可得馈赠。' },
  oldman:      { tags: "['kind']",          intel: '老翁扫地暗合道韵——绝非凡人，善待之。' },
  windfall:    { tags: "['luck']",          intel: '宝光外泄却无禁制——当真是无主之物？' },
  shortcut:    { tags: "['danger']",        intel: '近路上有新鲜脚印——刚有人走过，未必安全。' },
  courier:     { tags: "['biz']",           intel: '对方的货单鼓鼓囊囊——是笔大买卖。' },
  beast:       { tags: "['wild']",          intel: '灵兽嘴角有食渍——它刚吃饱，只是馋。' },
  peer:        { tags: "['kind']",          intel: '青袍骑手的餐箱印着同行大坊的徽记——结个善缘有用。' },
  wrongfood:   { tags: null,                intel: '掌柜语气发虚——点麻辣灵蛙那位客人，不好惹。' },
  swordrace:   { tags: "['wild','danger']", intel: '为首剑修气息浮躁——赢他不难，别被群嘲就行。' },
  beggar:      { tags: "['kind']",          intel: '老修士指尖有常年捏诀的厚茧——是隐居高人。' },
  barter:      { tags: "['biz']",           intel: '货郎袖中灵砂泛着真光——这买卖做得。' },
  pengci:      { tags: "['danger']",        intel: '他倒地前先瞄了一眼你的餐箱——碰瓷老手。' },
  spiritbeast: { tags: "['wild','kind']",   intel: '它肚子咕咕叫——是真饿，不是凶。' },
};
Object.keys(TAGS).forEach(id => {
  const t = TAGS[id];
  const m = src.match(new RegExp(`^\\s+id: '${id}',.*$`, 'm'));
  if (!m) { console.error('EVENT_NOT_FOUND: ' + id); process.exit(1); }
  let insert = '';
  if (t.tags) insert += `\n      tags: ${t.tags},`;
  if (t.intel) insert += `\n      intel: '${t.intel}',`;
  rep(m[0], m[0] + insert);
});

// ---------- 选择 pers 标注 ----------
const PERS = {
  '硬闯！': 'adventure', '破财消灾': 'business', '请他一起吃': 'kindness',
  '冒雨赶路': 'adventure', '找屋檐躲雨': 'cautious',
  '帮他指路': 'kindness', '赶时间，爱莫能助': 'cautious', '比比谁快': 'adventure',
  '折返换餐': 'kindness', '将错就错': 'adventure',
  '应战！': 'adventure', '让行不陪玩': 'cautious',
  '分他一份餐': 'kindness', '给几块灵石': 'business', '绕开走': 'cautious',
  '老实绕行': 'cautious', '翻观众席溜过去': 'adventure', '看会儿比赛': 'adventure',
  '换了！': 'business', '餐品概不外售': 'cautious',
  '破财免灾': 'business', '当场理论': 'adventure',
  '分它点吃的': 'kindness', '挥手驱赶': 'adventure', '绕道走': 'cautious',
  '婉拒，请他喝酒': 'kindness',
  '跟它走': 'adventure',
};
const PERS_COUNT = {}; // 默认每个选择文本唯一
Object.keys(PERS).forEach(t => {
  rep(`{ t: '${t}', hint:`, `{ t: '${t}', pers: '${PERS[t]}', hint:`, PERS_COUNT[t] || 1);
});
// '收下谢礼' 在劫修报恩与乞修报恩各出现一次
rep(`{ t: '收下谢礼', hint:`, `{ t: '收下谢礼', pers: 'kindness', hint:`, 2);

fs.writeFileSync(p, src);
console.log('MIGRATE_OK ops=' + totalOps);
