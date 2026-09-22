/* compare.js — the before/after control.
 *
 * The most persuasive element on the page and the only thing a visitor will
 * touch, so it works by pointer *and* by keyboard rather than by drag only, and
 * the handle is a real focusable slider rather than a div that listens for
 * mousedown.
 */
(() => {
  "use strict";

  const frame = document.getElementById("compare");
  const handle = document.getElementById("compare-handle");
  if (!frame || !handle) return;

  /* Not centred at rest. An offset resting state is what invites the drag
   * without an instruction telling them to drag: at 50% the two halves look
   * like a designed composition, and at 38% the divider looks like something
   * that has been moved and can be moved again. */
  const REST = 38;

  const STEP = 2;      /* arrow keys */
  const PAGE = 10;     /* page keys */

  let split = REST;

  const clamp = (value) => Math.min(100, Math.max(0, value));

  function render() {
    frame.style.setProperty("--split", `${split}%`);
    const value = Math.round(split);
    handle.setAttribute("aria-valuenow", String(value));
    handle.setAttribute("aria-valuetext", `${value}% corrected`);
  }

  function setFromClientX(clientX) {
    const box = frame.getBoundingClientRect();
    if (!box.width) return;
    split = clamp(((clientX - box.left) / box.width) * 100);
    render();
  }

  /* ---------------------------------------------------------------- pointer */

  let dragging = false;

  /* Listening on the frame rather than only on the handle means the divider
   * jumps to wherever they pressed, which is what people try first. */
  frame.addEventListener("pointerdown", (event) => {
    dragging = true;
    frame.setPointerCapture(event.pointerId);
    setFromClientX(event.clientX);
    /* Stops the images being dragged off as a ghost. */
    event.preventDefault();
  });

  frame.addEventListener("pointermove", (event) => {
    if (dragging) setFromClientX(event.clientX);
  });

  const release = (event) => {
    if (!dragging) return;
    dragging = false;
    if (frame.hasPointerCapture(event.pointerId)) {
      frame.releasePointerCapture(event.pointerId);
    }
  };

  frame.addEventListener("pointerup", release);
  frame.addEventListener("pointercancel", release);

  /* --------------------------------------------------------------- keyboard */

  handle.addEventListener("keydown", (event) => {
    const moves = {
      ArrowLeft: -STEP,
      ArrowRight: STEP,
      ArrowDown: -STEP,
      ArrowUp: STEP,
      PageDown: -PAGE,
      PageUp: PAGE,
    };

    if (event.key in moves) {
      split = clamp(split + moves[event.key]);
    } else if (event.key === "Home") {
      split = 0;
    } else if (event.key === "End") {
      split = 100;
    } else {
      return;
    }

    event.preventDefault();
    render();
  });

  render();
})();
