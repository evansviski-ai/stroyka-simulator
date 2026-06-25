import { listenPath, writePath, readPath, pushPath, PATHS } from "./firebase.js";
import { TRIP_COST, TRIP_DURATION_MIN } from "./roles.js";
import { showToast } from "./ui-utils.js";

// userId - простой случайный идентификатор сессии, держим в sessionStorage аналоге (память вкладки)
let cachedUserId = null;
export function getSessionUserId() {
  if (cachedUserId) return cachedUserId;
  cachedUserId = "u" + Math.random().toString(36).slice(2, 10);
  return cachedUserId;
}

export function tripPath(roleId, userId) {
  return `${PATHS.trips}/${roleId}/${userId}`;
}

export async function startTrip(roleId) {
  const userId = getSessionUserId();
  const currentBudget = (await readPath(PATHS.budgetTotal)) || 0;
  if (currentBudget < TRIP_COST) {
    showToast("Недостаточно бюджета на командировку (нужно " + TRIP_COST + " ₽)");
    return false;
  }
  const endsAt = Date.now() + TRIP_DURATION_MIN * 60 * 1000;
  await writePath(PATHS.budgetTotal, currentBudget - TRIP_COST);
  await pushPath(PATHS.budgetLog, {
    ts: Date.now(),
    delta: -TRIP_COST,
    reason: "Командировка (" + roleId + ")",
    byRole: roleId,
  });
  await writePath(tripPath(roleId, userId), { onTrip: true, startedAt: Date.now(), endsAt });
  showToast("Командировка начата — доступ к реальной карте на " + TRIP_DURATION_MIN + " мин.");
  return true;
}

export function listenTrip(roleId, callback) {
  const userId = getSessionUserId();
  return listenPath(tripPath(roleId, userId), (val) => {
    const active = !!(val && val.onTrip && val.endsAt > Date.now());
    callback(active, val);
  });
}
