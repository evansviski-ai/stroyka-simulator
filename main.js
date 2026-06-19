```js
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160/build/three.module.js";

import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.160/examples/jsm/controls/OrbitControls.js";

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
    getDatabase,
    ref,
    push,
    remove,
    set,
    onChildAdded,
    onChildRemoved,
    onValue
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";





/* =========================================================
   FIREBASE
========================================================= */

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





/* =========================================================
   STATE MANAGER
========================================================= */

const state = {

    role: null,

    buildType: "cube",

    money: 100000,

    meshes: {}
};





/* =========================================================
   UI REFERENCES
========================================================= */

const roleButtons =
    document.querySelectorAll(".role-btn");

const buildButtons =
    document.querySelectorAll(".build-btn");

const roleValue =
    document.getElementById("role-value");

const moneyValue =
    document.getElementById("money-value");

const buildToolbar =
    document.getElementById("build-toolbar");

const directorsUI =
    document.getElementById("directors-ui");

const financeUI =
    document.getElementById("finance-ui");

const prUI =
    document.getElementById("pr-ui");

const rendererContainer =
    document.body;





/* =========================================================
   THREE.JS
========================================================= */

const scene = new THREE.Scene();

scene.background =
    new THREE.Color(0x07111f);

scene.fog =
    new THREE.Fog(
        0x07111f,
        40,
        150
    );





/* ---------------- CAMERA ---------------- */

const camera =
    new THREE.PerspectiveCamera(
        60,
        window.innerWidth /
        window.innerHeight,
        0.1,
        1000
    );

camera.position.set(
    24,
    24,
    24
);





/* ---------------- RENDERER ---------------- */

const renderer =
    new THREE.WebGLRenderer({
        antialias: true
    });

renderer.setSize(
    window.innerWidth,
    window.innerHeight
);

renderer.shadowMap.enabled = true;

document.body.appendChild(
    renderer.domElement
);





/* ---------------- ORBIT CAMERA ---------------- */

const controls =
    new OrbitControls(
        camera,
        renderer.domElement
    );

controls.enableDamping = true;

controls.dampingFactor = 0.08;

controls.enablePan = true;

controls.enableZoom = true;

controls.enableRotate = true;

controls.rotateSpeed = 0.8;

controls.panSpeed = 0.8;

controls.zoomSpeed = 1.1;

controls.minDistance = 6;

controls.maxDistance = 80;

controls.maxPolarAngle =
    Math.PI / 2.05;

controls.target.set(
    0,
    0,
    0
);





/* =========================================================
   LIGHT
========================================================= */

const hemi =
    new THREE.HemisphereLight(
        0xffffff,
        0x223344,
        1.4
    );

scene.add(hemi);

const dir =
    new THREE.DirectionalLight(
        0xffffff,
        1.4
    );

dir.position.set(
    30,
    40,
    20
);

dir.castShadow = true;

scene.add(dir);





/* =========================================================
   GROUND
========================================================= */

const ground =
    new THREE.Mesh(

        new THREE.PlaneGeometry(
            140,
            140
        ),

        new THREE.MeshStandardMaterial({
            color: 0x0b1728
        })
    );

ground.rotation.x =
    -Math.PI / 2;

ground.receiveShadow = true;

scene.add(ground);





/* =========================================================
   GRID
========================================================= */

const grid =
    new THREE.GridHelper(
        140,
        140,
        0x3b82f6,
        0x1e293b
    );

scene.add(grid);





/* =========================================================
   LANDSCAPE
========================================================= */

function createTerrainBlock(
    x,
    y,
    z,
    color
) {

    const block =
        new THREE.Mesh(

            new THREE.BoxGeometry(
                1,
                1,
                1
            ),

            new THREE.MeshStandardMaterial({
                color
            })
        );

    block.position.set(
        x,
        y,
        z
    );

    block.castShadow = true;

    block.receiveShadow = true;

    scene.add(block);
}

function createMountain(
    startX,
    startZ,
    size,
    height,
    color
) {

    for (let x = 0; x < size; x++) {

        for (let z = 0; z < size; z++) {

            const dist =
                Math.abs(x - size / 2) +
                Math.abs(z - size / 2);

            const h =
                Math.max(
                    1,
                    height - Math.floor(dist)
                );

            for (let y = 0; y < h; y++) {

                createTerrainBlock(
                    startX + x,
                    y + 0.5,
                    startZ + z,
                    color
                );
            }
        }
    }
}





createMountain(
    -30,
    -30,
    10,
    7,
    0x5b6475
);

createMountain(
    20,
    -25,
    8,
    5,
    0x2e8b57
);

createMountain(
    -20,
    18,
    12,
    4,
    0x4c956c
);





/* =========================================================
   MATERIALS
========================================================= */

const materials = {

    cube:
        new THREE.MeshStandardMaterial({
            color: 0xcbd5e1
        }),

    wall:
        new THREE.MeshStandardMaterial({
            color: 0x94a3b8
        }),

    roof:
        new THREE.MeshStandardMaterial({
            color: 0xdc2626
        }),

    glass:
        new THREE.MeshStandardMaterial({
            color: 0x7dd3fc,
            transparent: true,
            opacity: 0.5
        }),

    door:
        new THREE.MeshStandardMaterial({
            color: 0x78350f
        })
};





/* =========================================================
   ROLE SYSTEM
========================================================= */

function hideAllScreens() {

    buildToolbar.classList.add(
        "hidden"
    );

    directorsUI.classList.add(
        "hidden"
    );

    financeUI.classList.add(
        "hidden"
    );

    prUI.classList.add(
        "hidden"
    );





    renderer.domElement.style.display =
        "none";
}

function setRole(role, label) {

    state.role = role;

    roleValue.innerText =
        label.toUpperCase();

    hideAllScreens();





    if (
        role === "workers" ||
        role === "architects"
    ) {

        renderer.domElement.style.display =
            "block";

        buildToolbar.classList.remove(
            "hidden"
        );
    }





    if (
        role === "directors"
    ) {

        directorsUI.classList.remove(
            "hidden"
        );
    }





    if (
        role === "finance"
    ) {

        financeUI.classList.remove(
            "hidden"
        );
    }





    if (
        role === "pr"
    ) {

        prUI.classList.remove(
            "hidden"
        );
    }
}





roleButtons.forEach(btn => {

    btn.addEventListener(
        "click",
        () => {

            roleButtons.forEach(b => {
                b.classList.remove(
                    "active-role"
                );
            });

            btn.classList.add(
                "active-role"
            );

            setRole(
                btn.dataset.role,
                btn.innerText
            );
        }
    );
});





/* =========================================================
   BUILD TYPE
========================================================= */

buildButtons.forEach(btn => {

    btn.addEventListener(
        "click",
        () => {

            buildButtons.forEach(b => {
                b.classList.remove(
                    "active-build"
                );
            });

            btn.classList.add(
                "active-build"
            );

            state.buildType =
                btn.dataset.type;
        }
    );
});





/* =========================================================
   FIREBASE OBJECTS
========================================================= */

const objectsRef =
    ref(db, "objects");

function createMesh(data) {

    let geometry;





    switch (data.type) {

        case "wall-x":

            geometry =
                new THREE.BoxGeometry(
                    2,
                    1,
                    0.3
                );

            break;





        case "wall-z":

            geometry =
                new THREE.BoxGeometry(
                    0.3,
                    1,
                    2
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

    let material =
        materials.cube;





    if (
        data.type.includes("wall")
    ) {

        material =
            materials.wall;
    }

    if (
        data.type === "roof"
    ) {

        material =
            materials.roof;
    }

    if (
        data.type === "window"
    ) {

        material =
            materials.glass;
    }

    if (
        data.type === "door"
    ) {

        material =
            materials.door;
    }





    const mesh =
        new THREE.Mesh(
            geometry,
            material
        );

    mesh.position.set(
        data.x,
        data.y,
        data.z
    );

    mesh.castShadow = true;

    mesh.receiveShadow = true;

    mesh.userData.key =
        data.key;

    scene.add(mesh);

    state.meshes[data.key] =
        mesh;
}





onChildAdded(
    objectsRef,
    snapshot => {

        const data =
            snapshot.val();

        data.key =
            snapshot.key;

        createMesh(data);
    }
);





onChildRemoved(
    objectsRef,
    snapshot => {

        const key =
            snapshot.key;

        if (
            state.meshes[key]
        ) {

            scene.remove(
                state.meshes[key]
            );

            delete state.meshes[key];
        }
    }
);





/* =========================================================
   BUILD SYSTEM
========================================================= */

const raycaster =
    new THREE.Raycaster();

const mouse =
    new THREE.Vector2();

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
        state.role !== "workers" &&
        state.role !== "architects"
    ) return;





    if (
        event.target.closest(".left-panel")
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





    /* DELETE */

    if (
        event.button === 2
    ) {

        const hits =
            raycaster.intersectObjects(
                Object.values(
                    state.meshes
                )
            );

        if (hits.length > 0) {

            const key =
                hits[0].object.userData.key;

            remove(
                ref(
                    db,
                    "objects/" + key
                )
            );
        }

        return;
    }





    /* BUILD */

    const hits =
        raycaster.intersectObject(
            ground
        );

    if (!hits.length) return;

    const point =
        hits[0].point;

    const x =
        Math.round(point.x);

    const z =
        Math.round(point.z);





    let y = 0.5;

    Object.values(
        state.meshes
    ).forEach(mesh => {

        if (
            Math.round(
                mesh.position.x
            ) === x &&

            Math.round(
                mesh.position.z
            ) === z
        ) {

            y = Math.max(
                y,
                mesh.position.y + 1
            );
        }
    });





    let type =
        state.buildType;

    if (
        type === "wall"
    ) {

        type =
            Math.random() > 0.5
                ? "wall-x"
                : "wall-z";
    }

    push(objectsRef, {

        type,
        x,
        y,
        z
    });
}





/* =========================================================
   MONEY
========================================================= */

const moneyRef =
    ref(db, "money");

onValue(
    moneyRef,
    snapshot => {

        if (
            snapshot.exists()
        ) {

            state.money =
                snapshot.val();
        }

        moneyValue.innerText =
            state.money.toLocaleString(
                "ru-RU"
            ) + " ₽";
    }
);

document
    .getElementById(
        "add-money-btn"
    )
    ?.addEventListener(
        "click",
        () => {

            set(
                moneyRef,
                state.money + 10000
            );
        }
    );

document
    .getElementById(
        "remove-money-btn"
    )
    ?.addEventListener(
        "click",
        () => {

            set(
                moneyRef,
                state.money - 10000
            );
        }
    );





/* =========================================================
   RESET
========================================================= */

document
    .getElementById(
        "reset-world-btn"
    )
    ?.addEventListener(
        "click",
        async () => {

            const ok =
                confirm(
                    "Сбросить мир?"
                );

            if (!ok) return;

            await remove(
                ref(
                    db,
                    "objects"
                )
            );

            await set(
                moneyRef,
                100000
            );
        }
    );





/* =========================================================
   PR DRAWING
========================================================= */

const canvas =
    document.getElementById(
        "pr-canvas"
    );

if (canvas) {

    const ctx =
        canvas.getContext("2d");

    let drawing = false;

    ctx.fillStyle =
        "#ffffff";

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    canvas.addEventListener(
        "mousedown",
        () => {

            drawing = true;
        }
    );

    canvas.addEventListener(
        "mouseup",
        () => {

            drawing = false;

            ctx.beginPath();
        }
    );

    canvas.addEventListener(
        "mousemove",
        draw
    );

    function draw(e) {

        if (!drawing) return;

        const rect =
            canvas.getBoundingClientRect();

        ctx.lineWidth = 3;

        ctx.lineCap = "round";

        ctx.strokeStyle =
            "#111827";

        ctx.lineTo(
            e.clientX - rect.left,
            e.clientY - rect.top
        );

        ctx.stroke();

        ctx.beginPath();

        ctx.moveTo(
            e.clientX - rect.left,
            e.clientY - rect.top
        );
    }
}





/* =========================================================
   RESIZE
========================================================= */

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





/* =========================================================
   LOOP
========================================================= */

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
