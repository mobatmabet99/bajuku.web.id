const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
      }
    });
  },
  { threshold: 0.12 }
);

document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));

const slotCounters = [...document.querySelectorAll('[data-slot-counter]')];
const reduceSlotMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!reduceSlotMotion && slotCounters.length) {
  slotCounters.forEach((counter) => {
    const finalValue = counter.textContent.trim();
    counter.setAttribute('aria-label', finalValue);
    counter.replaceChildren();

    Array.from(finalValue).forEach((character) => {
      if (!/\d/.test(character)) {
        const separator = document.createElement('span');
        separator.textContent = character;
        separator.setAttribute('aria-hidden', 'true');
        counter.append(separator);
        return;
      }

      const digit = Number(character);
      const windowElement = document.createElement('span');
      windowElement.className = 'slot-digit-window';
      windowElement.setAttribute('aria-hidden', 'true');

      const reel = document.createElement('span');
      reel.className = 'slot-digit-reel';
      Array.from({ length: 30 + digit + 1 }, (_, index) => {
        const reelDigit = document.createElement('span');
        reelDigit.textContent = String(index % 10);
        reel.append(reelDigit);
      });

      windowElement.append(reel);
      windowElement.style.setProperty('--slot-offset', `-${30 + digit}em`);
      counter.append(windowElement);

      window.requestAnimationFrame(() => {
        windowElement.classList.add('is-spinning');
      });
    });
  });
}

const typewriterTargets = [...document.querySelectorAll('[data-typewriter]')];
const reduceTypewriterMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!reduceTypewriterMotion && typewriterTargets.length) {
  const textNodes = typewriterTargets.flatMap((target) => {
    const walker = document.createTreeWalker(target, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    target.setAttribute('aria-label', target.textContent.replace(/\s+/g, ' ').trim());
    return nodes;
  });
  const totalCharacters = textNodes.reduce(
    (count, node) => count + Array.from(node.textContent).length,
    0
  );
  let characterIndex = 0;

  textNodes.forEach((textNode) => {
    const fragment = document.createDocumentFragment();
    Array.from(textNode.textContent).forEach((character) => {
      const characterSpan = document.createElement('span');
      characterSpan.className = 'typewriter-char';
      characterSpan.textContent = character;
      characterSpan.style.setProperty(
        '--char-delay',
        `${totalCharacters > 1 ? (4.65 * characterIndex) / (totalCharacters - 1) : 0}s`
      );
      fragment.append(characterSpan);
      characterIndex += 1;
    });
    textNode.replaceWith(fragment);
  });
}

const heroCarousel = document.querySelector('[data-hero-carousel]');
if (heroCarousel) {
  const heroSlides = [...heroCarousel.querySelectorAll('[data-hero-slide]')];
  const heroDots = [...heroCarousel.querySelectorAll('[data-hero-dot]')];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let activeHeroSlide = 0;
  let heroTimer;
  let carouselPaused = false;
  let heroAutoStopped = false;

  function showHeroSlide(index) {
    activeHeroSlide = (index + heroSlides.length) % heroSlides.length;
    heroSlides.forEach((slide, slideIndex) => {
      const isActive = slideIndex === activeHeroSlide;
      slide.classList.toggle('is-active', isActive);
      slide.setAttribute('aria-hidden', String(!isActive));
      slide.inert = !isActive;
      slide.tabIndex = isActive ? 0 : -1;
    });
    heroDots.forEach((dot, dotIndex) => {
      const isActive = dotIndex === activeHeroSlide;
      dot.classList.toggle('is-active', isActive);
      if (isActive) dot.setAttribute('aria-current', 'true');
      else dot.removeAttribute('aria-current');
    });
  }

  function stopHeroTimer() {
    window.clearInterval(heroTimer);
  }

  function startHeroTimer() {
    stopHeroTimer();
    if (heroAutoStopped || carouselPaused || reducedMotion.matches || document.hidden) return;
    heroTimer = window.setInterval(() => showHeroSlide(activeHeroSlide + 1), 3000);
  }

  function stopHeroAuto() {
    heroAutoStopped = true;
    stopHeroTimer();
  }

  heroCarousel.querySelector('[data-hero-prev]')?.addEventListener('click', () => {
    stopHeroAuto();
    showHeroSlide(activeHeroSlide - 1);
  });
  heroCarousel.querySelector('[data-hero-next]')?.addEventListener('click', () => {
    stopHeroAuto();
    showHeroSlide(activeHeroSlide + 1);
  });
  heroDots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
      stopHeroAuto();
      showHeroSlide(index);
    });
  });
  heroCarousel.addEventListener('mouseenter', () => {
    carouselPaused = true;
    stopHeroTimer();
  });
  heroCarousel.addEventListener('mouseleave', () => {
    carouselPaused = false;
    startHeroTimer();
  });
  heroCarousel.addEventListener('focusin', () => {
    carouselPaused = true;
    stopHeroTimer();
  });
  heroCarousel.addEventListener('focusout', (event) => {
    if (!heroCarousel.contains(event.relatedTarget)) {
      carouselPaused = false;
      startHeroTimer();
    }
  });
  document.addEventListener('visibilitychange', startHeroTimer);
  reducedMotion.addEventListener('change', startHeroTimer);
  showHeroSlide(0);
  startHeroTimer();
}

const yearElement = document.getElementById('year');
if (yearElement) yearElement.textContent = '2026';

const themeToast = document.querySelector('.theme-toast');
const themeToastMessage = document.querySelector('[data-theme-toast-message]');
const themeToastClose = document.querySelector('.theme-toast-close');
const themeToggle = document.querySelector('.theme-toggle');
const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
const themeStorageKey = 'bajuku-theme';
const savedTheme = window.localStorage.getItem(themeStorageKey);
let toastTimeout;

function getCurrentTheme() {
  return document.documentElement.dataset.theme;
}

function updateThemeControls() {
  const isDark = getCurrentTheme() === 'dark';
  if (themeToggle) {
    themeToggle.setAttribute('aria-pressed', String(isDark));
    themeToggle.setAttribute('aria-label', `Aktifkan tema ${isDark ? 'terang' : 'gelap'}`);
    themeToggle.querySelector('span').textContent = isDark ? '☀' : '☾';
  }
  if (themeToastMessage) {
    themeToastMessage.textContent = `Tema ${isDark ? 'gelap' : 'terang'} aktif. Tekan tombol untuk beralih ke tema ${isDark ? 'terang' : 'gelap'}.`;
  }
}

function showThemeToast() {
  if (!themeToast) return;
  window.clearTimeout(toastTimeout);
  themeToast.hidden = false;
  toastTimeout = window.setTimeout(() => {
    themeToast.hidden = true;
  }, 4500);
}

document.documentElement.dataset.theme =
  savedTheme === 'dark' || savedTheme === 'light'
    ? savedTheme
    : systemTheme.matches ? 'dark' : 'light';
updateThemeControls();

themeToggle?.addEventListener('click', () => {
  const nextTheme = getCurrentTheme() === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = nextTheme;
  window.localStorage.setItem(themeStorageKey, nextTheme);
  updateThemeControls();
  showThemeToast();
});

systemTheme.addEventListener('change', (event) => {
  if (window.localStorage.getItem(themeStorageKey)) return;
  document.documentElement.dataset.theme = event.matches ? 'dark' : 'light';
  updateThemeControls();
});

if (themeToast) {
  window.setTimeout(showThemeToast, 300);
  themeToastClose?.addEventListener('click', () => {
    window.clearTimeout(toastTimeout);
    themeToast.hidden = true;
  });
}

const colorButtons = [...document.querySelectorAll('[data-color-choice]')];
const productImage = document.querySelector('.detail-main-image');
const selectedColorLabel = document.querySelector('.selected-color');
const productVideo = document.querySelector('.detail-main-video');
const videoChoice = document.querySelector('[data-video-choice]');
const galleryButtons = [...document.querySelectorAll('[data-gallery-image]')];

function selectColor(button) {
  if (!button) return;

  if (selectedColorLabel) selectedColorLabel.textContent = button.dataset.color;
  colorButtons.forEach((option) => {
    const selected = option === button;
    option.classList.toggle('is-selected', selected);
    option.setAttribute('aria-checked', String(selected));
  });

  if (videoChoice) {
    const videoSource = button.dataset.video;
    videoChoice.dataset.video = videoSource || '';
    videoChoice.disabled = !videoSource;
    videoChoice.querySelector('span').textContent = videoSource
      ? `Putar video warna ${button.dataset.color}`
      : 'Video warna ini belum tersedia';
  }
}

function showProductImage(source, alt) {
  if (!productImage) return;
  if (productVideo) {
    productVideo.pause();
    productVideo.removeAttribute('src');
    productVideo.load();
    productVideo.hidden = true;
  }
  productImage.hidden = false;
  productImage.src = source;
  productImage.alt = alt;
}

galleryButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const matchingColor = colorButtons.find((option) => option.dataset.color === button.dataset.color);
    selectColor(matchingColor);
    showProductImage(button.dataset.image, button.dataset.alt);
    galleryButtons.forEach((option) => option.classList.toggle('is-selected', option === button));
  });
});

colorButtons.forEach((button, index) => {
  button.addEventListener('click', () => {
    selectColor(button);
    showProductImage(button.dataset.image, button.dataset.alt);
    galleryButtons.forEach((option) => option.classList.toggle(
      'is-selected',
      option.dataset.image === button.dataset.image
    ));
  });

  button.addEventListener('keydown', (event) => {
    const direction = ['ArrowRight', 'ArrowDown'].includes(event.key) ? 1 :
      ['ArrowLeft', 'ArrowUp'].includes(event.key) ? -1 : 0;

    if (!direction || colorButtons.length < 2) return;

    event.preventDefault();
    const nextIndex = (index + direction + colorButtons.length) % colorButtons.length;
    colorButtons[nextIndex].focus();
    colorButtons[nextIndex].click();
  });
});

if (videoChoice && productVideo) {
  videoChoice.addEventListener('click', () => {
    const source = videoChoice.dataset.video;
    if (!source) return;

    productImage.hidden = true;
    productVideo.hidden = false;
    if (productVideo.getAttribute('src') !== source) {
      productVideo.src = source;
      productVideo.load();
    }
    productVideo.play().catch(() => {
      productVideo.controls = true;
    });
  });
}

const navLinks = document.querySelectorAll('a[href^="#"]');
navLinks.forEach((link) => {
  link.addEventListener('click', (event) => {
    const targetId = link.getAttribute('href');
    if (!targetId || targetId === '#') return;

    const target = document.querySelector(targetId);
    if (!target) return;

    event.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});
