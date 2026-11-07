/* =========================================================
   SHELL-727 — interaction layer
   ========================================================= */
(() => {
  'use strict';

  document.documentElement.classList.add('js');

  const $  = (s, r = document) => r.querySelector(s);

  /* 图案层选择：?deco=a|b|c */
  const decoParam = new URLSearchParams(location.search).get('deco');
  if (decoParam && /^(a|b|c|off)$/.test(decoParam)) document.body.dataset.deco = decoParam;

  /* 素材纹样选择：?pat=a|b|c|d|off，默认 a（贝母云纹） */
  const patParam = new URLSearchParams(location.search).get('pat');
  document.body.dataset.pat = (patParam && /^(a|b|c|d|off)$/.test(patParam)) ? patParam : 'off';
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = window.matchMedia('(pointer:fine)').matches;
  const rand  = arr => arr[Math.floor(Math.random() * arr.length)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp  = (a, b, n) => a + (b - a) * n;

  /* ---------------- data ---------------- */
  /* 留言后端地址：留空 = 只存访客浏览器本地（现状）；
     填上服务器地址（如 'http://123.60.xx.xx:8787'）= 贴上去时同步发送到服务器，仅自己可见 */
  const MESSAGE_API = '';

  const VIEW_META = {
    home:    { title: '主页',      doc: 'SHELL-727 · 主页' },
    profile: { title: '住户档案',  doc: 'SHELL-727 · 住户档案' },
    wall:    { title: '壳内壁涂鸦', doc: 'SHELL-727 · 壳内壁涂鸦' },
    quiz:    { title: '小测试',    doc: 'SHELL-727 · 小测试' },
    lost:    { title: '信号丢失',  doc: 'SHELL-727 · 信号丢失' }
  };

  /* 「逗你一笑」问答池：控制面板先出题目，点「揭晓答案」看答案；
     首页底部碎碎念则完整念完（题目 + 答案），随机切换 */
  const JOKES = [
    { q: '绿豆从五楼跳下去，变成了什么？', a: '红豆——流了好多血。' },
    { q: '火柴觉得头有点痒，伸手挠了挠，然后呢？', a: '着火了。' },
    { q: '一颗番茄过马路被车压扁了，另一颗说了句什么？', a: '「哟，番茄酱。」' },
    { q: '香蕉觉得太热，把外套脱了，结果呢？', a: '踩着自己滑倒了。' },
    { q: '北极熊把自己的毛一根一根拔光，然后说了句什么？', a: '「好冷啊。」' },
    { q: '蜗牛被乌龟撞进了医院，警察问它事情经过，它怎么说？', a: '「不记得了，一切发生得太快。」' },
    { q: '小企鹅跟妈妈确认了三遍自己真的是企鹅，然后问了句什么？', a: '「那……我怎么这么冷啊？」' },
    { q: '包子欺负了方便面，方便面带兄弟上门报仇，看见门口的丸子，说了句什么？', a: '「别以为你烫了头我就不认识你！」' },
    { q: '米的妈妈是谁？', a: '花——因为花生米。' },
    { q: '米的爸爸是谁？', a: '蝶——因为蝶恋花。' },
    { q: '麒麟到了北极，会变成什么？', a: '冰淇淋——冰（麟）淇淋。' },
    { q: '猩猩为什么最讨厌平行线？', a: '因为平行线没有相交（香蕉）。' },
    { q: '狼、老虎和狮子一起玩游戏，谁一定会被淘汰？', a: '狼——桃太郎（淘汰狼）。' },
    { q: '布和纸最怕什么？', a: '布怕一万，纸怕万一。' },
    { q: '小白为什么长得特别像他哥哥？', a: '真相（像）大白。' },
    { q: '飞机飞得那么高，为什么撞不到星星？', a: '因为星星会「闪」。' },
    { q: '一个鸡蛋去松花江游泳，回来变成了什么？', a: '松花蛋。' },
    { q: '一个鸡蛋去茶馆喝了杯茶，回来变成了什么？', a: '茶叶蛋。' },
    { q: '北极熊为什么不吃企鹅？', a: '因为一个在北极，一个在南极，根本碰不到。' },
    { q: '渔夫钓到一只鱿鱼，鱿鱼求饶，渔夫只说了四个字，鱿鱼就熟了。哪四个字？', a: '「你考（烤）你考（烤）。」' }
  ];
  const YI_JI = [
    '今日宜：早点睡',
    '今日宜：躺着',
    '今日宜：晒太阳',
    '今日宜：发呆',
    '今日宜：吃点好的'
  ];
  const PRESS_LINES = [
    '说了不要点。',
    '你点了。我记下了。',
    '没用。但你还是点了。',
    '再点也还是这句话。'
  ];
  const SHELL_REPLIES = [
    '收到。谢谢你写这些。',
    '看过了。今天也辛苦了。',
    '嗯，记下了。',
    '欢迎常来。',
    '这条我留着。'
  ];
  const WALL_QUESTIONS = [
    '说句话再走。',
    '最近在想什么？',
    '留一句今天的心情。',
    '随便写点，我会看。'
  ];

  /* ---------------- loader ---------------- */
  const loader = $('#loader');
  const loaderBar = $('#loaderBar');
  const loaderPct = $('#loaderPct');

  function boot() {
    if (reduce) { loader.classList.add('done'); startHero(); return; }
    // 调试/截图模式：直接呈现终态
    if (/[?&]shot/.test(location.search)) {
      document.documentElement.classList.add('shot-mode');
      loader.style.display = 'none';
      const t = $('#homeTitle');
      if (t) t.classList.add('ready');
      startHero();
      return;
    }
    if (/[?&]nointro/.test(location.search)) {
      loader.classList.add('done');
      setTimeout(startHero, 80);
      return;
    }
    let p = 0;
    const t0 = performance.now();
    const dur = 1250;
    const tick = now => {
      const k = clamp((now - t0) / dur, 0, 1);
      p = Math.round(k * 100);
      loaderBar.style.width = p + '%';
      loaderPct.textContent = String(p).padStart(2, '0');
      if (k < 1) requestAnimationFrame(tick);
      else {
        setTimeout(() => {
          loader.classList.add('done');
          setTimeout(startHero, 520);
        }, 240);
      }
    };
    requestAnimationFrame(tick);
  }

  /* ---------------- hero title split ---------------- */
  function splitChars(root) {
    const frag = document.createDocumentFragment();
    let i = 0;
    [...root.childNodes].forEach(node => {
      if (node.nodeType === 3) {
        [...node.textContent].forEach(ch => {
          if (!ch.trim()) { frag.appendChild(document.createTextNode(ch)); return; }
          const outer = document.createElement('span');
          outer.className = 'ch';
          const inner = document.createElement('i');
          inner.textContent = ch;
          inner.style.setProperty('--i', i++);
          outer.appendChild(inner);
          frag.appendChild(outer);
        });
      } else {
        frag.appendChild(node.cloneNode(true));
      }
    });
    root.innerHTML = '';
    root.appendChild(frag);
  }
  $$('[data-split]').forEach(splitChars);

  function startHero() {
    const title = $('#homeTitle');
    if (title && current === 'home') requestAnimationFrame(() => title.classList.add('ready'));
    observeReveals(current);
    if (current === 'home') animateCounters();
    if (current === 'profile') {
      $$('[data-meter]').forEach((m, i) => {
        setTimeout(() => { m.style.width = m.dataset.meter + '%'; }, 520 + i * 140);
      });
    }
  }

  /* ---------------- router ---------------- */
  const views = $$('[data-view]');
  const veil = $('#veil');
  let current = null;
  let busy = false;

  /* 旧地址兼容：作业寄存处已并入住户档案，控制面板已改为浮层 */
  let panelIntent = false;
  let hashFix = null;

  function normalize(hash) {
    const raw = (hash || '').replace(/^#\/?/, '').trim();
    if (!raw) return 'home';
    if (raw === 'panel') { panelIntent = true; hashFix = 'home'; return 'home'; }
    if (raw === 'works') { hashFix = 'profile'; return 'profile'; }
    return VIEW_META[raw] ? raw : 'lost';
  }

  function setActive(view) {
    $$('[data-nav]').forEach(a => a.classList.toggle('active', a.dataset.nav === view));
  }

  function resetReveals(view) {
    const scope = $(`.view[data-view="${view}"]`);
    if (!scope) return;
    $$('.reveal', scope).forEach(el => el.classList.remove('is-in'));
  }

  function revealNow(view) {
    const scope = $(`.view[data-view="${view}"]`);
    if (!scope) return;
    $$('.reveal', scope).forEach((el, i) => {
      el.style.setProperty('--d', el.dataset.delay ?? String(Math.min(i, 6) * 0.7));
      requestAnimationFrame(() => el.classList.add('is-in'));
    });
  }

  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) {
        en.target.classList.add('is-in');
        io.unobserve(en.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

  let revealIndex = 0;

  function observeReveals(view) {
    const scope = $(`.view[data-view="${view}"]`);
    if (!scope) return;
    revealIndex = 0;
    $$('.reveal', scope).forEach(el => {
      const d = el.dataset.delay ?? String(Math.min(revealIndex++, 6) * 0.7);
      el.style.setProperty('--d', d);
      if (reduce) { el.classList.add('is-in'); return; }
      const box = el.getBoundingClientRect();
      if (box.top < window.innerHeight * 0.94) {
        el.classList.add('is-in');
      } else {
        io.observe(el);
      }
    });
  }

  function afterEnter(view) {
    setActive(view);
    observeReveals(view);
    if (view === 'home') animateCounters();
    if (view === 'profile') {
      $$('[data-meter]').forEach((m, i) => {
        setTimeout(() => { m.style.width = m.dataset.meter + '%'; }, 420 + i * 140);
      });
    }
    if (view === 'lost') launchFireworks();
  }

  function go(view, updateHash = true) {
    if (!VIEW_META[view]) view = 'lost';
    if (busy) return;
    if (view === current) {
      closeMenu();
      if (updateHash && location.hash !== '#/' + view) location.hash = '#/' + view;
      return;
    }
    closeMenu();
    busy = true;
    const swap = () => {
      views.forEach(v => { v.hidden = v.dataset.view !== view; });
      current = view;
      document.body.dataset.route = view;
      document.title = VIEW_META[view].doc;
      window.scrollTo({ top: 0, behavior: 'auto' });
      resetReveals(view);
      afterEnter(view);
    };

    if (reduce || !veil) {
      swap();
      busy = false;
    } else {
      const dist = window.scrollY > window.innerHeight * 0.7 ? 1 : 0;
      if (dist) {
        veil.animate(
          [{ transform: 'translateY(-100%)' }, { transform: 'translateY(0)' }],
          { duration: 320, easing: 'cubic-bezier(.7,0,.3,1)', fill: 'forwards' }
        ).finished.then(() => {
          swap();
          veil.animate(
            [{ transform: 'translateY(0)' }, { transform: 'translateY(100%)' }],
            { duration: 480, easing: 'cubic-bezier(.7,0,.3,1)', fill: 'forwards' }
          );
          setTimeout(() => { busy = false; }, 480);
        });
      } else {
        veil.animate(
          [
            { transform: 'translateY(101%)' },
            { transform: 'translateY(0)', offset: 0.42 },
            { transform: 'translateY(0)', offset: 0.58 },
            { transform: 'translateY(-101%)' }
          ],
          { duration: 880, easing: 'cubic-bezier(.76,0,.24,1)', fill: 'forwards' }
        );
        setTimeout(swap, 380);
        setTimeout(() => { busy = false; }, 880);
      }
    }

    if (updateHash && location.hash !== '#/' + view) {
      history.pushState(null, '', '#/' + view);
    }
  }

  window.addEventListener('hashchange', () => {
    const view = normalize(location.hash);
    // 旧地址（#/panel、#/works）落到新位置后，把地址栏也改写掉
    if (hashFix) { history.replaceState(null, '', '#/' + hashFix); hashFix = null; }
    if (panelIntent) { panelIntent = false; openPanel(); }
    go(view, false);
  });

  document.addEventListener('click', e => {
    const nav = e.target.closest('[data-nav]');
    if (nav) {
      e.preventDefault();
      go(nav.dataset.nav);
      return;
    }
    const ext = e.target.closest('[data-external]');
    if (ext) {
      e.preventDefault();
      toast('外部链接还没填好。');
      return;
    }
    const fake = e.target.closest('[data-fake-link]');
    if (fake) {
      e.preventDefault();
      toast('还没挂上来。');
    }
  });

  /* ---------------- counters ---------------- */
  function animateCounters() {
    const still = document.documentElement.classList.contains('shot-mode');
    $$('[data-count]').forEach(el => {
      const to = +el.dataset.count;
      if (still) { el.textContent = to; return; }
      if (el.dataset.done === '1') return;
      el.dataset.done = '1';
      if (reduce) { el.textContent = to; return; }
      const t0 = performance.now();
      const dur = 1400;
      const step = now => {
        const k = clamp((now - t0) / dur, 0, 1);
        const eased = 1 - Math.pow(1 - k, 3);
        el.textContent = Math.round(eased * to);
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }

  /* ---------------- cursor ---------------- */
  if (fine && !reduce) {
    const dot = $('#cursorDot'), ring = $('#cursorRing'), glow = $('#cursorGlow');
    let mx = innerWidth / 2, my = innerHeight / 2;
    let rx = mx, ry = my, gx = mx, gy = my;

    window.addEventListener('mousemove', e => {
      mx = e.clientX; my = e.clientY;
      document.body.classList.add('cursor-ready');
      if (dot) dot.style.transform = `translate3d(${mx}px,${my}px,0)`;
    }, { passive: true });

    const loop = () => {
      rx = lerp(rx, mx, 0.18); ry = lerp(ry, my, 0.18);
      gx = lerp(gx, mx, 0.06); gy = lerp(gy, my, 0.06);
      if (ring) ring.style.transform = `translate3d(${rx}px,${ry}px,0)`;
      if (glow) glow.style.transform = `translate3d(${gx}px,${gy}px,0)`;
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);

    const hoverables = 'a,button,input,textarea,.note,.work-card,.pose,[data-tilt]';
    document.addEventListener('mouseover', e => {
      if (e.target.closest(hoverables)) document.body.classList.add('cursor-hover');
    });
    document.addEventListener('mouseout', e => {
      if (e.target.closest(hoverables)) document.body.classList.remove('cursor-hover');
    });
  }

  /* ---------------- magnetic buttons ---------------- */
  if (fine && !reduce) {
    $$('.magnetic').forEach(el => {
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        const dx = (e.clientX - r.left - r.width / 2) / r.width;
        const dy = (e.clientY - r.top - r.height / 2) / r.height;
        el.style.transform = `translate(${dx * 9}px, ${dy * 7}px)`;
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });
  }

  /* ---------------- tilt ---------------- */
  if (fine && !reduce) {
    $$('[data-tilt]').forEach(el => {
      const target = el.querySelector('.portrait-frame') || el;
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        const dx = (e.clientX - r.left) / r.width - 0.5;
        const dy = (e.clientY - r.top) / r.height - 0.5;
        target.style.transform = `perspective(900px) rotateY(${dx * 7}deg) rotateX(${-dy * 7}deg) translateY(-2px)`;
      });
      el.addEventListener('mouseleave', () => { target.style.transform = ''; });
    });
  }

  /* ---------------- hero parallax ---------------- */
  const stage = $('#stage3d');
  if (stage && fine && !reduce) {
    const char = stage.querySelector('.char');
    const sticker = stage.querySelector('.sticker');
    stage.addEventListener('mousemove', e => {
      const r = stage.getBoundingClientRect();
      const dx = (e.clientX - r.left) / r.width - 0.5;
      const dy = (e.clientY - r.top) / r.height - 0.5;
      if (char) {
        char.style.setProperty('--px', `${dx * 14}px`);
        char.style.setProperty('--py', `${dy * 12}px`);
      }
      if (sticker) {
        sticker.style.setProperty('--px', `${dx * -26}px`);
        sticker.style.setProperty('--py', `${dy * -18}px`);
      }
    });
    stage.addEventListener('mouseleave', () => {
      if (char) { char.style.setProperty('--px', '0px'); char.style.setProperty('--py', '0px'); }
      if (sticker) { sticker.style.setProperty('--px', '0px'); sticker.style.setProperty('--py', '0px'); }
    });
  }

  /* ---------------- dust ---------------- */
  const canvas = $('#dust');
  if (canvas && !reduce) {
    const ctx = canvas.getContext('2d');
    let w = 0, h = 0, particles = [];
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = w < 760 ? 22 : 46;
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.7 + 0.5,
        vy: -(Math.random() * 0.22 + 0.06),
        vx: (Math.random() - 0.5) * 0.12,
        a: Math.random() * 0.36 + 0.08,
        p: Math.random() * Math.PI * 2
      }));
    }
    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      particles.forEach(p => {
        p.p += 0.006;
        p.x += p.vx + Math.sin(p.p) * 0.16;
        p.y += p.vy;
        if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(122,100,158,${p.a * 0.55})`;
        ctx.fill();
      });
      requestAnimationFrame(draw);
    };
    requestAnimationFrame(draw);
  }

  /* ---------------- scroll chrome ---------------- */
  const topbar = $('#topbar');
  const bar = $('#scrollProgress i');
  function onScroll() {
    const y = window.scrollY;
    topbar.classList.toggle('stuck', y > 24);
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (bar) bar.style.width = (max > 0 ? clamp(y / max, 0, 1) * 100 : 0) + '%';
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------------- whisper ---------------- */
  const whisperText = $('#whisperText');
  const whisperYi = $('#whisperYi');
  let typeTimer = null;

  function typeText(str) {
    if (!whisperText) return;
    clearInterval(typeTimer);
    if (reduce) { whisperText.textContent = str; return; }
    whisperText.textContent = '';
    let i = 0;
    typeTimer = setInterval(() => {
      whisperText.textContent = str.slice(0, ++i);
      if (i >= str.length) clearInterval(typeTimer);
    }, 38);
  }

  /* 碎碎念：先念题目，点「揭晓答案」再公布答案 */
  let whisperJoke = null;
  const whisperReveal = $('#whisperReveal');
  function whisperNew() {
    whisperJoke = rand(JOKES);
    typeText(whisperJoke.q);
    if (whisperReveal) whisperReveal.hidden = false;
  }
  function whisperShowAnswer() {
    if (!whisperText || !whisperJoke) return;
    clearInterval(typeTimer);
    whisperText.textContent = whisperJoke.q + '　' + whisperJoke.a;
    if (whisperReveal) whisperReveal.hidden = true;
  }

  setTimeout(whisperNew, 2100);

  whisperReveal?.addEventListener('click', whisperShowAnswer);
  $('#whisperNext')?.addEventListener('click', () => {
    whisperNew();
    if (whisperYi) whisperYi.textContent = rand(YI_JI);
  });

  /* ---------------- wall ---------------- */
  const noteEl = $('#note');
  const nickEl = $('#nick');
  const noteCount = $('#noteCount');
  const board = $('#wallBoard');
  const wallReply = $('#wallReply');

  noteEl?.addEventListener('input', () => {
    noteCount.textContent = `${noteEl.value.length} / 80`;
  });

  function pad(n) { return String(n).padStart(2, '0'); }
  function today() {
    const d = new Date();
    return `${pad(d.getMonth() + 1)}.${pad(d.getDate())}`;
  }

  /* 留言：本地留存最近 20 条，刷新不丢 */
  const NOTE_KEY = 'shell727-notes';

  function loadNotes() {
    try {
      const raw = localStorage.getItem(NOTE_KEY);
      const list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch { return []; }
  }

  function saveNotes(list) {
    try { localStorage.setItem(NOTE_KEY, JSON.stringify(list.slice(0, 20))); } catch { /* 隐私模式忽略 */ }
  }

  function noteNode(n) {
    const art = document.createElement('article');
    art.className = 'note';
    art.innerHTML =
      '<span class="note-no mono" aria-hidden="true"></span>' +
      '<div class="note-main"><p class="note-text"></p></div>' +
      '<span class="note-lead" aria-hidden="true"></span>' +
      '<span class="note-meta mono"></span>';
    art.querySelector('.note-text').textContent = n.text;
    if (n.reply) {
      const r = document.createElement('p');
      r.className = 'note-reply';
      r.textContent = n.reply;
      art.querySelector('.note-main').appendChild(r);
    }
    art.querySelector('.note-meta').textContent = `${n.nick} · ${n.date}`;
    return art;
  }

  (function renderSavedNotes() {
    if (!board) return;
    loadNotes().slice().reverse().forEach(n => {
      board.insertBefore(noteNode(n), board.firstElementChild);
    });
  })();

  /* 留言不公开展示：贴上后只给留言者本人一句回复 */
  $('#postNote')?.addEventListener('click', () => {
    const text = (noteEl?.value || '').trim();
    if (!text) {
      wallReply.textContent = '写点什么再贴。';
      noteEl?.focus();
      return;
    }
    const btn = $('#postNote');
    btn.disabled = true;
    wallReply.textContent = '正在贴。';
    setTimeout(() => {
      const entry = {
        text,
        nick: (nickEl?.value || '').trim() || '路人',
        date: today(),
        reply: rand(SHELL_REPLIES)
      };
      const saved = loadNotes();
      saved.unshift(entry);
      saveNotes(saved);

      if (MESSAGE_API) {
        fetch(MESSAGE_API.replace(/\/+$/, '') + '/api/message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nick: entry.nick, text: entry.text })
        })
          .then(r => { if (!r.ok) throw new Error('bad status ' + r.status); return r.json(); })
          .then(() => { wallReply.textContent = '已收到，谢谢。'; })
          .catch(() => { wallReply.textContent = entry.reply + '（服务器暂时没连上，先存在这台电脑里）'; });
      } else {
        wallReply.textContent = entry.reply + '（留言已悄悄收下，不公开显示）';
      }

      if (noteEl) noteEl.value = '';
      if (nickEl) nickEl.value = '';
      noteCount.textContent = '0 / 80';
      btn.disabled = false;
      setTimeout(() => { wallReply.textContent = '写点什么吧。'; }, 4200);
    }, 620);
  });

  /* ---------------- quiz ---------------- */
  const QUIZ = [
    { q: '现在是几点？', opts: ['该睡了', '还早', '没注意', '不重要'] },
    { q: '周末最想做的事？', opts: ['睡到自然醒', '收拾一下房间', '出门走走', '什么都不做'] },
    { q: '有人敲门。', opts: ['先看猫眼', '直接开', '假装不在', '我家没门铃'] },
    { q: '手机剩 12% 的电，你会？', opts: ['去充电', '先玩完这局', '关掉省电', '12% 也能撑一天'] },
    { q: '朋友发来一条很长的语音。', opts: ['马上听', '转成文字', '晚点再回', '先放几天'] },
    { q: '面板上有个按钮写着“不要点”。', opts: ['不点', '点一下', '先看看说明', '已经点了'], dodge: 3 },
    { q: '理想的一天是？', opts: ['有事可做', '没事可做', '有人陪着', '一个人待着'] },
    { q: '被夸的时候，你会？', opts: ['说谢谢', '说没有啦', '笑一下', '不知道说什么'] },
    { q: '凌晨三点，你通常在？', opts: ['在睡', '在刷手机', '在工作', '在想事情'] },
    { q: '关于这个测试结果，你希望？', opts: ['准一点', '随便', '别太准', '有趣就行'] }
  ];

  const panels = {
    intro: $('[data-panel="intro"]'),
    q: $('[data-panel="q"]'),
    result: $('[data-panel="result"]')
  };
  const quizCounter = $('#quizCounter');
  const quizProgress = $('#quizProgress');
  const quizOptions = $('#quizOptions');
  const quizNum = $('#quizNum');
  const quizQ = $('#quizQ');
  const quizHint = $('#quizHint');
  const resultNum = $('#resultNum');
  const ringFg = $('#ringFg');

  let qi = 0, answers = [], dodged = false;

  function showPanel(name) {
    Object.entries(panels).forEach(([k, el]) => { if (el) el.hidden = k !== name; });
  }

  function resetQuiz() {
    qi = 0; answers = []; dodged = false;
    if (quizHint) quizHint.textContent = '';
    if (quizProgress) quizProgress.style.width = '0%';
    if (quizCounter) quizCounter.textContent = '00 / 10';
    showPanel('intro');
  }

  $('#quizStart')?.addEventListener('click', () => {
    qi = 0; answers = [];
    showPanel('q');
    renderQuestion();
  });

  function renderQuestion() {
    const item = QUIZ[qi];
    if (!item) return finishQuiz();
    if (quizNum) quizNum.textContent = 'Q' + pad(qi + 1);
    if (quizQ) quizQ.textContent = item.q;
    if (quizCounter) quizCounter.textContent = `${pad(qi + 1)} / 10`;
    if (quizProgress) quizProgress.style.width = ((qi + 1) / QUIZ.length) * 100 + '%';
    if (quizHint) quizHint.textContent = '';

    quizOptions.innerHTML = '';
    item.opts.forEach((txt, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'option';
      b.textContent = txt;
      b.style.animationDelay = i * 70 + 'ms';
      if (item.dodge === i) {
        b.addEventListener('mouseenter', () => {
          if (dodged) return;
          dodged = true;
          b.classList.add('dodge');
          if (quizHint) quizHint.textContent = '这个选项不太想被选中。';
        });
      }
      b.addEventListener('click', () => {
        answers.push(i);
        qi++;
        renderQuestion();
      });
      quizOptions.appendChild(b);
    });
  }

  function finishQuiz() {
    showPanel('result');
    if (quizCounter) quizCounter.textContent = '10 / 10';
    if (quizProgress) quizProgress.style.width = '100%';

    const sum = answers.reduce((a, b) => a + b, 0);
    const pct = Math.round(42 + (sum / 30) * 54);
    const verdict =
      pct < 55 ? '我们大概聊不到一起，但也挺好。' :
      pct < 70 ? '能聊几句。慢慢来。' :
      pct < 85 ? '挺合得来，可以一起发呆。' :
                 '你和我有点像。常来。';

    const vt = $('#resultVerdict');
    if (vt) vt.textContent = verdict;

    if (ringFg) {
      ringFg.style.width = '0%';
      requestAnimationFrame(() => {
        setTimeout(() => { ringFg.style.width = pct + '%'; }, 80);
      });
    }

    if (resultNum) {
      if (reduce) resultNum.textContent = pct;
      else {
        const t0 = performance.now();
        const run = now => {
          const k = clamp((now - t0) / 1500, 0, 1);
          const e = 1 - Math.pow(1 - k, 3);
          resultNum.textContent = Math.round(e * pct);
          if (k < 1) requestAnimationFrame(run);
        };
        requestAnimationFrame(run);
        // rAF 被节流时（后台标签、无头环境）兜底显示终值
        setTimeout(() => {
          if (resultNum.textContent === '0') resultNum.textContent = pct;
        }, 1900);
      }
    }

    const hiddenEnding = answers[5] === 3 && answers[4] === 3 && answers[9] === 3;
    if (hiddenEnding) setTimeout(() => { const e = $('#ending'); if (e) e.hidden = false; }, 1200);
  }

  $('#quizRetry')?.addEventListener('click', resetQuiz);
  $('#endingClose')?.addEventListener('click', () => { const e = $('#ending'); if (e) e.hidden = true; });

  $('#quizShare')?.addEventListener('click', async () => {
    const pct = resultNum?.textContent || '';
    const verdict = $('#resultVerdict')?.textContent || '';
    const text = `SHELL-727 小测试 ${pct}% —— ${verdict}`;
    try {
      await navigator.clipboard.writeText(text);
      toast('结果已复制。');
    } catch {
      toast('复制失败了，可以手动截图。');
    }
  });

  /* ---------------- panel sheet（控制面板浮层） ---------------- */
  const panelSheet = $('#panelSheet');
  const panelBody = $('.ps-body', panelSheet || document);
  let panelLastFocus = null;
  let panelTimer = null;

  function openPanel() {
    if (!panelSheet || !panelSheet.hidden) return;
    clearTimeout(panelTimer);
    panelLastFocus = document.activeElement;
    panelSheet.hidden = false;
    document.body.classList.add('sheet-open');
    void panelSheet.offsetWidth; // 强制回流，确保从 translateX(100%) 起步
    panelSheet.classList.add('open');
    $$('.reveal', panelSheet).forEach((el, i) => {
      el.style.setProperty('--d', String(Math.min(i, 6) * 0.7));
      setTimeout(() => el.classList.add('is-in'), 90 + i * 55);
    });
    (panelBody || panelSheet)?.focus({ preventScroll: true });
  }

  function closePanel() {
    if (!panelSheet || panelSheet.hidden) return;
    panelSheet.classList.remove('open');
    document.body.classList.remove('sheet-open');
    panelTimer = setTimeout(() => { panelSheet.hidden = true; }, reduce ? 0 : 340);
    if (panelLastFocus && panelLastFocus.focus) panelLastFocus.focus({ preventScroll: true });
    panelLastFocus = null;
  }

  $('#openPanel')?.addEventListener('click', openPanel);
  $$('[data-close-panel]').forEach(el => el.addEventListener('click', closePanel));

  // 抽屉打开时把 Tab 焦点锁在面板内
  panelBody?.addEventListener('keydown', e => {
    if (e.key !== 'Tab') return;
    const items = $$('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])', panelBody)
      .filter(el => !el.disabled && el.offsetParent !== null);
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  let pressCount = 0;
  $('#dontPress')?.addEventListener('click', () => {
    pressCount++;
    /* 按到第四次：面板合上，跳到 Surprise 页 */
    if (pressCount > 3) {
      closePanel();
      go('lost');
      return;
    }
    const btn = $('#dontPress');
    btn.classList.remove('pressed');
    void btn.offsetWidth;
    btn.classList.add('pressed');
    const note = $('#pressNote');
    const txt = $('#pressText');
    const cnt = $('#pressCount');
    const hint = $('#pressHint');
    if (hint) hint.hidden = true;
    if (note) note.hidden = false;
    if (txt) txt.textContent = PRESS_LINES[(pressCount - 1) % PRESS_LINES.length];
    if (cnt) cnt.textContent = `按下 ${pressCount} 次`;
  });

  /* 逗你一笑：出题 → 揭晓答案 → 换一条 */
  let factIndex = 0;
  function setJoke(i) {
    factIndex = i;
    const f = $('#factText'), a = $('#factAnswer'), r = $('#factReveal');
    if (!f) return;
    f.style.opacity = '0';
    f.style.transform = 'translateY(6px)';
    setTimeout(() => {
      f.textContent = JOKES[i].q;
      f.style.transition = 'opacity .45s ease, transform .45s ease';
      f.style.opacity = '1';
      f.style.transform = 'none';
    }, 180);
    if (a) { a.hidden = true; a.textContent = ''; }
    if (r) r.hidden = false;
  }

  $('#factReveal')?.addEventListener('click', () => {
    const a = $('#factAnswer'), r = $('#factReveal');
    if (!a) return;
    a.textContent = JOKES[factIndex].a;
    a.hidden = false;
    if (r) r.hidden = true;
  });

  $('#factNext')?.addEventListener('click', () => {
    let next = factIndex;
    while (JOKES.length > 1 && next === factIndex) {
      next = Math.floor(Math.random() * JOKES.length);
    }
    setJoke(next);
  });

  /* 404：随便看看 —— 随机去一个页面 */
  $('#lostRandom')?.addEventListener('click', () => {
    const pool = Object.keys(VIEW_META).filter(v => v !== 'lost' && v !== current);
    go(pool[Math.floor(Math.random() * pool.length)]);
  });

  /* ---------------- fireworks（Surprise 页：一发大型烟花） ---------------- */
  const fwCanvas = $('#fireworks');
  let fwToken = 0;

  function launchFireworks() {
    if (!fwCanvas || reduce) return;
    const ctx = fwCanvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = fwCanvas.clientWidth, h = fwCanvas.clientHeight;
    if (!w || !h) return;
    fwCanvas.width = w * dpr;
    fwCanvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const MAIN = Math.random() < 0.5 ? '#8B6FA8' : '#B8815C';
    const ACCENTS = ['#D8A94E', '#695B8E', '#C97B4A', '#E8D8F0'];
    const token = ++fwToken;
    const parts = [], rings = [];
    let frameCount = 0;
    let rocket = {
      x: w * 0.5,
      y: h * 0.94,
      vx: (Math.random() - 0.5) * 0.8,
      vy: -(h / 982) * 11.5,              /* 上升约 1.2 秒 */
      explodeY: h * (0.24 + Math.random() * 0.06),
      color: MAIN
    };

    /* 只爆炸一次：外圈 + 内圈 + 少量金闪 */
    function explode(x, y, color) {
      const shells = [
        { n: 96, sp: [2.8, 4.6], decay: 0.0052, r: 2.2 },
        { n: 64, sp: [1.2, 2.4], decay: 0.0042, r: 2.0 },
        { n: 26, sp: [0.6, 1.4], decay: 0.0034, r: 1.6, gold: true }
      ];
      shells.forEach(s => {
        for (let i = 0; i < s.n; i++) {
          const ang = (i / s.n) * Math.PI * 2 + Math.random() * 0.25;
          const sp = s.sp[0] + Math.random() * (s.sp[1] - s.sp[0]);
          parts.push({
            x, y,
            vx: Math.cos(ang) * sp,
            vy: Math.sin(ang) * sp,
            life: 1,
            decay: s.decay,
            r: s.r,
            color: s.gold ? '#D8A94E' : (Math.random() < 0.7 ? color : ACCENTS[(Math.random() * ACCENTS.length) | 0])
          });
        }
      });
      rings.push({ x, y, r: 8, alpha: 0.42 });
    }

    function frame() {
      if (token !== fwToken) return;      /* 新一轮燃放开始，旧循环退出 */
      frameCount++;
      ctx.clearRect(0, 0, w, h);

      if (rocket) {
        rocket.x += rocket.vx; rocket.y += rocket.vy; rocket.vy += 0.055;
        ctx.globalAlpha = 0.95;
        ctx.fillStyle = rocket.color;
        ctx.beginPath(); ctx.arc(rocket.x, rocket.y, 2.2, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 0.32;
        ctx.beginPath(); ctx.arc(rocket.x - rocket.vx * 2.5, rocket.y - rocket.vy * 2.5, 1.6, 0, Math.PI * 2); ctx.fill();
        if (rocket.y <= rocket.explodeY || rocket.vy >= -1) {
          explode(rocket.x, rocket.y, rocket.color);
          rocket = null;
        }
        ctx.globalAlpha = 1;
      }

      for (let i = rings.length - 1; i >= 0; i--) {
        const g = rings[i];
        g.r += 7; g.alpha -= 0.014;
        if (g.alpha <= 0) { rings.splice(i, 1); continue; }
        ctx.globalAlpha = Math.max(g.alpha, 0);
        ctx.strokeStyle = '#8B6FA8';
        ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.arc(g.x, g.y, g.r, 0, Math.PI * 2); ctx.stroke();
      }

      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.x += p.vx; p.y += p.vy;
        p.vy += 0.02;                     /* 重力调轻，飘得更久 */
        p.vx *= 0.992; p.vy *= 0.992;
        p.life -= p.decay;
        if (p.life <= 0) { parts.splice(i, 1); continue; }
        const tw = 0.72 + 0.28 * Math.sin(frameCount * 0.25 + i);   /* 轻微闪烁 */
        ctx.globalAlpha = Math.max(Math.min(p.life, 1), 0) * tw;
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      }

      ctx.globalAlpha = 1;
      if (parts.length || rings.length || rocket) requestAnimationFrame(frame);
      else ctx.clearRect(0, 0, w, h);
    }

    requestAnimationFrame(frame);
  }

  /* ---------------- menu / toast ---------------- */
  const burger = $('#burger');
  burger?.addEventListener('click', () => {
    const open = document.body.classList.toggle('menu-open');
    burger.setAttribute('aria-expanded', String(open));
  });
  function closeMenu() {
    document.body.classList.remove('menu-open');
    burger?.setAttribute('aria-expanded', 'false');
  }
  window.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closeMenu();
      closePanel();
      const en = $('#ending');
      if (en && !en.hidden) en.hidden = true;
    }
  });

  let toastTimer = null;
  function toast(msg) {
    const t = $('#toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2400);
  }

  /* ---------------- init ---------------- */
  current = null;
  const initial = normalize(location.hash);
  const viaPanelLink = panelIntent;
  panelIntent = false;
  hashFix = null;
  if (location.hash !== '#/' + initial) history.replaceState(null, '', '#/' + initial);
  views.forEach(v => { v.hidden = v.dataset.view !== initial; });
  current = initial;
  document.body.dataset.route = initial;
  document.title = VIEW_META[initial].doc;
  afterEnter(initial);
  onScroll();

  requestAnimationFrame(() => {
    boot();
    if (viaPanelLink) setTimeout(openPanel, reduce ? 200 : 1150);
  });

  // 首屏图片解码后再放开滚动动画，避免入场时抖动
  const heroImg = $('.char');
  if (heroImg && !heroImg.complete) {
    heroImg.addEventListener('load', () => heroImg.classList.add('loaded'), { once: true });
  }
})();
