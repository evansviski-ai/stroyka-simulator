import { PATHS, listenPath, writePath } from "./firebase.js";
import { formatClock } from "./ui-utils.js";

export function mountTimer(displayEl, { showControls, controlsContainer } = {}) {
  let endsAt = null;
  let tickInterval = null;

  function tick() {
    if (!endsAt) {
      displayEl.textContent = "—:—";
      return;
    }
    displayEl.textContent = formatClock(endsAt - Date.now());
  }

  const unsub = listenPath(PATHS.metaTimerEndsAt, (val) => {
    endsAt = val || null;
    tick();
  });

  tickInterval = setInterval(tick, 500);
  tick();

  if (showControls && controlsContainer) {
    const startBtn = document.createElement("button");
    startBtn.className = "btn small";
    startBtn.textContent = "Запустить 15 мин";
    startBtn.onclick = () => {
      writePath(PATHS.metaTimerEndsAt, Date.now() + 15 * 60 * 1000);
      writePath(PATHS.metaTimerDuration, 15);
    };
    controlsContainer.appendChild(startBtn);
  }

  return function unmount() {
    unsub();
    clearInterval(tickInterval);
  };
}
