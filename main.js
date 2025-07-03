import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// --- Scene Setup ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xeeeeee);

// Axes helper for orientation
// scene.add(new THREE.AxesHelper(5));

// --- Camera Setup ---
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
camera.position.z = 1;
camera.rotation.y = Math.PI; // Rotate camera 180° around Y-axis

// --- Lighting ---
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 10, 7.5);
scene.add(light);

const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight);

// --- Renderer ---
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// --- Load Main Model ---
const loader = new GLTFLoader();
loader.load(
    'public/kammerl.glb',
    (gltf) => {
        const model = gltf.scene;
        scene.add(model);
        // Optional: Adjust model rotation if needed
        // model.rotation.y = Math.PI;
        // model.rotation.x = degreesToRadians(270);
    },
    undefined,
    (error) => console.error(error)
);

// --- Highlight Box Logic ---
let loadedBoxes = [];
let highlightBox = null;

/**
 * Creates a semi-transparent highlight box mesh based on boxData.
 * @param {Object} boxData - Contains location, scale, rotation, etc.
 * @returns {THREE.Mesh}
 */
function createHighlightBox(boxData) {
    // Convert Blender coordinates to Three.js
    const position = [
        boxData.location[0],        // X
        boxData.location[2],        // Blender Z → Three.js Y
        -boxData.location[1]        // Blender Y → Three.js -Z
    ];

    const scaleVal = 2;
    const scale = [
        boxData.scale[0] * scaleVal,       // X
        boxData.scale[2] * scaleVal + 0.05, // Blender Z → Y
        boxData.scale[1] * scaleVal         // Blender Y → Z
    ];

    // Rotation order: X, Z, Y (as in original)
    const rotation = [
        boxData.rotation[0],
        boxData.rotation[2],
        boxData.rotation[1]
    ];

    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({
        color: 0xffff00, // Yellow
        wireframe: false,
        transparent: true,
        opacity: 0.6
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.scale.set(...scale);
    mesh.position.set(...position);
    mesh.rotation.set(...rotation);
    return mesh;
}

// --- Load Box Data and Populate Select ---
fetch('boxCoords.json')
    .then(response => response.json())
    .then(data => {
        loadedBoxes = data.boxes;
        const select = document.getElementById('box-select');
        select.innerHTML = '';
        data.boxes.forEach(box => {
            const option = document.createElement('option');
            option.value = box.boxId;
            option.textContent = box.content || box.boxId;
            select.appendChild(option);
        });

        // Show first box by default
        if (data.boxes.length > 0) {
            select.value = data.boxes[0].boxId;
            if (highlightBox) scene.remove(highlightBox);
            highlightBox = createHighlightBox(data.boxes[0]);
            scene.add(highlightBox);
        }
    });

// --- Smooth Camera Transition State ---
let cameraTransition = null;

/**
 * Starts a smooth camera and controls.target transition.
 * @param {THREE.Vector3} targetPos - The position to look at.
 */
function smoothLookAt(targetPos) {
    // Calculate direction from scene center to box
    const sceneCenter = new THREE.Vector3(0, 0, 0);
    const direction = new THREE.Vector3().subVectors(targetPos, sceneCenter).normalize();

    // Use a fixed distance for all transitions (prevents drifting further away)
    const fixedDistance = 2.5; // Adjust as needed

    // New camera position: always at fixed distance from target along direction
    const newCamPos = new THREE.Vector3().copy(targetPos).addScaledVector(direction, -fixedDistance);

    cameraTransition = {
        fromPos: camera.position.clone(),
        toPos: newCamPos,
        fromTarget: controls.target.clone(),
        toTarget: targetPos.clone(),
        duration: 0.7, // seconds
        elapsed: 0
    };
}

// --- Handle Box Selection Changes ---
document.getElementById('box-select').addEventListener('change', (event) => {
    const selectedId = event.target.value;
    const boxData = loadedBoxes.find(b => b.boxId === selectedId);
    if (!boxData) return;
    if (highlightBox) scene.remove(highlightBox);
    highlightBox = createHighlightBox(boxData);
    scene.add(highlightBox);

    // Camera should smoothly look at the box
    const boxPos = new THREE.Vector3(
        boxData.location[0],
        boxData.location[2],
        -boxData.location[1]
    );
    smoothLookAt(boxPos);
});

// --- Camera Controls (OrbitControls) ---
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.1;
controls.enableZoom = true;
controls.zoomSpeed = 0.5;
controls.enablePan = true;
controls.panSpeed = 0.5;
controls.enableRotate = true;
controls.rotateSpeed = 0.5;
controls.update();

// --- WASD Camera Movement ---
const moveSpeed = 0.05;
const keys = { w: false, a: false, s: false, d: false };

// Listen for keydown events
document.addEventListener('keydown', (e) => {
    if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return;
    if (['w', 'a', 's', 'd'].includes(e.key.toLowerCase())) {
        keys[e.key.toLowerCase()] = true;
    }
});

// Listen for keyup events
document.addEventListener('keyup', (e) => {
    if (['w', 'a', 's', 'd'].includes(e.key.toLowerCase())) {
        keys[e.key.toLowerCase()] = false;
    }
});

/**
 * Updates camera position based on WASD keys.
 */
function updateCameraMovement() {
    // Get forward direction (XZ plane)
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    direction.y = 0;
    direction.normalize();

    // Get right vector
    const right = new THREE.Vector3();
    right.crossVectors(camera.up, direction).normalize();

    if (keys.w) camera.position.addScaledVector(direction, moveSpeed);
    if (keys.s) camera.position.addScaledVector(direction, -moveSpeed);
    if (keys.a) camera.position.addScaledVector(right, moveSpeed);
    if (keys.d) camera.position.addScaledVector(right, -moveSpeed);
}

// --- Animation Loop ---
let lastTime = performance.now();
function animate(now) {
    const delta = (now - lastTime) / 1000;
    lastTime = now;

    updateCameraMovement();

    // Smooth camera transition logic
    if (cameraTransition) {
        cameraTransition.elapsed += delta;
        const t = Math.min(cameraTransition.elapsed / cameraTransition.duration, 1);

        // Ease in-out
        const ease = t < 0.5
            ? 2 * t * t
            : -1 + (4 - 2 * t) * t;

        camera.position.lerpVectors(cameraTransition.fromPos, cameraTransition.toPos, ease);
        controls.target.lerpVectors(cameraTransition.fromTarget, cameraTransition.toTarget, ease);

        if (t >= 1) {
            camera.position.copy(cameraTransition.toPos);
            controls.target.copy(cameraTransition.toTarget);
            cameraTransition = null;
        }
        controls.update();
    } else {
        controls.update();
    }

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}
animate(performance.now());

// --- Responsive Resize ---
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
