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

  /* Header: solid once scrolled, hide on scroll down, show on scroll up */
  if (header) {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      header.classList.toggle('is-scrolled', y > 24);
      if (!document.body.classList.contains('menu-open')) {
        header.classList.toggle('is-hidden', y > last && y > 240);
      }
      last = y;
    };
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
