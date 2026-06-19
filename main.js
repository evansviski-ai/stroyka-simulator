import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160/build/three.module.js";

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
    getDatabase,
    ref,
    set,
    push,
    remove,
    onValue
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";





/* ---------------- FIREBASE ---------------- */

const firebaseConfig = {

    apiKey: "AIzaSyCDoON8VQKnb9Eh4UtogG_aqn9P4bMlL4A",

    authDomain: "stroyka-bs.firebaseapp.com",

    databaseURL:
        "https://stroyka-bs-default-rtdb.europe-west1.firebasedatabase.app",

    projectId: "stroyka-bs",

    storageBucket: "stroyka-bs.firebasestorage.app",

    messagingSenderId: "555859205094",

    appId: "1:555859205094:web:0a243c20597ee165161427"
};

const app = initializeApp(firebaseConfig);

const db = getDatabase(app);





/* ---------------- SCENE ---------------- */

const scene = new THREE.Scene();

scene.background = new THREE.Color(0x041129);

scene.fog = new THREE.Fog(0x041129, 40, 120);





/* ---------------- CAMERA ---------------- */

const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

camera.position.set(20, 20, 20);

camera.lookAt(0, 0, 0);





/* ---------------- RENDERER ---------------- */

const renderer = new THREE.WebGLRenderer({
    antialias: true
});

renderer.setSize(
    window.innerWidth,
    window.innerHeight
);

renderer.shadowMap.enabled = true;

document.body.appendChild(renderer.domElement);





/* ---------------- LIGHT ---------------- */

const hemi = new THREE.HemisphereLight(
    0xffffff,
    0x223344,
    1.5
);

scene.add(hemi);

const dir = new THREE.DirectionalLight(
    0xffffff,
    1.2
);

dir.position.set(20, 40, 20);

dir.castShadow = true;

scene.add(dir);





/* ---------------- TERRAIN ---------------- */

const terrain = new THREE.Mesh(

    new THREE.PlaneGeometry(120, 120),

    new THREE.MeshStandardMaterial({
        color: 0x0f172a
    })
);

terrain.rotation.x = -Math.PI / 2;

terrain.receiveShadow = true;

scene.add(terrain);





/* ---------------- GRID ---------------- */

const grid = new THREE.GridHelper(
    120,
    120,
    0x2563eb,
    0x1e293b
);

scene.add(grid);





/* ---------------- RIVER ---------------- */

const river = new THREE.Mesh(

    new THREE.PlaneGeometry(12, 120),

    new THREE.MeshStandardMaterial({
        color: 0x1d4ed8,
        transparent: true,
        opacity: 0.7
    })
);

river.rotation.x = -Math.PI / 2;

river.position.y = 0.01;

river.position.x = -18;

scene.add(river);





/* ---------------- TREES ---------------- */

for (let i = 0; i < 40; i++) {

    const trunk = new THREE.Mesh(

        new THREE.CylinderGeometry(0.2, 0.2, 2),

        new THREE.MeshStandardMaterial({
            color: 0x78350f
        })
    );

    const top = new THREE.Mesh(

        new THREE.ConeGeometry(1, 3, 8),

        new THREE.MeshStandardMaterial({
            color: 0x15803d
        })
    );

    const x = Math.random() * 100 - 50;
    const z = Math.random() * 100 - 50;

    trunk.position.set(x, 1, z);

    top.position.set(x, 3, z);

    scene.add(trunk);

    scene.add(top);
}





/* ---------------- UI ---------------- */

const roleButtons =
    document.querySelectorAll(".role-btn");

const buildToolbar =
    document.getElementById("build-toolbar");

const financePanel =
    document.getElementById("finance-panel");

const roleValue =
    document.getElementById("role-value");

let currentRole = null;

roleButtons.forEach(btn => {

    btn.addEventListener("click", () => {

        roleButtons.forEach(b => {
            b.classList.remove("active-role");
        });

        btn.classList.add("active-role");

        currentRole = btn.dataset.role;

        roleValue.innerText =
            btn.innerText.toUpperCase();





        /* ROLE INTERFACES */

        buildToolbar.style.display = "none";

        financePanel.classList.add("hidden");





        if (
            currentRole === "workers"
        ) {

            buildToolbar.style.display = "flex";
        }





        if (
            currentRole === "finance"
        ) {

            financePanel.classList.remove("hidden");
        }

    });

});





/* ---------------- BUILD TYPES ---------------- */

let currentType = "cube";

const buildButtons =
    document.querySelectorAll(".build-btn");

buildButtons.forEach(btn => {

    btn.addEventListener("click", () => {

        currentType = btn.dataset.type;

        buildButtons.forEach(b => {
            b.classList.remove("active-build");
        });

        btn.classList.add("active-build");

    });

});





/* ---------------- MATERIALS ---------------- */

const materials = {

    cube: new THREE.MeshStandardMaterial({
        color: 0xcbd5e1
    }),

    wall: new THREE.MeshStandardMaterial({
        color: 0x94a3b8
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





/* ---------------- OBJECT STORAGE ---------------- */

const objects = {};





/* ---------------- CREATE BLOCK ---------------- */

function createBlock(data, firebaseKey) {

    let geometry;

    switch (data.type) {

        case "wall":

            geometry =
                new THREE.BoxGeometry(
                    2,
                    1,
                    0.3
                );

            break;

        case "roof":

            geometry =
                new THREE.ConeGeometry(
                    1,
                    1,
                    4
                );

            break;

        case "window":

            geometry =
                new THREE.BoxGeometry(
                    1.2,
                    1.2,
                    0.1
                );

            break;

        case "door":

            geometry =
                new THREE.BoxGeometry(
                    1,
                    2,
                    0.2
                );

            break;

        default:

            geometry =
                new THREE.BoxGeometry(
                    1,
                    1,
                    1
                );
    }

    const mesh = new THREE.Mesh(
        geometry,
        materials[data.type]
    );

    mesh.position.set(
        data.x,
        data.y,
        data.z
    );

    mesh.castShadow = true;

    mesh.receiveShadow = true;

    mesh.userData.firebaseKey =
        firebaseKey;

    scene.add(mesh);

    objects[firebaseKey] = mesh;
}





/* ---------------- FIREBASE SYNC ---------------- */

const blocksRef =
    ref(db, "world/blocks");

onValue(blocksRef, snapshot => {

    Object.values(objects).forEach(obj => {
        scene.remove(obj);
    });

    for (const key in objects) {
        delete objects[key];
    }

    const data = snapshot.val();

    if (!data) return;

    Object.entries(data).forEach(
        ([key, value]) => {

            createBlock(value, key);
        }
    );

});





/* ---------------- BUILDING ---------------- */

const raycaster = new THREE.Raycaster();

const mouse = new THREE.Vector2();

window.addEventListener(
    "mousedown",
    async event => {

        if (
            event.target.closest(
                ".left-panel"
            )
        ) return;

        if (
            currentRole !== "workers"
        ) return;





        mouse.x =
            (event.clientX /
                window.innerWidth) * 2 - 1;

        mouse.y =
            -(event.clientY /
                window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(
            mouse,
            camera
        );





        const meshes = [
            terrain,
            ...Object.values(objects)
        ];

        const intersects =
            raycaster.intersectObjects(meshes);

        if (!intersects.length) return;

        const hit = intersects[0];





        /* DELETE */

        if (event.button === 2) {

            if (
                hit.object !== terrain
            ) {

                const key =
                    hit.object.userData
                        .firebaseKey;

                await remove(
                    ref(
                        db,
                        `world/blocks/${key}`
                    )
                );
            }

            return;
        }





        /* BUILD */

        let x = Math.round(hit.point.x);

        let y = 0.5;

        let z = Math.round(hit.point.z);





        if (hit.object !== terrain) {

            y =
                hit.object.position.y + 1;
        }

        await push(blocksRef, {

            type: currentType,

            x,
            y,
            z
        });

    }
);

window.addEventListener(
    "contextmenu",
    e => e.preventDefault()
);





/* ---------------- MONEY ---------------- */

const moneyRef =
    ref(db, "world/money");

const moneyValue =
    document.getElementById(
        "money-value"
    );

onValue(moneyRef, snapshot => {

    const value =
        snapshot.val() || 100000;

    moneyValue.innerText =
        value.toLocaleString("ru-RU")
        + " ₽";

});

const addMoneyBtn =
    document.getElementById(
        "add-money-btn"
    );

const removeMoneyBtn =
    document.getElementById(
        "remove-money-btn"
    );

addMoneyBtn.addEventListener(
    "click",
    async () => {

        const current =
            Number(
                moneyValue.innerText
                    .replace(/\s/g, "")
                    .replace("₽", "")
            );

        await set(
            moneyRef,
            current + 10000
        );
    }
);

removeMoneyBtn.addEventListener(
    "click",
    async () => {

        const current =
            Number(
                moneyValue.innerText
                    .replace(/\s/g, "")
                    .replace("₽", "")
            );

        await set(
            moneyRef,
            current - 10000
        );
    }
);





/* ---------------- RESET ---------------- */

const resetBtn =
    document.getElementById(
        "reset-world-btn"
    );

resetBtn.addEventListener(
    "click",
    async () => {

        const confirmReset =
            confirm(
                "Удалить весь мир?"
            );

        if (!confirmReset) return;

        await set(
            ref(db, "world"),
            null
        );

        await set(
            moneyRef,
            100000
        );

    }
);





/* ---------------- CAMERA ---------------- */

const keys = {};

window.addEventListener(
    "keydown",
    e => {

        keys[e.key.toLowerCase()] = true;
    }
);

window.addEventListener(
    "keyup",
    e => {

        keys[e.key.toLowerCase()] = false;
    }
);

window.addEventListener(
    "wheel",
    e => {

        camera.position.y +=
            e.deltaY * 0.01;

        camera.position.y =
            Math.max(
                5,
                Math.min(
                    80,
                    camera.position.y
                )
            );
    }
);

function updateCamera() {

    const speed = 0.25;

    if (keys.w)
        camera.position.z -= speed;

    if (keys.s)
        camera.position.z += speed;

    if (keys.a)
        camera.position.x -= speed;

    if (keys.d)
        camera.position.x += speed;

    camera.lookAt(0, 0, 0);
}





/* ---------------- MOBILE CAMERA ---------------- */

let touchStartX = 0;
let touchStartY = 0;

window.addEventListener(
    "touchstart",
    e => {

        touchStartX =
            e.touches[0].clientX;

        touchStartY =
            e.touches[0].clientY;
    }
);

window.addEventListener(
    "touchmove",
    e => {

        const dx =
            e.touches[0].clientX
            - touchStartX;

        const dy =
            e.touches[0].clientY
            - touchStartY;

        camera.position.x -= dx * 0.02;

        camera.position.z -= dy * 0.02;

        touchStartX =
            e.touches[0].clientX;

        touchStartY =
            e.touches[0].clientY;
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

    updateCamera();

    renderer.render(
        scene,
        camera
    );
}

animate();
