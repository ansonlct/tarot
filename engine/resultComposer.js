import { specialCombinations, suitRelations, pairKey } from '../data/combinations.js';
import { phraseTemplates, themes } from '../data/interpretations.js';
import { secureChoice } from './random.js';
import { interpretCard } from './interpreter.js';

const joinNatural = (items) => items.length <= 1 ? (items[0] || '') : `${items.slice(0,-1).join('、')}與${items.at(-1)}`;

const firstClause = (text='') => String(text).split(/[；。]/).map((v) => v.trim()).find(Boolean) || String(text).trim();
const uniq = (items) => [...new Set(items.filter(Boolean).map((v)=>String(v).trim()).filter(Boolean))];

const positionIntro = {
  guidance: '這張牌是整次占卜的核心指引，重點是「現在怎樣做」而不是預測事件。',
  past: '這張牌是在交代背景：哪些過去的經驗或慣性，仍然影響現在。',
  present: '這張牌是在描述你現在最明顯的狀態，不等於叫你立刻作決定。',
  future: '這張牌是在看「照目前方式走下去」較可能出現的方向，不是固定結果。',
  situation: '這張牌是在描述現況：先弄清楚正在發生甚麼，再談下一步。',
  obstacle: '這張牌是在指出真正卡住你的地方；先處理它，其他事情會容易很多。',
  advice: '這張牌就是行動建議，重點是把牌義變成一個可以實際做到的步驟。',
  factor: '這張牌是在指出最直接推動局勢的因素，可能是資源、條件或互動方式。',
  hidden: '這張牌是在提醒一個容易忽略的部分；先確認它是否真的存在，不要只靠猜。',
  outcome: '這張牌是在看目前路徑的潛在結果；條件或做法改變，結果也會跟着改變。',
};

function actionForPosition(item) {
  const key = item.keywords?.[0] || '這個重點';
  switch (item.positionId) {
    case 'guidance':
    case 'advice':
      return `把建議落地：${firstClause(item.advice)}。今天先完成其中一個最小步驟。`;
    case 'situation':
    case 'present':
      return `先確認現況：寫下一件支持「${key}」的事實，再寫下一件可能反駁它的事實，避免只憑感覺下結論。`;
    case 'obstacle':
      return `先處理阻礙：${firstClause(item.warning)}。只處理最影響你的那一項，不要一次解決全部。`;
    case 'past':
      return `把過去和現在分開：找出一個仍在影響你的舊模式；如果它已經不適用，就不要再用它解釋今天。`;
    case 'future':
    case 'outcome':
      return `把這張牌當成情境測試：如果保持現況，留意「${key}」是否開始出現；一旦不理想，就及早調整。`;
    case 'factor':
      return `盤點一個與「${key}」有關、你現在真的可以運用的資源或條件，今天把它用在下一步。`;
    case 'hidden':
      return `檢查被忽略的部分：問自己是否有與「${key}」有關的資訊或感受未被看見，再用實際證據確認。`;
    default:
      return `${firstClause(item.advice || item.action)}。`;
  }
}

function warningForItem(item) {
  const key = item.keywords?.[0] || '牌面訊號';
  if (item.orientation === 'reversed') return `${firstClause(item.warning)}。逆位時尤其不要因「${key}」而急着作不可逆決定。`;
  if (item.positionId === 'obstacle') return `${firstClause(item.warning)}。這張是阻礙牌，先處理卡點，不要硬推。`;
  return `不要把「${key}」當成結果保證；${firstClause(item.warning)}。`;
}

function buildPlainCards(interpretations) {
  return interpretations.map((item) => {
    const key = item.keywords[0] || '當下重點';
    const second = item.keywords[1] ? `、${item.keywords[1]}` : '';
    const energy = item.orientation === 'upright'
      ? '正位表示這股力量目前較容易被你運用，但仍要用現實行動配合。'
      : '逆位不等於壞結果，而是提醒這股力量可能受阻、過度或失衡，先校正會更穩。';
    return {
      positionName: item.positionName,
      cardName: item.cardName,
      orientationLabel: item.orientationLabel,
      headline: `${item.positionName}：重點是「${key}」`,
      meaning: `${positionIntro[item.positionId] || '先把這張牌當成一個整理問題的角度。'} 白話說，${firstClause(item.baseMeaning)}。關鍵字是「${key}${second}」。${energy}`,
      action: actionForPosition(item),
      watch: warningForItem(item),
    };
  });
}

function buildPlainOverview(draws, interpretations, spread) {
  const top = [...interpretations].sort((a,b) => b.weight-a.weight)[0] || interpretations[0];
  const reversed = draws.filter((d) => d.orientation === 'reversed').length;
  const direction = reversed === 0
    ? '整體較順，但「順」不等於甚麼都不用做；把已有優勢落到一個具體行動最重要。'
    : reversed > draws.length / 2
      ? '牌面較多阻力訊號。現在不適合硬推，先處理資訊不足、界線或卡點，再決定下一步。'
      : '有可用的機會，也有需要修正的地方。可以前進，但每一步都要用現實回饋確認。';
  const byId = Object.fromEntries(interpretations.map((i)=>[i.positionId,i]));
  const advice = byId.advice || byId.guidance || interpretations.find((i)=>['action','guidance'].includes(i.positionId)) || top;

  if (spread.id === 'three-block' && byId.situation && byId.obstacle && byId.advice) {
    return {
      title: `先看清現況，再拆走阻礙，最後才行動。`,
      text: `現況牌「${byId.situation.cardName}${byId.situation.orientationLabel}」把焦點放在「${byId.situation.keywords[0]}」；阻礙牌提醒「${byId.obstacle.keywords[0]}」可能令你卡住；建議牌「${byId.advice.cardName}${byId.advice.orientationLabel}」則把下一步放在「${byId.advice.keywords[0]}」。`,
      direction,
      action: actionForPosition(byId.advice),
    };
  }

  if (spread.id === 'three-timeline' && byId.past && byId.present && byId.future) {
    return {
      title: `過去形成背景，現在是轉折點，未來仍然可以改。`,
      text: `過去牌顯示「${byId.past.keywords[0]}」留下影響；現在最要處理的是「${byId.present.keywords[0]}」；如果做法不變，未來較容易走向「${byId.future.keywords[0]}」。`,
      direction,
      action: actionForPosition(byId.present),
    };
  }

  if (spread.id === 'five-insight' && byId.situation && byId.advice) {
    const hidden = byId.hidden ? `，而「${byId.hidden.keywords[0]}」可能是你未完全看見的部分` : '';
    return {
      title: `先理解局面，再按建議牌做一個可驗證的改變。`,
      text: `現況重點是「${byId.situation.keywords[0]}」${hidden}。建議牌把可行方向放在「${byId.advice.keywords[0]}」；潛在結果只是一條目前路徑，不是命定結局。`,
      direction,
      action: actionForPosition(byId.advice),
    };
  }

  return {
    title: top ? `這次最重要的字是「${top.keywords[0]}」。` : '先把問題拆細，再看下一步。',
    text: top ? `最值得先看的，是「${top.positionName}」的${top.cardName}${top.orientationLabel}。它不是在替你下判決，而是在提醒你先處理「${top.keywords.slice(0,2).join('、')}」。` : direction,
    direction,
    action: advice ? actionForPosition(advice) : '先選一件你現在可以控制的小事開始。',
  };
}

function buildPlainNextSteps(interpretations, spread) {
  const byId = Object.fromEntries(interpretations.map((i)=>[i.positionId,i]));
  let ordered = [];
  if (spread.id === 'three-block') ordered = [byId.situation, byId.obstacle, byId.advice];
  else if (spread.id === 'three-timeline') ordered = [byId.present, byId.future];
  else if (spread.id === 'five-insight') ordered = [byId.situation, byId.factor, byId.advice];
  else ordered = [byId.guidance || interpretations[0]];
  return uniq(ordered.filter(Boolean).map(actionForPosition)).slice(0,3);
}

function buildPlainWarnings(interpretations) {
  const priority = [
    ...interpretations.filter((i)=>i.positionId==='obstacle'),
    ...interpretations.filter((i)=>i.orientation==='reversed'),
    ...interpretations,
  ];
  return uniq(priority.map(warningForItem)).slice(0,3);
}

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
  const plainOverview = buildPlainOverview(draws, interpretations, spread);
  const plainCards = buildPlainCards(interpretations);
  const plainNextSteps = buildPlainNextSteps(interpretations, spread);
  const plainWarnings = buildPlainWarnings(interpretations);
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
    plainOverview,
    plainCards,
    plainNextSteps,
    plainWarnings,
    adviceItems,
    warnings,
    summary
  };
}
