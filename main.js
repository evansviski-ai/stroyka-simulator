import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160/build/three.module.js";

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";

import {
    getDatabase,
    ref,
    push,
    onChildAdded
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";





/* ---------------- FIREBASE ---------------- */

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

const database = getDatabase(app);

const blocksRef = ref(database, "blocks");





/* ---------------- THREE.JS ---------------- */

const scene = new THREE.Scene();

scene.background = new THREE.Color(0x081225);

const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

camera.position.set(12, 12, 12);

camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({
    antialias: true
});

renderer.setSize(window.innerWidth, window.innerHeight);

renderer.shadowMap.enabled = true;

document.body.appendChild(renderer.domElement);





/* ---------------- LIGHT ---------------- */

const hemi = new THREE.HemisphereLight(
    0xffffff,
    0x223344,
    1.2
);

scene.add(hemi);

const dirLight = new THREE.DirectionalLight(
    0xffffff,
    1
);

dirLight.position.set(10, 20, 10);

dirLight.castShadow = true;

scene.add(dirLight);





/* ---------------- GRID ---------------- */

const grid = new THREE.GridHelper(
    50,
    50,
    0x3b82f6,
    0x1e293b
);

scene.add(grid);





/* ---------------- GROUND ---------------- */

const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(50, 50),
    new THREE.MeshStandardMaterial({
        color: 0x0f172a
    })
);

ground.rotation.x = -Math.PI / 2;

ground.receiveShadow = true;

scene.add(ground);





/* ---------------- ROLE UI ---------------- */

const roleButtons = document.querySelectorAll(".role-btn");

roleButtons.forEach(btn => {

    btn.addEventListener("click", () => {

        roleButtons.forEach(b => {
            b.classList.remove("active-role");
        });

        btn.classList.add("active-role");

        console.log("ROLE:", btn.innerText);
    });
});





/* ---------------- BUILD TYPES ---------------- */

let currentType = "cube";

const buildButtons = document.querySelectorAll(".build-btn");

buildButtons.forEach(btn => {

    btn.addEventListener("click", () => {

        currentType = btn.dataset.type;

        buildButtons.forEach(b => {
            b.classList.remove("active-build");
        });

        btn.classList.add("active-build");

        console.log("BUILD:", currentType);
    });
});





/* ---------------- MATERIALS ---------------- */

const materials = {

    cube: new THREE.MeshStandardMaterial({
        color: 0x94a3b8
    }),

    wall: new THREE.MeshStandardMaterial({
        color: 0x64748b
    }),

    roof: new THREE.MeshStandardMaterial({
        color: 0xdc2626
    }),

    window: new THREE.MeshStandardMaterial({
        color: 0x7dd3fc,
        transparent: true,
        opacity: 0.5
    }),

    door: new THREE.MeshStandardMaterial({
        color: 0x78350f
    })
};





/* ---------------- CREATE BLOCK ---------------- */

function createBlock(data) {

    let geometry;
    let material;

    switch (data.type) {

        case "cube":

            geometry = new THREE.BoxGeometry(1, 1, 1);

            material = materials.cube;

            break;

        case "wall":

            geometry = new THREE.BoxGeometry(2, 1, 0.3);

            material = materials.wall;

            break;

        case "roof":

            geometry = new THREE.ConeGeometry(1, 1, 4);

            material = materials.roof;

            break;

        case "window":

            geometry = new THREE.BoxGeometry(1.2, 1.2, 0.1);

            material = materials.window;

            break;

        case "door":

            geometry = new THREE.BoxGeometry(1, 2, 0.2);

            material = materials.door;

            break;

        default:

            geometry = new THREE.BoxGeometry(1, 1, 1);

            material = materials.cube;
    }

    const mesh = new THREE.Mesh(
        geometry,
        material
    );

    mesh.position.set(
        data.x,
        data.y,
        data.z
    );

    if (data.type === "roof") {
        mesh.rotation.y = Math.PI / 4;
    }

    mesh.castShadow = true;

    mesh.receiveShadow = true;

    scene.add(mesh);
}





/* ---------------- FIREBASE SYNC ---------------- */

onChildAdded(blocksRef, snapshot => {

    const data = snapshot.val();

    createBlock(data);
});





/* ---------------- BUILDING ---------------- */

const raycaster = new THREE.Raycaster();

const mouse = new THREE.Vector2();

window.addEventListener("click", onClick);

function onClick(event) {

    if (event.target.closest(".sidebar")) return;

    mouse.x =
        (event.clientX / window.innerWidth) * 2 - 1;

    mouse.y =
        -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const intersects =
        raycaster.intersectObject(ground);

    if (intersects.length === 0) return;

    const point = intersects[0].point;

    const x = Math.round(point.x);

    const z = Math.round(point.z);

    let y = 0.5;

    if (currentType === "door") {
        y = 1;
    }

    if (currentType === "roof") {
        y = 1;
    }

    if (currentType === "window") {
        y = 1.2;
    }

    push(blocksRef, {
        type: currentType,
        x,
        y,
        z
    });
}





/* ---------------- CAMERA ---------------- */

const keys = {};

window.addEventListener("keydown", e => {

    keys[e.key.toLowerCase()] = true;
});

window.addEventListener("keyup", e => {

    keys[e.key.toLowerCase()] = false;
});

window.addEventListener("wheel", e => {

    camera.position.y += e.deltaY * 0.01;

    camera.position.y =
        Math.max(
            4,
            Math.min(40, camera.position.y)
        );
});

function updateCamera() {

    const speed = 0.15;

    if (keys["w"]) {
        camera.position.z -= speed;
    }

    if (keys["s"]) {
        camera.position.z += speed;
    }

    if (keys["a"]) {
        camera.position.x -= speed;
    }

    if (keys["d"]) {
        camera.position.x += speed;
    }

    camera.lookAt(0, 0, 0);
}





/* ---------------- RESIZE ---------------- */

window.addEventListener("resize", () => {

    camera.aspect =
        window.innerWidth / window.innerHeight;

    camera.updateProjectionMatrix();

    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );
});





/* ---------------- LOOP ---------------- */

function animate() {

    requestAnimationFrame(animate);

    updateCamera();

    renderer.render(scene, camera);
}

animate();
