import { renderHome, renderSetup, renderReading, renderResult, renderGuide, renderHistory } from './ui/render.js';

const menuBtn=document.querySelector('#menuBtn');
const mobileNav=document.querySelector('#mobileNav');
menuBtn.addEventListener('click',()=>{ mobileNav.hidden=!mobileNav.hidden; });
mobileNav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{ mobileNav.hidden=true; }));

function route() {
  const raw=(location.hash||'#/home').slice(1);
  const [pathQuery]=raw.split('/').filter(Boolean);
  const [path,query='']=pathQuery.split('?');
  const segments=raw.split('/').filter(Boolean);
  const id=segments[1]?.split('?')[0];
  document.body.dataset.route=path || 'home';
  mobileNav.hidden=true;
  window.scrollTo({top:0,behavior:'instant'});
  if(path==='home') return renderHome();
  if(path==='setup') return renderSetup(query);
  if(path==='reading') return renderReading();
  if(path==='result') return renderResult(id);
  if(path==='guide') return renderGuide('all');
  if(path==='history') return renderHistory();
  renderHome();
}
window.addEventListener('hashchange',route);
route();
