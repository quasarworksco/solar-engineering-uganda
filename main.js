/* Solar Engineering UG — interactions (GSAP + ScrollTrigger + Lenis) */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const root = document.documentElement;
  const body = document.body;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const hasGsap = !!(window.gsap && window.ScrollTrigger);
  const motion = hasGsap && !reduced;
  const i18n = window.SEUG_I18N || { lang: "en", t: () => "", apply: () => {} };
  const WA = "256708755776";
  const EMAIL = "Solarengineeringug@gmail.com";

  if (!motion) root.classList.add("no-motion");
  if (hasGsap) gsap.registerPlugin(ScrollTrigger);
  $("#year").textContent = new Date().getFullYear();

  /* ---------- Button text roll ---------- */
  const wrapButtons = () => $$(".btn__text").forEach((t) => {
    if (t.firstElementChild?.tagName === "I") return;
    const label = t.textContent.trim();
    t.innerHTML = `<i data-text="${label.replace(/"/g, "&quot;")}">${label}</i>`;
  });
  wrapButtons();

  /* ---------- WhatsApp links carry a message in the current language ---------- */
  const waUrl = (text) => `https://wa.me/${WA}?text=${encodeURIComponent(text)}`;
  const paintWaLinks = () => {
    $$("[data-wa]").forEach((a) => (a.href = waUrl(a.dataset.wa === "projects" ? i18n.t("waProjects") : i18n.t("waQuote"))));
    $$("[data-ask]").forEach((a) => {
      const name = a.closest(".pcard")?.querySelector("h3")?.textContent.trim() || a.dataset.ask;
      a.href = waUrl(i18n.t("waAsk")(name));
      a.target = "_blank";
      a.rel = "noopener";
    });
  };
  paintWaLinks();

  /* ---------- Smooth scroll ---------- */
  let lenis = null;
  if (motion && window.Lenis) {
    lenis = new Lenis({ duration: 1.15, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  /* ---------- Mobile menu ---------- */
  const burger = $(".burger");
  const menu = $("#mobile-menu");
  const setMenu = (open) => {
    body.classList.toggle("menu-open", open);
    burger.setAttribute("aria-expanded", open);
    burger.setAttribute("aria-label", open ? i18n.t("menuClose") : i18n.t("menuOpen"));
    menu.setAttribute("aria-hidden", !open);
    if (lenis) open ? lenis.stop() : lenis.start();
    else body.style.overflow = open ? "hidden" : "";
  };
  burger.addEventListener("click", () => setMenu(!body.classList.contains("menu-open")));
  addEventListener("keydown", (e) => e.key === "Escape" && setMenu(false));

  /* ---------- Anchor links ---------- */
  $$('a[href^="#"]').forEach((a) => a.addEventListener("click", (e) => {
    const id = a.getAttribute("href");
    if (id === "#") return;
    const target = $(id);
    if (!target) return;
    e.preventDefault();
    const wasOpen = body.classList.contains("menu-open");
    setMenu(false);
    const go = () => (lenis ? lenis.scrollTo(target, { duration: 1.6, offset: id === "#top" ? 0 : -10 }) : target.scrollIntoView({ behavior: reduced ? "auto" : "smooth" }));
    wasOpen ? setTimeout(go, 450) : go();
  }));

  /* ---------- Social icons without a URL yet do nothing when clicked ---------- */
  $$('.socials a[href="#"]').forEach((a) => { a.removeAttribute("target"); a.addEventListener("click", (e) => e.preventDefault()); });

  /* ---------- Service rows prefill the form ---------- */
  $$(".srow").forEach((row) => row.addEventListener("click", (e) => {
    const go = $(".srow__go", row);
    const sel = $("#f-service");
    if (sel) sel.value = go.dataset.service;
    if (e.target.closest(".srow__go")) return; // anchor handler scrolls
    go.click();
  }));

  /* ---------- Images only needed on hover: load after the page ---------- */
  const lateImages = () => $$("img[data-src]").forEach((img) => { img.src = img.dataset.src; img.removeAttribute("data-src"); });
  if (finePointer && innerWidth > 900) {
    document.readyState === "complete" ? lateImages() : addEventListener("load", lateImages, { once: true });
  }

  /* ---------- Hero word rotator ---------- */
  let rotatorTimer = null;
  const startRotator = () => {
    if (reduced || rotatorTimer) return;
    const items = $$(".rotator__item");
    let i = 0;
    rotatorTimer = setInterval(() => {
      const cur = items[i];
      cur.classList.replace("is-active", "is-leaving");
      setTimeout(() => cur.classList.remove("is-leaving"), 1000);
      i = (i + 1) % items.length;
      items[i].classList.add("is-active");
    }, 2600);
  };

  /* ---------- Split text into masked words (keeps <em>) ---------- */
  const splitWords = (el) => {
    const inners = [];
    const frag = document.createDocumentFragment();
    [...el.childNodes].forEach((node) => {
      const tag = node.nodeType === 1 ? node.tagName.toLowerCase() : null;
      if (tag === "br") { frag.appendChild(document.createElement("br")); return; }
      node.textContent.split(/\s+/).filter(Boolean).forEach((word) => {
        if (/^[.,;:!?]+$/.test(word) && inners.length) { inners[inners.length - 1].append(word); return; }
        const mask = document.createElement("span");
        mask.className = "w-mask";
        const inner = document.createElement("span");
        inner.className = "w-in";
        if (tag) { const t = document.createElement(tag); t.textContent = word; inner.appendChild(t); }
        else inner.textContent = word;
        mask.appendChild(inner);
        frag.append(mask, " ");
        inners.push(inner);
      });
    });
    el.textContent = "";
    el.appendChild(frag);
    return inners;
  };

  /* ---------- Contact form → WhatsApp / email ---------- */
  const form = $("#quote-form");
  const status = $(".form__status", form);
  const readForm = () => {
    const f = form.elements;
    const name = f.name.value.trim();
    const phone = f.phone.value.trim();
    const service = f.service.value;
    const fields = [[f.name, name.length >= 2, "errName"], [f.phone, phone.replace(/\D/g, "").length >= 9, "errPhone"], [f.service, !!service, "errService"]];
    for (const [input, ok, msg] of fields) {
      input.closest(".field").classList.toggle("has-error", !ok);
      if (!ok) { input.focus(); status.textContent = i18n.t(msg); return null; }
    }
    const serviceLabel = f.service.selectedOptions[0].textContent.trim();
    const lines = [
      `• ${i18n.t("fName")}: ${name}`,
      `• ${i18n.t("fPhone")}: ${phone}`,
      `• ${i18n.t("fService")}: ${serviceLabel}`,
      f.location.value.trim() && `• ${i18n.t("fLoc")}: ${f.location.value.trim()}`,
      f.message.value.trim() && `• ${i18n.t("fMsg")}: ${f.message.value.trim()}`,
    ].filter(Boolean);
    return [i18n.t("formHead"), "", ...lines].join("\n");
  };
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = readForm();
    if (!text) return;
    window.open(waUrl(text), "_blank", "noopener");
    status.textContent = i18n.t("okWa");
  });
  $("[data-mail]", form).addEventListener("click", () => {
    const text = readForm();
    if (!text) return;
    location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(i18n.t("mailSubject"))}&body=${encodeURIComponent(text)}`;
    status.textContent = i18n.t("okMail");
  });
  $$("input, select, textarea", form).forEach((el) => el.addEventListener("input", () => { el.closest(".field").classList.remove("has-error"); status.textContent = ""; }));

  /* ---------- Fallback: no GSAP or reduced motion ---------- */
  const wa = $(".wa-float");
  const nav = $(".nav");
  if (!motion) {
    $(".preloader")?.remove();
    startRotator();
    $$(".step").forEach((s) => s.classList.add("is-in"));
    let lastY = 0;
    addEventListener("scroll", () => {
      const y = scrollY;
      wa.classList.toggle("is-visible", y > innerHeight * 0.5);
      nav.classList.toggle("is-hidden", y > lastY && y > innerHeight && !body.classList.contains("menu-open"));
      nav.classList.toggle("is-solid", y > 60);
      lastY = y;
    }, { passive: true });
  }

  /* ---------- Language switch ---------- */
  const afterLang = () => { wrapButtons(); paintWaLinks(); nav.classList.toggle("is-solid", scrollY > 60); };
  let switching = false;
  $$(".lang__btn").forEach((b) => b.addEventListener("click", () => {
    const lang = b.dataset.lang;
    if (lang === i18n.lang || switching) return;
    if (!motion) { i18n.apply(lang); afterLang(); return; }
    switching = true;
    const curtain = $(".curtain");
    gsap.timeline({ onComplete: () => (switching = false) })
      .set(curtain, { transformOrigin: "bottom" })
      .to(curtain, { scaleY: 1, duration: 0.55, ease: "expo.inOut" })
      .to(curtain, { "--o": 1, duration: 0.2 }, "-=0.2")
      .add(() => { i18n.apply(lang); afterLang(); ScrollTrigger.refresh(); })
      .set(curtain, { transformOrigin: "top" })
      .to(curtain, { "--o": 0, duration: 0.15 })
      .to(curtain, { scaleY: 0, duration: 0.7, ease: "expo.inOut" }, "+=0.05")
      .from(".hero__title .line__in", { yPercent: 110, duration: 1, stagger: 0.08, ease: "expo.out" }, "-=0.45");
  }));
  if (!motion) document.addEventListener("langchange", afterLang);

  /* =========================================================
     Motion (GSAP)
     ========================================================= */
  if (motion) {
    const expo = "expo.out";

    /* ---------- Preloader + hero intro ---------- */
    const pre = $(".preloader");
    body.classList.add("is-loading");
    lenis?.stop();

    // sunrise art: build the sun rays and the panel cells (perspective grid like the logo)
    const NS = "http://www.w3.org/2000/svg";
    const svgEl = (tag, attrs) => { const e = document.createElementNS(NS, tag); Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v)); return e; };
    const rays = $(".pl-rays");
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      rays.appendChild(svgEl("line", { x1: 160 + Math.cos(a) * 36, y1: 104 + Math.sin(a) * 36, x2: 160 + Math.cos(a) * 50, y2: 104 + Math.sin(a) * 50 }));
    }
    const panel = $(".pl-panel");
    const [TL, TR, BR, BL] = [[104, 120], [216, 120], [250, 186], [70, 186]];
    const at = (u, v) => [0, 1].map((k) => (1 - v) * ((1 - u) * TL[k] + u * TR[k]) + v * ((1 - u) * BL[k] + u * BR[k]));
    const COLS = 7, ROWS = 3, G = 0.018;
    const cells = [];
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const u0 = c / COLS + G, u1 = (c + 1) / COLS - G, v0 = r / ROWS + G * 2, v1 = (r + 1) / ROWS - G * 2;
      const pts = [at(u0, v0), at(u1, v0), at(u1, v1), at(u0, v1)].map((p) => p.map((n) => n.toFixed(1)).join(",")).join(" ");
      const poly = svgEl("polygon", { points: pts });
      poly.dataset.d = c + r; // diagonal order for the light wave
      panel.appendChild(poly);
      cells.push(poly);
    }
    cells.sort((a, b) => a.dataset.d - b.dataset.d);

    gsap.set(".hero__media img", { scale: 1.3 });
    gsap.set(".hero__title .line__in", { yPercent: 115 });
    gsap.set("[data-hero]", { y: 30, autoAlpha: 0 });
    gsap.set(nav, { yPercent: -100, autoAlpha: 0 });
    gsap.set(".marquee", { yPercent: 60, autoAlpha: 0 });

    let seen = false;
    try { seen = !!sessionStorage.getItem("seug-intro"); sessionStorage.setItem("seug-intro", "1"); } catch (e) {}
    const t = seen ? 0 : 2.05;

    gsap.set(".pl-horizon", { strokeDasharray: 300, strokeDashoffset: 300 });
    gsap.set(".pl-sun", { y: 74 });
    gsap.set(".pl-rays", { scale: 0.6, rotate: -30, transformOrigin: "160px 104px" });
    gsap.set(cells, { autoAlpha: 0, y: 8 });
    gsap.set(".preloader__brand span, .preloader__tag", { yPercent: 110, autoAlpha: 0 });

    const intro = gsap.timeline({ paused: true });
    if (seen) {
      intro.to(pre, { autoAlpha: 0, duration: 0.4, ease: "power2.out" }, 0);
    } else {
      intro
        // the horizon draws, the sun rises behind it
        .to(".pl-horizon", { strokeDashoffset: 0, duration: 0.7, ease: "power3.inOut" }, 0)
        .to(".pl-sun", { y: 0, duration: 1.3, ease: "power3.out" }, 0.25)
        .to(".pl-rays", { scale: 1, rotate: 30, duration: 1.6, ease: "power2.out" }, 0.3)
        // the panel appears and charges with a wave of sunlight
        .to(cells, { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.025, ease: "power3.out" }, 0.35)
        .to(cells, { keyframes: [{ fill: "#ffc61a", duration: 0.18 }, { fill: "#2fa53e", duration: 0.4 }], stagger: 0.035, ease: "power1.inOut" }, 0.85)
        .to(".preloader__brand span", { yPercent: 0, autoAlpha: 1, duration: 0.9, stagger: 0.07, ease: expo }, 0.45)
        .to(".preloader__tag", { yPercent: 0, autoAlpha: 1, duration: 0.9, ease: expo }, 0.7)
        // everything fades and the screen opens along the horizon
        .to(".preloader__stage", { autoAlpha: 0, scale: 0.94, duration: 0.45, ease: "power2.in" }, 1.6)
        .to(".preloader__half--top", { yPercent: -100, duration: 1, ease: "expo.inOut" }, 1.75)
        .to(".preloader__half--bot", { yPercent: 100, duration: 1, ease: "expo.inOut" }, 1.75);
    }
    intro
      .to(".hero__media img", { scale: 1, duration: 2.4, ease: expo }, t + 0.05)
      .to(".hero__title .line__in", { yPercent: 0, duration: 1.4, stagger: 0.1, ease: expo }, t + 0.25)
      .to("[data-hero]", { y: 0, autoAlpha: 1, duration: 1.2, stagger: 0.08, ease: expo }, t + 0.45)
      .to(nav, { yPercent: 0, autoAlpha: 1, duration: 1.1, ease: expo, clearProps: "transform" }, t + 0.4)
      .to(".marquee", { yPercent: 0, autoAlpha: 1, duration: 1.2, ease: expo }, t + 0.7)
      .add(() => {
        pre.remove();
        body.classList.remove("is-loading");
        lenis?.start();
        startRotator();
        ScrollTrigger.refresh();
      }, t + 0.75);

    let started = false;
    const play = () => { if (!started) { started = true; intro.play(); } };
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(play);
    setTimeout(play, 900);

    /* ---------- Hero parallax + glow following the pointer ---------- */
    gsap.to(".hero__media", { yPercent: 18, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
    gsap.to(".hero__content", { y: -90, autoAlpha: 0.15, ease: "none", scrollTrigger: { trigger: ".hero", start: "35% top", end: "bottom top", scrub: true } });
    if (finePointer) {
      const glow = $(".hero__glow");
      const gx = gsap.quickTo(glow, "x", { duration: 1.6, ease: "power3" });
      const gy = gsap.quickTo(glow, "y", { duration: 1.6, ease: "power3" });
      $(".hero").addEventListener("mousemove", (e) => { gx((e.clientX / innerWidth - 0.5) * 120); gy((e.clientY / innerHeight - 0.5) * 90); });
    }

    /* ---------- Nav hide/show, active link & WhatsApp ---------- */
    ScrollTrigger.create({
      start: 0, end: "max",
      onUpdate: (s) => {
        const y = s.scroll();
        nav.classList.toggle("is-hidden", s.direction === 1 && y > innerHeight && !body.classList.contains("menu-open"));
        nav.classList.toggle("is-solid", y > 60);
        wa.classList.toggle("is-visible", y > innerHeight * 0.5);
      },
    });
    $$(".nav__links a").forEach((a) => {
      const sec = $(a.getAttribute("href"));
      if (sec) ScrollTrigger.create({ trigger: sec, start: "top 50%", end: "bottom 50%", onToggle: (s) => a.classList.toggle("is-current", s.isActive) });
    });

    /* ---------- Headings: masked word reveal (re-built when language changes) ---------- */
    const splitTweens = new Map();
    const buildSplit = (el, instant) => {
      splitTweens.get(el)?.scrollTrigger?.kill();
      splitTweens.get(el)?.kill();
      const words = splitWords(el);
      if (instant) { splitTweens.delete(el); return; }
      splitTweens.set(el, gsap.from(words, {
        yPercent: 115, rotate: 4, duration: 1.4, stagger: 0.06, ease: expo,
        scrollTrigger: { trigger: el, start: "top 86%" },
      }));
    };
    $$("[data-split]").forEach((el) => buildSplit(el));

    /* ---------- Intro: words light up with scroll ---------- */
    let introTween = null;
    const buildIntro = () => {
      introTween?.scrollTrigger?.kill();
      introTween?.kill();
      const words = splitWords($("[data-words]"));
      introTween = gsap.fromTo(words, { opacity: 0.14 }, {
        opacity: 1, stagger: 0.1, ease: "none",
        scrollTrigger: { trigger: ".intro__text", start: "top 82%", end: "bottom 45%", scrub: true },
      });
    };
    buildIntro();

    document.addEventListener("langchange", () => {
      $$("[data-split]").forEach((el) => {
        const r = el.getBoundingClientRect();
        buildSplit(el, r.top < innerHeight * 0.86); // already seen → show instantly
      });
      buildIntro();
    });

    /* ---------- Generic reveal (batched) ---------- */
    gsap.set("[data-reveal]", { y: 60, autoAlpha: 0 });
    ScrollTrigger.batch("[data-reveal]", {
      start: "top 92%",
      onEnter: (batch) => gsap.to(batch, { y: 0, autoAlpha: 1, duration: 1.3, stagger: 0.08, ease: expo, overwrite: true }),
    });

    /* ---------- About image: curtain + parallax ---------- */
    gsap.fromTo(".about__frame", { clipPath: "inset(100% 0% 0% 0% round 14px)" }, {
      clipPath: "inset(0% 0% 0% 0% round 14px)", duration: 1.8, ease: "expo.inOut",
      scrollTrigger: { trigger: ".about__frame", start: "top 82%" },
    });
    $$("[data-speed]").forEach((img) => {
      const amt = +img.dataset.speed * 100;
      gsap.fromTo(img, { yPercent: -amt / 2 }, { yPercent: amt / 2 - 8, ease: "none", scrollTrigger: { trigger: img.parentElement, start: "top bottom", end: "bottom top", scrub: true } });
    });
    gsap.from(".badge", { scale: 0, rotate: -120, duration: 1.4, ease: "back.out(1.6)", scrollTrigger: { trigger: ".about__frame", start: "top 55%" } });

    /* ---------- Marquee reacts to scroll speed/direction ---------- */
    const mTrack = $(".marquee__track");
    let mx = 0, dir = 1, boost = 0;
    ScrollTrigger.create({
      start: 0, end: "max",
      onUpdate: (s) => { dir = s.direction === 1 ? 1 : -1; boost = Math.min(8, Math.abs(s.getVelocity()) / 250); },
    });
    gsap.ticker.add(() => {
      boost *= 0.93;
      mx -= (0.04 + boost * 0.09) * dir;
      if (mx <= -50) mx += 50;
      if (mx > 0) mx -= 50;
      gsap.set(mTrack, { xPercent: mx, skewX: boost * dir * 0.9 });
    });

    /* ---------- Counters ---------- */
    $$("[data-count]").forEach((el) => {
      const end = +el.dataset.count;
      const o = { v: 0 };
      el.textContent = "0";
      gsap.to(o, { v: end, duration: 2.2, ease: "power3.out", onUpdate: () => (el.textContent = Math.round(o.v)), scrollTrigger: { trigger: el, start: "top 90%" } });
    });

    /* ---------- Services: floating preview follows cursor ---------- */
    if (finePointer && innerWidth > 900) {
      const prev = $(".services-preview");
      const prevInner = $(".services-preview__inner");
      const list = $(".services__list");
      const px = gsap.quickTo(prev, "x", { duration: 0.7, ease: "power3" });
      const py = gsap.quickTo(prev, "y", { duration: 0.7, ease: "power3" });
      const pr = gsap.quickTo(prev, "rotate", { duration: 0.8, ease: "power3" });
      gsap.set(prev, { scale: 0, autoAlpha: 0 });
      let lastX = 0;
      list.addEventListener("mouseenter", (e) => { gsap.set(prev, { x: e.clientX, y: e.clientY }); gsap.to(prev, { scale: 1, autoAlpha: 1, duration: 0.6, ease: expo }); });
      list.addEventListener("mouseleave", () => gsap.to(prev, { scale: 0, autoAlpha: 0, duration: 0.5, ease: "power3.in" }));
      list.addEventListener("mousemove", (e) => {
        px(e.clientX + 190); py(e.clientY);
        pr(gsap.utils.clamp(-10, 10, (e.clientX - lastX) * 0.5));
        lastX = e.clientX;
      });
      $$(".srow").forEach((row) => row.addEventListener("mouseenter", () => { prevInner.style.transform = `translateY(${-row.dataset.index * 100}%)`; }));
    }
    // mobile: service images zoom out as they scroll in
    $$(".srow__img img").forEach((img) => gsap.fromTo(img, { scale: 1.25 }, { scale: 1, ease: "none", scrollTrigger: { trigger: img, start: "top bottom", end: "bottom 60%", scrub: true } }));

    /* ---------- Product illustrations draw themselves ---------- */
    $$(".pcard__art svg").forEach((svg) => {
      const parts = $$(".draw > *", svg);
      parts.forEach((p) => { const len = Math.ceil(p.getTotalLength?.() || 300); p.style.setProperty("--len", len); p.style.strokeDashoffset = len; });
      gsap.to(parts, { strokeDashoffset: 0, duration: 1.6, stagger: 0.08, ease: "power2.inOut", scrollTrigger: { trigger: svg, start: "top 88%" } });
      const card = svg.closest(".pcard");
      if (finePointer) card.addEventListener("mouseenter", () => gsap.fromTo(parts, { strokeDashoffset: (i, p) => p.style.getPropertyValue("--len") }, { strokeDashoffset: 0, duration: 1, stagger: 0.05, ease: "power2.inOut", overwrite: true }));
    });
    // 3D tilt
    if (finePointer) $$(".pcard").forEach((card) => {
      const rx = gsap.quickTo(card, "rotateX", { duration: 0.6, ease: "power3" });
      const ry = gsap.quickTo(card, "rotateY", { duration: 0.6, ease: "power3" });
      gsap.set(card, { transformPerspective: 900 });
      card.addEventListener("mousemove", (e) => { const r = card.getBoundingClientRect(); ry(((e.clientX - r.left) / r.width - 0.5) * 8); rx(-((e.clientY - r.top) / r.height - 0.5) * 8); });
      card.addEventListener("mouseleave", () => { rx(0); ry(0); });
    });

    /* ---------- Horizontal gallery (pinned) ---------- */
    const track = $(".hgallery__track");
    const dist = () => Math.max(0, track.scrollWidth - innerWidth);
    gsap.to(track, {
      x: () => -dist(), ease: "none",
      scrollTrigger: {
        trigger: ".hgallery", start: "top top", end: () => `+=${dist()}`,
        pin: true, scrub: 1, invalidateOnRefresh: true, anticipatePin: 1,
        onUpdate: (s) => gsap.set(".hgallery__progress i", { scaleX: s.progress }),
      },
    });

    /* ---------- Why: list items slide in ---------- */
    gsap.from(".why__list h3", { xPercent: 12, autoAlpha: 0, duration: 1.2, stagger: 0.1, ease: expo, scrollTrigger: { trigger: ".why__list", start: "top 80%" } });

    /* ---------- Process: steps light up one by one ---------- */
    const steps = $$(".step");
    gsap.from(steps, { y: 60, autoAlpha: 0, duration: 1.2, stagger: 0.1, ease: expo, scrollTrigger: { trigger: ".steps", start: "top 85%" } });
    gsap.to(".steps__bar i", {
      scaleX: 1, ease: "none",
      scrollTrigger: {
        trigger: ".steps", start: "top 75%", end: "bottom 35%", scrub: true,
        onUpdate: (s) => steps.forEach((st, i) => st.classList.toggle("is-in", s.progress >= (i + 0.5) / steps.length)),
      },
    });

    /* ---------- CTA band: image expands to full bleed ---------- */
    gsap.fromTo(".band__media", { clipPath: "inset(10% 14% 10% 14% round 24px)" }, {
      clipPath: "inset(0% 0% 0% 0% round 0px)", ease: "none",
      scrollTrigger: { trigger: ".band", start: "top 85%", end: "top 10%", scrub: true },
    });
    gsap.fromTo(".band__media img", { scale: 1.3 }, { scale: 1, ease: "none", scrollTrigger: { trigger: ".band", start: "top bottom", end: "bottom top", scrub: true } });

    /* ---------- Map + gallery cards ---------- */
    gsap.from(".hcard__img img", { scale: 1.35, duration: 1.8, ease: expo, scrollTrigger: { trigger: ".hgallery", start: "top 70%" } });

    /* ---------- Footer giant wordmark ---------- */
    gsap.from(".footer__big span", { yPercent: 105, duration: 1.6, stagger: 0.1, ease: expo, scrollTrigger: { trigger: ".footer__big", start: "top 95%" } });

    /* ---------- Magnetic buttons ---------- */
    if (finePointer) {
      $$(".magnetic").forEach((el) => {
        const xTo = gsap.quickTo(el, "x", { duration: 0.6, ease: "power3" });
        const yTo = gsap.quickTo(el, "y", { duration: 0.6, ease: "power3" });
        el.addEventListener("mousemove", (e) => {
          const r = el.getBoundingClientRect();
          xTo((e.clientX - r.left - r.width / 2) * 0.3);
          yTo((e.clientY - r.top - r.height / 2) * 0.4);
        });
        el.addEventListener("mouseleave", () => gsap.to(el, { x: 0, y: 0, duration: 1, ease: "elastic.out(1, .4)" }));
      });
    }

    addEventListener("load", () => ScrollTrigger.refresh());
  }

  /* =========================================================
     Custom cursor
     ========================================================= */
  if (finePointer && !reduced && hasGsap) {
    root.classList.add("has-cursor");
    const cursor = $(".cursor");
    const label = $(".cursor__label");
    const cx = gsap.quickTo(cursor, "x", { duration: 0.35, ease: "power3" });
    const cy = gsap.quickTo(cursor, "y", { duration: 0.35, ease: "power3" });
    addEventListener("mousemove", (e) => { cx(e.clientX); cy(e.clientY); });
    document.addEventListener("mouseover", (e) => {
      const card = e.target.closest(".hcard:not(.hcard--cta)");
      const hot = e.target.closest("a, button, select, input, textarea, label");
      cursor.classList.toggle("is-label", !!card);
      cursor.classList.toggle("is-hover", !card && !!hot);
      if (card) label.textContent = i18n.t("view");
    });
    document.addEventListener("mouseleave", () => gsap.to(cursor, { autoAlpha: 0, duration: 0.3 }));
    document.addEventListener("mouseenter", () => gsap.to(cursor, { autoAlpha: 1, duration: 0.3 }));
  }
})();
