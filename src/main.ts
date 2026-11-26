import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import './style.css';

const canvas = document.querySelector<HTMLCanvasElement>('#scene');

if (!canvas) {
  throw new Error('Scene canvas was not found.');
}

const scene = new THREE.Scene();
const horizonColor = new THREE.Color('#a9b39f');
scene.background = horizonColor;
scene.fog = new THREE.Fog(horizonColor, 20, 110);

const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  100,
);
camera.position.set(3, 2.5, 5);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;

scene.add(new THREE.AmbientLight(0xffffff, 1.5));

const keyLight = new THREE.DirectionalLight(0xffffff, 3);
keyLight.position.set(4, 5, 3);
scene.add(keyLight);

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(200, 200),
  new THREE.MeshStandardMaterial({ color: '#39e75f', roughness: 0.8 }),
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = 0;
ground.receiveShadow = true;
scene.add(ground);

renderer.shadowMap.enabled = true;
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048);

camera.position.set(0, 5.5, -9);
camera.lookAt(0, 1, 4);
camera.up.set(0, 1, 0);

const vehicle = new THREE.Group();
scene.add(vehicle);

const keys = new Set<string>();
let speed = 0;
let heading = 0;

window.addEventListener('keydown', (event) => {
  if (
    ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight']
      .includes(event.code)
  ) {
    keys.add(event.code);
    event.preventDefault();
  }
});

window.addEventListener('keyup', (event) => {
  keys.delete(event.code);
});

const loader = new GLTFLoader();
loader.load(
  '/models/van.glb',
  (gltf) => {
    const model = gltf.scene;
    const textureLoader = new THREE.TextureLoader();
    const colormap = textureLoader.load('/models/Textures/colormap.png');
    colormap.colorSpace = THREE.SRGBColorSpace;
    colormap.flipY = false;

    model.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.castShadow = true;
        object.receiveShadow = true;
        if (object.material instanceof THREE.MeshStandardMaterial) {
          object.material.map = colormap;
          object.material.needsUpdate = true;
        }
      }
    });

    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const largestDimension = Math.max(size.x, size.y, size.z);
    const scale = largestDimension > 0 ? 6 / largestDimension : 1;

    model.scale.setScalar(scale);
    model.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);
    vehicle.add(model);
  },
  undefined,
  (error) => {
    console.error('Could not load /models/van.glb', error);
  },
);

function resize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}

window.addEventListener('resize', resize);

function animate() {
  const accelerating =
    keys.has('KeyW') ||
    keys.has('ArrowUp') ||
    keys.has('KeyS') ||
    keys.has('ArrowDown');

  if (keys.has('KeyW') || keys.has('ArrowUp')) {
    speed += 0.012;
  } else if (keys.has('KeyS') || keys.has('ArrowDown')) {
    speed -= 0.012;
  } else {
    speed *= 0.94;
  }

  speed = THREE.MathUtils.clamp(speed, -0.12, 0.22);

  const steering =
    (keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0) -
    (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0);

  if (Math.abs(speed) > 0.005 && steering !== 0) {
    heading += steering * 0.025 * Math.sign(speed);
  }

  vehicle.rotation.y = heading;
  vehicle.position.x += Math.sin(heading) * speed;
  vehicle.position.z += Math.cos(heading) * speed;

  const forward = new THREE.Vector3(Math.sin(heading), 0, Math.cos(heading));
  const cameraTarget = vehicle.position.clone().add(forward.clone().multiplyScalar(4));
  const desiredCameraPosition = vehicle.position.clone()
    .add(forward.clone().multiplyScalar(-9))
    .add(new THREE.Vector3(0, 5.5, 0));

  camera.position.lerp(desiredCameraPosition, accelerating ? 0.1 : 0.06);
  camera.lookAt(cameraTarget);

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();
