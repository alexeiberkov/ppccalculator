(function initBugsIdle() {
  const IDLE_MS = 10000;
  const SPAWN_EVERY_MS = 2200;
  const INITIAL_COUNT = 2;
  const MAX_INSECTS = 18;
  const INSECT_SIZE = 44;
  const MARGIN = 32;
  const FLEE_PAD = INSECT_SIZE * 2;
  const INSECT_IMAGES = {
    mosquito: "images/mosquito.png",
    fly: "images/fly.png",
  };

  let idleTimer = null;
  let active = false;
  let fleeing = false;
  let animationFrame = null;
  let layerEl = null;
  let idleStartAt = 0;
  const insects = [];

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  function randomPosition() {
    const maxX = Math.max(MARGIN, window.innerWidth - MARGIN - INSECT_SIZE);
    const maxY = Math.max(MARGIN, window.innerHeight - MARGIN - INSECT_SIZE);
    return {
      x: MARGIN + Math.random() * (maxX - MARGIN),
      y: MARGIN + Math.random() * (maxY - MARGIN),
    };
  }

  function pickNewTarget(insect) {
    const target = randomPosition();
    insect.targetX = target.x;
    insect.targetY = target.y;
  }

  function randomType() {
    return Math.random() < 0.5 ? "mosquito" : "fly";
  }

  function createInsect(type) {
    const stationary = Math.random() < 0.28;
    let speed = 0;
    let pace = "normal";

    if (!stationary) {
      const roll = Math.random();
      if (roll < 0.22) {
        pace = "fast";
        speed = 2.4 + Math.random() * 1.6;
      } else if (roll < 0.78) {
        pace = "normal";
        speed =
          (type === "mosquito" ? 0.65 : 1.05) + Math.random() * 0.55;
      } else {
        pace = "slow";
        speed = 0.3 + Math.random() * 0.35;
      }
    }

    const el = document.createElement("div");
    el.className = `bugs-idle__insect bugs-idle__insect--${type}`;
    if (stationary) {
      el.classList.add("bugs-idle__insect--stationary");
    } else if (pace === "fast") {
      el.classList.add("bugs-idle__insect--fast");
    }

    const sprite = document.createElement("img");
    sprite.className = "bugs-idle__sprite";
    sprite.src = INSECT_IMAGES[type];
    sprite.alt = "";
    sprite.decoding = "async";
    el.appendChild(sprite);

    const start = randomPosition();
    const insect = {
      type,
      el,
      sprite,
      x: start.x,
      y: start.y,
      targetX: start.x,
      targetY: start.y,
      stationary,
      pace,
      speed,
      wobblePhase: Math.random() * Math.PI * 2,
      nextWanderAt: 0,
      fleeVx: 0,
      fleeVy: 0,
    };

    if (!stationary) {
      pickNewTarget(insect);
    }

    return insect;
  }

  function ensureLayer() {
    if (layerEl) return;

    layerEl = document.createElement("div");
    layerEl.id = "bugs-idle-layer";
    layerEl.className = "bugs-idle";
    layerEl.setAttribute("aria-hidden", "true");
    document.body.appendChild(layerEl);
  }

  function placeInsect(insect, now) {
    insect.el.style.left = `${insect.x}px`;
    insect.el.style.top = `${insect.y}px`;
    if (!insect.stationary) {
      insect.nextWanderAt = now + Math.random() * 1500;
    }
  }

  function spawnInsect(now) {
    const insect = createInsect(randomType());
    insects.push(insect);
    layerEl.appendChild(insect.el);
    placeInsect(insect, now);
  }

  function targetInsectCount(idleDurationMs) {
    return Math.min(
      MAX_INSECTS,
      INITIAL_COUNT + Math.floor(idleDurationMs / SPAWN_EVERY_MS),
    );
  }

  function syncInsectCount(now) {
    const desired = targetInsectCount(now - idleStartAt);
    while (insects.length < desired) {
      spawnInsect(now);
    }
  }

  function isOffScreen(insect) {
    return (
      insect.x < -FLEE_PAD ||
      insect.x > window.innerWidth + FLEE_PAD ||
      insect.y < -FLEE_PAD ||
      insect.y > window.innerHeight + FLEE_PAD
    );
  }

  function setFacing(insect, dx) {
    if (Math.abs(dx) > 0.5) {
      const facing = dx < 0 ? -1 : 1;
      insect.sprite.style.transform = `scaleX(${facing})`;
    }
  }

  function updateWanderingInsect(insect, now) {
    insect.wobblePhase += insect.stationary
      ? 0.08
      : insect.type === "mosquito"
        ? 0.22
        : 0.28;

    if (insect.stationary) {
      const wobbleX = Math.sin(insect.wobblePhase) * 1.2;
      const wobbleY = Math.cos(insect.wobblePhase * 1.3) * 0.8;
      insect.el.style.left = `${insect.x + wobbleX}px`;
      insect.el.style.top = `${insect.y + wobbleY}px`;
      return;
    }

    const dx = insect.targetX - insect.x;
    const dy = insect.targetY - insect.y;
    const dist = Math.hypot(dx, dy);

    if (dist < 6 || now >= insect.nextWanderAt) {
      pickNewTarget(insect);
      insect.nextWanderAt = now + 900 + Math.random() * 2400;
      return;
    }

    const step = insect.speed;
    insect.x += (dx / dist) * step;
    insect.y += (dy / dist) * step;

    const wobbleX = Math.sin(insect.wobblePhase) * 3;
    const wobbleY = Math.cos(insect.wobblePhase * 1.4) * 2;

    insect.el.style.left = `${insect.x + wobbleX}px`;
    insect.el.style.top = `${insect.y + wobbleY}px`;
    setFacing(insect, dx);
  }

  function updateFleeingInsect(insect) {
    insect.wobblePhase += insect.type === "mosquito" ? 0.32 : 0.4;
    insect.x += insect.fleeVx;
    insect.y += insect.fleeVy;

    const wobbleX = Math.sin(insect.wobblePhase) * 2.5;
    const wobbleY = Math.cos(insect.wobblePhase * 1.4) * 1.8;

    insect.el.style.left = `${insect.x + wobbleX}px`;
    insect.el.style.top = `${insect.y + wobbleY}px`;
    setFacing(insect, insect.fleeVx);
  }

  function tick(now) {
    if (fleeing) {
      for (let i = insects.length - 1; i >= 0; i -= 1) {
        const insect = insects[i];
        updateFleeingInsect(insect);
        if (isOffScreen(insect)) {
          insect.el.remove();
          insects.splice(i, 1);
        }
      }

      if (insects.length === 0) {
        finishFlee();
        return;
      }

      animationFrame = requestAnimationFrame(tick);
      return;
    }

    if (!active) return;

    syncInsectCount(now);
    insects.forEach((insect) => updateWanderingInsect(insect, now));
    animationFrame = requestAnimationFrame(tick);
  }

  function clearInsects() {
    insects.length = 0;
    if (layerEl) {
      layerEl.replaceChildren();
    }
  }

  function finishFlee() {
    fleeing = false;
    if (animationFrame !== null) {
      cancelAnimationFrame(animationFrame);
      animationFrame = null;
    }
    if (layerEl) {
      layerEl.classList.remove("bugs-idle--visible", "bugs-idle--fleeing");
    }
    clearInsects();
  }

  function scatterBugs() {
    if (!active || fleeing) return;

    active = false;
    fleeing = true;
    idleStartAt = 0;
    scheduleIdleCheck();

    if (insects.length === 0) {
      finishFlee();
      return;
    }

    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    insects.forEach((insect) => {
      let angle = Math.atan2(insect.y - centerY, insect.x - centerX);
      angle += (Math.random() - 0.5) * 1.1;

      const fleeSpeed = 5 + Math.random() * 4;
      insect.fleeVx = Math.cos(angle) * fleeSpeed;
      insect.fleeVy = Math.sin(angle) * fleeSpeed;
      insect.el.classList.remove("bugs-idle__insect--stationary");
      insect.el.classList.add("bugs-idle__insect--fast");
    });

    if (layerEl) {
      layerEl.classList.add("bugs-idle--fleeing");
    }

    if (animationFrame === null) {
      animationFrame = requestAnimationFrame(tick);
    }
  }

  function showBugs() {
    if (active || fleeing) return;

    ensureLayer();
    active = true;
    idleStartAt = performance.now();
    layerEl.classList.add("bugs-idle--visible");

    for (let i = 0; i < INITIAL_COUNT; i += 1) {
      spawnInsect(idleStartAt);
    }

    animationFrame = requestAnimationFrame(tick);
  }

  function scheduleIdleCheck() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(showBugs, IDLE_MS);
  }

  function onUserActivity() {
    if (fleeing) {
      scheduleIdleCheck();
      return;
    }

    if (active) {
      scatterBugs();
      return;
    }

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
