// Carla's Learn - app.js
// Responsibilities:
// - routing (hash-based)
// - fetching manifest and course files
// - rendering pages (home, course, module quiz)
// - storing and retrieving last scores from localStorage

const STORAGE_PREFIX = 'carla_learn_v1';
const STORAGE_KEY = `${STORAGE_PREFIX}.scores`;

// Simple storage service wrapping localStorage JSON operations
const StorageService = {
  _read(){
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    }catch(e){ console.error('Storage parse error', e); return {}; }
  },
  getScores(){ return this._read(); },
  saveScore(courseFile, moduleId, scoreObj){
    const all = this._read();
    const key = `${courseFile}#${moduleId}`;
    all[key] = scoreObj;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  }
};

// Simple utilities
function filenameToTitle(filename){
  const base = filename.replace(/\.json$/i, '').replace(/[_-]+/g, ' ');
  return base.split(' ').map(s => s.charAt(0).toUpperCase()+s.slice(1)).join(' ');
}

function showToast(msg, timeout=2500){
  const t = document.getElementById('toast');
  t.textContent = msg; t.hidden = false;
  setTimeout(()=> t.hidden = true, timeout);
}

// Router
const Router = {
  routes: {},
  init(){ window.addEventListener('hashchange', ()=> this._resolve()); this._resolve(); },
  register(route, fn){ this.routes[route] = fn; },
  _resolve(){
    const hash = location.hash.replace(/^#/, '') || '/';
    // routes: /, /course/:file, /course/:file/module/:id
    const parts = hash.split('/').filter(Boolean);
    const app = document.getElementById('app');
    if(parts.length===0){ this.routes.home(app); return; }
    if(parts[0]==='course' && parts[1] && !parts[2]){
      this.routes.course(app, parts[1]); return;
    }
    if(parts[0]==='course' && parts[1] && parts[2]==='module' && parts[3]){
      this.routes.module(app, parts[1], parts[3]); return;
    }
    // fallback
    this.routes.home(app);
  }
};

// App state & rendering
const App = {
  manifest: [],
  coursesCache: {},
  async loadManifest(){
    try{
      const res = await fetch('./courses/index.json');
      if(!res.ok) throw new Error('Gagal fetch manifest');
      const json = await res.json();
      if(!Array.isArray(json)) throw new Error('index.json harus array nama file');
      this.manifest = json;
      document.getElementById('dev-info').textContent = `Dev: manifest loaded ${json.length} courses`;
      return json;
    }catch(err){
      console.error(err);
      document.getElementById('app').innerHTML = `<div class="center"><p>Tidak dapat memuat manifest courses: ${err.message}</p><p class="small">Pastikan <code>/courses/index.json</code> ada dan berisi array file JSON</p></div>`;
      throw err;
    }
  },
  async fetchCourse(file){
    if(this.coursesCache[file]) return this.coursesCache[file];
    try{
      const res = await fetch(`./courses/${file}`);
      if(!res.ok) throw new Error('Gagal fetch course file');
      const json = await res.json();
      // basic validation
      if(!json.modules || !Array.isArray(json.modules)) throw new Error('Course JSON missing "modules" array');
      this.coursesCache[file] = json;
      return json;
    }catch(err){
      console.error(err);
      throw err;
    }
  }
};

// Render home
function renderHome(container, manifest){
  container.innerHTML = '';
  const heading = document.createElement('div'); heading.className='center';
  heading.innerHTML = `<h2>Daftar Course</h2><p class="small">Pilih course untuk mulai belajar</p>`;
  container.appendChild(heading);

  if(!manifest || manifest.length===0){
    container.innerHTML += `<div class="center"><p>Tidak ada course — upload JSON ke folder /courses dan tambahkan filename ke <code>courses/index.json</code></p></div>`;
    return;
  }

  const grid = document.createElement('div'); grid.className='grid';
  manifest.forEach(file => {
    const card = document.createElement('article'); card.className='card';
    const title = filenameToTitle(file);
    const cover = document.createElement('div'); cover.className='course-cover'; cover.textContent = title;
    const desc = document.createElement('p'); desc.className='small'; desc.textContent = '';
    const openBtn = document.createElement('button'); openBtn.className='btn'; openBtn.textContent = 'Buka Course';
    openBtn.addEventListener('click', ()=> location.hash = `#/course/${file}`);
    // Try to fetch and fill description (graceful)
    App.fetchCourse(file).then(course => { if(course.description) desc.textContent = course.description; }).catch(()=>{});

    card.appendChild(cover); card.appendChild(document.createElement('hr'));
    const h = document.createElement('h3'); h.textContent = title; card.appendChild(h);
    card.appendChild(desc);
    const meta = document.createElement('div'); meta.className='meta';
    meta.appendChild(openBtn);
    card.appendChild(meta);
    grid.appendChild(card);
  });
  container.appendChild(grid);
}

// Render course page
async function renderCourse(container, file){
  container.innerHTML = `<div class="center"><p class="small">Memuat course...</p></div>`;
  try{
    const course = await App.fetchCourse(file);
    container.innerHTML = '';
    const header = document.createElement('div'); header.className='center';
    header.innerHTML = `<h2>${course.title || filenameToTitle(file)}</h2><p class="small">${course.description||''}</p>`;
    container.appendChild(header);

    const list = document.createElement('div'); list.className='module-list';
    course.modules.forEach(m => {
      const row = document.createElement('div'); row.className='module-row';
      const left = document.createElement('div'); left.innerHTML = `<strong>${m.title}</strong><div class="small">${(m.questions||[]).length} soal</div>`;
      const right = document.createElement('div');
      const startBtn = document.createElement('button'); startBtn.className='btn'; startBtn.textContent='Mulai';
      startBtn.addEventListener('click', ()=> location.hash = `#/course/${file}/module/${m.id}`);
      const hist = document.createElement('div'); hist.className='small';
      const scores = StorageService.getScores();
      const key = `${file}#${m.id}`;
      if(scores[key]){
        const s = scores[key]; hist.textContent = `Terakhir: ${s.score}/${s.total} (${Math.round((s.score/s.total)*100)}%) — ${new Date(s.timestamp).toLocaleString()}`;
      }
      right.appendChild(startBtn); right.appendChild(hist);
      row.appendChild(left); row.appendChild(right);
      list.appendChild(row);
    });
    container.appendChild(list);

    const back = document.createElement('div'); back.className='center';
    const btn = document.createElement('button'); btn.className='btn secondary'; btn.textContent='Kembali'; btn.addEventListener('click', ()=> location.hash = '#/');
    back.appendChild(btn); container.appendChild(back);
  }catch(err){
    container.innerHTML = `<div class="center"><p>Error memuat course: ${err.message}</p></div>`;
  }
}

// Render module quiz flow
async function renderModule(container, file, moduleId){
  container.innerHTML = `<div class="center"><p class="small">Memuat modul...</p></div>`;
  try{
    const course = await App.fetchCourse(file);
    const module = (course.modules||[]).find(m=>m.id===moduleId);
    if(!module) throw new Error('Module tidak ditemukan (periksa key id)');

    // Quiz state
    let idx = 0; let correctCount = 0; const total = (module.questions||[]).length;

    function renderQuestion(){
      const q = module.questions[idx];
      container.innerHTML = '';
      const title = document.createElement('div'); title.className='center';
      title.innerHTML = `<h2>${module.title}</h2><p class="small">Soal ${idx+1} dari ${total}</p>`;
      container.appendChild(title);

      const card = document.createElement('div'); card.className='question-card';
      const p = document.createElement('div'); p.innerHTML = `<strong>${q.pertanyaan}</strong>`;
      card.appendChild(p);

      const opts = document.createElement('div'); opts.className='options'; opts.setAttribute('role','list');
      let selected = null;
      q.pilihan.forEach((opt,i)=>{
        const o = document.createElement('button'); o.className='option'; o.setAttribute('role','listitem'); o.setAttribute('tabindex','0');
        o.innerHTML = `<span>${opt.option}</span>`;
        o.addEventListener('click', ()=>{
          // select
          [...opts.children].forEach(ch=> ch.setAttribute('aria-pressed','false'));
          o.setAttribute('aria-pressed','true'); selected = i;
        });
        opts.appendChild(o);
      });
      card.appendChild(opts);

      const ctr = document.createElement('div'); ctr.className='controls';
      const submitBtn = document.createElement('button'); submitBtn.className='btn'; submitBtn.textContent='Submit';
      const cancel = document.createElement('button'); cancel.className='btn secondary'; cancel.textContent='Batal';
      cancel.addEventListener('click', ()=> location.hash = `#/course/${file}`);

      submitBtn.addEventListener('click', ()=>{
        if(selected===null){ showToast('Pilih opsi terlebih dahulu'); return; }
        // evaluate
        const chosen = q.pilihan[selected];
        const correctIndex = q.pilihan.findIndex(p=>p.flag===true);
        const optionBtns = opts.children;
        // disable further clicks
        for(let b of optionBtns){ b.disabled = true; }
        if(chosen.flag){
          optionBtns[selected].classList.add('correct');
          correctCount++;
          const fb = document.createElement('div'); fb.className='small'; fb.innerHTML = `<strong>Benar ✓</strong><div>${q.pembahasan||''}</div>`;
          card.appendChild(fb);
        } else {
          optionBtns[selected].classList.add('wrong');
          if(correctIndex>=0) optionBtns[correctIndex].classList.add('correct');
          const fb = document.createElement('div'); fb.className='small'; fb.innerHTML = `<strong>Salah ✗</strong><div>Jawaban benar: ${q.pilihan[correctIndex]?.option||'—'}</div><div>${q.pembahasan||''}</div>`;
          card.appendChild(fb);
        }

        // next button
        const nextBtn = document.createElement('button'); nextBtn.className='btn';
        nextBtn.textContent = (idx+1<total) ? 'Lanjut' : 'Selesai & Lihat Skor';
        nextBtn.addEventListener('click', ()=>{
          if(idx+1<total){ idx++; renderQuestion(); } else { finish(); }
        });
        ctr.innerHTML=''; ctr.appendChild(nextBtn);
      });

      ctr.appendChild(cancel); ctr.appendChild(submitBtn);
      container.appendChild(card); container.appendChild(ctr);
    }

    function finish(){
      const percent = total===0?0:Math.round((correctCount/total)*100);
      container.innerHTML = '';
      const box = document.createElement('div'); box.className='score-box';
      box.innerHTML = `<h3>Skor Modul</h3><p class="small">${correctCount}/${total} — ${percent}%</p>`;
      container.appendChild(box);

      // save to storage
      StorageService.saveScore(file, moduleId, { score: correctCount, total, timestamp: new Date().toISOString() });

      const actions = document.createElement('div'); actions.className='center';
      const retry = document.createElement('button'); retry.className='btn'; retry.textContent='Ulangi Modul'; retry.addEventListener('click', ()=>{ idx=0; correctCount=0; renderQuestion(); });
      const back = document.createElement('button'); back.className='btn secondary'; back.textContent='Kembali ke Course'; back.addEventListener('click', ()=> location.hash = `#/course/${file}`);
      const viewHist = document.createElement('button'); viewHist.className='btn secondary'; viewHist.textContent='Lihat Riwayat'; viewHist.addEventListener('click', ()=>{
        const scores = StorageService.getScores(); const key = `${file}#${moduleId}`;
        const s = scores[key]; if(!s) { showToast('Belum ada riwayat'); return; }
        alert(`Terakhir: ${s.score}/${s.total} (${Math.round((s.score/s.total)*100)}%) — ${new Date(s.timestamp).toLocaleString()}`);
      });
      actions.appendChild(retry); actions.appendChild(back); actions.appendChild(viewHist);
      container.appendChild(actions);
    }

    // initial
    renderQuestion();

  }catch(err){
    container.innerHTML = `<div class="center"><p>Error modul: ${err.message}</p></div>`;
  }
}

// Init app
window.addEventListener('DOMContentLoaded', async ()=>{
  // register routes
  Router.register('home', async (app)=>{
    try{
      await App.loadManifest();
      renderHome(app, App.manifest);
    }catch(e){ /* already handled in loadManifest */ }
  });
  Router.register('course', (app, file)=> renderCourse(app, file));
  Router.register('module', (app, file, moduleId)=> renderModule(app, file, moduleId));

  // start
  Router.init();
});

// End of app.js
