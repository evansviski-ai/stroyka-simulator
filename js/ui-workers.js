import { StroykaScene, CELL } from "./scene3d.js";
import { listenPath, pushPath, removePath, updatePath, PATHS } from "./firebase.js";
import { BLOCKS, BLOCKS_BY_ID, CATEGORY_LABELS } from "./assets-registry.js";
import { el, showToast } from "./ui-utils.js";

export function mountWorkers(root) {
  root.innerHTML = "";

  const mapHost = el("div", { class: "map-host" });
  const toolbar = el("div", { class: "block-toolbar" });
  const goalsBar = el("div", { class: "goals-banner", id: "wk-goals" }, "Цели компании: —");

  root.appendChild(goalsBar);
  root.appendChild(mapHost);
  root.appendChild(toolbar);

  const scene = new StroykaScene(mapHost);

  let currentBlockId = BLOCKS[0].id;
  let currentRotation = 0;
  let currentLevel = 0;

  const categories = {};
  for (const b of BLOCKS) {
    (categories[b.category] = categories[b.category] || []).push(b);
  }

  function renderToolbar() {
    toolbar.innerHTML = "";
    for (const [cat, blocks] of Object.entries(categories)) {
      const group = el("div", { class: "block-group" });
      group.appendChild(el("div", { class: "block-group-label" }, CATEGORY_LABELS[cat] || cat));
      const row = el("div", { class: "block-group-row" });
      for (const b of blocks) {
        const btn = el(
          "button",
          {
            class: "block-btn" + (b.id === currentBlockId ? " active" : ""),
            "data-block-id": b.id,
            title: b.label + (b.placeholder ? " (временный вид)" : ""),
            onclick: () => {
              currentBlockId = b.id;
              renderToolbar();
            },
          },
          [
            el("span", {
              class: "block-swatch",
              style: `background:#${b.color.toString(16).padStart(6, "0")}`,
            }),
            el("span", {}, b.label + (b.placeholder ? " •" : "")),
          ]
        );
        row.appendChild(btn);
      }
      group.appendChild(row);
      toolbar.appendChild(group);
    }

    const controlsRow = el("div", { class: "block-group" });
    controlsRow.appendChild(el("div", { class: "block-group-label" }, "Уровень / поворот"));
    const ctrlRow = el("div", { class: "block-group-row" });
    ctrlRow.appendChild(
      el("button", { class: "block-btn small", onclick: () => { currentLevel = Math.max(0, currentLevel - 1); updateLevelLabel(); } }, "▼ ниже")
    );
    ctrlRow.appendChild(el("span", { class: "level-readout", id: "wk-level-readout" }, "Уровень: " + currentLevel));
    ctrlRow.appendChild(
      el("button", { class: "block-btn small", onclick: () => { currentLevel = Math.min(20, currentLevel + 1); updateLevelLabel(); } }, "▲ выше")
    );
    ctrlRow.appendChild(
      el("button", { class: "block-btn small", onclick: () => { currentRotation = (currentRotation + 90) % 360; updateLevelLabel(); } }, "⟳ повернуть")
    );
    ctrlRow.appendChild(el("span", { class: "level-readout", id: "wk-rot-readout" }, "Поворот: " + currentRotation + "°"));
    controlsRow.appendChild(ctrlRow);
    toolbar.appendChild(controlsRow);
  }

  function updateLevelLabel() {
    const lr = document.getElementById("wk-level-readout");
    const rr = document.getElementById("wk-rot-readout");
    if (lr) lr.textContent = "Уровень: " + currentLevel;
    if (rr) rr.textContent = "Поворот: " + currentRotation + "°";
  }

  renderToolbar();

  // клики по карте: ЛКМ ставит, ПКМ убирает
  let pendingObjects = {}; // локальный кэш id->data для удаления по клику по объекту
  scene.renderer.domElement.addEventListener("contextmenu", (e) => e.preventDefault());

  scene.renderer.domElement.addEventListener("pointerdown", async (e) => {
    if (e.button === 0) {
      const point = scene.screenToGroundPoint(e.clientX, e.clientY);
      if (!point) return;
      const snapped = scene.snapToGrid(point);
      const block = BLOCKS_BY_ID[currentBlockId];
      await pushPath(PATHS.worldObjects, {
        type: currentBlockId,
        x: snapped.x,
        z: snapped.z,
        level: currentLevel,
        rotationY: block.rotatable ? currentRotation : 0,
        placedBy: "workers",
        ts: Date.now(),
      });
    } else if (e.button === 2) {
      const rect = scene.renderer.domElement.getBoundingClientRect();
      scene.pointerNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      scene.pointerNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      scene.raycaster.setFromCamera(scene.pointerNdc, scene.camera);
      const hits = scene.raycaster.intersectObjects(scene.scene.children, true);
      for (const h of hits) {
        let obj = h.object;
        while (obj && !obj.userData.firebaseId) obj = obj.parent;
        if (obj && obj.userData.firebaseId) {
          await removePath(PATHS.worldObjects + "/" + obj.userData.firebaseId);
          break;
        }
      }
    }
  });

  const unsubObjects = listenPath(PATHS.worldObjects, (data) => {
    pendingObjects = data || {};
    scene.syncObjects(data);
  });

  const unsubEquip = listenPath(PATHS.equipment, (data) => {
    scene.syncEquipment(data);
  });

  const unsubGoals = listenPath(PATHS.metaGoals, (val) => {
    goalsBar.textContent = "Цели компании: " + (val || "—");
  });

  return function unmount() {
    unsubObjects();
    unsubEquip();
    unsubGoals();
    scene.dispose();
  };
}
