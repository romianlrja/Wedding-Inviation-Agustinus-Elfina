/* ============================================================
   Undangan Pernikahan - Agustinus & Elfina
   Semua yang perlu kamu ubah ada di CONFIG di bawah ini.
   ============================================================ */
const CONFIG = {
  // Waktu acara (format ISO, +07:00 = WIB). Dipakai countdown & tombol kalender.
  eventStart: '2026-12-29T10:00:00+07:00',
  eventEnd:   '2026-12-29T16:00:00+07:00', // perkiraan, jam selesai acara adat belum ditentukan
  eventTitle: 'Pemberkatan & Acara Adat Agustinus & Elfina',
  eventPlace: 'HKBP Sionggang Tengah, Desa Sionggang Tengah, Kecamatan Lumban Julu',
  mapsUrl:    'https://maps.app.goo.gl/D5uQGhDPQnQTqAgn6',

  wishesPerPage: 5,
  cooldownSeconds: 30,       // jeda antar kirim ucapan (anti-spam)

  // Isi dari Firebase Console > Project settings > Your apps (Web).
  // Kalau apiKey & projectId masih kosong, ucapan disimpan di browser saja (mode demo).
  firebase: {
    apiKey: 'AIzaSyAXLhko93WBtM_r3nioknf8A9B9eKb-jFU',
    authDomain: 'nikahanabang-3df2c.firebaseapp.com',
    projectId: 'nikahanabang-3df2c',
    storageBucket: 'nikahanabang-3df2c.firebasestorage.app',
    messagingSenderId: '1001169968265',
    appId: '1:1001169968265:web:6fbf386da920e44a817a58',
    measurementId: 'G-261KBG9HD0'
  },
  firebaseVersion: '10.12.2',
  collection: 'wishes'
};

/* ---------- Helper ---------- */
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const safe = fn => { try { return fn(); } catch (e) { return null; } };

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove('show'), 2800);
}

/* ============================================================
   1. Nama tamu dari link  (?to=Nama+Tamu)
   ============================================================ */
(function guest() {
  const to = new URLSearchParams(location.search).get('to');
  if (to) $('#guestName').textContent = to.trim().slice(0, 60);
})();

/* ============================================================
   2. Daun jatuh (sedikit saja biar ringan)
   ============================================================ */
(function leaves() {
  const lowEnd = (navigator.hardwareConcurrency || 4) <= 2;
  const count = lowEnd ? 4 : 8;
  $$('.leaf-layer').forEach(layer => {
    for (let i = 0; i < count; i++) {
      const l = document.createElement('i');
      l.className = 'leaf';
      l.style.setProperty('--x', Math.random() * 100 + '%');
      l.style.setProperty('--s', 8 + Math.random() * 8 + 'px');
      l.style.setProperty('--d', 9 + Math.random() * 8 + 's');
      l.style.setProperty('--delay', -Math.random() * 12 + 's');
      layer.appendChild(l);
    }
  });
})();

/* ============================================================
   3. Buka undangan + musik
   ============================================================ */
const cover = $('#cover');
const bgm = $('#bgm');
const musicBtn = $('#musicBtn');

function setPlaying(on) { musicBtn.classList.toggle('playing', on); }

// Putar lagu dengan fade-in halus. Browser hanya mengizinkan suara setelah tamu
// menyentuh halaman, jadi lagu dimulai saat tombol "Buka Undangan" ditekan.
function playMusic() {
  bgm.volume = 0;
  const p = safe(() => bgm.play());
  if (!p || !p.then) return Promise.resolve(false);
  return p.then(() => {
    setPlaying(true);
    let v = 0;
    const fade = setInterval(() => {
      v = Math.min(1, v + 0.05);
      bgm.volume = v;
      if (v >= 1) clearInterval(fade);
    }, 120);
    return true;
  }).catch(() => { setPlaying(false); return false; });
}

// Cadangan: kalau autoplay sempat diblokir, mulai di sentuhan/scroll pertama
function armFallback() {
  const go = () => {
    ['touchstart', 'click', 'keydown'].forEach(ev => document.removeEventListener(ev, go));
    if (bgm.paused && !bgm.dataset.manual) playMusic();
  };
  ['touchstart', 'click', 'keydown'].forEach(ev => document.addEventListener(ev, go, { once: true, passive: true }));
}

$('#openBtn').addEventListener('click', () => {
  cover.classList.add('open');
  document.body.classList.remove('locked');
  window.scrollTo(0, 0);
  musicBtn.classList.remove('hidden');
  const nav = $('#nav'); if (nav) nav.classList.remove('hidden');
  playMusic().then(ok => { if (!ok) armFallback(); });
  setTimeout(() => { cover.style.display = 'none'; }, 1700);
});

musicBtn.addEventListener('click', () => {
  bgm.dataset.manual = '1';          // tamu mengatur sendiri, jangan dipaksa putar lagi
  if (bgm.paused) { bgm.volume = 1; bgm.play().then(() => setPlaying(true)).catch(() => {}); }
  else { bgm.pause(); setPlaying(false); }
});

// hemat baterai: jeda musik & animasi saat tab disembunyikan
document.addEventListener('visibilitychange', () => {
  document.body.classList.toggle('paused', document.hidden);
  if (document.hidden && !bgm.paused) { bgm.pause(); bgm.dataset.auto = '1'; setPlaying(false); }
  else if (!document.hidden && bgm.dataset.auto) { bgm.play().then(() => setPlaying(true)).catch(() => {}); delete bgm.dataset.auto; }
});

/* ============================================================
   4. Animasi muncul saat scroll
   ============================================================ */
(function reveal() {
  const items = $$('.anim');
  items.forEach(el => el.style.setProperty('--d', (el.dataset.delay || 0) + 'ms'));
  if (!('IntersectionObserver' in window)) { items.forEach(el => el.classList.add('in')); return; }
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  items.forEach(el => io.observe(el));
})();

/* ============================================================
   5. Countdown
   ============================================================ */
(function countdown() {
  const target = new Date(CONFIG.eventStart).getTime();
  const els = { d: $('#cdD'), h: $('#cdH'), m: $('#cdM'), s: $('#cdS') };
  const note = $('#cdNote');
  const pad = n => String(n).padStart(2, '0');

  function tick() {
    const diff = target - Date.now();
    if (diff <= 0) {
      Object.values(els).forEach(e => e.textContent = '00');
      note.textContent = Date.now() < new Date(CONFIG.eventEnd).getTime()
        ? 'Hari bahagia kami sedang berlangsung ♥'
        : 'Terima kasih atas doa dan kehadirannya ♥';
      return false;
    }
    els.d.textContent = pad(Math.floor(diff / 864e5));
    els.h.textContent = pad(Math.floor(diff % 864e5 / 36e5));
    els.m.textContent = pad(Math.floor(diff % 36e5 / 6e4));
    els.s.textContent = pad(Math.floor(diff % 6e4 / 1e3));
    return true;
  }
  if (tick()) {
    const id = setInterval(() => { if (!tick()) clearInterval(id); }, 1000);
  }
})();

/* ============================================================
   6. Tombol kalender & peta
   ============================================================ */
(function eventLinks() {
  const fmt = iso => new Date(iso).toISOString().replace(/[-:]|\.\d{3}/g, '');
  const url = 'https://calendar.google.com/calendar/render?action=TEMPLATE'
    + '&text=' + encodeURIComponent(CONFIG.eventTitle)
    + '&dates=' + fmt(CONFIG.eventStart) + '/' + fmt(CONFIG.eventEnd)
    + '&location=' + encodeURIComponent(CONFIG.eventPlace);
  $('#calBtn').href = url;
  $('#mapBtn').href = CONFIG.mapsUrl;
})();

/* ============================================================
   7. Galeri + lightbox
   ============================================================ */
(function gallery() {
  const imgs = $$('#galleryGrid img');
  const lb = $('#lightbox'), lbImg = $('#lbImg');
  let idx = 0;
  const show = i => {
    idx = (i + imgs.length) % imgs.length;
    lbImg.src = imgs[idx].src;
    lbImg.alt = imgs[idx].alt;
  };
  const close = () => { lb.hidden = true; };
  imgs.forEach((im, i) => im.addEventListener('click', () => { show(i); lb.hidden = false; }));
  $('.lb-close', lb).addEventListener('click', close);
  $('.prev', lb).addEventListener('click', e => { e.stopPropagation(); show(idx - 1); });
  $('.next', lb).addEventListener('click', e => { e.stopPropagation(); show(idx + 1); });
  lb.addEventListener('click', e => { if (e.target === lb) close(); });
  document.addEventListener('keydown', e => {
    if (lb.hidden) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') show(idx - 1);
    if (e.key === 'ArrowRight') show(idx + 1);
  });
  // geser (swipe) di HP
  let x0 = null;
  lb.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', e => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1));
    x0 = null;
  });
})();

/* ============================================================
   8. Hadiah: buka/tutup + salin nomor rekening
   ============================================================ */
(function gift() {
  const btn = $('#giftToggle'), body = $('#giftBody');
  if (btn && body) btn.addEventListener('click', () => {
    const open = body.classList.toggle('open');
    btn.setAttribute('aria-expanded', open);
  });
  $$('.copy').forEach(b => b.addEventListener('click', async () => {
    const text = $('#' + b.dataset.copyTarget).textContent.trim();
    try { await navigator.clipboard.writeText(text); }
    catch (e) {
      const ta = document.createElement('textarea');
      ta.value = text; document.body.appendChild(ta); ta.select();
      safe(() => document.execCommand('copy')); ta.remove();
    }
    const old = b.textContent;
    b.textContent = 'Tersalin ✓';
    toast('Nomor rekening berhasil disalin');
    setTimeout(() => { b.textContent = old; }, 1800);
  }));
})();

/* ============================================================
   8b. Mini kalender bulan acara
   ============================================================ */
(function miniCalendar() {
  const box = $('#miniCal');
  if (!box) return;
  const d = new Date(CONFIG.eventStart);
  // pakai zona WIB agar tanggal tidak bergeser di perangkat luar negeri
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(d);
  const get = t => +parts.find(p => p.type === t).value;
  const y = get('year'), m = get('month') - 1, day = get('day');
  const first = (new Date(Date.UTC(y, m, 1)).getUTCDay() + 6) % 7;   // Senin = 0
  const total = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  const frag = document.createDocumentFragment();
  ['Sen','Sel','Rab','Kam','Jum','Sab','Min'].forEach(n => {
    const s = document.createElement('span'); s.className = 'dow'; s.textContent = n; frag.appendChild(s);
  });
  for (let i = 0; i < first; i++) frag.appendChild(document.createElement('span'));
  for (let i = 1; i <= total; i++) {
    const s = document.createElement('span'); s.textContent = i;
    if (i === day) s.className = 'hit';
    frag.appendChild(s);
  }
  box.appendChild(frag);
})();

/* ============================================================
   8c. Navigasi bawah: tandai bagian yang sedang dilihat
   ============================================================ */
(function nav() {
  const links = $$('#nav a');
  const map = new Map(links.map(a => [a.getAttribute('href').slice(1), a]));
  if (!('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      links.forEach(a => a.classList.remove('active'));
      const a = map.get(e.target.id); if (a) a.classList.add('active');
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  map.forEach((_, id) => { const el = document.getElementById(id); if (el) io.observe(el); });
})();

/* ============================================================
   9. Ucapan & RSVP  (Firebase Firestore / fallback lokal)
   ============================================================ */
async function createStore() {
  const c = CONFIG.firebase;
  if (c.apiKey && c.projectId) {
    try {
      // Firebase dimuat HANYA kalau dikonfigurasi, dan baru setelah halaman siap -> ringan
      const base = `https://www.gstatic.com/firebasejs/${CONFIG.firebaseVersion}/`;
      const [app, fs] = await Promise.all([
        import(base + 'firebase-app.js'),
        import(base + 'firebase-firestore.js')
      ]);
      const firebaseApp = app.initializeApp(c);
      // Analytics opsional: jangan sampai kegagalan Analytics mematikan Firestore.
      import(base + 'firebase-analytics.js').then(async analytics => {
        if (await analytics.isSupported()) analytics.getAnalytics(firebaseApp);
      }).catch(err => console.warn('Firebase Analytics tidak tersedia', err));
      const db = fs.getFirestore(firebaseApp);
      const col = fs.collection(db, CONFIG.collection);
      return {
        mode: 'firebase',
        subscribe(cb) {
          const q = fs.query(col, fs.orderBy('createdAt', 'desc'), fs.limit(100));
          return fs.onSnapshot(q, snap => cb(snap.docs.map(d => {
            const x = d.data();
            return { ...x, time: x.createdAt && x.createdAt.toMillis ? x.createdAt.toMillis() : Date.now() };
          })), err => { console.error(err); toast('Gagal memuat ucapan'); });
        },
        add: d => fs.addDoc(col, { ...d, createdAt: fs.serverTimestamp() })
      };
    } catch (e) { console.error('Firebase gagal dimuat, pakai mode lokal', e); }
  }
  // ---- Mode demo (tanpa Firebase) ----
  const KEY = 'undangan-wishes-demo';
  const seed = [];   // kosong: ucapan baru muncul setelah ada tamu yang mengirim
  const load = () => safe(() => JSON.parse(localStorage.getItem(KEY))) || seed;
  const subs = new Set();
  return {
    mode: 'local',
    subscribe(cb) { subs.add(cb); cb(load()); return () => subs.delete(cb); },
    async add(d) {
      const list = load(); list.unshift({ ...d, time: Date.now() });
      safe(() => localStorage.setItem(KEY, JSON.stringify(list.slice(0, 100))));
      subs.forEach(cb => cb(list));
    }
  };
}

(function wishes() {
  const form = $('#wishForm');
  const fName = $('#fName'), fAtt = $('#fAtt'), fGuests = $('#fGuests'), fMsg = $('#fMsg');
  const listEl = $('#wishList'), pager = $('#pager'), sendBtn = $('#sendBtn');
  const maxMessageWords = Number(fMsg.dataset.maxWords);
  const countWords = text => text.trim() ? text.trim().split(/\s+/).length : 0;
  let all = [], page = 1, freshKey = null, store = null;

  /* counter & validasi */
  fName.addEventListener('input', () => { $('#cName').textContent = fName.value.length; fName.classList.remove('invalid'); $('#eName').textContent = ''; });
  fMsg.addEventListener('input', () => {
    const words = fMsg.value.match(/\S+/g) || [];
    if (words.length > maxMessageWords) fMsg.value = words.slice(0, maxMessageWords).join(' ');
    $('#cMsg').textContent = countWords(fMsg.value);
    fMsg.classList.remove('invalid');
    $('#eMsg').textContent = '';
  });
  fAtt.addEventListener('change', () => {
    const no = fAtt.value === 'Tidak Hadir';
    $('#guestsWrap').classList.toggle('off', no);
    fGuests.disabled = no;
  });

  // ingat nama terakhir
  const saved = safe(() => localStorage.getItem('undangan-name'));
  if (saved) { fName.value = saved; $('#cName').textContent = saved.length; }

  function validate() {
    let ok = true;
    const n = fName.value.trim(), m = fMsg.value.trim();
    if (n.length < 3 || n.length > 20) { fName.classList.add('invalid'); $('#eName').textContent = 'Nama harus 3-20 karakter'; ok = false; }
    if (m.length < 5 || countWords(m) > maxMessageWords) { fMsg.classList.add('invalid'); $('#eMsg').textContent = `Pesan harus minimal 5 karakter dan maksimal ${maxMessageWords} kata`; ok = false; }
    return ok;
  }

  const fmtDate = ms => {
    const d = new Date(ms);
    const mon = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'][d.getMonth()];
    const p = n => String(n).padStart(2, '0');
    return `${d.getDate()} ${mon} ${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
  };

  function render() {
    const per = CONFIG.wishesPerPage;
    const pages = Math.max(1, Math.ceil(all.length / per));
    page = Math.min(page, pages);
    listEl.replaceChildren();
    if (!all.length) {
      const p = document.createElement('p'); p.className = 'empty';
      p.textContent = 'Jadilah yang pertama memberi ucapan ♥';
      listEl.appendChild(p);
    }
    all.slice((page - 1) * per, page * per).forEach((w, i) => {
      const el = document.createElement('div');
      el.className = 'wish' + (freshKey === 'pending' && page === 1 && i === 0 ? ' fresh' : '');
      const av = document.createElement('div'); av.className = 'avatar'; av.textContent = (w.name || '?').charAt(0).toUpperCase();
      const body = document.createElement('div'); body.className = 'wish-body';
      const head = document.createElement('div'); head.className = 'wish-head';
      const b = document.createElement('b'); b.textContent = w.name;
      const badge = document.createElement('span'); badge.className = 'badge' + (w.attendance === 'Hadir' ? '' : ' no'); badge.textContent = w.attendance;
      head.append(b, badge);
      const t = document.createElement('time'); t.textContent = fmtDate(w.time);
      const msg = document.createElement('p'); msg.textContent = w.message;   // textContent = aman dari XSS
      body.append(head, t, msg);
      el.append(av, body);
      listEl.appendChild(el);
    });

    pager.replaceChildren();
    if (pages > 1) {
      for (let i = 1; i <= pages; i++) {
        const b = document.createElement('button');
        b.type = 'button'; b.textContent = i;
        if (i === page) b.className = 'active';
        b.addEventListener('click', () => { page = i; render(); listEl.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
        pager.appendChild(b);
      }
    }
  }

  /* kirim */
  form.addEventListener('submit', async e => {
    e.preventDefault();
    if ($('#fWeb').value) return;                       // bot
    if (!validate()) return;
    const last = +safe(() => localStorage.getItem('undangan-last')) || 0;
    const wait = CONFIG.cooldownSeconds * 1000 - (Date.now() - last);
    if (wait > 0) { toast(`Tunggu ${Math.ceil(wait / 1000)} detik sebelum mengirim lagi`); return; }
    if (!store) { toast('Sebentar, sedang menyiapkan...'); return; }

    const attendance = fAtt.value;
    const data = {
      name: fName.value.trim(),
      attendance,
      guests: attendance === 'Hadir' ? +fGuests.value : 0,
      message: fMsg.value.trim()
    };
    sendBtn.disabled = true; sendBtn.textContent = 'Mengirim...';
    try {
      await store.add(data);
      safe(() => { localStorage.setItem('undangan-last', Date.now()); localStorage.setItem('undangan-name', data.name); });
      freshKey = 'pending';
      page = 1;
      fMsg.value = ''; $('#cMsg').textContent = '0';
      toast('Terima kasih! Ucapanmu sudah terkirim ♥');
      // tandai item terbaru agar menyala sebentar
      render();
      setTimeout(() => { const first = $('.wish', listEl); if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 400);
      setTimeout(() => { freshKey = null; }, 4000);
    } catch (err) {
      console.error(err);
      toast('Gagal mengirim, coba lagi ya');
    } finally {
      sendBtn.disabled = false; sendBtn.textContent = 'Kirim';
    }
  });

  /* mulai: tunggu halaman idle supaya Firebase tidak memperlambat loading awal */
  const start = async () => {
    store = await createStore();
    store.subscribe(list => { all = list; render(); });
  };
  render();
  ('requestIdleCallback' in window) ? requestIdleCallback(start, { timeout: 2500 }) : setTimeout(start, 800);
})();