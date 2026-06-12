import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const SPHERE_GEO = new THREE.SphereGeometry(0.013, 6, 4);

// Reference scan: slate gray / Source scan: PROSE orange
const REF_COLOR = new THREE.Color(0.42, 0.45, 0.50);
const SRC_COLOR = new THREE.Color(0.98, 0.45, 0.09);

/* Deterministic PRNG so each (dataset, sample) pair always shows the same scene */
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSeed(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/* ---------------- Synthetic indoor scene (placeholder for real samples) ---------------- */

function boxPoints(rng, cx, cy, cz, sx, sy, sz, n) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    // sample on the box surface so objects look hollow like a scan
    const face = Math.floor(rng() * 6);
    let x = (rng() - 0.5) * sx, y = (rng() - 0.5) * sy, z = (rng() - 0.5) * sz;
    if (face === 0) x = sx / 2; else if (face === 1) x = -sx / 2;
    else if (face === 2) y = sy / 2; else if (face === 3) y = -sy / 2;
    else if (face === 4) z = sz / 2; else z = -sz / 2;
    pts.push([cx + x, cy + y, cz + z]);
  }
  return pts;
}

function tablePoints(rng, cx, cz, w, d, h, n) {
  const pts = boxPoints(rng, cx, h, cz, w, 0.04, d, Math.floor(n * 0.6));
  const legs = [[-w / 2 + 0.05, -d / 2 + 0.05], [w / 2 - 0.05, -d / 2 + 0.05], [-w / 2 + 0.05, d / 2 - 0.05], [w / 2 - 0.05, d / 2 - 0.05]];
  legs.forEach(([lx, lz]) => {
    for (let i = 0; i < n * 0.1; i++) {
      pts.push([cx + lx + (rng() - 0.5) * 0.05, rng() * h, cz + lz + (rng() - 0.5) * 0.05]);
    }
  });
  return pts;
}

function chairPoints(rng, cx, cz, rot, n) {
  const pts = [];
  const seat = boxPoints(rng, 0, 0.45, 0, 0.45, 0.05, 0.45, Math.floor(n * 0.4));
  const back = boxPoints(rng, 0, 0.75, -0.2, 0.45, 0.55, 0.05, Math.floor(n * 0.4));
  const legPos = [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]];
  legPos.forEach(([lx, lz]) => {
    for (let i = 0; i < n * 0.05; i++) {
      pts.push([lx + (rng() - 0.5) * 0.04, rng() * 0.45, lz + (rng() - 0.5) * 0.04]);
    }
  });
  const all = seat.concat(back, pts);
  const c = Math.cos(rot), s = Math.sin(rot);
  return all.map(([x, y, z]) => [cx + x * c - z * s, y, cz + x * s + z * c]);
}

function generateScene(seedStr) {
  const rng = mulberry32(hashSeed(seedStr));
  const objects = [];

  // floor (sparse)
  const floor = [];
  for (let i = 0; i < 1400; i++) {
    floor.push([(rng() - 0.5) * 4.4, 0, (rng() - 0.5) * 3.4]);
  }
  objects.push(floor);

  // two walls
  const wallA = [];
  for (let i = 0; i < 700; i++) {
    wallA.push([(rng() - 0.5) * 4.4, rng() * 1.6, -1.7]);
  }
  objects.push(wallA);
  const wallB = [];
  for (let i = 0; i < 550; i++) {
    wallB.push([-2.2, rng() * 1.6, (rng() - 0.5) * 3.4]);
  }
  objects.push(wallB);

  // table + chairs around a random spot
  const tx = (rng() - 0.5) * 1.6, tz = (rng() - 0.5) * 1.0;
  objects.push(tablePoints(rng, tx, tz, 1.2, 0.8, 0.72, 900));
  const nChairs = 2 + Math.floor(rng() * 3);
  for (let i = 0; i < nChairs; i++) {
    const ang = rng() * Math.PI * 2;
    objects.push(chairPoints(rng, tx + Math.cos(ang) * 0.95, tz + Math.sin(ang) * 0.8, -ang + Math.PI / 2, 450));
  }

  // cabinet against back wall
  const cabX = (rng() - 0.5) * 3.0;
  objects.push(boxPoints(rng, cabX, 0.55, -1.5, 0.9, 1.1, 0.4, 600));

  // sofa-ish block against left wall
  const sofaZ = (rng() - 0.5) * 2.0;
  objects.push(boxPoints(rng, -1.9, 0.35, sofaZ, 0.55, 0.7, 1.4, 650));

  // a couple of small loose objects
  const nSmall = 2 + Math.floor(rng() * 2);
  for (let i = 0; i < nSmall; i++) {
    objects.push(boxPoints(rng, (rng() - 0.5) * 3.4, 0.15 + rng() * 0.6, (rng() - 0.5) * 2.6, 0.25, 0.3, 0.25, 220));
  }

  return objects;
}

/* Split the scene into partially overlapping ref/src scans, normalize to view size */
function makeScanPair(seedStr, jitter) {
  const rng = mulberry32(hashSeed(seedStr + '/split'));
  const objects = generateScene(seedStr);

  const ref = [];
  const src = [];
  objects.forEach((pts, idx) => {
    // floor/walls visible in both; furniture mostly shared, some scan-exclusive
    const r = rng();
    const inRef = idx < 3 || r < 0.85;
    const inSrc = idx < 3 || r > 0.15;
    pts.forEach(p => {
      const keepRef = rng() < 0.6;
      const keepSrc = rng() < 0.6;
      const jr = () => (rng() - 0.5) * jitter;
      if (inRef && keepRef) ref.push([p[0] + jr(), p[1] + jr(), p[2] + jr()]);
      if (inSrc && keepSrc) src.push([p[0] + jr(), p[1] + jr(), p[2] + jr()]);
    });
  });

  // normalize both with a shared transform
  let minX = Infinity, minY = Infinity, minZ = Infinity, maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
  ref.concat(src).forEach(([x, y, z]) => {
    if (x < minX) minX = x; if (x > maxX) maxX = x;
    if (y < minY) minY = y; if (y > maxY) maxY = y;
    if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
  });
  const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2, cz = (minZ + maxZ) / 2;
  const scale = 2.4 / Math.max(maxX - minX, maxY - minY, maxZ - minZ, 0.001);
  const norm = pts => pts.map(([x, y, z]) => [(x - cx) * scale, (y - cy) * scale, (z - cz) * scale]);

  return { ref: norm(ref), src: norm(src) };
}

/* Apply a registration-error transform (rotation about Y + translation) to the source scan */
function applyError(pts, rotDeg, trans, seedStr) {
  const rng = mulberry32(hashSeed(seedStr + '/err'));
  const ang = (rotDeg * Math.PI / 180) * (rng() < 0.5 ? -1 : 1);
  const c = Math.cos(ang), s = Math.sin(ang);
  const dirA = rng() * Math.PI * 2;
  const tx = Math.cos(dirA) * trans, tz = Math.sin(dirA) * trans;
  const ty = (rng() - 0.5) * trans * 0.4;
  return pts.map(([x, y, z]) => [x * c - z * s + tx, y + ty, x * s + z * c + tz]);
}

// Per-method registration error (degrees, view units) — roughly mirrors the paper's RRE/RTE ordering
const METHOD_ERROR = {
  teaser: { rot: 16, trans: 0.30 },
  sgreg:  { rot: 30, trans: 0.65 },
  ours:   { rot: 2.5, trans: 0.035 },
  gt:     { rot: 0, trans: 0 },
};

// Per-sample scan noise so the five qualitative examples vary (clean GT-like → noisy recon-like)
const SAMPLE_JITTER = [0.012, 0.05, 0.025, 0.07, 0.04];

/* ---------------- Viewer plumbing (same skeleton as the TORA page) ---------------- */

function createViewer(container, options = {}) {
  const {
    backgroundColor = 0xfafafa,
    cameraPos = [0, 1.7, 3.1],
    autoRotate = true,
  } = options;

  const width = container.clientWidth;
  const height = container.clientHeight;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(backgroundColor);

  const camera = new THREE.PerspectiveCamera(32, width / height, 0.1, 100);
  camera.position.set(...cameraPos);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(0xffffff, 1.5));

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0, 0);
  controls.enablePan = false;
  controls.autoRotate = autoRotate;
  controls.autoRotateSpeed = 1.0;
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

function createCloudMesh(points, color, scene) {
  const mat = new THREE.MeshBasicMaterial({ color });
  const inst = new THREE.InstancedMesh(SPHERE_GEO, mat, points.length);
  const dummy = new THREE.Object3D();
  points.forEach(([x, y, z], i) => {
    dummy.position.set(x, y, z);
    dummy.updateMatrix();
    inst.setMatrixAt(i, dummy.matrix);
  });
  inst.instanceMatrix.needsUpdate = true;
  scene.add(inst);
  return inst;
}

/*
 * Registration comparison viewers: TEASER++ | SG-Reg | Ours | GT.
 * Each panel shows the reference scan (gray) and the source scan (orange)
 * transformed by that method's estimated registration.
 *
 * Currently fed with procedurally generated sample scenes — swap loadSample()
 * to fetch real exported point clouds (e.g. JSON) when available.
 */
export function initRegistrationViewers(containerIds) {
  const KEYS = ['teaser', 'sgreg', 'ours', 'gt'];
  const viewers = [];

  KEYS.forEach((key, idx) => {
    const container = document.getElementById(containerIds[idx]);
    if (!container) return;
    const { scene, controls } = createViewer(container);
    viewers.push({ scene, controls, meshes: [], key });
  });

  // Sync camera across all four panels
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

  return {
    loadSample(index) {
      const seedStr = `qual/${index}`;
      const jitter = SAMPLE_JITTER[index % SAMPLE_JITTER.length] ?? 0.03;
      const { ref, src } = makeScanPair(seedStr, jitter);
      viewers.forEach(v => {
        v.meshes.forEach(m => v.scene.remove(m));
        const err = METHOD_ERROR[v.key];
        const srcT = applyError(src, err.rot, err.trans, seedStr + '/' + v.key);
        v.meshes = [
          createCloudMesh(ref, REF_COLOR, v.scene),
          createCloudMesh(srcT, SRC_COLOR, v.scene),
        ];
      });
    },
  };
}
