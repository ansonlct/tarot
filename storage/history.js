const KEY = 'arcana-mirror-history-v1';
const LIMIT = 30;

function storageAvailable() {
  try { return typeof localStorage !== 'undefined'; } catch { return false; }
}
export function getHistory() {
  if (!storageAvailable()) return [];
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}
export function saveReading(result) {
  if (!storageAvailable()) return;
  const next = [result, ...getHistory().filter((r) => r.id !== result.id)].slice(0, LIMIT);
  localStorage.setItem(KEY, JSON.stringify(next));
}
export function getReading(id) { return getHistory().find((item) => item.id === id) || null; }
export function deleteReading(id) {
  if (!storageAvailable()) return;
  localStorage.setItem(KEY, JSON.stringify(getHistory().filter((item) => item.id !== id)));
}
export function clearHistory() { if (storageAvailable()) localStorage.removeItem(KEY); }
export { KEY as HISTORY_KEY };
