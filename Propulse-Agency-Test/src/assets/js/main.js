/* Propulse Agency — interactions & animations */
(function () {
  'use strict';

  var root = document.documentElement;
  root.classList.remove('no-js');
  root.classList.add('js');

  // Filet de sécurité : si une animation échoue, le contenu s'affiche quand même
  window.setTimeout(function () {
    var pre = document.querySelector('.preloader');
    if (pre && !pre.classList.contains('is-done')) {
      pre.classList.add('is-done');
      document.body.classList.remove('is-loading');
    }
  }, 10000);

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  var animate = hasGsap && !reduceMotion;
  var gsap = window.gsap;
  var ScrollTrigger = window.ScrollTrigger;

  if (!animate) root.classList.add('no-anim');
  if (hasGsap) {
    gsap.registerPlugin(ScrollTrigger);
    if (window.SplitText) gsap.registerPlugin(window.SplitText);
  }

  var $ = function (s, ctx) { return (ctx || document).querySelector(s); };
  var $$ = function (s, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(s)); };

  function store(kind, key, value) {
    try {
      var s = window[kind];
      if (value === undefined) return s.getItem(key);
      if (value === null) s.removeItem(key); else s.setItem(key, value);
    } catch (e) { return null; }
    return null;
  }

  /* ---------------------------------------------------------------
     Défilement fluide
     --------------------------------------------------------------- */
  var lenis = null;
  if (animate && window.Lenis) {
    lenis = new window.Lenis({ duration: 1.15, easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); }, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  function scrollToTarget(target) {
    if (lenis) lenis.scrollTo(target, { offset: -90, duration: 1.4 });
    else {
      var el = typeof target === 'number' ? null : target;
      if (el) el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      else window.scrollTo({ top: target, behavior: reduceMotion ? 'auto' : 'smooth' });
    }
  }

  // Ancres de la page courante (« #services » ou « /#services ») : défilement fluide
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href*="#"]');
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var url = new URL(a.href, window.location.href);
    if (url.origin !== window.location.origin || url.pathname !== window.location.pathname || !url.hash) return;
    var id = decodeURIComponent(url.hash.slice(1));
    var target = id === 'top' ? 0 : document.getElementById(id);
    if (target === null) return;
    e.preventDefault();
    if (typeof closeMenu === 'function') closeMenu();
    scrollToTarget(target);
    history.replaceState(null, '', url.hash);
  });

  var toTop = $('[data-to-top]');
  if (toTop) toTop.addEventListener('click', function () { scrollToTarget(0); });

  /* ---------------------------------------------------------------
     Préchargement & transitions de page
     --------------------------------------------------------------- */
  var preloader = $('.preloader');
  var panels = $$('.transition__panel');
  var cameFromTransition = store('sessionStorage', 'pa_transition') === '1';
  var firstVisit = store('sessionStorage', 'pa_visited') !== '1';
  store('sessionStorage', 'pa_transition', null);
  store('sessionStorage', 'pa_visited', '1');

  function introDone() {
    document.body.classList.remove('is-loading');
    playIntro();
    if (window.location.hash) {
      var t = document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
      if (t && t.id !== 'top') setTimeout(function () { scrollToTarget(t); }, 200);
    }
  }

  function runPreloader() {
    if (!animate) { preloader.classList.add('is-done'); introDone(); return; }
    if (!firstVisit || cameFromTransition) {
      preloader.classList.add('is-done');
      if (cameFromTransition) {
        gsap.set(panels, { scaleY: 1, transformOrigin: 'top' });
        gsap.to(panels, { scaleY: 0, duration: 0.7, ease: 'power3.inOut', stagger: 0.05, delay: 0.05 });
        setTimeout(introDone, 350);
      } else introDone();
      return;
    }
    document.body.classList.add('is-loading');
    if (lenis) lenis.stop();
    var count = $('[data-count]', preloader);
    var obj = { v: 0 };
    var tl = gsap.timeline({
      onComplete: function () {
        preloader.classList.add('is-done');
        if (lenis) lenis.start();
        introDone();
      }
    });
    tl.from('.preloader__word', { yPercent: 110, duration: 0.9, ease: 'power4.out' })
      .to(obj, { v: 100, duration: 1.4, ease: 'power2.inOut', onUpdate: function () { count.textContent = Math.round(obj.v); } }, 0.1)
      .to('.preloader__bar span', { scaleX: 1, duration: 1.4, ease: 'power2.inOut' }, 0.1)
      .to('.preloader__word', { yPercent: -110, duration: 0.7, ease: 'power4.in' }, '+=0.1')
      .to('.preloader__count, .preloader__bar', { opacity: 0, duration: 0.3 }, '<')
      .to(preloader, { clipPath: 'inset(0 0 100% 0)', duration: 0.9, ease: 'power4.inOut' }, '-=0.15');
  }

  function isInternal(a) {
    if (!a || a.target === '_blank' || a.hasAttribute('download')) return false;
    var href = a.getAttribute('href');
    if (!href || href.charAt(0) === '#' || /^(mailto:|tel:|javascript:)/i.test(href)) return false;
    var url = new URL(a.href, window.location.href);
    if (url.origin !== window.location.origin) return false;
    if (url.pathname === window.location.pathname) return false;
    return true;
  }

  if (animate) {
    document.addEventListener('click', function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target.closest('a');
      if (!isInternal(a)) return;
      e.preventDefault();
      var href = a.href;
      closeMenu(true);
      store('sessionStorage', 'pa_transition', '1');
      gsap.set(panels, { transformOrigin: 'bottom' });
      gsap.to(panels, {
        scaleY: 1, duration: 0.6, ease: 'power3.inOut', stagger: 0.05,
        onComplete: function () { window.location.href = href; }
      });
    });
    window.addEventListener('pageshow', function (e) {
      if (e.persisted) {
        gsap.set(panels, { scaleY: 0 });
        store('sessionStorage', 'pa_transition', null);
      }
    });
  }

  /* ---------------------------------------------------------------
     En-tête, progression & menu
     --------------------------------------------------------------- */
  var header = $('.header');
  var progress = $('.scroll-progress span');
  var lastY = 0;

  function onScroll() {
    var y = window.scrollY;
    header.classList.toggle('is-scrolled', y > 40);
    header.classList.toggle('is-hidden', y > lastY && y > 300 && !document.body.classList.contains('menu-open'));
    lastY = y;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.transform = 'scaleX(' + (max > 0 ? y / max : 0) + ')';
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  var burger = $('.burger');
  var menu = $('#menu');
  var menuOpen = false;

  function menuCircle(size) {
    var r = burger.getBoundingClientRect();
    return 'circle(' + size + '% at ' + Math.round(r.left + r.width / 2) + 'px ' + Math.round(r.top + r.height / 2) + 'px)';
  }

  function openMenu() {
    menuOpen = true;
    document.body.classList.add('menu-open');
    burger.setAttribute('aria-expanded', 'true');
    burger.setAttribute('aria-label', 'Fermer le menu');
    menu.removeAttribute('inert');
    menu.setAttribute('aria-hidden', 'false');
    if (lenis) lenis.stop();
    if (animate) {
      gsap.killTweensOf(['.menu__bg', '.menu__tile', '.menu__aside > *']);
      gsap.fromTo('.menu__bg', { clipPath: menuCircle(0) }, { clipPath: menuCircle(150), duration: 0.9, ease: 'power3.inOut' });
      gsap.fromTo('.menu__tile', { opacity: 0, y: 30, scale: 0.96 }, { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: 'power4.out', stagger: 0.05, delay: 0.3 });
      gsap.fromTo('.menu__aside > *', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.04, delay: 0.5 });
    } else {
      $('.menu__bg').style.clipPath = 'circle(150% at 100% 0)';
    }
    var first = $('.menu__nav a');
    if (first) setTimeout(function () { first.focus({ preventScroll: true }); }, 300);
  }

  function closeMenu(instant) {
    if (!menuOpen) return;
    menuOpen = false;
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Ouvrir le menu');
    menu.setAttribute('inert', '');
    menu.setAttribute('aria-hidden', 'true');
    if (lenis) lenis.start();
    var done = function () { document.body.classList.remove('menu-open'); };
    if (animate && !instant) {
      gsap.to('.menu__tile, .menu__aside > *', { opacity: 0, y: -16, duration: 0.35, ease: 'power3.in', stagger: 0.02 });
      gsap.to('.menu__bg', { clipPath: menuCircle(0), duration: 0.7, ease: 'power3.inOut', delay: 0.2, onComplete: function () { done(); gsap.set('.menu__bg', { clearProps: 'clipPath' }); } });
    } else if (!instant) {
      $('.menu__bg').style.clipPath = '';
      done();
    }
  }

  if (burger) {
    burger.addEventListener('click', function () { if (menuOpen) closeMenu(); else openMenu(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menuOpen) { closeMenu(); burger.focus(); }
    });
  }

  /* ---------------------------------------------------------------
     Curseur personnalisé & effets magnétiques
     --------------------------------------------------------------- */
  if (finePointer && !reduceMotion) {
    var cursor = $('.cursor');
    var dot = $('.cursor__dot');
    var ring = $('.cursor__ring');
    var label = $('.cursor__label');
    var pos = { x: -100, y: -100 };
    var ringPos = { x: -100, y: -100 };
    document.body.classList.add('has-cursor');

    window.addEventListener('pointermove', function (e) {
      pos.x = e.clientX; pos.y = e.clientY;
      dot.style.transform = 'translate3d(' + pos.x + 'px,' + pos.y + 'px,0)';
    }, { passive: true });

    (function loop() {
      ringPos.x += (pos.x - ringPos.x) * 0.18;
      ringPos.y += (pos.y - ringPos.y) * 0.18;
      ring.style.transform = 'translate3d(' + ringPos.x + 'px,' + ringPos.y + 'px,0)';
      requestAnimationFrame(loop);
    })();

    document.addEventListener('pointerover', function (e) {
      var labeled = e.target.closest('[data-cursor]');
      var hidden = e.target.closest('[data-cursor-hide]');
      var interactive = e.target.closest('a, button, label, summary, [data-magnetic]');
      cursor.classList.toggle('is-label', !!labeled);
      cursor.classList.toggle('is-hidden', !!hidden);
      cursor.classList.toggle('is-hover', !!interactive && !labeled);
      if (labeled) label.textContent = labeled.getAttribute('data-cursor');
    });
    document.addEventListener('pointerdown', function () { cursor.classList.add('is-down'); });
    document.addEventListener('pointerup', function () { cursor.classList.remove('is-down'); });
    document.addEventListener('pointerleave', function () { cursor.classList.add('is-hidden'); });
    document.addEventListener('pointerenter', function () { cursor.classList.remove('is-hidden'); });

    if (hasGsap) {
      $$('[data-magnetic]').forEach(function (el) {
        var strength = el.classList.contains('btn-orb') ? 0.45 : 0.3;
        var xTo = gsap.quickTo(el, 'x', { duration: 0.8, ease: 'elastic.out(1, 0.4)' });
        var yTo = gsap.quickTo(el, 'y', { duration: 0.8, ease: 'elastic.out(1, 0.4)' });
        el.addEventListener('pointermove', function (e) {
          var r = el.getBoundingClientRect();
          xTo((e.clientX - (r.left + r.width / 2)) * strength);
          yTo((e.clientY - (r.top + r.height / 2)) * strength);
        });
        el.addEventListener('pointerleave', function () { xTo(0); yTo(0); });
      });

      $$('[data-tilt]').forEach(function (el) {
        var target = el.closest('a, article') || el;
        var rx = gsap.quickTo(el, 'rotationX', { duration: 0.6, ease: 'power3.out' });
        var ry = gsap.quickTo(el, 'rotationY', { duration: 0.6, ease: 'power3.out' });
        gsap.set(el, { transformPerspective: 900 });
        target.addEventListener('pointermove', function (e) {
          var r = el.getBoundingClientRect();
          var px = (e.clientX - r.left) / r.width - 0.5;
          var py = (e.clientY - r.top) / r.height - 0.5;
          rx(-py * 8); ry(px * 10);
        });
        target.addEventListener('pointerleave', function () { rx(0); ry(0); });
      });
    }
  }

  $$('[data-spotlight]').forEach(function (el) {
    el.addEventListener('pointermove', function (e) {
      var r = el.getBoundingClientRect();
      el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      el.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  /* ---------------------------------------------------------------
     Animations de texte
     --------------------------------------------------------------- */
  var splitTitles = [];
  if (animate && window.SplitText) {
    $$('[data-split]').forEach(function (el) {
      var split = new window.SplitText(el, { type: 'lines', linesClass: 'split-line-inner', mask: 'lines' });
      gsap.set(split.lines, { yPercent: 135 });
      splitTitles.push({ el: el, inner: split.lines });
    });
  }

  function revealTitles() {
    splitTitles.forEach(function (s) {
      var inHero = s.el.closest('.page-hero');
      gsap.to(s.inner, {
        yPercent: 0, duration: 1.1, ease: 'power4.out', stagger: 0.09, delay: inHero ? 0.1 : 0,
        scrollTrigger: inHero ? null : { trigger: s.el, start: 'top 85%' }
      });
    });
  }

  function playIntro() {
    if (!animate) return;
    revealTitles();
    var hero = $('.hero');
    if (hero) {
      var tl = gsap.timeline();
      tl.from('.hero__title .line', { yPercent: 100, opacity: 0, duration: 1.2, ease: 'power4.out', stagger: 0.1 })
        .from('.hero__eyebrow, .hero__lead, .hero__ctas > *', { y: 30, opacity: 0, duration: 0.9, ease: 'power3.out', stagger: 0.06 }, '-=0.8')
        .from('.hero__pill', { scaleX: 0, duration: 1, ease: 'expo.out' }, '-=1');
      gsap.to('.hero__content', {
        yPercent: -18, opacity: 0.2, ease: 'none',
        scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true }
      });
    }
    $$('.page-hero .eyebrow, .page-hero__lead, .legal-updated').forEach(function (el, i) {
      gsap.from(el, { y: 30, opacity: 0, duration: 1, ease: 'power3.out', delay: 0.25 + i * 0.06 });
    });
    ScrollTrigger.refresh();
  }

  if (animate) {
    $$('[data-words]').forEach(function (el) {
      var words = el.textContent.trim().split(/\s+/);
      el.innerHTML = words.map(function (w) { return '<span class="w">' + w + '</span>'; }).join(' ');
      gsap.to($$('.w', el), {
        opacity: 1, ease: 'none', stagger: 0.1,
        scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 45%', scrub: 0.6 }
      });
    });

    ScrollTrigger.batch('.reveal-up', {
      start: 'top 90%',
      onEnter: function (els) { gsap.to(els, { opacity: 1, y: 0, duration: 1, ease: 'power3.out', stagger: 0.08, overwrite: true }); }
    });
    $$('.reveal-clip').forEach(function (el) {
      gsap.to(el, { clipPath: 'inset(0% 0 0 0)', duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 85%' } });
    });
    $$('[data-parallax]').forEach(function (el) {
      var amt = parseFloat(el.getAttribute('data-parallax')) || -10;
      gsap.fromTo(el, { yPercent: 0 }, { yPercent: amt, ease: 'none', scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
    });

    $$('.srv, .faq__chat, .stat-card, .footer__grid > *').forEach(function (el) {
      gsap.from(el, { y: 50, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 92%' } });
    });

  }

  /* ---------------------------------------------------------------
     Cartes empilées (méthode)
     --------------------------------------------------------------- */
  if (animate) {
    var cards = $$('.stack__card');
    gsap.matchMedia().add('(min-width: 861px)', function () {
      cards.forEach(function (card, i) {
        if (i === cards.length - 1) return;
        gsap.to(card, {
          scale: 0.94 + i * 0.015, filter: 'brightness(0.55)', ease: 'none',
          scrollTrigger: { trigger: cards[i + 1], start: 'top 65%', end: 'top 25%', scrub: true }
        });
      });
    });
    // Sur mobile, les étapes apparaissent simplement l'une après l'autre
    gsap.matchMedia().add('(max-width: 860px)', function () {
      cards.forEach(function (card) {
        gsap.from(card, { y: 50, opacity: 0, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: card, start: 'top 88%' } });
      });
    });
  }

  /* ---------------------------------------------------------------
     Traits sous les mots-clés des titres : dessinés à l'arrivée à l'écran
     --------------------------------------------------------------- */
  var swooshes = $$('.h2 em, .footer__title em, .page-hero__title em');
  if (hasGsap && swooshes.length) {
    root.classList.add('draw-ready');
    swooshes.forEach(function (em) {
      ScrollTrigger.create({ trigger: em, start: 'top 88%', once: true, onEnter: function () { em.classList.add('is-drawn'); } });
    });
  }

  /* Jauge de la méthode : se remplit quand l'étape apparaît */
  if (animate) {
    $$('.stack__track span').forEach(function (bar) {
      gsap.from(bar, { scaleX: 0, duration: 1.4, ease: 'power3.out', scrollTrigger: { trigger: bar, start: 'top 92%' } });
    });
  }

  /* ---------------------------------------------------------------
     Mode doux (« réduire les animations ») : simples fondus, sans mouvement
     --------------------------------------------------------------- */
  if (hasGsap && reduceMotion) {
    var soft = '.section-head, .manifesto__text, .srv, .agency__text, .agency__visual, .stat-card, .stack__card, .faq__chat, .contact > *';
    gsap.set(soft, { opacity: 0 });
    ScrollTrigger.batch(soft, {
      start: 'top 92%',
      onEnter: function (els) { gsap.to(els, { opacity: 1, duration: 0.8, ease: 'power1.out', stagger: 0.08 }); }
    });
  }

  /* ---------------------------------------------------------------
     Écrans tactiles : les services s'illuminent au passage
     --------------------------------------------------------------- */
  if (hasGsap && !finePointer) {
    $$('.srv').forEach(function (el) {
      ScrollTrigger.create({ trigger: el, start: 'top center', end: 'bottom center', toggleClass: 'is-active' });
    });
  }

  /* ---------------------------------------------------------------
     Compteurs & jauge
     --------------------------------------------------------------- */
  $$('[data-counter]').forEach(function (el) {
    var end = parseFloat(el.getAttribute('data-counter'));
    if (!hasGsap) { el.textContent = end; return; }
    var o = { v: 0 };
    gsap.to(o, {
      v: end, duration: 2, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%' },
      onUpdate: function () { el.textContent = Math.round(o.v); }
    });
  });
  $$('[data-gauge]').forEach(function (g) {
    var fg = $('.gauge__fg', g);
    if (!hasGsap) { fg.style.strokeDashoffset = 0; return; }
    gsap.to(fg, { strokeDashoffset: 0, duration: 2, ease: 'power3.out', scrollTrigger: { trigger: g, start: 'top 90%' } });
  });

  /* ---------------------------------------------------------------
     FAQ : conversation (questions suggérées, réponse après saisie)
     Sans JavaScript, toutes les questions et réponses restent affichées.
     --------------------------------------------------------------- */
  var faqChat = $('[data-faq]');
  if (faqChat) initFaq(faqChat);

  function initFaq(chat) {
    var section = chat.closest('.faq') || chat;
    var log = $('.faq__log', chat);
    var composer = $('.faq__composer', chat);
    var more = $('.faq__more', composer);
    var turns = $$('.faq__turn', log);
    var total = turns.length;
    if (total < 2 || !composer || !more) return;
    var asked = 1;
    var queue = [];
    var busy = false;
    var items = [];

    // La première question reste répondue ; les suivantes deviennent des suggestions
    var hint = document.createElement('p');
    hint.className = 'faq__hint mono';
    hint.id = 'faq-hint';
    hint.textContent = 'Choisissez une question';
    hint.setAttribute('aria-hidden', 'true');
    var chips = document.createElement('div');
    chips.className = 'faq__chips';
    chips.setAttribute('role', 'group');
    chips.setAttribute('aria-labelledby', 'faq-hint');
    turns.forEach(function (turn, i) {
      var answer = $('.faq__msg--pp', turn);
      items[i] = { turn: turn, answer: answer };
      if (i === 0) return;
      turn.removeChild(answer);
      log.removeChild(turn);
      var chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'faq__chip';
      chip.setAttribute('data-q', i);
      chip.innerHTML = '<span></span><span class="faq__chip-send" aria-hidden="true">↑</span>';
      // Même libellé que la question (mots composés insécables compris)
      $$('.faq__msg--you .faq__bubble', turn)[0].childNodes.forEach(function (n) { chip.firstChild.appendChild(n.cloneNode(true)); });
      chips.appendChild(chip);
    });
    composer.insertBefore(hint, more);
    composer.insertBefore(chips, more);
    section.classList.add('faq--live');
    progress();

    if (animate) {
      gsap.from($$('.faq__msg', log).concat(hint, $$('.faq__chip', chips), more), {
        y: 22, opacity: 0, duration: 0.8, ease: 'power3.out', stagger: 0.08, clearProps: 'transform,opacity',
        scrollTrigger: { trigger: chat, start: 'top 75%' }
      });
    }

    chips.addEventListener('click', function (e) {
      var chip = e.target.closest('.faq__chip');
      if (chip && chip.parentNode === chips) ask(chip);
    });

    function ask(chip) {
      var list = $$('.faq__chip', chips);
      var idx = list.indexOf(chip);
      var hadFocus = document.activeElement === chip;
      var from = animate && !busy ? chip.getBoundingClientRect() : null;
      var before = animate ? list.map(function (c) { return c.getBoundingClientRect(); }) : null;
      chips.removeChild(chip);
      var rest = $$('.faq__chip', chips);
      // Les suggestions restantes glissent à leur nouvelle place
      if (animate) {
        rest.forEach(function (c) {
          var r0 = before[list.indexOf(c)];
          var r1 = c.getBoundingClientRect();
          if (Math.abs(r0.left - r1.left) > 1 || Math.abs(r0.top - r1.top) > 1) {
            gsap.fromTo(c, { x: r0.left - r1.left, y: r0.top - r1.top }, { x: 0, y: 0, duration: 0.6, ease: 'power3.inOut', clearProps: 'transform' });
          }
        });
      }
      if (!rest.length) {
        composer.removeChild(hint);
        composer.removeChild(chips);
        section.classList.add('faq--done');
      }
      // Le focus clavier passe à la suggestion suivante (ou au lien de contact)
      if (hadFocus) {
        var target = rest[Math.min(idx, rest.length - 1)] || $('a', more);
        if (target) target.focus({ preventScroll: true });
      }
      queue.push({ item: items[+chip.getAttribute('data-q')], chip: chip, from: from });
      if (!busy) next();
    }

    function next() {
      var job = queue.shift();
      if (!job) { busy = false; return; }
      busy = true;
      var turn = job.item.turn;
      var answer = job.item.answer;
      if (!animate) {
        log.appendChild(turn);
        turn.appendChild(answer);
        finish(turn, 0);
        return;
      }
      var q = $('.faq__msg--you', turn);
      var typing = typingMsg();
      var h0 = log.offsetHeight;
      log.appendChild(turn);
      turn.appendChild(typing);
      grow(h0);
      if (job.from) fly(job.chip, job.from, $('.faq__bubble', q));
      else gsap.from($('.faq__bubble', q), { y: 20, opacity: 0, duration: 0.6, ease: 'power3.out', clearProps: 'transform,opacity' });
      gsap.from($('.faq__who', q), { opacity: 0, duration: 0.4, delay: 0.45, clearProps: 'opacity' });
      gsap.from(typing, { opacity: 0, y: 10, duration: 0.45, delay: 0.55, ease: 'power2.out' });
      setTimeout(function () {
        var h1 = log.offsetHeight;
        turn.replaceChild(answer, typing);
        var pending = grow(h1);
        gsap.from($('.faq__bubble', answer), { opacity: 0, y: 12, scale: 0.98, transformOrigin: '0% 100%', duration: 0.7, ease: 'power3.out', clearProps: 'transform,opacity' });
        finish(turn, pending);
      }, 1700);
    }

    function finish(turn, pending) {
      asked++;
      progress();
      follow(turn, pending);
      if (animate) setTimeout(next, 500); else next();
    }

    function progress() {
      chat.style.setProperty('--p', asked / total);
    }

    function typingMsg() {
      var m = document.createElement('div');
      m.className = 'faq__msg faq__msg--pp';
      m.setAttribute('aria-hidden', 'true');
      m.innerHTML = '<span class="faq__avatar"></span><span class="faq__who mono">ProPulse</span><div class="faq__bubble faq__typing"><span></span><span></span><span></span></div>';
      return m;
    }

    // Hauteur du fil animée : la zone des suggestions glisse au lieu de sauter
    function grow(h0) {
      gsap.killTweensOf(log);
      log.style.height = '';
      log.style.overflow = '';
      var h1 = log.offsetHeight;
      if (Math.abs(h1 - h0) < 2) return 0;
      log.style.overflow = 'hidden';
      gsap.fromTo(log, { height: h0 }, {
        height: h1, duration: 0.65, ease: 'power3.inOut',
        onComplete: function () { log.style.height = ''; log.style.overflow = ''; ScrollTrigger.refresh(); }
      });
      return h1 - h0;
    }

    // La suggestion « s'envoie » : elle rejoint la place de la question dans le fil
    function fly(chip, from, bubble) {
      var to = bubble.getBoundingClientRect();
      var ghost = chip.cloneNode(true);
      ghost.classList.add('is-ghost');
      ghost.removeAttribute('data-q');
      ghost.setAttribute('aria-hidden', 'true');
      ghost.tabIndex = -1;
      ghost.style.cssText = 'left:' + from.left + 'px;top:' + from.top + 'px;width:' + from.width + 'px;height:' + from.height + 'px;';
      document.body.appendChild(ghost);
      gsap.set(bubble, { opacity: 0 });
      var tl = gsap.timeline({ onComplete: function () { ghost.remove(); gsap.set(bubble, { clearProps: 'opacity,transform' }); } });
      var k = Math.max(0.9, Math.min(to.height / from.height, 1.2));
      tl.to(ghost, { x: to.right - from.right, y: to.bottom - from.bottom, scale: k, transformOrigin: '100% 100%', duration: 0.7, ease: 'power3.inOut' }, 0)
        .to(ghost, { borderColor: 'rgba(255, 248, 225, .46)', color: '#FFF8E1', duration: 0.4 }, 0)
        .to($('.faq__chip-send', ghost), { scale: 0.4, opacity: 0, duration: 0.3, ease: 'power2.in' }, 0.05)
        .to(ghost, { opacity: 0, duration: 0.18 }, 0.56)
        .fromTo(bubble, { opacity: 0, scale: 0.97, transformOrigin: '100% 100%' }, { opacity: 1, scale: 1, duration: 0.3, ease: 'power2.out' }, 0.54);
    }

    // Garde la nouvelle réponse (et les suggestions suivantes) à l'écran
    function follow(turn, pending) {
      var box = chat.getBoundingClientRect();
      if (box.bottom < 0 || box.top > window.innerHeight) return;
      var header = $('.header');
      var minTop = (header ? header.offsetHeight : 0) + 16;
      var top = turn.getBoundingClientRect().top;
      var anchor = chips.parentNode ? chips : more;
      var want = anchor.getBoundingClientRect().top + (pending || 0) + Math.min(anchor.offsetHeight, 120);
      var d = 0;
      if (top < minTop) d = top - minTop;
      else if (want > window.innerHeight - 20) d = Math.min(want - (window.innerHeight - 20), top - minTop);
      if (Math.abs(d) < 4) return;
      if (lenis) lenis.scrollTo(window.scrollY + d, { duration: 1 });
      else window.scrollTo({ top: window.scrollY + d, behavior: reduceMotion ? 'auto' : 'smooth' });
    }
  }

  /* ---------------------------------------------------------------
     Horloge (heure belge)
     --------------------------------------------------------------- */
  var clock = $('[data-clock]');
  if (clock) {
    var fmt = new Intl.DateTimeFormat('fr-BE', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Brussels' });
    var tick = function () { clock.textContent = fmt.format(new Date()); };
    tick();
    setInterval(tick, 15000);
  }

  /* ---------------------------------------------------------------
     Sommaire des pages légales
     --------------------------------------------------------------- */
  var tocLinks = $$('.legal__toc a');
  if (tocLinks.length && 'IntersectionObserver' in window) {
    var byId = {};
    tocLinks.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          tocLinks.forEach(function (a) { a.classList.remove('is-active'); });
          if (byId[en.target.id]) byId[en.target.id].classList.add('is-active');
        }
      });
    }, { rootMargin: '-20% 0px -70% 0px' });
    Object.keys(byId).forEach(function (id) { var s = document.getElementById(id); if (s) io.observe(s); });
  }

  /* ---------------------------------------------------------------
     Formulaire de contact
     --------------------------------------------------------------- */
  var form = $('[data-contact-form]');
  if (form) {
    var status = $('.form__status', form);
    var submit = $('button[type="submit"]', form);
    var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    var setError = function (name, msg) {
      var input = form.elements[name];
      var err = document.getElementById('f-' + name + '-err');
      var field = input.closest('.field');
      if (field) field.classList.toggle('is-invalid', !!msg);
      input.setAttribute('aria-invalid', msg ? 'true' : 'false');
      if (err) {
        err.textContent = msg || '';
        if (msg) input.setAttribute('aria-describedby', err.id); else input.removeAttribute('aria-describedby');
      }
      return !msg;
    };

    // Une règle par champ : chaque champ n'est vérifié que lorsqu'on le quitte
    var rules = {
      name: function (v) { return v.length < 2 ? 'Merci d\'indiquer votre nom.' : ''; },
      email: function (v) { return !emailRe.test(v) ? 'Merci d\'indiquer une adresse e-mail valide.' : ''; },
      message: function (v) { return v.length < 10 ? 'Décrivez votre projet en quelques mots (10 caractères minimum).' : ''; }
    };

    var validate = function () {
      var ok = true;
      Object.keys(rules).forEach(function (n) { ok = setError(n, rules[n](form.elements[n].value.trim())) && ok; });
      ok = setError('privacy', !form.elements.privacy.checked ? 'Merci de confirmer avoir pris connaissance de la politique de confidentialité.' : '') && ok;
      return ok;
    };

    Object.keys(rules).forEach(function (n) {
      var el = form.elements[n];
      el.addEventListener('blur', function () { var v = el.value.trim(); if (v) setError(n, rules[n](v)); });
      el.addEventListener('input', function () { if (el.getAttribute('aria-invalid') === 'true' && !rules[n](el.value.trim())) setError(n, ''); });
    });
    form.elements.privacy.addEventListener('change', function () { if (this.checked) setError('privacy', ''); });

    var collect = function () {
      return {
        name: form.elements.name.value.trim(),
        email: form.elements.email.value.trim(),
        company: form.elements.company.value.trim(),
        phone: form.elements.phone.value.trim(),
        message: form.elements.message.value.trim(),
        services: $$('input[name="services"]:checked', form).map(function (i) { return i.value; }),
        budget: (($('input[name="budget"]:checked', form) || {}).value) || '',
        website: form.elements.website.value,
        privacy: form.elements.privacy.checked
      };
    };

    var mailtoFallback = function (data) {
      var to = form.getAttribute('data-mailto');
      var body = [
        'Nom : ' + data.name,
        'E-mail : ' + data.email,
        data.company ? 'Entreprise : ' + data.company : '',
        data.phone ? 'Téléphone : ' + data.phone : '',
        data.services.length ? 'Services : ' + data.services.join(', ') : '',
        data.budget ? 'Budget : ' + data.budget : '',
        '',
        data.message
      ].filter(function (l, i) { return l !== '' || i === 6; }).join('\n');
      window.location.href = 'mailto:' + to + '?subject=' + encodeURIComponent('Demande de projet — ' + data.name) + '&body=' + encodeURIComponent(body);
    };

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      status.className = 'form__status';
      status.textContent = '';
      if (!validate()) {
        var firstInvalid = $('[aria-invalid="true"]', form);
        if (firstInvalid) firstInvalid.focus();
        return;
      }
      var data = collect();
      submit.classList.add('is-loading');
      status.textContent = 'Envoi en cours…';
      fetch(form.getAttribute('action'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (json) { return { ok: res.ok, status: res.status, json: json }; });
      }).then(function (r) {
        submit.classList.remove('is-loading');
        if (r.ok) {
          form.reset();
          status.classList.add('is-success');
          status.textContent = 'Merci ! Votre message est bien parti. Nous revenons vers vous très vite.';
          if (animate) gsap.fromTo(status, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 });
        } else if (r.status !== 422 && r.status !== 502) {
          // Envoi en ligne indisponible (non configuré ou absent chez l'hébergeur) : messagerie du visiteur
          status.textContent = 'Ouverture de votre messagerie…';
          mailtoFallback(data);
        } else {
          status.classList.add('is-error');
          status.textContent = (r.json && r.json.error) || 'Une erreur est survenue. Vous pouvez aussi nous écrire directement par e-mail.';
        }
      }).catch(function () {
        submit.classList.remove('is-loading');
        status.textContent = 'Ouverture de votre messagerie…';
        mailtoFallback(data);
      });
    });
  }

  /* ---------------------------------------------------------------
     Démarrage
     --------------------------------------------------------------- */
  var start = function () {
    if (preloader) runPreloader(); else introDone();
  };
  if (document.fonts && document.fonts.ready) {
    Promise.race([document.fonts.ready, new Promise(function (r) { setTimeout(r, 1200); })]).then(start);
  } else start();

  window.addEventListener('load', function () { if (hasGsap) ScrollTrigger.refresh(); });
})();
