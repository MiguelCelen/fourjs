import * as THREE from 'three';
import './style.css';

const canvas = document.querySelector<HTMLCanvasElement>('#scene');

if (!canvas) {
  throw new Error('Scene canvas was not found.');
}

const scene = new THREE.Scene();
scene.background = new THREE.Color('#101510');

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

const cube = new THREE.Mesh(
  new THREE.BoxGeometry(1.7, 1.7, 1.7),
  new THREE.MeshStandardMaterial({ color: '#39e75f', roughness: 0.35 }),
);
scene.add(cube);

function resize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}

window.addEventListener('resize', resize);

function animate() {
  cube.rotation.x += 0.004;
  cube.rotation.y += 0.007;
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();
