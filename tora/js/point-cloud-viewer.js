import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const SPHERE_GEO = new THREE.SphereGeometry(0.012, 6, 4);

const PART_COLORS = [
  [0.26, 0.52, 0.96],
  [0.91, 0.30, 0.24],
  [0.18, 0.80, 0.44],
  [0.95, 0.61, 0.07],
  [0.61, 0.35, 0.71],
  [0.10, 0.74, 0.61],
  [0.90, 0.49, 0.13],
  [0.58, 0.65, 0.81],
  [0.85, 0.37, 0.55],
  [0.40, 0.70, 0.30],
];

function generateChairParts() {
  const parts = [];

  const seatPoints = [];
  for (let i = 0; i < 600; i++) {
    seatPoints.push([
      (Math.random() - 0.5) * 0.8,
      0.0 + (Math.random() - 0.5) * 0.04,
      (Math.random() - 0.5) * 0.8
    ]);
  }
  parts.push(seatPoints);

  const legPositions = [[-0.35, 0, -0.35], [0.35, 0, -0.35], [-0.35, 0, 0.35], [0.35, 0, 0.35]];
  for (const [lx, , lz] of legPositions) {
    const legPoints = [];
    for (let i = 0; i < 200; i++) {
      legPoints.push([
        lx + (Math.random() - 0.5) * 0.06,
        -Math.random() * 0.7,
        lz + (Math.random() - 0.5) * 0.06
      ]);
    }
    parts.push(legPoints);
  }

  const backPoints = [];
  for (let i = 0; i < 500; i++) {
    backPoints.push([
      (Math.random() - 0.5) * 0.8,
      Math.random() * 0.7,
      -0.38 + (Math.random() - 0.5) * 0.04
    ]);
  }
  parts.push(backPoints);

  return parts;
}

function generateTableParts() {
  const parts = [];

  const topPoints = [];
  for (let i = 0; i < 800; i++) {
    topPoints.push([
      (Math.random() - 0.5) * 1.2,
      0.0 + (Math.random() - 0.5) * 0.04,
      (Math.random() - 0.5) * 0.6
    ]);
  }
  parts.push(topPoints);

  const legPositions = [[-0.5, 0, -0.22], [0.5, 0, -0.22], [-0.5, 0, 0.22], [0.5, 0, 0.22]];
  for (const [lx, , lz] of legPositions) {
    const legPoints = [];
    for (let i = 0; i < 200; i++) {
      legPoints.push([
        lx + (Math.random() - 0.5) * 0.06,
        -Math.random() * 0.65,
        lz + (Math.random() - 0.5) * 0.06
      ]);
    }
    parts.push(legPoints);
  }

  return parts;
}

function generateVaseParts() {
  const parts = [];
  const numSlices = 4;
  const pointsPerSlice = 400;

  for (let s = 0; s < numSlices; s++) {
    const slicePoints = [];
    const yMin = -0.6 + (s / numSlices) * 1.2;
    const yMax = -0.6 + ((s + 1) / numSlices) * 1.2;

    for (let i = 0; i < pointsPerSlice; i++) {
      const y = yMin + Math.random() * (yMax - yMin);
      const t = (y + 0.6) / 1.2;
      const radius = 0.15 + 0.25 * Math.sin(t * Math.PI) * (1 + 0.3 * Math.sin(t * Math.PI * 2));
      const angle = Math.random() * Math.PI * 2;
      const r = radius + (Math.random() - 0.5) * 0.02;
      slicePoints.push([
        Math.cos(angle) * r,
        y,
        Math.sin(angle) * r
      ]);
    }
    parts.push(slicePoints);
  }

  return parts;
}

function generateBowlParts() {
  const parts = [];
  const numFragments = 3;
  const pointsPerFrag = 500;

  for (let f = 0; f < numFragments; f++) {
    const fragPoints = [];
    const angleStart = (f / numFragments) * Math.PI * 2;
    const angleEnd = ((f + 1) / numFragments) * Math.PI * 2;

    for (let i = 0; i < pointsPerFrag; i++) {
      const angle = angleStart + Math.random() * (angleEnd - angleStart);
      const phi = Math.random() * Math.PI * 0.5;
      const R = 0.4 + (Math.random() - 0.5) * 0.02;
      fragPoints.push([
        R * Math.sin(phi) * Math.cos(angle),
        -R * Math.cos(phi) + 0.25,
        R * Math.sin(phi) * Math.sin(angle)
      ]);
    }
    parts.push(fragPoints);
  }

  return parts;
}

const SHAPE_GENERATORS = {
  chair: generateChairParts,
  table: generateTableParts,
  vase: generateVaseParts,
  bowl: generateBowlParts
};

function disassembleParts(parts, factor) {
  return parts.map((partPoints, idx) => {
    const cx = partPoints.reduce((s, p) => s + p[0], 0) / partPoints.length;
    const cy = partPoints.reduce((s, p) => s + p[1], 0) / partPoints.length;
    const cz = partPoints.reduce((s, p) => s + p[2], 0) / partPoints.length;

    const angle = (idx / parts.length) * Math.PI * 2 + 0.5;
    const dx = Math.cos(angle) * factor * 0.8;
    const dy = (Math.random() - 0.5) * factor * 0.4;
    const dz = Math.sin(angle) * factor * 0.8;

    const rotAngle = factor * (idx * 0.7 + 0.3);
    const cosA = Math.cos(rotAngle);
    const sinA = Math.sin(rotAngle);

    return partPoints.map(([x, y, z]) => {
      let rx = x - cx, ry = y - cy, rz = z - cz;
      const nx = rx * cosA - rz * sinA;
      const nz = rx * sinA + rz * cosA;
      return [nx + cx + dx, ry + cy + dy, nz + cz + dz];
    });
  });
}

function addWrongAssembly(parts) {
  return parts.map((partPoints, idx) => {
    const dx = (Math.random() - 0.5) * 0.15;
    const dy = (Math.random() - 0.5) * 0.1;
    const dz = (Math.random() - 0.5) * 0.15;
    const rotAngle = (Math.random() - 0.5) * 0.3;
    const cosA = Math.cos(rotAngle);
    const sinA = Math.sin(rotAngle);

    const cx = partPoints.reduce((s, p) => s + p[0], 0) / partPoints.length;
    const cz = partPoints.reduce((s, p) => s + p[2], 0) / partPoints.length;

    return partPoints.map(([x, y, z]) => {
      let rx = x - cx, rz = z - cz;
      const nx = rx * cosA - rz * sinA;
      const nz = rx * sinA + rz * cosA;
      return [nx + cx + dx, y + dy, nz + cz + dz];
    });
  });
}

function createPointCloudMesh(parts, scene) {
  let totalPoints = 0;
  parts.forEach(p => totalPoints += p.length);

  const mat = new THREE.MeshBasicMaterial({ vertexColors: false });
  const meshes = [];

  parts.forEach((partPoints, partIdx) => {
    const color = PART_COLORS[partIdx % PART_COLORS.length];
    const partMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(color[0], color[1], color[2])
    });

    const inst = new THREE.InstancedMesh(SPHERE_GEO, partMat, partPoints.length);
    const dummy = new THREE.Object3D();

    partPoints.forEach(([x, y, z], i) => {
      dummy.position.set(x, y, z);
      dummy.updateMatrix();
      inst.setMatrixAt(i, dummy.matrix);
    });

    inst.instanceMatrix.needsUpdate = true;
    scene.add(inst);
    meshes.push(inst);
  });

  return meshes;
}

function updatePointCloudPositions(meshes, parts) {
  const dummy = new THREE.Object3D();
  parts.forEach((partPoints, partIdx) => {
    if (!meshes[partIdx]) return;
    partPoints.forEach(([x, y, z], i) => {
      dummy.position.set(x, y, z);
      dummy.updateMatrix();
      meshes[partIdx].setMatrixAt(i, dummy.matrix);
    });
    meshes[partIdx].instanceMatrix.needsUpdate = true;
  });
}

function createViewer(container, options = {}) {
  const {
    backgroundColor = 0xfafafa,
    cameraPos = [0, 0.8, 3.5],
    autoRotate = true,
    enableZoom = true,
  } = options;

  const width = container.clientWidth;
  const height = container.clientHeight;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(backgroundColor);

  const camera = new THREE.PerspectiveCamera(30, width / height, 0.1, 100);
  camera.position.set(...cameraPos);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  const ambient = new THREE.AmbientLight(0xffffff, 1.5);
  scene.add(ambient);

  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(3, 8, 5);
  scene.add(dirLight);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0, 0);
  controls.enablePan = false;
  controls.enableZoom = enableZoom;
  controls.autoRotate = autoRotate;
  controls.autoRotateSpeed = 1.5;
  controls.update();

  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }
  animate();

  const onResize = () => {
    const w = container.clientWidth;
    const h = container.clientHeight;
    if (w === 0 || h === 0) return;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  window.addEventListener('resize', onResize);
  requestAnimationFrame(() => onResize());

  return { scene, camera, renderer, controls };
}

/* Assembly Animation Viewer */
export function initAssemblyViewer(containerId, shapeName = 'chair') {
  const container = document.getElementById(containerId);
  if (!container) return;

  const gen = SHAPE_GENERATORS[shapeName] || SHAPE_GENERATORS.chair;
  const assembledParts = gen();
  const disassembledParts = disassembleParts(assembledParts, 1.0);

  const { scene, controls } = createViewer(container, {
    cameraPos: [0, 1.0, 4.0],
    autoRotate: true,
  });

  let meshes = createPointCloudMesh(assembledParts, scene);
  let t = 0;
  let direction = 1;
  const speed = 0.004;

  function interpolateParts(t) {
    return assembledParts.map((part, pi) =>
      part.map(([ax, ay, az], i) => {
        const [dx, dy, dz] = disassembledParts[pi][i];
        return [
          ax + (dx - ax) * t,
          ay + (dy - ay) * t,
          az + (dz - az) * t,
        ];
      })
    );
  }

  let pauseTimer = 0;
  function animateAssembly() {
    requestAnimationFrame(animateAssembly);

    if (pauseTimer > 0) {
      pauseTimer--;
      return;
    }

    t += speed * direction;
    if (t >= 1) {
      t = 1;
      direction = -1;
      pauseTimer = 60;
    } else if (t <= 0) {
      t = 0;
      direction = 1;
      pauseTimer = 120;
    }

    const currentParts = interpolateParts(t);
    updatePointCloudPositions(meshes, currentParts);
  }
  animateAssembly();

  return {
    setShape: (name) => {
      meshes.forEach(m => scene.remove(m));
      const newGen = SHAPE_GENERATORS[name] || SHAPE_GENERATORS.chair;
      const newAssembled = newGen();
      const newDisassembled = disassembleParts(newAssembled, 1.0);
      assembledParts.length = 0;
      disassembledParts.length = 0;
      newAssembled.forEach(p => assembledParts.push(p));
      newDisassembled.forEach(p => disassembledParts.push(p));
      meshes = createPointCloudMesh(newAssembled, scene);
      t = 0;
      direction = 1;
    }
  };
}

/* Comparison Viewer (Input | RPF | Ours | GT) – returns setShape(shapeName), setSample(index) */
const NUM_SAMPLES = 6;
const DATASET_SHAPES = ['chair', 'table', 'vase', 'bowl'];

function getPartsForShape(shapeName) {
  const gen = SHAPE_GENERATORS[shapeName] || SHAPE_GENERATORS.chair;
  const assembled = gen();
  const disassembled = disassembleParts(assembled, 1.0);
  const rpf = addWrongAssembly(assembled);
  return { assembled, disassembled, rpf };
}

function pregenerateSamples() {
  const samples = {};
  DATASET_SHAPES.forEach(shapeName => {
    samples[shapeName] = [];
    for (let i = 0; i < NUM_SAMPLES; i++) {
      samples[shapeName].push(getPartsForShape(shapeName));
    }
  });
  return samples;
}

export function initComparisonViewers(containerIds, shapeName = 'chair') {
  const configKeys = ['disassembled', 'rpf', 'assembled', 'assembled'];
  const viewers = [];
  const samples = pregenerateSamples();
  let currentShape = shapeName;
  let currentSampleIndex = 0;

  function setMeshesFromParts(viewer, parts) {
    if (viewer.meshes && viewer.meshes.length) {
      viewer.meshes.forEach(m => viewer.scene.remove(m));
    }
    viewer.meshes = createPointCloudMesh(parts, viewer.scene);
  }

  function applyParts(partsByKey) {
    viewers.forEach(v => {
      const parts = partsByKey[v.configKey];
      setMeshesFromParts(v, parts);
    });
  }

  const initial = samples[shapeName][0];
  const partsByKey = [
    initial.disassembled,
    initial.rpf,
    initial.assembled,
    initial.assembled,
  ];

  configKeys.forEach((key, idx) => {
    const container = document.getElementById(containerIds[idx]);
    if (!container) return;

    const { scene, controls } = createViewer(container, {
      cameraPos: [0, 0.8, 3.5],
      autoRotate: true,
    });

    controls.autoRotateSpeed = 1.5;
    const meshes = createPointCloudMesh(partsByKey[idx], scene);
    viewers.push({ scene, controls, meshes, configKey: configKeys[idx] });
  });

  let syncing = false;
  viewers.forEach((v, srcIdx) => {
    v.controls.addEventListener('change', () => {
      if (syncing) return;
      syncing = true;
      const src = v.controls;
      const cam = src.object;
      const offset = new THREE.Vector3().copy(cam.position).sub(src.target);
      const sph = new THREE.Spherical().setFromVector3(offset);

      viewers.forEach((other, otherIdx) => {
        if (otherIdx === srcIdx) return;
        const newPos = new THREE.Vector3()
          .setFromSphericalCoords(sph.radius, sph.phi, sph.theta)
          .add(other.controls.target);
        other.controls.object.position.copy(newPos);
        other.controls.object.lookAt(other.controls.target);
        other.controls.update();
      });
      syncing = false;
    });
  });

  return {
    setShape(name) {
      currentShape = name;
      currentSampleIndex = 0;
      const parts = samples[name][0];
      const partsByKey = { disassembled: parts.disassembled, rpf: parts.rpf, assembled: parts.assembled };
      applyParts(partsByKey);
    },
    setSample(index) {
      if (index < 0 || index >= NUM_SAMPLES) return;
      currentSampleIndex = index;
      const parts = samples[currentShape][index];
      const partsByKey = { disassembled: parts.disassembled, rpf: parts.rpf, assembled: parts.assembled };
      applyParts(partsByKey);
    },
  };
}

/* Interactive Assembly Slider */
export function initSliderViewer(containerId, sliderId, valueId, shapeName = 'chair') {
  const container = document.getElementById(containerId);
  const slider = document.getElementById(sliderId);
  const valueDisplay = document.getElementById(valueId);
  if (!container || !slider) return;

  const gen = SHAPE_GENERATORS[shapeName] || SHAPE_GENERATORS.chair;
  const assembledParts = gen();

  const { scene } = createViewer(container, {
    cameraPos: [0, 1.0, 4.0],
    autoRotate: true,
  });

  let meshes = createPointCloudMesh(assembledParts, scene);

  slider.addEventListener('input', () => {
    const t = parseFloat(slider.value);
    if (valueDisplay) valueDisplay.textContent = t.toFixed(2);
    const disassembled = disassembleParts(assembledParts, t);
    const currentParts = assembledParts.map((part, pi) =>
      part.map(([ax, ay, az], i) => {
        const [dx, dy, dz] = disassembled[pi][i];
        return [
          ax + (dx - ax) * t,
          ay + (dy - ay) * t,
          az + (dz - az) * t,
        ];
      })
    );
    updatePointCloudPositions(meshes, currentParts);
  });

  return {
    setShape: (name) => {
      meshes.forEach(m => scene.remove(m));
      const newGen = SHAPE_GENERATORS[name] || SHAPE_GENERATORS.chair;
      const newParts = newGen();
      assembledParts.length = 0;
      newParts.forEach(p => assembledParts.push(p));
      meshes = createPointCloudMesh(assembledParts, scene);
      slider.value = 0;
      if (valueDisplay) valueDisplay.textContent = '0.00';
    }
  };
}

/* JSON-based Comparison Viewer – loads real point cloud samples from JSON files */
export function initJsonComparisonViewers(containerIds) {
  const KEYS = ['input', 'rpf', 'ours', 'gt'];
  const viewers = [];

  KEYS.forEach((key, idx) => {
    const container = document.getElementById(containerIds[idx]);
    if (!container) return;
    const { scene, controls } = createViewer(container, {
      cameraPos: [0, 0.5, 3.0],
      autoRotate: true,
    });
    controls.autoRotateSpeed = 1.2;
    viewers.push({ scene, controls, meshes: [], key });
  });

  // Sync camera across all viewers
  let syncing = false;
  viewers.forEach((v, srcIdx) => {
    v.controls.addEventListener('change', () => {
      if (syncing) return;
      syncing = true;
      const cam = v.controls.object;
      const offset = new THREE.Vector3().copy(cam.position).sub(v.controls.target);
      const sph = new THREE.Spherical().setFromVector3(offset);
      viewers.forEach((other, otherIdx) => {
        if (otherIdx === srcIdx) return;
        const newPos = new THREE.Vector3()
          .setFromSphericalCoords(sph.radius, sph.phi, sph.theta)
          .add(other.controls.target);
        other.controls.object.position.copy(newPos);
        other.controls.object.lookAt(other.controls.target);
        other.controls.update();
      });
      syncing = false;
    });
  });

  function normalizeParts(partsArray) {
    // Center and scale all parts together
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
    partsArray.forEach(pts => pts.forEach(([x, y, z]) => {
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
      if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
    }));
    const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2, cz = (minZ + maxZ) / 2;
    const scale = 1.6 / Math.max(maxX - minX, maxY - minY, maxZ - minZ, 0.001);
    return partsArray.map(pts => pts.map(([x, y, z]) => [
      (x - cx) * scale, (y - cy) * scale, (z - cz) * scale
    ]));
  }

  function applyData(data) {
    // data.parts = [{input, rpf, ours, gt}, ...]
    viewers.forEach(v => {
      v.meshes.forEach(m => v.scene.remove(m));
      const rawParts = data.parts.map(p => p[v.key]);
      const parts = normalizeParts(rawParts);
      v.meshes = createPointCloudMesh(parts, v.scene);
    });
  }

  return {
    loadSample(jsonUrl) {
      fetch(jsonUrl)
        .then(r => r.json())
        .then(data => applyData(data))
        .catch(err => console.error('Failed to load sample:', jsonUrl, err));
    }
  };
}

/* Static Part Viewer */
export function initStaticViewer(containerId, shapeName = 'chair', mode = 'assembled') {
  const container = document.getElementById(containerId);
  if (!container) return;

  const gen = SHAPE_GENERATORS[shapeName] || SHAPE_GENERATORS.chair;
  const assembledParts = gen();

  let parts;
  if (mode === 'disassembled') {
    parts = disassembleParts(assembledParts, 1.0);
  } else if (mode === 'baseline') {
    parts = addWrongAssembly(assembledParts);
  } else {
    parts = assembledParts;
  }

  const { scene } = createViewer(container, {
    cameraPos: [0, 0.8, 3.5],
    autoRotate: true,
  });

  createPointCloudMesh(parts, scene);
}
