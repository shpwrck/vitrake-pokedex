/* Vitrake field archive. All assets and data remain local to the portable kit. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const statLabels = {hp:'HP',attack:'Attack',defense:'Defense',specialAttack:'Sp. Atk',specialDefense:'Sp. Def',speed:'Speed'};
  const state = {species:null,manifest:null,image:null,frame:0,palette:'regular',view:'front',mode:'sprite',animation:'idle',playing:!matchMedia('(prefers-reduced-motion: reduce)').matches,ready:false,request:0,timer:null,entry:0,tab:'entry'};
  const defaultCryCaption = $('cry-caption').textContent;
  const spriteCache = new Map();

  async function readJSON(path) {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`Could not open ${path} (${response.status})`);
    return response.json();
  }

  function normalizeSpecies(raw) {
    const stats = raw.stats || raw.base_stats || {};
    const abilities = Array.isArray(raw.abilities) ? raw.abilities : Object.entries(raw.abilities || {}).map(([key,value]) => ({...value,hidden:key==='hidden'}));
    return {...raw,entries:raw.entries || raw.dex_entries || [],heightM:raw.heightM ?? raw.height_m,weightKg:raw.weightKg ?? raw.weight_kg,
      stats:{...stats,specialAttack:stats.specialAttack ?? stats.special_attack,specialDefense:stats.specialDefense ?? stats.special_defense},
      abilities,moves:raw.moves || raw.learnset || [],typeMatchups:raw.typeMatchups || raw.type_matchups || {},battleSet:raw.battleSet || raw.sample_build};
  }

  function renderEntry() {
    const species = state.species;
    document.title = `${species.name} · Personal Pokédex`;
    document.querySelector('.species-heading h1 > span').textContent = species.pronunciation || 'VIT-rayk';
    $('height').innerHTML = `${escape(species.heightM)} <small>m</small>`;
    $('weight').innerHTML = `${escape(species.weightKg)} <small>kg</small>`;
    $('habitat').textContent = species.habitat;
    $('habitat-label').textContent = 'BOMBARDIER BEETLE';
    $('dex-entry').textContent = species.entries[state.entry] || species.description;
    $('entry-pages').innerHTML = species.entries.map((_,index) => `<button aria-pressed="${index===state.entry}" aria-label="Pokédex entry ${index+1}" data-entry="${index}">${index+1}</button>`).join('');
    $('entry-pages').querySelectorAll('button').forEach(button => button.addEventListener('click', () => {state.entry=Number(button.dataset.entry);renderEntry();$('entry-pages').querySelector(`[data-entry="${state.entry}"]`).focus();}));
    $('lore-body').textContent = species.lore?.behavior || species.description || '';
    const sections = [['Around its Trainer',species.lore?.personality],['Habitat & habits',species.lore?.ecology],['The horn chambers',species.lore?.refill],['The animal behind Vitrake',species.lore?.realAnimal],['From beetle to dragon',species.lore?.fictionBoundary],['A name with a purpose',species.nameEtymology]];
    $('entry-details').innerHTML = sections.filter(([,text])=>text).map(([title,text])=>`<details><summary>${escape(title)}</summary><p>${escape(text)}</p></details>`).join('');
  }

  function renderBattle() {
    const species = state.species;
    $('battle-role').textContent = species.battleRole || '';
    $('bst').textContent = `TOTAL ${species.baseStatTotal || Object.values(species.stats).filter(Number.isFinite).reduce((sum,value)=>sum+value,0)}`;
    $('stats').innerHTML = Object.entries(statLabels).map(([key,label])=>`<div class="stat-row" data-stat="${key}" aria-label="${escape(label)}: ${escape(species.stats[key])}"><span>${label}</span><div class="stat-track" aria-hidden="true"><div style="width:${Math.min(100,Math.max(0,Number(species.stats[key])/180*100))}%"></div></div><strong>${escape(species.stats[key])}</strong></div>`).join('');
    $('abilities').innerHTML = species.abilities.map(ability=>`<div class="ability"><h4>${escape(ability.name)}${ability.hidden?'<span>HIDDEN ABILITY</span>':''}</h4><p>${escape(ability.description)}</p></div>`).join('');
    $('matchups').innerHTML = Object.entries(species.typeMatchups).map(([type,multiplier])=>`<div class="matchup ${multiplier===0?'immune':multiplier>1?'weak':multiplier<1?'resist':''}"><span>${escape(type)}</span><strong>${multiplier===0.25?'¼':multiplier===0.5?'½':escape(multiplier)}×</strong></div>`).join('');
    const build = species.battleSet;
    $('battle-set-section').hidden = !build;
    if (build) {
      const evs = typeof build.evs==='object' ? Object.entries(build.evs).filter(([,value])=>value>0).map(([key,value])=>`${value} ${statLabels[key] || key}`).join(' / ') : build.evs;
      $('battle-set').innerHTML = `<h4>${escape(build.name || 'Sample set')}</h4><p>${escape(build.ability)} · ${escape(build.nature)} · ${escape(build.item)}</p><p><strong>EVs:</strong> ${escape(evs)}</p>${build.teraType?`<p><strong>Tera Type:</strong> ${escape(build.teraType)}</p>`:''}<div class="build-moves">${(build.moves || []).map(move=>`<span>${escape(move)}</span>`).join('')}</div>${build.notes?`<p>${escape(build.notes)}</p>`:''}`;
    }
    $('mechanics-note').textContent = `${species.mechanicsTarget || 'Generation IX mechanics'}. ${species.typeMatchupsNote || ''} ${species.spriteTarget || ''}`;
    if (species.statsRanges50) {
      const detail = document.createElement('details');
      detail.className = 'entry-details stat-ranges';
      detail.innerHTML = `<summary>Level 50 stat ranges</summary><table><thead><tr><th>Stat</th><th>Minimum</th><th>Maximum</th></tr></thead><tbody>${Object.entries(species.statsRanges50).map(([key,range])=>`<tr><th>${statLabels[key] || escape(key)}</th><td>${escape(range.min)}</td><td>${escape(range.max)}</td></tr>`).join('')}</tbody></table><p class="small-copy">${escape(species.statsRangesNote)}</p>`;
      $('stats').append(detail);
    }
  }

  function setupMoves() {
    const moves = state.species.moves;
    [['move-type','type'],['move-method','method']].forEach(([id,key]) => {
      const values = [...new Set(moves.map(move=>move[key]).filter(Boolean))].sort();
      $(id).insertAdjacentHTML('beforeend',values.map(value=>`<option value="${escape(value)}">${escape(value)}</option>`).join(''));
    });
    $('moves-note').textContent = state.species.learnsetNote || 'A fan-designed learnset using existing game moves.';
    ['move-search','move-type','move-method','move-sort'].forEach(id=>$(id).addEventListener(id==='move-search'?'input':'change',renderMoves));
    $('clear-filters').addEventListener('click',()=>{$('move-search').value='';$('move-type').value='all';$('move-method').value='all';$('move-sort').value='learn';renderMoves();});
    renderMoves();
  }

  function renderMoves() {
    if (!state.species) return;
    const query = $('move-search').value.trim().toLowerCase();
    const type = $('move-type').value;
    const method = $('move-method').value;
    const sort = $('move-sort').value;
    const moves = state.species.moves.filter(move => (!query || `${move.name} ${move.description}`.toLowerCase().includes(query)) && (type==='all' || move.type===type) && (method==='all' || move.method===method));
    moves.sort((a,b) => sort==='power' ? (b.power || 0)-(a.power || 0) || a.name.localeCompare(b.name) : sort==='name' ? a.name.localeCompare(b.name) : sort==='type' ? a.type.localeCompare(b.type) || a.name.localeCompare(b.name) : (a.method==='Level up'?0:1)-(b.method==='Level up'?0:1) || (a.level ?? 1000)-(b.level ?? 1000) || (a.method==='Level up'?0:a.name.localeCompare(b.name)));
    const unique = new Set(moves.map(move=>move.name)).size;
    $('move-count').textContent = `${unique} moves · ${moves.length} learn methods`;
    $('moves-list').innerHTML = moves.length ? moves.map(move=>{
      const learning = move.method==='Level up' ? `Lv. ${move.level}` : move.method;
      return `<details class="move-item"><summary><span><span class="move-title">${escape(move.name)}</span><span class="move-meta">${escape(learning)} · ${escape(move.type)} · ${escape(move.category)}</span></span><span class="move-pow">${move.power===null || move.power===undefined?'—':escape(move.power)}<small>POWER +</small></span></summary><div class="move-effect"><div class="move-details"><span>ACC <strong>${move.accuracy===null || move.accuracy===undefined?'—':`${escape(move.accuracy)}%`}</strong></span><span>PP <strong>${escape(move.pp)}</strong></span>${move.priority?`<span>PRIORITY <strong>${move.priority>0?'+':''}${escape(move.priority)}</strong></span>`:''}</div><p>${escape(move.description)}</p>${move.accuracy===null?'<p class="small-copy">No accuracy check.</p>':''}${move.megaLauncherBoosted?'<p class="small-copy">Mega Launcher boosts this move’s power by 50%.</p>':''}</div></details>`;
    }).join('') : '<p class="empty-moves">No moves match those filters. Try another search or reset the filters.</p>';
  }

  function setTab(name,focus=false) {
    state.tab = name;
    for (const tab of ['entry','battle','moves','gift']) {
      $(`tab-${tab}`).setAttribute('aria-selected',String(tab===name));
      $(`tab-${tab}`).tabIndex = tab===name ? 0 : -1;
      $(`panel-${tab}`).hidden = tab!==name;
    }
    if (focus) $(`tab-${name}`).focus();
  }

  function setupTabs() {
    const tabs = ['entry','battle','moves','gift'];
    tabs.forEach((name,index)=>{
      $(`tab-${name}`).addEventListener('click',()=>setTab(name));
      $(`tab-${name}`).addEventListener('keydown',event=>{
        let next;
        if(event.key==='ArrowRight') next=(index+1)%tabs.length;
        if(event.key==='ArrowLeft') next=(index+tabs.length-1)%tabs.length;
        if(event.key==='Home') next=0;
        if(event.key==='End') next=tabs.length-1;
        if(next!==undefined){event.preventDefault();setTab(tabs[next],true);}
      });
    });
  }

  const spriteSpec = () => ({frameWidth:state.manifest?.frameWidth || 64,frameHeight:state.manifest?.frameHeight || 64,columns:state.manifest?.columns || 8,frameCount:state.manifest?.frameCount || 40,frameDurationMs:state.manifest?.frameDurationMs || 50});
  function spritePath() {
    const key = `${state.palette}-${state.view}`;
    const sheet = state.manifest?.animations?.[state.animation]?.sheets?.[key] || state.manifest?.sheets?.[key] || `${key}-sheet.png`;
    return typeof sheet==='string' ? `../sprites/${sheet}` : `../sprites/${sheet.file || sheet.path}`;
  }

  async function loadSprite() {
    const request = ++state.request;
    clearTimeout(state.timer);
    state.ready=false;
    $('sprite-message').textContent='Loading specimen…';
    $('sprite-message').hidden=false;
    const context=$('sprite').getContext('2d');
    context.clearRect(0,0,$('sprite').width,$('sprite').height);
    syncSpriteControls();
    try {
      const path=spritePath();
      let image=spriteCache.get(path);
      if(!image){image=new Image();await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=()=>reject(new Error('Sprite image could not load'));image.src=path;});spriteCache.set(path,image);}
      if(request!==state.request)return;
      const spec=spriteSpec();
      if(image.naturalWidth!==spec.columns*spec.frameWidth || image.naturalHeight!==Math.ceil(spec.frameCount/spec.columns)*spec.frameHeight)throw new Error('Sprite dimensions do not match the manifest');
      state.image=image;state.ready=true;state.frame%=spec.frameCount;
      $('sprite').width=spec.frameWidth;$('sprite').height=spec.frameHeight;
      $('frame').max=String(spec.frameCount-1);
      $('sprite-message').hidden=true;
      resizeSprite();drawSprite();syncSpriteControls();tick();
    } catch(error) {
      if(request!==state.request)return;
      state.ready=false;
      $('sprite-message').textContent=`The sprite could not load. ${error.message}.`;
      syncSpriteControls();
    }
  }

  function resizeSprite() {
    const spec=spriteSpec();
    const stage=$('sprite-stage').getBoundingClientRect();
    if(!stage.width || !stage.height)return;
    const scale=Math.max(1,Math.floor(Math.min(stage.width/spec.frameWidth,stage.height/spec.frameHeight)));
    $('sprite').style.width=`${spec.frameWidth*scale}px`;
    $('sprite').style.height=`${spec.frameHeight*scale}px`;
  }

  function drawSprite() {
    if(!state.ready)return;
    const spec=spriteSpec();
    const context=$('sprite').getContext('2d');
    context.imageSmoothingEnabled=false;context.clearRect(0,0,spec.frameWidth,spec.frameHeight);
    context.drawImage(state.image,(state.frame%spec.columns)*spec.frameWidth,Math.floor(state.frame/spec.columns)*spec.frameHeight,spec.frameWidth,spec.frameHeight,0,0,spec.frameWidth,spec.frameHeight);
    $('frame').value=String(state.frame);
    $('frame-number').value=`${String(state.frame+1).padStart(2,'0')}/${spec.frameCount}`;
    $('sprite').setAttribute('aria-label',`${state.palette} Vitrake, ${state.view} view, ${state.animation} animation frame ${state.frame+1} of ${spec.frameCount}`);
  }

  function tick() {
    clearTimeout(state.timer);
    if(!state.ready || !state.playing || state.mode!=='sprite' || document.hidden)return;
    state.timer=setTimeout(()=>{
      const last=spriteSpec().frameCount-1;
      if(state.frame===last && state.manifest?.animations?.[state.animation]?.loop===false){state.playing=false;syncSpriteControls();return;}
      state.frame=(state.frame+1)%spriteSpec().frameCount;drawSprite();tick();
    },spriteSpec().frameDurationMs);
  }

  function syncSpriteControls() {
    for(const id of ['play','frame','reset'])$(id).disabled=!state.ready;
    $('play').setAttribute('aria-label',state.playing?'Pause animation':'Play animation');
    $('play').firstElementChild.textContent=state.playing?'Ⅱ':'▶';
    $('shiny').setAttribute('aria-pressed',String(state.palette==='shiny'));
    $('view-front').setAttribute('aria-pressed',String(state.view==='front'));
    $('view-back').setAttribute('aria-pressed',String(state.view==='back'));
    $('mode-sprite').setAttribute('aria-pressed',String(state.mode==='sprite'));
    $('mode-artwork').setAttribute('aria-pressed',String(state.mode==='artwork'));
    $('form-caption').textContent=state.mode==='artwork'?'HABITAT STUDY':`${state.palette.toUpperCase()} FORM · ${state.view.toUpperCase()}`;
    $('resolution-caption').textContent=state.mode==='sprite'?'64 × 64':'FIELD ART';
    $('view-status').textContent=state.mode==='artwork'?'FIELD ART':!state.ready?'LOADING':state.playing?'● OBSERVING':'● STILL FRAME';
    $('sprite-stage').hidden=state.mode!=='sprite';$('artwork-stage').hidden=state.mode!=='artwork';
    $('sprite-controls').hidden=state.mode!=='sprite';$('art-caption').hidden=state.mode!=='artwork';
    $('specimen-screen').classList.toggle('art-mode',state.mode==='artwork');
    $('animation-row').hidden=state.view!=='front';
    $('animation').value=state.animation;
  }

  function setupSpriteControls() {
    for(const mode of ['sprite','artwork'])$(`mode-${mode}`).addEventListener('click',()=>{state.mode=mode;syncSpriteControls();resizeSprite();tick();});
    for(const view of ['front','back'])$(`view-${view}`).addEventListener('click',()=>{if(view===state.view)return;state.view=view;state.frame=0;if(view==='back')state.animation='idle';loadSprite();});
    $('shiny').addEventListener('click',()=>{state.palette=state.palette==='shiny'?'regular':'shiny';loadSprite();});
    $('play').addEventListener('click',()=>{if(!state.playing && state.frame===spriteSpec().frameCount-1 && state.manifest?.animations?.[state.animation]?.loop===false){state.frame=0;drawSprite();}state.playing=!state.playing;syncSpriteControls();tick();});
    $('frame').addEventListener('input',()=>{state.playing=false;state.frame=Number($('frame').value);drawSprite();syncSpriteControls();tick();});
    $('reset').addEventListener('click',()=>{state.playing=false;state.frame=0;drawSprite();syncSpriteControls();tick();});
    $('animation').addEventListener('change',()=>{state.animation=$('animation').value;state.frame=0;loadSprite();});
    document.addEventListener('visibilitychange',tick);
    const motion=matchMedia('(prefers-reduced-motion: reduce)');
    motion.addEventListener('change',event=>{if(event.matches){state.playing=false;syncSpriteControls();tick();}});
    new ResizeObserver(resizeSprite).observe($('sprite-stage'));
    $('artwork').addEventListener('error',()=>{$('artwork').hidden=true;$('artwork-message').hidden=false;});
  }

  function setupCry() {
    const audio=$('cry');audio.volume=.7;
    const sync=()=>{const playing=!audio.paused&&!audio.ended;$('cry-label').textContent=playing?'Playing cry':'Hear Vitrake';$('cry-icon').textContent=playing?'■':'♪';$('cry-button').classList.toggle('is-playing',playing);$('cry-button').setAttribute('aria-label',playing?'Stop Vitrake cry':'Play Vitrake cry');};
    ['play','pause','ended'].forEach(event=>audio.addEventListener(event,sync));
    audio.addEventListener('error',()=>{$('cry-caption').textContent='The cry could not load. The sound file is included in the gift kit.';sync();});
    $('cry-button').addEventListener('click',async()=>{if(!audio.paused){audio.pause();audio.currentTime=0;return;}$('cry-caption').textContent=defaultCryCaption;audio.currentTime=0;try{await audio.play();}catch(error){if(error.name!=='AbortError')$('cry-caption').textContent='The cry could not play. Try again, or open the sound file from the gift kit.';sync();}});
    sync();
  }

  function setupCard() {
    const rotate=()=>{const angle=Number($('card-angle').value);$('card-object').style.transform=`rotateY(${angle}deg)`;$('card-object').style.setProperty('--foil-x',`${30+(angle%180)/3}%`);$('card-object').style.setProperty('--foil-y',`${40+(angle%180)/5}%`);$('card-angle-value').value=`${angle}°`;$('card-angle').setAttribute('aria-valuetext',`${angle} degrees, ${angle>90&&angle<270?'back':'front'} facing`);};
    $('card-angle').addEventListener('input',rotate);rotate();
    $('card-front').addEventListener('error',()=>{$('card-error').hidden=false;});
  }

  async function renderCardText() {
    try {
      const card=await readJSON('../cards/card-data.json');
      const energy=cost=>Array.isArray(cost)?cost.join(' + '):typeof cost==='number'?`${cost} Colorless`:cost&&typeof cost==='object'?Object.entries(cost).map(([type,count])=>`${count} ${type}`).join(' + '):String(cost || '');
      const value=value=>value===null || value===undefined || value==='None'?'None':typeof value==='object'?Object.entries(value).map(([,part])=>String(part)).join(' '):String(value);
      const attacks=card.attacks || [];
      $('card-text').innerHTML=`<p><strong>${escape(card.name || 'Vitrake ex')}</strong> · ${escape(card.stage || 'Basic')} · ${escape(card.hp)} HP · ${escape(card.type || 'Dragon')}</p>${attacks.map(attack=>`<h4>${escape(attack.name)} ${escape(attack.damage ?? '')}</h4><p><strong>Cost:</strong> ${escape(energy(attack.cost || attack.energyCost))}</p><p>${escape(attack.text || attack.effect || attack.description)}</p>`).join('')}<p><strong>Weakness:</strong> ${escape(value(card.weakness))}<br><strong>Resistance:</strong> ${escape(value(card.resistance))}<br><strong>Retreat:</strong> ${escape(energy(card.retreatCost ?? card.retreat ?? [])) || 'None'}</p>${card.rule?`<p>${escape(card.rule)}</p>`:''}${card.flavorText?`<p>${escape(card.flavorText)}</p>`:''}`;
      $('source-list').insertAdjacentHTML('beforeend',(card.sources || []).filter(source=>/^https?:\/\//.test(source.url)).map(source=>`<li><a href="${escape(source.url)}" target="_blank" rel="noopener noreferrer">${escape(source.title)}</a></li>`).join(''));
    } catch {document.querySelector('.card-transcript').hidden=true;}
  }

  async function renderDownloads() {
    const files=[
      ['Vitrake-Gift-Kit.zip','Download the complete kit','Artwork, sprites, printouts, records and this Pokédex','ZIP','all'],
      ['Vitrake-Pokedex-A4.pdf','Pokédex field guide · A4','Print-ready species record','PDF'],
      ['Vitrake-Pokedex-Letter.pdf','Pokédex field guide · Letter','US Letter print layout','PDF'],
      ['Vitrake-Card-Print-A4.pdf','Card print sheet · A4','Front and back at card size','PDF'],
      ['Vitrake-Card-Print-Letter.pdf','Card print sheet · Letter','US Letter card layout','PDF'],
      ['Vitrake-Art-Print-A4.pdf','Artwork print · A4','Full illustration for framing or gifting','PDF'],
      ['Vitrake-Art-Print-Letter.pdf','Artwork print · Letter','US Letter artwork layout','PDF'],
      ['Vitrake-Sprites.zip','Sprites & animations','Regular, shiny, front, back and Aseprite sources','ZIP']
    ];
    const results=await Promise.allSettled(files.map(async file=>{const response=await fetch(`../downloads/${file[0]}`,{method:'HEAD'});return response.ok?file:null;}));
    const available=results.filter(result=>result.status==='fulfilled'&&result.value).map(result=>result.value);
    $('downloads').innerHTML=available.map(([file,label,description,format,kind])=>kind==='all'?`<a class="download-all" href="../downloads/${file}" download>${label} ↓</a>`:`<a class="download-row" href="../downloads/${file}" download><span class="download-icon" aria-hidden="true">${format}</span><span><span class="download-label">${label}</span><span class="download-meta">${description}</span></span><span aria-hidden="true">↓</span></a>`).join('') || '<p class="small-copy">The printable files are not present in this copy of the kit.</p>';
  }

  function renderSources() {
    $('source-list').innerHTML=(state.species.sources || []).filter(source=>/^https?:\/\//.test(source.url)).map(source=>`<li><a href="${escape(source.url)}" target="_blank" rel="noopener noreferrer">${escape(source.title)}</a></li>`).join('');
  }

  async function init() {
    setupTabs();setupSpriteControls();setupCry();setupCard();
    const results=await Promise.allSettled([readJSON('../game/species.json'),readJSON('../sprites/manifest.json')]);
    if(results[0].status==='fulfilled'){
      state.species=normalizeSpecies(results[0].value);renderEntry();renderBattle();setupMoves();renderSources();$('record-status').textContent='RECORD COMPLETE';
    }else{
      $('load-error').hidden=false;$('load-error').textContent=location.protocol==='file:'?'To open this interactive Pokédex, serve the entire gift folder with a local web server, then open /web/. The printable guide can be opened directly.':'The field record could not load. Please reload this page or check that the complete gift folder is present.';
      $('dex-entry').textContent='The field record could not load.';$('record-status').textContent='RECORD UNAVAILABLE';
    }
    if(results[1].status==='fulfilled')state.manifest=results[1].value;
    await Promise.allSettled([loadSprite(),renderCardText(),renderDownloads()]);
    document.documentElement.dataset.ready='true';
  }
  init();
})();
