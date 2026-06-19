```js
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160/build/three.module.js";

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
    getDatabase,
    ref,
    push,
    onChildAdded,
    onChildRemoved,
    remove,
    set,
    onValue
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";





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

const db = getDatabase(app);





/* ---------------- SCENE ---------------- */

const scene = new THREE.Scene();

scene.background = new THREE.Color(0x041126);





/* ---------------- CAMERA ---------------- */

const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

camera.position.set(20, 18, 20);

camera.lookAt(0, 0, 0);





/* ---------------- RENDERER ---------------- */

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
    1.3
);

scene.add(hemi);

const dir = new THREE.DirectionalLight(
    0xffffff,
    1.2
);

dir.position.set(20, 30, 10);

dir.castShadow = true;

scene.add(dir);





/* ---------------- GRID ---------------- */

const grid = new THREE.GridHelper(
    120,
    120,
    0x2563eb,
    0x1e293b
);

scene.add(grid);





/* ---------------- GROUND ---------------- */

const ground = new THREE.Mesh(

    new THREE.PlaneGeometry(120, 120),

    new THREE.MeshStandardMaterial({
        color: 0x081425
    })

);

ground.rotation.x = -Math.PI / 2;

ground.receiveShadow = true;

scene.add(ground);





/* ---------------- LANDSCAPE ---------------- */

function createMountain(x, z, size, height) {

    for (let i = 0; i < size; i++) {

        for (let j = 0; j < size; j++) {

            const dist =
                Math.abs(i - size / 2) +
                Math.abs(j - size / 2);

            const h = Math.max(
                1,
                height - Math.floor(dist)
            );

            for (let y = 0; y < h; y++) {

                const block = new THREE.Mesh(

                    new THREE.BoxGeometry(1, 1, 1),

                    new THREE.MeshStandardMaterial({
                        color: 0x5b6475
                    })

                );

                block.position.set(
                    x + i,
                    y + 0.5,
                    z + j
                );

                block.receiveShadow = true;
                block.castShadow = true;

                scene.add(block);
            }
        }
    }
}

function createHill(x, z, size, height) {

    for (let i = 0; i < size; i++) {

        for (let j = 0; j < size; j++) {

            const dist =
                Math.abs(i - size / 2) +
                Math.abs(j - size / 2);

            const h = Math.max(
                1,
                height - Math.floor(dist / 2)
            );

            for (let y = 0; y < h; y++) {

                const block = new THREE.Mesh(

                    new THREE.BoxGeometry(1, 1, 1),

                    new THREE.MeshStandardMaterial({
                        color: 0x2e8b57
                    })

                );

                block.position.set(
                    x + i,
                    y + 0.5,
                    z + j
                );

                block.receiveShadow = true;
                block.castShadow = true;

                scene.add(block);
            }
        }
    }
}





createMountain(-28, -28, 10, 7);

createMountain(20, -25, 8, 5);

createHill(-20, 18, 12, 4);

createHill(18, 20, 10, 3);





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

    glass: new THREE.MeshStandardMaterial({
        color: 0x7dd3fc,
        transparent: true,
        opacity: 0.5
    }),

    door: new THREE.MeshStandardMaterial({
        color: 0x78350f
    })
};





/* ---------------- UI ---------------- */

const roleButtons =
    document.querySelectorAll(".role-btn");

const buildButtons =
    document.querySelectorAll(".build-btn");

const financePanel =
    document.getElementById("finance-panel");

const buildToolbar =
    document.getElementById("build-toolbar");

const roleValue =
    document.getElementById("role-value");

const moneyValue =
    document.getElementById("money-value");





/* ---------------- ROLE ---------------- */

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





        buildToolbar.classList.add("hidden");
        financePanel.classList.add("hidden");





        if (
            currentRole === "workers" ||
            currentRole === "architects"
        ) {
            buildToolbar.classList.remove("hidden");
        }

        if (
            currentRole === "finance"
        ) {
            financePanel.classList.remove("hidden");
        }
    });
});





/* ---------------- BUILD TYPE ---------------- */

let currentType = "cube";

buildButtons.forEach(btn => {

    btn.addEventListener("click", () => {

        buildButtons.forEach(b => {
            b.classList.remove("active-build");
        });

        btn.classList.add("active-build");

        currentType = btn.dataset.type;
    });
});





/* ---------------- MONEY ---------------- */

const moneyRef = ref(db, "money");

document
    .getElementById("add-money-btn")
    ?.addEventListener("click", () => {

        set(moneyRef, currentMoney + 10000);
    });

document
    .getElementById("remove-money-btn")
    ?.addEventListener("click", () => {

        set(moneyRef, currentMoney - 10000);
    });

let currentMoney = 100000;

onValue(moneyRef, snapshot => {

    if (snapshot.exists()) {
        currentMoney = snapshot.val();
    }

    moneyValue.innerText =
        currentMoney.toLocaleString("ru-RU") + " ₽";
});





/* ---------------- OBJECTS ---------------- */

const objectsRef = ref(db, "objects");

const objectMeshes = {};

function createMesh(data) {

    let geometry;
    let material;

    switch (data.type) {

        case "cube":

            geometry =
                new THREE.BoxGeometry(1,1,1);

            material = materials.cube;

            break;





        case "wall-x":

            geometry =
                new THREE.BoxGeometry(2,1,0.3);

            material = materials.wall;

            break;





        case "wall-z":

            geometry =
                new THREE.BoxGeometry(0.3,1,2);

            material = materials.wall;

            break;





        case "roof":

            geometry =
                new THREE.ConeGeometry(1,1,4);

            material = materials.roof;

            break;





        case "window":

            geometry =
                new THREE.BoxGeometry(1.2,1.2,0.1);

            material = materials.glass;

            break;





        case "door":

            geometry =
                new THREE.BoxGeometry(1,2,0.2);

            material = materials.door;

            break;
    }

    const mesh =
        new THREE.Mesh(geometry, material);

    mesh.position.set(
        data.x,
        data.y,
        data.z
    );

    mesh.castShadow = true;
    mesh.receiveShadow = true;

    mesh.userData.firebaseKey = data.key;

    scene.add(mesh);

    objectMeshes[data.key] = mesh;
}





onChildAdded(objectsRef, snapshot => {

    const data = snapshot.val();

    data.key = snapshot.key;

    createMesh(data);
});





onChildRemoved(objectsRef, snapshot => {

    const key = snapshot.key;

    if (objectMeshes[key]) {

        scene.remove(objectMeshes[key]);

        delete objectMeshes[key];
    }
});





/* ---------------- BUILD ---------------- */

const raycaster = new THREE.Raycaster();

const mouse = new THREE.Vector2();

window.addEventListener(
    "contextmenu",
    e => e.preventDefault()
);

window.addEventListener(
    "mousedown",
    onMouseDown
);

function onMouseDown(event) {

    if (
        event.target.closest(".left-panel") ||
        event.target.closest(".topbar") ||
        event.target.closest(".bottom-toolbar") ||
        event.target.closest(".finance-panel")
    ) return;





    mouse.x =
        (event.clientX / window.innerWidth) * 2 - 1;

    mouse.y =
        -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);





    if (event.button === 2) {

        const meshes =
            Object.values(objectMeshes);

        const hits =
            raycaster.intersectObjects(meshes);

        if (hits.length > 0) {

            const key =
                hits[0].object.userData.firebaseKey;

            remove(ref(db, "objects/" + key));
        }

        return;
    }





    if (
        currentRole !== "workers" &&
        currentRole !== "architects"
    ) return;





    const hits =
        raycaster.intersectObject(ground);

    if (hits.length === 0) return;





    const point = hits[0].point;

    const x = Math.round(point.x);

    const z = Math.round(point.z);





    let y = 0.5;

    Object.values(objectMeshes).forEach(mesh => {

        if (
            Math.round(mesh.position.x) === x &&
            Math.round(mesh.position.z) === z
        ) {

            y = Math.max(
                y,
                mesh.position.y + 1
            );
        }
    });





    let type = currentType;

    if (type === "wall") {

        if (Math.random() > 0.5) {
            type = "wall-x";
        } else {
            type = "wall-z";
        }
    }





    push(objectsRef, {
        type,
        x,
        y,
        z
    });
}





/* ---------------- RESET ---------------- */

document
    .getElementById("reset-world-btn")
    ?.addEventListener("click", async () => {

        const ok = confirm(
            "Сбросить весь проект?"
        );

        if (!ok) return;

        await remove(ref(db, "objects"));

        await set(ref(db, "money"), 100000);
    });





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

    camera.position.y = Math.max(
        5,
        Math.min(60, camera.position.y)
    );
});

function updateCamera() {

    const speed = 0.3;

    if (keys["w"]) camera.position.z -= speed;
    if (keys["s"]) camera.position.z += speed;
    if (keys["a"]) camera.position.x -= speed;
    if (keys["d"]) camera.position.x += speed;

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
```
