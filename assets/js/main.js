/* Davi Barcia — portfolio */
(() => {
  'use strict';

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

  let vw = innerWidth, vh = innerHeight;
  addEventListener('resize', () => { vw = innerWidth; vh = innerHeight; }, { passive: true });

  /* ------------------------------------------------------------------
     Split text into chars
  ------------------------------------------------------------------ */
  $$('.split').forEach(el => {
    const text = el.textContent;
    el.textContent = '';
    [...text].forEach((ch, i) => {
      const s = document.createElement('span');
      s.className = 'char';
      s.style.setProperty('--ci', i);
      s.textContent = ch === ' ' ? ' ' : ch;
      el.appendChild(s);
    });
  });
  // índice contínuo entre linhas do título
  [$('.contact__title')].forEach(t => {
    if (!t) return;
    $$('.char', t).forEach((c, i) => c.style.setProperty('--ci', i));
  });

  /* ------------------------------------------------------------------
     Loader
  ------------------------------------------------------------------ */
  const loader = $('.loader');
  const countEl = $('[data-count]');
  const bar = $('.loader__bar i');
  let loaded = false;
  addEventListener('load', () => { loaded = true; });
  setTimeout(() => { loaded = true; }, 3500); // não segura a página para sempre

  const startLoader = () => {
    if (reduce) return finishLoader();
    // baseado em tempo (não em frames): ~1,3s se a página já carregou
    const t0 = performance.now(), MIN = 1300;
    let p = 0;
    const tick = () => {
      const k = clamp((performance.now() - t0) / MIN, 0, 1);
      const target = (1 - Math.pow(1 - k, 3)) * (loaded ? 100 : 88);
      p = Math.max(p, target);
      countEl.textContent = Math.round(p);
      bar.style.setProperty('--p', p / 100);
      if (p >= 100) return setTimeout(finishLoader, 200);
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    setTimeout(finishLoader, 4200); // rede para rAF pausado
  };

  let finished = false;
  function finishLoader() {
    if (finished) return;
    finished = true;
    loader.classList.add('is-done');
    document.body.classList.remove('is-loading');
    setTimeout(() => document.body.classList.add('is-ready'), 20);
    setTimeout(() => loader.remove(), 1300);
  }
  startLoader();

  /* ------------------------------------------------------------------
     Word rotator
  ------------------------------------------------------------------ */
  const rot = $('.rotator__word');
  if (rot && !reduce) {
    const words = ['fullstack', 'front-end', 'dados', 'IA aplicada'];
    let wi = 0;
    setInterval(() => {
      rot.classList.remove('in');
      rot.classList.add('out');
      setTimeout(() => {
        wi = (wi + 1) % words.length;
        rot.textContent = words[wi];
        rot.classList.remove('out');
        rot.classList.add('in');
      }, 480);
    }, 2600);
  }

  /* ------------------------------------------------------------------
     Hero canvas — campo de pontos que reage ao cursor
  ------------------------------------------------------------------ */
  const canvas = $('.hero__canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    const hero = $('.hero');
    let W, H, dpr, pts = [], heroVisible = true, t0 = performance.now();
    const mouse = { x: -9999, y: -9999, tx: -9999, ty: -9999, active: false };

    const build = () => {
      dpr = Math.min(devicePixelRatio || 1, 2);
      W = hero.offsetWidth; H = hero.offsetHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const gap = W < 600 ? 26 : 34;
      pts = [];
      for (let y = gap / 2; y < H; y += gap)
        for (let x = gap / 2; x < W; x += gap) pts.push({ x, y });
      if (reduce) draw(0);
    };

    const draw = (time) => {
      ctx.clearRect(0, 0, W, H);
      const t = time / 1000;
      // sem mouse (touch), um "cursor virtual" passeia pela tela
      if (!mouse.active) {
        mouse.tx = W * (.55 + .3 * Math.sin(t * .35));
        mouse.ty = H * (.45 + .28 * Math.sin(t * .52 + 1.3));
      }
      mouse.x = lerp(mouse.x < -999 ? mouse.tx : mouse.x, mouse.tx, .08);
      mouse.y = lerp(mouse.y < -999 ? mouse.ty : mouse.y, mouse.ty, .08);
      const R = Math.min(220, W * .28);
      for (const p of pts) {
        const wave = Math.sin(p.x * .012 + t * 1.2) * Math.cos(p.y * .014 + t * .8);
        let dx = p.x - mouse.x, dy = p.y - mouse.y;
        const d = Math.hypot(dx, dy);
        let ox = 0, oy = wave * 3, k = 0;
        if (d < R) {
          k = 1 - d / R;
          const f = k * k * 26;
          ox += (dx / (d || 1)) * f;
          oy += (dy / (d || 1)) * f;
        }
        const a = .12 + k * .75 + (wave + 1) * .04;
        const r = .9 + k * 1.9;
        ctx.fillStyle = k > .04 ? `rgba(120,142,255,${a})` : `rgba(236,232,223,${a})`;
        ctx.beginPath();
        ctx.arc(p.x + ox, p.y + oy, r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const loop = (time) => {
      if (heroVisible) draw(time - t0);
      requestAnimationFrame(loop);
    };

    build();
    addEventListener('resize', build, { passive: true });
    if (!reduce) {
      new IntersectionObserver(([e]) => { heroVisible = e.isIntersecting; }).observe(hero);
      if (finePointer) {
        hero.addEventListener('pointermove', e => {
          const r = hero.getBoundingClientRect();
          mouse.tx = e.clientX - r.left; mouse.ty = e.clientY - r.top; mouse.active = true;
        });
        hero.addEventListener('pointerleave', () => { mouse.active = false; });
      }
      requestAnimationFrame(loop);
    }
  }

  /* ------------------------------------------------------------------
     Hero — o nome fica na frente da foto e o cursor apaga o nome em
     manchas orgânicas que se fecham sozinhas (referência: lando.com)
  ------------------------------------------------------------------ */
  const heroEl = $('.hero');
  const me = $('.hero__me');
  const nameCv = $('.hero__name');
  if (heroEl && me && nameCv) {
    const ctx = nameCv.getContext('2d');
    const LINES = ['Davi', 'Barcia'];
    const LIFE = 1100;                       // ms até uma mancha fechar
    const FONT = px => `700 ${px}px "Bricolage Grotesque", system-ui, sans-serif`;
    let W = 0, H = 0, F = 0, layout = null, trail = [], last = null, cursor = null;
    let fontOk = false, readyAt = 0, visible = true, ghost = null, lastTouch = 0;

    const measure = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      W = heroEl.offsetWidth; H = heroEl.offsetHeight;
      nameCv.width = W * dpr; nameCv.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // posição da foto (offset* ignora o translate da animação de entrada)
      const sw = me.offsetWidth, sh = me.offsetHeight, sx = me.offsetLeft, sy = me.offsetTop;
      F = Math.min(sh * .27, W * .3);
      ctx.font = FONT(F);
      const track = -.045 * F;
      const lines = LINES.map(txt => {
        const chars = [...txt].map(ch => ({ ch, w: ctx.measureText(ch).width + track }));
        return { chars, width: chars.reduce((a, c) => a + c.w, 0) - track };
      });
      const cy = sy + sh * .43;                // altura do rosto na foto
      const blockH = F * (.72 + .86);
      const b1 = cy - blockH / 2 + .72 * F;
      layout = { cx: sx + sw / 2, cy, baselines: [b1, b1 + .86 * F], lines, maxW: Math.max(...lines.map(l => l.width)) };
    };

    const R = () => Math.max(56, F * .6);
    const push = (x, y, now) => trail.push({ x, y, t: now, r: R() * (.8 + Math.random() * .4), seed: Math.random() * 6.28 });
    const add = (x, y) => {
      const now = performance.now();
      if (last) {
        const dx = x - last.x, dy = y - last.y, d = Math.hypot(dx, dy);
        const n = Math.min(14, Math.floor(d / (R() * .35)));
        for (let i = 1; i <= n; i++) push(last.x + dx * i / (n + 1), last.y + dy * i / (n + 1), now);
      }
      push(x, y, now);
      last = { x, y };
      if (trail.length > 160) trail.splice(0, trail.length - 160);
    };

    const blob = (x, y, r, seed, now) => {
      const n = 24, tt = now * .0022;
      ctx.beginPath();
      for (let i = 0; i <= n; i++) {
        const a = i / n * Math.PI * 2;
        const rr = r * (1 + .17 * Math.sin(3 * a + seed + tt) + .09 * Math.sin(5 * a - seed * 2 - tt * 1.3));
        const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr;
        i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
    };

    const ease = t => 1 - Math.pow(1 - t, 4);
    const draw = now => {
      ctx.clearRect(0, 0, W, H);
      if (!layout || !fontOk) return;
      const t = readyAt ? now - readyAt : -1;

      // 1) o nome, letra por letra (sobe na entrada)
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#ece8df';
      ctx.font = FONT(F);
      let ci = 0;
      layout.lines.forEach((ln, li) => {
        const base = layout.baselines[li];
        let x = layout.cx - ln.width / 2;
        ctx.save();
        ctx.beginPath(); ctx.rect(0, base - F * .98, W, F * 1.2); ctx.clip();
        for (const c of ln.chars) {
          const p = reduce ? 1 : t < 0 ? 0 : ease(clamp((t - ci * 55 - 150) / 1200, 0, 1));
          ctx.fillText(c.ch, x, base + (1 - p) * F * 1.05);
          x += c.w; ci++;
        }
        ctx.restore();
      });

      // 2) apaga o nome onde o cursor passou — revela a foto atrás
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = '#000';
      trail = trail.filter(b => now - b.t < LIFE);
      for (const b of trail) {
        const age = (now - b.t) / LIFE;
        blob(b.x, b.y, b.r * (1 - age * age), b.seed, now);
      }
      if (cursor) blob(cursor.x, cursor.y, R() * 1.05, 1.7, now);
      ctx.globalCompositeOperation = 'source-over';
    };

    // "cursor fantasma": passa pelo nome uma vez na entrada (e no celular quando parado)
    const startGhost = now => { ghost = { t0: now, dur: 1700 }; last = null; };
    const stepGhost = now => {
      if (!ghost || !layout) return;
      const k = (now - ghost.t0) / ghost.dur;
      if (k >= 1) { ghost = null; last = null; return; }
      const e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      const half = layout.maxW * .55;
      add(layout.cx - half + e * half * 2, layout.cy + Math.sin(e * Math.PI * 2.2) * F * .55);
    };

    const loop = now => {
      if (visible) {
        if (!readyAt && document.body.classList.contains('is-ready')) {
          readyAt = now;
          if (!reduce) setTimeout(() => startGhost(performance.now()), 1500);
        }
        if (!finePointer && !reduce && readyAt && !ghost && now - lastTouch > 5000 && now - readyAt > 6000 && Math.random() < .004) startGhost(now);
        stepGhost(now);
        draw(now);
      }
      requestAnimationFrame(loop);
    };

    const local = (cx, cy) => { const r = heroEl.getBoundingClientRect(); return { x: cx - r.left, y: cy - r.top }; };
    heroEl.addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse') return;
      cursor = local(e.clientX, e.clientY);
      add(cursor.x, cursor.y);
    });
    heroEl.addEventListener('pointerleave', () => { cursor = null; last = null; });
    const onTouch = e => {
      const tt = e.touches[0]; if (!tt) return;
      const p = local(tt.clientX, tt.clientY);
      add(p.x, p.y); lastTouch = performance.now();
    };
    heroEl.addEventListener('touchstart', e => { last = null; onTouch(e); }, { passive: true });
    heroEl.addEventListener('touchmove', onTouch, { passive: true });
    heroEl.addEventListener('touchend', () => { last = null; }, { passive: true });

    new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(heroEl);
    addEventListener('resize', measure, { passive: true });
    if (!me.complete) me.addEventListener('load', measure);
    const fontReady = () => { fontOk = true; measure(); };
    (document.fonts ? document.fonts.load(FONT(100)) : Promise.resolve()).then(fontReady, fontReady);
    setTimeout(() => { if (!fontOk) fontReady(); }, 2500);
    measure();
    requestAnimationFrame(loop);
  }

  /* ------------------------------------------------------------------
     Cursor + magnetic
  ------------------------------------------------------------------ */
  if (finePointer && !reduce) {
    document.body.classList.add('has-cursor');
    const cur = $('.cursor'), dot = $('.cursor-dot'), label = $('.cursor__label');
    let mx = vw / 2, my = vh / 2, cx = mx, cy = my;
    addEventListener('pointermove', e => {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = `translate(${mx}px, ${my}px)`;
    }, { passive: true });
    const follow = () => {
      cx = lerp(cx, mx, .18); cy = lerp(cy, my, .18);
      cur.style.transform = `translate(${cx}px, ${cy}px)`;
      requestAnimationFrame(follow);
    };
    follow();
    document.addEventListener('pointerleave', () => cur.classList.add('is-hidden'));
    document.addEventListener('pointerenter', () => cur.classList.remove('is-hidden'));

    $$('a, button, [data-cursor]').forEach(el => {
      el.addEventListener('pointerenter', () => {
        const l = el.dataset.cursor;
        if (l) { label.textContent = l; cur.classList.add('is-label'); }
        else cur.classList.add('is-hover');
      });
      el.addEventListener('pointerleave', () => cur.classList.remove('is-hover', 'is-label'));
    });

    $$('[data-magnetic]').forEach(el => {
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - (r.left + r.width / 2);
        const y = e.clientY - (r.top + r.height / 2);
        el.style.transition = 'transform .2s ease-out';
        el.style.transform = `translate(${x * .28}px, ${y * .38}px)`;
      });
      el.addEventListener('pointerleave', () => {
        el.style.transition = 'transform .7s cubic-bezier(.22,1,.36,1)';
        el.style.transform = '';
      });
    });
  }

  /* ------------------------------------------------------------------
     Nav, menu, progress
  ------------------------------------------------------------------ */
  const nav = $('.nav');
  const burger = $('.nav__burger');
  const menu = $('#menu');
  const setMenu = (open) => {
    document.body.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    menu.setAttribute('aria-hidden', !open);
    document.body.style.overflow = open ? 'hidden' : '';
  };
  burger.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
  $$('a', menu).forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

  const navLinks = $$('.nav__links a');
  // observa todas as seções: nas que não têm link (topo, projetos, contato) nenhum fica ativo
  const sections = $$('main > section[id]');
  const so = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const id = e.target.id;
      navLinks.forEach(a => a.classList.toggle('is-active',
        a.getAttribute('href') === '#' + id || (a.dataset.sections || '').split(' ').includes(id)));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach(s => s && so.observe(s));

  /* ------------------------------------------------------------------
     Reveal on view
  ------------------------------------------------------------------ */
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      io.unobserve(e.target);
    });
  }, { threshold: .15, rootMargin: '0px 0px -6% 0px' });
  $$('.reveal, .reveal-lines, .pcard, .contact').forEach(el => io.observe(el));

  // stagger para grupos
  [['.about__facts .fact', .08], ['.vizzo__features .feat', .1], ['.more__grid .pcard', .1], ['.skills__col', .08]].forEach(([sel, step]) => {
    $$(sel).forEach((el, i) => el.style.setProperty('--d', `${i * step}s`));
  });

  // GymFlow anima quando o celular aparece
  const gym = $('.gym');
  new IntersectionObserver(([e], obs) => {
    if (e.isIntersecting) { gym.classList.add('is-in'); obs.disconnect(); }
  }, { threshold: .3 }).observe($('.phone'));

  /* ------------------------------------------------------------------
     Counters
  ------------------------------------------------------------------ */
  const countIO = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target, to = +el.dataset.countto;
      countIO.unobserve(el);
      if (reduce) { el.textContent = to.toLocaleString('pt-BR'); return; }
      const start = performance.now(), dur = 1600;
      const step = now => {
        const p = clamp((now - start) / dur, 0, 1);
        const eased = 1 - Math.pow(1 - p, 4);
        el.textContent = Math.round(to * eased).toLocaleString('pt-BR');
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }, { threshold: .6 });
  $$('[data-countto]').forEach(el => countIO.observe(el));

  /* ------------------------------------------------------------------
     About statement — palavras acendem com o scroll
  ------------------------------------------------------------------ */
  const statement = $('[data-words]');
  const highlight = ['modelagem', 'query', 'pipeline', 'interface,', 'verdade.'];
  let words = [];
  if (statement) {
    const txt = statement.textContent.trim().split(/\s+/);
    statement.innerHTML = txt.map(w => `<span class="w${highlight.includes(w) ? ' hl' : ''}">${w}</span>`).join(' ');
    words = $$('.w', statement);
  }

  /* ------------------------------------------------------------------
     Terminal — query digitada
  ------------------------------------------------------------------ */
  const term = $('[data-terminal]');
  if (term) {
    const out = $('[data-type]', term);
    const script = [
      ['cmd', 'davi=# ', '\\x on'],
      ['out', '<span class="c">Expanded display is on.</span>\n'],
      ['cmd', 'davi=# ', 'SELECT * FROM devs WHERE id = 1;'],
      ['out',
        '<span class="c">-[ RECORD 1 ]----------------------------</span>\n' +
        '<span class="n">nome   </span> | <span class="p">Davi Barcia Viana</span>\n' +
        '<span class="n">foco   </span> | <span class="p">fullstack, dados, IA aplicada</span>\n' +
        '<span class="n">base   </span> | <span class="p">João Pessoa, PB</span>\n' +
        '<span class="n">stack  </span> | <span class="p">python, postgresql, django</span>\n' +
        '<span class="n">idiomas</span> | <span class="p">pt-BR, en</span>\n'],
      ['cmd', 'davi=# ', '\\x off'],
      ['cmd', 'davi=# ', 'SELECT * FROM projetos;'],
      ['out',
        ' <span class="n">projeto</span>   | <span class="n">contexto</span>\n' +
        '<span class="c">-----------+---------------------</span>\n' +
        ' VIZZO     | marca própria\n' +
        ' GymFlow   | app Flutter\n' +
        ' SmartPark | visão computacional\n' +
        ' Anomalias | machine learning\n' +
        ' F1 Data   | análise de dados\n' +
        '<span class="c">(5 rows)</span>\n'],
    ];
    const hl = (s) => s
      .replace(/= (\d+)/g, '= <span class="s">$1</span>')
      .replace(/\b(SELECT|FROM|WHERE)\b/g, '<span class="k">$1</span>');

    const run = async () => {
      const sleep = ms => new Promise(r => setTimeout(r, ms));
      for (const [type, a, b] of script) {
        if (type === 'out') {
          out.insertAdjacentHTML('beforeend', a);
          await sleep(380);
          continue;
        }
        out.insertAdjacentHTML('beforeend', `<span class="c">${a}</span>`);
        const line = document.createElement('span');
        line.className = 'p';
        out.appendChild(line);
        if (!reduce) {
          for (const ch of b) { line.textContent += ch; await sleep(18 + Math.random() * 38); }
          await sleep(220);
        }
        line.innerHTML = hl(b.replace(/&/g, '&amp;').replace(/</g, '&lt;'));
        out.insertAdjacentHTML('beforeend', '\n');
      }
    };
    new IntersectionObserver(([e], obs) => {
      if (e.isIntersecting) { obs.disconnect(); run(); }
    }, { threshold: .35 }).observe(term);
  }

  /* ------------------------------------------------------------------
     Tilt (phone + project cards)
  ------------------------------------------------------------------ */
  if (finePointer && !reduce) {
    const phone = $('[data-tilt]');
    const dev = $('.gym__device');
    dev.addEventListener('pointermove', e => {
      const r = dev.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5;
      const y = (e.clientY - r.top) / r.height - .5;
      phone.style.setProperty('--ry', `${x * 26}deg`);
      phone.style.setProperty('--rx', `${-y * 18}deg`);
    });
    dev.addEventListener('pointerleave', () => { phone.style.removeProperty('--ry'); phone.style.removeProperty('--rx'); });

    $$('.pcard').forEach(c => {
      c.addEventListener('pointermove', e => {
        const r = c.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        c.style.setProperty('--mx', `${x * 100}%`);
        c.style.setProperty('--my', `${y * 100}%`);
        c.style.setProperty('--ry', `${(x - .5) * 8}deg`);
        c.style.setProperty('--rx', `${-(y - .5) * 8}deg`);
      });
      c.addEventListener('pointerleave', () => { c.style.setProperty('--rx', '0deg'); c.style.setProperty('--ry', '0deg'); });
    });
  }

  /* ------------------------------------------------------------------
     Copy e-mail
  ------------------------------------------------------------------ */
  const toast = $('.toast');
  let toastT;
  const showToast = (msg) => {
    toast.textContent = msg;
    toast.classList.add('is-on');
    clearTimeout(toastT);
    toastT = setTimeout(() => toast.classList.remove('is-on'), 2200);
  };
  $$('[data-copy]').forEach(b => b.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(b.dataset.copy);
      showToast('E-mail copiado ✓');
    } catch {
      location.href = 'mailto:' + b.dataset.copy;
    }
  }));
  const year = $('[data-year]');
  if (year) year.textContent = new Date().getFullYear();

  /* ------------------------------------------------------------------
     Scroll loop — progress, nav, marquee, parallax, timeline...
  ------------------------------------------------------------------ */
  const progress = $('.progress');
  const marquee = $('[data-marquee]');
  const mGroup = marquee && marquee.firstElementChild;
  const parallax = $$('[data-parallax]');
  const floats = $$('[data-float]');
  const timeline = $('[data-timeline]');
  const tLine = timeline && $('.timeline__line', timeline);
  const footBig = $('.footer__big');

  const themed = $$('[data-nav]');
  let lastY = scrollY, velocity = 0, mx = 0, dir = 1, navTheme = '';

  const frame = () => {
    const y = scrollY;
    const dy = y - lastY;
    lastY = y;
    velocity = lerp(velocity, dy, .12);

    // progress
    const max = document.documentElement.scrollHeight - vh;
    progress.style.setProperty('--s', max > 0 ? y / max : 0);

    // nav
    // nav fixa: adota o tema da seção que está passando por baixo dela
    nav.classList.toggle('is-scrolled', y > 40);
    let theme = 'dark';
    if (!document.body.classList.contains('menu-open')) {
      const mid = nav.offsetHeight / 2;
      for (const el of themed) {   // o último que bate vence (footer dentro do contato)
        const r = el.getBoundingClientRect();
        if (r.top <= mid && r.bottom > mid) theme = el.dataset.nav;
      }
    }
    if (theme !== navTheme) {
      navTheme = theme;
      nav.dataset.theme = theme;
      progress.dataset.theme = theme;
    }

    if (!reduce) {
      // marquee: velocidade e direção acompanham o scroll
      if (marquee && mGroup) {
        if (Math.abs(dy) > 1) dir = dy > 0 ? 1 : -1;
        const w = mGroup.offsetWidth;
        mx -= (0.6 + Math.min(Math.abs(velocity) * .5, 14)) * dir;
        if (mx <= -w) mx += w;
        if (mx > 0) mx -= w;
        marquee.style.transform = `translate3d(${mx}px,0,0)`;
      }

      // parallax
      parallax.forEach(el => {
        const r = el.parentElement.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        const c = r.top + r.height / 2 - vh / 2;
        el.style.transform = `translate3d(0, ${c * -parseFloat(el.dataset.parallax)}px, 0)`;
      });
      floats.forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        const c = (r.top + r.height / 2 - vh / 2) / vh;
        const n = +el.dataset.float;
        el.style.transform = `translate3d(0, ${c * (n === 2 ? -60 : 40)}px, 0) rotate(${c * (n - 2) * 4}deg)`;
      });

      // footer wordmark sobe
      if (footBig) {
        const r = footBig.parentElement.getBoundingClientRect();
        const p = clamp(1 - (r.top - vh * .3) / (vh * .7), 0, 1);
        footBig.style.setProperty('--fy', `${(1 - p) * 30}%`);
      }
    }

    // palavras do sobre
    if (words.length) {
      const r = statement.getBoundingClientRect();
      const p = clamp((vh * .85 - r.top) / (r.height + vh * .35), 0, 1);
      const lit = Math.floor(p * words.length * 1.05);
      words.forEach((w, i) => w.classList.toggle('on', reduce || i < lit));
    }

    // timeline
    if (tLine) {
      const r = timeline.getBoundingClientRect();
      const p = clamp((vh * .6 - r.top) / r.height, 0, 1);
      tLine.style.setProperty('--t', p);
    }

    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
})();
