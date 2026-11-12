// Demo videos: horizontal swipe, buttons and keyboard navigation.
const demo = document.querySelector('#demo');
if (demo) {
  const track = demo.querySelector('.demo-track');
  const slides = [...demo.querySelectorAll('.demo-slide')];
  const choices = [...demo.querySelectorAll('.demo-choice')];
  const position = demo.querySelector('.demo-position');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let active = 0;
  let scrollFrame = 0;

  function activate(index, play = true) {
    active = index;
    slides.forEach((slide, i) => {
      const selected = i === index;
      slide.inert = !selected;
      slide.setAttribute('aria-hidden', String(!selected));
      choices[i].setAttribute('aria-pressed', String(selected));
      if (!selected) slide.querySelector('video').pause();
    });
    position.textContent = `${index + 1} / ${slides.length}`;
    if (play && !document.hidden) {
      slides[index].querySelector('video').play().catch(() => {
        // Native controls remain available when autoplay is blocked.
      });
    }
  }

  function goTo(index) {
    const next = (index + slides.length) % slides.length;
    track.scrollTo({
      left: next * track.clientWidth,
      behavior: reducedMotion.matches ? 'instant' : 'smooth'
    });
  }

  choices.forEach((button, i) => button.addEventListener('click', () => goTo(i)));
  demo.querySelectorAll('[data-demo-step]').forEach((button) => {
    button.addEventListener('click', () => goTo(active + Number(button.dataset.demoStep)));
  });
  track.addEventListener('scroll', () => {
    if (scrollFrame) return;
    scrollFrame = requestAnimationFrame(() => {
      scrollFrame = 0;
      const index = Math.max(0, Math.min(slides.length - 1, Math.round(track.scrollLeft / track.clientWidth)));
      if (index !== active) activate(index);
    });
  }, { passive: true });
  track.addEventListener('keydown', (event) => {
    if (event.target !== track) return; // Leave native video keyboard controls intact.
    const targets = { ArrowLeft: active - 1, ArrowRight: active + 1, Home: 0, End: slides.length - 1 };
    if (event.key in targets) {
      event.preventDefault();
      goTo(targets[event.key]);
    }
  });
  slides.forEach((slide, i) => {
    slide.querySelector('video').addEventListener('play', () => {
      if (i !== active) slide.querySelector('video').pause();
    });
  });
  new ResizeObserver(() => {
    track.scrollTo({ left: active * track.clientWidth, behavior: 'instant' });
  }).observe(track);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) slides[active].querySelector('video').pause();
  });
  activate(0, false);
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
