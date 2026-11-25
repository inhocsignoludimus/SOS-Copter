// story.js — modo história: níveis com cidades do SimCity 2000; cumprir a meta de uma cidade libera o nível seguinte
// (como na carreira do SimCopter). Dinheiro, helicópteros e patente seguem com você de uma cidade para outra.
const STORY_GOAL = { 1: 8, 2: 10, 3: 12, 4: 14, 5: 16 };
// tipos de chamada que aparecem em cada nível (novos tipos entram aos poucos)
const STORY_TYPES = { 1: ['taxi', 'transito', 'medico', 'incendio', 'telhado'], 2: ['taxi', 'transito', 'medico', 'incendio', 'telhado', 'mar', 'tumulto', 'enchente'] };
const storyTypes = lvl => STORY_TYPES[lvl] || Object.keys(MT);
function storyProg() { try { return Object.assign({ lvl: 1, done: {} }, JSON.parse(localStorage.getItem('ar.story') || '{}')); } catch (e) { return { lvl: 1, done: {} }; } }
function storySetProg(p) { try { localStorage.setItem('ar.story', JSON.stringify(p)); } catch (e) {} }
const storyMaps = () => Object.entries(SC2_MAPS).filter(([id]) => !id.startsWith('test_') || localStorage.getItem('ar.testmaps')).map(([id, m]) => ({ id, ...m })).sort((a, b) => a.level - b.level || a.id.localeCompare(b.id));
const storyMap = () => CITY.story ? CITY.id.slice(4) : null;
function storyCount() { // chamado a cada missão concluída
  const id = storyMap(); if (!id || G.free) return; G.mapDone = G.mapDone || {}; G.mapDone[id] = (G.mapDone[id] || 0) + 1;
  const lvl = CITY.story.level, goal = STORY_GOAL[lvl] || 12, p = storyProg();
  if (G.mapDone[id] >= goal && !p.done[id]) { p.done[id] = 1; const next = lvl + 1, has = storyMaps().some(m => m.level === next);
    if (has && p.lvl < next) p.lvl = next; storySetProg(p); sfx('win');
    radio(T('stClearRadio', { c: CITY.name }), 'win');
    setTimeout(() => { if (M) return; paused = true;
      show(`<img class="logo" src="img/logo.jpg" alt="SOS Copter"><h2>${T('stClear')}</h2><p>${T(has ? 'stClearNext' : 'stClearEnd', { c: CITY.name, n: next })}</p>
      <div class="row">${btn('stNext', T('stChoose'))}${btn('stStay', T('stStay'), 'alt')}</div>`);
      on('stNext', () => { save(); showStory(); }); on('stStay', () => { paused = false; hideOv(); }); }, 2500); }
}
const storyGoalText = () => { const id = storyMap(); if (!id || G.free) return ''; const goal = STORY_GOAL[CITY.story.level] || 12, d = Math.min(goal, (G.mapDone || {})[id] || 0);
  return storyProg().done[id] ? T('stDoneTag') : T('stGoal', { d, n: goal }); };
function showModes() { // "Iniciar jogo": modo história ou carreira livre
  show(`<img class="logo" src="img/logo.jpg" alt="SOS Copter"><h2>${T('stModes')}</h2>
  <div class="citylist"><button class="citybtn" id="mStory"><b>${T('stStory')}</b><span>${T('stStoryD')}</span></button>
  <button class="citybtn" id="mCareer"><b>${T('stCareer')}</b><span>${T('stCareerD')}</span></button></div>${btn('back', T('back'), 'alt')}`);
  on('mStory', showStory); on('back', showMain);
  on('mCareer', () => { if (CITY.story) { try { localStorage.setItem('ar.auto', 'career'); } catch (e) {} setCity(localStorage.getItem('ar.lastCity') || 'miami'); } else startCareerMenu(); });
}
function showStory() {
  const p = storyProg(), maps = storyMaps(), lvls = [...new Set(maps.map(m => m.level))];
  if (!maps.length) { show(`<h2>${T('stStory')}</h2><p>${T('stNoMaps')}</p>${btn('back', T('back'), 'alt')}`); on('back', showModes); return; }
  show(`<img class="logo" src="img/logo.jpg" alt="SOS Copter"><h2>${T('stStory')}</h2><p class="small">${T('stNote')}</p>
  ${lvls.map(l => `<h4>${T('stLevel', { n: l })}${l > p.lvl ? ' · 🔒' : ''}</h4><div class="maps">${maps.filter(m => m.level === l).map(m => { const lock = l > p.lvl, done = p.done[m.id];
    return `<button class="mapc${lock ? ' lock' : ''}${done ? ' done' : ''}" data-m="${m.id}"${lock ? ' disabled' : ''}>${m.thumb ? `<img src="${m.thumb}" alt="">` : '<div class="nothumb"></div>'}
    <b>${m.title}</b><span>${T('stBy', { a: m.author })}</span><span class="tag">${lock ? T('stLocked', { n: l - 1 }) : done ? T('stDoneTag') : T('stGoalShort', { n: STORY_GOAL[l] || 12 })}</span></button>`; }).join('')}</div>`).join('')}
  <p class="small">${T('stCredit')}</p>${btn('back', T('back'), 'alt')}`);
  card.querySelectorAll('.mapc:not(.lock)').forEach(b => b.onclick = () => { const id = b.dataset.m;
    if (CITY.id === 'sc2:' + id) return storyBegin();
    try { localStorage.setItem('ar.auto', 'story'); if (!CITY.story) localStorage.setItem('ar.lastCity', CITY.id); } catch (e) {} setCity('sc2:' + id); });
  on('back', showModes);
}
function storyBegin() { const sv = loadSave(); G = sv || newCareer(); G.story = true; save(); beginCareer(); }
// depois de trocar de cidade (a página recarrega), entra direto no modo escolhido
function storyAuto() { let a = null; try { a = localStorage.getItem('ar.auto'); localStorage.removeItem('ar.auto'); } catch (e) {}
  if (a === 'story' && CITY.story) storyBegin(); else if (a === 'career' && !CITY.story) startCareerMenu(); }
