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
  document.body.classList.remove('home-transition-out');
  document.body.classList.add('home-entering');
  document.title = 'Arcana Mirror｜規則式塔羅占卜';
  app.innerHTML = `
    <section class="hero home-hero">
      <div class="hero-copy">
        <p class="eyebrow">RULE-BASED TAROT · NO AI</p>
        <h1>讓牌面成為<br><em>整理思緒的鏡子</em></h1>
        <p class="lead">完整 78 張塔羅牌，以正逆位、占卜主題、牌陣位置、多牌關係與句式規則動態組合解讀。所有內容都在你的瀏覽器內完成。</p>
        <div class="hero-actions"><a class="btn primary pulse-cta" id="startReading" href="#/setup">開始占卜 <span>→</span></a><a class="btn ghost" href="#/guide">瀏覽 78 張牌</a></div>
        <div class="privacy-chip">✦ 不使用 AI API　✦ 不上傳問題　✦ 歷史只存 localStorage</div>
      </div>
      <div class="hero-cards" aria-hidden="true">
        <img src="./assets/cards/major-17.svg" alt=""><img src="./assets/cards/major-02.svg" alt=""><img src="./assets/cards/major-19.svg" alt="">
      </div>
    </section>`;
  const startReading = document.querySelector('#startReading');
  startReading?.addEventListener('click', (event) => {
    event.preventDefault();
    if (startReading.dataset.transitioning === 'true') return;
    startReading.dataset.transitioning = 'true';
    document.body.classList.remove('home-entering');
    document.body.classList.add('home-transition-out');
    window.setTimeout(() => {
      location.hash = '#/setup';
    }, 560);
  });
  window.setTimeout(() => document.body.classList.remove('home-entering'), 900);
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
  document.body.classList.remove('home-transition-out');
  const params = new URLSearchParams(query);
  const requestedTheme = params.get('theme');
  const initialTheme = requestedTheme && themes[requestedTheme] ? requestedTheme : (state.setup?.theme || 'love');
  const draft = setupDraft(initialTheme);
  let currentStep = params.get('resume') === 'spread' ? 2 : params.get('resume') === 'focus' ? 1 : 0;
  let spreadTimer = null;
  let firstRender = true;

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
    card.classList.remove('is-entering','enter-back','first-entry');
    card.classList.add(direction > 0 ? 'is-leaving' : 'is-leaving-back');
    window.setTimeout(() => {
      currentStep = nextStep;
      renderStep(direction < 0);
    }, 390);
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
      const shell = document.querySelector('.wizard-shell');
      if (shell?.classList.contains('to-reading')) return;
      draft.spreadId = btn.dataset.spread;
      card.querySelectorAll('[data-spread]').forEach(el=>el.classList.toggle('selected', el===btn));
      btn.classList.add('committed');
      shell?.classList.add('to-reading');
      spreadTimer = window.setTimeout(()=>{
        const question = String(draft.question||'').trim();
        state.setup = {
          theme: draft.theme,
          subtopic: draft.subtopic,
          question: question || `${themes[draft.theme].label}：${draft.subtopic}`,
          spreadId: draft.spreadId
        };
        location.hash = '#/reading';
      }, 680);
    }));
  }

  function renderStep(fromBack=false) {
    setProgress();
    const isFirstThemeEntry = firstRender && currentStep === 0 && !fromBack;
    card.className = `wizard-card is-entering${fromBack?' enter-back':''}${isFirstThemeEntry?' first-entry':''}`;
    if (currentStep === 0) renderThemeStep();
    if (currentStep === 1) renderFocusStep();
    if (currentStep === 2) renderSpreadStep();
    firstRender = false;
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


function flyRevealToStage(source, target, draw) {
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return Promise.resolve();
  const from = source.getBoundingClientRect();
  const to = target.getBoundingClientRect();
  const flight = document.createElement('div');
  flight.className = 'reveal-flight';
  flight.style.left = `${from.left}px`;
  flight.style.top = `${from.top}px`;
  flight.style.width = `${from.width}px`;
  flight.style.height = `${from.height}px`;
  flight.innerHTML = `<div class="reveal-flight-inner"><div class="reveal-flight-back"><span>✦</span></div><div class="reveal-flight-front"><img src="${draw.card.image}" alt="${escapeHtml(draw.card.zhName)}" class="${draw.orientation==='reversed'?'reversed':''}"></div></div>`;
  document.body.appendChild(flight);
  const dx = to.left - from.left;
  const dy = to.top - from.top;
  const scale = to.width / Math.max(from.width, 1);
  const move = flight.animate([
    { transform:'translate3d(0,0,0) scale(1)', filter:'blur(0)', opacity:1 },
    { transform:`translate3d(${dx*.46}px,${dy*.42-28}px,0) scale(${1 + (scale-1)*.38})`, filter:'blur(0)', opacity:1, offset:.46 },
    { transform:`translate3d(${dx}px,${dy}px,0) scale(${scale})`, filter:'blur(0)', opacity:1 }
  ], { duration:880, easing:'cubic-bezier(.16,.82,.2,1)', fill:'forwards' });
  window.setTimeout(() => flight.classList.add('is-flipped'), 245);
  return new Promise((resolve) => {
    move.onfinish = () => { flight.remove(); resolve(); };
    move.oncancel = () => { flight.remove(); resolve(); };
  });
}

export function renderReading() {
  if (!state.setup) { location.hash = '#/setup'; return; }
  const spread = spreadById[state.setup.spreadId];
  const theme = themes[state.setup.theme];
  document.title = '準備抽牌｜Arcana Mirror';
  app.innerHTML = `
    <section class="manual-reading reading-enter">
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
        <div class="deck-scroll" id="deckScroll" aria-label="78 張牌的牌庫">
          <div class="deck-deal-origin" id="deckDealOrigin" aria-hidden="true">${Array.from({length:5},(_,i)=>`<i style="--stack:${i}"><span>✦</span></i>`).join('')}</div>
          <div class="deck-ribbon" id="deckRibbon"></div>
        </div>
        <p class="deck-note">每張牌都背面朝上。你點下哪一張，就會成為這次牌陣中的下一個位置。</p>
      </div>

      <div class="reveal-focus-stage" id="revealFocusStage" aria-hidden="true" aria-live="polite">
        <div class="reveal-stage-copy"><p class="eyebrow">THE REVEAL</p><h2 id="revealStageTitle">準備親手翻牌</h2><p id="revealStageMeta">按下方任何一張牌，它會在這裡放大翻開，讓你先看清楚牌面。</p><div class="reveal-keywords" id="revealKeywords"></div></div>
        <div class="reveal-large-card" id="revealLargeCard" aria-hidden="true"><span>✦</span></div>
      </div>

      <div class="chosen-area" id="chosenArea" hidden>
        <div class="chosen-heading"><p class="eyebrow">YOUR CHOSEN CARDS</p><h2>你選出的牌</h2><p id="chosenHint">先完成抽牌，再親手逐一翻開。</p></div>
        <div class="manual-slots cards-${spread.count}" id="manualSlots">
          ${spread.positions.map((p,i)=>`<div class="manual-slot" data-slot="${i}"><button type="button" class="manual-slot-card" aria-label="${escapeHtml(p.name)}，尚未抽牌" disabled><span>✦</span></button><small>${i+1}. ${escapeHtml(p.name)}</small></div>`).join('')}
        </div>
      </div>

      <div class="reading-finish" id="readingFinish" hidden>
        <p>牌面已全部翻開。現在可以把它們放回同一個脈絡閱讀。</p>
        <button class="btn primary pulse-cta result-portal-cta" id="viewResult" type="button">查看完整解讀 <span>→</span></button>
      </div>
    </section>`;

  const ritual = document.querySelector('#shuffleRitual');
  const shuffleDeck = document.querySelector('#shuffleDeck');
  const shuffleCall = document.querySelector('#shuffleCall');
  const ritualStatus = document.querySelector('#ritualStatus');
  const zone = document.querySelector('#intuitionZone');
  const ribbon = document.querySelector('#deckRibbon');
  const chosenArea = document.querySelector('#chosenArea');
  const revealStage = document.querySelector('#revealFocusStage');
  const revealLargeCard = document.querySelector('#revealLargeCard');
  const revealStageTitle = document.querySelector('#revealStageTitle');
  const revealStageMeta = document.querySelector('#revealStageMeta');
  const revealKeywords = document.querySelector('#revealKeywords');
  const slots = [...document.querySelectorAll('.manual-slot')];
  const counter = document.querySelector('#drawCounter');
  const instruction = document.querySelector('#drawInstruction');
  const chosenHint = document.querySelector('#chosenHint');
  const finish = document.querySelector('#readingFinish');
  const viewResult = document.querySelector('#viewResult');
  const readingRoot = document.querySelector('.manual-reading');
  let deck = null;
  const selected = [];
  const revealed = new Set();
  let result = null;
  let shuffleStarted = false;
  let spreadFocusStarted = false;
  let resultTransitionStarted = false;
  let revealAnimating = false;

  function buildRibbon() {
    ribbon.className = 'deck-ribbon is-dealing';
    ribbon.innerHTML = deck.map((_, i) => {
      const rot = ((i - 38.5) * .055).toFixed(2);
      const lift = (Math.abs(i - 38.5) * .045).toFixed(1);
      const fanOffset = (38.5 - i).toFixed(1);
      const fanDelay = Math.round(Math.abs(i - 38.5) * 10);
      const fanShift = (Number(fanOffset) * 18).toFixed(1);
      const fanShiftMobile = (Number(fanOffset) * 15).toFixed(1);
      return `<button class="intuition-card" type="button" data-card-index="${i}" aria-label="牌庫第 ${i+1} 張" style="--rot:${rot}deg;--lift:${lift}px;--fan-shift:${fanShift}px;--fan-shift-mobile:${fanShiftMobile}px;--fan-delay:${fanDelay}ms" disabled><span>✦</span></button>`;
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
      zone.classList.add('dealing');
      requestAnimationFrame(()=>zone.classList.add('visible'));
      ritualStatus.textContent = '洗牌完成。讓整副牌從牌疊中慢慢展開…';
      window.setTimeout(()=>zone.scrollIntoView({behavior:'smooth', block:'center'}), 180);
      window.setTimeout(()=>{
        ribbon.classList.remove('is-dealing');
        ribbon.classList.add('is-ready');
        zone.classList.remove('dealing');
        zone.classList.add('dealt');
        ribbon.querySelectorAll('.intuition-card').forEach((btn)=>{ btn.disabled = false; });
        ritualStatus.textContent = '牌庫已展開。現在只需要相信第一個直覺。';
      }, 1580);
    }, 1250);
  }

  function focusOnChosenSpread() {
    if (spreadFocusStarted) return;
    spreadFocusStarted = true;
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    chosenHint.textContent = '抽牌完成。讓牌陣慢慢成為畫面的中心…';
    zone.classList.add('draw-complete');
    readingRoot?.classList.add('focusing-spread');
    chosenArea.classList.add('spread-focus-zoom');

    chosenArea.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block:'center' });

    window.setTimeout(() => {
      readingRoot?.classList.remove('focusing-spread');
      readingRoot?.classList.add('spread-focused', 'reveal-mode-transition');
      chosenArea.classList.remove('spread-focus-zoom');
      chosenArea.classList.add('spread-focus-settled');
      chosenHint.textContent = '牌陣已聚焦。正在整理翻牌空間…';

      window.setTimeout(() => {
        // Switch to a compact, viewport-centred reveal scene only after the
        // previous scene has faded. This prevents the scroll position and
        // document height from fighting each other and causing a page jump.
        readingRoot?.classList.remove('reveal-mode-transition');
        readingRoot?.classList.add('reveal-mode');
        revealStage.setAttribute('aria-hidden', 'false');
        revealStage.classList.add('ready');
        chosenHint.textContent = '準備翻牌中…牌面會在上方放大，讓你逐張看清楚。';

        requestAnimationFrame(() => {
          const top = readingRoot?.getBoundingClientRect().top + window.scrollY || 0;
          window.scrollTo({ top, behavior: 'auto' });
        });

        window.setTimeout(() => {
          chosenHint.textContent = '按下方任何一張牌親手翻開；牌面會飛到上方放大，讓你看清楚。';
          slots.forEach((s, i) => {
            const b = s.querySelector('.manual-slot-card');
            b.disabled = false;
            b.setAttribute('aria-label', `翻開第 ${i+1} 張牌：${spread.positions[i].name}`);
            b.addEventListener('click', ()=>revealCard(i));
          });
        }, reduceMotion ? 0 : 620);
      }, reduceMotion ? 0 : 440);
    }, reduceMotion ? 80 : 980);
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

      // Let the final card land, then move the visual focus into the chosen
      // spread before reveal mode becomes interactive.
      window.setTimeout(focusOnChosenSpread, 580);
    }
  }

  async function revealCard(i) {
    if (revealed.has(i) || selected.length < spread.count || revealAnimating) return;
    revealAnimating = true;
    const slot = slots[i];
    const btn = slot.querySelector('.manual-slot-card');
    const draw = selected[i];
    const position = spread.positions[i];
    slots.forEach((s) => { if (!s.classList.contains('revealed')) s.querySelector('.manual-slot-card').disabled = true; });

    revealStage.hidden = false;
    revealStage.classList.add('ready','is-revealing');
    revealStageTitle.textContent = `第 ${i+1} 張 · ${position.name}`;
    revealStageMeta.textContent = `${draw.card.zhName} · ${draw.orientation==='upright'?'正位':'逆位'}。先看牌面，再留意你第一個感受。`;
    const keywords = draw.orientation === 'upright' ? draw.card.uprightKeywords : draw.card.reversedKeywords;
    revealKeywords.innerHTML = keywords.slice(0,4).map((k)=>`<span>${escapeHtml(k)}</span>`).join('');
    revealLargeCard.classList.remove('has-card');
    revealLargeCard.innerHTML = '<span>✦</span>';
    chosenHint.textContent = `正在翻開第 ${i+1} 張牌…`;

    await flyRevealToStage(btn, revealLargeCard, draw);

    revealLargeCard.innerHTML = `<img src="${draw.card.image}" alt="${escapeHtml(draw.card.zhName)}" class="${draw.orientation==='reversed'?'reversed':''}">`;
    revealLargeCard.classList.add('has-card');
    revealStage.classList.remove('is-revealing');
    btn.innerHTML = `<img src="${draw.card.image}" alt="${escapeHtml(draw.card.zhName)}" class="${draw.orientation==='reversed'?'reversed':''}">`;
    slot.classList.add('revealed');
    revealed.add(i);
    revealAnimating = false;

    if (revealed.size < spread.count) {
      chosenHint.textContent = `已翻開 ${revealed.size} / ${spread.count} 張。看完上方大牌面後，再按下一張。`;
      slots.forEach((s) => {
        const b = s.querySelector('.manual-slot-card');
        b.disabled = s.classList.contains('revealed');
      });
    } else {
      chosenHint.textContent = '全部牌面已翻開。先感受整體，再進入文字解讀。';
      result = composeReading(state.setup, spread, selected);
      state.lastResult = result;
      saveReading(result);
      finish.hidden = false;
      finish.querySelector('p').textContent = `${spread.count} 張牌已經完整翻開，可以直接進入解讀。`;
      requestAnimationFrame(()=>finish.classList.add('visible'));
    }
  }


  shuffleDeck.addEventListener('click', completeShuffle);
  shuffleCall.addEventListener('click', completeShuffle);
  viewResult.addEventListener('click', ()=>{
    if (!result || resultTransitionStarted) return;
    resultTransitionStarted = true;
    viewResult.setAttribute('aria-disabled', 'true');
    viewResult.classList.add('portal-activated');
    readingRoot?.classList.add('entering-result-tunnel');

    const tunnel = document.createElement('div');
    tunnel.className = 'result-tunnel';
    tunnel.setAttribute('aria-hidden', 'true');
    tunnel.innerHTML = `<div class="tunnel-core"><span>✦</span></div><div class="tunnel-thought"><span>正在整理你選出的牌…</span><span>把牌意放回你的問題裡…</span></div>${Array.from({length:9},(_,i)=>`<i style="--ring:${i};--delay:${i*92}ms;--angle:${i*7}deg;--angle-end:${i*7+30}deg"></i>`).join('')}`;
    document.body.appendChild(tunnel);

    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    window.setTimeout(() => {
      location.hash = `#/result/${result.id}`;
      window.setTimeout(() => tunnel.remove(), reduceMotion ? 0 : 90);
    }, reduceMotion ? 80 : 2220);
  });
  app.focus({ preventScroll:true });
}

const clampScore = (value) => Math.max(5, Math.min(95, Math.round(value)));

const positiveScoreTerms = new Set([
  '成功','勝利','希望','喜悅','機會','轉機','完成','圓滿','豐盛','連結','穩定','推進','活力','療癒','信任','創造力','創造','成果','自由','勇氣','平衡','協調','修復','交流','成熟','資源','清晰','覺醒','更新','吸引','價值一致'
]);
const negativeScoreTerms = new Set([
  '阻塞','急躁','停滯','衝動','耗竭','焦慮','失控','衝突','失望','匱乏','拖延','迷失','壓迫','失衡','固執','孤立','反覆','延遲','過載','疲憊','猜疑','依賴','困局延長','方向不穩','準備不足'
]);
const luckyCardIds = new Set(['major-10','major-17','major-19','major-20','major-21','wands-ace','cups-ace','swords-ace','pentacles-ace']);

function dashboardScores(result) {
  const items = result.interpretations || [];
  if (!items.length) return { success:50, failure:50, luck:50, misfortune:50 };

  let totalWeight = 0;
  let orientationTotal = 0;
  let keywordTotal = 0;
  let luckBonus = 0;
  let outcomeBias = 0;

  items.forEach((item) => {
    const weight = Number(item.weight) || 1;
    const orientation = item.orientation === 'upright' ? 1 : -1;
    totalWeight += weight;
    orientationTotal += orientation * weight;

    const terms = (item.keywords || []).slice(0,4);
    const polarity = terms.reduce((sum, term) => sum + (positiveScoreTerms.has(term) ? 1 : 0) - (negativeScoreTerms.has(term) ? 1 : 0), 0);
    keywordTotal += (polarity / Math.max(terms.length, 1)) * weight;

    if (luckyCardIds.has(item.cardId)) luckBonus += orientation * .22 * weight;
    if (['future','outcome','advice','guidance'].includes(item.positionId)) outcomeBias += orientation * .08 * weight;
  });

  const orientationSignal = orientationTotal / Math.max(totalWeight, 1);
  const keywordSignal = keywordTotal / Math.max(totalWeight, 1);
  const luckSignal = luckBonus / Math.max(totalWeight, 1);
  const outcomeSignal = outcomeBias / Math.max(totalWeight, 1);

  const success = clampScore(50 + orientationSignal * 22 + keywordSignal * 16 + outcomeSignal * 42);
  const luck = clampScore(50 + orientationSignal * 12 + keywordSignal * 12 + luckSignal * 70);

  return {
    success, failure: 100 - success,
    luck, misfortune: 100 - luck,
  };
}

function resultCard(item) {
  return `<article class="keyword-result-card">
    <div class="keyword-card-visual"><span class="position-tag">${escapeHtml(item.positionName)}</span><img src="${item.image}" alt="${escapeHtml(item.cardName)} ${item.orientationLabel}" class="${item.orientation==='reversed'?'reversed':''}"></div>
    <div class="keyword-card-copy">
      <p class="keyword-card-en">${escapeHtml(item.enName)}</p>
      <h2>${escapeHtml(item.cardName)} <small>${item.orientationLabel}</small></h2>
      <div class="keyword-only-row">${item.keywords.slice(0,4).map(k=>`<span>${escapeHtml(k)}</span>`).join('')}</div>
    </div>
  </article>`;
}

function dashboardDial(label, positive, negativeLabel, negative) {
  const angle = (positive * 1.8).toFixed(1);
  // 0 = far left (-180deg), 50 = straight up (-90deg), 100 = far right (0deg).
  const needle = (-180 + positive * 1.8).toFixed(1);
  return `<article class="dashboard-dial" style="--score:${positive};--angle:${angle}deg;--needle-end:${needle}deg">
    <div class="dial-face" aria-label="${escapeHtml(label)} ${positive} 分">
      <div class="dial-arc"></div>
      <span class="dial-tick t0"></span><span class="dial-tick t25"></span><span class="dial-tick t50"></span><span class="dial-tick t75"></span><span class="dial-tick t100"></span>
      <i class="dial-needle"></i><b class="dial-hub"></b>
      <div class="dial-number"><strong>${positive}</strong><small>/ 100</small></div>
    </div>
    <div class="dial-pair"><span><b>${escapeHtml(label)}</b>${positive}</span><span><b>${escapeHtml(negativeLabel)}</b>${negative}</span></div>
  </article>`;
}

function paidSummary(result, scores) {
  const items = [...(result.interpretations || [])].sort((a,b)=>(b.weight||1)-(a.weight||1));
  const top = items[0];
  const direction = scores.success >= 62 ? '偏向可推進' : scores.success <= 38 ? '阻力偏高' : '好壞參半';
  const luckTone = scores.luck >= 62 ? '外在時機亦較配合' : scores.luck <= 38 ? '不宜太依賴運氣，較需要靠準備與調整' : '運氣因素屬中性，結果更取決於你之後的選擇';
  const preview = top
    ? `今次牌面整體${direction}。最值得先看的，是${top.cardName}${top.orientationLabel}所帶出的「${top.keywords.slice(0,2).join('、')}」；${luckTone}。`
    : `今次牌面整體${direction}；${luckTone}。`;
  const full = [
    result.coreMessage,
    result.pattern,
    result.plainOverview?.text,
    result.plainOverview?.direction,
  ].filter(Boolean).join(' ');
  return { preview, full };
}

export function renderResult(id) {
  const result = (state.lastResult?.id===id ? state.lastResult : null) || getReading(id);
  if (!result) { page('找不到這次占卜', 'RESULT', `<div class="empty"><p>這筆紀錄可能已被刪除，或來自另一個瀏覽器。</p><a class="btn primary" href="#/setup">重新占卜</a></div>`); return; }
  const theme=themes[result.reading.theme]||themes.custom;
  const scores = dashboardScores(result);
  const summary = paidSummary(result, scores);

  page('你的解讀', 'READING RESULT', `
    <section class="result-intro"><div><div class="reading-meta"><span>${theme.label}</span><span>${escapeHtml(result.reading.subtopic)}</span><span>${escapeHtml(result.spread.name)}</span></div><h2>「${escapeHtml(result.reading.question)}」</h2><p>${fmtDate(result.createdAt)}</p></div><a href="#/setup" class="btn ghost">再次占卜</a></section>

    <section class="keyword-cards-section">
      <div class="section-heading"><p class="eyebrow">CARD BY CARD</p><h2>逐張看</h2><p>只保留牌名、正逆位與最重要的 4 個關鍵詞。</p></div>
      <div class="keyword-result-cards">${result.interpretations.map(resultCard).join('')}</div>
    </section>

    <section class="reading-dashboard">
      <div class="dashboard-heading"><div><p class="eyebrow">READING DASHBOARD</p><h2>牌面儀錶板</h2></div><p>分數代表這次牌面的相對傾向，不是科學機率或結果保證。</p></div>
      <div class="dashboard-cluster">
        ${dashboardDial('成功', scores.success, '不成功', scores.failure)}
        ${dashboardDial('好運', scores.luck, '厄運', scores.misfortune)}
      </div>
    </section>

    <section class="paid-summary-section">
      <div class="paid-summary-head"><p class="eyebrow">SUMMARY ANALYSIS</p><h2>摘要分析</h2></div>
      <div class="paid-summary-card">
        <p class="summary-preview">${escapeHtml(summary.preview)}</p>
        <div class="summary-locked" aria-label="完整摘要分析已鎖定">
          <div class="summary-blurred" aria-hidden="true">
            <p>${escapeHtml(summary.full || result.pattern || result.coreMessage)}</p>
            <p>${escapeHtml((result.combinations || []).slice(0,2).map(c=>c.text).join(' ') || '牌與牌之間仍有更多關係可以進一步拆解，包括位置、正逆位比例與組合訊號。')}</p>
          </div>
          <div class="summary-lock-overlay"><span>✦</span><strong>完整分析已鎖定</strong><p>日後可接駁收費模式，付款後解除模糊並顯示全文。</p><button type="button" disabled>付費解鎖 · 稍後推出</button></div>
        </div>
      </div>
    </section>

    <section class="final-summary simple-final"><p class="eyebrow">REMEMBER</p><h2>把牌當成鏡子，不是判決。</h2><p>牌面指出的是現在較值得留意的方向。真正會改變結果的，仍然是現實資訊、溝通方式，以及你之後的選擇。</p><div class="disclaimer-box">塔羅占卜屬於娛樂及自我反思用途，結果並非科學預測，也不能保證未來一定會按照牌面發展。涉及醫療、法律、投資或重大人生決策時，應以專業意見及實際資訊作判斷。</div></section>
  `,'result-page keyword-result-page');
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
