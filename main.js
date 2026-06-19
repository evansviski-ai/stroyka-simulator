```js
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160/build/three.module.js";

import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.160/examples/jsm/controls/OrbitControls.js";

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
   THREE
========================================================= */

const scene = new THREE.Scene();

scene.background = new THREE.Color(0x020817);

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

controls.dampingFactor = 0.05;

controls.target.set(0, 0, 0);

controls.maxPolarAngle = Math.PI / 2.1;

controls.minDistance = 10;

controls.maxDistance = 100;





/* =========================================================
   LIGHT
========================================================= */

const hemi = new THREE.HemisphereLight(
    0xffffff,
    0x223344,
    1.2
);

scene.add(hemi);

const dirLight = new THREE.DirectionalLight(
    0xffffff,
    2
);

dirLight.position.set(20, 40, 20);

dirLight.castShadow = true;

scene.add(dirLight);





/* =========================================================
   GROUND
========================================================= */

const ground = new THREE.Mesh(

    new THREE.PlaneGeometry(200, 200),

    new THREE.MeshStandardMaterial({
        color: 0x0f172a
    })
);

ground.rotation.x = -Math.PI / 2;

ground.receiveShadow = true;

scene.add(ground);





/* =========================================================
   GRID
========================================================= */

const grid = new THREE.GridHelper(
    200,
    200,
    0x2563eb,
    0x1e293b
);

scene.add(grid);





/* =========================================================
   SIMPLE LANDSCAPE
========================================================= */

function createMountain(x, z, size, height) {

    for (let i = 0; i < size; i++) {

        for (let j = 0; j < size; j++) {

            const dist =
                Math.abs(i - size / 2) +
                Math.abs(j - size / 2);

            const h =
                Math.max(
                    1,
                    height - Math.floor(dist)
                );

            for (let y = 0; y < h; y++) {

                const cube = new THREE.Mesh(

                    new THREE.BoxGeometry(1,1,1),

                    new THREE.MeshStandardMaterial({
                        color: 0x64748b
                    })
                );

                cube.position.set(
                    x + i,
                    y,
                    z + j
                );

                scene.add(cube);
            }
        }
    }
}

createMountain(-20, -20, 10, 5);





/* =========================================================
   MATERIALS
========================================================= */

const materials = {

    cube: new THREE.MeshStandardMaterial({
        color: 0xe2e8f0
    }),

    wall: new THREE.MeshStandardMaterial({
        color: 0x94a3b8
    }),

    roof: new THREE.MeshStandardMaterial({
        color: 0xef4444
    }),

    glass: new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.5
    }),

    door: new THREE.MeshStandardMaterial({
        color: 0x78350f
    })
};





/* =========================================================
   UI
========================================================= */

const roleButtons =
    document.querySelectorAll(".role-btn");

const buildButtons =
    document.querySelectorAll(".build-btn");

const roleValue =
    document.getElementById("role-value");

const toolbar =
    document.getElementById("build-toolbar");

const directorsUI =
    document.getElementById("directors-ui");

const financeUI =
    document.getElementById("finance-ui");

const prUI =
    document.getElementById("pr-ui");

let currentRole = null;

let currentType = "cube";





/* =========================================================
   ROLE SWITCH
========================================================= */

function hideAllScreens() {

    toolbar?.classList.add("hidden");

    directorsUI?.classList.add("hidden");

    financeUI?.classList.add("hidden");

    prUI?.classList.add("hidden");

    renderer.domElement.style.display = "none";
}

roleButtons.forEach(btn => {

    btn.addEventListener("click", () => {

        currentRole = btn.dataset.role;

        roleValue.innerText =
            btn.innerText;

        hideAllScreens();

        if (currentRole === "workers") {

            toolbar?.classList.remove("hidden");

            renderer.domElement.style.display = "block";
        }

        if (currentRole === "directors") {

            directorsUI?.classList.remove("hidden");
        }

        if (currentRole === "finance") {

            financeUI?.classList.remove("hidden");
        }

        if (currentRole === "pr") {

            prUI?.classList.remove("hidden");
        }
    });
});





/* =========================================================
   BUILD BUTTONS
========================================================= */

buildButtons.forEach(btn => {

    btn.addEventListener("click", () => {

        currentType = btn.dataset.type;

        buildButtons.forEach(b => {
            b.classList.remove("active-build");
        });

        btn.classList.add("active-build");
    });
});





/* =========================================================
   MULTIPLAYER
========================================================= */

const objectsRef = ref(db, "objects");

const meshes = {};

function createMesh(data, key) {

    let geometry;

    switch (data.type) {

        case "wall":
            geometry =
                new THREE.BoxGeometry(2,1,0.3);
            break;

        case "roof":
            geometry =
                new THREE.ConeGeometry(1,1,4);
            break;

        case "window":
            geometry =
                new THREE.BoxGeometry(1.2,1.2,0.1);
            break;

        case "door":
            geometry =
                new THREE.BoxGeometry(1,2,0.2);
            break;

        default:
            geometry =
                new THREE.BoxGeometry(1,1,1);
    }

    const mesh = new THREE.Mesh(
        geometry,
        materials[data.type] || materials.cube
    );

    mesh.position.set(
        data.x,
        data.y,
        data.z
    );

    mesh.castShadow = true;

    mesh.receiveShadow = true;

    scene.add(mesh);

    meshes[key] = mesh;
}

onChildAdded(objectsRef, snapshot => {

    createMesh(
        snapshot.val(),
        snapshot.key
    );
});

onChildRemoved(objectsRef, snapshot => {

    const mesh = meshes[snapshot.key];

    if (!mesh) return;

    scene.remove(mesh);

    delete meshes[snapshot.key];
});





/* =========================================================
   BUILDING
========================================================= */

const raycaster = new THREE.Raycaster();

const mouse = new THREE.Vector2();

window.addEventListener(
    "mousedown",
    onMouseDown
);

function onMouseDown(event) {

    if (currentRole !== "workers") return;

    mouse.x =
        (event.clientX / window.innerWidth) * 2 - 1;

    mouse.y =
        -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const intersects =
        raycaster.intersectObject(ground);

    if (!intersects.length) return;

    const point = intersects[0].point;

    const x = Math.round(point.x);

    const z = Math.round(point.z);

    const y = 0.5;





    /* LEFT CLICK BUILD */

    if (event.button === 0) {

        push(objectsRef, {

            type: currentType,

            x,
            y,
            z
        });
    }





    /* RIGHT CLICK REMOVE */

    if (event.button === 2) {

        Object.entries(meshes).forEach(([key, mesh]) => {

            if (

                Math.round(mesh.position.x) === x &&
                Math.round(mesh.position.z) === z

            ) {

                remove(ref(db, "objects/" + key));
            }
        });
    }
}

window.addEventListener(
    "contextmenu",
    e => e.preventDefault()
);





/* =========================================================
   RESET
========================================================= */

document
    .getElementById("reset-world-btn")
    ?.addEventListener("click", async () => {

        if (
            confirm("Сбросить весь мир?")
        ) {

            await set(objectsRef, null);
        }
    });





/* =========================================================
   LOOP
========================================================= */

function animate() {

    requestAnimationFrame(animate);

    controls.update();

    renderer.render(scene, camera);
}

animate();





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
```
