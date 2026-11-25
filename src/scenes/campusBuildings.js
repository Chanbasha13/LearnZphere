import * as THREE from 'three';
import { createKluAssetLoader } from './kluAssetLoader';
import {
  KLU_BOUNDARY_WALL,
  KLU_BUILDINGS,
  KLU_CANAL_PATH,
  KLU_GROUNDS,
  KLU_ORIGIN_META,
  KLU_ROADS,
  KLU_SURROUNDING_CONTEXT
} from '../data/kluCampusData';
import {
  bakeArchitecturalVertexAO,
  createShapeFromXZ,
  extrudeFootprintGeo,
  insetPolygonXZ,
  localRectToXZ,
  pointInPolygonXZ,
  safeMerge,
  simplifyShortEdgesXZ
} from './kluArchBuilders';

function tagBuildingGroup(group, building) {
  group.userData.buildingId = building.id;
  group.userData.building = building;
  group.traverse((child) => {
    child.userData.buildingId = building.id;
    child.userData.building = building;
  });
}

function addShadowProps(mesh, cast = true, receive = true) {
  mesh.castShadow = cast;
  mesh.receiveShadow = receive;
  return mesh;
}

function distanceToSegmentXZ(px, pz, x1, z1, x2, z2) {
  const vx = x2 - x1;
  const vz = z2 - z1;
  const wx = px - x1;
  const wz = pz - z1;
  const lenSq = vx * vx + vz * vz;
  const t = lenSq > 1e-6 ? Math.max(0, Math.min(1, (wx * vx + wz * vz) / lenSq)) : 0;
  return Math.hypot(px - (x1 + t * vx), pz - (z1 + t * vz));
}

function distanceToPolylineXZ(px, pz, pts) {
  let minD = Infinity;
  for (let i = 0; i < pts.length - 1; i += 1) {
    const d = distanceToSegmentXZ(px, pz, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]);
    if (d < minD) minD = d;
  }
  return minD;
}

function createPolylineRibbonGeometry(pts, width, y = 0.08, uTileMeters = 14) {
  if (!pts || pts.length < 2) return null;
  const hw = width * 0.5;
  const positions = [];
  const uvs = [];
  const normals = [];
  let accumU = 0;

  for (let i = 0; i < pts.length - 1; i += 1) {
    const [x1, z1] = pts[i];
    const [x2, z2] = pts[i + 1];
    const dx = x2 - x1;
    const dz = z2 - z1;
    const len = Math.hypot(dx, dz);
    if (len < 0.05) continue;

    const nx = -dz / len;
    const nz = dx / len;
    const u0 = accumU / uTileMeters;
    const u1 = (accumU + len) / uTileMeters;
    accumU += len;

    const a = [x1 + nx * hw, y, z1 + nz * hw];
    const b = [x1 - nx * hw, y, z1 - nz * hw];
    const c = [x2 + nx * hw, y, z2 + nz * hw];
    const d = [x2 - nx * hw, y, z2 - nz * hw];

    positions.push(...a, ...c, ...b, ...b, ...c, ...d);
    normals.push(0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0);
    uvs.push(u0, 0, u1, 0, u0, 1, u0, 1, u1, 0, u1, 1);
  }

  if (!positions.length) return null;
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  return geo;
}

function applyPlanarWorldUVs(geo, tileX = 10, tileZ = 10) {
  const pos = geo.attributes.position;
  const uvs = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i += 1) {
    uvs[i * 2] = pos.getX(i) / tileX;
    uvs[i * 2 + 1] = pos.getZ(i) / tileZ;
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  return geo;
}

const GROUND_CAMERA_CLEARANCE = [
  [-274, 25], // walk-gate
  [-186, 28], // walk-library
  [-126, 116], // walk-cblock
  [-6.5, 96], // walk-rnd
  [-28, 86],  // walk-oat
  [-28, -32], // walk-sports
  [185, 32]   // walk-hostels
];

function isClearForVegetation(px, pz, buildingBuffer = 3.6, roadBuffer = 4.6) {
  for (let i = 0; i < GROUND_CAMERA_CLEARANCE.length; i += 1) {
    const [cx, cz] = GROUND_CAMERA_CLEARANCE[i];
    if (Math.hypot(px - cx, pz - cz) < 9.5) return false;
  }

  for (let i = 0; i < KLU_BUILDINGS.length; i += 1) {
    const b = KLU_BUILDINGS[i];
    const rad = Math.max(b.w || 20, b.d || 20) * 0.72 + buildingBuffer;
    if (Math.hypot(px - b.center[0], pz - b.center[1]) > rad) continue;
    if (b.polygon && b.polygon.length >= 3) {
      if (pointInPolygonXZ(px, pz, b.polygon)) return false;
      // Check polygon edge proximity so canopies don't clip through walls
      const p = b.polygon;
      for (let e = 0; e < p.length; e += 1) {
        const a = p[e];
        const c = p[(e + 1) % p.length];
        if (distanceToSegmentXZ(px, pz, a[0], a[1], c[0], c[1]) < buildingBuffer) return false;
      }
    }
  }

  for (let i = 0; i < KLU_ROADS.length; i += 1) {
    const r = KLU_ROADS[i];
    const extra = r.kind === 'highway' ? 4.8 : r.kind === 'avenue' ? 3.2 : 2.2;
    if (distanceToPolylineXZ(px, pz, r.pts) < roadBuffer + extra) return false;
  }

  // Keep canal channel water clear
  if (distanceToPolylineXZ(px, pz, KLU_CANAL_PATH) < 25) return false;

  return true;
}

export function createArchitecturalMaterials(textures) {
  const glassBase = new THREE.MeshPhysicalMaterial({
    map: textures.curtainGlassMap,
    roughnessMap: textures.curtainGlassRoughnessMap,
    color: 0x3b4d5c,
    roughness: 0.14,
    metalness: 0.16,
    reflectivity: 0.55,
    clearcoat: 0.42,
    clearcoatRoughness: 0.12,
    envMapIntensity: 0.48
  });

  const mats = {
    farmland: new THREE.MeshStandardMaterial({
      map: textures.farmlandMap,
      normalMap: textures.farmlandNormalMap || textures.terrainNormalMap,
      normalScale: new THREE.Vector2(0.32, 0.32),
      vertexColors: true,
      roughness: 0.94,
      metalness: 0.0
    }),
    campusLawn: new THREE.MeshStandardMaterial({
      map: textures.grassMap,
      normalMap: textures.terrainNormalMap,
      normalScale: new THREE.Vector2(0.4, 0.4),
      color: 0xa4b38b,
      roughness: 0.92,
      metalness: 0.0
    }),
    sandApron: new THREE.MeshStandardMaterial({
      map: textures.farmlandMap,
      color: 0xb6a388,
      roughness: 0.95,
      metalness: 0.0
    }),
    humusGround: new THREE.MeshStandardMaterial({
      color: 0x3b4929,
      roughness: 0.96,
      metalness: 0.0
    }),
    riverSiltBank: new THREE.MeshStandardMaterial({
      color: 0x5c5344,
      roughness: 0.95,
      metalness: 0.0
    }),
    asphalt: new THREE.MeshStandardMaterial({
      map: textures.roadMap,
      normalMap: textures.roadNormalMap,
      normalScale: new THREE.Vector2(0.45, 0.45),
      roughnessMap: textures.roadRoughnessMap,
      color: 0xe6e6e6,
      roughness: 0.88,
      metalness: 0.02
    }),
    roadCurb: new THREE.MeshStandardMaterial({
      map: textures.curbStripeMap,
      color: 0xf4f4f0,
      roughness: 0.8,
      metalness: 0.02
    }),
    paver: new THREE.MeshStandardMaterial({
      map: textures.paverMap,
      normalMap: textures.paverNormalMap,
      normalScale: new THREE.Vector2(0.5, 0.5),
      color: 0xebe6dc,
      roughness: 0.85,
      metalness: 0.03
    }),
    redGranite: new THREE.MeshStandardMaterial({
      color: 0x733a30,
      roughness: 0.55,
      metalness: 0.06
    }),
    kluWhiteConcrete: new THREE.MeshStandardMaterial({
      map: textures.concreteMap,
      normalMap: textures.concreteNormalMap,
      normalScale: new THREE.Vector2(0.42, 0.42),
      roughnessMap: textures.concreteRoughnessMap,
      vertexColors: true,
      color: 0xf5f2eb,
      roughness: 0.84,
      metalness: 0.02
    }),
    concreteMuted: new THREE.MeshStandardMaterial({
      map: textures.concreteMap,
      normalMap: textures.concreteNormalMap,
      normalScale: new THREE.Vector2(0.38, 0.38),
      color: 0xd9d4ca,
      roughness: 0.88,
      metalness: 0.02
    }),
    punchedAcademicWall: new THREE.MeshStandardMaterial({
      map: textures.punchedAcademicMap,
      normalMap: textures.punchedAcademicNormalMap,
      normalScale: new THREE.Vector2(0.85, 0.85),
      roughnessMap: textures.punchedAcademicRoughnessMap,
      vertexColors: true,
      color: 0xffffff,
      roughness: 0.9,
      metalness: 0.08
    }),
    hostelLoggiaWall: new THREE.MeshStandardMaterial({
      map: textures.hostelLoggiaMap,
      normalMap: textures.hostelLoggiaNormalMap,
      normalScale: new THREE.Vector2(0.75, 0.75),
      vertexColors: true,
      color: 0xffffff,
      roughness: 0.84,
      metalness: 0.04
    }),
    stackedStone: new THREE.MeshStandardMaterial({
      map: textures.stackedStoneMap,
      normalMap: textures.stackedStoneNormalMap,
      normalScale: new THREE.Vector2(0.9, 0.9),
      color: 0xded9d0,
      roughness: 0.9,
      metalness: 0.02
    }),
    charcoalPrecast: new THREE.MeshStandardMaterial({
      map: textures.concreteMap,
      normalMap: textures.concreteNormalMap,
      normalScale: new THREE.Vector2(0.4, 0.4),
      color: 0x2d323a,
      roughness: 0.68,
      metalness: 0.14
    }),
    terracottaLouver: new THREE.MeshStandardMaterial({
      color: 0x9f4528,
      roughness: 0.46,
      metalness: 0.28
    }),
    terracottaBrick: new THREE.MeshStandardMaterial({
      map: textures.terracottaMap,
      normalMap: textures.terracottaNormalMap,
      normalScale: new THREE.Vector2(0.65, 0.65),
      color: 0xdca08b,
      roughness: 0.82,
      metalness: 0.04
    }),
    indoorStadiumWall: new THREE.MeshStandardMaterial({
      map: textures.indoorBrickMap,
      normalMap: textures.indoorBrickNormalMap,
      normalScale: new THREE.Vector2(0.6, 0.6),
      color: 0xecd8cc,
      roughness: 0.82,
      metalness: 0.04
    }),
    timberCanopy: new THREE.MeshStandardMaterial({
      map: textures.woodMap,
      normalMap: textures.woodNormalMap,
      normalScale: new THREE.Vector2(0.55, 0.55),
      color: 0xf4e3cf,
      roughness: 0.68,
      metalness: 0.05
    }),
    curtainGlass: glassBase,
    atriumGlass: new THREE.MeshPhysicalMaterial({
      color: 0x1e3848,
      roughness: 0.08,
      metalness: 0.12,
      transparent: true,
      opacity: 0.38,
      reflectivity: 0.72,
      clearcoat: 0.65,
      clearcoatRoughness: 0.08,
      envMapIntensity: 0.75
    }),
    warmInteriorGlow: new THREE.MeshStandardMaterial({
      color: 0xedd6b4,
      emissive: 0xffd194,
      emissiveIntensity: 0.42,
      roughness: 0.65
    }),
    aquaTrim: new THREE.MeshPhysicalMaterial({
      color: 0x45a3a8,
      roughness: 0.32,
      metalness: 0.12,
      transparent: true,
      opacity: 0.84
    }),
    purplePlum: new THREE.MeshStandardMaterial({
      color: 0x5c3e66,
      roughness: 0.72,
      metalness: 0.06
    }),
    darkMetal: new THREE.MeshStandardMaterial({
      color: 0x1c2026,
      roughness: 0.38,
      metalness: 0.68
    }),
    brushedSteel: new THREE.MeshStandardMaterial({
      color: 0x7e8792,
      roughness: 0.4,
      metalness: 0.58
    }),
    stadiumVaultRoof: new THREE.MeshStandardMaterial({
      color: 0xb7bdc4,
      roughness: 0.36,
      metalness: 0.55
    }),
    stadiumArchSteel: new THREE.MeshStandardMaterial({
      color: 0x5e251e,
      roughness: 0.45,
      metalness: 0.48
    }),
    roofConcrete: new THREE.MeshStandardMaterial({
      map: textures.concreteMap,
      color: 0xb5b0a5,
      roughness: 0.92,
      metalness: 0.02
    }),
    solarPanel: new THREE.MeshPhysicalMaterial({
      map: textures.solarMap,
      roughness: 0.16,
      metalness: 0.45,
      clearcoat: 0.85,
      clearcoatRoughness: 0.12
    }),
    limestone: new THREE.MeshStandardMaterial({
      map: textures.limestoneMap,
      color: 0xe6dfd1,
      roughness: 0.84,
      metalness: 0.02
    }),
    cricketPitchClay: new THREE.MeshStandardMaterial({
      color: 0xb99a74,
      roughness: 0.95
    }),
    courtGreen: new THREE.MeshStandardMaterial({
      color: 0x2c634b,
      roughness: 0.78
    }),
    courtBlue: new THREE.MeshStandardMaterial({
      color: 0x2e587a,
      roughness: 0.78
    }),
    canalWater: new THREE.MeshPhysicalMaterial({
      map: textures.canalWaterMap,
      normalMap: textures.waterNormalsMap,
      normalScale: new THREE.Vector2(0.62, 0.62),
      color: 0xb8ccb2,
      roughness: 0.3,
      metalness: 0.04,
      reflectivity: 0.32,
      clearcoat: 0.32,
      clearcoatRoughness: 0.16,
      envMapIntensity: 0.25
    }),
    canalWaterFallback: new THREE.MeshPhysicalMaterial({
      map: textures.canalWaterMap,
      color: 0xa8be9f,
      roughness: 0.34,
      metalness: 0.04,
      clearcoat: 0.24,
      clearcoatRoughness: 0.2
    }),
    poolWater: new THREE.MeshPhysicalMaterial({
      map: textures.poolMap,
      color: 0x4cc4df,
      roughness: 0.08,
      metalness: 0.05,
      clearcoat: 0.95
    }),
    crimsonSign: new THREE.MeshStandardMaterial({
      color: 0x8f1922,
      roughness: 0.38,
      metalness: 0.18
    }),
    goldAccent: new THREE.MeshStandardMaterial({
      color: 0xd1a141,
      roughness: 0.26,
      metalness: 0.72
    }),
    busYellow: new THREE.MeshStandardMaterial({
      color: 0xdca524,
      roughness: 0.38,
      metalness: 0.2
    }),
    lampGlow: new THREE.MeshStandardMaterial({
      color: 0xfff0d4,
      emissive: 0xffd799,
      emissiveIntensity: 0.6,
      roughness: 0.25
    }),
    foliageTrunk: new THREE.MeshStandardMaterial({
      map: textures.barkMap,
      normalMap: textures.barkNormalMap,
      normalScale: new THREE.Vector2(0.85, 0.85),
      color: 0xffffff,
      roughness: 0.92,
      metalness: 0.0
    }),
    palmCrownshaft: new THREE.MeshStandardMaterial({
      color: 0x4b7034,
      roughness: 0.72,
      metalness: 0.02
    }),
    foliageRainLeaf: new THREE.MeshStandardMaterial({
      map: textures.rainLeafAtlasMap,
      alphaTest: 0.42,
      side: THREE.DoubleSide,
      vertexColors: true,
      roughness: 0.82,
      metalness: 0.0
    }),
    foliageGulmoharLeaf: new THREE.MeshStandardMaterial({
      map: textures.gulmoharLeafAtlasMap,
      alphaTest: 0.42,
      side: THREE.DoubleSide,
      vertexColors: true,
      roughness: 0.80,
      metalness: 0.0
    }),
    foliageShrubLeaf: new THREE.MeshStandardMaterial({
      map: textures.shrubAtlasMap,
      alphaTest: 0.42,
      side: THREE.DoubleSide,
      vertexColors: true,
      roughness: 0.80,
      metalness: 0.0
    }),
    foliageCanopy: new THREE.MeshStandardMaterial({
      map: textures.rainLeafAtlasMap,
      alphaTest: 0.42,
      side: THREE.DoubleSide,
      vertexColors: true,
      roughness: 0.82,
      metalness: 0.0
    }),
    palmFrondLeaf: new THREE.MeshStandardMaterial({
      map: textures.palmFrondAtlasMap,
      alphaTest: 0.38,
      vertexColors: true,
      side: THREE.DoubleSide,
      roughness: 0.58,
      metalness: 0.03
    }),
    gateSign: new THREE.MeshStandardMaterial({
      map: textures.gateSignMap,
      emissiveMap: textures.gateSignMap,
      emissive: new THREE.Color(0xfff1cf),
      emissiveIntensity: 0.05,
      roughness: 0.46,
      metalness: 0.1
    })
  };

  return {
    ...mats,
    dispose: () => {
      Object.values(mats).forEach((m) => {
        if (m && typeof m.dispose === 'function') m.dispose();
      });
    }
  };
}

/**
 * Stage 3: Sculpted Vaddeswaram Krishna Delta Valley, Landscaped Canal Embankments & Curbed Roads.
 */
function buildTerrainAndRoads(scene, mats, textures, quality, sunDir) {
  const groundGroup = new THREE.Group();
  groundGroup.name = 'klu-ground-and-roads';
  const animatedWaters = [];

  const extendedCanal = [
    [-1320, -1425],
    ...KLU_CANAL_PATH,
    [240, 1320]
  ];

  // 1. Sculpted Valley Terrain w/ High-Res Crop Parcel Preservation + Irregular Krishna Canal Levee Banks
  const valleyGeo = new THREE.PlaneGeometry(6000, 6000, 180, 160);
  valleyGeo.rotateX(-Math.PI / 2);
  const vPos = valleyGeo.attributes.position;
  const vColors = new Float32Array(vPos.count * 3);

  const cPure = new THREE.Color(0xf6f2eb);   // neutral crisp multiplier preserving agricultural parcel detail
  const cLeveeGrass = new THREE.Color(0x637246);
  const cMudShelf = new THREE.Color(0x5e5040);
  const cSilt = new THREE.Color(0x3a3228);

  for (let i = 0; i < vPos.count; i += 1) {
    const x = vPos.getX(i);
    const z = vPos.getZ(i);
    const rawCanalD = distanceToPolylineXZ(x, z, extendedCanal);
    // Natural shoreline meander perturbation matching klu_sat_raw.jpg organic edges
    const meander = Math.sin(x * 0.032 + z * 0.025) * 3.1 + Math.cos(x * 0.068 - z * 0.045) * 1.6;
    const dCanal = rawCanalD + meander;

    const nx = (x - 105) / 680;
    const nz = (z + 25) / 435;
    const radialDist = Math.hypot(nx, nz);

    let y = -0.14;
    let col = cPure;

    if (dCanal < 22) {
      y = -3.15;
      col = cSilt;
    } else if (dCanal < 28.5) {
      const t = (dCanal - 22) / 6.5;
      y = -3.15 + t * 3.1;
      col = cSilt.clone().lerp(cMudShelf, t);
    } else if (dCanal < 40) {
      // Irregular vegetated embankment climbing cleanly to dike berm (+1.35m)
      const t = (dCanal - 28.5) / 11.5;
      y = -0.05 + Math.sin((t * Math.PI) / 2) * 1.4;
      col = cMudShelf.clone().lerp(cLeveeGrass, Math.min(1, t * 1.3));
    } else if (dCanal < 55) {
      const t = (dCanal - 40) / 15;
      y = 1.35 * (1 - t * t * (3 - 2 * t)) - 0.14 * t;
      col = cLeveeGrass.clone().lerp(cPure, t);
    } else if (radialDist > 1.0) {
      const edge = radialDist - 1.0;
      const hill = (Math.sin(x * 0.0052) * Math.cos(z * 0.0061) + 0.85) * 4.2;
      y += Math.min(24, Math.pow(edge, 1.25) * hill);
    }

    vPos.setY(i, y);
    vColors[i * 3] = col.r;
    vColors[i * 3 + 1] = col.g;
    vColors[i * 3 + 2] = col.b;
  }
  valleyGeo.setAttribute('color', new THREE.BufferAttribute(vColors, 3));
  valleyGeo.computeVertexNormals();
  groundGroup.add(addShadowProps(new THREE.Mesh(valleyGeo, mats.farmland), false, true));

  // 2. Mowed Campus Turf Polygon strictly enclosed inside KL University Boundary Wall
  const boundaryShape = createShapeFromXZ(KLU_BOUNDARY_WALL);
  const campusTurfGeo = new THREE.ShapeGeometry(boundaryShape, 8);
  campusTurfGeo.rotateX(-Math.PI / 2);
  campusTurfGeo.translate(0, 0.02, 0);
  applyPlanarWorldUVs(campusTurfGeo, 10.5, 10.5);
  groundGroup.add(addShadowProps(new THREE.Mesh(campusTurfGeo, mats.campusLawn), false, true));

  // 3. Natural Olive-Slate Krishna Canal River Surface (low glare, bank reed edge mottling per klu_sat_raw.jpg)
  const canalWaterGeo = createPolylineRibbonGeometry(extendedCanal, 56, -0.24, 34);
  if (canalWaterGeo) {
    textures.waterNormalsMap.repeat.set(2, 1);
    const canalMesh = addShadowProps(
      new THREE.Mesh(canalWaterGeo, quality === 'high' ? mats.canalWater : mats.canalWaterFallback),
      false,
      true
    );
    canalMesh.name = 'krishna-western-delta-canal';
    groundGroup.add(canalMesh);
    if (quality === 'high') {
      animatedWaters.push(canalMesh);
    }
  }

  // 4. White Compound Perimeter Wall w/ Red/Yellow Main Gate Entrance Opening
  const wallGeos = [];
  const wallCapGeos = [];
  for (let i = 0; i < KLU_BOUNDARY_WALL.length; i += 1) {
    const a = KLU_BOUNDARY_WALL[i];
    const b = KLU_BOUNDARY_WALL[(i + 1) % KLU_BOUNDARY_WALL.length];
    const dx = b[0] - a[0];
    const dz = b[1] - a[1];
    const segLen = Math.hypot(dx, dz);
    if (segLen < 2) continue;

    const midX = (a[0] + b[0]) * 0.5;
    const midZ = (a[1] + b[1]) * 0.5;
    const yaw = -Math.atan2(dz, dx);

    const isWestGateSeg = a[0] < -190 && b[0] < -190 && Math.abs(dx) < 230 && midZ > -220 && midZ < 220;
    if (isWestGateSeg) {
      const gateCenter = [-292, 24];
      const dGate = distanceToSegmentXZ(gateCenter[0], gateCenter[1], a[0], a[1], b[0], b[1]);
      if (dGate < 26) {
        const sub1 = segLen * 0.42;
        const t1 = 0.21;
        const w1 = new THREE.BoxGeometry(sub1, 2.2, 0.38);
        w1.rotateY(yaw);
        w1.translate(a[0] + dx * t1, 1.1, a[1] + dz * t1);
        wallGeos.push(w1);
        const t2 = 0.79;
        const w2 = new THREE.BoxGeometry(sub1, 2.2, 0.38);
        w2.rotateY(yaw);
        w2.translate(a[0] + dx * t2, 1.1, a[1] + dz * t2);
        wallGeos.push(w2);
        continue;
      }
    }

    const wall = new THREE.BoxGeometry(segLen, 2.1, 0.38);
    wall.rotateY(yaw);
    wall.translate(midX, 1.05, midZ);
    bakeArchitecturalVertexAO(wall, { baseY: 0, height: 2.1, floorHeight: 2.1, groundDark: 0.7 });
    wallGeos.push(wall);

    const cap = new THREE.BoxGeometry(segLen + 0.1, 0.16, 0.54);
    cap.rotateY(yaw);
    cap.translate(midX, 2.18, midZ);
    wallCapGeos.push(cap);
  }
  if (wallGeos.length) groundGroup.add(addShadowProps(new THREE.Mesh(safeMerge(wallGeos), mats.kluWhiteConcrete), true, true));
  if (wallCapGeos.length) groundGroup.add(addShadowProps(new THREE.Mesh(safeMerge(wallCapGeos), mats.charcoalPrecast), false, true));

  // Main Gate Archway & Ornamental Entry Roundabout Median (klufl_26_gate.jpg & klufl_50_gate_ext.jpg)
  const gateGroup = new THREE.Group();
  gateGroup.position.set(-296, 0, 26);
  gateGroup.rotation.y = -0.38;

  const pL = new THREE.Mesh(new THREE.BoxGeometry(1.4, 7.6, 2.2), mats.kluWhiteConcrete);
  pL.position.set(0, 3.8, -7.2);
  const pR = pL.clone();
  pR.position.set(0, 3.8, 7.2);
  const archBeam = new THREE.Mesh(new THREE.BoxGeometry(2.0, 2.1, 17.5), mats.crimsonSign);
  archBeam.position.set(0, 7.6, 0);
  const signW = new THREE.Mesh(new THREE.PlaneGeometry(14.8, 2.4), mats.gateSign);
  signW.position.set(-1.04, 7.6, 0);
  signW.rotation.y = -Math.PI * 0.5;
  const signE = new THREE.Mesh(new THREE.PlaneGeometry(14.8, 2.4), mats.gateSign);
  signE.position.set(1.04, 7.6, 0);
  signE.rotation.y = Math.PI * 0.5;
  const archCap = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.35, 18.2), mats.kluWhiteConcrete);
  archCap.position.set(0, 8.82, 0);
  const guardHouse = new THREE.Mesh(new THREE.BoxGeometry(3.6, 3.0, 4.2), mats.stackedStone);
  guardHouse.position.set(-2.2, 1.5, -10.8);
  const guardGlass = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.15, 2.6), mats.atriumGlass);
  guardGlass.position.set(-0.36, 1.85, -10.8);
  const medianCurb = new THREE.Mesh(new THREE.CylinderGeometry(3.8, 4.2, 0.32, 20), mats.crimsonSign);
  medianCurb.position.set(22, 0.16, 0);
  const medianTurf = new THREE.Mesh(new THREE.CylinderGeometry(3.3, 3.4, 0.38, 20), mats.campusLawn);
  medianTurf.position.set(22, 0.19, 0);

  gateGroup.add(
    addShadowProps(pL, true, true),
    addShadowProps(pR, true, true),
    addShadowProps(archBeam, true, true),
    signW,
    signE,
    addShadowProps(archCap, true, true),
    addShadowProps(guardHouse, true, true),
    guardGlass,
    addShadowProps(medianCurb, false, true),
    addShadowProps(medianTurf, false, true)
  );
  groundGroup.add(gateGroup);

  // 5. Merged Asphalt Roadways w/ Red/Yellow Painted Checkered Campus Curbs & Concrete Sidewalks
  const roadBuckets = { highway: [], avenue: [], lane: [] };
  const curbGeos = [];
  const sidewalkGeos = [];
  for (let i = 0; i < KLU_ROADS.length; i += 1) {
    const r = KLU_ROADS[i];
    const width = r.kind === 'highway' ? 10.6 : r.kind === 'avenue' ? 7.6 : 5.4;
    const yOff = r.kind === 'highway' ? 0.055 : r.kind === 'avenue' ? 0.068 : 0.052;
    const geo = createPolylineRibbonGeometry(r.pts, width, yOff, 14);
    if (geo) roadBuckets[r.kind]?.push(geo);

    if (r.kind === 'avenue') {
      const cg = createPolylineRibbonGeometry(r.pts, width + 0.85, yOff - 0.014, 6);
      if (cg) curbGeos.push(cg);
      const sw = createPolylineRibbonGeometry(r.pts, width + 2.8, yOff - 0.024, 5);
      if (sw) sidewalkGeos.push(sw);
    }
  }

  Object.entries(roadBuckets).forEach(([kind, geos]) => {
    if (!geos.length) return;
    const mesh = new THREE.Mesh(safeMerge(geos), mats.asphalt);
    mesh.name = `road-network-${kind}`;
    groundGroup.add(addShadowProps(mesh, false, true));
  });
  if (curbGeos.length) {
    groundGroup.add(addShadowProps(new THREE.Mesh(safeMerge(curbGeos), mats.roadCurb), false, true));
  }
  if (sidewalkGeos.length) {
    groundGroup.add(addShadowProps(new THREE.Mesh(safeMerge(sidewalkGeos), mats.limestone), false, true));
  }

  // 6. Campus Grounds: Parking, Bus Bay, Playgrounds, Checkered Lawn Borders
  const buildGroundPad = (pts, mat, y = 0.045, extraBorderMat = null) => {
    const geo = new THREE.ShapeGeometry(createShapeFromXZ(pts), 4);
    geo.rotateX(-Math.PI / 2);
    geo.translate(0, y, 0);
    const tileMeters = mat === mats.paver ? 3.2 : mat === mats.campusLawn ? 10.0 : mat === mats.asphalt ? 14 : 12;
    applyPlanarWorldUVs(geo, tileMeters, tileMeters);
    groundGroup.add(addShadowProps(new THREE.Mesh(geo, mat), false, true));
    if (extraBorderMat) {
      const curbPts = insetPolygonXZ(pts, -0.38);
      const cGeo = new THREE.ShapeGeometry(createShapeFromXZ(curbPts, [pts]), 4);
      cGeo.rotateX(-Math.PI / 2);
      cGeo.translate(0, y + 0.02, 0);
      applyPlanarWorldUVs(cGeo, 4, 4);
      groundGroup.add(addShadowProps(new THREE.Mesh(cGeo, extraBorderMat), false, true));
    }
  };

  if (KLU_GROUNDS.kghGarden?.polygon) buildGroundPad(KLU_GROUNDS.kghGarden.polygon, mats.campusLawn, 0.06, mats.roadCurb);
  if (KLU_GROUNDS.mainParking?.polygon) {
    buildGroundPad(KLU_GROUNDS.mainParking.polygon, mats.paver, 0.048);
    const mp = KLU_GROUNDS.mainParking;
    const carBody = new THREE.BoxGeometry(3.8, 1.32, 1.85);
    const carInst = new THREE.InstancedMesh(carBody, mats.concreteMuted, 14);
    const stripeGeo = new THREE.BoxGeometry(0.16, 0.03, 4.4);
    const stripeInst = new THREE.InstancedMesh(stripeGeo, mats.kluWhiteConcrete, 16);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < 16; i += 1) {
      const row = Math.floor(i / 8);
      const col = i % 8;
      const lx = -15.1 + col * 4.2;
      const lz = -6 + row * 12;
      dummy.position.set(
        mp.center[0] + lx * Math.cos(mp.angle) - lz * Math.sin(mp.angle),
        0.065,
        mp.center[1] + lx * Math.sin(mp.angle) + lz * Math.cos(mp.angle)
      );
      dummy.rotation.y = -mp.angle + Math.PI * 0.5;
      dummy.updateMatrix();
      stripeInst.setMatrixAt(i, dummy.matrix);
    }
    stripeInst.instanceMatrix.needsUpdate = true;
    groundGroup.add(stripeInst);
    for (let i = 0; i < 14; i += 1) {
      const row = Math.floor(i / 7);
      const col = i % 7;
      const lx = -13 + col * 4.2;
      const lz = -6 + row * 12;
      dummy.position.set(
        mp.center[0] + lx * Math.cos(mp.angle) - lz * Math.sin(mp.angle),
        0.74,
        mp.center[1] + lx * Math.sin(mp.angle) + lz * Math.cos(mp.angle)
      );
      dummy.rotation.y = -mp.angle + Math.PI * 0.5;
      dummy.updateMatrix();
      carInst.setMatrixAt(i, dummy.matrix);
    }
    carInst.instanceMatrix.needsUpdate = true;
    groundGroup.add(addShadowProps(carInst, true, true));
  }

  if (KLU_GROUNDS.busParking) {
    const bp = KLU_GROUNDS.busParking;
    if (bp.polygon) buildGroundPad(bp.polygon, mats.asphalt, 0.05);
    const busBodyGeo = new THREE.BoxGeometry(9.6, 2.8, 2.45);
    const busGlassGeo = new THREE.BoxGeometry(8.8, 0.95, 2.5);
    const busRoofGeo = new THREE.BoxGeometry(9.2, 0.25, 2.3);
    const busCount = 16;
    const bodies = new THREE.InstancedMesh(busBodyGeo, mats.busYellow, busCount);
    const glasses = new THREE.InstancedMesh(busGlassGeo, mats.darkMetal, busCount);
    const roofs = new THREE.InstancedMesh(busRoofGeo, mats.kluWhiteConcrete, busCount);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < busCount; i += 1) {
      const row = Math.floor(i / 8);
      const col = i % 8;
      const lx = -34 + col * 9.8;
      const lz = -13 + row * 24;
      const wx = bp.center[0] + lx * Math.cos(bp.angle) - lz * Math.sin(bp.angle);
      const wz = bp.center[1] + lx * Math.sin(bp.angle) + lz * Math.cos(bp.angle);
      dummy.rotation.y = -bp.angle + Math.PI * 0.5;
      dummy.position.set(wx, 1.55, wz);
      dummy.updateMatrix();
      bodies.setMatrixAt(i, dummy.matrix);
      dummy.position.set(wx, 2.15, wz);
      dummy.updateMatrix();
      glasses.setMatrixAt(i, dummy.matrix);
      dummy.position.set(wx, 3.05, wz);
      dummy.updateMatrix();
      roofs.setMatrixAt(i, dummy.matrix);
    }
    [bodies, glasses, roofs].forEach((inst) => {
      inst.instanceMatrix.needsUpdate = true;
      groundGroup.add(addShadowProps(inst, true, true));
    });
  }

  (KLU_GROUNDS.playgrounds || []).forEach((pg, idx) => {
    const courtMat = idx % 2 === 0 ? mats.courtGreen : mats.courtBlue;
    buildGroundPad(pg.polygon, courtMat, 0.055, mats.roadCurb);
  });

  if (KLU_GROUNDS.basketball?.polygon) {
    buildGroundPad(KLU_GROUNDS.basketball.polygon, mats.terracottaBrick, 0.058, mats.kluWhiteConcrete);
  }
  if (KLU_GROUNDS.eastHostelCourts) {
    const ec = KLU_GROUNDS.eastHostelCourts;
    const ecPoly = localRectToXZ(ec.center, ec.angle, 0, 0, ec.w, ec.d);
    buildGroundPad(ecPoly, mats.courtBlue, 0.052, mats.roadCurb);
  }

  // Academic Core Central Plazas, Sandy Gravel Service Yards & Woodland Humus (`klu_sat_raw.jpg`)
  const plazaRects = [
    localRectToXZ([-127, 128], -0.1, 0, 0, 72, 22),   // C-Block checkered lawn mall
    localRectToXZ([-182, 26], -0.1, 0, 0, 38, 42),    // Library western arrival courtyard
    localRectToXZ([-14, 130], -0.1, 0, 0, 32, 36),    // R&D west stone plaza
    localRectToXZ([-232, 88], -0.11, 0, 0, 44, 24)    // FED west lawn court
  ];
  plazaRects.forEach((pts, idx) => {
    buildGroundPad(pts, idx === 0 || idx === 3 ? mats.campusLawn : mats.paver, 0.042, idx === 0 ? mats.roadCurb : null);
  });

  // Natural sandy-earth / compacted gravel yards observed around SE/Bus bay & Vaddeswaram residential sector
  if (KLU_GROUNDS.eastWoodlandGrove) {
    const eg = KLU_GROUNDS.eastWoodlandGrove;
    buildGroundPad(localRectToXZ(eg.center, eg.angle, 0, 0, eg.w, eg.d), mats.humusGround, 0.032);
  }
  const sandyYards = [
    localRectToXZ([275, -188], 0.24, 0, 0, 128, 78), // North-East Bus & construction earth apron
    localRectToXZ([-12, 290], 0.04, 0, 0, 145, 145)  // South residential courtyard gravel pad
  ];
  sandyYards.forEach((pts) => buildGroundPad(pts, mats.sandApron, 0.025));

  scene.add(groundGroup);
  return { animatedWaters };
}

/**
 * Horizontal Terrain-Anchored Sports Facilities (`cricket-ground` and `swimming-pool`).
 * All 24 architectural campus structures load as multi-LOD real-depth GLB models in `buildCampusSceneGraph`.
 */
function buildDetailedCampusBuilding(building, mats, quality = 'high') {
  const group = new THREE.Group();
  group.name = `building-${building.id}`;
  const poly = simplifyShortEdgesXZ(building.polygon, 1.4);

  // =========================================================================
  // 1. CRICKET GROUND & ATHLETIC OVAL
  // =========================================================================
  if (building.id === 'cricket-ground') {
    const outerTrackGeo = new THREE.ShapeGeometry(createShapeFromXZ(poly), 18);
    outerTrackGeo.rotateX(-Math.PI / 2);
    outerTrackGeo.translate(0, 0.06, 0);
    applyPlanarWorldUVs(outerTrackGeo, 6, 6);
    group.add(addShadowProps(new THREE.Mesh(outerTrackGeo, mats.terracottaBrick), false, true));

    const laneRingPts = insetPolygonXZ(poly, 3.2);
    const turfPts = insetPolygonXZ(poly, 7.6);
    if (laneRingPts.length >= 3 && turfPts.length >= 3) {
      const lineGeo = new THREE.ShapeGeometry(createShapeFromXZ(laneRingPts, [insetPolygonXZ(laneRingPts, 0.45)]), 18);
      lineGeo.rotateX(-Math.PI / 2);
      lineGeo.translate(0, 0.072, 0);
      group.add(addShadowProps(new THREE.Mesh(lineGeo, mats.kluWhiteConcrete), false, true));

      const outfieldGeo = new THREE.ShapeGeometry(createShapeFromXZ(turfPts), 18);
      outfieldGeo.rotateX(-Math.PI / 2);
      outfieldGeo.translate(0, 0.08, 0);
      applyPlanarWorldUVs(outfieldGeo, 10, 10);
      group.add(addShadowProps(new THREE.Mesh(outfieldGeo, mats.campusLawn), false, true));
    }

    const pitch = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.05, 22.5), mats.cricketPitchClay);
    pitch.position.set(building.center[0], 0.1, building.center[1]);
    pitch.rotation.y = -building.angle;
    group.add(addShadowProps(pitch, false, true));

    [-8.8, 8.8].forEach((cz) => {
      const crease = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.06, 0.16), mats.kluWhiteConcrete);
      crease.position.set(
        building.center[0] - cz * Math.sin(building.angle),
        0.11,
        building.center[1] + cz * Math.cos(building.angle)
      );
      crease.rotation.y = -building.angle;
      group.add(crease);
    });

    // Stepped West Spectator Pavilion along Cricket Stadium edge
    for (let st = 0; st < 4; st += 1) {
      const stepW = 6.2 - st * 1.1;
      const tier = new THREE.Mesh(new THREE.BoxGeometry(stepW, 0.72, 42), mats.concreteMuted);
      const sx = -45.5 - st * 0.55;
      tier.position.set(
        building.center[0] + sx * Math.cos(building.angle),
        0.36 + st * 0.72,
        building.center[1] + sx * Math.sin(building.angle)
      );
      tier.rotation.y = -building.angle;
      group.add(addShadowProps(tier, true, true));
    }

    if (quality === 'high') {
      const corners = [[-40, -68], [40, -68], [-40, 68], [40, 68]];
      corners.forEach(([lx, lz]) => {
        const wx = building.center[0] + lx * Math.cos(building.angle) - lz * Math.sin(building.angle);
        const wz = building.center[1] + lx * Math.sin(building.angle) + lz * Math.cos(building.angle);
        const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.48, 22, 8), mats.darkMetal);
        mast.position.set(wx, 11, wz);
        const head = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.5, 0.65), mats.kluWhiteConcrete);
        head.position.set(wx, 22.3, wz);
        head.lookAt(building.center[0], 2, building.center[1]);
        const lampFace = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.1, 0.12), mats.lampGlow);
        lampFace.position.set(wx, 22.3, wz);
        lampFace.lookAt(building.center[0], 2, building.center[1]);
        lampFace.translateZ(0.34);
        group.add(addShadowProps(mast, true, false), addShadowProps(head, true, false), lampFace);
      });
    }
    tagBuildingGroup(group, building);
    return group;
  }

  // =========================================================================
  // 2. SWIMMING POOL
  // =========================================================================
  if (building.id === 'swimming-pool') {
    const deckGeo = extrudeFootprintGeo(poly, 0.45, 0, { bakeAO: false });
    group.add(addShadowProps(new THREE.Mesh(deckGeo, mats.limestone), true, true));
    const waterPts = insetPolygonXZ(poly, 3.6);
    const poolGeo = new THREE.ShapeGeometry(createShapeFromXZ(waterPts), 6);
    poolGeo.rotateX(-Math.PI / 2);
    poolGeo.translate(0, 0.47, 0);
    group.add(addShadowProps(new THREE.Mesh(poolGeo, mats.poolWater), false, true));

    const pavPts = localRectToXZ(building.center, building.angle, 0, -building.d * 0.42, building.w * 0.72, 6.0);
    const pavGeo = extrudeFootprintGeo(pavPts, 3.6, 0.45);
    group.add(addShadowProps(new THREE.Mesh(pavGeo, [mats.roofConcrete, mats.kluWhiteConcrete]), true, true));
    tagBuildingGroup(group, building);
    return group;
  }

  // Remaining 24 architectural campus structures mount asynchronously via `kluAssetLoader` as dual-LOD GLB models
  tagBuildingGroup(group, building);
  return group;
}

/**
 * Surrounding Vaddeswaram Residential Cottages (Instanced from recessed-window GLB prototype!)
 */
async function buildSurroundingContext(scene, assetLoader) {
  if (!KLU_SURROUNDING_CONTEXT || !KLU_SURROUNDING_CONTEXT.length) return;
  try {
    const parts = await assetLoader.loadPrototypeGlbMeshes('/assets/models/vaddeswaram_house.glb');
    const count = KLU_SURROUNDING_CONTEXT.length;
    const dummy = new THREE.Object3D();

    parts.forEach(({ geometry, material }) => {
      const inst = new THREE.InstancedMesh(geometry, material, count);
      KLU_SURROUNDING_CONTEXT.forEach((b, i) => {
        const h = (b.h || 7.2) + ((i * 5) % 5) * 0.35;
        dummy.rotation.y = -(b.ang || 0);
        dummy.scale.set((b.w || 10) * 0.94, h, (b.d || 9) * 0.94);
        dummy.position.set(b.c[0], 0, b.c[1]);
        dummy.updateMatrix();
        inst.setMatrixAt(i, dummy.matrix);
      });
      inst.instanceMatrix.needsUpdate = true;
      scene.add(addShadowProps(inst, true, true));
    });
  } catch (err) {
    console.warn('Context cottage GLB instancing skipped:', err);
  }
}

/**
 * Photorealistic Alpha-Cutout Crossed-Cluster Rain Trees, Flowering Gulmohars,
 * Pinnate Feathered Palms & Botanical Garden Shrubs (zero opaque icosahedron spheres!).
 */
function createBotanicalGeometries() {
  // 1. Samanea saman / Gulmohar Forked Woody Trunk & Secondary Limb Structure (mapped w/ barkMap + barkNormalMap)
  const trunkParts = [];
  const mainTrunk = new THREE.CylinderGeometry(0.24, 0.46, 4.2, 8);
  mainTrunk.translate(0, 2.1, 0);
  trunkParts.push(mainTrunk);

  const limbs = [
    [0.54, 0.35, -0.35, 3.2],
    [-0.56, 0.4, 0.25, 3.1],
    [0.14, 0.42, 0.62, 2.9],
    [-0.22, 0.38, -0.58, 2.9],
    [0.36, 1.9, 0.42, 2.4]
  ];
  limbs.forEach(([rx, ry, rz, len]) => {
    const branch = new THREE.CylinderGeometry(0.09, 0.21, len, 7);
    branch.translate(0, len * 0.5, 0);
    branch.rotateX(rx);
    branch.rotateZ(rz);
    branch.rotateY(ry);
    branch.translate(0, 3.55, 0);
    trunkParts.push(branch);
  });
  const rainTrunkGeo = safeMerge(trunkParts);

  // Build organic crossed-card foliage umbrella cluster around branch tips (`rainLeafAtlasMap` / `gulmoharLeafAtlasMap`)
  const crownCards = [];
  const cTop = new THREE.Color(0xc8d9a8);
  const cMid = new THREE.Color(0x9cb87c);
  const cBot = new THREE.Color(0x566e40);

  const clusterCenters = [
    [0, 6.8, 0, 4.4],
    [2.3, 5.9, 1.1, 3.7],
    [-2.4, 6.0, 0.9, 3.8],
    [0.9, 5.8, -2.2, 3.7],
    [-1.2, 6.1, -2.0, 3.6],
    [2.5, 5.4, -1.4, 3.3],
    [-2.2, 5.5, 2.1, 3.4],
    [0.3, 7.6, -0.4, 3.5],
    [1.2, 6.4, 2.3, 3.4],
    [-0.8, 7.2, 1.4, 3.2],
    [1.8, 7.0, -0.6, 3.2]
  ];

  clusterCenters.forEach(([cx, cy, cz, scale], clIdx) => {
    for (let k = 0; k < 3; k += 1) {
      const card = new THREE.PlaneGeometry(scale, scale * 0.86);
      const yaw = (k / 3) * Math.PI + clIdx * 0.63;
      const tilt = (k % 2 === 0 ? 1 : -1) * 0.34;
      card.rotateX(tilt);
      card.rotateY(yaw);
      card.translate(cx, cy, cz);

      const pos = card.attributes.position;
      const cols = new Float32Array(pos.count * 3);
      for (let i = 0; i < pos.count; i += 1) {
        const y = pos.getY(i);
        const rXZ = Math.hypot(pos.getX(i), pos.getZ(i));
        const hFrac = Math.max(0, Math.min(1, (y - 4.4) / 4.2));
        const radBoost = Math.min(0.25, rXZ * 0.045);
        const col = hFrac < 0.45
          ? cBot.clone().lerp(cMid, hFrac / 0.45)
          : cMid.clone().lerp(cTop, Math.min(1, (hFrac - 0.45) / 0.55 + radBoost));
        cols[i * 3] = col.r;
        cols[i * 3 + 1] = col.g;
        cols[i * 3 + 2] = col.b;
      }
      card.setAttribute('color', new THREE.BufferAttribute(cols, 3));
      crownCards.push(card);
    }
    // Horizontal dome canopy umbrella card so aerial nadir views see lush feathery foliage crowns too!
    const topCap = new THREE.PlaneGeometry(scale * 1.05, scale * 1.05);
    topCap.rotateX(-Math.PI * 0.5 + (clIdx % 2 === 0 ? 0.14 : -0.14));
    topCap.rotateY(clIdx * 0.77);
    topCap.translate(cx, cy + scale * 0.14, cz);
    const capCnt = topCap.attributes.position.count;
    const capCol = new Float32Array(capCnt * 3);
    for (let i = 0; i < capCnt; i += 1) {
      const col = clIdx === 0 || clIdx === 7 ? cTop : cMid;
      capCol[i * 3] = col.r;
      capCol[i * 3 + 1] = col.g;
      capCol[i * 3 + 2] = col.b;
    }
    topCap.setAttribute('color', new THREE.BufferAttribute(capCol, 3));
    crownCards.push(topCap);
  });
  const rainCrownGeo = safeMerge(crownCards);

  // 2. Curved 3D Coastal Feather Palm (`barkMap` Trunk + Crownshaft + 16 Pinnate Alpha-Cutout Feathered Fronds!)
  const palmSegs = 5;
  const palmTrunkParts = [];
  let prevX = 0;
  let prevY = 0;
  for (let s = 0; s < palmSegs; s += 1) {
    const t0 = s / palmSegs;
    const t1 = (s + 1) / palmSegs;
    const x0 = Math.pow(t0, 1.8) * 0.55;
    const x1 = Math.pow(t1, 1.8) * 0.55;
    const y0 = t0 * 7.2;
    const y1 = t1 * 7.2;
    const segLen = Math.hypot(x1 - x0, y1 - y0);
    const rBot = 0.24 - t0 * 0.09;
    const rTop = 0.24 - t1 * 0.09;
    const segGeo = new THREE.CylinderGeometry(rTop, rBot, segLen + 0.08, 7);
    segGeo.translate(0, segLen * 0.5, 0);
    segGeo.rotateZ(-Math.atan2(x1 - x0, y1 - y0));
    segGeo.translate(x0, y0, 0);
    palmTrunkParts.push(segGeo);
    prevX = x1;
    prevY = y1;
  }
  const palmTrunkGeo = safeMerge(palmTrunkParts);

  const crownShaft = new THREE.CylinderGeometry(0.16, 0.19, 1.05, 8);
  crownShaft.translate(prevX, prevY + 0.48, 0);

  const frondGeos = [];
  const cStem = new THREE.Color(0xd2e4a8);
  const cLeafTip = new THREE.Color(0x98b874);
  const frondSpecs = [];
  for (let k = 0; k < 5; k += 1) frondSpecs.push({ az: (k / 5) * Math.PI * 2 + 0.18, rise: 1.68, span: 2.75, droop: -0.35 });
  for (let k = 0; k < 6; k += 1) frondSpecs.push({ az: (k / 6) * Math.PI * 2 + 0.72, rise: 1.05, span: 3.45, droop: -1.25 });
  for (let k = 0; k < 5; k += 1) frondSpecs.push({ az: (k / 5) * Math.PI * 2 + 0.48, rise: 0.42, span: 3.65, droop: -1.95 });

  frondSpecs.forEach(({ az, rise, span, droop }) => {
    const segs = 8;
    const posArr = [];
    const uvArr = [];
    const colArr = [];

    const pt = (t) => {
      const r = t * span;
      const archY = Math.sin(t * Math.PI * 0.82) * rise + t * t * droop;
      const wHalf = Math.sin(Math.pow(t, 0.68) * Math.PI) * 0.78 + 0.08;
      const sagY = -0.26 * (wHalf / 0.86);
      return { r, y: archY, wHalf, sagY };
    };

    for (let s = 0; s < segs; s += 1) {
      const t0 = s / segs;
      const t1 = (s + 1) / segs;
      const p0 = pt(t0);
      const p1 = pt(t1);
      const c0 = cStem.clone().lerp(cLeafTip, t0);
      const c1 = cStem.clone().lerp(cLeafTip, t1);

      // Left pinnate leaflet half (u: 0.5 center rachis -> 0.0 outer margin, v: t0 -> t1)
      posArr.push(
        0, p0.y, p0.r, -p0.wHalf, p0.y + p0.sagY, p0.r, 0, p1.y, p1.r,
        -p0.wHalf, p0.y + p0.sagY, p0.r, -p1.wHalf, p1.y + p1.sagY, p1.r, 0, p1.y, p1.r
      );
      uvArr.push(
        0.5, t0, 0.0, t0, 0.5, t1,
        0.0, t0, 0.0, t1, 0.5, t1
      );

      // Right pinnate leaflet half (u: 0.5 center rachis -> 1.0 outer margin, v: t0 -> t1)
      posArr.push(
        0, p0.y, p0.r, 0, p1.y, p1.r, p0.wHalf, p0.y + p0.sagY, p0.r,
        p0.wHalf, p0.y + p0.sagY, p0.r, 0, p1.y, p1.r, p1.wHalf, p1.y + p1.sagY, p1.r
      );
      uvArr.push(
        0.5, t0, 0.5, t1, 1.0, t0,
        1.0, t0, 0.5, t1, 1.0, t1
      );

      const segCols = [
        cStem, c0, cStem, c0, c1, cStem,
        cStem, cStem, c0, c0, cStem, c1
      ];
      segCols.forEach((c) => colArr.push(c.r, c.g, c.b));
    }

    const fGeo = new THREE.BufferGeometry();
    fGeo.setAttribute('position', new THREE.Float32BufferAttribute(posArr, 3));
    fGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvArr, 2));
    fGeo.setAttribute('color', new THREE.Float32BufferAttribute(colArr, 3));
    fGeo.computeVertexNormals();
    fGeo.rotateY(az);
    fGeo.translate(prevX, prevY + 0.96, 0);
    frondGeos.push(fGeo);
  });
  const palmFrondGeo = safeMerge(frondGeos);

  // 3. Crossed Botanical Shrub / Planter Fern Clusters (`shrubAtlasMap`, zero lumpy green spheres!)
  const shrubCards = [];
  for (let b = 0; b < 6; b += 1) {
    const shCard = new THREE.PlaneGeometry(1.55, 1.15);
    shCard.rotateX((b % 2 === 0 ? 1 : -1) * 0.24);
    shCard.rotateY((b / 6) * Math.PI);
    shCard.translate(0, 0.54, 0);
    const cnt = shCard.attributes.position.count;
    const sc = new Float32Array(cnt * 3);
    const pos = shCard.attributes.position;
    for (let i = 0; i < cnt; i += 1) {
      const f = Math.min(1, pos.getY(i) / 1.05);
      const col = cBot.clone().lerp(cTop, f);
      sc[i * 3] = col.r;
      sc[i * 3 + 1] = col.g;
      sc[i * 3 + 2] = col.b;
    }
    shCard.setAttribute('color', new THREE.BufferAttribute(sc, 3));
    shrubCards.push(shCard);
  }
  const shrubGeo = safeMerge(shrubCards);

  return { rainTrunkGeo, rainCrownGeo, palmTrunkGeo, crownShaft, palmFrondGeo, shrubGeo };
}

function buildCampusTrees(scene, mats, quality = 'high') {
  const { rainTrunkGeo, rainCrownGeo, palmTrunkGeo, crownShaft, palmFrondGeo, shrubGeo } = createBotanicalGeometries();
  const rainTrees = [];
  const palms = [];
  const shrubs = [];
  let seed = 4219;
  const rand = () => {
    seed = (seed * 48271) % 2147483647;
    return seed / 2147483647;
  };

  // A. Avenue Rain Trees along KLU Campus & Boundary Wall (`klufl_26_gate.jpg`, `yt_official_max.jpg`)
  KLU_ROADS.forEach((road) => {
    if (road.kind !== 'avenue' && road.kind !== 'highway') return;
    const pts = road.pts;
    for (let i = 0; i < pts.length - 1; i += 1) {
      const dx = pts[i + 1][0] - pts[i][0];
      const dz = pts[i + 1][1] - pts[i][1];
      const len = Math.hypot(dx, dz);
      if (len < 12) continue;
      const nx = -dz / len;
      const nz = dx / len;
      const step = road.kind === 'highway' ? 19 : 16;
      const offset = road.kind === 'highway' ? 8.2 : 6.4;
      const steps = Math.floor(len / step);
      for (let s = 0; s < steps; s += 1) {
        const t = (s + 0.5) / steps;
        const bx = pts[i][0] + dx * t;
        const bz = pts[i][1] + dz * t;
        if (bx < -490 || bx > 580 || bz < -350 || bz > 350) continue;
        [-1, 1].forEach((side) => {
          if (rand() > 0.72) return;
          const tx = bx + nx * offset * side + (rand() - 0.5) * 2.2;
          const tz = bz + nz * offset * side + (rand() - 0.5) * 2.2;
          if (!isClearForVegetation(tx, tz, 4.2, 4.8)) return;
          if (rand() < 0.24 && tx > -280) {
            palms.push({ x: tx, z: tz, s: 0.95 + rand() * 0.42, rot: rand() * Math.PI * 2 });
          } else {
            rainTrees.push({ x: tx, z: tz, s: 0.92 + rand() * 0.55, rot: rand() * Math.PI * 2, shade: 0.82 + rand() * 0.34 });
          }
        });
      }
    }
  });

  // B. East Woodland Grove (`eastWoodlandGrove`), Hostels Lawn Groves & KGH Palm Court (`kgh.jpg`)
  if (KLU_GROUNDS.eastWoodlandGrove) {
    const eg = KLU_GROUNDS.eastWoodlandGrove;
    for (let i = 0; i < (quality === 'high' ? 84 : 45); i += 1) {
      const tx = eg.center[0] + (rand() - 0.5) * eg.w * 1.1;
      const tz = eg.center[1] + (rand() - 0.5) * eg.d * 1.1;
      if (isClearForVegetation(tx, tz, 3.8, 3.8)) {
        rainTrees.push({ x: tx, z: tz, s: 0.95 + rand() * 0.65, rot: rand() * Math.PI * 2, shade: 0.76 + rand() * 0.36 });
      }
    }
  }

  // Library Plaza Palms (`library01.jpg`), FED Front Palms (`klufl_02_admin.jpg`), C Block Palms (`klufl_04_cse.jpg`) & KGH Courtyard (`kgh.jpg`)
  const palmZones = [
    { cx: -178, cz: 38, w: 18, d: 18, n: 6 },    // Library south garden palms (keeps front steps sightline clean!)
    { cx: -178, cz: -4, w: 18, d: 16, n: 6 },    // Library north garden palms
    { cx: -222, cz: 92, w: 32, d: 28, n: 16 },   // FED / Admin park
    { cx: -128, cz: 128, w: 58, d: 18, n: 14 },  // C-Block checkered lawn mall
    { cx: -266, cz: -88, w: 24, d: 24, n: 10 },  // KGH courtyard palms
    { cx: 145, cz: 92, w: 24, d: 52, n: 16 },    // Himalaya promenade
    { cx: 360, cz: 102, w: 45, d: 62, n: 16 }    // Tulip / Lotus avenue
  ];
  palmZones.forEach((pz) => {
    for (let i = 0; i < pz.n; i += 1) {
      const px = pz.cx + (rand() - 0.5) * pz.w;
      const pzCoord = pz.cz + (rand() - 0.5) * pz.d;
      if (isClearForVegetation(px, pzCoord, 2.8, 2.6)) {
        palms.push({ x: px, z: pzCoord, s: 0.92 + rand() * 0.42, rot: rand() * Math.PI * 2 });
      }
    }
  });

  // Campus Courtyard & Park Rain Trees (Lush campus green canopy clusters around lawns & hostels)
  const campusGroves = [
    { cx: -175, cz: -42, w: 50, d: 45, n: 22 },  // NW Library / Indoor Stadium greenspace
    { cx: -48, cz: -28, w: 55, d: 35, n: 18 },   // Central green belt north of Arts Block
    { cx: 142, cz: -38, w: 68, d: 45, n: 24 },   // East of Cricket Oval & north of Himalaya
    { cx: 295, cz: -48, w: 95, d: 50, n: 26 },   // Avenue toward Bus Bay
    { cx: 230, cz: 158, w: 110, d: 35, n: 22 },  // South hostel greenspace
    { cx: -325, cz: -105, w: 36, d: 90, n: 24 }  // West campus avenue / KGH belt
  ];
  campusGroves.forEach((cg) => {
    for (let i = 0; i < (quality === 'high' ? cg.n : Math.floor(cg.n * 0.55)); i += 1) {
      const tx = cg.cx + (rand() - 0.5) * cg.w;
      const tz = cg.cz + (rand() - 0.5) * cg.d;
      if (isClearForVegetation(tx, tz, 4.0, 4.2)) {
        rainTrees.push({ x: tx, z: tz, s: 1.32 + rand() * 0.68, rot: rand() * Math.PI * 2, shade: 0.78 + rand() * 0.32 });
      }
    }
  });

  // C. Krishna Canal Embankment Dense Levee Grove + Toddy Palms (`klufl_50_gate_ext.jpg`)
  for (let i = 0; i < 85; i += 1) {
    const t = i / 84;
    const pA = KLU_CANAL_PATH[0];
    const pB = KLU_CANAL_PATH[2];
    const bx = pA[0] + (pB[0] - pA[0]) * t;
    const bz = pA[1] + (pB[1] - pA[1]) * t;
    const side = i % 2 === 0 ? -1 : 1;
    const dist = 31 + rand() * 14;
    const nx = 0.84;
    const nz = -0.54;
    const tx = bx + nx * dist * side + (rand() - 0.5) * 6;
    const tz = bz + nz * dist * side + (rand() - 0.5) * 6;
    if (rand() < 0.38) {
      palms.push({ x: tx, z: tz, yOff: 1.0, s: 1.15 + rand() * 0.45, rot: rand() * Math.PI * 2 });
    } else {
      rainTrees.push({ x: tx, z: tz, yOff: 0.9, s: 1.45 + rand() * 0.75, rot: rand() * Math.PI * 2, shade: 0.78 + rand() * 0.3 });
    }
  }

  // Outer Perimeter & Farmland Grove Clusters
  for (let i = 0; i < (quality === 'high' ? 160 : 80); i += 1) {
    const ang = rand() * Math.PI * 2;
    const dist = 340 + rand() * 520;
    const tx = 80 + Math.cos(ang) * dist;
    const tz = 10 + Math.sin(ang) * (dist * 0.68);
    if (isClearForVegetation(tx, tz, 4.5, 4.5)) {
      rainTrees.push({ x: tx, z: tz, s: 1.38 + rand() * 0.82, rot: rand() * Math.PI * 2, shade: 0.75 + rand() * 0.34 });
    }
  }

  // D. Building Forecourt Planter Ferns & Hedges (`Library`, `R&D`, `C Block`, `Main Gate`)
  // Place dedicated elevated fern tufts right inside Central Library's front stone planters (`library01.jpg`)!
  const libCenter = [-129.44, 16.84];
  const libAngle = -0.1017;
  const libW = 49.09;
  [-16.8, 16.8].forEach((zOff) => {
    for (let k = -2; k <= 2; k += 1) {
      const lx = -libW * 0.5 - 1.6 + (k % 2) * 0.45;
      const lz = zOff + k * 1.1;
      const wx = libCenter[0] + lx * Math.cos(libAngle) - lz * Math.sin(libAngle);
      const wz = libCenter[1] + lx * Math.sin(libAngle) + lz * Math.cos(libAngle);
      shrubs.push({ x: wx, yOff: 1.02, z: wz, s: 0.82 + rand() * 0.34, rot: rand() * Math.PI * 2 });
    }
  });

  const shrubClusters = [
    { cx: -127, cz: 128, w: 62, d: 16, n: 42 },
    { cx: -16, cz: 128, w: 18, d: 34, n: 26 },
    { cx: -292, cz: 25, w: 12, d: 34, n: 26 },
    { cx: -232, cz: 88, w: 32, d: 20, n: 28 }
  ];
  shrubClusters.forEach((sc) => {
    for (let i = 0; i < sc.n; i += 1) {
      const sx = sc.cx + (rand() - 0.5) * sc.w;
      const sz = sc.cz + (rand() - 0.5) * sc.d;
      if (isClearForVegetation(sx, sz, 1.5, 2.2)) {
        shrubs.push({ x: sx, yOff: 0, z: sz, s: 0.84 + rand() * 0.62, rot: rand() * Math.PI * 2 });
      }
    }
  });

  const dummy = new THREE.Object3D();
  const cInstance = new THREE.Color();

  const createAlphaDepthMat = (tex, alphaTest = 0.42) => new THREE.MeshDepthMaterial({
    depthPacking: THREE.RGBADepthPacking,
    map: tex,
    alphaTest,
    side: THREE.DoubleSide
  });

  // Instanced Mature Rain Trees (~78%) & Flowering Gulmohars (~22%) with alpha-cutout leaf cluster crowns!
  if (rainTrees.length) {
    const rainGroup = rainTrees.filter((_, idx) => idx % 5 !== 0);
    const gulmoharGroup = rainTrees.filter((_, idx) => idx % 5 === 0);

    const spawnCanopyGroup = (list, crownMat, depthMat) => {
      if (!list.length) return;
      const trunks = new THREE.InstancedMesh(rainTrunkGeo, mats.foliageTrunk, list.length);
      const crowns = new THREE.InstancedMesh(rainCrownGeo, crownMat, list.length);
      list.forEach((t, idx) => {
        const sc = t.s * 1.28;
        dummy.position.set(t.x, t.yOff || 0, t.z);
        dummy.rotation.set(0, t.rot, 0);
        dummy.scale.set(sc, sc * (0.9 + (idx % 3) * 0.08), sc);
        dummy.updateMatrix();
        trunks.setMatrixAt(idx, dummy.matrix);
        crowns.setMatrixAt(idx, dummy.matrix);
        cInstance.setRGB(t.shade, t.shade * 1.02, t.shade * 0.95);
        crowns.setColorAt(idx, cInstance);
      });
      trunks.instanceMatrix.needsUpdate = true;
      crowns.instanceMatrix.needsUpdate = true;
      if (crowns.instanceColor) crowns.instanceColor.needsUpdate = true;
      crowns.customDepthMaterial = depthMat;
      scene.add(addShadowProps(trunks, true, true), addShadowProps(crowns, true, true));
    };

    spawnCanopyGroup(rainGroup, mats.foliageRainLeaf, createAlphaDepthMat(mats.foliageRainLeaf.map, 0.42));
    spawnCanopyGroup(gulmoharGroup, mats.foliageGulmoharLeaf, createAlphaDepthMat(mats.foliageGulmoharLeaf.map, 0.42));
  }

  // Instanced Curved 3D Feathered Palms
  if (palms.length) {
    const pTrunks = new THREE.InstancedMesh(palmTrunkGeo, mats.foliageTrunk, palms.length);
    const pCollar = new THREE.InstancedMesh(crownShaft, mats.palmCrownshaft, palms.length);
    const pFronds = new THREE.InstancedMesh(palmFrondGeo, mats.palmFrondLeaf, palms.length);
    pFronds.customDepthMaterial = createAlphaDepthMat(mats.palmFrondLeaf.map, 0.38);
    palms.forEach((p, idx) => {
      dummy.position.set(p.x, p.yOff || 0, p.z);
      dummy.rotation.set(0, p.rot, 0);
      dummy.scale.set(p.s, p.s, p.s);
      dummy.updateMatrix();
      pTrunks.setMatrixAt(idx, dummy.matrix);
      pCollar.setMatrixAt(idx, dummy.matrix);
      pFronds.setMatrixAt(idx, dummy.matrix);
    });
    [pTrunks, pCollar, pFronds].forEach((m) => {
      m.instanceMatrix.needsUpdate = true;
      scene.add(addShadowProps(m, true, true));
    });
  }

  // Instanced Botanical Shrubs & Planter Ferns (alpha-masked spray cards)
  if (shrubs.length) {
    const shInst = new THREE.InstancedMesh(shrubGeo, mats.foliageShrubLeaf, shrubs.length);
    shInst.customDepthMaterial = createAlphaDepthMat(mats.foliageShrubLeaf.map, 0.42);
    shrubs.forEach((s, idx) => {
      dummy.position.set(s.x, s.yOff || 0, s.z);
      dummy.rotation.set(0, s.rot, 0);
      dummy.scale.set(s.s * 1.25, s.s, s.s * 1.25);
      dummy.updateMatrix();
      shInst.setMatrixAt(idx, dummy.matrix);
    });
    shInst.instanceMatrix.needsUpdate = true;
    scene.add(addShadowProps(shInst, true, true));
  }
}

/**
 * Campus Streetlights, Multi-Part Teak Park Benches & Pedestrian Courtyard Bollards
 */
function buildCampusFurniture(scene, mats, quality) {
  const lampPts = [];
  KLU_ROADS.forEach((r) => {
    if (r.kind !== 'avenue') return;
    for (let i = 0; i < r.pts.length - 1; i += 1) {
      const a = r.pts[i];
      const b = r.pts[i + 1];
      if (Math.hypot(b[0] - a[0], b[1] - a[1]) > 14 && a[0] > -350 && a[0] < 500) {
        const dx = b[0] - a[0];
        const dz = b[1] - a[1];
        const l = Math.hypot(dx, dz);
        const lx = (a[0] + b[0]) * 0.5 + (-dz / l) * 4.6;
        const lz = (a[1] + b[1]) * 0.5 + (dx / l) * 4.6;
        // Keep streetlamp poles strictly clear of all 7 Ground Tour camera sightlines!
        const blocksCamera = GROUND_CAMERA_CLEARANCE.some(([cx, cz]) => Math.hypot(lx - cx, lz - cz) < 12.0);
        if (blocksCamera) continue;
        if (lx > -175 && lx < -148 && lz > 0 && lz < 34) continue;
        if (lx > -26 && lx < 14 && lz > 104 && lz < 156) continue;
        lampPts.push([lx, lz]);
      }
    }
  });

  if (lampPts.length) {
    const filteredLamps = quality === 'high' ? lampPts.slice(0, 72) : lampPts.slice(0, 28);
    const poleGeo = new THREE.CylinderGeometry(0.08, 0.12, 5.4, 6);
    const armGeo = new THREE.BoxGeometry(0.9, 0.09, 0.09);
    const bulbGeo = new THREE.BoxGeometry(0.65, 0.12, 0.32);
    const poles = new THREE.InstancedMesh(poleGeo, mats.darkMetal, filteredLamps.length);
    const arms = new THREE.InstancedMesh(armGeo, mats.darkMetal, filteredLamps.length);
    const bulbs = new THREE.InstancedMesh(bulbGeo, mats.lampGlow, filteredLamps.length);
    const dummy = new THREE.Object3D();
    filteredLamps.forEach(([lx, lz], i) => {
      dummy.rotation.set(0, 0, 0);
      dummy.position.set(lx, 2.7, lz);
      dummy.updateMatrix();
      poles.setMatrixAt(i, dummy.matrix);
      dummy.position.set(lx + 0.35, 5.36, lz);
      dummy.updateMatrix();
      arms.setMatrixAt(i, dummy.matrix);
      dummy.position.set(lx + 0.6, 5.3, lz);
      dummy.updateMatrix();
      bulbs.setMatrixAt(i, dummy.matrix);
    });
    poles.instanceMatrix.needsUpdate = true;
    arms.instanceMatrix.needsUpdate = true;
    bulbs.instanceMatrix.needsUpdate = true;
    scene.add(addShadowProps(poles, true, false), addShadowProps(arms, true, false), bulbs);
  }

  // Multi-part Cast-Iron + Slatted Teak Park Benches across Plazas & Lawns
  const benchSpots = [
    [-172, 2, 0.1], [-172, 33, 0.1], [-132, 120, 0], [-115, 120, 0],
    [-15, 110, 1.5], [-15, 148, 1.5], [-42, 92, 0], [156, 86, 1.4]
  ];
  const frameGeo = new THREE.BoxGeometry(0.08, 0.44, 0.56);
  const legFrames = new THREE.InstancedMesh(frameGeo, mats.darkMetal, benchSpots.length * 2);
  const seatSlats = new THREE.InstancedMesh(new THREE.BoxGeometry(1.88, 0.08, 0.54), mats.timberCanopy, benchSpots.length);
  const backSlats = new THREE.InstancedMesh(new THREE.BoxGeometry(1.88, 0.32, 0.07), mats.timberCanopy, benchSpots.length);
  const dummy = new THREE.Object3D();
  benchSpots.forEach(([bx, bz, ry], i) => {
    const cosR = Math.cos(ry);
    const sinR = Math.sin(ry);
    [-0.78, 0.78].forEach((lx, legIdx) => {
      dummy.position.set(bx + lx * cosR, 0.22, bz - lx * sinR);
      dummy.rotation.set(0, ry, 0);
      dummy.updateMatrix();
      legFrames.setMatrixAt(i * 2 + legIdx, dummy.matrix);
    });
    dummy.position.set(bx, 0.45, bz);
    dummy.rotation.set(0, ry, 0);
    dummy.updateMatrix();
    seatSlats.setMatrixAt(i, dummy.matrix);
    dummy.position.set(bx - 0.22 * sinR, 0.74, bz - 0.22 * cosR);
    dummy.rotation.set(-0.14, ry, 0);
    dummy.updateMatrix();
    backSlats.setMatrixAt(i, dummy.matrix);
  });
  [legFrames, seatSlats, backSlats].forEach((m) => {
    m.instanceMatrix.needsUpdate = true;
    scene.add(addShadowProps(m, true, true));
  });

  // Illuminated Walkway Bollards lining Central Library Steps & R&D Block Forecourt Plaza
  const bollardPts = [
    [-165, 6], [-164, 15], [-163, 24], [-162, 33],
    [-14, 108], [-12, 120], [-10, 132], [-8, 144]
  ];
  const bolBase = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.08, 0.09, 0.76, 8), mats.darkMetal, bollardPts.length);
  const bolRing = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.075, 0.075, 0.14, 8), mats.lampGlow, bollardPts.length);
  bollardPts.forEach(([bx, bz], i) => {
    dummy.rotation.set(0, 0, 0);
    dummy.position.set(bx, 0.38, bz);
    dummy.updateMatrix();
    bolBase.setMatrixAt(i, dummy.matrix);
    dummy.position.set(bx, 0.78, bz);
    dummy.updateMatrix();
    bolRing.setMatrixAt(i, dummy.matrix);
  });
  bolBase.instanceMatrix.needsUpdate = true;
  bolRing.instanceMatrix.needsUpdate = true;
  scene.add(addShadowProps(bolBase, true, true), bolRing);
}

export function buildCampusSceneGraph(scene, textures, quality = 'high', sunDirection = new THREE.Vector3(0.5, 0.75, 0.4)) {
  const mats = createArchitecturalMaterials(textures);
  const terrainResult = buildTerrainAndRoads(scene, mats, textures, quality, sunDirection);
  const assetLoader = createKluAssetLoader(textures);
  const lods = [];
  const lodDist = quality === 'high' ? 245 : 145;

  const buildingGroups = new Map();
  const glbPromises = [];

  KLU_BUILDINGS.forEach((b) => {
    const grp = buildDetailedCampusBuilding(b, mats, quality);
    scene.add(grp);
    buildingGroups.set(b.id, grp);

    // Sports fields (`cricket-ground`, `swimming-pool`) are terrain-flush procedural shapes; all 24 buildings load as binary GLB LODs
    if (b.id !== 'cricket-ground' && b.id !== 'swimming-pool') {
      const fileName = b.id.replace(/-/g, '_');
      const p = assetLoader
        .loadBuildingGlbLOD(`/assets/models/${fileName}.glb`, b, lodDist)
        .then((lod) => {
          grp.add(lod);
          tagBuildingGroup(grp, b);
          lods.push(lod);
          return lod;
        })
        .catch((err) => {
          console.warn(`GLB load warning (${b.id}):`, err);
          return null;
        });
      glbPromises.push(p);
    }
  });

  glbPromises.push(buildSurroundingContext(scene, assetLoader));
  const readyPromise = Promise.all(glbPromises);

  buildCampusTrees(scene, mats, quality);
  buildCampusFurniture(scene, mats, quality);

  // Ensure every mesh rendered with a vertexColors-enabled material has valid [1,1,1] color attribute
  scene.traverse((obj) => {
    if ((obj.isMesh || obj.isInstancedMesh) && obj.geometry && obj.geometry.attributes?.position) {
      const matsArr = Array.isArray(obj.material) ? obj.material : [obj.material];
      const needsColor = matsArr.some((m) => m && m.vertexColors);
      if (needsColor && !obj.geometry.attributes.color) {
        const count = obj.geometry.attributes.position.count;
        const white = new Float32Array(count * 3);
        white.fill(1);
        obj.geometry.setAttribute('color', new THREE.BufferAttribute(white, 3));
      }
    }
  });

  const applyThemeLighting = (isDark) => {
    mats.atriumGlass.opacity = isDark ? 0.52 : 0.42;
    mats.curtainGlass.emissive.setHex(isDark ? 0x2c4e6b : 0x05080c);
    mats.curtainGlass.emissiveIntensity = isDark ? 0.54 : 0.04;
    mats.punchedAcademicWall.emissive.setHex(isDark ? 0x4f412e : 0x000000);
    mats.punchedAcademicWall.emissiveIntensity = isDark ? 0.24 : 0.0;
    mats.hostelLoggiaWall.emissive.setHex(isDark ? 0x453826 : 0x000000);
    mats.hostelLoggiaWall.emissiveIntensity = isDark ? 0.24 : 0.0;
    mats.warmInteriorGlow.emissiveIntensity = isDark ? 1.55 : 0.32;
    mats.lampGlow.emissiveIntensity = isDark ? 3.5 : 0.35;
    mats.gateSign.emissiveIntensity = isDark ? 0.72 : 0.05;
    mats.canalWater.color.setHex(isDark ? 0x1b2b26 : 0xb8ccb2);
    mats.canalWater.envMapIntensity = isDark ? 0.12 : 0.25;
    if (assetLoader.sharedMaterials.CurtainGlass) {
      assetLoader.sharedMaterials.CurtainGlass.emissive.setHex(isDark ? 0x2c4e6b : 0x05080c);
      assetLoader.sharedMaterials.CurtainGlass.emissiveIntensity = isDark ? 0.56 : 0.04;
    }
    if (assetLoader.sharedMaterials.RecessedCavityGlass) {
      assetLoader.sharedMaterials.RecessedCavityGlass.emissive.setHex(isDark ? 0x8a612d : 0x000000);
      assetLoader.sharedMaterials.RecessedCavityGlass.emissiveIntensity = isDark ? 0.68 : 0.0;
    }
    if (assetLoader.sharedMaterials.WarmAtriumInterior) {
      assetLoader.sharedMaterials.WarmAtriumInterior.emissiveIntensity = isDark ? 1.55 : 0.36;
    }
  };

  return {
    mats,
    assetLoader,
    lods,
    readyPromise,
    originMeta: KLU_ORIGIN_META,
    buildingGroups,
    animatedWaters: terrainResult.animatedWaters,
    applyThemeLighting
  };
}
