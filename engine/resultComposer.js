import { specialCombinations, suitRelations, pairKey } from '../data/combinations.js';
import { phraseTemplates, themes } from '../data/interpretations.js';
import { secureChoice } from './random.js';
import { interpretCard } from './interpreter.js';

const joinNatural = (items) => items.length <= 1 ? (items[0] || '') : `${items.slice(0,-1).join('、')}與${items.at(-1)}`;

function analyzePairs(draws, interpretations, themeKey) {
  const notes = [];
  for (let i = 0; i < draws.length; i += 1) {
    for (let j = i + 1; j < draws.length; j += 1) {
      const a = draws[i].card; const b = draws[j].card;
      const special = specialCombinations[pairKey(a.id, b.id)];
      if (special) {
        notes.push({ type: 'special', title: special.title, text: special.text, cards: [a.zhName, b.zhName] });
        continue;
      }
      const suitPair = [a.suit, b.suit].sort().join('|');
      const relation = suitRelations[suitPair] || suitRelations[[b.suit, a.suit].join('|')];
      const ia = interpretations[i]; const ib = interpretations[j];
      const polarity = ia.orientation === ib.orientation
        ? (ia.orientation === 'upright' ? '兩張牌能量方向一致，較容易互相加強。' : '兩張牌都呈逆位，表示卡點可能同時存在於兩個層面，宜先縮小問題。')
        : '一正一逆形成拉扯，顯示可用資源與阻力同時存在，結果更依賴實際選擇。';
      const text = `${a.zhName}的「${ia.keywords[0]}」與${b.zhName}的「${ib.keywords[0]}」放在一起，${polarity} ${relation || `在${themes[themeKey]?.label || '目前'}脈絡下，應比較兩張牌所處位置的功能，先處理權重較高的位置。`}`;
      notes.push({ type: 'fallback', title: `${a.zhName} × ${b.zhName}`, text, cards: [a.zhName, b.zhName] });
    }
  }
  return notes;
}

function overallPattern(draws, interpretations, reading) {
  const reversed = draws.filter((d) => d.orientation === 'reversed').length;
  const majors = draws.filter((d) => d.card.type === 'Major').length;
  const suitCounts = draws.reduce((acc, d) => { acc[d.card.suit] = (acc[d.card.suit] || 0) + 1; return acc; }, {});
  const dominant = Object.entries(suitCounts).sort((a,b) => b[1]-a[1])[0];
  const high = [...interpretations].sort((a,b) => b.weight-a.weight).slice(0,2);
  const polarity = reversed === 0 ? '整體牌面較順，重點是把優勢轉成穩定行動'
    : reversed === draws.length ? '逆位比例很高，與其追求快速答案，更適合先修正阻力、資訊與界線'
    : reversed > draws.length / 2 ? '阻力與內在調整的比重偏高，先處理卡點通常比硬推更有效'
    : '可用資源多於阻力，但仍有一部分需要校正，適合邊前進邊驗證';
  const majorText = majors >= Math.ceil(draws.length / 2) ? `大阿爾克那佔 ${majors}/${draws.length}，問題較可能牽涉核心價值、重要階段或長期選擇。` : '小阿爾克那較多，問題更適合回到日常行動、溝通與資源配置處理。';
  const dominantText = dominant && dominant[1] >= 2 && dominant[0] !== '大阿爾克那' ? `${dominant[0]}重複出現，表示這個領域在目前牌面特別活躍。` : '';
  return `${polarity}。${majorText}${dominantText} 權重最高的位置是${joinNatural(high.map((i)=>`「${i.positionName}」`))}。`;
}

function buildCoreMessage(interpretations) {
  const top = [...interpretations].sort((a,b) => b.weight-a.weight).slice(0,2);
  return `先看${joinNatural(top.map(i => `${i.positionName}的${i.cardName}${i.orientationLabel}`))}：目前最重要的不是追求確定預言，而是把「${joinNatural(top.map(i => i.keywords[0]))}」轉成可觀察、可調整的現實行動。`;
}

export function composeReading(reading, spread, draws) {
  const interpretations = draws.map((draw, index) => interpretCard(draw, spread.positions[index], reading));
  const combinations = analyzePairs(draws, interpretations, reading.theme);
  const pattern = overallPattern(draws, interpretations, reading);
  const coreMessage = buildCoreMessage(interpretations);
  const adviceItems = interpretations
    .filter((i) => ['action','core','factor'].includes((spread.positions.find(p=>p.id===i.positionId) || {}).role?.toLowerCase()) || ['advice','guidance','present','situation','factor'].includes(i.positionId))
    .slice(0,3).map((i) => `${i.positionName}：${i.action}`);
  if (!adviceItems.length) adviceItems.push(...interpretations.slice(0,2).map(i => `${i.positionName}：${i.advice}`));
  const warnings = interpretations.filter(i => i.orientation === 'reversed' || ['obstacle','hidden'].includes(i.positionId)).slice(0,3).map(i => `${i.positionName}：${i.warning}`);
  if (!warnings.length) warnings.push(`目前沒有大量逆位集中，但仍要避免把順利解讀成保證；${interpretations[0].warning}`);
  const uncertainty = secureChoice(phraseTemplates.uncertainty);
  const summary = `${pattern} ${coreMessage} ${uncertainty}`;
  return {
    id: globalThis.crypto.randomUUID ? globalThis.crypto.randomUUID() : Array.from(globalThis.crypto.getRandomValues(new Uint32Array(4)), n => n.toString(16).padStart(8,'0')).join('-'),
    createdAt: new Date().toISOString(),
    reading: { ...reading },
    spread: { id: spread.id, name: spread.name, count: spread.count },
    draws: draws.map(({ card, orientation }) => ({ cardId: card.id, cardName: card.zhName, enName: card.enName, image: card.image, orientation })),
    interpretations,
    combinations,
    pattern,
    coreMessage,
    adviceItems,
    warnings,
    summary
  };
}
