import { tarotCards } from '../data/tarotCards.js';
import { secureRandomInt, secureShuffle } from './random.js';

export function createShuffledDeck() {
  return secureShuffle(tarotCards).map((card) => ({
    card,
    orientation: secureRandomInt(2) === 0 ? 'upright' : 'reversed'
  }));
}

export function drawCards(count) {
  if (![1, 3, 5].includes(count)) throw new Error('Supported draw counts are 1, 3, or 5.');
  return createShuffledDeck().slice(0, count);
}
