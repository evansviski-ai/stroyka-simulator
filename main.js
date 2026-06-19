import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160/build/three.module.js";

import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.160/examples/jsm/controls/OrbitControls.js";

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";

import {
    getDatabase,
    ref,
    push,
    onValue,
    remove,
    set
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";





/* ======================================================
   FIREBASE
====================================================== */

const firebaseConfig = {

    apiKey: "AIzaSyCDoON8VQKnb9Eh4UtogG_aqn9P4bMlL4A",

    authDomain: "stroyka-bs.firebaseapp.com",

    databaseURL:
        "https://stroyka-bs-default-rtdb.europe-west1.firebasedatabase.app",

    projectId: "stroyka-bs",

    storageBucket:
        "stroyka-bs.firebasestorage.app",

    messagingSenderId:
        "555859205094",

    appId:
        "1:555859205094:web:0a243c20597ee165161427"
};

const app = initializeApp(firebaseConfig);

const db = getDatabase(app);





/* ======================================================
   THREE
====================================================== */

const scene = new THREE.Scene();

scene.background = new THREE.Color(0x07111f);

const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    2000
);

camera.position.set(35, 30, 35);

const renderer = new THREE.WebGLRenderer({
    antialias: true
});

renderer.setSize(
    window.innerWidth,
    window.innerHeight
);

renderer.shadowMap.enabled = true;

document.body.appendChild(renderer.domElement);





/* ======================================================
   ORBIT CAMERA
====================================================== */

const controls = new OrbitControls(
    camera,
    renderer.domElement
);

controls.enableDamping = true;

controls.target.set(0, 0, 0);

controls.maxPolarAngle = Math.PI / 2.1;

controls.minDistance = 8;

controls.maxDistance = 120;





/* ======================================================
   LIGHT
====================================================== */

const hemi = new THREE.HemisphereLight(
    0xffffff,
    0x223344,
    1.5
);

scene.add(hemi);

const dir = new THREE.DirectionalLight(
    0xffffff,
    2
);

dir.position.set(20, 40, 20);

dir.castShadow = true;

scene.add(dir);





/* ======================================================
   MAP
====================================================== */

const ground = new THREE.Mesh(

    new THREE.PlaneGeometry(200, 200),

    new THREE.MeshStandardMaterial({
        color: 0x183046
    })
);

ground.rotation.x = -Math.PI / 2;

ground.receiveShadow = true;

scene.add(ground);





/* ======================================================
   GRID
====================================================== */

const grid = new THREE.GridHelper(
    200,
    200,
    0x3b82f6,
    0x1e293b
);

scene.add(grid);





/* ======================================================
   HILLS
====================================================== */

function createHill(x, z, size, color) {

    for (let i = 0; i < size; i++) {

        for (let j = 0; j < size; j++) {

            const height =
                Math.floor(
                    Math.random() * 4
                ) + 1;

            for (let y = 0; y < height; y++) {

                const cube = new THREE.Mesh(

                    new THREE.BoxGeometry(2, 2, 2),

                    new THREE.MeshStandardMaterial({
                        color
                    })
                );

                cube.position.set(
                    x + i * 2,
                    y * 2,
                    z + j * 2
                );

                cube.castShadow = true;

                cube.receiveShadow = true;

                scene.add(cube);
            }
        }
    }
}





/* ======================================================
   GENERATED LANDSCAPE
====================================================== */

createHill(-35, -35, 8, 0x3b7d4f);

createHill(20, 20, 10, 0x777777);





/* ======================================================
   MATERIALS
====================================================== */

const materials = {

    cube: new THREE.MeshStandardMaterial({
        color: 0xcbd5e1
    }),

    wallX: new THREE.MeshStandardMaterial({
        color: 0x94a3b8
    }),

    wallZ: new THREE.MeshStandardMaterial({
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





/* ======================================================
   STATE
====================================================== */

let currentRole = null;

let currentType = "cube";

const placedMeshes = {};





/* ======================================================
   UI
====================================================== */

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





/* ======================================================
   ROLE SWITCH
====================================================== */

document
    .querySelectorAll(".role-btn")
    .forEach(btn => {

        btn.addEventListener("click", () => {

            currentRole =
                btn.dataset.role;

            roleValue.innerText =
                btn.innerText;

            document
                .querySelectorAll(".role-btn")
                .forEach(b =>
                    b.classList.remove("active-role")
                );

            btn.classList.add("active-role");





            directorsUI.classList.add("hidden");

            financeUI.classList.add("hidden");

            prUI.classList.add("hidden");

            buildToolbar.classList.add("hidden");





            if (currentRole === "workers") {

                buildToolbar.classList.remove(
                    "hidden"
                );

                ground.visible = true;

                grid.visible = true;
            }

            else {

                ground.visible = false;

                grid.visible = false;
            }





            if (currentRole === "directors") {

                directorsUI.classList.remove(
                    "hidden"
                );
            }

            if (currentRole === "finance") {

                financeUI.classList.remove(
                    "hidden"
                );
            }

            if (currentRole === "pr") {

                prUI.classList.remove(
                    "hidden"
                );
            }
        });
    });





/* ======================================================
   BUILD BUTTONS
====================================================== */

document
    .querySelectorAll(".build-btn")
    .forEach(btn => {

        btn.addEventListener("click", () => {

            currentType =
                btn.dataset.type;

            document
                .querySelectorAll(".build-btn")
                .forEach(b =>
                    b.classList.remove("active-build")
                );

            btn.classList.add("active-build");
        });
    });





/* ======================================================
   RAYCAST
====================================================== */

const raycaster = new THREE.Raycaster();

const mouse = new THREE.Vector2();





/* ======================================================
   BUILD
====================================================== */

window.addEventListener(
    "pointerdown",
    e => {

        if (currentRole !== "workers") return;

        if (e.target.closest(".left-panel")) return;

        if (e.target.closest(".bottom-toolbar")) return;





        mouse.x =
            (e.clientX / window.innerWidth) * 2 - 1;

        mouse.y =
            -(e.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(
            mouse,
            camera
        );

        const intersects =
            raycaster.intersectObject(ground);

        if (!intersects.length) return;

        const p = intersects[0].point;

        const x = Math.round(p.x);

        const z = Math.round(p.z);

        if (e.button === 0) {

            addBlock(x, z);
        }

        if (e.button === 2) {

            removeBlock(x, z);
        }
    }
);





window.addEventListener(
    "contextmenu",
    e => e.preventDefault()
);





/* ======================================================
   CREATE BLOCK
====================================================== */

function addBlock(x, z) {

    push(
        ref(db, "world"),
        {
            x,
            z,
            type: currentType
        }
    );
}





function removeBlock(x, z) {

    const worldRef = ref(db, "world");

    onValue(
        worldRef,
        snapshot => {

            snapshot.forEach(child => {

                const data = child.val();

                if (
                    data.x === x &&
                    data.z === z
                ) {

                    remove(
                        ref(
                            db,
                            "world/" + child.key
                        )
                    );
                }
            });
        },
        {
            onlyOnce: true
        }
    );
}





/* ======================================================
   RENDER BLOCKS
====================================================== */

onValue(
    ref(db, "world"),
    snapshot => {

        Object.values(placedMeshes)
            .forEach(mesh => {

                scene.remove(mesh);
            });

        for (const k in placedMeshes) {

            delete placedMeshes[k];
        }





        snapshot.forEach(child => {

            const data = child.val();

            const mesh =
                createMesh(data);

            placedMeshes[
                child.key
            ] = mesh;

            scene.add(mesh);
        });
    }
);





function createMesh(data) {

    let geo;

    let mat;





    if (data.type === "cube") {

        geo =
            new THREE.BoxGeometry(
                1,
                1,
                1
            );

        mat = materials.cube;
    }





    if (data.type === "wall") {

        const rotate =
            Math.random() > 0.5;

        geo =
            rotate
                ? new THREE.BoxGeometry(
                    3,
                    2,
                    0.3
                )
                : new THREE.BoxGeometry(
                    0.3,
                    2,
                    3
                );

        mat =
            rotate
                ? materials.wallX
                : materials.wallZ;
    }





    if (data.type === "roof") {

        geo =
            new THREE.ConeGeometry(
                1.4,
                1.5,
                4
            );

        mat = materials.roof;
    }





    if (data.type === "window") {

        geo =
            new THREE.BoxGeometry(
                1.4,
                1.2,
                0.1
            );

        mat = materials.window;
    }





    if (data.type === "door") {

        geo =
            new THREE.BoxGeometry(
                1,
                2,
                0.2
            );

        mat = materials.door;
    }





    const mesh =
        new THREE.Mesh(geo, mat);

    mesh.position.set(
        data.x,
        0.5,
        data.z
    );

    mesh.castShadow = true;

    mesh.receiveShadow = true;

    return mesh;
}





/* ======================================================
   RESET WORLD
====================================================== */

document
    .getElementById("reset-world-btn")
    .addEventListener("click", () => {

        if (
            confirm(
                "Сбросить весь мир?"
            )
        ) {

            set(
                ref(db, "world"),
                null
            );
        }
    });





/* ======================================================
   PR DRAW
====================================================== */

const canvas =
    document.getElementById("pr-canvas");

if (canvas) {

    const ctx =
        canvas.getContext("2d");

    let drawing = false;

    canvas.addEventListener(
        "pointerdown",
        () => drawing = true
    );

    canvas.addEventListener(
        "pointerup",
        () => {

            drawing = false;

            ctx.beginPath();
        }
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

            ctx.lineWidth = 3;

            ctx.lineCap = "round";

            ctx.strokeStyle = "#111";

            ctx.lineTo(x, y);

            ctx.stroke();

            ctx.beginPath();

            ctx.moveTo(x, y);
        }
    );
}





/* ======================================================
   RESIZE
====================================================== */

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





/* ======================================================
   LOOP
====================================================== */

function animate() {

    requestAnimationFrame(animate);

    controls.update();

    renderer.render(scene, camera);
}

animate();
