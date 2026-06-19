```js id="n9v4qs"
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160/build/three.module.js";

import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.160/examples/jsm/controls/OrbitControls.js";

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";

import {
    getDatabase,
    ref,
    push,
    onChildAdded,
    onChildRemoved,
    set,
    get,
    remove
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";





/* ---------------- FIREBASE ---------------- */

const firebaseConfig = {
    apiKey: "AIzaSyCDoON8VQKnb9Eh4UtogG_aqn9P4bMlL4A",
    authDomain: "stroyka-bs.firebaseapp.com",
    databaseURL: "https://stroyka-bs-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "stroyka-bs",
    storageBucket: "stroyka-bs.firebasestorage.app",
    messagingSenderId: "555859205094",
    appId: "1:55585920597ee165161427"
};

const app = initializeApp(firebaseConfig);

const db = getDatabase(app);

const blocksRef = ref(db, "blocks");

const moneyRef = ref(db, "money");





/* ---------------- BASIC ---------------- */

const scene = new THREE.Scene();

scene.background = new THREE.Color(0x09111f);

scene.fog = new THREE.Fog(0x09111f, 30, 140);

const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    500
);

camera.position.set(20, 22, 20);

const renderer = new THREE.WebGLRenderer({
    antialias: true
});

renderer.setSize(
    window.innerWidth,
    window.innerHeight
);

renderer.shadowMap.enabled = true;

renderer.shadowMap.type =
    THREE.PCFSoftShadowMap;

document.body.appendChild(renderer.domElement);





/* ---------------- CONTROLS ---------------- */

const controls = new OrbitControls(
    camera,
    renderer.domElement
);

controls.enableDamping = true;

controls.target.set(0, 0, 0);

controls.maxPolarAngle = Math.PI / 2.1;

controls.minDistance = 10;

controls.maxDistance = 90;





/* ---------------- LIGHT ---------------- */

const hemi = new THREE.HemisphereLight(
    0xffffff,
    0x223344,
    1.4
);

scene.add(hemi);

const dir = new THREE.DirectionalLight(
    0xffffff,
    1.4
);

dir.position.set(20, 30, 10);

dir.castShadow = true;

dir.shadow.mapSize.width = 2048;

dir.shadow.mapSize.height = 2048;

scene.add(dir);





/* ---------------- TERRAIN ---------------- */

const terrainGeo =
    new THREE.PlaneGeometry(
        120,
        120,
        120,
        120
    );

const pos =
    terrainGeo.attributes.position;

for (let i = 0; i < pos.count; i++) {

    const x = pos.getX(i);

    const y = pos.getY(i);

    let h =
        Math.sin(x * 0.08) * 1.5 +
        Math.cos(y * 0.06) * 1.2;

    const dist =
        Math.sqrt(x * x + y * y);

    h += Math.max(0, 10 - dist) * 0.12;

    pos.setZ(i, h);
}

terrainGeo.computeVertexNormals();

const terrainMat =
    new THREE.MeshStandardMaterial({
        color: 0x4e7f42,
        flatShading: false
    });

const terrain =
    new THREE.Mesh(
        terrainGeo,
        terrainMat
    );

terrain.rotation.x = -Math.PI / 2;

terrain.receiveShadow = true;

terrain.name = "terrain";

scene.add(terrain);





/* ---------------- RIVER ---------------- */

const riverGeo =
    new THREE.PlaneGeometry(
        12,
        120,
        1,
        1
    );

const riverMat =
    new THREE.MeshStandardMaterial({
        color: 0x1e88c9,
        transparent: true,
        opacity: 0.82
    });

const river =
    new THREE.Mesh(
        riverGeo,
        riverMat
    );

river.rotation.x = -Math.PI / 2;

river.position.y = 0.12;

river.position.x = -12;

scene.add(river);





/* ---------------- ROADS ---------------- */

const roadMat =
    new THREE.MeshStandardMaterial({
        color: 0x2b313d
    });

function createRoad(x, z, w, h) {

    const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(w, 0.1, h),
        roadMat
    );

    mesh.position.set(x, 0.05, z);

    mesh.receiveShadow = true;

    scene.add(mesh);
}

createRoad(0, 0, 4, 120);

createRoad(0, 0, 120, 4);





/* ---------------- TREES ---------------- */

function createTree(x, z) {

    const trunk =
        new THREE.Mesh(
            new THREE.CylinderGeometry(
                0.3,
                0.4,
                2
            ),
            new THREE.MeshStandardMaterial({
                color: 0x5b3a1e
            })
        );

    trunk.position.set(x, 1, z);

    const leaves =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                1.4,
                10,
                10
            ),
            new THREE.MeshStandardMaterial({
                color: 0x2f7d32
            })
        );

    leaves.position.set(x, 3, z);

    trunk.castShadow = true;

    leaves.castShadow = true;

    scene.add(trunk);

    scene.add(leaves);
}

for (let i = 0; i < 80; i++) {

    const x =
        (Math.random() - 0.5) * 100;

    const z =
        (Math.random() - 0.5) * 100;

    if (Math.abs(x) < 10) continue;

    if (Math.abs(z) < 10) continue;

    createTree(x, z);
}





/* ---------------- STATE ---------------- */

let currentRole = null;

let currentType = "cube";

const blockMeshes = {};

const occupied = {};





/* ---------------- UI ---------------- */

const roleButtons =
    document.querySelectorAll(".role-btn");

const buildButtons =
    document.querySelectorAll(".build-btn");

const roleValue =
    document.getElementById("role-value");

const financePanel =
    document.getElementById("finance-panel");

const buildToolbar =
    document.getElementById("build-toolbar");

const moneyValue =
    document.getElementById("money-value");





/* ---------------- ROLE ---------------- */

roleButtons.forEach(btn => {

    btn.addEventListener("click", () => {

        roleButtons.forEach(b => {
            b.classList.remove("active-role");
        });

        btn.classList.add("active-role");

        currentRole = btn.dataset.role;

        roleValue.innerText =
            btn.innerText.toUpperCase();

        updateRoleUI();
    });
});

function updateRoleUI() {

    financePanel.classList.add("hidden");

    buildToolbar.classList.add("hidden");

    if (currentRole === "finance") {
        financePanel.classList.remove(
            "hidden"
        );
    }

    if (currentRole === "workers") {
        buildToolbar.classList.remove(
            "hidden"
        );
    }
}





/* ---------------- BUILD TYPES ---------------- */

buildButtons.forEach(btn => {

    btn.addEventListener("click", () => {

        buildButtons.forEach(b => {
            b.classList.remove(
                "active-build"
            );
        });

        btn.classList.add("active-build");

        currentType = btn.dataset.type;
    });
});





/* ---------------- MATERIALS ---------------- */

const materials = {

    cube:
        new THREE.MeshStandardMaterial({
            color: 0xb8c5d6
        }),

    wall:
        new THREE.MeshStandardMaterial({
            color: 0x677489
        }),

    roof:
        new THREE.MeshStandardMaterial({
            color: 0xc34c35
        }),

    window:
        new THREE.MeshStandardMaterial({
            color: 0x79d7ff,
            transparent: true,
            opacity: 0.55
        }),

    door:
        new THREE.MeshStandardMaterial({
            color: 0x6f421d
        })
};





/* ---------------- BLOCK ---------------- */

function createBlock(id, data) {

    let geo;

    switch (data.type) {

        case "wall":

            geo =
                new THREE.BoxGeometry(
                    2,
                    1,
                    0.3
                );

            break;

        case "roof":

            geo =
                new THREE.ConeGeometry(
                    1,
                    1,
                    4
                );

            break;

        case "window":

            geo =
                new THREE.BoxGeometry(
                    1.2,
                    1.2,
                    0.1
                );

            break;

        case "door":

            geo =
                new THREE.BoxGeometry(
                    1,
                    2,
                    0.2
                );

            break;

        default:

            geo =
                new THREE.BoxGeometry(
                    1,
                    1,
                    1
                );
    }

    const mesh =
        new THREE.Mesh(
            geo,
            materials[data.type]
        );

    mesh.position.set(
        data.x,
        data.y,
        data.z
    );

    mesh.castShadow = true;

    mesh.receiveShadow = true;

    if (data.type === "roof") {
        mesh.rotation.y =
            Math.PI / 4;
    }

    mesh.userData.firebaseId = id;

    scene.add(mesh);

    blockMeshes[id] = mesh;

    const key =
        `${data.x}_${data.z}`;

    if (!occupied[key]) {
        occupied[key] = 0;
    }

    occupied[key]++;
}





/* ---------------- FIREBASE SYNC ---------------- */

onChildAdded(
    blocksRef,
    snapshot => {

        createBlock(
            snapshot.key,
            snapshot.val()
        );
    }
);

onChildRemoved(
    blocksRef,
    snapshot => {

        const id = snapshot.key;

        if (blockMeshes[id]) {

            scene.remove(
                blockMeshes[id]
            );

            delete blockMeshes[id];
        }
    }
);





/* ---------------- MONEY ---------------- */

async function initMoney() {

    const snap =
        await get(moneyRef);

    if (!snap.exists()) {

        set(moneyRef, 100000);

    } else {

        updateMoneyUI(
            snap.val()
        );
    }
}

initMoney();

function updateMoneyUI(value) {

    moneyValue.innerText =
        `${value.toLocaleString()} ₽`;
}

document
    .getElementById("add-money-btn")
    .addEventListener(
        "click",
        async () => {

            const snap =
                await get(moneyRef);

            const value =
                snap.val() + 10000;

            set(moneyRef, value);

            updateMoneyUI(value);
        }
    );

document
    .getElementById(
        "remove-money-btn"
    )
    .addEventListener(
        "click",
        async () => {

            const snap =
                await get(moneyRef);

            const value =
                snap.val() - 10000;

            set(moneyRef, value);

            updateMoneyUI(value);
        }
    );





/* ---------------- BUILD ---------------- */

const raycaster =
    new THREE.Raycaster();

const mouse =
    new THREE.Vector2();

window.addEventListener(
    "click",
    onLeftClick
);

window.addEventListener(
    "contextmenu",
    onRightClick
);

function onLeftClick(event) {

    if (
        event.target.closest(
            ".left-panel"
        )
    ) return;

    if (
        event.target.closest(
            ".bottom-toolbar"
        )
    ) return;

    if (
        currentRole !== "workers"
    ) return;

    mouse.x =
        (event.clientX /
            window.innerWidth) *
            2 -
        1;

    mouse.y =
        -(
            event.clientY /
            window.innerHeight
        ) *
            2 +
        1;

    raycaster.setFromCamera(
        mouse,
        camera
    );

    const hits =
        raycaster.intersectObject(
            terrain
        );

    if (!hits.length) return;

    const p = hits[0].point;

    const x = Math.round(p.x);

    const z = Math.round(p.z);

    const key = `${x}_${z}`;

    const level =
        occupied[key] || 0;

    let y = 0.5 + level;

    push(blocksRef, {
        type: currentType,
        x,
        y,
        z
    });
}





/* ---------------- REMOVE ---------------- */

function onRightClick(event) {

    event.preventDefault();

    if (
        currentRole !== "workers"
    ) return;

    mouse.x =
        (event.clientX /
            window.innerWidth) *
            2 -
        1;

    mouse.y =
        -(
            event.clientY /
            window.innerHeight
        ) *
            2 +
        1;

    raycaster.setFromCamera(
        mouse,
        camera
    );

    const hits =
        raycaster.intersectObjects(
            Object.values(blockMeshes)
        );

    if (!hits.length) return;

    const mesh =
        hits[0].object;

    remove(
        ref(
            db,
            `blocks/${mesh.userData.firebaseId}`
        )
    );
}





/* ---------------- RESET ---------------- */

document
    .getElementById(
        "reset-world-btn"
    )
    .addEventListener(
        "click",
        async () => {

            const ok =
                confirm(
                    "Сбросить весь проект?"
                );

            if (!ok) return;

            await remove(blocksRef);
        }
    );





/* ---------------- RESIZE ---------------- */

window.addEventListener(
    "resize",
    () => {

        camera.aspect =
            window.innerWidth /
            window.innerHeight;

        camera.updateProjectionMatrix();

        renderer.setSize(
            window.innerWidth,
            window.innerHeight
        );
    }
);





/* ---------------- LOOP ---------------- */

function animate() {

    requestAnimationFrame(
        animate
    );

    controls.update();

    renderer.render(
        scene,
        camera
    );
}

animate();
```
