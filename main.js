```js
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160/build/three.module.js";

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
    getDatabase,
    ref,
    set,
    onValue,
    remove,
    get
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.160/examples/jsm/controls/OrbitControls.js";





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
   GLOBAL STATE
========================================================= */

const state = {

    role: null,

    currentType: "cube",

    money: 100000
};





/* =========================================================
   UI
========================================================= */

const roleButtons = document.querySelectorAll(".role-btn");

const buildButtons = document.querySelectorAll(".build-btn");

const roleValue = document.getElementById("role-value");

const moneyValue = document.getElementById("money-value");

const buildToolbar = document.getElementById("build-toolbar");

const financeUI = document.getElementById("finance-ui");

const directorsUI = document.getElementById("directors-ui");

const prUI = document.getElementById("pr-ui");

const resetBtn = document.getElementById("reset-world-btn");





/* =========================================================
   ROLE SCREENS
========================================================= */

function hideAllScreens() {

    buildToolbar.classList.add("hidden");

    if (financeUI) financeUI.classList.add("hidden");

    if (directorsUI) directorsUI.classList.add("hidden");

    if (prUI) prUI.classList.add("hidden");
}

function setRole(role) {

    state.role = role;

    roleValue.innerText = role.toUpperCase();

    hideAllScreens();





    if (role === "workers") {

        buildToolbar.classList.remove("hidden");

        renderer.domElement.style.display = "block";
    }

    else if (role === "finance") {

        financeUI?.classList.remove("hidden");

        renderer.domElement.style.display = "none";
    }

    else if (role === "directors") {

        directorsUI?.classList.remove("hidden");

        renderer.domElement.style.display = "none";
    }

    else if (role === "pr") {

        prUI?.classList.remove("hidden");

        renderer.domElement.style.display = "none";
    }

    else {

        renderer.domElement.style.display = "none";
    }
}





roleButtons.forEach(btn => {

    btn.addEventListener("click", () => {

        roleButtons.forEach(b => {

            b.classList.remove("active-role");
        });

        btn.classList.add("active-role");

        setRole(btn.dataset.role);
    });
});





/* =========================================================
   BUILD TYPES
========================================================= */

buildButtons.forEach(btn => {

    btn.addEventListener("click", () => {

        state.currentType = btn.dataset.type;

        buildButtons.forEach(b => {

            b.classList.remove("active-build");
        });

        btn.classList.add("active-build");
    });
});





/* =========================================================
   THREE
========================================================= */

const scene = new THREE.Scene();

scene.background = new THREE.Color(0x031126);





const camera = new THREE.PerspectiveCamera(

    60,

    window.innerWidth / window.innerHeight,

    0.1,

    1000
);

camera.position.set(20, 20, 20);





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
   ORBIT CAMERA
========================================================= */

const controls = new OrbitControls(

    camera,

    renderer.domElement
);

controls.enableDamping = true;

controls.dampingFactor = 0.05;

controls.maxPolarAngle = Math.PI / 2.1;

controls.target.set(0, 0, 0);





/* =========================================================
   LIGHT
========================================================= */

const hemi = new THREE.HemisphereLight(

    0xffffff,

    0x223344,

    1.4
);

scene.add(hemi);





const dir = new THREE.DirectionalLight(

    0xffffff,

    1.5
);

dir.position.set(20, 30, 10);

dir.castShadow = true;

scene.add(dir);





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





const grid = new THREE.GridHelper(

    200,

    200,

    0x3b82f6,

    0x1e293b
);

scene.add(grid);





/* =========================================================
   MATERIALS
========================================================= */

const materials = {

    cube: new THREE.MeshStandardMaterial({

        color: 0xd1d5db
    }),

    wallX: new THREE.MeshStandardMaterial({

        color: 0x64748b
    }),

    wallZ: new THREE.MeshStandardMaterial({

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
    }),

    mountain: new THREE.MeshStandardMaterial({

        color: 0x6b7280
    }),

    hill: new THREE.MeshStandardMaterial({

        color: 0x22c55e
    })
};





/* =========================================================
   MAP
========================================================= */

function createMountain() {

    for (let x = -25; x < -15; x++) {

        for (let z = -25; z < -15; z++) {

            const h = Math.floor(

                Math.random() * 5
            ) + 2;

            for (let y = 0; y < h; y++) {

                const cube = new THREE.Mesh(

                    new THREE.BoxGeometry(1,1,1),

                    materials.mountain
                );

                cube.position.set(

                    x,

                    y + 0.5,

                    z
                );

                scene.add(cube);
            }
        }
    }
}

function createHill() {

    for (let x = 15; x < 25; x++) {

        for (let z = 15; z < 25; z++) {

            const h = Math.floor(

                Math.random() * 3
            ) + 1;

            for (let y = 0; y < h; y++) {

                const cube = new THREE.Mesh(

                    new THREE.BoxGeometry(1,1,1),

                    materials.hill
                );

                cube.position.set(

                    x,

                    y + 0.5,

                    z
                );

                scene.add(cube);
            }
        }
    }
}

createMountain();

createHill();





/* =========================================================
   MULTIPLAYER OBJECTS
========================================================= */

const objects = {};

function createGeometry(type) {

    switch (type) {

        case "cube":
            return new THREE.BoxGeometry(1,1,1);

        case "wall":

            if (Math.random() > 0.5) {

                return new THREE.BoxGeometry(2,1,0.3);
            }

            return new THREE.BoxGeometry(0.3,1,2);

        case "roof":
            return new THREE.ConeGeometry(1,1,4);

        case "window":
            return new THREE.BoxGeometry(1.2,1.2,0.1);

        case "door":
            return new THREE.BoxGeometry(1,2,0.2);

        default:
            return new THREE.BoxGeometry(1,1,1);
    }
}

function getMaterial(type) {

    switch (type) {

        case "cube":
            return materials.cube;

        case "wall":
            return Math.random() > 0.5
                ? materials.wallX
                : materials.wallZ;

        case "roof":
            return materials.roof;

        case "window":
            return materials.glass;

        case "door":
            return materials.door;

        default:
            return materials.cube;
    }
}





/* =========================================================
   FIREBASE SYNC
========================================================= */

const buildsRef = ref(db, "builds");

onValue(buildsRef, snapshot => {

    const data = snapshot.val() || {};





    Object.values(objects).forEach(mesh => {

        scene.remove(mesh);
    });

    Object.keys(objects).forEach(k => {

        delete objects[k];
    });





    Object.entries(data).forEach(([id, item]) => {

        const mesh = new THREE.Mesh(

            createGeometry(item.type),

            getMaterial(item.type)
        );

        mesh.position.set(

            item.x,

            item.y,

            item.z
        );

        mesh.castShadow = true;

        mesh.receiveShadow = true;

        scene.add(mesh);

        objects[id] = mesh;
    });
});





/* =========================================================
   BUILD SYSTEM
========================================================= */

const raycaster = new THREE.Raycaster();

const mouse = new THREE.Vector2();

window.addEventListener("mousedown", onMouseDown);

async function onMouseDown(event) {

    if (state.role !== "workers") return;





    mouse.x = (

        event.clientX / window.innerWidth
    ) * 2 - 1;

    mouse.y = -(
        event.clientY / window.innerHeight
    ) * 2 + 1;





    raycaster.setFromCamera(mouse, camera);





    const meshes = [

        ground,

        ...Object.values(objects)
    ];

    const intersects = raycaster.intersectObjects(meshes);

    if (!intersects.length) return;





    const hit = intersects[0];





    /* REMOVE */

    if (event.button === 2) {

        for (const [id, mesh] of Object.entries(objects)) {

            if (mesh === hit.object) {

                await remove(ref(db, `builds/${id}`));

                return;
            }
        }
    }





    /* BUILD */

    let x, y, z;





    if (hit.object === ground) {

        x = Math.round(hit.point.x);

        y = 0.5;

        z = Math.round(hit.point.z);
    }

    else {

        x = Math.round(hit.object.position.x);

        y = hit.object.position.y + 1;

        z = Math.round(hit.object.position.z);
    }





    const id = crypto.randomUUID();

    await set(ref(db, `builds/${id}`), {

        type: state.currentType,

        x,

        y,

        z
    });
}

window.addEventListener("contextmenu", e => {

    e.preventDefault();
});





/* =========================================================
   RESET
========================================================= */

resetBtn.addEventListener("click", async () => {

    const ok = confirm(

        "Сбросить весь мир?"
    );

    if (!ok) return;

    await remove(ref(db, "builds"));
});





/* =========================================================
   MONEY
========================================================= */

const addMoneyBtn =
    document.getElementById("add-money-btn");

const removeMoneyBtn =
    document.getElementById("remove-money-btn");

function updateMoneyUI() {

    moneyValue.innerText =
        state.money.toLocaleString("ru-RU") + " ₽";
}

addMoneyBtn?.addEventListener("click", () => {

    state.money += 10000;

    updateMoneyUI();
});

removeMoneyBtn?.addEventListener("click", () => {

    state.money -= 10000;

    updateMoneyUI();
});





/* =========================================================
   PR DRAW
========================================================= */

const canvas = document.getElementById("pr-canvas");

if (canvas) {

    const ctx = canvas.getContext("2d");

    let drawing = false;





    canvas.addEventListener("mousedown", () => {

        drawing = true;
    });

    canvas.addEventListener("mouseup", () => {

        drawing = false;

        ctx.beginPath();
    });

    canvas.addEventListener("mousemove", e => {

        if (!drawing) return;

        const rect = canvas.getBoundingClientRect();

        ctx.lineWidth = 3;

        ctx.lineCap = "round";

        ctx.strokeStyle = "#38bdf8";

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
    });
}





/* =========================================================
   RESIZE
========================================================= */

window.addEventListener("resize", () => {

    camera.aspect =
        window.innerWidth / window.innerHeight;

    camera.updateProjectionMatrix();

    renderer.setSize(

        window.innerWidth,

        window.innerHeight
    );
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
```
