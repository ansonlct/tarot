import { themes, subtopicRules, positionRules, phraseTemplates } from '../data/interpretations.js';
import { secureChoice } from './random.js';

const orientationLabel = (orientation) => orientation === 'upright' ? '正位' : '逆位';

export function interpretCard(draw, position, reading) {
  const { card, orientation } = draw;
  const theme = themes[reading.theme] || themes.custom;
  const upright = orientation === 'upright';
  const field = theme.field[upright ? 0 : 1];
  const keywords = upright ? card.uprightKeywords : card.reversedKeywords;
  const positionRule = positionRules[position.id];
  const baseMeaning = card[field];
  const generalMeaning = upright ? card.generalUpright : card.generalReversed;
  const focusText = subtopicRules[reading.subtopic] || subtopicRules['自訂問題'];

  let positionSpecific = positionRule.frame;
  if (positionRule.priority === 'action') positionSpecific += ` ${secureChoice(phraseTemplates.adviceLead)}：${card.advice}`;
  if (positionRule.priority === 'warning') positionSpecific += ` ${secureChoice(phraseTemplates.warningLead)}：${card.warning}`;
  if (positionRule.priority === 'development') positionSpecific += ` 發展節奏可參考：${card.timing}`;
  if (positionRule.priority === 'hidden') positionSpecific += ` 心理層面的線索是：${card.emotion}`;
  if (positionRule.priority === 'factor') positionSpecific += ` 關係與現實互動可再檢查：${card.relationship}`;

  const message = `${card.zhName}${orientationLabel(orientation)}把焦點帶到「${keywords.slice(0, 3).join('、')}」`;
  const core = secureChoice(phraseTemplates.opening).replace('{message}', message);

  return {
    cardId: card.id,
    cardName: card.zhName,
    enName: card.enName,
    image: card.image,
    orientation,
    orientationLabel: orientationLabel(orientation),
    positionId: position.id,
    positionName: position.name,
    keywords,
    core,
    baseMeaning,
    generalMeaning,
    themeLens: theme.lens,
    subtopicFocus: focusText,
    positionSpecific,
    advice: card.advice,
    warning: card.warning,
    action: card.action,
    emotion: card.emotion,
    relationship: card.relationship,
    timing: card.timing,
    weight: positionRule.multiplier
  };
}
