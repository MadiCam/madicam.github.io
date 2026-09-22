/* hero.js — the glass capability probe, and the 15-second loop.
 *
 * The loop runs on its own. The hero has to work on a phone where there is no
 * hover and the visitor will not tap a demo, so nothing here waits to be asked.
 *
 * Every duration comes out of tokens.css rather than being written twice, so the
 * morph, the blink and the pulse stay in step with the sizes.
 */
(() => {
  "use strict";

  const root = document.documentElement;
  const phone = document.getElementById("phone");
  const timer = document.getElementById("timer");
  if (!phone) return;

  /* ------------------------------------------------------------- capability */

  /* Decided by capability query, never by sniffing the user agent.
   *
   *   A — refraction. An SVG filter inside backdrop-filter, which is Chromium
   *       only today, and only worth the per-frame cost on a real pointer at a
   *       real size.
   *   B — frosted. What most visitors see, and the tier the glass was designed
   *       for. Everything below tier A degrades to this rather than to nothing.
   *   C — opaque. Not a fallback so much as a second real product state: it is
   *       what the app's own High Contrast setting does.
   */
  const can = (prop, value) =>
    typeof CSS !== "undefined" &&
    typeof CSS.supports === "function" &&
    CSS.supports(prop, value);

  const backdrop =
    can("backdrop-filter", "blur(1px)") ||
    can("-webkit-backdrop-filter", "blur(1px)");

  const refraction =
    can("backdrop-filter", 'url("#x")') ||
    can("-webkit-backdrop-filter", 'url("#x")');

  const opaqueWanted = matchMedia("(prefers-reduced-transparency: reduce)");
  const finePointer = matchMedia("(pointer: fine)");

  function resolveTier() {
    if (!backdrop || opaqueWanted.matches) return "c";
    if (refraction && finePointer.matches && window.innerWidth >= 992) return "a";
    return "b";
  }

  function applyTier() {
    root.dataset.glass = resolveTier();
  }

  applyTier();
  opaqueWanted.addEventListener("change", applyTier);
  finePointer.addEventListener("change", applyTier);

  /* The width gate on tier A means a resize can cross it. Debounced, because
   * changing tier re-rasterises every glass region. */
  let resizeTimer = 0;
  addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(applyTier, 250);
  });

  /* ---------------------------------------------------------------- timings */

  /* tokens.css emits these in seconds. */
  const ms = (name) => {
    const raw = getComputedStyle(root).getPropertyValue(name);
    const value = parseFloat(raw);
    return Number.isFinite(value) ? value * 1000 : 0;
  };

  const BLINK = ms("--shutter-blink");
  const PULSE = ms("--button-pulse");
  const THUMB = ms("--thumbnail-hold");

  /* Long enough to read as a press through a diffusing membrane, which is what
   * the app's own 80ms floor is measuring from the other direction. */
  const PRESS = 150;

  /* The sequence, in milliseconds from the top of the loop. Slow enough to
   * read: the whole point of the app is that nothing on it is hurried. */
  const AT_RECORD_ON = 2500;
  const AT_PHOTO = 7000;
  const AT_RECORD_OFF = 11000;
  const AT_LOOP = 15000;

  /* ------------------------------------------------------------------ state */

  const control = (name) => phone.querySelector(`[data-ctl="${name}"]`);

  let pending = [];
  let ticker = 0;
  let startedAt = 0;

  const later = (fn, delay) => {
    pending.push(setTimeout(fn, delay));
  };

  function clearPending() {
    pending.forEach(clearTimeout);
    pending = [];
  }

  /* A brief scale-down and brightness lift, so the sequence reads as presses
   * rather than as things happening by themselves. */
  function press(name) {
    const el = control(name);
    if (!el) return;
    el.dataset.pressed = "true";
    later(() => { el.dataset.pressed = "false"; }, PRESS);
  }

  function renderTimer() {
    if (!timer) return;
    const total = Math.max(0, Math.floor((performance.now() - startedAt) / 1000));
    const mm = String(Math.floor(total / 60)).padStart(2, "0");
    const ss = String(total % 60).padStart(2, "0");
    timer.textContent = `${mm}:${ss}`;
  }

  function startRecording() {
    phone.dataset.recording = "true";
    startedAt = performance.now();
    renderTimer();
    clearInterval(ticker);
    /* Four times a second rather than once, so the seconds turn over on time
     * rather than up to a second late. */
    ticker = setInterval(renderTimer, 250);
  }

  function stopRecording() {
    phone.dataset.recording = "false";
    clearInterval(ticker);
    ticker = 0;
    if (timer) timer.textContent = "00:00";
  }

  /* Three things at once, and the black blink is the one that matters: a white
   * flash on a night dive destroys dark adaptation. */
  function capturePhoto() {
    const photo = control("photo");

    phone.dataset.blink = "true";
    later(() => { phone.dataset.blink = "false"; }, BLINK * 2 + 40);

    if (photo) {
      photo.dataset.pulsing = "true";
      later(() => { photo.dataset.pulsing = "false"; }, PULSE);
    }

    phone.dataset.thumb = "true";
    later(() => { phone.dataset.thumb = "false"; }, THUMB);
  }

  function reset() {
    clearPending();
    stopRecording();
    phone.dataset.thumb = "false";
    phone.dataset.blink = "false";
    const photo = control("photo");
    if (photo) photo.dataset.pulsing = "false";
  }

  /* ------------------------------------------------------------------- loop */

  let looping = false;

  function cycle() {
    if (!looping) return;
    reset();
    looping = true;

    later(() => { press("record"); startRecording(); }, AT_RECORD_ON);
    later(() => { press("photo"); capturePhoto(); }, AT_PHOTO);
    later(() => { press("record"); stopRecording(); }, AT_RECORD_OFF);
    later(cycle, AT_LOOP);
  }

  function start() {
    looping = true;
    cycle();
  }

  function stop() {
    looping = false;
    reset();
  }

  /* --------------------------------------------------- reduced motion */

  /* The video holds on its poster frame, the controls sit in the idle state, and
   * there is no loop. Nothing in the argument depends on the animation, which is
   * why it can be taken away cleanly. */
  const stillness = matchMedia("(prefers-reduced-motion: reduce)");

  function honourMotion() {
    if (stillness.matches) stop();
    else if (!looping) start();
  }

  honourMotion();
  stillness.addEventListener("change", honourMotion);

  /* Nothing decoding off screen. The hero is tall enough on a phone that it can
   * leave the viewport entirely. */
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) honourMotion();
          else stop();
        }
      },
      { threshold: 0.08 }
    ).observe(phone);
  }

  /* ------------------------------------------------- optional: let them press */

  /* Desktop only, and deliberately small. A visitor's own click on RECORD or
   * PHOTO interrupts the loop and runs the real transition, then the loop picks
   * up again once they have stopped playing with it. Not built on mobile, where
   * the loop is the only thing that works, and not allowed to become a project.
   */
  if (finePointer.matches) {
    const rearm = () => {
      clearTimeout(rearm.id);
      rearm.id = setTimeout(() => { if (!stillness.matches) start(); }, 4000);
    };

    const handle = (name, run) => {
      const el = control(name);
      if (!el) return;
      el.style.cursor = "pointer";
      el.addEventListener("click", () => {
        if (stillness.matches) return;
        looping = false;
        clearPending();
        press(name);
        run();
        rearm();
      });
    };

    handle("record", () => {
      if (phone.dataset.recording === "true") stopRecording();
      else startRecording();
    });

    handle("photo", capturePhoto);
  }
})();
