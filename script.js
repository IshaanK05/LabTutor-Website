// ===== MENU TOGGLE =====
const menuButton = document.getElementById("menuButton");
const navigationMenu = document.getElementById("navigationMenu");
const closeMenu = document.getElementById("closeMenu");

menuButton.addEventListener("click", () => {
  navigationMenu.classList.add("active");
});

closeMenu.addEventListener("click", () => {
  navigationMenu.classList.remove("active");
});

document.querySelectorAll(".nav-links a").forEach(link => {
  link.addEventListener("click", () => {
    navigationMenu.classList.remove("active");
  });
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && navigationMenu.classList.contains("active")) {
    navigationMenu.classList.remove("active");
  }
});

// ===== HEADER COLLAPSE ON SCROLL =====
const header = document.querySelector(".header");
window.addEventListener("scroll", () => {
  if (window.scrollY > 50) {
    header.classList.add("collapsed");
  } else {
    header.classList.remove("collapsed");
  }
});

// ===== INFINITE SCROLLING TUTOR CAROUSELS =====
// Wait for full load so images/layout sizes are stable (important)
window.addEventListener('load', () => {
  const row1 = document.getElementById('row1'); // top row -> scroll left
  const row2 = document.getElementById('row2'); // bottom row -> scroll right
    const reviewsRow = document.getElementById('reviewsRow');
  startInfiniteScroll(reviewsRow, 'left', 0.04); // slightly slower than tutor profiles


  // Both rows: slow speed (~50px/s => 0.05 px/ms)
  startInfiniteScroll(row1, 'left', 0.05);
  startInfiniteScroll(row2, 'right', 0.05);
});

/**
 * Helper: get flex gap between cards
 */
function getGap(track) {
  const cs = window.getComputedStyle(track);
  if (cs && cs.gap) {
    const val = parseFloat(cs.gap);
    return Number.isFinite(val) ? val : 20;
  }
  return 20;
}

/**
 * Start infinite scroll on a track (robust, seamless duplication)
 * @param {HTMLElement} track - The flex container holding cards
 * @param {"left"|"right"} direction - Scroll direction
 * @param {number} speed - Pixels per ms
 */
function startInfiniteScroll(track, direction = 'left', speed = 0.05) {
  if (!track) return;

  const gap = getGap(track);

  // Capture original children and count before duplication
  const originalChildren = Array.from(track.children);
  const originalCount = originalChildren.length;
  if (originalCount === 0) return;

  // Prevent shrink
  originalChildren.forEach(c => c.style.flexShrink = '0');

  // Duplicate the content (append copy)
  track.innerHTML += track.innerHTML;

  // Compute total width of ONE set of originals (sum widths + gaps)
  function computeOneSetWidth() {
    const children = Array.from(track.children).slice(0, originalCount);
    const widths = children.map(c => c.getBoundingClientRect().width);
    const sum = widths.reduce((a, b) => a + b, 0);
    // gaps between original items are originalCount - 1
    return sum + gap * Math.max(0, originalCount - 1);
  }

  let totalWidth = computeOneSetWidth();

  // If the viewport changes, recompute and normalize translate
  window.addEventListener('resize', () => {
    const oldTotal = totalWidth;
    totalWidth = computeOneSetWidth();
    // clamp translate into valid range to avoid jumps
    if (direction === 'left') {
      while (translate <= -totalWidth) translate += totalWidth;
      while (translate > 0) translate -= totalWidth;
    } else {
      while (translate < -totalWidth) translate += totalWidth;
      while (translate >= 0) translate -= totalWidth;
    }
  });

  // Start translate: for right-scrolling we view the second copy initially
  let translate = (direction === 'right') ? -totalWidth : 0;
  track.style.transform = `translateX(${translate}px)`;

  let lastTime = performance.now();
  let paused = false;

  const carousel = track.parentElement;
  if (carousel) {
    // visual cursor feedback
    carousel.style.cursor = 'grab';
    // Pause while pointer is held down (click-and-hold)
    carousel.addEventListener('pointerdown', (e) => {
      paused = true;
      carousel.style.cursor = 'grabbing';
      // prevent text/image dragging/selection while holding
      e.preventDefault();
    }, { passive: false });

    // Resume on pointer up anywhere
    document.addEventListener('pointerup', () => {
      paused = false;
      if (carousel) carousel.style.cursor = 'grab';
    });
  }

  function step(now) {
    const dt = now - lastTime;
    lastTime = now;

    if (!paused) {
      const delta = speed * dt; // pixels to move this frame

      if (direction === 'left') {
        translate -= delta;
        // When we've scrolled one full set, wrap
        if (translate <= -totalWidth) {
          translate += totalWidth;
        }
      } else { // right
        translate += delta;
        // When we've scrolled one full set to the right, wrap
        if (translate >= 0) {
          translate -= totalWidth;
        }
      }

      // apply transform
      track.style.transform = `translateX(${translate}px)`;
    }

    requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}
