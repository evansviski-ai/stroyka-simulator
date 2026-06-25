import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getDatabase,
  ref,
  push,
  set,
  update,
  get,
  onValue,
  off,
  remove,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyCDoON8VQKnb9Eh4UtogG_aqn9P4bMlL4A",
  authDomain: "stroyka-bs.firebaseapp.com",
  databaseURL: "https://stroyka-bs-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "stroyka-bs",
  storageBucket: "stroyka-bs.firebasestorage.app",
  messagingSenderId: "555859205094",
  appId: "1:555859205094:web:0a243c20597ee165161427",
};

export const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);

// ---- общие хелперы ----
export function pathRef(path) {
  return ref(db, path);
}

export function listenPath(path, callback) {
  const r = ref(db, path);
  onValue(r, (snap) => callback(snap.val()));
  return () => off(r);
}

export async function readPath(path) {
  const snap = await get(ref(db, path));
  return snap.val();
}

export async function writePath(path, value) {
  return set(ref(db, path), value);
}

export async function updatePath(path, value) {
  return update(ref(db, path), value);
}

export async function pushPath(path, value) {
  return push(ref(db, path), value);
}

export async function removePath(path) {
  return remove(ref(db, path));
}

export function nowStamp() {
  return serverTimestamp();
}

/* =========================================================
   ВЕТКИ ДАННЫХ — см. ARCHITECTURE.md
========================================================= */

export const PATHS = {
  metaTimerEndsAt: "meta/timerEndsAt",
  metaTimerDuration: "meta/timerDurationMin",
  metaGoals: "meta/companyGoals",
  metaTechReq: "meta/techRequirements",

  budgetTotal: "budget/total",
  budgetLog: "budget/log",

  materialsStock: "materials/stock",
  materialsCatalog: "materials/catalog",

  worldObjects: "world/objects",

  architectureMasterplan: "architecture/masterplan",
  engineeringBlueprint: "engineering/blueprint",
  marketingBoard: "marketing/board",

  salesListings: "sales/listings",

  directives: "directives",

  trips: "trips",

  equipment: "equipment",

  presence: "presence",

  penalties: "penalties",
};
