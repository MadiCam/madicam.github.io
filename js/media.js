/* media.js — one video playing at a time, and never one that is off screen.
 *
 * Several videos decoding at once is the usual way a page like this dies on a
 * mid-range Android. Everything below the fold ships `preload="none"` and is
 * started by an IntersectionObserver, which is also what pauses it again.
 */
(() => {
  "use strict";

  const clips = Array.from(document.querySelectorAll("video[data-observe]"));
  const hero = document.querySelector(".hero__video");
  const stillness = matchMedia("(prefers-reduced-motion: reduce)");

  /* ------------------------------------------------------- missing artwork */

  /* Several images on this page are still to be produced. A broken <img> draws
   * the browser's own torn-page icon, which is the one thing worse than an
   * empty frame — and it draws it *over* the designed placeholder underneath.
   * So an image that fails to load takes itself out of the layout and lets the
   * placeholder show. Remove this once every image exists. */
  for (const img of document.images) {
    if (img.complete && img.naturalWidth === 0) img.hidden = true;
    else img.addEventListener("error", () => { img.hidden = true; });
  }

  /* ------------------------------------------------------------------- hero */

  /* The hero video holds on its poster frame under reduced motion. It is
   * decorative — everything it says is also said in the section copy — so
   * stopping it costs the page nothing. */
  function honourHero() {
    if (!hero) return;
    if (stillness.matches) {
      hero.pause();
      hero.removeAttribute("autoplay");
    } else {
      /* Autoplay can be refused (a data saver, a battery mode). There is
       * nothing to recover from: the poster is a compressed still of frame one,
       * so a refused play looks like a deliberately static hero. */
      hero.play().catch(() => {});
    }
  }

  honourHero();
  stillness.addEventListener("change", honourHero);

  /* ------------------------------------------------------------ below the fold */

  if (!clips.length) return;

  if (!("IntersectionObserver" in window)) {
    /* No observer: leave every clip on its poster rather than starting all of
     * them. A still frame is a worse hero and a perfectly good figure. */
    return;
  }

  let playing = null;

  function play(video) {
    if (stillness.matches || playing === video) return;
    if (playing) playing.pause();
    playing = video;
    /* preload="none" means the first play is also the first byte fetched. */
    video.play().catch(() => {});
  }

  function pause(video) {
    video.pause();
    if (playing === video) playing = null;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      /* Most in view wins, so scrolling past two figures does not leave both
       * decoding while neither is really being looked at. */
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

      for (const entry of entries) {
        if (!entry.isIntersecting) pause(entry.target);
      }

      if (visible.length) play(visible[0].target);
    },
    { threshold: [0, 0.45, 0.75] }
  );

  clips.forEach((clip) => observer.observe(clip));

  stillness.addEventListener("change", () => {
    if (stillness.matches && playing) pause(playing);
  });
})();
