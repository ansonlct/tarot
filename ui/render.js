import { tarotCards, cardById } from '../data/tarotCards.js';
import { spreads, spreadById } from '../data/spreads.js';
import { themes } from '../data/interpretations.js';
import { createShuffledDeck } from '../engine/draw.js';
import { composeReading } from '../engine/resultComposer.js';
import { getHistory, saveReading, getReading, deleteReading, clearHistory } from '../storage/history.js';

const app = document.querySelector('#app');
export const state = { setup: null, setupDraft: null, lastResult: null };
const escapeHtml = (v='') => String(v).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const fmtDate = (iso) => new Intl.DateTimeFormat('zh-Hant', { dateStyle:'medium', timeStyle:'short' }).format(new Date(iso));

function page(title, eyebrow, body, cls='') {
  document.title = `${title}｜Arcana Mirror`;
  app.innerHTML = `<section class="page ${cls}"><div class="page-head"><p class="eyebrow">${eyebrow}</p><h1>${title}</h1></div>${body}</section>`;
  app.focus({ preventScroll:true });
}

export function renderHome() {
  document.title = 'Arcana Mirror｜規則式塔羅占卜';
  app.innerHTML = `
    <section class="hero home-hero">
      <div class="hero-copy">
        <p class="eyebrow">RULE-BASED TAROT · NO AI</p>
        <h1>讓牌面成為<br><em>整理思緒的鏡子</em></h1>
        <p class="lead">完整 78 張塔羅牌，以正逆位、占卜主題、牌陣位置、多牌關係與句式規則動態組合解讀。所有內容都在你的瀏覽器內完成。</p>
        <div class="hero-actions"><a class="btn primary pulse-cta" href="#/setup">開始占卜 <span>→</span></a><a class="btn ghost" href="#/guide">瀏覽 78 張牌</a></div>
        <div class="privacy-chip">✦ 不使用 AI API　✦ 不上傳問題　✦ 歷史只存 localStorage</div>
      </div>
      <div class="hero-cards" aria-hidden="true">
        <img src="./assets/cards/major-17.svg" alt=""><img src="./assets/cards/major-02.svg" alt=""><img src="./assets/cards/major-19.svg" alt="">
      </div>
    </section>`;
  app.focus({ preventScroll:true });
}

function setupDraft(initialTheme) {
  if (!state.setupDraft) {
    const previous = state.setup;
    state.setupDraft = {
      theme: previous?.theme || initialTheme,
      subtopic: previous?.subtopic || themes[previous?.theme || initialTheme].subtopics[0],
      question: previous?.question || '',
      spreadId: previous?.spreadId || 'three-timeline'
    };
  }
  if (initialTheme && themes[initialTheme] && !state.setup) {
    state.setupDraft.theme = initialTheme;
    if (!themes[initialTheme].subtopics.includes(state.setupDraft.subtopic)) state.setupDraft.subtopic = themes[initialTheme].subtopics[0];
  }
  return state.setupDraft;
}

export function renderSetup(query='') {
  const params = new URLSearchParams(query);
  const requestedTheme = params.get('theme');
  const initialTheme = requestedTheme && themes[requestedTheme] ? requestedTheme : (state.setup?.theme || 'love');
  const draft = setupDraft(initialTheme);
  let currentStep = params.get('resume') === 'spread' ? 2 : params.get('resume') === 'focus' ? 1 : 0;
  let spreadTimer = null;

  document.title = '設定你的占卜｜Arcana Mirror';
  app.innerHTML = `
    <section class="wizard-shell">
      <div class="wizard-orb orb-one" aria-hidden="true"></div><div class="wizard-orb orb-two" aria-hidden="true"></div>
      <div class="wizard-topbar">
        <a class="wizard-exit" href="#/home">× <span>離開占卜</span></a>
        <div class="wizard-progress" aria-label="占卜設定進度">
          <span data-progress="0"><i>01</i>主題</span><b></b><span data-progress="1"><i>02</i>問題</span><b></b><span data-progress="2"><i>03</i>牌陣</span>
        </div>
        <div class="wizard-kicker">ARCANA MIRROR</div>
      </div>
      <div class="wizard-stage"><div class="wizard-card" id="wizardCard"></div></div>
    </section>`;

  const card = document.querySelector('#wizardCard');
  const progress = [...document.querySelectorAll('[data-progress]')];

  function setProgress() {
    progress.forEach((el, i) => {
      el.classList.toggle('active', i === currentStep);
      el.classList.toggle('done', i < currentStep);
    });
  }

  function transitionTo(nextStep, direction=1) {
    if (nextStep < 0 || nextStep > 2 || nextStep === currentStep) return;
    clearTimeout(spreadTimer);
    card.classList.remove('is-entering','enter-back');
    card.classList.add(direction > 0 ? 'is-leaving' : 'is-leaving-back');
    window.setTimeout(() => {
      currentStep = nextStep;
      renderStep(direction < 0);
    }, 300);
  }

  function backButton() {
    return `<button class="wizard-back" type="button" id="wizardBack"><span>←</span> 返回</button>`;
  }

  function renderThemeStep() {
    card.innerHTML = `
      <div class="wizard-copy center-copy"><p class="eyebrow">STEP 01 · CHOOSE A THEME</p><h1>此刻，你最想看清<br>哪一件事？</h1><p>不要想太久。選擇第一個讓你有感覺的主題。</p></div>
      <div class="immersive-theme-grid">
        ${Object.entries(themes).map(([key,t])=>`<button type="button" class="immersive-theme ${draft.theme===key?'selected':''}" data-theme="${key}"><span class="theme-glyph">${t.icon}</span><strong>${t.label}</strong><small>${escapeHtml(t.subtopics.slice(0,3).join(' · '))}</small><i>選擇 →</i></button>`).join('')}
      </div>`;

    card.querySelectorAll('[data-theme]').forEach(btn => btn.addEventListener('click', () => {
      const key = btn.dataset.theme;
      draft.theme = key;
      if (!themes[key].subtopics.includes(draft.subtopic)) draft.subtopic = themes[key].subtopics[0];
      card.querySelectorAll('[data-theme]').forEach(el=>el.classList.toggle('selected', el===btn));
      btn.classList.add('committed');
      window.setTimeout(()=>transitionTo(1, 1), 360);
    }));
  }

  function renderFocusStep() {
    const t = themes[draft.theme];
    if (!t.subtopics.includes(draft.subtopic)) draft.subtopic = t.subtopics[0];
    card.innerHTML = `
      <div class="wizard-copy"><div>${backButton()}<p class="eyebrow">STEP 02 · FOCUS THE QUESTION</p><h1>把問題收窄，<br>讓牌回應得更清楚。</h1><p>${escapeHtml(t.lens)}</p></div><div class="selected-theme-mark"><span>${t.icon}</span><small>目前主題</small><strong>${t.label}</strong></div></div>
      <div class="focus-panel">
        <p class="micro-label">先選擇一個焦點</p>
        <div class="subtopic-pills">${t.subtopics.map(v=>`<button type="button" class="subtopic-pill ${draft.subtopic===v?'selected':''}" data-subtopic="${escapeHtml(v)}">${escapeHtml(v)}</button>`).join('')}</div>
        <label class="question-field"><span>你的問題 <small>選填，但越具體越容易整理思緒</small></span><textarea id="questionInput" maxlength="180" rows="3" placeholder="例如：這段關係接下來，我最需要留意甚麼？">${escapeHtml(draft.question)}</textarea><i><span id="questionCount">${String(draft.question).length}</span> / 180</i></label>
        <div class="focus-actions"><p>如果不輸入文字，會以「${t.label}：<span id="focusPreview">${escapeHtml(draft.subtopic)}</span>」作為問題。</p><button class="btn primary ritual-next" id="focusNext" type="button">聚焦完成 <span>→</span></button></div>
      </div>`;

    document.querySelector('#wizardBack').addEventListener('click', ()=>transitionTo(0, -1));
    const input = document.querySelector('#questionInput');
    const counter = document.querySelector('#questionCount');
    const preview = document.querySelector('#focusPreview');
    card.querySelectorAll('[data-subtopic]').forEach(btn => btn.addEventListener('click', ()=>{
      draft.subtopic = btn.dataset.subtopic;
      card.querySelectorAll('[data-subtopic]').forEach(el=>el.classList.toggle('selected', el===btn));
      preview.textContent = draft.subtopic;
    }));
    input.addEventListener('input', ()=>{ draft.question=input.value; counter.textContent=input.value.length; });
    document.querySelector('#focusNext').addEventListener('click', ()=>{
      draft.question = input.value.trim();
      transitionTo(2, 1);
    });
  }

  function renderSpreadStep() {
    card.innerHTML = `
      <div class="wizard-copy"><div>${backButton()}<p class="eyebrow">STEP 03 · CHOOSE A SPREAD</p><h1>你想看多深？</h1><p>牌越多，會看見越多層次。選定牌陣後，就會進入你的抽牌空間。</p></div><div class="spread-question"><small>你正在問</small><strong>「${escapeHtml(draft.question || `${themes[draft.theme].label}：${draft.subtopic}`)}」</strong></div></div>
      <div class="immersive-spread-grid">
        ${spreads.map(s=>`<button type="button" class="immersive-spread ${draft.spreadId===s.id?'selected':''}" data-spread="${s.id}"><span class="spread-visual cards-${s.count}">${Array.from({length:s.count},(_,j)=>`<i>${j+1}</i>`).join('')}</span><div><small>${s.count} CARD${s.count>1?'S':''}</small><strong>${s.name}</strong><p>${s.description}</p></div><b>選擇此牌陣 →</b></button>`).join('')}
      </div>
      <p class="spread-hint">選擇後會直接進入洗牌與親手抽牌。</p>`;

    document.querySelector('#wizardBack').addEventListener('click', ()=>transitionTo(1, -1));
    card.querySelectorAll('[data-spread]').forEach(btn => btn.addEventListener('click', ()=>{
      clearTimeout(spreadTimer);
      draft.spreadId = btn.dataset.spread;
      card.querySelectorAll('[data-spread]').forEach(el=>el.classList.toggle('selected', el===btn));
      btn.classList.add('committed');
      spreadTimer = window.setTimeout(()=>{
        const question = String(draft.question||'').trim();
        state.setup = {
          theme: draft.theme,
          subtopic: draft.subtopic,
          question: question || `${themes[draft.theme].label}：${draft.subtopic}`,
          spreadId: draft.spreadId
        };
        location.hash = '#/reading';
      }, 520);
    }));
  }

  function renderStep(fromBack=false) {
    setProgress();
    card.className = `wizard-card is-entering${fromBack?' enter-back':''}`;
    if (currentStep === 0) renderThemeStep();
    if (currentStep === 1) renderFocusStep();
    if (currentStep === 2) renderSpreadStep();
    app.focus({ preventScroll:true });
  }

  renderStep(false);
}

function flyCardToSlot(source, target) {
  const from = source.getBoundingClientRect();
  const to = target.getBoundingClientRect();
  const clone = source.cloneNode(true);
  clone.className = 'draw-flying-card';
  clone.style.left = `${from.left}px`;
  clone.style.top = `${from.top}px`;
  clone.style.width = `${from.width}px`;
  clone.style.height = `${from.height}px`;
  document.body.appendChild(clone);
  const dx = to.left + to.width / 2 - (from.left + from.width / 2);
  const dy = to.top + to.height / 2 - (from.top + from.height / 2);
  const anim = clone.animate([
    { transform:'translate(0,0) rotate(0deg) scale(1)', opacity:1 },
    { transform:`translate(${dx*.55}px,${dy*.35-35}px) rotate(-4deg) scale(.92)`, opacity:1, offset:.55 },
    { transform:`translate(${dx}px,${dy}px) rotate(0deg) scale(.78)`, opacity:.15 }
  ], { duration:520, easing:'cubic-bezier(.22,.8,.2,1)' });
  anim.onfinish = () => clone.remove();
}

export function renderReading() {
  if (!state.setup) { location.hash = '#/setup'; return; }
  const spread = spreadById[state.setup.spreadId];
  const theme = themes[state.setup.theme];
  document.title = '準備抽牌｜Arcana Mirror';
  app.innerHTML = `
    <section class="manual-reading">
      <div class="reading-ambient ambient-a" aria-hidden="true"></div><div class="reading-ambient ambient-b" aria-hidden="true"></div>
      <div class="reading-header">
        <a class="wizard-back reading-back" href="#/setup?resume=spread"><span>←</span> 返回</a>
        <div class="reading-meta"><span>${theme.label}</span><span>${escapeHtml(state.setup.subtopic)}</span><span>${spread.name}</span></div>
        <span class="reading-step-label">THE DRAW</span>
      </div>
      <div class="reading-intro">
        <p class="eyebrow">BRING YOUR QUESTION INTO THE DECK</p>
        <h1>把問題放在心中，<br>由你親手選出牌。</h1>
        <blockquote>「${escapeHtml(state.setup.question)}」</blockquote>
        <p>洗牌的這一刻，把注意力放回你真正想知道的事。牌庫展開後，不需要計算或分析，讓第一個直覺帶你拿起 ${spread.count} 張牌。</p>
      </div>

      <div class="shuffle-ritual" id="shuffleRitual">
        <button class="ritual-deck" id="shuffleDeck" type="button" aria-label="開始洗牌">
          ${Array.from({length:7},(_,i)=>`<span class="ritual-card ritual-card-${i}"><i>✦</i></span>`).join('')}
        </button>
        <button class="shuffle-call" id="shuffleCall" type="button">把問題帶入牌庫 · 開始洗牌</button>
        <p id="ritualStatus">慢慢按下。洗牌完成後，78 張牌會在你面前展開。</p>
      </div>

      <div class="intuition-zone" id="intuitionZone" hidden>
        <div class="draw-counter"><span id="drawCounter">0</span><small> / ${spread.count} 已選</small></div>
        <p class="intuition-instruction" id="drawInstruction">憑第一直覺，從牌庫中選出第 1 張牌。</p>
        <div class="deck-scroll" id="deckScroll" aria-label="78 張牌的牌庫"><div class="deck-ribbon" id="deckRibbon"></div></div>
        <p class="deck-note">每張牌都背面朝上。你點下哪一張，就會成為這次牌陣中的下一個位置。</p>
      </div>

      <div class="chosen-area" id="chosenArea" hidden>
        <div class="chosen-heading"><p class="eyebrow">YOUR CHOSEN CARDS</p><h2>你選出的牌</h2><p id="chosenHint">先完成抽牌，再親手逐一翻開。</p></div>
        <div class="manual-slots cards-${spread.count}" id="manualSlots">
          ${spread.positions.map((p,i)=>`<div class="manual-slot" data-slot="${i}"><button type="button" class="manual-slot-card" aria-label="${escapeHtml(p.name)}，尚未抽牌" disabled><span>✦</span></button><small>${i+1}. ${escapeHtml(p.name)}</small></div>`).join('')}
        </div>
      </div>

      <div class="reading-finish" id="readingFinish" hidden>
        <p>牌面已全部翻開。現在可以把它們放回同一個脈絡閱讀。</p>
        <button class="btn primary" id="viewResult" type="button">查看完整解讀 <span>→</span></button>
      </div>
    </section>`;

  const ritual = document.querySelector('#shuffleRitual');
  const shuffleDeck = document.querySelector('#shuffleDeck');
  const shuffleCall = document.querySelector('#shuffleCall');
  const ritualStatus = document.querySelector('#ritualStatus');
  const zone = document.querySelector('#intuitionZone');
  const ribbon = document.querySelector('#deckRibbon');
  const chosenArea = document.querySelector('#chosenArea');
  const slots = [...document.querySelectorAll('.manual-slot')];
  const counter = document.querySelector('#drawCounter');
  const instruction = document.querySelector('#drawInstruction');
  const chosenHint = document.querySelector('#chosenHint');
  const finish = document.querySelector('#readingFinish');
  const viewResult = document.querySelector('#viewResult');
  let deck = null;
  const selected = [];
  const revealed = new Set();
  let result = null;
  let shuffleStarted = false;

  function buildRibbon() {
    ribbon.innerHTML = deck.map((_, i) => {
      const rot = ((i - 38.5) * .055).toFixed(2);
      const lift = (Math.abs(i - 38.5) * .045).toFixed(1);
      return `<button class="intuition-card" type="button" data-card-index="${i}" aria-label="牌庫第 ${i+1} 張" style="--rot:${rot}deg;--lift:${lift}px"><span>✦</span></button>`;
    }).join('');
    ribbon.querySelectorAll('.intuition-card').forEach(btn => btn.addEventListener('click', ()=>chooseCard(btn)));
  }

  function completeShuffle() {
    if (shuffleStarted) return;
    shuffleStarted = true;
    deck = createShuffledDeck();
    ritual.classList.add('is-shuffling');
    shuffleDeck.disabled = true;
    shuffleCall.disabled = true;
    shuffleCall.textContent = '正在洗牌…';
    ritualStatus.textContent = '把問題停留在心中，讓牌庫重新排列。';
    window.setTimeout(()=>{
      buildRibbon();
      ritual.classList.add('is-complete');
      zone.hidden = false;
      chosenArea.hidden = false;
      requestAnimationFrame(()=>zone.classList.add('visible'));
      ritualStatus.textContent = '洗牌完成。現在只需要相信第一個直覺。';
      window.setTimeout(()=>zone.scrollIntoView({behavior:'smooth', block:'center'}), 260);
    }, 1250);
  }

  function chooseCard(btn) {
    if (!deck || btn.disabled || selected.length >= spread.count) return;
    const index = Number(btn.dataset.cardIndex);
    const slotIndex = selected.length;
    const slot = slots[slotIndex];
    const slotButton = slot.querySelector('.manual-slot-card');
    selected.push(deck[index]);
    flyCardToSlot(btn, slotButton);
    btn.disabled = true;
    btn.classList.add('picked');
    window.setTimeout(()=>{
      slot.classList.add('filled');
      slotButton.setAttribute('aria-label', `${spread.positions[slotIndex].name}，已抽牌，等待翻牌`);
    }, 360);
    counter.textContent = selected.length;
    if (selected.length < spread.count) {
      instruction.textContent = `很好。不要重新分析，憑直覺選出第 ${selected.length + 1} 張牌。`;
    } else {
      instruction.textContent = '抽牌完成。你選出的牌已經落在牌陣位置上。';
      ribbon.classList.add('selection-complete');
      chosenHint.textContent = '正在把最後一張牌放入牌陣…';

      // Wait until the final fly-to-slot animation has settled before enabling
      // reveal buttons. Previously the last card's delayed slot update ran after
      // reveal mode was enabled and disabled that button again, so the final
      // card could not be flipped.
      window.setTimeout(()=>{
        chosenHint.textContent = '現在由第一張開始，按下每張牌親手翻開。';
        slots.forEach((s, i) => {
          const b = s.querySelector('.manual-slot-card');
          b.disabled = false;
          b.setAttribute('aria-label', `翻開第 ${i+1} 張牌：${spread.positions[i].name}`);
          b.addEventListener('click', ()=>revealCard(i), { once:true });
        });
        chosenArea.scrollIntoView({behavior:'smooth', block:'center'});
      }, 560);
    }
  }

  function revealCard(i) {
    if (revealed.has(i) || selected.length < spread.count) return;
    const slot = slots[i];
    const btn = slot.querySelector('.manual-slot-card');
    const draw = selected[i];
    btn.disabled = true;
    btn.innerHTML = `<img src="${draw.card.image}" alt="${escapeHtml(draw.card.zhName)}" class="${draw.orientation==='reversed'?'reversed':''}">`;
    slot.classList.add('revealed');
    revealed.add(i);
    if (revealed.size < spread.count) {
      chosenHint.textContent = `已翻開 ${revealed.size} / ${spread.count} 張。慢慢看，再翻下一張。`;
    } else {
      chosenHint.textContent = '全部牌面已翻開。先感受整體，再進入文字解讀。';
      result = composeReading(state.setup, spread, selected);
      state.lastResult = result;
      saveReading(result);
      finish.hidden = false;
      requestAnimationFrame(()=>finish.classList.add('visible'));
      window.setTimeout(()=>finish.scrollIntoView({behavior:'smooth', block:'center'}), 300);
    }
  }

  shuffleDeck.addEventListener('click', completeShuffle);
  shuffleCall.addEventListener('click', completeShuffle);
  viewResult.addEventListener('click', ()=>{ if (result) location.hash = `#/result/${result.id}`; });
  app.focus({ preventScroll:true });
}

function resultCard(item) {
  return `<article class="result-card">
    <div class="result-card-visual"><span class="position-tag">${escapeHtml(item.positionName)}</span><img src="${item.image}" alt="${escapeHtml(item.cardName)} ${item.orientationLabel}" class="${item.orientation==='reversed'?'reversed':''}"></div>
    <div class="result-card-copy"><div class="card-title-line"><div><p>${escapeHtml(item.enName)}</p><h2>${escapeHtml(item.cardName)} <small>${item.orientationLabel}</small></h2></div><div class="keyword-row">${item.keywords.slice(0,4).map(k=>`<span>${escapeHtml(k)}</span>`).join('')}</div></div>
      <p class="core-line">${escapeHtml(item.core)}</p>
      <div class="interpret-grid"><div><h3>主題解讀</h3><p>${escapeHtml(item.baseMeaning)}</p></div><div><h3>牌陣位置</h3><p>${escapeHtml(item.positionSpecific)}</p></div><div><h3>心理／關係</h3><p>${escapeHtml(item.emotion)} ${escapeHtml(item.relationship)}</p></div><div><h3>發展方向</h3><p>${escapeHtml(item.timing)}</p></div></div>
    </div>
  </article>`;
}

export function renderResult(id) {
  const result = (state.lastResult?.id===id ? state.lastResult : null) || getReading(id);
  if (!result) { page('找不到這次占卜', 'RESULT', `<div class="empty"><p>這筆紀錄可能已被刪除，或來自另一個瀏覽器。</p><a class="btn primary" href="#/setup">重新占卜</a></div>`); return; }
  const theme=themes[result.reading.theme]||themes.custom;
  page('你的牌面', 'READING RESULT', `
    <section class="result-intro"><div><div class="reading-meta"><span>${theme.label}</span><span>${escapeHtml(result.reading.subtopic)}</span><span>${escapeHtml(result.spread.name)}</span></div><h2>「${escapeHtml(result.reading.question)}」</h2><p>${fmtDate(result.createdAt)}</p></div><a href="#/setup" class="btn ghost">再次占卜</a></section>
    <section class="summary-hero"><p class="eyebrow">CORE MESSAGE</p><h2>核心訊息</h2><p>${escapeHtml(result.coreMessage)}</p><div class="pattern-note">${escapeHtml(result.pattern)}</div></section>
    <section class="result-cards">${result.interpretations.map(resultCard).join('')}</section>
    ${result.combinations.length?`<section class="result-section"><div class="section-heading"><p class="eyebrow">CARD RELATIONSHIPS</p><h2>多牌綜合解讀</h2></div><div class="combo-list">${result.combinations.slice(0,8).map(c=>`<article><span>${c.type==='special'?'特殊組合':'規則組合'}</span><h3>${escapeHtml(c.title)}</h3><p>${escapeHtml(c.text)}</p></article>`).join('')}</div></section>`:''}
    <section class="action-grid"><article><p class="eyebrow">NEXT STEPS</p><h2>建議</h2>${result.adviceItems.map(v=>`<p>→ ${escapeHtml(v)}</p>`).join('')}</article><article><p class="eyebrow">WATCH FOR</p><h2>需要注意</h2>${result.warnings.map(v=>`<p>— ${escapeHtml(v)}</p>`).join('')}</article></section>
    <section class="final-summary"><p class="eyebrow">SUMMARY</p><h2>最後總結</h2><p>${escapeHtml(result.summary)}</p><div class="disclaimer-box">塔羅占卜屬於娛樂及自我反思用途，結果並非科學預測，也不能保證未來一定會按照牌面發展。涉及醫療、法律、投資或重大人生決策時，應以專業意見及實際資訊作判斷。</div></section>
  `,'result-page');
}

export function renderGuide(filter='all') {
  const filters=[['all','全部 78 張'],['大阿爾克那','大阿爾克那'],['權杖','權杖'],['聖杯','聖杯'],['寶劍','寶劍'],['錢幣','錢幣']];
  const cards=filter==='all'?tarotCards:tarotCards.filter(c=>c.suit===filter);
  page('塔羅牌指南', 'TAROT GUIDE', `
    <div class="guide-intro"><p>每張牌都有正逆位、四大主題與行動層資料。點選牌卡可查看基本資料；實際占卜時還會加入主題、牌陣位置與其他牌的組合規則。</p></div>
    <div class="filter-row">${filters.map(([k,l])=>`<button class="filter-btn ${k===filter?'active':''}" data-filter="${k}">${l}</button>`).join('')}</div>
    <div class="guide-grid">${cards.map(c=>`<button class="guide-card" data-card="${c.id}"><img src="${c.image}" alt="${c.zhName}"><span>${c.enName}</span><strong>${c.zhName}</strong></button>`).join('')}</div>
    <dialog id="cardDialog" class="card-dialog"><button class="dialog-close" aria-label="關閉">×</button><div id="dialogContent"></div></dialog>`,'guide-page');
  document.querySelectorAll('.filter-btn').forEach(b=>b.addEventListener('click',()=>renderGuide(b.dataset.filter)));
  const dialog=document.querySelector('#cardDialog'), content=document.querySelector('#dialogContent');
  document.querySelectorAll('.guide-card').forEach(b=>b.addEventListener('click',()=>{
    const c=cardById[b.dataset.card]; content.innerHTML=`<div class="dialog-grid"><img src="${c.image}" alt="${c.zhName}"><div><p class="eyebrow">${c.type} · ${c.suit}</p><h2>${c.zhName}</h2><p class="en">${c.enName}</p><h3>正位</h3><div class="keyword-row">${c.uprightKeywords.map(k=>`<span>${escapeHtml(k)}</span>`).join('')}</div><p>${escapeHtml(c.generalUpright)}</p><h3>逆位</h3><div class="keyword-row">${c.reversedKeywords.map(k=>`<span>${escapeHtml(k)}</span>`).join('')}</div><p>${escapeHtml(c.generalReversed)}</p><h3>建議</h3><p>${escapeHtml(c.advice)}</p><h3>警示</h3><p>${escapeHtml(c.warning)}</p></div></div>`; dialog.showModal();
  }));
  dialog.querySelector('.dialog-close').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',(e)=>{if(e.target===dialog) dialog.close();});
}

export function renderHistory() {
  const history=getHistory();
  page('占卜紀錄', 'LOCAL HISTORY', `
    <div class="history-top"><p>最近 ${history.length} 筆結果只存在這個瀏覽器的 localStorage，不會上傳。</p>${history.length?'<button id="clearHistory" class="text-btn">清除全部紀錄</button>':''}</div>
    ${history.length?`<div class="history-list">${history.map(r=>`<article><a href="#/result/${r.id}"><div><p>${fmtDate(r.createdAt)} · ${escapeHtml((themes[r.reading.theme]||themes.custom).label)} · ${escapeHtml(r.spread.name)}</p><h2>${escapeHtml(r.reading.question)}</h2><div class="history-cards">${r.draws.map(d=>`<span>${escapeHtml(d.cardName)} ${d.orientation==='upright'?'正':'逆'}</span>`).join('')}</div></div><b>查看結果 →</b></a><button class="delete-reading" data-delete="${r.id}">刪除</button></article>`).join('')}</div>`:`<div class="empty"><div class="empty-symbol">✦</div><h2>還沒有占卜紀錄</h2><p>完成一次占卜後，結果會自動保存在這個瀏覽器。</p><a class="btn primary" href="#/setup">開始第一次占卜</a></div>`}
  `,'history-page');
  document.querySelectorAll('[data-delete]').forEach(b=>b.addEventListener('click',()=>{ deleteReading(b.dataset.delete); renderHistory(); }));
  document.querySelector('#clearHistory')?.addEventListener('click',()=>{ if(confirm('確定清除所有本機占卜紀錄？')) { clearHistory(); renderHistory(); } });
}
