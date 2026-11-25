import * as THREE from 'three';
import { mergeGeometries, mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/**
 * Shared semantic material palette for modular GLTF/GLB architectural assemblies.
 * Texture maps are bound dynamically at runtime inside `kluAssetLoader.js` so
 * GPU textures are shared across all loaded GLBs with minimal VRAM overhead.
 */
export const ARCH_MATERIAL_SPECS = {
  StuccoWhite: { color: 0xf4f0e8, roughness: 0.86, metalness: 0.02 },
  StuccoWarmTrim: { color: 0xe6e0d4, roughness: 0.82, metalness: 0.03 },
  ConcreteMuted: { color: 0xd4cfc5, roughness: 0.88, metalness: 0.02 },
  CharcoalPrecast: { color: 0x262b33, roughness: 0.68, metalness: 0.14 },
  TerracottaMetallic: { color: 0xb14925, roughness: 0.44, metalness: 0.34 },
  TerracottaBrick: { color: 0xa45440, roughness: 0.8, metalness: 0.04 },
  IndoorBrick: { color: 0xc28c7b, roughness: 0.82, metalness: 0.03 },
  StackedStone: { color: 0x7a7064, roughness: 0.9, metalness: 0.02 },
  TimberFascia: { color: 0xc28149, roughness: 0.62, metalness: 0.05 },
  DarkAnodizedSteel: { color: 0x1d2127, roughness: 0.36, metalness: 0.72 },
  BrushedSteel: { color: 0x7e8791, roughness: 0.42, metalness: 0.58 },
  SteelVaultRoof: { color: 0xb6bcc4, roughness: 0.36, metalness: 0.56 },
  MaroonArchSteel: { color: 0x5c241d, roughness: 0.46, metalness: 0.48 },
  CurtainGlass: { color: 0x203240, roughness: 0.1, metalness: 0.22 },
  ClearAtriumGlass: { color: 0x5c7c92, roughness: 0.08, metalness: 0.12, transparent: true, opacity: 0.38 },
  RecessedCavityGlass: { color: 0x13202a, roughness: 0.12, metalness: 0.18 },
  AquaBalconyGlass: { color: 0x43a1a6, roughness: 0.28, metalness: 0.12, transparent: true, opacity: 0.82 },
  PurpleCore: { color: 0x5c3e66, roughness: 0.72, metalness: 0.06 },
  RedGranite: { color: 0x7d3d31, roughness: 0.56, metalness: 0.08 },
  CrimsonFascia: { color: 0x8f1922, roughness: 0.38, metalness: 0.18 },
  GoldKalasha: { color: 0xd1a141, roughness: 0.26, metalness: 0.72 },
  RoofSlabConcrete: { color: 0xb7b1a6, roughness: 0.92, metalness: 0.02 },
  SolarPV: { color: 0x19314d, roughness: 0.18, metalness: 0.48 },
  WarmAtriumInterior: { color: 0xe5cca8, emissive: 0x6b4f2b, emissiveIntensity: 0.28, roughness: 0.72, metalness: 0.0 },
  SoilBed: { color: 0x453b31, roughness: 0.96, metalness: 0.0 },
  PlanterFoliage: { color: 0x3b6729, roughness: 0.84, metalness: 0.0 }
};

const VERTEX_COLOR_KEYS = new Set([
  'StuccoWhite',
  'StuccoWarmTrim',
  'ConcreteMuted',
  'CharcoalPrecast',
  'TerracottaBrick',
  'IndoorBrick',
  'StackedStone',
  'TimberFascia',
  'RedGranite',
  'RoofSlabConcrete',
  'PurpleCore',
  'PlanterFoliage'
]);

export function createSemanticMaterials(overrideMap = {}) {
  const mats = {};
  Object.entries(ARCH_MATERIAL_SPECS).forEach(([key, spec]) => {
    if (overrideMap[key]) {
      mats[key] = overrideMap[key];
      return;
    }
    mats[key] = new THREE.MeshStandardMaterial({
      name: key,
      color: spec.color,
      roughness: spec.roughness,
      metalness: spec.metalness,
      transparent: Boolean(spec.transparent),
      opacity: spec.opacity ?? 1,
      emissive: spec.emissive ?? 0x000000,
      emissiveIntensity: spec.emissiveIntensity ?? 0,
      vertexColors: VERTEX_COLOR_KEYS.has(key)
    });
  });
  return mats;
}

export function createGeoBuckets() {
  const b = {};
  Object.keys(ARCH_MATERIAL_SPECS).forEach((k) => {
    b[k] = [];
  });
  return b;
}

/**
 * Merges geometry buckets, deduplicating shared vertices (`mergeVertices`) to cut binary `.glb` size by ~55%.
 */
export function normalizeAndMergeBucket(geos) {
  const valid = geos.filter((g) => g && g.attributes && g.attributes.position && g.attributes.position.count > 0);
  if (!valid.length) return null;

  const prepped = valid.map((raw) => {
    const g = raw.index ? raw.toNonIndexed() : raw.clone();
    const count = g.attributes.position.count;
    if (!g.attributes.normal) g.computeVertexNormals();
    if (!g.attributes.uv) {
      g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(count * 2), 2));
    }
    if (!g.attributes.color) {
      const col = new Float32Array(count * 3);
      col.fill(1);
      g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    }
    g.clearGroups();
    return g;
  });

  const merged = mergeGeometries(prepped, false);
  prepped.forEach((g) => g.dispose());
  if (!merged) return null;

  const indexed = mergeVertices(merged, 1e-4);
  if (indexed && indexed !== merged) {
    merged.dispose();
    return indexed;
  }
  return merged;
}

export function applyBoxWorldUVsAndAO(geo, { uScale = 8, vScale = 8, groundY = 0, aoMin = 0.68, soffitDark = 0.72, innerTint = 1.0 } = {}) {
  const pos = geo.attributes.position;
  if (!geo.attributes.normal) geo.computeVertexNormals();
  const norm = geo.attributes.normal;
  const uv = geo.attributes.uv;
  const count = pos.count;
  const col = new Float32Array(count * 3);

  for (let i = 0; i < count; i += 1) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const nx = norm.getX(i);
    const ny = norm.getY(i);
    const nz = norm.getZ(i);

    if (uv) {
      if (Math.abs(ny) > 0.72) {
        uv.setXY(i, x / uScale, z / vScale);
      } else if (Math.abs(nx) >= Math.abs(nz)) {
        uv.setXY(i, z / uScale, y / vScale);
      } else {
        uv.setXY(i, x / uScale, y / vScale);
      }
    }

    let ao = innerTint;
    const relY = Math.max(0, y - groundY);
    if (relY < 1.45) {
      const t = relY / 1.45;
      ao *= aoMin + (1 - aoMin) * t;
    }
    if (ny < -0.35) {
      ao *= soffitDark;
    }
    col[i * 3] = ao;
    col[i * 3 + 1] = ao;
    col[i * 3 + 2] = ao;
  }

  if (uv) uv.needsUpdate = true;
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return geo;
}

export function addWallBox(buckets, matKey, w, h, d, lx, ly, lz, origin, yaw, aoOpts = {}) {
  const geo = new THREE.BoxGeometry(w, h, d);
  geo.translate(lx, ly, lz);
  geo.rotateY(yaw);
  geo.translate(origin[0], origin[1], origin[2]);
  applyBoxWorldUVsAndAO(geo, aoOpts);
  buckets[matKey].push(geo);
}

/**
 * Ensures closed polygon vertices in XZ run consistently CCW when viewed from +Y,
 * so outward edge normals always equal `(-dz, 0, dx)` normalized (`+localZ` when yaw = `Math.atan2(-dz, dx)`).
 */
export function ensurePolygonCCW(pts) {
  if (!pts || pts.length < 3) return pts || [];
  let signedArea = 0;
  for (let i = 0; i < pts.length; i += 1) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    signedArea += a[0] * b[1] - b[0] * a[1];
  }
  // In XZ where +Y is up and shape uses (x, -z), signedArea in (x, z) < 0 corresponds to CCW in world XZ
  return signedArea > 0 ? [...pts].reverse() : pts.map((p) => [p[0], p[1]]);
}

export function ensurePolygonCW(pts) {
  if (!pts || pts.length < 3) return pts || [];
  let signedArea = 0;
  for (let i = 0; i < pts.length; i += 1) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    signedArea += a[0] * b[1] - b[0] * a[1];
  }
  return signedArea < 0 ? [...pts].reverse() : pts.map((p) => [p[0], p[1]]);
}

export function insetPolyLocalXZ(rawPts, insetDist) {
  const pts = ensurePolygonCCW(rawPts);
  const n = pts.length;
  if (n < 3 || Math.abs(insetDist) < 1e-4) return pts;

  const out = [];
  for (let i = 0; i < n; i += 1) {
    const pPrev = pts[(i - 1 + n) % n];
    const pCurr = pts[i];
    const pNext = pts[(i + 1) % n];

    let dx1 = pCurr[0] - pPrev[0];
    let dz1 = pCurr[1] - pPrev[1];
    const l1 = Math.hypot(dx1, dz1) || 1;
    dx1 /= l1;
    dz1 /= l1;

    let dx2 = pNext[0] - pCurr[0];
    let dz2 = pNext[1] - pCurr[1];
    const l2 = Math.hypot(dx2, dz2) || 1;
    dx2 /= l2;
    dz2 /= l2;

    // For CCW in (x, z) (signedArea < 0), outward normal is (-dz, dx); inward normal is (dz, -dx)
    const nx1 = dz1;
    const nz1 = -dx1;
    const nx2 = dz2;
    const nz2 = -dx2;

    let mx = nx1 + nx2;
    let mz = nz1 + nz2;
    const ml = Math.hypot(mx, mz);
    if (ml < 1e-4) {
      out.push([pCurr[0] + nx1 * insetDist, pCurr[1] + nz1 * insetDist]);
    } else {
      mx /= ml;
      mz /= ml;
      const cosHalf = Math.max(0.45, mx * nx1 + mz * nz1);
      const scale = Math.min(2.0, 1.0 / cosHalf);
      out.push([pCurr[0] + mx * insetDist * scale, pCurr[1] + mz * insetDist * scale]);
    }
  }
  return out;
}

export function cleanPolyEdges(rawPts, minEdge = 1.6) {
  if (!rawPts || rawPts.length <= 3) return rawPts || [];
  const res = [];
  for (let i = 0; i < rawPts.length; i += 1) {
    const p = rawPts[i];
    if (!res.length) res.push([p[0], p[1]]);
    else {
      const prev = res[res.length - 1];
      if (Math.hypot(p[0] - prev[0], p[1] - prev[1]) >= minEdge) res.push([p[0], p[1]]);
    }
  }
  if (res.length > 3) {
    const f = res[0];
    const l = res[res.length - 1];
    if (Math.hypot(l[0] - f[0], l[1] - f[1]) < minEdge) res.pop();
  }
  return res.length >= 3 ? ensurePolygonCCW(res) : ensurePolygonCCW(rawPts);
}

/**
 * Extrudes an arbitrary XZ polygon + optional courtyard holes with clean world UVs and AO.
 * Emits separate cap (`capMatKey`) and vertical side wall (`wallMatKey`) geometries directly into buckets!
 */
export function addPolygonExtrusion(buckets, pts, height, baseY, capMatKey, wallMatKey, { holes = [], aoMin = 0.7 } = {}) {
  const shape = new THREE.Shape();
  if (!pts || pts.length < 3) return;
  shape.moveTo(pts[0][0], -pts[0][1]);
  for (let i = 1; i < pts.length; i += 1) shape.lineTo(pts[i][0], -pts[i][1]);
  shape.closePath();

  holes.forEach((hp) => {
    if (!hp || hp.length < 3) return;
    const cwHole = ensurePolygonCW(hp);
    const path = new THREE.Path();
    path.moveTo(cwHole[0][0], -cwHole[0][1]);
    for (let j = 1; j < cwHole.length; j += 1) path.lineTo(cwHole[j][0], -cwHole[j][1]);
    path.closePath();
    shape.holes.push(path);
  });

  const ext = new THREE.ExtrudeGeometry(shape, { depth: height, bevelEnabled: false, curveSegments: 8 });
  ext.rotateX(-Math.PI / 2);
  if (baseY !== 0) ext.translate(0, baseY, 0);
  ext.computeVertexNormals();
  applyBoxWorldUVsAndAO(ext, { uScale: 10, vScale: 10, groundY: baseY, aoMin });

  // Split group 0 (cap) & group 1 (side walls) into separate semantic buckets cleanly
  const nonIdx = ext.index ? ext.toNonIndexed() : ext;
  const groups = nonIdx.groups;
  if (groups && groups.length >= 2 && capMatKey !== wallMatKey) {
    groups.forEach((grp) => {
      const sub = extractSubGeometry(nonIdx, grp.start, grp.count);
      if (sub) buckets[grp.materialIndex === 0 ? capMatKey : wallMatKey].push(sub);
    });
    nonIdx.dispose();
  } else {
    buckets[wallMatKey].push(nonIdx);
  }
  if (nonIdx !== ext) ext.dispose();
}

function extractSubGeometry(nonIdxGeo, start, count) {
  if (count <= 0) return null;
  const sub = new THREE.BufferGeometry();
  const pos = nonIdxGeo.attributes.position;
  const norm = nonIdxGeo.attributes.normal;
  const uv = nonIdxGeo.attributes.uv;
  const col = nonIdxGeo.attributes.color;
  sub.setAttribute('position', new THREE.BufferAttribute(pos.array.slice(start * 3, (start + count) * 3), 3));
  if (norm) sub.setAttribute('normal', new THREE.BufferAttribute(norm.array.slice(start * 3, (start + count) * 3), 3));
  if (uv) sub.setAttribute('uv', new THREE.BufferAttribute(uv.array.slice(start * 2, (start + count) * 2), 2));
  if (col) sub.setAttribute('color', new THREE.BufferAttribute(col.array.slice(start * 3, (start + count) * 3), 3));
  return sub;
}

/**
 * Genuine Deep-Revealed Punched-Window Masonry Wall (`yt_solomon_max.jpg` depth: 0.62m wall piers,
 * visible white interior reveal jambs, recessed glazing cavity, stone sills, chajjas & optional AC units!).
 */
export function buildRecessedWindowWall({
  buckets,
  origin,
  yaw = 0,
  span = 30,
  height = 7.2,
  wallThick = 0.64,
  bays = 6,
  floors = 2,
  edgeSolidLeft = 1.6,
  edgeSolidRight = 1.6,
  sillH = 0.9,
  headH = 0.56,
  revealDepth = 0.56,
  chajjaDepth = 0.34,
  mullionsPerBay = 1,
  includeACUnits = false,
  groundY = 0,
  masonryMat = 'StuccoWhite',
  trimMat = 'StuccoWarmTrim',
  includeInteriorBackwall = true
}) {
  const floorH = height / floors;
  const openSpan = Math.max(1.8, span - edgeSolidLeft - edgeSolidRight);
  const bayW = openSpan / bays;
  const pierW = Math.max(0.55, bayW * 0.25);
  const winW = Math.max(0.85, bayW - pierW);
  const xStart = -span * 0.5;

  if (edgeSolidLeft > 0.1) {
    addWallBox(buckets, masonryMat, edgeSolidLeft, height, wallThick, xStart + edgeSolidLeft * 0.5, height * 0.5, -wallThick * 0.5, origin, yaw, { groundY });
  }
  if (edgeSolidRight > 0.1) {
    addWallBox(buckets, masonryMat, edgeSolidRight, height, wallThick, span * 0.5 - edgeSolidRight * 0.5, height * 0.5, -wallThick * 0.5, origin, yaw, { groundY });
  }

  for (let fl = 0; fl < floors; fl += 1) {
    const flY = fl * floorH;
    const winH = Math.max(0.95, floorH - sillH - headH);
    const winMidY = flY + sillH + winH * 0.5;

    if (sillH > 0.08) {
      addWallBox(buckets, masonryMat, openSpan, sillH, wallThick, (edgeSolidLeft - edgeSolidRight) * 0.5, flY + sillH * 0.5, -wallThick * 0.5, origin, yaw, { groundY });
    }
    if (headH > 0.08) {
      addWallBox(buckets, masonryMat, openSpan, headH, wallThick, (edgeSolidLeft - edgeSolidRight) * 0.5, flY + floorH - headH * 0.5, -wallThick * 0.5, origin, yaw, { groundY });
    }

    // Recessed glazing cavity set deeply back inside wall opening
    addWallBox(buckets, 'RecessedCavityGlass', openSpan - 0.16, winH + 0.1, 0.08, (edgeSolidLeft - edgeSolidRight) * 0.5, winMidY, -revealDepth, origin, yaw, { groundY, aoMin: 0.78 });

    if (includeInteriorBackwall) {
      addWallBox(buckets, 'WarmAtriumInterior', openSpan - 0.24, winH * 0.7, 0.06, (edgeSolidLeft - edgeSolidRight) * 0.5, winMidY + 0.08, -revealDepth - 0.16, origin, yaw, { groundY, aoMin: 0.88 });
    }

    for (let b = 0; b < bays; b += 1) {
      const bayCenterX = xStart + edgeSolidLeft + (b + 0.5) * bayW;
      const pierLeftX = bayCenterX - bayW * 0.5 + pierW * 0.25;
      const pierRightX = bayCenterX + bayW * 0.5 - pierW * 0.25;

      // Full-depth white stucco window piers revealing deep inner side jamb walls (`yt_solomon_max.jpg`!)
      addWallBox(buckets, masonryMat, pierW * 0.5, winH, wallThick, pierLeftX, winMidY, -wallThick * 0.5, origin, yaw, { groundY });
      addWallBox(buckets, masonryMat, pierW * 0.5, winH, wallThick, pierRightX, winMidY, -wallThick * 0.5, origin, yaw, { groundY });

      for (let m = 1; m <= mullionsPerBay; m += 1) {
        const mx = bayCenterX - winW * 0.5 + (m / (mullionsPerBay + 1)) * winW;
        addWallBox(buckets, 'DarkAnodizedSteel', 0.07, winH, 0.1, mx, winMidY, -revealDepth + 0.08, origin, yaw, { groundY });
      }

      // Projecting sill lip + chajja sun-hood brow
      addWallBox(buckets, trimMat, winW + 0.18, 0.09, 0.16, bayCenterX, flY + sillH - 0.02, 0.04, origin, yaw, { groundY });
      if (chajjaDepth > 0.06) {
        addWallBox(buckets, masonryMat, winW + 0.26, 0.11, chajjaDepth, bayCenterX, flY + sillH + winH + 0.06, chajjaDepth * 0.44, origin, yaw, { groundY, soffitDark: 0.6 });
      }

      // Split AC outdoor compressor units on steel brackets (`yt_solomon_max.jpg` courtyard detail!)
      if (includeACUnits && fl > 0 && b % 3 === 1) {
        addWallBox(buckets, 'ConcreteMuted', 0.78, 0.54, 0.34, bayCenterX + winW * 0.22, flY + 0.54, 0.18, origin, yaw, { groundY });
      }
    }
    // Single continuous horizontal dark frame transom & head/sill trim per floor (cuts box/tri overhead 3x!)
    if (mullionsPerBay > 0) {
      addWallBox(buckets, 'DarkAnodizedSteel', openSpan - 0.2, 0.06, 0.1, (edgeSolidLeft - edgeSolidRight) * 0.5, flY + sillH + winH * 0.68, -revealDepth + 0.08, origin, yaw, { groundY });
    }
  }
}

export function buildCurtainBayAssembly({
  buckets,
  origin,
  yaw = 0,
  span = 36,
  height = 3.8,
  glassInset = 0.24,
  mullionSpacing = 2.05,
  transomRows = 3,
  glassMat = 'CurtainGlass',
  mullionMat = 'DarkAnodizedSteel',
  spandrelBands = false,
  spandrelMat = 'TerracottaMetallic',
  floorH = 3.55,
  groundY = 0
}) {
  addWallBox(buckets, glassMat, span, height, 0.1, 0, height * 0.5, -glassInset, origin, yaw, { groundY, aoMin: 0.9 });

  const cols = Math.max(2, Math.round(span / mullionSpacing));
  for (let c = 0; c <= cols; c += 1) {
    const mx = -span * 0.5 + (c / cols) * span;
    addWallBox(buckets, mullionMat, 0.09, height, 0.24, mx, height * 0.5, -glassInset + 0.11, origin, yaw, { groundY });
  }
  for (let r = 0; r <= transomRows; r += 1) {
    const ty = Math.max(0.05, Math.min(height - 0.05, (r / transomRows) * height));
    addWallBox(buckets, mullionMat, span + 0.08, 0.09, 0.22, 0, ty, -glassInset + 0.1, origin, yaw, { groundY });
  }

  if (spandrelBands) {
    const numF = Math.max(1, Math.round(height / floorH));
    for (let fl = 1; fl < numF; fl += 1) {
      addWallBox(buckets, spandrelMat, span - 0.1, 0.62, 0.18, 0, fl * floorH, -glassInset + 0.05, origin, yaw, { groundY });
    }
  }
}

/**
 * Physical Covered Ground Colonnade Arcade (`klufl_04_cse.jpg` on C Block, M Block, Arts Block).
 * Places recessed dark corridor walls & classroom entry glazing `-2.2m` behind structural portico piers!
 */
export function buildGroundColonnadeSegment({
  buckets,
  origin,
  yaw = 0,
  span = 30,
  height = 3.8,
  colDepth = 2.2,
  colSpacing = 4.8,
  colMat = 'StuccoWhite',
  groundY = 0
}) {
  // Recessed ground corridor backing wall with spaced classroom doorways
  addWallBox(buckets, 'StuccoWarmTrim', span - 0.4, height, 0.3, 0, height * 0.5, -colDepth, origin, yaw, { groundY, innerTint: 0.68 });
  const bayCount = Math.max(2, Math.round(span / colSpacing));
  for (let b = 0; b < bayCount; b += 1) {
    const bx = -span * 0.5 + (b + 0.5) * (span / bayCount);
    if (b % 2 === 0) {
      addWallBox(buckets, 'RecessedCavityGlass', 1.8, height * 0.68, 0.08, bx, height * 0.36, -colDepth + 0.18, origin, yaw, { groundY });
    }
  }

  // Outer colonnade perimeter square structural columns & overhanging fascia soffit slab
  const colCount = bayCount + 1;
  for (let c = 0; c < colCount; c += 1) {
    const cx = -span * 0.5 + (c / bayCount) * span;
    addWallBox(buckets, colMat, 0.54, height, 0.54, cx, height * 0.5, -0.32, origin, yaw, { groundY });
  }
  addWallBox(buckets, colMat, span + 0.3, 0.42, colDepth + 0.35, 0, height - 0.21, -colDepth * 0.48, origin, yaw, { groundY, soffitDark: 0.6 });
}

function pointInLocalPolyXZ(px, pz, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i, i += 1) {
    const xi = poly[i][0];
    const zi = poly[i][1];
    const xj = poly[j][0];
    const zj = poly[j][1];
    const intersect = (zi > pz) !== (zj > pz) && px < ((xj - xi) * (pz - zi)) / (zj - zi + 1e-9) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function isBoxOnRoofPolygon(cx, cz, bw, bd, polyPts, roofHoles = []) {
  if (!polyPts || polyPts.length < 3) return true;
  const hw = bw * 0.5;
  const hd = bd * 0.5;
  const samples = [
    [cx, cz],
    [cx - hw, cz - hd],
    [cx + hw, cz - hd],
    [cx + hw, cz + hd],
    [cx - hw, cz + hd]
  ];
  for (let s = 0; s < samples.length; s += 1) {
    const [sx, sz] = samples[s];
    if (!pointInLocalPolyXZ(sx, sz, polyPts)) return false;
    for (let h = 0; h < roofHoles.length; h += 1) {
      if (roofHoles[h]?.length >= 3 && pointInLocalPolyXZ(sx, sz, roofHoles[h])) return false;
    }
  }
  return true;
}

function findSafeRoofSpot(prefX, prefZ, bw, bd, polyPts, roofHoles, spanW, spanD) {
  if (isBoxOnRoofPolygon(prefX, prefZ, bw, bd, polyPts, roofHoles)) return [prefX, prefZ];
  let best = null;
  let bestD = Infinity;
  for (let gx = -4; gx <= 4; gx += 1) {
    for (let gz = -4; gz <= 4; gz += 1) {
      const cx = (gx / 5) * (spanW * 0.44);
      const cz = (gz / 5) * (spanD * 0.44);
      if (isBoxOnRoofPolygon(cx, cz, bw, bd, polyPts, roofHoles)) {
        const d = Math.hypot(cx - prefX, cz - prefZ);
        if (d < bestD) {
          bestD = d;
          best = [cx, cz];
        }
      }
    }
  }
  return best;
}

/**
 * Physical Rooftop Kit: perimeter coping parapets, bulkhead penthouse core, water tanks, HVAC units & angled PV arrays.
 * When `polyPts` is provided, every unit checks polygon containment so nothing ever hovers over L/U courtyards.
 */
export function buildRooftopEquipmentAssembly({
  buckets,
  w,
  d,
  roofY,
  parapetH = 0.72,
  includeSkylight = false,
  solarRows = 3,
  highDetail = true,
  polyPts = null,
  roofHoles = []
}) {
  if (parapetH > 0.08) {
    const pThick = 0.34;
    addWallBox(buckets, 'StuccoWhite', w, parapetH, pThick, 0, parapetH * 0.5, -d * 0.5 + pThick * 0.5, [0, roofY, 0], 0, { groundY: roofY, aoMin: 0.82 });
    addWallBox(buckets, 'StuccoWhite', w, parapetH, pThick, 0, parapetH * 0.5, d * 0.5 - pThick * 0.5, [0, roofY, 0], 0, { groundY: roofY, aoMin: 0.82 });
    addWallBox(buckets, 'StuccoWhite', pThick, parapetH, d - pThick * 2, -w * 0.5 + pThick * 0.5, parapetH * 0.5, 0, [0, roofY, 0], 0, { groundY: roofY, aoMin: 0.82 });
    addWallBox(buckets, 'StuccoWhite', pThick, parapetH, d - pThick * 2, w * 0.5 - pThick * 0.5, parapetH * 0.5, 0, [0, roofY, 0], 0, { groundY: roofY, aoMin: 0.82 });

    addWallBox(buckets, 'DarkAnodizedSteel', w + 0.14, 0.09, pThick + 0.12, 0, parapetH + 0.04, -d * 0.5 + pThick * 0.5, [0, roofY, 0], 0, { groundY: roofY });
    addWallBox(buckets, 'DarkAnodizedSteel', w + 0.14, 0.09, pThick + 0.12, 0, parapetH + 0.04, d * 0.5 - pThick * 0.5, [0, roofY, 0], 0, { groundY: roofY });
    addWallBox(buckets, 'DarkAnodizedSteel', pThick + 0.12, 0.09, d, -w * 0.5 + pThick * 0.5, parapetH + 0.04, 0, [0, roofY, 0], 0, { groundY: roofY });
    addWallBox(buckets, 'DarkAnodizedSteel', pThick + 0.12, 0.09, d, w * 0.5 - pThick * 0.5, parapetH + 0.04, 0, [0, roofY, 0], 0, { groundY: roofY });
  }

  if (includeSkylight) {
    const skyW = w * 0.34;
    const skyD = d * 0.34;
    addWallBox(buckets, 'StuccoWarmTrim', skyW, 0.78, skyD, 0, 0.39, 0, [0, roofY, 0], 0, { groundY: roofY, aoMin: 0.75 });
    addWallBox(buckets, 'CurtainGlass', skyW - 0.7, 0.32, skyD - 0.7, 0, 0.9, 0, [0, roofY, 0], 0, { groundY: roofY });
    if (highDetail) {
      for (let m = -2; m <= 2; m += 1) {
        addWallBox(buckets, 'DarkAnodizedSteel', 0.14, 0.38, skyD - 0.6, (m / 2.5) * (skyW * 0.45), 0.94, 0, [0, roofY, 0], 0, { groundY: roofY });
      }
    }
  }

  if (w > 18 && d > 16) {
    const bw = Math.min(7.4, w * 0.16);
    const bd = Math.min(6.2, d * 0.16);
    const spot = findSafeRoofSpot(w * 0.22, -d * 0.24, bw + 0.6, bd + 0.6, polyPts, roofHoles, w, d);
    if (spot) {
      addWallBox(buckets, 'StuccoWhite', bw, 2.75, bd, spot[0], 1.38, spot[1], [0, roofY, 0], 0, { groundY: roofY, aoMin: 0.74 });
      addWallBox(buckets, 'StuccoWarmTrim', bw + 0.4, 0.22, bd + 0.4, spot[0], 2.86, spot[1], [0, roofY, 0], 0, { groundY: roofY });
    }
  }

  const hvacN = highDetail ? 3 : 1;
  if (w > 18) {
    for (let i = 0; i < hvacN; i += 1) {
      const spot = findSafeRoofSpot(w * 0.18 - i * 3.4, d * 0.22, 2.6, 1.7, polyPts, roofHoles, w, d);
      if (!spot) continue;
      addWallBox(buckets, 'RoofSlabConcrete', 2.4, 1.15, 1.5, spot[0], 0.58, spot[1], [0, roofY, 0], 0, { groundY: roofY, aoMin: 0.75 });
      if (highDetail) {
        addWallBox(buckets, 'DarkAnodizedSteel', 0.9, 0.12, 0.9, spot[0] - 0.5, 1.18, spot[1], [0, roofY, 0], 0, { groundY: roofY });
        addWallBox(buckets, 'DarkAnodizedSteel', 0.9, 0.12, 0.9, spot[0] + 0.5, 1.18, spot[1], [0, roofY, 0], 0, { groundY: roofY });
      }
    }
  }

  if (highDetail && w > 22 && d > 18) {
    const tankBase = findSafeRoofSpot(w * 0.25, d * 0.06, 2.4, 5.2, polyPts, roofHoles, w, d);
    if (tankBase) {
      [-1.4, 1.4].forEach((tz) => {
        const tank = new THREE.CylinderGeometry(1.05, 1.05, 1.95, 12);
        tank.translate(tankBase[0], roofY + 0.98, tankBase[1] + tz);
        applyBoxWorldUVsAndAO(tank, { groundY: roofY, aoMin: 0.74 });
        buckets.StuccoWarmTrim.push(tank);
      });
    }
  }

  if (solarRows > 0 && w > 24 && d > 18) {
    const panelW = Math.min(24, w * 0.32);
    const panelX = -w * 0.22;
    for (let r = 0; r < solarRows; r += 1) {
      const pz = -d * 0.25 + r * Math.min(6.2, d * 0.16);
      const pvSpot = isBoxOnRoofPolygon(panelX, pz, panelW, 2.6, polyPts, roofHoles)
        ? [panelX, pz]
        : findSafeRoofSpot(panelX, pz, panelW * 0.65, 2.6, polyPts, roofHoles, w, d);
      if (!pvSpot) continue;
      const curW = isBoxOnRoofPolygon(pvSpot[0], pvSpot[1], panelW, 2.6, polyPts, roofHoles) ? panelW : panelW * 0.65;
      const pv = new THREE.BoxGeometry(curW, 0.08, 2.45);
      pv.rotateX(0.32);
      pv.translate(pvSpot[0], roofY + 0.95, pvSpot[1]);
      applyBoxWorldUVsAndAO(pv, { uScale: 6, vScale: 2.5, groundY: roofY });
      buckets.SolarPV.push(pv);

      if (highDetail) {
        [-curW * 0.36, 0, curW * 0.36].forEach((lx) => {
          addWallBox(buckets, 'BrushedSteel', 0.14, 0.92, 0.14, pvSpot[0] + lx, roofY + 0.46, pvSpot[1], [0, 0, 0], 0, { groundY: roofY });
        });
      }
    }
  }
}

/**
 * Polygon-Conforming Academic Facade Assembler:
 * Wraps the EXACT multi-wing OSM polygon (`pts` + `holes`) in genuine 3D recessed window bays,
 * optional ground colonnades, penthouse ribbons, horizontal slab cornices, rooftop core & PV arrays!
 */
export function buildPolygonSegmentedAcademicBuilding({
  localPoly,
  height,
  floors,
  groundColonnade = false,
  topCurtainFloor = false,
  doubleCurtainPodium = false,
  pilasterRibs = false,
  includeACUnits = true,
  includeSolar = true,
  highDetail = true,
  wallMat = 'StuccoWhite',
  facadeType = 'punched', // 'punched' | 'curtainBriseSoleil'
  buckets
}) {
  const pts = cleanPolyEdges(localPoly, 2.2);
  const fH = height / floors;
  const insetCorePts = insetPolyLocalXZ(pts, 0.72);

  // Ground Podium OR Ground Colonnade OR Regular Floors
  let wallStartY = 0;
  let upperFloors = floors;

  if (doubleCurtainPodium && floors >= 4) {
    wallStartY = fH * 2.0;
    upperFloors = floors - 2;
  } else if (groundColonnade && floors >= 3) {
    wallStartY = fH;
    upperFloors = floors - 1;
  }
  if (topCurtainFloor && upperFloors >= 2) {
    upperFloors -= 1;
  }
  const upperWallH = upperFloors * fH;

  // Inner solid structural concrete mass: pull ground floor inward (`2.28m`) for open walk-through colonnade arcades!
  if (groundColonnade && wallStartY > 0.5 && facadeType !== 'curtainBriseSoleil') {
    const colonnadeCorePts = insetPolyLocalXZ(pts, 2.28);
    let colArea = 0;
    for (let i = 0; i < colonnadeCorePts.length; i += 1) {
      const a = colonnadeCorePts[i];
      const b = colonnadeCorePts[(i + 1) % colonnadeCorePts.length];
      colArea += a[0] * b[1] - b[0] * a[1];
    }
    const groundCore = colArea < -40 ? colonnadeCorePts : insetCorePts;
    addPolygonExtrusion(buckets, groundCore, wallStartY, 0, 'StuccoWarmTrim', 'StuccoWarmTrim', { aoMin: 0.65 });
    addPolygonExtrusion(buckets, insetCorePts, height - wallStartY - 0.25, wallStartY, 'RoofSlabConcrete', wallMat, { aoMin: 0.72 });
  } else {
    addPolygonExtrusion(buckets, insetCorePts, height - 0.25, 0, 'RoofSlabConcrete', wallMat, { aoMin: 0.72 });
  }

  // Iterate true polygon edges aligned cleanly with outward normals
  for (let i = 0; i < pts.length; i += 1) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    const dx = b[0] - a[0];
    const dz = b[1] - a[1];
    const segLen = Math.hypot(dx, dz);
    if (segLen < 2.2) continue;

    // Outward normal for CCW polygon in (x, z) is (-dz, dx); Three.js Box +Z rotated by yaw -> (sin(yaw), cos(yaw))
    const yaw = Math.atan2(-dz, dx);
    const mid = [(a[0] + b[0]) * 0.5, 0, (a[1] + b[1]) * 0.5];

    if (facadeType === 'curtainBriseSoleil') {
      buildCurtainBayAssembly({
        buckets,
        origin: mid,
        yaw,
        span: segLen + 0.15,
        height: height - 0.3,
        glassInset: 0.35,
        mullionSpacing: highDetail ? 2.4 : 4.8,
        transomRows: floors * (highDetail ? 2 : 1),
        groundY: 0
      });
      // Bold projecting white concrete floor brise-soleil rings (`SDC Block`)
      for (let fl = 1; fl <= floors; fl += 1) {
        addWallBox(buckets, wallMat, segLen + 0.9, 0.34, 0.85, 0, fl * fH - 0.17, 0.15, mid, yaw, { groundY: 0, soffitDark: 0.62 });
      }
      continue;
    }

    // 1. Ground Floor Zone (`Double Curtain Podium` / `Colonnade` / `Punched`)
    if (doubleCurtainPodium && wallStartY > 0) {
      buildCurtainBayAssembly({
        buckets,
        origin: mid,
        yaw,
        span: Math.max(1.2, segLen - 0.8),
        height: wallStartY,
        glassInset: 0.32,
        mullionSpacing: highDetail ? 2.3 : 4.6,
        transomRows: 2,
        groundY: 0
      });
      addWallBox(buckets, wallMat, 0.72, wallStartY, 0.62, -segLen * 0.5 + 0.36, wallStartY * 0.5, -0.25, mid, yaw, { groundY: 0 });
      addWallBox(buckets, wallMat, 0.72, wallStartY, 0.62, segLen * 0.5 - 0.36, wallStartY * 0.5, -0.25, mid, yaw, { groundY: 0 });
    } else if (groundColonnade && wallStartY > 0 && segLen > 6.5) {
      buildGroundColonnadeSegment({
        buckets,
        origin: mid,
        yaw,
        span: segLen,
        height: wallStartY,
        colMat: wallMat,
        groundY: 0
      });
    } else if (wallStartY > 0) {
      // Short edges inside colonnade mode get solid masonry cheek
      addWallBox(buckets, wallMat, segLen + 0.2, wallStartY, 0.62, 0, wallStartY * 0.5, -0.31, mid, yaw, { groundY: 0 });
    }

    // 2. Main Recessed Punched-Window Masonry Wings (`C Block`, `FED`, `M Block`, `Arts`, `SKC`)
    if (segLen >= 5.6 && upperFloors >= 1) {
      if (highDetail) {
        const bayCount = Math.max(1, Math.floor((segLen - 1.6) / 4.6));
        buildRecessedWindowWall({
          buckets,
          origin: [mid[0], wallStartY, mid[2]],
          yaw,
          span: segLen + 0.1,
          height: upperWallH,
          wallThick: 0.66,
          bays: bayCount,
          floors: upperFloors,
          edgeSolidLeft: Math.min(1.6, segLen * 0.14),
          edgeSolidRight: Math.min(1.6, segLen * 0.14),
          sillH: 0.84,
          headH: 0.46,
          revealDepth: 0.58,
          chajjaDepth: 0.3,
          mullionsPerBay: 1,
          includeACUnits: includeACUnits && segLen > 14,
          masonryMat: wallMat,
          includeInteriorBackwall: true,
          groundY: 0
        });
      } else {
        // LOD1 aerial facade (>240m): lightweight recessed continuous window slot per floor + white spandrel strips
        for (let fl = 0; fl < upperFloors; fl += 1) {
          addWallBox(buckets, wallMat, segLen + 0.12, fH * 0.38, 0.52, 0, wallStartY + fl * fH + fH * 0.19, -0.26, mid, yaw, { groundY: 0 });
          addWallBox(buckets, 'RecessedCavityGlass', segLen - 1.4, fH * 0.62, 0.12, 0, wallStartY + fl * fH + fH * 0.69, -0.45, mid, yaw, { groundY: 0 });
        }
        addWallBox(buckets, wallMat, 1.0, upperWallH, 0.55, -segLen * 0.5 + 0.5, wallStartY + upperWallH * 0.5, -0.27, mid, yaw, { groundY: 0 });
        addWallBox(buckets, wallMat, 1.0, upperWallH, 0.55, segLen * 0.5 - 0.5, wallStartY + upperWallH * 0.5, -0.27, mid, yaw, { groundY: 0 });
      }

      // Vertical architectural fin blades (`FED Block`)
      if (pilasterRibs && highDetail) {
        const ribCount = Math.max(1, Math.floor(segLen / 5.4));
        for (let r = 0; r <= ribCount; r += 1) {
          const rx = -segLen * 0.5 + (r / ribCount) * segLen;
          addWallBox(buckets, wallMat, 0.36, upperWallH, 0.52, rx, wallStartY + upperWallH * 0.5, 0.16, mid, yaw, { groundY: 0 });
        }
      }
    } else if (upperFloors >= 1) {
      addWallBox(buckets, wallMat, segLen + 0.15, upperWallH, 0.64, 0, wallStartY + upperWallH * 0.5, -0.32, mid, yaw, { groundY: 0 });
    }

    // 3. Top Continuous Glazed Penthouse Gallery Band (`C Block` Level 6!)
    const topBandStart = wallStartY + upperWallH;
    if (topCurtainFloor && height - topBandStart > 1.8) {
      const bandH = height - topBandStart - 0.35;
      if (segLen > 5.4) {
        buildCurtainBayAssembly({
          buckets,
          origin: [mid[0], topBandStart, mid[2]],
          yaw,
          span: segLen - 1.2,
          height: bandH,
          glassInset: 0.28,
          mullionSpacing: highDetail ? 2.4 : 4.8,
          transomRows: 1,
          groundY: 0
        });
        addWallBox(buckets, wallMat, 0.85, bandH, 0.58, -segLen * 0.5 + 0.42, topBandStart + bandH * 0.5, -0.25, mid, yaw, { groundY: 0 });
        addWallBox(buckets, wallMat, 0.85, bandH, 0.58, segLen * 0.5 - 0.42, topBandStart + bandH * 0.5, -0.25, mid, yaw, { groundY: 0 });
      } else {
        addWallBox(buckets, wallMat, segLen + 0.15, bandH, 0.62, 0, topBandStart + bandH * 0.5, -0.31, mid, yaw, { groundY: 0 });
      }
    }

    // Roof Fascia Overhang Cornice Ring
    addWallBox(buckets, wallMat, segLen + 0.45, 0.46, 0.72, 0, height - 0.18, -0.04, mid, yaw, { groundY: 0, soffitDark: 0.62 });
  }

  // Exact polygon-shaped top parapet wall coping & rooftop equipment (`buildPolygonExtruded` cap + equipment!)
  const parapetOuter = insetPolyLocalXZ(pts, 0.02);
  const parapetInner = insetPolyLocalXZ(pts, 0.42);
  if (parapetInner.length >= 3) {
    addPolygonExtrusion(buckets, parapetOuter, 0.65, height - 0.05, 'DarkAnodizedSteel', wallMat, { holes: [parapetInner], aoMin: 0.85 });
  }

  // Estimate span inside bounding polygon for centered rooftop core + PV rows
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  pts.forEach(([x, z]) => {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (z < minZ) minZ = z;
    if (z > maxZ) maxZ = z;
  });
  buildRooftopEquipmentAssembly({
    buckets,
    w: (maxX - minX) * 0.85,
    d: (maxZ - minZ) * 0.85,
    roofY: height,
    parapetH: 0.01,
    includeSkylight: false,
    solarRows: includeSolar ? (highDetail ? 3 : 2) : 0,
    highDetail,
    polyPts: insetPolyLocalXZ(pts, 1.4)
  });
}

/**
 * True Hollow Multi-Story Hostel Complex Assembler (`tulip.jpg`, `himalaya.jpg`, `lotus.jpg`, `kgh.jpg`, `aravali.png`).
 * Models an inset residential room core encircled by genuine overhanging concrete balcony decks,
 * party-wall fins, dark sliding doors, continuous perimeter railings, and distinct roof trusses/solar roofs!
 */
export function buildPolygonBalconyHostel({
  localPoly,
  holes = [],
  height,
  floors,
  podiumFloors = 0,
  podiumMat = 'CurtainGlass',
  balconyInset = 1.05,
  railMat = 'DarkAnodizedSteel',
  staggeredAquaPanels = false,
  roofPergolaBeams = false,
  roofTrussCrown = false,
  cornerAccentMat = null,
  verticalSlotOffsets = [], // e.g. KGH purple stair slits or Aravali open elevator slot
  includeSolar = true,
  highDetail = true,
  buckets
}) {
  const pts = cleanPolyEdges(localPoly, 2.2);
  const fH = height / floors;
  const podiumH = podiumFloors * fH;

  // Inner Suite Room Core (`inset +1.05m` cleanly inside balconies)
  const suiteCorePts = insetPolyLocalXZ(pts, balconyInset);
  const coreH = height - podiumH - 0.15;
  addPolygonExtrusion(buckets, suiteCorePts, coreH, podiumH, 'RoofSlabConcrete', 'StuccoWarmTrim', { holes, aoMin: 0.72 });

  // Double-Height Podium Base (if `Tulip` glass lobby or `Lotus` terracotta-glass podium)
  if (podiumH > 0.5) {
    const podPts = insetPolyLocalXZ(pts, 0.35);
    addPolygonExtrusion(buckets, podPts, podiumH, 0, 'StuccoWarmTrim', podiumMat, { holes, aoMin: 0.74 });
    // Continuous storefront mullions along podium edges
    for (let i = 0; i < pts.length; i += 1) {
      const a = pts[i];
      const b = pts[(i + 1) % pts.length];
      const dx = b[0] - a[0];
      const dz = b[1] - a[1];
      const segLen = Math.hypot(dx, dz);
      if (segLen < 3.5) continue;
      const yaw = Math.atan2(-dz, dx);
      const mid = [(a[0] + b[0]) * 0.5, 0, (a[1] + b[1]) * 0.5];
      buildCurtainBayAssembly({
        buckets,
        origin: mid,
        yaw,
        span: segLen - 1.4,
        height: podiumH - 0.25,
        glassInset: 0.38,
        mullionSpacing: highDetail ? 3.2 : 6.4,
        transomRows: podiumFloors,
        glassMat: podiumMat === 'TerracottaBrick' ? 'CurtainGlass' : podiumMat,
        groundY: 0
      });
    }
  }

  // Hollow Balcony Decks & Physical Tubular Guardrails on every upper floor (`podiumFloors+1 .. floors`)
  const balcFloorMin = Math.max(1, podiumFloors + 1);
  const upperFloors = Math.max(1, floors - podiumFloors);

  // Perimeter balcony slab rings (LOD0 builds individual floor rings, LOD1 merges 2-floor intervals cleanly)
  const slabStep = highDetail ? 1 : 2;
  for (let fl = balcFloorMin; fl <= floors; fl += slabStep) {
    const sy = Math.min(height, fl * fH);
    const slabH = 0.22;
    // Hollow ring strictly between outer `pts` and inner `suiteCorePts` -> physical overhanging balcony shelf!
    addPolygonExtrusion(buckets, pts, slabH, sy - slabH, 'StuccoWhite', 'StuccoWhite', { holes: [suiteCorePts], aoMin: 0.75 });
  }

  // Edge assembly: dark inner room doorway windows + party divider blades + guardrails per floor!
  for (let i = 0; i < pts.length; i += 1) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    const dx = b[0] - a[0];
    const dz = b[1] - a[1];
    const segLen = Math.hypot(dx, dz);
    if (segLen < 3.0) continue;

    const yaw = Math.atan2(-dz, dx);
    const mid = [(a[0] + b[0]) * 0.5, 0, (a[1] + b[1]) * 0.5];

    // Structural wing divider pilasters along exterior balcony corners & bay modules (`~5.2m`)
    const baySpan = highDetail ? 5.2 : 10.4;
    const bayCount = Math.max(1, Math.round((segLen - 1.6) / baySpan));
    const startWallY = podiumH;
    const towerWallH = height - startWallY;

    for (let k = 0; k <= bayCount; k += 1) {
      const bx = -segLen * 0.5 + 0.6 + (k / bayCount) * Math.max(0.5, segLen - 1.2);
      const isCorner = k === 0 || k === bayCount;
      const finMat = isCorner && cornerAccentMat ? cornerAccentMat : 'StuccoWhite';
      addWallBox(buckets, finMat, isCorner ? 0.68 : 0.34, towerWallH, balconyInset, bx, startWallY + towerWallH * 0.5, -balconyInset * 0.48, mid, yaw, { groundY: 0 });
    }

    // Physical Balcony Railings + Inner Room Glazed Sliding Doors per floor
    for (let fl = 0; fl < upperFloors; fl += slabStep) {
      const flY = startWallY + fl * fH;
      const railTopY = flY + 1.06;

      // Dark sliding glass door openings punched into recessed suite core wall (`-balconyInset`)
      for (let bk = 0; bk < bayCount; bk += 1) {
        const doorX = -segLen * 0.5 + 0.6 + ((bk + 0.5) / bayCount) * Math.max(0.5, segLen - 1.2);
        const doorW = Math.min(2.6, (segLen / bayCount) * 0.54);
        addWallBox(buckets, 'RecessedCavityGlass', doorW, fH * 0.72, 0.08, doorX, flY + fH * 0.42, -balconyInset + 0.04, mid, yaw, { groundY: 0 });
      }

      // Physical guardrail bar & intermediate balustrade
      if (staggeredAquaPanels && fl % 2 === 1) {
        addWallBox(buckets, 'AquaBalconyGlass', segLen - 1.2, 0.92, 0.06, 0, flY + 0.56, -0.06, mid, yaw, { groundY: 0 });
      } else {
        addWallBox(buckets, railMat, segLen - 0.8, 0.06, 0.07, 0, railTopY, -0.06, mid, yaw, { groundY: 0 });
        if (highDetail) {
          addWallBox(buckets, railMat, segLen - 0.8, 0.045, 0.05, 0, flY + 0.52, -0.06, mid, yaw, { groundY: 0 });
        }
      }
    }
  }

  // Optional vertical stairwell slots (KGH vertical purple shafts or Tulip wing stair blades)
  verticalSlotOffsets.forEach(({ lx, lz, w, d, extraH = 1.4, matKey = 'PurpleCore' }) => {
    addWallBox(buckets, matKey, w, height + extraH, d, lx, (height + extraH) * 0.5, lz, [0, 0, 0], 0, { groundY: 0 });
  });

  // Compute bounds for rooftop solar, tanks & optional KGH/Lotus pergola/truss crowns
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  pts.forEach(([x, z]) => {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (z < minZ) minZ = z;
    if (z > maxZ) maxZ = z;
  });
  const spanW = maxX - minX;
  const spanD = maxZ - minZ;

  // Perimeter concrete parapet roof cap
  const parapetInner = insetPolyLocalXZ(pts, 0.45);
  addPolygonExtrusion(buckets, pts, 0.75, height, 'DarkAnodizedSteel', 'StuccoWhite', { holes: [parapetInner], aoMin: 0.85 });

  if (roofPergolaBeams) {
    // Signature KGH overhead perimeter beam pergola grid (`kgh.jpg`)
    for (let b = -3; b <= 3; b += 1) {
      addWallBox(buckets, 'StuccoWhite', 0.58, 0.55, spanD * 0.88, b * (spanW * 0.11), height + 1.25, 0, [0, 0, 0], 0, { groundY: height });
    }
    addWallBox(buckets, 'StuccoWhite', spanW * 0.9, 0.45, 0.58, 0, height + 1.25, -spanD * 0.42, [0, 0, 0], 0, { groundY: height });
    addWallBox(buckets, 'StuccoWhite', spanW * 0.9, 0.45, 0.58, 0, height + 1.25, spanD * 0.42, [0, 0, 0], 0, { groundY: height });
  }

  if (roofTrussCrown) {
    // Lotus 12F Open Perimeter Steel Spaceframe Truss Crown (`lotus.jpg` — keeps inner rooftop solar arrays exposed cleanly!)
    [-spanD * 0.39, 0, spanD * 0.39].forEach((tz) => {
      addWallBox(buckets, 'CharcoalPrecast', spanW * 0.84, 0.42, 0.56, 0, height + 2.2, tz, [0, 0, 0], 0, { groundY: height });
    });
    [-spanW * 0.39, 0, spanW * 0.39].forEach((tx) => {
      addWallBox(buckets, 'CharcoalPrecast', 0.56, 0.42, spanD * 0.84, tx, height + 2.2, 0, [0, 0, 0], 0, { groundY: height });
    });
    [-spanW * 0.38, 0, spanW * 0.38].forEach((px) => {
      [-spanD * 0.38, spanD * 0.38].forEach((pz) => {
        addWallBox(buckets, 'CharcoalPrecast', 0.75, 2.35, 0.75, px, height + 1.18, pz, [0, 0, 0], 0, { groundY: height });
      });
    });
  }

  buildRooftopEquipmentAssembly({
    buckets,
    w: spanW * 0.84,
    d: spanD * 0.84,
    roofY: height,
    parapetH: 0.01,
    includeSkylight: false,
    solarRows: includeSolar ? (highDetail ? 4 : 2) : 0,
    highDetail,
    polyPts: insetPolyLocalXZ(pts, 1.4),
    roofHoles: holes
  });
}

/**
 * Generates the Central Library (L-Block) Benchmark Model (`library01.jpg`, `lib_slider2.jpg`, `klu_sat_core_zoom.jpg`).
 */
export function buildCentralLibraryBenchmarkRoot() {
  const root = new THREE.Group();
  root.name = 'CentralLibrary_Benchmark';

  const W = 49.09;
  const D = 68.98;
  const H = 15.5;
  const plinthH = 0.72;
  const westX = -W * 0.5;
  const eastX = W * 0.5;
  const northZ = -D * 0.5;
  const southZ = D * 0.5;

  const mats = createSemanticMaterials();

  const buildDetailVariant = (highDetail) => {
    const buckets = createGeoBuckets();
    const baysCount = highDetail ? 6 : 3;

    // 1. Wide Red Granite Plinth + Compacted 3-Step Stair Terrace (`library01.jpg`, tucked tight to avoid front roadway clip!)
    addWallBox(buckets, 'RedGranite', W + 0.5, plinthH, D + 0.5, 0, plinthH * 0.5, 0, [0, 0, 0], 0, { groundY: 0, aoMin: 0.72 });
    const stairW = 22.0;
    for (let s = 0; s < 3; s += 1) {
      const sy = 0.12 + s * 0.2;
      const sx = westX - 2.1 + s * 0.65;
      addWallBox(buckets, 'RedGranite', 0.75, 0.22, stairW, sx, sy, 0, [0, 0, 0], 0, { groundY: 0, aoMin: 0.76 });
    }
    addWallBox(buckets, 'RedGranite', 2.8, plinthH, stairW + 1.0, westX - 1.3, plinthH * 0.5, 0, [0, 0, 0], 0, { groundY: 0, aoMin: 0.75 });

    // Corner Low Red-Granite Planters w/ Soil & Shrubs
    [-21.8, 21.8].forEach((pz, pSide) => {
      addWallBox(buckets, 'RedGranite', 2.4, 0.92, 16.0, westX - 1.25, 0.46, pz, [0, 0, 0], 0, { groundY: 0, aoMin: 0.72 });
      addWallBox(buckets, 'SoilBed', 2.0, 0.14, 15.4, westX - 1.25, 0.88, pz, [0, 0, 0], 0, { groundY: 0.8 });
      const tuftCount = highDetail ? 7 : 3;
      for (let t = 0; t < tuftCount; t += 1) {
        const tz = pz - 5.8 + (t / Math.max(1, tuftCount - 1)) * 11.6;
        const bush = new THREE.IcosahedronGeometry(highDetail ? 0.82 : 0.9, 1);
        bush.scale(1.12, 0.75, 1.12);
        bush.translate(westX - 1.25 + ((t % 2) - 0.5) * 0.3, 1.3, tz + pSide * 0.04);
        applyBoxWorldUVsAndAO(bush, { groundY: 0.9, aoMin: 0.55 });
        buckets.PlanterFoliage.push(bush);
      }
    });

    // 2. Visible Interior Ground Atrium & Oak Mezzanines (`lib_slider2.jpg`)
    addWallBox(buckets, 'WarmAtriumInterior', 14.0, 0.25, 42.0, westX + 7.2, plinthH + 0.08, 0, [0, 0, 0], 0, { groundY: plinthH });
    addWallBox(buckets, 'TimberFascia', 12.0, 0.48, 36.0, westX + 8.5, plinthH + 3.85, 0, [0, 0, 0], 0, { groundY: plinthH, soffitDark: 0.65 });
    addWallBox(buckets, 'TimberFascia', 12.0, 0.48, 36.0, westX + 8.5, plinthH + 7.55, 0, [0, 0, 0], 0, { groundY: plinthH, soffitDark: 0.65 });
    addWallBox(buckets, 'WarmAtriumInterior', 0.4, 8.2, 34.0, westX + 14.2, plinthH + 4.1, 0, [0, 0, 0], 0, { groundY: plinthH, aoMin: 0.85 });
    [-12, -4, 4, 12].forEach((cz) => {
      const col = new THREE.CylinderGeometry(0.32, 0.34, 8.0, highDetail ? 12 : 6);
      col.translate(westX + 5.2, plinthH + 4.0, cz);
      applyBoxWorldUVsAndAO(col, { groundY: plinthH });
      buckets.StuccoWarmTrim.push(col);
    });

    // 3. Ground Floor Curtain Glass + White Corner Framing
    const groundSpanH = 3.72;
    const cornerWingZ = 5.4;
    addWallBox(buckets, 'StuccoWhite', 3.4, groundSpanH, cornerWingZ, westX + 1.7, plinthH + groundSpanH * 0.5, northZ + cornerWingZ * 0.5, [0, 0, 0], 0, { groundY: plinthH });
    addWallBox(buckets, 'StuccoWhite', 3.4, groundSpanH, cornerWingZ, westX + 1.7, plinthH + groundSpanH * 0.5, southZ - cornerWingZ * 0.5, [0, 0, 0], 0, { groundY: plinthH });
    buildCurtainBayAssembly({
      buckets,
      origin: [westX + 0.35, plinthH, 0],
      yaw: -Math.PI * 0.5,
      span: D - cornerWingZ * 2,
      height: groundSpanH,
      glassInset: 0.26,
      mullionSpacing: highDetail ? 2.15 : 4.3,
      transomRows: highDetail ? 3 : 2,
      glassMat: 'ClearAtriumGlass',
      groundY: plinthH
    });

    // 4. Cantilevered Black-Steel & Wood-Soffit Projecting Entry Vestibule Box (`library01.jpg`)
    const vestW = 13.8;
    const vestProj = 2.85;
    const vestH = 3.65;
    [-vestW * 0.5, vestW * 0.5].forEach((vz) => {
      addWallBox(buckets, 'ClearAtriumGlass', vestProj, vestH, 0.08, westX - vestProj * 0.5, plinthH + vestH * 0.5, vz, [0, 0, 0], 0, { groundY: plinthH });
      addWallBox(buckets, 'DarkAnodizedSteel', 0.34, vestH, 0.34, westX - vestProj + 0.18, plinthH + vestH * 0.5, vz, [0, 0, 0], 0, { groundY: plinthH });
      addWallBox(buckets, 'DarkAnodizedSteel', vestProj, 0.32, 0.3, westX - vestProj * 0.5, plinthH + vestH - 0.16, vz, [0, 0, 0], 0, { groundY: plinthH });
    });
    addWallBox(buckets, 'DarkAnodizedSteel', 0.38, 0.38, vestW + 0.42, westX - vestProj + 0.16, plinthH + vestH - 0.16, 0, [0, 0, 0], 0, { groundY: plinthH });
    addWallBox(buckets, 'ClearAtriumGlass', 0.08, vestH - 0.3, vestW - 0.4, westX - vestProj + 0.36, plinthH + (vestH - 0.3) * 0.5, 0, [0, 0, 0], 0, { groundY: plinthH });
    [-3.2, 3.2].forEach((dz) => {
      addWallBox(buckets, 'DarkAnodizedSteel', 0.24, vestH - 0.3, 0.18, westX - vestProj + 0.34, plinthH + (vestH - 0.3) * 0.5, dz, [0, 0, 0], 0, { groundY: plinthH });
    });
    addWallBox(buckets, 'TimberFascia', vestProj + 0.36, 0.26, vestW - 0.24, westX - vestProj * 0.48, plinthH + vestH - 0.22, 0, [0, 0, 0], 0, { groundY: plinthH, soffitDark: 0.72 });

    // 5. Continuous Warm Timber Beam Fascia above Ground Curtain (`library01.jpg`)
    const fasciaY = plinthH + groundSpanH;
    const fasciaH = 1.18;
    addWallBox(buckets, 'TimberFascia', 0.85, fasciaH, D - 1.2, westX + 0.02, fasciaY + fasciaH * 0.5, 0, [0, 0, 0], 0, { groundY: plinthH, soffitDark: 0.62 });
    addWallBox(buckets, 'StuccoWhite', 1.4, fasciaH, 2.2, westX + 0.3, fasciaY + fasciaH * 0.5, northZ + 1.1, [0, 0, 0], 0, { groundY: plinthH });
    addWallBox(buckets, 'StuccoWhite', 1.4, fasciaH, 2.2, westX + 0.3, fasciaY + fasciaH * 0.5, southZ - 1.1, [0, 0, 0], 0, { groundY: plinthH });

    // 6. Level 1 Ribbon Window + Bright White Concrete Stucco Spandrel Fascia
    const l1BaseY = fasciaY + fasciaH;
    const l1RibH = 1.55;
    addWallBox(buckets, 'StuccoWhite', 2.4, l1RibH + 1.35, 3.4, westX + 1.2, l1BaseY + (l1RibH + 1.35) * 0.5, northZ + 1.7, [0, 0, 0], 0, { groundY: plinthH });
    addWallBox(buckets, 'StuccoWhite', 2.4, l1RibH + 1.35, 3.4, westX + 1.2, l1BaseY + (l1RibH + 1.35) * 0.5, southZ - 1.7, [0, 0, 0], 0, { groundY: plinthH });
    buildCurtainBayAssembly({
      buckets,
      origin: [westX + 0.45, l1BaseY, 0],
      yaw: -Math.PI * 0.5,
      span: D - 6.8,
      height: l1RibH,
      glassInset: 0.42,
      mullionSpacing: highDetail ? 2.4 : 4.8,
      transomRows: 1,
      glassMat: 'CurtainGlass',
      groundY: plinthH
    });
    addWallBox(buckets, 'StuccoWhite', 1.6, 1.35, D - 0.8, westX + 0.55, l1BaseY + l1RibH + 0.675, 0, [0, 0, 0], 0, { groundY: plinthH });

    // 7. Upper Levels (Levels 2 & 3) w/ Deep 0.58m White Stucco Recessed Windows
    const upperBaseY = l1BaseY + l1RibH + 1.35;
    const upperH = H - upperBaseY - 0.55;
    const centerGlassSpan = 26.0;
    const wingSpan = (D - centerGlassSpan) * 0.5;
    buildCurtainBayAssembly({
      buckets,
      origin: [westX + 0.35, upperBaseY, 0],
      yaw: -Math.PI * 0.5,
      span: centerGlassSpan,
      height: upperH,
      glassInset: 0.36,
      mullionSpacing: highDetail ? 2.6 : 5.2,
      transomRows: 2,
      glassMat: 'CurtainGlass',
      groundY: plinthH
    });
    buildRecessedWindowWall({
      buckets,
      origin: [westX + 0.15, upperBaseY, northZ + wingSpan * 0.5],
      yaw: -Math.PI * 0.5,
      span: wingSpan,
      height: upperH,
      wallThick: 0.66,
      bays: highDetail ? 3 : 2,
      floors: 2,
      edgeSolidLeft: 2.2,
      edgeSolidRight: 1.4,
      revealDepth: 0.58,
      chajjaDepth: highDetail ? 0.28 : 0,
      groundY: plinthH
    });
    buildRecessedWindowWall({
      buckets,
      origin: [westX + 0.15, upperBaseY, southZ - wingSpan * 0.5],
      yaw: -Math.PI * 0.5,
      span: wingSpan,
      height: upperH,
      wallThick: 0.66,
      bays: highDetail ? 3 : 2,
      floors: 2,
      edgeSolidLeft: 1.4,
      edgeSolidRight: 2.2,
      revealDepth: 0.58,
      chajjaDepth: highDetail ? 0.28 : 0,
      groundY: plinthH
    });

    // 8. North, South & East 360-Degree Perimeter Elevations
    const fullElevH = H - plinthH - 0.55;
    if (highDetail) {
      buildRecessedWindowWall({
        buckets,
        origin: [eastX - 0.15, plinthH, 0],
        yaw: Math.PI * 0.5,
        span: D,
        height: fullElevH,
        wallThick: 0.66,
        bays: baysCount + 3,
        floors: 4,
        edgeSolidLeft: 3.0,
        edgeSolidRight: 3.0,
        revealDepth: 0.58,
        chajjaDepth: 0.3,
        groundY: plinthH
      });
      [northZ + 0.15, southZ - 0.15].forEach((zFace, idx) => {
        buildRecessedWindowWall({
          buckets,
          origin: [0, plinthH, zFace],
          yaw: idx === 0 ? Math.PI : 0,
          span: W,
          height: fullElevH,
          wallThick: 0.66,
          bays: baysCount,
          floors: 4,
          edgeSolidLeft: 2.6,
          edgeSolidRight: 2.6,
          revealDepth: 0.58,
          chajjaDepth: 0.3,
          groundY: plinthH
        });
      });
    } else {
      buildRecessedWindowWall({
        buckets,
        origin: [eastX - 0.15, plinthH, 0],
        yaw: Math.PI * 0.5,
        span: D,
        height: fullElevH,
        bays: 2,
        floors: 2,
        edgeSolidLeft: 4.0,
        edgeSolidRight: 4.0,
        mullionsPerBay: 0,
        chajjaDepth: 0,
        includeInteriorBackwall: false,
        groundY: plinthH
      });
      [northZ + 0.15, southZ - 0.15].forEach((zFace, idx) => {
        buildRecessedWindowWall({
          buckets,
          origin: [0, plinthH, zFace],
          yaw: idx === 0 ? Math.PI : 0,
          span: W,
          height: fullElevH,
          bays: 2,
          floors: 2,
          edgeSolidLeft: 4.0,
          edgeSolidRight: 4.0,
          mullionsPerBay: 0,
          chajjaDepth: 0,
          includeInteriorBackwall: false,
          groundY: plinthH
        });
      });
    }

    // 9. Solid Inner Structural Mass + Roof Cornice + Skylight + Solar
    addWallBox(buckets, 'StuccoWhite', W - 2.6, H - plinthH - 0.6, D - 2.6, 1.2, plinthH + (H - plinthH - 0.6) * 0.5, 0, [0, 0, 0], 0, { groundY: plinthH });
    addWallBox(buckets, 'StuccoWhite', W + 0.9, 0.58, D + 0.9, 0, H - 0.25, 0, [0, 0, 0], 0, { groundY: 0, soffitDark: 0.64 });
    addWallBox(buckets, 'RoofSlabConcrete', W - 0.6, 0.16, D - 0.6, 0, H + 0.06, 0, [0, 0, 0], 0, { groundY: H });

    buildRooftopEquipmentAssembly({
      buckets,
      w: W - 0.6,
      d: D - 0.6,
      roofY: H + 0.14,
      parapetH: 0.72,
      includeSkylight: true,
      solarRows: highDetail ? 3 : 2,
      highDetail
    });

    const variantGroup = new THREE.Group();
    variantGroup.name = highDetail ? 'LOD0_High' : 'LOD1_Medium';
    Object.entries(buckets).forEach(([matKey, geoList]) => {
      if (!geoList.length) return;
      const merged = normalizeAndMergeBucket(geoList);
      if (!merged) return;
      const mesh = new THREE.Mesh(merged, mats[matKey]);
      mesh.name = `${variantGroup.name}_${matKey}`;
      mesh.castShadow = !matKey.includes('Glass') && matKey !== 'SoilBed';
      mesh.receiveShadow = true;
      variantGroup.add(mesh);
    });
    return variantGroup;
  };

  root.add(buildDetailVariant(true));
  root.add(buildDetailVariant(false));
  return root;
}

/**
 * Helper converting bucket map into two LOD variant groups inside a named building root.
 */
export function buildDualLodRootFromBuilder(name, buildFn) {
  const root = new THREE.Group();
  root.name = name;
  const mats = createSemanticMaterials();

  [true, false].forEach((highDetail) => {
    const buckets = createGeoBuckets();
    buildFn(buckets, highDetail);
    const variantGroup = new THREE.Group();
    variantGroup.name = highDetail ? 'LOD0_High' : 'LOD1_Medium';
    Object.entries(buckets).forEach(([matKey, geoList]) => {
      if (!geoList.length) return;
      const merged = normalizeAndMergeBucket(geoList);
      if (!merged) return;
      const mesh = new THREE.Mesh(merged, mats[matKey]);
      mesh.name = `${variantGroup.name}_${matKey}`;
      mesh.castShadow = !matKey.includes('Glass') && matKey !== 'SoilBed';
      mesh.receiveShadow = true;
      variantGroup.add(mesh);
    });
    root.add(variantGroup);
  });

  return root;
}
