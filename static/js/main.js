// Demo videos: one viewport, a horizontal rail, and explicit playback state.
const demo = document.querySelector('#demo');
if (demo) {
  const track = demo.querySelector('.demo-track');
  const rail = demo.querySelector('.demo-rail');
  const slides = [...demo.querySelectorAll('.demo-slide')];
  const choices = [...demo.querySelectorAll('.demo-choice')];
  const arrows = [...demo.querySelectorAll('[data-demo-step]')];
  const position = demo.querySelector('.demo-position');
  let active = 0;
  let drag = null;
  let suppressClick = false;
  const clamp = (index) => Math.max(0, Math.min(slides.length - 1, index));

  function moveRail(offset = 0) {
    rail.style.transform = `translate3d(calc(${-active * 100}% + ${offset}px), 0, 0)`;
  }

  function playSlide(index) {
    const slide = slides[index];
    const video = slide.querySelector('video');
    const start = slide.querySelector('.demo-start');
    start.hidden = true;
    video.play().catch(() => {
      if (index === active && video.paused) start.hidden = false;
    });
  }

  function goTo(index, play = true) {
    active = clamp(index);
    slides.forEach((slide, i) => {
      const selected = i === active;
      slide.inert = !selected;
      slide.setAttribute('aria-hidden', String(!selected));
      choices[i].setAttribute('aria-pressed', String(selected));
      if (!selected) slide.querySelector('video').pause();
    });
    arrows.forEach((button) => {
      const next = active + Number(button.dataset.demoStep);
      button.disabled = next < 0 || next >= slides.length;
    });
    position.textContent = `${active + 1} / ${slides.length}`;
    moveRail();
    // Start within the click gesture, independent of scrolling or animation events.
    if (play && !document.hidden) playSlide(active);
  }

  choices.forEach((button, i) => button.addEventListener('click', () => goTo(i)));
  arrows.forEach((button) => {
    button.addEventListener('click', () => goTo(active + Number(button.dataset.demoStep)));
  });
  track.addEventListener('keydown', (event) => {
    if (event.target !== track) return;
    const targets = { ArrowLeft: active - 1, ArrowRight: active + 1, Home: 0, End: slides.length - 1 };
    if (event.key in targets) {
      event.preventDefault();
      goTo(targets[event.key]);
    }
  });

  track.addEventListener('pointerdown', (event) => {
    suppressClick = false;
    if (!event.isPrimary || event.button !== 0 || event.target.closest('button, a, input')) return;
    const video = event.target.closest('video');
    if (video) {
      const bounds = video.getBoundingClientRect();
      // Keep the native timeline, volume, and fullscreen controls draggable.
      if (event.clientY > bounds.bottom - Math.min(72, bounds.height * 0.25)) return;
    }
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY, dx: 0, locked: false };
  });
  track.addEventListener('pointermove', (event) => {
    if (!drag || event.pointerId !== drag.id) return;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    if (!drag.locked) {
      if (Math.abs(dy) > 12 && Math.abs(dy) > Math.abs(dx)) { drag = null; return; }
      if (Math.abs(dx) < 12 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
      drag.locked = true;
      track.setPointerCapture(event.pointerId);
      track.classList.add('is-dragging');
    }
    event.preventDefault();
    drag.dx = dx;
    const atEdge = (active === 0 && dx > 0) || (active === slides.length - 1 && dx < 0);
    moveRail(atEdge ? dx * 0.2 : dx);
  });

  function finishDrag(event, cancel = false) {
    if (!drag || event.pointerId !== drag.id) return;
    const ended = drag;
    drag = null;
    track.classList.remove('is-dragging');
    if (track.hasPointerCapture(event.pointerId)) track.releasePointerCapture(event.pointerId);
    if (!ended.locked) return;
    suppressClick = true;
    const threshold = Math.min(80, track.clientWidth * 0.15);
    if (!cancel && Math.abs(ended.dx) > threshold) goTo(active + (ended.dx < 0 ? 1 : -1));
    else moveRail();
  }
  track.addEventListener('pointerup', (event) => finishDrag(event));
  track.addEventListener('pointercancel', (event) => finishDrag(event, true));
  track.addEventListener('click', (event) => {
    if (!suppressClick) return;
    suppressClick = false;
    event.preventDefault();
    event.stopImmediatePropagation();
  }, true);

  slides.forEach((slide, i) => {
    const video = slide.querySelector('video');
    const start = slide.querySelector('.demo-start');
    start.addEventListener('click', () => playSlide(i));
    video.addEventListener('play', () => {
      if (i !== active) video.pause();
      else start.hidden = true;
    });
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) slides[active].querySelector('video').pause();
  });
  goTo(0, false);
}

// Step-by-step trajectories: one tab per figure of the paper's appendix.
document.querySelectorAll('.tabs [role="tab"]').forEach((tab) => {
  tab.addEventListener('click', () => {
    const panel = document.getElementById(tab.getAttribute('aria-controls'));
    tab.parentElement.querySelectorAll('[role="tab"]').forEach((t) => t.setAttribute('aria-selected', 'false'));
    tab.setAttribute('aria-selected', 'true');
    panel.querySelector('a').href = tab.dataset.src;
    const img = panel.querySelector('img');
    img.removeAttribute('width');   // the figures differ in height; let the new one set its own size
    img.removeAttribute('height');
    img.src = tab.dataset.src;
    panel.querySelector('figcaption').textContent = tab.dataset.caption;
  });
});

// Copy the BibTeX entry.
const copyButton = document.querySelector('.bib .copy');
if (copyButton) {
  copyButton.addEventListener('click', async () => {
    const text = document.getElementById('bibtex-code').textContent;
    try {
      await navigator.clipboard.writeText(text);
      copyButton.textContent = 'Copied';
    } catch (e) {
      copyButton.textContent = 'Select and copy';
    }
    setTimeout(() => { copyButton.textContent = 'Copy'; }, 1600);
  });
}
