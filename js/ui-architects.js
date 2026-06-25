import { createDrawBoard } from "./drawboard.js";
import { PATHS, listenPath } from "./firebase.js";
import { startTrip, listenTrip } from "./trips.js";
import { StroykaScene } from "./scene3d.js";
import { el, formatClock } from "./ui-utils.js";
import { TRIP_COST, TRIP_DURATION_MIN } from "./roles.js";

export function mountArchitects(root) {
  root.innerHTML = "";

  const header = el("div", { class: "role-header" }, [
    el("h2", {}, "Архитектурное бюро — макет жилого комплекса"),
    el("p", { class: "muted" }, "Школа, садик, забор, мост через реку. Рисуйте макет ниже."),
  ]);

  const tripBar = el("div", { class: "trip-bar" });
  const stage = el("div", { class: "architect-stage" });

  root.appendChild(header);
  root.appendChild(tripBar);
  root.appendChild(stage);

  const canvasWrap = el("div", { class: "canvas-wrap" });
  const canvas = el("canvas", { width: "900", height: "600", class: "draw-canvas" });
  canvasWrap.appendChild(canvas);

  const toolsRow = el("div", { class: "draw-tools" });
  const colors = ["#111827", "#1d4ed8", "#16a34a", "#dc2626", "#a16207"];
  for (const c of colors) {
    toolsRow.appendChild(
      el("button", {
        class: "color-swatch",
        style: `background:${c}`,
        onclick: () => board.setColor(c),
      })
    );
  }
  toolsRow.appendChild(el("button", { class: "btn", onclick: () => board.clear() }, "Очистить"));

  const drawSection = el("div", {}, [toolsRow, canvasWrap]);

  let mapHost = null;
  let scene = null;
  let unsubTrip = null;

  function renderSchematicView() {
    stage.innerHTML = "";
    stage.appendChild(drawSection);
    const schematic = el("div", { class: "schematic-placeholder" }, [
      el("h3", {}, "Карта местности (схематично)"),
      el("p", { class: "muted" }, "Реальное положение на игровом поле видно только в командировке."),
      el("div", { class: "schematic-grid" }),
    ]);
    stage.appendChild(schematic);
  }

  function renderRealMapView() {
    stage.innerHTML = "";
    stage.appendChild(drawSection);
    mapHost = el("div", { class: "map-host trip-map" });
    stage.appendChild(mapHost);
    scene = new StroykaScene(mapHost);
    const unsubObjects = listenPath(PATHS.worldObjects, (data) => scene.syncObjects(data));
    const unsubEquip = listenPath(PATHS.equipment, (data) => scene.syncEquipment(data));
    scene._cleanupListeners = () => {
      unsubObjects();
      unsubEquip();
    };
  }

  function teardownMap() {
    if (scene) {
      if (scene._cleanupListeners) scene._cleanupListeners();
      scene.dispose();
      scene = null;
    }
  }

  function renderTripBar(active, tripData) {
    tripBar.innerHTML = "";
    if (active) {
      const remaining = tripData.endsAt - Date.now();
      tripBar.appendChild(
        el("div", { class: "trip-active" }, [
          el("span", {}, "В командировке — реальная карта доступна. "),
          el("span", { class: "trip-clock" }, formatClock(remaining)),
        ])
      );
    } else {
      tripBar.appendChild(
        el("button", { class: "btn primary", onclick: () => startTrip("architects") }, [
          "В командировку (",
          TRIP_COST.toLocaleString("ru-RU"),
          " ₽, ",
          String(TRIP_DURATION_MIN),
          " мин реальной карты)",
        ])
      );
    }
  }

  let tickTimer = null;
  let wasActive = false;

  unsubTrip = listenTrip("architects", (active, tripData) => {
    renderTripBar(active, tripData || {});
    if (active !== wasActive) {
      wasActive = active;
      teardownMap();
      if (active) renderRealMapView();
      else renderSchematicView();
    }
    clearInterval(tickTimer);
    if (active) {
      tickTimer = setInterval(() => renderTripBar(active, tripData), 1000);
    }
  });

  renderSchematicView();

  const board = createDrawBoard({
    canvas,
    path: PATHS.architectureMasterplan,
    color: "#111827",
  });

  return function unmount() {
    board.destroy();
    if (unsubTrip) unsubTrip();
    clearInterval(tickTimer);
    teardownMap();
  };
}
