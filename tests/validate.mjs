import { stat, readFile, readdir } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tarotCards, tarotMeta } from '../data/tarotCards.js';
import { spreads } from '../data/spreads.js';
import { specialCombinations, pairKey } from '../data/combinations.js';
import { drawCards } from '../engine/draw.js';
import { interpretCard } from '../engine/interpreter.js';

const root = fileURLToPath(new URL('..', import.meta.url));
const failures=[]; const ok=(cond,msg)=>cond?console.log(`✓ ${msg}`):failures.push(msg);
const required=['id','zhName','enName','suit','type','image','uprightKeywords','reversedKeywords','generalUpright','generalReversed','loveUpright','loveReversed','careerUpright','careerReversed','financeUpright','financeReversed','lifeUpright','lifeReversed','advice','warning','action','emotion','relationship','timing'];

ok(tarotMeta.total===78,'完整 78 張牌');
ok(tarotMeta.majors===22 && tarotMeta.minors===56,'22 張大阿爾克那 + 56 張小阿爾克那');
ok(new Set(tarotCards.map(c=>c.id)).size===78,'所有牌 ID 唯一');
ok(new Set(tarotCards.map(c=>c.zhName)).size===78,'所有中文牌名唯一');
const wands8=tarotCards.find(c=>c.id==='wands-8'); const wands4=tarotCards.find(c=>c.id==='wands-4');
ok(wands8?.reversedKeywords.slice(0,4).join(' ')==='阻塞 急躁 重複困住 衝動','權杖八逆位精簡關鍵詞符合結果頁格式');
ok(wands4?.reversedKeywords.slice(0,4).join(' ')==='僵化 停滯 保守過度 衝動','權杖四逆位精簡關鍵詞符合結果頁格式');
for(const c of tarotCards){
  for(const field of required){
    const v=c[field]; const valid=Array.isArray(v)?v.length>=2:typeof v==='string'&&v.trim().length>0;
    if(!valid) failures.push(`${c.id} 缺少或空白欄位 ${field}`);
  }
  for(const f of ['generalUpright','generalReversed','loveUpright','loveReversed','careerUpright','careerReversed','financeUpright','financeReversed','lifeUpright','lifeReversed','advice','warning']){
    if(c[f].length<35) failures.push(`${c.id}.${f} 內容過短`);
  }
  try { await stat(join(root,c.image.replace('./',''))); } catch { failures.push(`${c.id} 缺少牌面 SVG`); }
}
ok(!failures.some(f=>f.includes('欄位')||f.includes('過短')||f.includes('SVG')),'每張牌完整具備正逆位、四主題、建議、警示、心理、關係、行動、時間資料與本地圖片');

ok(spreads.length>=4 && spreads.some(s=>s.count===1) && spreads.filter(s=>s.count===3).length>=2 && spreads.some(s=>s.count===5),'1 / 3（兩種）/ 5 張牌陣齊全');
ok(Boolean(specialCombinations[pairKey('major-06','major-04')]),'戀人＋皇帝特殊組合規則');
ok(Boolean(specialCombinations[pairKey('major-06','major-18')]),'戀人＋月亮特殊組合規則');
ok(Boolean(specialCombinations[pairKey('major-06','major-13')]),'戀人＋死神特殊組合規則');
ok(Boolean(specialCombinations[pairKey('cups-2','major-06')]),'聖杯二＋戀人特殊組合規則');
ok(Boolean(specialCombinations[pairKey('major-16','major-17')]),'高塔＋星星特殊組合規則');

let upright=0,reversed=0;
for(let n=0;n<400;n++){
  const draw=drawCards(5); if(new Set(draw.map(d=>d.card.id)).size!==5) failures.push('同次五張牌出現重複');
  draw.forEach(d=>d.orientation==='upright'?upright++:reversed++);
}
ok(!failures.includes('同次五張牌出現重複'),'400 次五牌測試皆無同次重複');
ok(upright>500 && reversed>500,`正逆位隨機分布正常（測試：正 ${upright} / 逆 ${reversed}）`);

const sample={card:tarotCards.find(c=>c.id==='major-06'),orientation:'upright'};
const readingLove={theme:'love',subtopic:'感情建議',question:'測試'};
const readingCareer={theme:'career',subtopic:'職涯方向',question:'測試'};
const posSituation={id:'situation',name:'現況'}; const posAdvice={id:'advice',name:'建議'};
const a=interpretCard(sample,posSituation,readingLove); const b=interpretCard(sample,posSituation,readingCareer); const c=interpretCard(sample,posAdvice,readingLove);
ok(a.baseMeaning!==b.baseMeaning,'相同牌在不同主題使用不同主題資料');
ok(a.positionSpecific!==c.positionSpecific,'相同牌在不同牌陣位置使用不同位置規則');

async function walk(dir){let out=[];for(const e of await readdir(dir,{withFileTypes:true})){const p=join(dir,e.name);if(e.isDirectory()) out=out.concat(await walk(p)); else out.push(p)}return out}
const files=(await walk(root)).filter(f=>['.js','.mjs','.html','.css'].includes(extname(f)) && !f.includes('/tests/'));
let code=''; for(const f of files) code += '\n'+await readFile(f,'utf8');
ok(!/\bTODO\b|待補充|YOUR_API_KEY|api\.openai|openai\.com\/v1|anthropic|gemini.*api/i.test(code),'程式碼無 TODO、空白替代內容或外部 AI API 依賴');
ok(!/\bfetch\s*\(|XMLHttpRequest|WebSocket\s*\(/.test(code),'程式碼不向外部服務發送網路請求');
ok(/localStorage/.test(await readFile(join(root,'storage/history.js'),'utf8')),'歷史紀錄使用 localStorage');

if(failures.length){console.error('\nVALIDATION FAILED');for(const f of failures)console.error('✗',f);process.exit(1)}
console.log(`\nAll checks passed. ${tarotCards.length} cards, ${spreads.length} spreads, ${Object.keys(specialCombinations).length} special combinations.`);
