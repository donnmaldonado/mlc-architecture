/* MLC Architecture — shared behaviour */
(function () {
  const html = document.documentElement;
  const header = document.querySelector('.header');
  const menuBtn = document.querySelector('.menu-btn');
  const menu = document.querySelector('.menu');

  /* Mobile menu */
  if (menuBtn && menu) {
    const setOpen = (open) => {
      document.body.classList.toggle('menu-open', open);
      menuBtn.setAttribute('aria-expanded', String(open));
      menu.setAttribute('aria-hidden', String(!open));
      const lbl = menuBtn.querySelector('.menu-btn__label');
      if (lbl) lbl.textContent = open ? 'Close' : 'Menu';
    };
    menuBtn.addEventListener('click', () => setOpen(!document.body.classList.contains('menu-open')));
    menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setOpen(false)));
    window.addEventListener('keydown', e => { if (e.key === 'Escape') setOpen(false); });
    window.matchMedia('(min-width: 900px)').addEventListener('change', e => { if (e.matches) setOpen(false); });
  }

  /* Header: sticky. Picks up a hairline shadow once the page is scrolled, and
     folds the wordmark and section nav away so only the logo and the two
     primary links remain.

     Condensing shortens the bar, which pulls the page up under it. Left to
     itself that lands the reader back above the trigger and the bar flips
     straight back, so: two thresholds far enough apart to swallow the shift,
     and a lock for the length of the transition so nothing toggles twice
     while the bar is still moving. (body { overflow-anchor: none } stops the
     browser from re-correcting the scroll position on its own.) */
  if (header) {
    const CONDENSE_AT = 140, EXPAND_AT = 40, SETTLE = 500;
    let condensed = false, locked = false, lockTimer;

    const apply = () => {
      if (locked) return;
      const y = window.scrollY;
      const next = condensed ? y > EXPAND_AT : y > CONDENSE_AT;
      if (next === condensed) return;
      condensed = next;
      header.classList.toggle('is-condensed', condensed);
      locked = true;
      clearTimeout(lockTimer);
      lockTimer = setTimeout(() => settle(), SETTLE);
    };
    const onScroll = () => {
      header.classList.toggle('is-scrolled', window.scrollY > 8);
      apply();
    };
    /* Full-screen hero: its height is the viewport minus this bar, so hand the
       bar's real height to the CSS as --hero-offset. Only measure the full-size
       bar: re-measuring as it condenses would resize the hero mid-scroll. If it
       is condensed (or mid-transition) when the window resizes, wait until it
       has expanded again. Measured before onScroll() below, which may condense
       it on a reload part-way down the page. */
    const hasHero = !!document.querySelector('.hero');
    let heroStale = false;
    const measureHero = () => {
      if (!hasHero) return;
      if (condensed || locked) { heroStale = true; return; }
      html.style.setProperty('--hero-offset', header.getBoundingClientRect().height + 'px');
      heroStale = false;
    };
    measureHero();
    let resizeRaf;
    window.addEventListener('resize', () => { cancelAnimationFrame(resizeRaf); resizeRaf = requestAnimationFrame(measureHero); });
    window.addEventListener('load', measureHero);
    const settle = () => { locked = false; if (heroStale && !condensed) measureHero(); apply(); };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* Reveal on scroll (append ?noreveal to the URL to disable, e.g. for screenshots) */
  const revealEls = document.querySelectorAll('[data-reveal]');
  if (/noreveal/.test(location.search)) {
    revealEls.forEach(el => el.classList.add('is-in'));
  } else if ('IntersectionObserver' in window && revealEls.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('is-in'));
  }

  /* Current year */
  document.querySelectorAll('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });


  /* Copy to clipboard: any [data-copy] button copies its value */
  const copyBtns = document.querySelectorAll('[data-copy]');
  if (copyBtns.length) {
    const status = document.createElement('div');
    status.className = 'sr-only';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    document.body.appendChild(status);

    const write = async (text) => {
      if (navigator.clipboard && window.isSecureContext) {
        try { await navigator.clipboard.writeText(text); return true; } catch (e) { /* fall through */ }
      }
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;top:0;left:-9999px;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      ta.remove();
      return ok;
    };

    copyBtns.forEach(btn => {
      let timer;
      btn.addEventListener('click', async () => {
        const text = btn.dataset.copy;
        const ok = await write(text);
        const tip = btn.querySelector('.copy__tip');
        if (tip) tip.textContent = ok ? 'Copied' : 'Press \u2318C';
        status.textContent = ok ? text + ' copied to clipboard' : 'Could not copy ' + text;
        btn.classList.add('is-copied');
        clearTimeout(timer);
        timer = setTimeout(() => { btn.classList.remove('is-copied'); status.textContent = ''; }, 2000);
      });
    });
  }

  /* Forms: no backend yet, so compose a mailto: the visitor can send */
  document.querySelectorAll('[data-mailto]').forEach(form => {
    const msg = form.querySelector('[data-form-msg]');
    form.addEventListener('submit', e => {
      e.preventDefault();
      const required = Array.from(form.querySelectorAll('[required]'));
      let bad = null;
      required.forEach(f => {
        const ok = f.checkValidity() && f.value.trim() !== '';
        f.setAttribute('aria-invalid', String(!ok));
        if (!ok && !bad) bad = f;
      });
      if (bad) {
        if (msg) { msg.textContent = 'Please complete the highlighted fields.'; msg.className = msg.className.replace(/ ?form-msg--\w+/g, '') + ' form-msg--error'; }
        bad.focus();
        return;
      }
      const data = new FormData(form);
      const lines = [];
      data.forEach((v, k) => { if (String(v).trim()) lines.push(k.charAt(0).toUpperCase() + k.slice(1) + ': ' + v); });
      const subject = form.dataset.subject || 'Website enquiry';
      window.location.href = 'mailto:' + form.dataset.mailto +
        '?subject=' + encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(lines.join('\n'));
      if (msg) { msg.textContent = 'Opening your email app\u2026 if nothing happens, write to ' + form.dataset.mailto + '.'; msg.className = msg.className.replace(/ ?form-msg--\w+/g, '') + ' form-msg--ok'; }
    });
  });

  /* Hero slideshow: [data-slideshow] holding .slide figures, one .hero__tab per
     slide. Only slide 1 ships with a real
     src; the rest carry data-src. After window load only the next slide is
     fetched, one ahead of the show, so a long gallery never downloads all at
     once, and a slide is only shown once its image is in. The active tab runs
     an (invisible) CSS animation whose end advances the show, so pausing the
     animation pauses the timer. Reduced motion turns that animation off in
     the CSS, which is all it takes to stop autoplay. The controls are
     [data-slideshow-ui][hidden] in the markup, so without JS there are none
     to go dead. */
  document.querySelectorAll('[data-slideshow]').forEach(show => {
    const slides = Array.from(show.querySelectorAll('.slide'));
    const tabs = Array.from(show.querySelectorAll('.hero__tab'));
    const stage = show.querySelector('.hero__bg');
    if (slides.length < 2 || tabs.length !== slides.length) return;
    show.querySelectorAll('[data-slideshow-ui]').forEach(el => { el.hidden = false; });

    let current = 0, want = 0, loaded = false, hovered = false, focused = false;
    const imgOf = n => slides[n].querySelector('img');
    const fetchImg = n => { const img = imgOf(n); if (img.dataset.src) { img.src = img.dataset.src; img.removeAttribute('data-src'); } };
    const isReady = n => { const img = imgOf(n); return !!img.getAttribute('src') && img.complete && img.naturalWidth > 0; };
    const isBroken = n => { const img = imgOf(n); return !!img.getAttribute('src') && img.complete && !img.naturalWidth; };

    const setPaused = () => {
      const paused = hovered || focused || document.hidden;
      show.classList.toggle('is-paused', paused);
      // announce slide changes only while nothing is rotating on its own
      stage.setAttribute('aria-live', paused ? 'polite' : 'off');
    };
    const activate = n => {
      slides[current].classList.remove('is-active');
      tabs[current].removeAttribute('aria-current');
      tabs[current].classList.remove('is-running');
      current = n;
      slides[n].classList.add('is-active');
      tabs[n].setAttribute('aria-current', 'true');
      // restart the fill: a reflow between removing and adding replays it
      tabs[n].classList.remove('is-running');
      void tabs[n].offsetWidth;
      tabs[n].classList.add('is-running');
      if (loaded) fetchImg((n + 1) % slides.length);
    };
    const go = n => {
      want = n;
      if (isReady(n)) return activate(n);
      if (isBroken(n) && n !== current) return go((n + 1) % slides.length);
      fetchImg(n);
      const img = imgOf(n);
      img.addEventListener('load', () => { if (want === n) activate(n); }, { once: true });
      img.addEventListener('error', () => { if (want === n) go((n + 1) % slides.length); }, { once: true });
    };

    tabs.forEach((tab, n) => {
      tab.addEventListener('click', () => go(n));
      tab.addEventListener('animationend', e => { if (e.animationName === 'hero-fill' && n === current) go((n + 1) % slides.length); });
    });
    // hover pauses for a mouse only; a tap would otherwise leave it "hovered"
    show.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') { hovered = true; setPaused(); } });
    show.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') { hovered = false; setPaused(); } });
    // keyboard focus pauses; a mouse click on a tab shouldn't freeze the show
    show.addEventListener('focusin', e => { if (e.target.matches(':focus-visible')) { focused = true; setPaused(); } });
    show.addEventListener('focusout', e => { if (!show.contains(e.relatedTarget)) { focused = false; setPaused(); } });
    document.addEventListener('visibilitychange', setPaused);

    const preload = () => { loaded = true; fetchImg((current + 1) % slides.length); };
    if (document.readyState === 'complete') preload(); else window.addEventListener('load', preload, { once: true });
    setPaused();
    activate(0);
  });

  /* Lightbox: any element with [data-lightbox-group] containing <a href="full.jpg" data-caption="..."> */
  const groups = document.querySelectorAll('[data-lightbox-group]');
  if (groups.length) {
    const lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.setAttribute('aria-label', 'Image viewer');
    lb.innerHTML = `
      <div class="lightbox__bar"><span class="lightbox__count"></span><button type="button" data-lb-close>Close &times;</button></div>
      <div class="lightbox__stage"><img alt=""></div>
      <div class="lightbox__foot"><span class="lightbox__caption"></span><div class="lightbox__nav"><button type="button" data-lb-prev>&larr; Prev</button><button type="button" data-lb-next>Next &rarr;</button></div></div>`;
    document.body.appendChild(lb);
    const img = lb.querySelector('img'), cap = lb.querySelector('.lightbox__caption'), count = lb.querySelector('.lightbox__count');
    let items = [], i = 0, lastFocus = null;
    const show = (n) => {
      i = (n + items.length) % items.length;
      const a = items[i];
      img.src = a.getAttribute('href');
      img.alt = a.dataset.caption || (a.querySelector('img') && a.querySelector('img').alt) || '';
      cap.textContent = a.dataset.caption || '';
      count.textContent = String(i + 1).padStart(2, '0') + ' / ' + String(items.length).padStart(2, '0');
    };
    const open = (list, n) => { items = list; lastFocus = document.activeElement; lb.classList.add('is-open'); document.body.style.overflow = 'hidden'; show(n); lb.querySelector('[data-lb-close]').focus(); };
    const close = () => { lb.classList.remove('is-open'); document.body.style.overflow = ''; img.src = ''; if (lastFocus) lastFocus.focus(); };
    groups.forEach(g => {
      const links = Array.from(g.querySelectorAll('a[href]'));
      links.forEach((a, n) => a.addEventListener('click', e => { e.preventDefault(); open(links, n); }));
    });
    lb.querySelector('[data-lb-close]').addEventListener('click', close);
    lb.querySelector('[data-lb-prev]').addEventListener('click', () => show(i - 1));
    lb.querySelector('[data-lb-next]').addEventListener('click', () => show(i + 1));
    lb.addEventListener('click', e => { if (e.target === lb || e.target.classList.contains('lightbox__stage')) close(); });
    window.addEventListener('keydown', e => {
      if (!lb.classList.contains('is-open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') show(i - 1);
      if (e.key === 'ArrowRight') show(i + 1);
    });
  }
})();
