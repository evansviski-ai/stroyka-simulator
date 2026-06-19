import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { OrbitControls } from "https://unpkg.com/three@0.160.0/examples/jsm/controls/OrbitControls.js";

const STORAGE_KEY = "stroyka-bs-world";

const state = {
role: null,
money: 100000,
buildType: "cube",
objects: []
};

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x07111f);

const camera = new THREE.PerspectiveCamera(
60,
window.innerWidth / window.innerHeight,
0.1,
2000
);

camera.position.set(20, 20, 20);

const renderer = new THREE.WebGLRenderer({
antialias: true
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;

document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(
camera,
renderer.domElement
);

controls.enableDamping = true;
controls.dampingFactor = 0.08;

const ambient = new THREE.AmbientLight(0xffffff, 1.1);
scene.add(ambient);

const dir = new THREE.DirectionalLight(0xffffff, 2);

dir.position.set(20, 40, 20);
dir.castShadow = true;

scene.add(dir);

const grid = new THREE.GridHelper(
120,
120,
0x3b82f6,
0x1e293b
);

scene.add(grid);

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

hill: new THREE.MeshStandardMaterial({
    color: 0x15803d
}),

mountain: new THREE.MeshStandardMaterial({
    color: 0x6b7280
})


};

function createHill(x, z, size) {


for (let i = 0; i < size; i++) {

    const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(2, 1, 2),
        materials.hill
    );

    mesh.position.set(
        x + Math.random() * 4,
        i * 0.5,
        z + Math.random() * 4
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

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function saveWorld() {


localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
        money: state.money,
        objects: state.objects
    })
);


}

function loadWorld() {


const raw = localStorage.getItem(STORAGE_KEY);

if (!raw) return;

const data = JSON.parse(raw);

state.money = data.money || 100000;

updateMoney();

if (data.objects) {
    data.objects.forEach(addObjectFromData);
}


}

function updateMoney() {


const el = document.getElementById("money-value");

if (!el) return;

el.innerText = state.money.toLocaleString() + " ₽";


}

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

const mat =
    materials[type.replace("-x", "").replace("-z", "")]
    || materials.cube;

return new THREE.Mesh(geo, mat);


}

function addObjectFromData(data) {


const mesh = createMesh(data.type);

mesh.position.set(
    data.x,
    data.y,
    data.z
);

mesh.userData.placed = true;

scene.add(mesh);


}

function placeObject(position) {


let type = state.buildType;

if (type === "wall") {

    type = Math.random() > 0.5
        ? "wall-x"
        : "wall-z";
}

const mesh = createMesh(type);

mesh.position.copy(position);

mesh.userData.placed = true;

scene.add(mesh);

state.objects.push({
    type: type,
    x: position.x,
    y: position.y,
    z: position.z
});

saveWorld();


}

renderer.domElement.addEventListener(
"pointerdown",
(event) => {


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
        placeObject(snapped);
    }

    if (event.button === 2) {

        const obj = intersects[0].object;

        if (!obj.userData.placed) return;

        scene.remove(obj);

        state.objects = state.objects.filter(
            item =>
                !(
                    item.x === obj.position.x
                    &&
                    item.y === obj.position.y
                    &&
                    item.z === obj.position.z
                )
        );

        saveWorld();
    }
}


);

window.addEventListener(
"contextmenu",
(e) => e.preventDefault()
);

const roleSelectScreen =
document.getElementById("role-select-screen");

const roleSelect =
document.getElementById("role-select");

const enterRoleBtn =
document.getElementById("enter-role-btn");

const roleValue =
document.getElementById("role-value");

const buildToolbar =
document.getElementById("build-toolbar");

function hideAllScreens() {


if (buildToolbar) {
    buildToolbar.classList.add("hidden");
}


}

function enterRole(role) {


state.role = role;

if (roleValue) {
    roleValue.innerText = role;
}

if (roleSelectScreen) {
    roleSelectScreen.classList.add("hidden");
}

hideAllScreens();

if (role === "workers") {

    if (buildToolbar) {
        buildToolbar.classList.remove("hidden");
    }
}


}

if (enterRoleBtn) {


enterRoleBtn.addEventListener(
    "click",
    () => {
        enterRole(roleSelect.value);
    }
);


}

document.querySelectorAll(".build-btn")
.forEach(btn => {


btn.addEventListener(
    "click",
    () => {

        document
            .querySelectorAll(".build-btn")
            .forEach(b => b.classList.remove("active-build"));

        btn.classList.add("active-build");

        state.buildType = btn.dataset.type;
    }
);


});

const addMoneyBtn =
document.getElementById("add-money-btn");

if (addMoneyBtn) {


addMoneyBtn.addEventListener(
    "click",
    () => {

        state.money += 10000;

        updateMoney();

        saveWorld();
    }
);


}

const removeMoneyBtn =
document.getElementById("remove-money-btn");

if (removeMoneyBtn) {


removeMoneyBtn.addEventListener(
    "click",
    () => {

        state.money -= 10000;

        updateMoney();

        saveWorld();
    }
);


}

const resetBtn =
document.getElementById("reset-world-btn");

if (resetBtn) {


resetBtn.addEventListener(
    "click",
    () => {

        localStorage.removeItem(STORAGE_KEY);

        location.reload();
    }
);


}

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

function animate() {


requestAnimationFrame(animate);

controls.update();

renderer.render(scene, camera);


}

animate();

updateMoney();

loadWorld();
