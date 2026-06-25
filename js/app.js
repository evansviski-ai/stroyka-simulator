import { ROLES, getRole } from "./roles.js";
import { el, formatMoney } from "./ui-utils.js";
import { mountTimer } from "./timer.js";
import { listenPath, PATHS } from "./firebase.js";
import { mountInboxWidget } from "./ui-inbox.js";

import { mountWorkers } from "./ui-workers.js";
import { mountFinance } from "./ui-finance.js";
import { mountArchitects } from "./ui-architects.js";
import { mountEngineers } from "./ui-engineers.js";
import { mountPr } from "./ui-pr.js";
import { mountSales } from "./ui-sales.js";
import { mountHousing } from "./ui-housing.js";
import { mountDirectors } from "./ui-directors.js";
import { mountHr } from "./ui-hr.js";

const MOUNTERS = {
  worker: mountWorkers,
  finance: mountFinance,
  architects: mountArchitects,
  engineers: mountEngineers,
  pr: mountPr,
  sales: mountSales,
  housing: mountHousing,
  directors: mountDirectors,
  hr: mountHr,
};

const roleScreen = document.getElementById("role-select-screen");
const roleSelect = document.getElementById("role-select");
const enterBtn = document.getElementById("enter-role-btn");
const changeRoleBtn = document.getElementById("change-role-btn");
const roleValueEl = document.getElementById("role-value");
const appRoot = document.getElementById("app-root");
const timerDisplay = document.getElementById("timer-value");
const timerControls = document.getElementById("timer-controls");

roleSelect.innerHTML = "";
for (const [id, def] of Object.entries(ROLES)) {
  const opt = document.createElement("option");
  opt.value = id;
  opt.textContent = def.label;
  roleSelect.appendChild(opt);
}

let currentUnmount = null;
let currentInboxUnmount = null;
let currentRoleId = null;

function enterRole(roleId) {
  const def = getRole(roleId);
  if (!def) return;

  if (currentUnmount) {
    currentUnmount();
    currentUnmount = null;
  }
  if (currentInboxUnmount) {
    currentInboxUnmount();
    currentInboxUnmount = null;
  }

  currentRoleId = roleId;
  roleValueEl.textContent = def.label;
  roleScreen.classList.add("hidden");
  appRoot.innerHTML = "";

  const mounter = MOUNTERS[def.ui];
  if (mounter) {
    currentUnmount = mounter(appRoot);
  }

  // показываем входящие приказы всем ролям, кроме самих директоров
  if (roleId !== "directors") {
    const inboxHost = document.createElement("div");
    inboxHost.className = "inbox-host";
    appRoot.appendChild(inboxHost);
    currentInboxUnmount = mountInboxWidget(inboxHost, roleId);
  }
}

enterBtn.addEventListener("click", () => enterRole(roleSelect.value));
changeRoleBtn.addEventListener("click", () => roleScreen.classList.remove("hidden"));

mountTimer(timerDisplay, { showControls: true, controlsContainer: timerControls });

// сразу подгружаем общую плашку штрафов/бюджета в топбар, если применимо
const budgetTopbar = document.getElementById("topbar-budget");
listenPath(PATHS.budgetTotal, (val) => {
  if (currentRoleId === "finance" || currentRoleId === "directors") {
    budgetTopbar.textContent = formatMoney(val || 0);
    budgetTopbar.parentElement.classList.remove("hidden");
  } else {
    budgetTopbar.parentElement.classList.add("hidden");
  }
});
