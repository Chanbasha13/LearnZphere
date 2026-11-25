import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/**
 * Normalizes attributes across geometries (index, uv, normal, vertex color) and safely merges them.
 * Preserves multi-material groups only when merging non-grouped parts into single draw calls.
 */
export function safeMerge(geos) {
  const valid = geos.filter((g) => g && g.attributes && g.attributes.position);
  if (!valid.length) return new THREE.BufferGeometry();

  let anyColor = false;
  for (let i = 0; i < valid.length; i += 1) {
    if (valid[i].attributes.color) {
      anyColor = true;
      break;
    }
  }

  const normalized = valid.map((raw) => {
    const g = raw.index ? raw.toNonIndexed() : raw.clone();
    const posCount = g.attributes.position.count;
    if (!g.attributes.normal) {
      g.computeVertexNormals();
    }
    if (!g.attributes.uv) {
      const uvArr = new Float32Array(posCount * 2);
      g.setAttribute('uv', new THREE.BufferAttribute(uvArr, 2));
    }
    if (anyColor && !g.attributes.color) {
      const colArr = new Float32Array(posCount * 3);
      colArr.fill(1);
      g.setAttribute('color', new THREE.BufferAttribute(colArr, 3));
    }
    g.clearGroups();
    return g;
  });

  const merged = mergeGeometries(normalized, false);
  normalized.forEach((g) => g.dispose());
  return merged || new THREE.BufferGeometry();
}

/**
 * Bakes subtle ambient occlusion + ground contact + under-soffit crevice darkening into vertex colors.
 */
export function bakeArchitecturalVertexAO(geo, options = {}) {
  const {
    baseY = 0,
    height = 12,
    floorHeight = 3.55,
    groundDark = 0.66,
    soffitDark = 0.72,
    seamDark = 0.84,
    roofEdgeDark = 0.94
  } = options;

  if (!geo || !geo.attributes || !geo.attributes.position) return geo;
  const pos = geo.attributes.position;
  if (!geo.attributes.normal) geo.computeVertexNormals();
  const norm = geo.attributes.normal;
  const count = pos.count;

  const existing = geo.attributes.color;
  const colArr = existing ? existing.array : new Float32Array(count * 3);

  for (let i = 0; i < count; i += 1) {
    const y = pos.getY(i);
    const ny = norm ? norm.getY(i) : 0;
    const relY = Math.max(0, y - baseY);

    let ao = 1.0;

    // 1. Ground contact occlusion fade (0m .. 1.65m)
    if (relY < 1.65) {
      const t = relY / 1.65;
      ao *= groundDark + (1.0 - groundDark) * (t * (2 - t));
    }

    // 2. Downward overhang soffits (under canopies, beams, slabs)
    if (ny < -0.35) {
      ao *= soffitDark;
    } else if (Math.abs(ny) < 0.45 && floorHeight > 0.5) {
      // Periodic crevice shadow just under each floor's projecting slab line
      const modY = relY % floorHeight;
      if (modY > floorHeight - 0.55 && relY > 1.2) {
        const drop = 1.0 - (modY - (floorHeight - 0.55)) / 0.55;
        ao *= seamDark + (1.0 - seamDark) * drop;
      }
    }

    // 3. Subtle darkening near roof parapet joints
    if (height > 4 && Math.abs(relY - height) < 0.45 && Math.abs(ny) < 0.4) {
      ao *= roofEdgeDark;
    }

    const r = existing ? colArr[i * 3] * ao : ao;
    const g = existing ? colArr[i * 3 + 1] * ao : ao;
    const b = existing ? colArr[i * 3 + 2] * ao : ao;
    colArr[i * 3] = r;
    colArr[i * 3 + 1] = g;
    colArr[i * 3 + 2] = b;
  }

  if (!existing) {
    geo.setAttribute('color', new THREE.BufferAttribute(colArr, 3));
  } else {
    existing.needsUpdate = true;
  }
  return geo;
}

/**
 * Strips ultra-short jitter segments from raw OSM building polygons (< minLen meters).
 */
export function simplifyShortEdgesXZ(pts, minLen = 1.45) {
  if (!pts || pts.length <= 3) return pts || [];
  const cleaned = [];
  for (let i = 0; i < pts.length; i += 1) {
    const p = pts[i];
    if (!cleaned.length) {
      cleaned.push([p[0], p[1]]);
    } else {
      const prev = cleaned[cleaned.length - 1];
      if (Math.hypot(p[0] - prev[0], p[1] - prev[1]) >= minLen) {
        cleaned.push([p[0], p[1]]);
      }
    }
  }
  if (cleaned.length > 3) {
    const first = cleaned[0];
    const last = cleaned[cleaned.length - 1];
    if (Math.hypot(last[0] - first[0], last[1] - first[1]) < minLen) {
      cleaned.pop();
    }
  }
  return cleaned.length >= 3 ? cleaned : pts;
}

/**
 * Insets a closed 2D XZ polygon inward/outward using averaged miter normals clamped against self-overlap.
 */
export function insetPolygonXZ(rawPts, insetDist) {
  const pts = simplifyShortEdgesXZ(rawPts, 0.8);
  const n = pts.length;
  if (n < 3 || Math.abs(insetDist) < 1e-4) return pts.map((p) => [p[0], p[1]]);

  let area2 = 0;
  for (let i = 0; i < n; i += 1) {
    const a = pts[i];
    const b = pts[(i + 1) % n];
    area2 += a[0] * b[1] - b[0] * a[1];
  }
  const ccwSign = area2 >= 0 ? 1 : -1;

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

    const nx1 = -dz1 * ccwSign;
    const nz1 = dx1 * ccwSign;
    const nx2 = -dz2 * ccwSign;
    const nz2 = dx2 * ccwSign;

    let mx = nx1 + nx2;
    let mz = nz1 + nz2;
    const ml = Math.hypot(mx, mz);
    if (ml < 1e-4) {
      out.push([pCurr[0] + nx1 * insetDist, pCurr[1] + nz1 * insetDist]);
    } else {
      mx /= ml;
      mz /= ml;
      const cosHalf = Math.max(0.42, mx * nx1 + mz * nz1);
      const scale = Math.min(2.2, 1.0 / cosHalf);
      out.push([pCurr[0] + mx * insetDist * scale, pCurr[1] + mz * insetDist * scale]);
    }
  }
  return out;
}

/**
 * Builds a THREE.Shape in Shape-XY where Shape.x = world X and Shape.y = -world Z.
 */
export function createShapeFromXZ(pts, holesPtsList = []) {
  const shape = new THREE.Shape();
  if (!pts || pts.length < 3) return shape;
  shape.moveTo(pts[0][0], -pts[0][1]);
  for (let i = 1; i < pts.length; i += 1) {
    shape.lineTo(pts[i][0], -pts[i][1]);
  }
  shape.closePath();

  for (let h = 0; h < holesPtsList.length; h += 1) {
    const hp = holesPtsList[h];
    if (!hp || hp.length < 3) continue;
    const hole = new THREE.Path();
    hole.moveTo(hp[0][0], -hp[0][1]);
    for (let j = 1; j < hp.length; j += 1) {
      hole.lineTo(hp[j][0], -hp[j][1]);
    }
    hole.closePath();
    shape.holes.push(hole);
  }
  return shape;
}

/**
 * Extrudes an XZ polygon vertically (+Y) with floor-aligned metric facade UVs and baked vertex AO.
 * Material groups match THREE.ExtrudeGeometry: group 0 = cap/roof/floor, group 1 = perimeter walls.
 */
export function extrudeFootprintGeo(pts, height, baseY = 0, options = {}) {
  const {
    holes = [],
    bevelEnabled = false,
    bevelThickness = 0.06,
    bevelSize = 0.06,
    bevelSegments = 1,
    wallTileU = 14.0,       // horizontal meters per 4-bay texture repeat
    floorHeight = 3.55,
    floorsPerTileV = 4,     // 4 floors vertically in punchedAcademicMap & hostelLoggiaMap!
    bakeAO = true
  } = options;

  const shape = createShapeFromXZ(pts, holes);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: height,
    bevelEnabled,
    bevelThickness,
    bevelSize,
    bevelSegments,
    curveSegments: 10
  });

  // Rotate +Z extrusion upright to +Y: (x, y_shape, z_depth) -> (x, z_depth, -y_shape)
  geo.rotateX(-Math.PI / 2);
  if (baseY !== 0) {
    geo.translate(0, baseY, 0);
  }

  geo.computeVertexNormals();
  const pos = geo.attributes.position;
  const norm = geo.attributes.normal;
  const uv = geo.attributes.uv;
  const wallTileV = Math.max(2.0, floorHeight * floorsPerTileV);

  if (pos && norm && uv) {
    for (let i = 0; i < pos.count; i += 1) {
      const nx = norm.getX(i);
      const ny = norm.getY(i);
      const nz = norm.getZ(i);
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);

      if (Math.abs(ny) > 0.72) {
        uv.setXY(i, x / 12.0, z / 12.0);
      } else {
        // Project smoothly along tangent axis proportional to metric facade span
        const horiz = Math.abs(nx) >= Math.abs(nz) ? z * Math.sign(nx || 1) : x * -Math.sign(nz || 1);
        const relY = Math.max(0, y - baseY);
        uv.setXY(i, horiz / wallTileU, relY / wallTileV);
      }
    }
    uv.needsUpdate = true;
  }

  if (bakeAO) {
    bakeArchitecturalVertexAO(geo, {
      baseY,
      height,
      floorHeight
    });
  }

  return geo;
}

/**
 * Ray-casting point-in-polygon test in XZ coordinates.
 */
export function pointInPolygonXZ(x, z, pts) {
  if (!pts || pts.length < 3) return false;
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const xi = pts[i][0];
    const zi = pts[i][1];
    const xj = pts[j][0];
    const zj = pts[j][1];
    const intersect = zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi + 1e-12) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Minimum distance from point (x, z) to polygon boundary + pushout direction for collision avoidance.
 */
export function pushOutFromPolygonXZ(x, z, pts, margin = 1.6) {
  if (!pts || pts.length < 3) return [x, z];
  let bestDistSq = Infinity;
  let bestPx = x;
  let bestPz = z;

  for (let i = 0; i < pts.length; i += 1) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    const abx = b[0] - a[0];
    const abz = b[1] - a[1];
    const abLenSq = abx * abx + abz * abz || 1e-6;
    const t = Math.max(0, Math.min(1, ((x - a[0]) * abx + (z - a[1]) * abz) / abLenSq));
    const px = a[0] + abx * t;
    const pz = a[1] + abz * t;
    const dSq = (x - px) ** 2 + (z - pz) ** 2;
    if (dSq < bestDistSq) {
      bestDistSq = dSq;
      bestPx = px;
      bestPz = pz;
    }
  }

  const inside = pointInPolygonXZ(x, z, pts);
  const dist = Math.sqrt(bestDistSq);
  if (!inside && dist >= margin) return [x, z];

  let dx = x - bestPx;
  let dz = z - bestPz;
  let len = Math.hypot(dx, dz);
  if (len < 1e-4) {
    dx = 0;
    dz = -1;
    len = 1;
  }
  dx /= len;
  dz /= len;
  if (inside) {
    // Push completely outside opposite side of closest edge
    return [bestPx - dx * margin, bestPz - dz * margin];
  }
  return [bestPx + dx * margin, bestPz + dz * margin];
}

/**
 * Transforms a local rectangle center (cx, cz, w, d) rotated around building center by `angle` into XZ corners.
 */
export function localRectToXZ(center, angle, cxLocal, czLocal, w, d) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const hw = w / 2;
  const hd = d / 2;
  const localCorners = [
    [cxLocal - hw, czLocal - hd],
    [cxLocal + hw, czLocal - hd],
    [cxLocal + hw, czLocal + hd],
    [cxLocal - hw, czLocal + hd]
  ];
  return localCorners.map(([lx, lz]) => [
    center[0] + lx * cos - lz * sin,
    center[1] + lx * sin + lz * cos
  ]);
}

/**
 * Generates crisp 3D architectural facade articulation along exact perimeter rings:
 * projecting floor-line concrete slab bands, vertical pilaster fins, optional sun-shade chajja eyebrows,
 * and roof cornice parapet trimming. Designed so underlying punched/curtain walls read cleanly!
 */
export function buildPolygonArchitecturalCage(rings, options = {}) {
  const {
    baseY = 0,
    totalHeight = 14,
    floorHeight = 3.55,
    slabOverhang = 0.24,
    slabThickness = 0.24,
    columnWidth = 0.44,
    columnDepth = 0.34,
    baySpacing = 4.6,
    chajjaDepth = 0.0,
    accentBandFloors = [],
    skipGroundCols = false,
    roofParapetH = 0.65
  } = options;

  const whiteGeos = [];
  const accentGeos = [];
  const floorCount = Math.max(1, Math.round(totalHeight / floorHeight));

  for (let r = 0; r < rings.length; r += 1) {
    const pts = simplifyShortEdgesXZ(rings[r], 1.5);
    const n = pts.length;
    if (n < 3) continue;

    // 1. Horizontal Floor Cornice Slabs + Roof Parapet Cap
    for (let fl = 1; fl <= floorCount; fl += 1) {
      const fy = Math.min(totalHeight, baseY + fl * floorHeight);
      const isRoof = fl === floorCount;
      const bandThick = isRoof ? Math.max(0.34, roofParapetH * 0.62) : slabThickness;
      const yMid = isRoof ? baseY + totalHeight + bandThick * 0.2 : fy - bandThick * 0.5;
      const isAccent = accentBandFloors.includes(fl);
      const targetBucket = isAccent ? accentGeos : whiteGeos;
      const outReach = isRoof ? slabOverhang + 0.14 : slabOverhang;

      for (let i = 0; i < n; i += 1) {
        const a = pts[i];
        const b = pts[(i + 1) % n];
        const dx = b[0] - a[0];
        const dz = b[1] - a[1];
        const segLen = Math.hypot(dx, dz);
        if (segLen < 0.7) continue;

        const yaw = -Math.atan2(dz, dx);
        const mx = (a[0] + b[0]) * 0.5;
        const mz = (a[1] + b[1]) * 0.5;
        const band = new THREE.BoxGeometry(segLen + outReach * 0.85, bandThick, outReach * 2.0);
        band.rotateY(yaw);
        band.translate(mx, yMid, mz);
        bakeArchitecturalVertexAO(band, {
          baseY: yMid - bandThick * 0.5,
          height: bandThick,
          floorHeight: 10,
          groundDark: 0.92,
          soffitDark: 0.64
        });
        targetBucket.push(band);
      }
    }

    // 2. Vertical Structural Pilasters at Corners & Bay Intervals (+ Optional Sun-Hood Chajja Lintel)
    for (let i = 0; i < n; i += 1) {
      const a = pts[i];
      const b = pts[(i + 1) % n];
      const dx = b[0] - a[0];
      const dz = b[1] - a[1];
      const segLen = Math.hypot(dx, dz);
      if (segLen < 0.8) continue;

      const yaw = -Math.atan2(dz, dx);
      const numBays = Math.max(1, Math.round(segLen / baySpacing));
      const startY = skipGroundCols ? baseY + floorHeight : baseY;
      const colH = Math.max(1.2, baseY + totalHeight - startY);

      for (let k = 0; k < numBays; k += 1) {
        const t = k / numBays;
        const px = a[0] + dx * t;
        const pz = a[1] + dz * t;
        const isCorner = k === 0;
        const cW = isCorner ? columnWidth * 1.24 : columnWidth;
        const cD = isCorner ? columnDepth * 1.18 : columnDepth;

        const col = new THREE.BoxGeometry(cW, colH, cD * 2.0);
        col.rotateY(yaw);
        col.translate(px, startY + colH * 0.5, pz);
        bakeArchitecturalVertexAO(col, { baseY: startY, height: colH, floorHeight });
        whiteGeos.push(col);
      }

      // Projecting horizontal window sun-hoods (chajja) over mid-floors on academic wings
      if (chajjaDepth > 0.08 && segLen > 4.2 && floorCount >= 2) {
        for (let fl = 1; fl < floorCount; fl += 1) {
          const hoodY = baseY + fl * floorHeight - 0.85;
          const mx = (a[0] + b[0]) * 0.5;
          const mz = (a[1] + b[1]) * 0.5;
          const hood = new THREE.BoxGeometry(segLen - 1.1, 0.14, chajjaDepth * 2.0);
          hood.rotateY(yaw);
          hood.translate(mx, hoodY, mz);
          bakeArchitecturalVertexAO(hood, {
            baseY: hoodY - 0.07,
            height: 0.14,
            groundDark: 0.9,
            soffitDark: 0.62
          });
          whiteGeos.push(hood);
        }
      }
    }
  }

  return {
    whiteTrimGeo: safeMerge(whiteGeos),
    accentLouverGeo: safeMerge(accentGeos)
  };
}

/**
 * Generates realistic rooftop architectural details (staircase/elevator bulkhead core, perimeter parapets,
 * overhead domestic water storage cylinders, HVAC chillers & tilted PV solar panel arrays).
 */
export function buildRooftopArchitecture(building, roofY, quality = 'high', includeSolar = true) {
  const { center, w, d, angle = 0 } = building;
  const hvacGeos = [];
  const tankGeos = [];
  const solarGeos = [];
  const solarFrameGeos = [];
  const turretGeos = [];

  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const placeAt = (geo, lx, ly, lz) => {
    geo.rotateY(-angle);
    geo.translate(center[0] + lx * cos - lz * sin, roofY + ly, center[1] + lx * sin + lz * cos);
    return geo;
  };

  // Elevator / staircase penthouse bulkhead (offset to rear-side core)
  if (w > 22 && d > 18) {
    const coreW = Math.min(9.5, w * 0.16);
    const coreD = Math.min(7.5, d * 0.16);
    const coreH = 2.9;
    const core = new THREE.BoxGeometry(coreW, coreH, coreD);
    placeAt(core, -w * 0.18, coreH * 0.5, -d * 0.16);
    bakeArchitecturalVertexAO(core, { baseY: roofY, height: coreH, floorHeight: 3.0 });
    turretGeos.push(core);

    const coreCap = new THREE.BoxGeometry(coreW + 0.55, 0.22, coreD + 0.55);
    placeAt(coreCap, -w * 0.18, coreH + 0.11, -d * 0.16);
    turretGeos.push(coreCap);
  }

  // Indian rooftop water storage tank pair
  if (w > 26 && d > 20) {
    for (let t = 0; t < 2; t += 1) {
      const tank = new THREE.CylinderGeometry(1.05, 1.05, 2.0, 12);
      placeAt(tank, w * 0.22 + t * 2.5, 1.0, -d * 0.22);
      tankGeos.push(tank);
    }
  }

  // Rooftop HVAC chiller cabinets
  const hvacCount = quality === 'high' ? 3 : 1;
  if (w > 22) {
    for (let i = 0; i < hvacCount; i += 1) {
      const unit = new THREE.BoxGeometry(2.6, 1.25, 1.65);
      placeAt(unit, -w * 0.2 + i * 3.8, 0.625, d * 0.18);
      hvacGeos.push(unit);
    }
  }

  // Tilted photovoltaic solar arrays on major buildings
  if (includeSolar && w > 28 && d > 20) {
    const rows = quality === 'high' ? Math.min(4, Math.max(2, Math.floor(d / 16))) : 2;
    const panelSpan = Math.min(28, w * 0.52);
    const startZ = -((rows - 1) * 4.4) * 0.5;
    for (let r = 0; r < rows; r += 1) {
      const lz = startZ + r * 4.4;
      const panel = new THREE.BoxGeometry(panelSpan, 0.08, 2.4);
      panel.rotateX(0.31);
      placeAt(panel, 0.0, 0.92, lz);
      solarGeos.push(panel);

      if (quality === 'high') {
        const legL = new THREE.BoxGeometry(0.16, 0.92, 0.16);
        placeAt(legL, -panelSpan * 0.36, 0.46, lz);
        solarFrameGeos.push(legL);
        const legR = new THREE.BoxGeometry(0.16, 0.92, 0.16);
        placeAt(legR, panelSpan * 0.36, 0.46, lz);
        solarFrameGeos.push(legR);
      }
    }
  }

  return {
    hvacGeo: safeMerge(hvacGeos),
    tankGeo: safeMerge(tankGeos),
    solarGeo: safeMerge(solarGeos),
    solarFrameGeo: safeMerge(solarFrameGeos),
    turretGeo: safeMerge(turretGeos)
  };
}
