import { StroykaScene } from "./scene3d.js";
import { listenPath, pushPath, removePath, updatePath, PATHS } from "./firebase.js";
import { BLOCKS, BLOCKS_BY_ID, CATEGORY_LABELS } from "./assets-registry.js";
import { el, showToast } from "./ui-utils.js";

const UTILITY_BLOCKS = BLOCKS.filter((b) => b.category === "utility");

export function mountHousing(root) {
  root.innerHTML = "";

  const header = el("div", { class: "role-header" }, [
    el("h2", {}, "ЖКХ — коммуникации и поставка материалов"),
  ]);
  root.appendChild(header);

  const layout = el("div", { class: "housing-layout" });
  root.appendChild(layout);

  const mapHost = el("div", { class: "map-host" });
  const sidePanel = el("div", { class: "card housing-side" });
  layout.appendChild(mapHost);
  layout.appendChild(sidePanel);

  const scene = new StroykaScene(mapHost);

  let currentBlockId = UTILITY_BLOCKS[0] ? UTILITY_BLOCKS[0].id : null;

  sidePanel.appendChild(el("h2", {}, "Коммуникации"));
  const blockRow = el("div", { class: "block-group-row" });
  for (const b of UTILITY_BLOCKS) {
    blockRow.appendChild(
      el("button", {
        class: "block-btn" + (b.id === currentBlockId ? " active" : ""),
        onclick: () => {
          currentBlockId = b.id;
          Array.from(blockRow.children).forEach((c) => c.classList.remove("active"));
        },
      }, b.label)
    );
  }
  sidePanel.appendChild(blockRow);

  sidePanel.appendChild(el("h2", {}, "Поставка материалов"));
  const matNameInput = el("input", { type: "text", class: "text-input", placeholder: "Название материала" });
  const matQtyInput = el("input", { type: "number", class: "money-input", placeholder: "Количество" });
  const matPriceInput = el("input", { type: "number", class: "money-input", placeholder: "Цена за ед." });
  sidePanel.appendChild(matNameInput);
  sidePanel.appendChild(matQtyInput);
  sidePanel.appendChild(matPriceInput);
  sidePanel.appendChild(
    el("button", {
      class: "btn primary",
      onclick: async () => {
        const name = matNameInput.value.trim();
        if (!name) {
          showToast("Укажите название материала");
          return;
        }
        const id = name.toLowerCase().replace(/\s+/g, "_");
        await updatePath(PATHS.materialsStock + "/" + id, {
          name,
          qty: parseFloat(matQtyInput.value) || 0,
        });
        await updatePath(PATHS.materialsCatalog + "/" + id, {
          name,
          unitPrice: parseFloat(matPriceInput.value) || 0,
        });
        showToast("Материал «" + name + "» поставлен на склад");
        matNameInput.value = "";
        matQtyInput.value = "";
        matPriceInput.value = "";
      },
    }, "Поставить на склад")
  );

  const stockList = el("div", { class: "stock-list" });
  sidePanel.appendChild(stockList);
  const unsubStock = listenPath(PATHS.materialsStock, (data) => {
    stockList.innerHTML = "";
    for (const [id, m] of Object.entries(data || {})) {
      stockList.appendChild(el("div", { class: "stock-row" }, m.name + ": " + m.qty));
    }
  });

  scene.renderer.domElement.addEventListener("contextmenu", (e) => e.preventDefault());
  scene.renderer.domElement.addEventListener("pointerdown", async (e) => {
    if (!currentBlockId) return;
    if (e.button === 0) {
      const point = scene.screenToGroundPoint(e.clientX, e.clientY);
      if (!point) return;
      const snapped = scene.snapToGrid(point);
      await pushPath(PATHS.worldObjects, {
        type: currentBlockId,
        x: snapped.x,
        z: snapped.z,
        level: 0,
        rotationY: 0,
        placedBy: "housing",
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

  const unsubObjects = listenPath(PATHS.worldObjects, (data) => scene.syncObjects(data));
  const unsubEquip = listenPath(PATHS.equipment, (data) => scene.syncEquipment(data));

  return function unmount() {
    unsubStock();
    unsubObjects();
    unsubEquip();
    scene.dispose();
  };
}
