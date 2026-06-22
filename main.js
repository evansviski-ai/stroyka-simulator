import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

import { OrbitControls } from "https://unpkg.com/three@0.160.0/examples/jsm/controls/OrbitControls.js?module";

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
getDatabase,
ref,
push,
set,
onValue,
remove
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";







/* =========================================================
FIREBASE
========================================================= */

const firebaseConfig = {
apiKey: "AIzaSyCDoON8VQKnb9Eh4UtogG_aqn9P4bMlL4A",
authDomain: "stroyka-bs.firebaseapp.com",
databaseURL: "https://stroyka-bs-default-rtdb.europe-west1.firebasedatabase.app",
projectId: "stroyka-bs",
storageBucket: "stroyka-bs.firebasestorage.app",
messagingSenderId: "555859205094",
appId: "1:555859205094:web:0a243c20597ee165161427"
};

const app = initializeApp(firebaseConfig);

const db = getDatabase(app);

const worldRef = ref(db, "world");







/* =========================================================
STATE
========================================================= */

const state = {
role: null,
money: 100000,
buildType: "cube",
objects: {}
};







/* =========================================================
THREE
========================================================= */

const scene = new THREE.Scene();

scene.background = new THREE.Color(0x07111f);







const camera = new THREE.PerspectiveCamera(
60,
window.innerWidth / window.innerHeight,
0.1,
2000
);

camera.position.set(25, 25, 25);







const renderer = new THREE.WebGLRenderer({
antialias: true
});

renderer.setSize(
window.innerWidth,
window.innerHeight
);

renderer.shadowMap.enabled = true;

document.body.appendChild(renderer.domElement);







/* =========================================================
CONTROLS
========================================================= */

const controls = new OrbitControls(
camera,
renderer.domElement
);

controls.enableDamping = true;

controls.target.set(0, 0, 0);







/* =========================================================
LIGHT
========================================================= */

const ambient = new THREE.AmbientLight(
0xffffff,
1.2
);

scene.add(ambient);







const dir = new THREE.DirectionalLight(
0xffffff,
2
);

dir.position.set(20, 40, 20);

dir.castShadow = true;

scene.add(dir);







/* =========================================================
GRID
========================================================= */

const grid = new THREE.GridHelper(
120,
120,
0x3b82f6,
0x1e293b
);

scene.add(grid);







/* =========================================================
MATERIALS
========================================================= */

const materials = {

cube: new THREE.MeshStandardMaterial({
    color: 0xcbd5e1
}),

wall: new THREE.MeshStandardMaterial({
    color: 0xb45309
}),

roof: new THREE.MeshStandardMaterial({
    color: 0xdc2626
}),

window: new THREE.MeshStandardMaterial({
    color: 0x38bdf8
}),

door: new THREE.MeshStandardMaterial({
    color: 0x78350f
}),

hill: new THREE.MeshStandardMaterial({
    color: 0x15803d
}),

mountain: new THREE.MeshStandardMaterial({
    color: 0x6b7280
})

};







/* =========================================================
MAP
========================================================= */

function createHill(x, z, size) {

for (let i = 0; i < size; i++) {

    const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(2, 1, 2),
        materials.hill
    );

    mesh.position.set(
        x + Math.random() * 5,
        i * 0.5,
        z + Math.random() * 5
    );

    scene.add(mesh);
}

}







function createMountain(x, z, height) {

for (let y = 0; y < height; y++) {

    for (let i = 0; i < height - y; i++) {

        const mesh = new THREE.Mesh(
            new THREE.BoxGeometry(2, 2, 2),
            materials.mountain
        );

        mesh.position.set(
            x + i * 2,
            y * 2,
            z
        );

        scene.add(mesh);
    }
}

}







createHill(-15, -15, 8);

createHill(20, -10, 10);

createMountain(-25, 10, 6);







/* =========================================================
BUILD
========================================================= */

function createMesh(type) {

let geo;

if (type === "wall-x") {

    geo = new THREE.BoxGeometry(4, 2, 1);
}

else if (type === "wall-z") {

    geo = new THREE.BoxGeometry(1, 2, 4);
}

else if (type === "roof") {

    geo = new THREE.BoxGeometry(2, 0.5, 2);
}

else {

    geo = new THREE.BoxGeometry(2, 2, 2);
}

const materialName =
    type.replace("-x", "").replace("-z", "");

return new THREE.Mesh(
    geo,
    materials[materialName] || materials.cube
);

}







function spawnObject(id, data) {

if (state.objects[id]) return;

const mesh = createMesh(data.type);

mesh.position.set(
    data.x,
    data.y,
    data.z
);

mesh.userData.firebaseId = id;

scene.add(mesh);

state.objects[id] = mesh;

}







function removeObject(id) {

if (!state.objects[id]) return;

scene.remove(state.objects[id]);

delete state.objects[id];

}







/* =========================================================
FIREBASE SYNC
========================================================= */

onValue(worldRef, snapshot => {

const data = snapshot.val() || {};

Object.keys(state.objects).forEach(id => {

    if (!data[id]) {

        removeObject(id);
    }
});

Object.entries(data).forEach(([id, obj]) => {

    spawnObject(id, obj);
});

});







/* =========================================================
CLICK
========================================================= */

const raycaster = new THREE.Raycaster();

const mouse = new THREE.Vector2();







renderer.domElement.addEventListener(
"pointerdown",
async (event) => {

    if (state.role !== "workers") return;

    mouse.x =
        (event.clientX / window.innerWidth) * 2 - 1;

    mouse.y =
        -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const intersects =
        raycaster.intersectObjects(scene.children);

    if (!intersects.length) return;

    const point = intersects[0].point;

    const snapped = new THREE.Vector3(
        Math.round(point.x / 2) * 2,
        1,
        Math.round(point.z / 2) * 2
    );

    if (event.button === 0) {

        let type = state.buildType;

        if (type === "wall") {

            type =
                Math.random() > 0.5
                    ? "wall-x"
                    : "wall-z";
        }

        await push(worldRef, {
            type,
            x: snapped.x,
            y: snapped.y,
            z: snapped.z
        });
    }

    if (event.button === 2) {

        const obj = intersects[0].object;

        if (!obj.userData.firebaseId) return;

        await remove(
            ref(
                db,
                `world/${obj.userData.firebaseId}`
            )
        );
    }
}

);







window.addEventListener(
"contextmenu",
e => e.preventDefault()
);







/* =========================================================
UI
========================================================= */

const roleScreen =
document.getElementById("role-select-screen");

const roleSelect =
document.getElementById("role-select");

const enterBtn =
document.getElementById("enter-role-btn");

const roleValue =
document.getElementById("role-value");

const buildToolbar =
document.getElementById("build-toolbar");

const directorsUI =
document.getElementById("directors-ui");

const financeUI =
document.getElementById("finance-ui");

const prUI =
document.getElementById("pr-ui");







function hideAllScreens() {

buildToolbar.classList.add("hidden");

directorsUI.classList.add("hidden");

financeUI.classList.add("hidden");

prUI.classList.add("hidden");

}







function enterRole(role) {

state.role = role;

roleValue.innerText = role;

roleScreen.classList.add("hidden");

hideAllScreens();

if (role === "workers") {

    buildToolbar.classList.remove("hidden");
}

if (role === "directors") {

    directorsUI.classList.remove("hidden");
}

if (role === "finance") {

    financeUI.classList.remove("hidden");
}

if (role === "pr") {

    prUI.classList.remove("hidden");
}

}







enterBtn.addEventListener(
"click",
() => {

    enterRole(roleSelect.value);
}

);







document.getElementById(
"change-role-btn"
).addEventListener(
"click",
() => {

    roleScreen.classList.remove("hidden");
}

);







document.querySelectorAll(".build-btn")
.forEach(btn => {

btn.addEventListener(
    "click",
    () => {

        document
            .querySelectorAll(".build-btn")
            .forEach(b => {

                b.classList.remove("active-build");
            });

        btn.classList.add("active-build");

        state.buildType =
            btn.dataset.type;
    }
);

});







/* =========================================================
MONEY
========================================================= */

function updateMoney() {

document.getElementById("money-value")
    .innerText =
    state.money.toLocaleString() + " ₽";

}







document.getElementById(
"add-money-btn"
).addEventListener(
"click",
() => {

    state.money += 10000;

    updateMoney();
}

);







document.getElementById(
"remove-money-btn"
).addEventListener(
"click",
() => {

    state.money -= 10000;

    updateMoney();
}

);







/* =========================================================
RESET
========================================================= */

document.getElementById(
"reset-world-btn"
).addEventListener(
"click",
async () => {

    await set(worldRef, null);

    location.reload();
}

);







/* =========================================================
PR DRAW
========================================================= */

const canvas =
document.getElementById("pr-canvas");

const ctx =
canvas.getContext("2d");

ctx.fillStyle = "white";

ctx.fillRect(
0,
0,
canvas.width,
canvas.height
);

let drawing = false;







canvas.addEventListener(
"pointerdown",
() => drawing = true
);

canvas.addEventListener(
"pointerup",
() => drawing = false
);







canvas.addEventListener(
"pointermove",
e => {

    if (!drawing) return;

    const rect =
        canvas.getBoundingClientRect();

    const x =
        e.clientX - rect.left;

    const y =
        e.clientY - rect.top;

    ctx.fillStyle = "#111827";

    ctx.beginPath();

    ctx.arc(
        x,
        y,
        4,
        0,
        Math.PI * 2
    );

    ctx.fill();
}

);







/* =========================================================
RESIZE
========================================================= */

window.addEventListener(
"resize",
() => {

    camera.aspect =
        window.innerWidth / window.innerHeight;

    camera.updateProjectionMatrix();

    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );
}

);







/* =========================================================
LOOP
========================================================= */

function animate() {

requestAnimationFrame(animate);

controls.update();

renderer.render(scene, camera);

}

animate();

updateMoney();
