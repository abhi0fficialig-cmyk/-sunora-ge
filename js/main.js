/* =========================================================
   SUNORA GREEN ENERGY — interactions
   ========================================================= */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const root = document.documentElement;
  const body = document.body;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const WA_NUMBER = '917600781800';

  root.classList.add('js');

  /* ---------- Placeholder slots: inject label + icon ---------- */
  $$('.slot').forEach(slot => {
    if (slot.children.length) return;
    const label = slot.dataset.label || '';
    if (!label) { slot.innerHTML = '<i class="ph-fill ph-user"></i>'; return; }
    const type = slot.dataset.type;
    const icon = type === 'video' ? 'ph-video-camera' : type === 'map' ? 'ph-map-trifold' : 'ph-image';
    slot.innerHTML = `<div class="slot-in"><i class="ph ${icon}"></i><b>${label}</b>${slot.dataset.size ? `<small>${slot.dataset.size}</small>` : ''}</div>`;
  });

  /* ---------- Split headings into words ---------- */
  const splitWords = (el) => {
    const walk = (node) => {
      [...node.childNodes].forEach(child => {
        if (child.nodeType === 3) {
          const parts = child.textContent.split(/(\s+)/);
          const frag = document.createDocumentFragment();
          parts.forEach(p => {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span'); w.className = 'w';
            const wi = document.createElement('span'); wi.className = 'wi'; wi.textContent = p;
            w.appendChild(wi); frag.appendChild(w);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === 1 && child.tagName.toLowerCase() !== 'svg') {
          walk(child);
        }
      });
    };
    walk(el);
    $$('.wi', el).forEach((wi, i) => wi.style.setProperty('--i', i));
  };
  $$('[data-split]').forEach(splitWords);

  /* ---------- Hero entrance stagger ---------- */
  $$('[data-hero]').forEach((el, i) => el.style.setProperty('--d', `${0.1 + i * 0.09}s`));

  /* ---------- Smooth scroll (Lenis) ---------- */
  let lenis = null;
  if (window.Lenis && !reduceMotion) {
    lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true, wheelMultiplier: 1 });
    lenis.stop();
  }

  /* ---------- Preloader ---------- */
  const pre = $('#preloader');
  const plCount = $('#plCount');
  const plMsg = $('#plMsg');
  const MIN_TIME = reduceMotion ? 300 : 2200;
  const t0 = performance.now();
  let pageLoaded = document.readyState === 'complete';
  let shown = 0, finished = false;
  root.style.overflow = 'hidden';
  window.addEventListener('load', () => { pageLoaded = true; });
  setTimeout(() => { pageLoaded = true; }, 5000);           // never hang on a slow asset
  const startPage = () => {
    body.classList.add('loaded');
    root.style.overflow = '';
    if (lenis) lenis.start();
    initObservers();
  };
  const finishLoader = () => {
    if (finished) return;
    finished = true;
    pre.classList.add('done');
    setTimeout(startPage, reduceMotion ? 0 : 380);
    setTimeout(() => pre.classList.add("gone"), reduceMotion ? 50 : 1000);
  };
  const updateLoader = () => {
    if (finished) return;
    const t = Math.min((performance.now() - t0) / MIN_TIME, 1);
    let target = (1 - Math.pow(1 - t, 3)) * 100;
    if (!pageLoaded) target = Math.min(target, 92);
    shown = Math.max(shown, target);
    if (t >= 1 && pageLoaded) shown = 100;
    const v = Math.round(shown);
    plCount.textContent = v;
    if (v >= 100) finishLoader();
  };
  // the line under the logo changes while loading
  const plLines = ['Powering your home with sunshine', 'Clean energy, brighter tomorrow', 'Saving on every electricity bill', 'Going green with Sunora'];
  let plI = 0;
  const plTimer = pre && !reduceMotion ? setInterval(() => {
    if (finished) return clearInterval(plTimer);
    plMsg.classList.add('swap');
    setTimeout(() => { plI = (plI + 1) % plLines.length; plMsg.textContent = plLines[plI]; plMsg.classList.remove('swap'); }, 280);
  }, 1100) : null;
  if (pre) {
    const loaderTimer = setInterval(() => { updateLoader(); if (finished) clearInterval(loaderTimer); }, 100);
    updateLoader();
  } else { startPage(); }

  /* ---------- Reveal + counters (start after preloader) ---------- */
  const fmt = (n, d = 0) => Number(n).toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d });
  const runCounter = (el) => {
    const end = parseFloat(el.dataset.count);
    const dec = parseInt(el.dataset.decimals || '0', 10);
    const dur = 1800;
    const s = performance.now();
    const step = (now) => {
      const p = Math.min((now - s) / dur, 1);
      const e = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
      el.textContent = fmt(end * e, dec);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  function initObservers() {
    const io = new IntersectionObserver((entries) => {
      const vis = entries.filter(e => e.isIntersecting);
      vis.forEach((e, i) => {
        const el = e.target;
        if (el.hasAttribute('data-reveal') && !el.style.getPropertyValue('--d')) el.style.setProperty('--d', `${i * 0.08}s`);
        el.classList.add('in');
        io.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    $$('[data-reveal], [data-split], .scribble').forEach(el => io.observe(el));

    const cio = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { runCounter(e.target); cio.unobserve(e.target); } });
    }, { threshold: 0.5 });
    $$('[data-count]').forEach(el => cio.observe(el));
  }

  /* ---------- Scroll-driven UI (progress, header, to-top, parallax) ---------- */
  const header = $('#header');
  const progress = $('#scrollProgress');
  const toTop = $('#toTop');
  const ring = $('#ttRing');
  const parallax = reduceMotion ? [] : $$('[data-speed]');
  let lastY = -1;

  const onScroll = () => {
    const y = window.scrollY;
    if (y === lastY) return;
    lastY = y;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const p = max > 0 ? y / max : 0;
    if (progress) progress.style.transform = `scaleX(${p})`;
    header.classList.toggle('scrolled', y > 60);
    toTop.classList.toggle('show', y > 700);
    ring.style.strokeDashoffset = 132 - 132 * p;
    const vh = window.innerHeight;
    parallax.forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;
      const center = r.top + r.height / 2 - vh / 2;
      const speed = parseFloat(el.dataset.speed) * (window.innerWidth < 720 ? 0.5 : 1);
      el.style.translate = `0 ${(-center * speed).toFixed(1)}px`;
    });
  };

  const raf = (t) => {
    if (lenis) lenis.raf(t);
    onScroll();
    requestAnimationFrame(raf);
  };
  requestAnimationFrame(raf);

  /* ---------- Anchor navigation ---------- */
  const scrollToTarget = (target) => {
    const off = header.offsetHeight - 2;
    if (lenis) lenis.scrollTo(target, { offset: -off, duration: 1.4 });
    else window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - off, behavior: reduceMotion ? 'auto' : 'smooth' });
  };
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href');
    if (id.length < 2) return;
    const target = $(id);
    if (!target) return;
    e.preventDefault();
    closeMenu();
    scrollToTarget(target);
  });
  toTop.addEventListener('click', () => {
    if (lenis) lenis.scrollTo(0, { duration: 1.6 });
    else window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  /* ---------- Active nav link ---------- */
  const navLinks = $$('.nav a');
  const sio = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      navLinks.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + e.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  navLinks.forEach(l => { const s = $(l.getAttribute('href')); if (s) sio.observe(s); });

  /* ---------- Mobile menu ---------- */
  const burger = $('#burger');
  const mmenu = $('#mmenu');
  function closeMenu() {
    if (!mmenu.classList.contains('open')) return;
    mmenu.classList.remove('open'); burger.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
    if (lenis) lenis.start(); else root.style.overflow = '';
  }
  const mmClose = $('#mmenuClose');
  if (mmClose) mmClose.addEventListener('click', closeMenu);
  burger.addEventListener('click', () => {
    const open = !mmenu.classList.contains('open');
    if (!open) return closeMenu();
    mmenu.classList.add('open'); burger.classList.add('open');
    burger.setAttribute('aria-expanded', 'true');
    if (lenis) lenis.stop(); else root.style.overflow = 'hidden';
  });

  /* ---------- Carousels ---------- */
  if (window.Swiper) {
    const auto = (delay) => reduceMotion ? false : { delay, disableOnInteraction: false, pauseOnMouseEnter: true };

    // Endless carousels: duplicate the slide set once so there is never an empty edge
    const dup = (sel) => { const w = $(sel + ' .swiper-wrapper'); if (w) [...w.children].forEach(s => { const c = s.cloneNode(true); c.setAttribute('aria-hidden', 'true'); w.appendChild(c); }); };
    dup('.why-swiper'); dup('.svc-swiper'); dup('.testi-swiper');

    new Swiper('.why-swiper', {
      slidesPerView: 'auto', spaceBetween: 24, speed: 800, grabCursor: true,
      loop: true, loopAdditionalSlides: 4,
      navigation: { nextEl: '.why-next', prevEl: '.why-prev' },
      autoplay: auto(3200),
    });

    new Swiper('.svc-swiper', {
      slidesPerView: 1, spaceBetween: 18, speed: 800, grabCursor: true,
      loop: true, loopAdditionalSlides: 4,
      navigation: { nextEl: '.svc-next', prevEl: '.svc-prev' },
      autoplay: auto(3600),
      breakpoints: { 600: { slidesPerView: 2.1, spaceBetween: 22 }, 1024: { slidesPerView: 3.2, spaceBetween: 28 } },
    });



    new Swiper('.testi-swiper', {
      slidesPerView: 'auto', spaceBetween: 26, speed: 800, loop: true, loopAdditionalSlides: 4, grabCursor: true,
      navigation: { nextEl: '.testi-next', prevEl: '.testi-prev' },
      autoplay: auto(3800),
    });
  }

  /* ---------- FAQ accordion ---------- */
  $$('.acc-item').forEach(item => {
    $('.acc-q', item).addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      $$('.acc-item').forEach(i => { i.classList.remove('open'); $('.acc-q', i).setAttribute('aria-expanded', 'false'); });
      if (!isOpen) { item.classList.add('open'); $('.acc-q', item).setAttribute('aria-expanded', 'true'); }
    });
  });

  /* ---------- PM Surya Ghar calculator ---------- */
  const kw = $('#kw'), tariff = $('#tariff');
  const out = { kw: $('#kwOut'), tariff: $('#tariffOut'), sub: $('#rSub'), gen: $('#rGen'), save: $('#rSave'), life: $('#rLife'), co2: $('#rCo2') };
  const inr = (n) => '₹' + Math.round(n).toLocaleString('en-IN');
  const lakh = (n) => n >= 1e7 ? `₹${(n / 1e7).toFixed(2)} Cr` : n >= 1e5 ? `₹${(n / 1e5).toFixed(1)} L` : inr(n);
  const subsidyFor = (k) => k <= 2 ? 30000 * k : 78000;
  const setFill = (el) => el.style.setProperty('--p', `${((el.value - el.min) / (el.max - el.min)) * 100}%`);
  const bump = (el, txt) => { if (el.textContent === txt) return; el.textContent = txt; el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); };
  const calc = () => {
    const k = parseFloat(kw.value), t = parseFloat(tariff.value);
    const gen = k * 120;              // ~4 units/kW/day
    const save = gen * t;
    out.kw.textContent = k;
    out.tariff.textContent = t % 1 ? t.toFixed(1) : t;
    bump(out.sub, inr(subsidyFor(k)));
    bump(out.gen, `${fmt(gen)} units`);
    bump(out.save, inr(save));
    bump(out.life, lakh(save * 12 * 25));
    bump(out.co2, `${(gen * 12 * 0.82 / 1000).toFixed(1)} t`);
    setFill(kw); setFill(tariff);
  };
  if (kw && tariff) { kw.addEventListener('input', calc); tariff.addEventListener('input', calc); calc(); }

  /* ---------- Video modal ---------- */
  // Seamless loop: duplicate the set once; CSS slides the track by exactly 50%
  $$('.vid-track').forEach(track => {
    const base = [...track.children];
    const add = () => base.forEach(s => { const c = s.cloneNode(true); c.setAttribute('aria-hidden', 'true'); track.appendChild(c); });
    // make one set at least as wide as the screen, then double it so the -50% loop has no gap
    for (let i = 0; i < 6 && track.scrollWidth < window.innerWidth * 1.3; i++) add();
    [...track.children].forEach(s => { const c = s.cloneNode(true); c.setAttribute('aria-hidden', 'true'); track.appendChild(c); });
  });
  // play only the videos that are on screen
  const vio = new IntersectionObserver(es => es.forEach(e => {
    const v = $('video', e.target);
    if (!v) return;
    if (e.isIntersecting) v.play().catch(() => {}); else v.pause();
  }), { threshold: 0.15 });
  $$('.vid-card').forEach(card => {
    const src = card.dataset.src;
    let video = null;
    if (src) {
      video = document.createElement('video');
      video.src = src; video.muted = true; video.loop = true; video.autoplay = true;
      video.playsInline = true; video.setAttribute('playsinline', ''); video.preload = 'metadata';
      if (card.dataset.poster) video.poster = card.dataset.poster;
      $('.media', card).appendChild(video);
      vio.observe(card);
    }
    const btn = $('.vid-mute', card);
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const unmuted = btn.getAttribute('aria-pressed') !== 'true';
      // only one video plays with sound at a time
      $$('.vid-mute').forEach(b => { if (b !== btn) { b.setAttribute('aria-pressed', 'false'); b.setAttribute('aria-label', 'Unmute video'); } });
      $$('.vid-card video').forEach(v => { v.muted = true; });
      btn.setAttribute('aria-pressed', String(unmuted));
      btn.setAttribute('aria-label', unmuted ? 'Mute video' : 'Unmute video');
      if (video) { video.muted = !unmuted; if (unmuted) video.play().catch(() => {}); }
    });
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });

  /* ---------- Draggable endless conveyors (Videos, Projects) ---------- */
  // Auto-scrolls on its own; a finger/mouse drag takes over, then it carries on from where you left it.
  const conveyors = $$('.vid-marquee').map(box => {
    const track = $('.vid-track', box);
    const dir = box.classList.contains('proj-marquee') ? 1 : -1;      // projects move right, videos move left
    const secs = dir === 1 ? 55 : 50;
    let setW = 0, x = 0, vel = 0, dragging = false, hovering = false, moved = 0, lastX = 0, lastT = 0, startX = 0, pid = null;
    const measure = () => { setW = track.scrollWidth / 2; };
    const wrap = (v) => { if (!setW) return v; v %= setW; if (v > 0) v -= setW; return v; };
    const paint = () => { track.style.transform = `translate3d(${x.toFixed(2)}px,0,0)`; };
    measure(); x = dir === 1 ? -setW / 2 : 0; paint();
    window.addEventListener('resize', measure);
    box.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      dragging = true; moved = 0; vel = 0; pid = e.pointerId; startX = lastX = e.clientX; lastT = performance.now();
      box.classList.add('dragging');
    });
    box.addEventListener('pointermove', (e) => {
      if (!dragging || e.pointerId !== pid) return;
      const dx = e.clientX - lastX, now = performance.now();
      if (Math.abs(e.clientX - startX) > 6 && !box.hasPointerCapture(pid)) { try { box.setPointerCapture(pid); } catch (_) {} }
      moved = Math.max(moved, Math.abs(e.clientX - startX));
      x = wrap(x + dx);
      vel = dx / Math.max(now - lastT, 1) * 16;   // px per ~frame
      lastX = e.clientX; lastT = now; paint();
    });
    const end = (e) => {
      if (!dragging || (e && e.pointerId !== pid)) return;
      dragging = false; box.classList.remove('dragging');
      try { box.releasePointerCapture(pid); } catch (_) {}
    };
    box.addEventListener('pointerup', end);
    box.addEventListener('pointercancel', end);
    // pause on hover for a mouse only (a touch tap must not leave it paused)
    box.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') hovering = true; });
    box.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') hovering = false; });
    // a drag must not count as a click (it would open the lightbox)
    box.addEventListener('click', (e) => { if (moved > 6) { e.stopPropagation(); e.preventDefault(); moved = 0; } }, true);
    box.addEventListener('dragstart', (e) => e.preventDefault());
    let prev = performance.now();
    const tick = (now) => {
      const dt = Math.min(now - prev, 50); prev = now;
      if (!dragging) {
        vel *= 0.95; if (Math.abs(vel) < 0.05) vel = 0;           // momentum after a flick
        const auto = (reduceMotion || hovering) ? 0 : dir * (setW / secs) * dt / 1000;
        x = wrap(x + vel + auto);
        paint();
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    return box;
  });

  /* ---------- Lightbox: click a video or project photo to view it full screen ---------- */
  const lb = $('#lightbox'), lbStage = $('#lbStage'), lbCount = $('#lbCount');
  const lbSets = {
    videos: () => $$('#videos .vid-slide:not([aria-hidden]) .vid-card').map(c => ({ type: 'video', src: c.dataset.src })),
    projects: () => $$('#projects .proj-slide:not([aria-hidden]) img').map(i => ({ type: 'image', src: i.getAttribute('src'), alt: i.alt })),
  };
  let lbItems = [], lbIndex = 0;
  const lbRender = () => {
    const it = lbItems[lbIndex];
    lbStage.innerHTML = '';
    let el;
    if (it.type === 'video') {
      el = document.createElement('video');
      el.src = it.src; el.controls = true; el.autoplay = true; el.loop = true; el.playsInline = true;
      el.setAttribute('playsinline', '');
      el.play().catch(() => {});
    } else {
      el = document.createElement('img');
      el.src = it.src; el.alt = it.alt || '';
    }
    lbStage.appendChild(el);
    lbCount.textContent = `${lbIndex + 1} / ${lbItems.length}`;
    lb.classList.toggle('single', lbItems.length < 2);
  };
  const lbOpen = (setName, src) => {
    lbItems = lbSets[setName]();
    lbIndex = Math.max(0, lbItems.findIndex(x => x.src === src));
    lbRender();
    lb.classList.add('open'); lb.setAttribute('aria-hidden', 'false');
    if (lenis) lenis.stop(); else root.style.overflow = 'hidden';
  };
  const lbClose = () => {
    if (!lb.classList.contains('open')) return;
    lb.classList.remove('open'); lb.setAttribute('aria-hidden', 'true');
    setTimeout(() => { if (!lb.classList.contains('open')) lbStage.innerHTML = ''; }, 350);
    if (lenis) lenis.start(); else root.style.overflow = '';
  };
  const lbStep = (d) => { lbIndex = (lbIndex + d + lbItems.length) % lbItems.length; lbRender(); };
  document.addEventListener('click', (e) => {
    if (e.target.closest('.vid-mute')) return;
    const v = e.target.closest('#videos .vid-card');
    if (v && v.dataset.src) return lbOpen('videos', v.dataset.src);
    const p = e.target.closest('#projects .proj-card');
    if (p) { const img = $('img', p); if (img) lbOpen('projects', img.getAttribute('src')); }
  });
  $('.lb-x', lb).addEventListener('click', lbClose);
  $('.lb-prev', lb).addEventListener('click', () => lbStep(-1));
  $('.lb-next', lb).addEventListener('click', () => lbStep(1));
  lb.addEventListener('click', (e) => { if (e.target === lb || e.target === lbStage) lbClose(); });
  document.addEventListener('keydown', (e) => {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') lbClose();
    if (e.key === 'ArrowLeft') lbStep(-1);
    if (e.key === 'ArrowRight') lbStep(1);
  });

  /* ---------- Contact form → WhatsApp ---------- */
  const form = $('#cform'), msg = $('#formMsg');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const d = new FormData(form);
    const name = (d.get('name') || '').trim();
    const phone = (d.get('phone') || '').replace(/\D/g, '');
    $$('.field', form).forEach(f => f.classList.remove('err'));
    if (!name) { form.name.closest('.field').classList.add('err'); msg.className = 'form-msg bad'; msg.textContent = 'Please enter your name.'; return; }
    if (phone.length < 10) { form.phone.closest('.field').classList.add('err'); msg.className = 'form-msg bad'; msg.textContent = 'Please enter a valid 10-digit phone number.'; return; }
    const lines = [
      'Hello Sunora Green Energy! I would like a free solar quote.',
      `Name: ${name}`,
      `Phone: ${d.get('phone')}`,
      d.get('email') ? `Email: ${d.get('email')}` : '',
      d.get('city') ? `City: ${d.get('city')}` : '',
      `Interested in: ${d.get('type')}`,
      `Monthly bill: ${d.get('bill')}`,
      d.get('msg') ? `Message: ${d.get('msg')}` : '',
    ].filter(Boolean).join('\n');
    window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(lines)}`, '_blank', 'noopener');
    msg.className = 'form-msg';
    msg.textContent = '☀ Thank you! WhatsApp is opening with your details — just hit send.';
    form.reset();
  });

  /* ---------- Custom cursor + magnetic buttons ---------- */
  if (finePointer && !reduceMotion) {
    const cur = $('#cursor');
    let mx = -100, my = -100, cx = -100, cy = -100;
    window.addEventListener('mousemove', (e) => { mx = e.clientX; my = e.clientY; cur.classList.add('on'); }, { passive: true });
    document.addEventListener('mouseleave', () => cur.classList.remove('on'));
    const loop = () => {
      cx += (mx - cx) * 0.2; cy += (my - cy) * 0.2;
      cur.style.transform = `translate(${cx}px, ${cy}px)`;
      requestAnimationFrame(loop);
    };
    loop();
    document.addEventListener('mouseover', (e) => {
      const drag = e.target.closest('[data-cursor="drag"]');
      const link = e.target.closest('a, button, input, select, textarea, label');
      cur.classList.toggle('drag', !!drag && !link);
      cur.classList.toggle('hover', !!link);
    });

    $$('[data-magnetic]').forEach(el => {
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        el.style.translate = `${x * 0.22}px ${y * 0.35}px`;
      });
      el.addEventListener('mouseleave', () => { el.style.translate = ''; });
    });
  }

  /* ---------- Solar systems tabs ---------- */
  const sysTabs = $$('.sys-tab');
  sysTabs.forEach(tab => tab.addEventListener('click', () => {
    sysTabs.forEach(t => { t.classList.toggle('is-active', t === tab); t.setAttribute('aria-selected', String(t === tab)); });
    $$('.sys-panel').forEach(p => p.classList.toggle('is-active', p.id === tab.getAttribute('aria-controls')));
  }));

  /* ---------- State scheme selector ---------- */
  const stateSel = $('#stateSel'), stateOut = $('#stateOut'), stateWa = $('#stateWa');
  if (stateSel) stateSel.addEventListener('change', () => {
    const st = stateSel.value;
    if (!st) { stateOut.textContent = 'Choose your state and we will confirm the latest incentives you can claim, free of charge.'; stateWa.href = `https://wa.me/${WA_NUMBER}`; return; }
    stateOut.textContent = `Great! We'll check the latest ${st} government solar benefits, on top of PM Surya Ghar, and share them with you.`;
    stateWa.href = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(`Hello Sunora Green Energy! Please tell me about the latest state government solar subsidy and benefits in ${st}.`)}`;
  });

  /* ---------- Subsidy application form → WhatsApp ---------- */
  const sform = $('#sform');
  if (sform) sform.addEventListener('submit', (e) => {
    e.preventDefault();
    const d = new FormData(sform), m = $('.form-msg', sform);
    const name = (d.get('name') || '').trim(), phone = (d.get('phone') || '').replace(/\D/g, ''), city = (d.get('city') || '').trim();
    $$('.field', sform).forEach(f => f.classList.remove('err'));
    const bad = (el, t) => { el.closest('.field').classList.add('err'); m.className = 'form-msg bad'; m.textContent = t; };
    if (!name) return bad(sform.name, 'Please enter your name.');
    if (phone.length < 10) return bad(sform.phone, 'Please enter a valid 10-digit mobile number.');
    if (!city) return bad(sform.city, 'Please enter your city.');
    const text = ['Hello Sunora Green Energy! I want to apply for the PM Surya Ghar subsidy.', `Name: ${name}`, `Mobile: ${d.get('phone')}`, `City: ${city}`, `Monthly bill: ${d.get('bill')}`, d.get('msg') ? `Message: ${d.get('msg')}` : ''].filter(Boolean).join('\n');
    window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
    m.className = 'form-msg'; m.textContent = '☀ Thank you! WhatsApp is opening with your details, just hit send.';
    sform.reset();
  });

  /* ---------- Section background decorations ---------- */
  const ICON = {
    sun: '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="19" fill="currentColor"/><g stroke="currentColor" stroke-width="7" stroke-linecap="round"><path d="M50 8v14M50 78v14M8 50h14M78 50h14M20 20l10 10M70 70l10 10M80 20L70 30M30 70L20 80"/></g></svg>',
    leaf: '<svg viewBox="0 0 60 60"><path d="M8 52C8 24 26 8 54 6c0 28-16 46-46 46z" fill="currentColor"/><path d="M10 50L44 16" stroke="#fff" stroke-opacity=".55" stroke-width="2.5" stroke-linecap="round" fill="none"/></svg>',
    panel: '<svg viewBox="0 0 100 70"><g fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round"><path d="M22 6h72L78 52H6z"/><path d="M16 29h72M26 6L10 52M50 6L34 52M74 6L58 52" stroke-width="3"/><path d="M42 52v14M26 66h32" stroke-linecap="round"/></g></svg>',
    bolt: '<svg viewBox="0 0 60 80"><path d="M36 4L8 46h18l-6 30 32-44H34z" fill="currentColor"/></svg>',
    ring: '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" stroke-width="9"/></svg>',
    plus: '<svg viewBox="0 0 60 60"><path d="M30 8v44M8 30h44" stroke="currentColor" stroke-width="12" stroke-linecap="round"/></svg>',
    squig: '<svg viewBox="0 0 160 40"><path d="M4 22c18-22 32 22 50 0s32 22 50 0 32 22 50 0" fill="none" stroke="currentColor" stroke-width="7" stroke-linecap="round"/></svg>',
    dots: '<svg viewBox="0 0 100 100"><defs><pattern id="dp" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="4" cy="4" r="3.2" fill="currentColor"/></pattern></defs><rect width="100" height="100" fill="url(#dp)"/></svg>',
    star: '<svg viewBox="0 0 60 60"><path d="M30 2c2 16 12 26 28 28-16 2-26 12-28 28-2-16-12-26-28-28 16-2 26-12 28-28z" fill="currentColor"/></svg>',
    drop: '<svg viewBox="0 0 60 80"><path d="M30 4C18 24 8 36 8 50a22 22 0 0 0 44 0C52 36 42 24 30 4z" fill="currentColor"/></svg>',
  };
  // [type, left|right, top|bottom, size px, rotate deg, colour, opacity, float-animation?]
  const DECO = {
    about:        [['sun', 'r:-60', 't:6%', 220, 0, 'var(--sun)', .35, 'spin'], ['leaf', 'l:3%', 'b:6%', 64, -25, 'var(--lime)', .7, 'sway'], ['squig', 'r:6%', 'b:5%', 150, -4, 'var(--sun)', .8, ''], ['plus', 'l:46%', 't:5%', 28, 0, 'var(--g500)', .45, 'spin']],
    why:          [['ring', 'l:-70', 't:8%', 190, 0, 'var(--lime)', .35, ''], ['bolt', 'r:4%', 't:6%', 54, 14, 'var(--sun)', .75, 'sway'], ['star', 'l:6%', 'b:7%', 40, 0, 'var(--orange)', .6, 'spin'], ['dots', 'r:2%', 'b:4%', 120, 0, 'var(--g500)', .35, '']],
    services:     [['panel', 'l:3%', 'b:4%', 170, -8, 'var(--g500)', .22, 'sway'], ['sun', 'r:3%', 'b:10%', 90, 0, 'var(--sun)', .8, 'spin'], ['leaf', 'l:42%', 't:3%', 50, 30, 'var(--g500)', .45, 'sway'], ['sun', 'r:5%', 't:4%', 120, 0, 'var(--sun)', .9, 'spin'], ['ring', 'r:-40', 't:-30', 170, 0, 'var(--g500)', .18, ''], ['star', 'r:20%', 't:9%', 34, 0, 'var(--orange)', .6, 'spin'], ['dots', 'r:2%', 't:34%', 110, 0, 'var(--g500)', .32, ''], ['squig', 'r:30%', 't:3%', 130, 6, 'var(--orange)', .6, ''], ['plus', 'l:30%', 'b:5%', 28, 0, 'var(--g700)', .4, 'spin']],
    surya:        [['sun', 'l:-90', 'b:-60', 300, 0, '#fff', .35, 'spin'], ['star', 'r:6%', 't:8%', 46, 0, 'var(--g800)', .35, 'spin'], ['leaf', 'l:6%', 't:10%', 56, -20, 'var(--g700)', .45, 'sway'], ['plus', 'r:14%', 'b:12%', 34, 0, 'var(--g800)', .3, '']],
    subsidy:      [['ring', 'r:-80', 't:12%', 220, 0, '#fff', .55, ''], ['panel', 'l:2%', 'b:3%', 150, 8, 'var(--sky)', .28, 'sway'], ['bolt', 'r:5%', 'b:8%', 48, -12, 'var(--orange)', .5, 'sway'], ['sun', 'l:4%', 't:5%', 70, 0, 'var(--sun)', .7, 'spin']],
    systems:      [['sun', 'r:-70', 't:-40', 260, 0, 'var(--sun)', .28, 'spin'], ['leaf', 'l:3%', 't:8%', 58, -30, 'var(--lime)', .7, 'sway'], ['plus', 'l:9%', 'b:6%', 34, 0, 'var(--orange)', .5, 'spin'], ['dots', 'r:3%', 'b:4%', 130, 0, 'var(--g500)', .3, '']],
    state:        [['ring', 'r:-90', 'b:-70', 260, 0, '#fff', .6, ''], ['star', 'r:8%', 't:7%', 44, 0, 'var(--orange)', .6, 'spin'], ['leaf', 'l:4%', 't:6%', 54, 20, 'var(--g500)', .45, 'sway'], ['dots', 'l:3%', 'b:5%', 120, 0, 'var(--sky)', .4, ''], ['sun', 'l:6%', 'b:30%', 70, 0, 'var(--sun)', .8, 'spin'], ['bolt', 'r:5%', 'b:8%', 44, -12, 'var(--sun)', .8, 'sway']],
    videos:       [['sun', 'l:-60', 't:6%', 200, 0, 'var(--sun)', .3, 'spin'], ['squig', 'r:5%', 't:6%', 140, 4, 'var(--lime)', .9, ''], ['drop', 'r:4%', 'b:4%', 36, 12, 'var(--sky)', .45, 'sway']],
    projects:     [['dots', 'l:2%', 't:5%', 130, 0, 'var(--g500)', .3, ''], ['sun', 'r:-50', 't:4%', 170, 0, 'var(--sun)', .3, 'spin'], ['leaf', 'r:8%', 'b:5%', 56, 160, 'var(--lime)', .7, 'sway']],
    faq:          [['ring', 'l:-70', 'b:6%', 200, 0, 'var(--sun)', .4, ''], ['star', 'r:6%', 't:6%', 42, 0, 'var(--orange)', .55, 'spin'], ['bolt', 'r:4%', 'b:7%', 44, 10, 'var(--sun)', .7, 'sway'], ['plus', 'l:48%', 't:4%', 28, 0, 'var(--g500)', .4, 'spin']],
    testimonials: [['sun', 'l:-70', 'b:-40', 230, 0, '#fff', .45, 'spin'], ['leaf', 'l:4%', 't:6%', 52, -20, 'var(--g500)', .45, 'sway'], ['star', 'r:6%', 'b:8%', 38, 0, 'var(--orange)', .6, 'spin']],
    contact:      [['sun', 'r:-80', 't:-30', 240, 0, 'var(--sun)', .3, 'spin'], ['panel', 'l:1%', 'b:2%', 140, 6, 'var(--g500)', .18, 'sway'], ['leaf', 'r:10%', 'b:5%', 50, 150, 'var(--lime)', .7, 'sway'], ['squig', 'l:40%', 't:3%', 120, 0, 'var(--sun)', .8, '']],
  };
  const pos = (v) => { const [k, n] = v.split(':'); return [k, /^-?\d+$/.test(n) ? n + 'px' : n]; };
  Object.entries(DECO).forEach(([id, items]) => {
    const sec = document.getElementById(id);
    if (!sec) return;
    const layer = document.createElement('div');
    layer.className = 'deco'; layer.setAttribute('aria-hidden', 'true');
    items.forEach(([type, h, v, size, rot, color, op, anim], i) => {
      const el = document.createElement('span');
      el.className = 'deco-i' + (anim ? ' d-' + anim : '');
      el.innerHTML = ICON[type];
      const [hk, hv] = pos(h), [vk, vv] = pos(v);
      el.style.cssText = `${hk === 'l' ? 'left' : 'right'}:${hv};${vk === 't' ? 'top' : 'bottom'}:${vv};width:${size}px;color:${color};opacity:${op};--r:${rot}deg;animation-delay:${-i * 1.7}s`;
      layer.appendChild(el);
    });
    sec.prepend(layer);
  });

  /* ---------- Year ---------- */
  const yr = $('#year'); if (yr) yr.textContent = new Date().getFullYear();
})();
