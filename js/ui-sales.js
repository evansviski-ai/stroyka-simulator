import { PATHS, listenPath, pushPath, updatePath, removePath } from "./firebase.js";
import { el, formatMoney, showToast } from "./ui-utils.js";

const STATUS_LABELS = {
  available: "В продаже",
  reserved: "Забронирован",
  sold: "Продан",
};

export function mountSales(root) {
  root.innerHTML = "";

  const header = el("div", { class: "role-header" }, [
    el("h2", {}, "Продажи"),
    el("p", { class: "muted" }, "Список юнитов комплекса, цены и статусы."),
  ]);
  root.appendChild(header);

  const addForm = el("div", { class: "card add-listing-form" });
  const nameInput = el("input", { type: "text", placeholder: "Название (Дом 1, Кв. 12...)", class: "text-input" });
  const priceInput = el("input", { type: "number", placeholder: "Цена ₽", class: "money-input" });
  addForm.appendChild(el("h2", {}, "Добавить лот"));
  const formRow = el("div", { class: "btn-row" }, [
    nameInput,
    priceInput,
    el("button", {
      class: "btn primary",
      onclick: async () => {
        if (!nameInput.value.trim()) {
          showToast("Укажите название лота");
          return;
        }
        await pushPath(PATHS.salesListings, {
          name: nameInput.value.trim(),
          price: parseFloat(priceInput.value) || 0,
          status: "available",
          ts: Date.now(),
        });
        nameInput.value = "";
        priceInput.value = "";
      },
    }, "Добавить"),
  ]);
  addForm.appendChild(formRow);
  root.appendChild(addForm);

  const listingsCard = el("div", { class: "card" });
  listingsCard.appendChild(el("h2", {}, "Лоты"));
  const listingsBody = el("div", { class: "listings-body" });
  listingsCard.appendChild(listingsBody);
  root.appendChild(listingsCard);

  function renderListings(data) {
    listingsBody.innerHTML = "";
    const entries = Object.entries(data || {}).sort((a, b) => (a[1].ts || 0) - (b[1].ts || 0));
    if (!entries.length) {
      listingsBody.appendChild(el("p", { class: "muted" }, "Лотов пока нет."));
      return;
    }
    for (const [id, listing] of entries) {
      const row = el("div", { class: "listing-row status-" + listing.status });
      row.appendChild(el("div", { class: "listing-name" }, listing.name));
      const priceInputEl = el("input", {
        type: "number",
        class: "money-input small",
        value: String(listing.price),
      });
      priceInputEl.addEventListener("change", () => {
        updatePath(PATHS.salesListings + "/" + id, { price: parseFloat(priceInputEl.value) || 0 });
      });
      row.appendChild(priceInputEl);
      row.appendChild(el("span", { class: "status-badge" }, STATUS_LABELS[listing.status] || listing.status));

      const select = el("select", { class: "status-select" });
      for (const [key, label] of Object.entries(STATUS_LABELS)) {
        const opt = el("option", { value: key }, label);
        if (key === listing.status) opt.setAttribute("selected", "selected");
        select.appendChild(opt);
      }
      select.addEventListener("change", () => {
        updatePath(PATHS.salesListings + "/" + id, { status: select.value });
      });
      row.appendChild(select);

      row.appendChild(
        el("button", {
          class: "btn danger small",
          onclick: () => removePath(PATHS.salesListings + "/" + id),
        }, "Удалить")
      );

      listingsBody.appendChild(row);
    }
  }

  const unsub = listenPath(PATHS.salesListings, renderListings);

  return function unmount() {
    unsub();
  };
}
