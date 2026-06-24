(function initBirdIdle() {
  const IDLE_MS = 10000;
  const FIELD_SELECTOR =
    ".page input[type='number'], .page select, .page .cost-input input";

  let idleTimer = null;
  let birdActive = false;
  let animationFrame = null;
  let runnerEl = null;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  function createRunner() {
    if (runnerEl) return runnerEl;

    runnerEl = document.createElement("div");
    runnerEl.id = "bird-idle-runner";
    runnerEl.className = "bird-idle";
    runnerEl.setAttribute("aria-hidden", "true");
    runnerEl.innerHTML = '<div class="bird-idle__sprite"></div>';
    document.body.appendChild(runnerEl);
    return runnerEl;
  }

  function getFieldTargets() {
    return [...document.querySelectorAll(FIELD_SELECTOR)].filter((el) => {
      if (el.hidden || el.offsetParent === null) return false;
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });
  }

  function sortFieldsByReadingOrder(fields) {
    return fields.sort((a, b) => {
      const rectA = a.getBoundingClientRect();
      const rectB = b.getBoundingClientRect();
      const rowDiff = rectA.top - rectB.top;
      if (Math.abs(rowDiff) > 8) return rowDiff;
      return rectA.left - rectB.left;
    });
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function cancelAnimation() {
    if (animationFrame !== null) {
      cancelAnimationFrame(animationFrame);
      animationFrame = null;
    }
  }

  function hideBird() {
    cancelAnimation();
    birdActive = false;
    if (runnerEl) {
      runnerEl.classList.remove("bird-idle--visible");
    }
  }

  function animateTo(x, y, duration, jumpHeight) {
    const bird = createRunner();
    const startX = parseFloat(bird.style.left) || -48;
    const startY = parseFloat(bird.style.top) || y;
    const startTime = performance.now();

    return new Promise((resolve) => {
      function frame(now) {
        if (!birdActive) {
          resolve();
          return;
        }

        const progress = Math.min((now - startTime) / duration, 1);
        const eased =
          progress < 0.5
            ? 2 * progress * progress
            : 1 - (-2 * progress + 2) ** 2 / 2;
        const currentX = startX + (x - startX) * eased;
        const arc = jumpHeight * Math.sin(Math.PI * progress);
        const currentY = startY + (y - startY) * eased - arc;

        bird.style.left = `${currentX}px`;
        bird.style.top = `${currentY}px`;

        if (progress < 1) {
          animationFrame = requestAnimationFrame(frame);
        } else {
          animationFrame = null;
          resolve();
        }
      }

      animationFrame = requestAnimationFrame(frame);
    });
  }

  async function flyAcrossFields() {
    const fields = sortFieldsByReadingOrder(getFieldTargets());
    if (fields.length === 0) {
      birdActive = false;
      scheduleIdleCheck();
      return;
    }

    const bird = createRunner();
    birdActive = true;
    bird.classList.add("bird-idle--visible");

    const firstRect = fields[0].getBoundingClientRect();
    bird.style.left = "-3rem";
    bird.style.top = `${firstRect.top - 28}px`;

    await animateTo(24, firstRect.top - 28, 450, 0);

    for (const field of fields) {
      if (!birdActive) return;

      const rect = field.getBoundingClientRect();
      const targetX = rect.left + rect.width / 2 - 16;
      const targetY = rect.top - 24;
      const jump = Math.min(
        56,
        Math.max(18, Math.abs(targetY - parseFloat(bird.style.top)) * 0.35)
      );

      await animateTo(targetX, targetY, 520, jump);
      await sleep(120);
    }

    if (!birdActive) return;

    const exitY = parseFloat(bird.style.top);
    await animateTo(window.innerWidth + 48, exitY, 600, 12);
    hideBird();
    scheduleIdleCheck();
  }

  function startBird() {
    if (birdActive) return;
    flyAcrossFields();
  }

  function scheduleIdleCheck() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(startBird, IDLE_MS);
  }

  function onUserActivity() {
    hideBird();
    scheduleIdleCheck();
  }

  const activityEvents = [
    "mousemove",
    "mousedown",
    "keydown",
    "touchstart",
    "wheel",
    "scroll",
    "input",
    "change",
    "focus",
  ];

  activityEvents.forEach((eventName) => {
    document.addEventListener(eventName, onUserActivity, { passive: true });
  });

  scheduleIdleCheck();
})();
