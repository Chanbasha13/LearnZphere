import * as THREE from 'three';
import { KLU_BUILDINGS } from '../data/kluCampusData.js';
import {
  addPolygonExtrusion,
  addWallBox,
  applyBoxWorldUVsAndAO,
  buildCentralLibraryBenchmarkRoot,
  buildCurtainBayAssembly,
  buildDualLodRootFromBuilder,
  buildPolygonBalconyHostel,
  buildPolygonSegmentedAcademicBuilding,
  buildRecessedWindowWall,
  buildRooftopEquipmentAssembly,
  cleanPolyEdges,
  insetPolyLocalXZ
} from './kluModularArch.js';

export function toLocalPolygon(building) {
  const cos = Math.cos(-building.angle);
  const sin = Math.sin(-building.angle);
  return building.polygon.map(([px, pz]) => {
    const dx = px - building.center[0];
    const dz = pz - building.center[1];
    return [dx * cos - dz * sin, dx * sin + dz * cos];
  });
}

function buildSkybridge(buckets, cx, cy, cz, w, d, highDetail) {
  // Covered elevated walkway linking courtyard wings (`yt_solomon_max.jpg`)
  addWallBox(buckets, 'StuccoWhite', w, 0.36, d, cx, cy, cz, [0, 0, 0], 0, { groundY: 0, soffitDark: 0.62 });
  addWallBox(buckets, 'StuccoWhite', w, 0.34, d, cx, cy + 3.05, cz, [0, 0, 0], 0, { groundY: 0, soffitDark: 0.65 });
  addWallBox(buckets, 'CurtainGlass', w - 0.3, 2.7, d - 0.3, cx, cy + 1.52, cz, [0, 0, 0], 0, { groundY: 0 });
  if (highDetail) {
    [-w * 0.32, w * 0.32].forEach((px) => {
      [-d * 0.42, d * 0.42].forEach((pz) => {
        const pillar = new THREE.CylinderGeometry(0.28, 0.32, cy, 10);
        pillar.translate(cx + px, cy * 0.5, cz + pz);
        applyBoxWorldUVsAndAO(pillar, { groundY: 0 });
        buckets.StuccoWhite.push(pillar);
      });
    });
  }
}

/**
 * R&D Block (`aboutus.jpg`): White concrete portal frames, concave/curved center curtain bay,
 * terracotta horizontal spandrels, rectangular stacked-stone portal entrance, 6F charcoal crown w/ thin vertical fins,
 * and right-side vertical colonnade fin annex.
 */
function buildRndBlockRoot(building) {
  const localPoly = toLocalPolygon(building);
  const pts = cleanPolyEdges(localPoly, 2.2);
  const H = building.height; // 23.5m
  const crownBaseY = 17.6;
  const crownH = H - crownBaseY;
  const W = building.w;

  return buildDualLodRootFromBuilder('RND_Block_Real3D', (buckets, highDetail) => {
    // 1. Main Levels 1-5 Curtain Glass Structural Core (`recessed 0.82m inward` inside outer portal frames!)
    const lowerCorePts = insetPolyLocalXZ(pts, 0.82);
    addPolygonExtrusion(buckets, lowerCorePts, crownBaseY, 0, 'RoofSlabConcrete', 'CurtainGlass', { aoMin: 0.78 });

    // Projecting floor slab trim + Terracotta/Salmon Horizontal Spandrel Panels (`aboutus.jpg`)
    for (let fl = 1; fl <= 4; fl += 1) {
      const sy = fl * 3.52;
      addPolygonExtrusion(buckets, insetPolyLocalXZ(pts, 0.56), 0.22, sy - 0.11, 'StuccoWhite', 'StuccoWhite', { aoMin: 0.88 });
      addPolygonExtrusion(buckets, insetPolyLocalXZ(pts, 0.64), 0.62, sy - 0.31, 'TerracottaMetallic', 'TerracottaMetallic', { aoMin: 0.88 });
    }

    // Crisp outer white concrete structural portal frames, dark curtain mullions & wing fin blades across ALL wings
    for (let i = 0; i < pts.length; i += 1) {
      const a = pts[i];
      const b = pts[(i + 1) % pts.length];
      const dx = b[0] - a[0];
      const dz = b[1] - a[1];
      const len = Math.hypot(dx, dz);
      if (len < 3.5) continue;
      const yaw = Math.atan2(-dz, dx);
      const nx = -dz / len;
      const nz = dx / len;
      const mid = [(a[0] + b[0]) * 0.5, 0, (a[1] + b[1]) * 0.5];

      if (len >= 5.2) {
        buildCurtainBayAssembly({
          buckets,
          origin: mid,
          yaw,
          span: len - 0.9,
          height: crownBaseY - 0.3,
          glassInset: 0.62,
          mullionSpacing: highDetail ? 2.6 : 5.2,
          transomRows: 5,
          spandrelBands: true,
          floorH: 3.52,
          groundY: 0
        });
      }

      const numBays = highDetail ? Math.max(1, Math.round(len / 5.4)) : Math.max(1, Math.round(len / 10.0));
      for (let k = 0; k <= numBays; k += 1) {
        const px = -len * 0.5 + (k / numBays) * len;
        const isCorner = k === 0 || k === numBays;
        addWallBox(buckets, 'StuccoWhite', isCorner ? 0.92 : 0.44, crownBaseY, isCorner ? 0.96 : 0.86, px, crownBaseY * 0.5, -0.34, mid, yaw, { groundY: 0 });
      }
      // Flush L5 white concrete portal beam (`sits inside cantilevered charcoal crown above`)
      addWallBox(buckets, 'StuccoWhite', len + 0.3, 0.44, 0.88, 0, crownBaseY - 0.22, -0.34, mid, yaw, { groundY: 0, soffitDark: 0.62 });

      // Vertical louver colonnade fins on prominent South & East research annex faces (`aboutus.jpg`)
      if (len >= 12 && (nz > 0.42 || nx > 0.42)) {
        const finN = highDetail ? Math.max(3, Math.floor(len / 4.0)) : Math.max(2, Math.floor(len / 8.0));
        for (let f = 1; f < finN; f += 1) {
          const fx = -len * 0.5 + (f / finN) * len;
          const bladeMat = f % 2 === 0 ? 'TerracottaMetallic' : 'StuccoWhite';
          addWallBox(buckets, bladeMat, 0.22, crownBaseY - 0.4, 0.72, fx, crownBaseY * 0.5, 0.14, mid, yaw, { groundY: 0 });
        }
      }
    }

    // 2. Signature West Entrance Concrete Portal Frame (`aboutus.jpg`), aligned flush to real -5.8 deg West facade edge!
    // Real West edge runs [-41.45, -50.68] -> [-34.66, +15.73]: center near z = -12, yaw = -1.468 rad
    const westYaw = Math.atan2(-66.41, 6.79);
    const westEdgeMid = [-37.6, 0, -12.0];
    const portalW = 16.5;
    const portalH = 6.4;
    // White concrete outer portal frame surround
    addWallBox(buckets, 'StuccoWhite', portalW, 0.68, 3.2, 0, portalH - 0.34, 0.4, westEdgeMid, westYaw, { groundY: 0, soffitDark: 0.6 });
    addWallBox(buckets, 'StuccoWhite', 0.88, portalH, 3.2, -portalW * 0.5 + 0.44, portalH * 0.5, 0.4, westEdgeMid, westYaw, { groundY: 0 });
    addWallBox(buckets, 'StuccoWhite', 0.88, portalH, 3.2, portalW * 0.5 - 0.44, portalH * 0.5, 0.4, westEdgeMid, westYaw, { groundY: 0 });
    // Warm stacked-stone inner reveal wall + mullioned storefront lobby doors + warm lit interior (`aboutus.jpg`)
    addWallBox(buckets, 'StackedStone', 0.45, portalH - 0.65, 3.6, -portalW * 0.5 + 1.05, (portalH - 0.65) * 0.5, -0.1, westEdgeMid, westYaw, { groundY: 0 });
    addWallBox(buckets, 'ClearAtriumGlass', portalW - 2.2, portalH - 0.7, 0.14, 0, (portalH - 0.7) * 0.5, -1.2, westEdgeMid, westYaw, { groundY: 0 });
    for (let m = -3; m <= 3; m += 1) {
      addWallBox(buckets, 'DarkAnodizedSteel', 0.11, portalH - 0.7, 0.18, m * 2.1, (portalH - 0.7) * 0.5, -1.16, westEdgeMid, westYaw, { groundY: 0 });
    }
    addWallBox(buckets, 'DarkAnodizedSteel', portalW - 2.2, 0.12, 0.2, 0, 2.7, -1.16, westEdgeMid, westYaw, { groundY: 0 });
    addWallBox(buckets, 'RecessedCavityGlass', portalW - 2.4, portalH - 0.8, 0.25, 0, (portalH - 0.8) * 0.5, -2.05, westEdgeMid, westYaw, { groundY: 0 });
    [-3.6, 0, 3.6].forEach((ix) => {
      addWallBox(buckets, 'WarmAtriumInterior', 2.4, portalH - 1.4, 0.2, ix, (portalH - 1.4) * 0.5, -1.92, westEdgeMid, westYaw, { groundY: 0 });
    });
    addWallBox(buckets, 'StuccoWarmTrim', portalW + 1.4, 0.38, 4.6, 0, 0.19, 0.8, westEdgeMid, westYaw, { groundY: 0 });
    [-3.4, 3.4].forEach((lx) => {
      const pCol = new THREE.CylinderGeometry(0.36, 0.4, portalH - 0.6, highDetail ? 12 : 6);
      pCol.translate(lx, (portalH - 0.6) * 0.5, 0.3);
      pCol.rotateY(westYaw);
      pCol.translate(westEdgeMid[0], 0, westEdgeMid[2]);
      applyBoxWorldUVsAndAO(pCol, { groundY: 0 });
      buckets.StuccoWarmTrim.push(pCol);
    });

    // 3. Cantilevered Center Curved Curtain Bay inside Overhanging White Frame Box (`aboutus.jpg`)
    const bayBoxW = 25.0;
    const bayBotY = 6.85;
    const bayTopY = crownBaseY - 0.28;
    const bayH = bayTopY - bayBotY;
    addWallBox(buckets, 'StuccoWhite', bayBoxW, 0.65, 3.0, 0, bayBotY + 0.32, 0.35, westEdgeMid, westYaw, { groundY: 0, soffitDark: 0.62 });
    addWallBox(buckets, 'StuccoWhite', bayBoxW, 0.65, 3.0, 0, bayTopY - 0.32, 0.35, westEdgeMid, westYaw, { groundY: 0 });
    addWallBox(buckets, 'StuccoWhite', 0.72, bayH, 3.0, -bayBoxW * 0.5 + 0.36, bayBotY + bayH * 0.5, 0.35, westEdgeMid, westYaw, { groundY: 0 });
    addWallBox(buckets, 'StuccoWhite', 0.72, bayH, 3.0, bayBoxW * 0.5 - 0.36, bayBotY + bayH * 0.5, 0.35, westEdgeMid, westYaw, { groundY: 0 });

    const segs = highDetail ? 8 : 4;
    for (let s = 0; s < segs; s += 1) {
      const t = (s + 0.5) / segs - 0.5;
      const lx = t * (bayBoxW - 1.5);
      const bulge = Math.cos(t * Math.PI) * 1.35;
      const segW = (bayBoxW - 1.5) / segs;
      addWallBox(buckets, 'CurtainGlass', segW + 0.08, bayH - 1.2, 0.14, lx, bayBotY + bayH * 0.5, 0.3 + bulge, westEdgeMid, westYaw, { groundY: 0 });
      [bayBotY + 2.6, bayBotY + 5.9, bayBotY + 8.8].forEach((ty) => {
        addWallBox(buckets, 'TerracottaMetallic', segW + 0.08, 0.58, 0.24, lx, ty, 0.32 + bulge, westEdgeMid, westYaw, { groundY: 0 });
      });
      if (highDetail) {
        addWallBox(buckets, 'DarkAnodizedSteel', 0.08, bayH - 1.2, 0.2, lx - segW * 0.5, bayBotY + bayH * 0.5, 0.32 + bulge, westEdgeMid, westYaw, { groundY: 0 });
      }
    }

    // 4. Cantilevered 6th-Story Matte Charcoal Crown + Top Clerestory Ribbon + Tall Vertical Roof Fins (`aboutus.jpg`)
    const crownPts = insetPolyLocalXZ(pts, -0.28);
    addPolygonExtrusion(buckets, crownPts, crownH, crownBaseY, 'RoofSlabConcrete', 'CharcoalPrecast', { aoMin: 0.8 });
    const ribbonPts = insetPolyLocalXZ(pts, -0.32);
    addPolygonExtrusion(buckets, ribbonPts, 1.45, crownBaseY + 2.2, 'CharcoalPrecast', 'CurtainGlass', { aoMin: 0.9 });

    // Polygon-conforming charcoal roof parapet (`replaces bounding rectangle so courtyard stays 100% open!`)
    const rndParapetInner = insetPolyLocalXZ(crownPts, 0.42);
    if (rndParapetInner.length >= 3) {
      addPolygonExtrusion(buckets, crownPts, 0.52, H - 0.04, 'DarkAnodizedSteel', 'CharcoalPrecast', { holes: [rndParapetInner], aoMin: 0.85 });
    }

    // Vertical slender precast crown fins projecting above roof parapet (`aboutus.jpg`)
    for (let i = 0; i < crownPts.length; i += 1) {
      const a = crownPts[i];
      const b = crownPts[(i + 1) % crownPts.length];
      const dx = b[0] - a[0];
      const dz = b[1] - a[1];
      const len = Math.hypot(dx, dz);
      if (len < 6) continue;
      const yaw = Math.atan2(-dz, dx);
      const mid = [(a[0] + b[0]) * 0.5, crownBaseY, (a[1] + b[1]) * 0.5];
      const finCount = highDetail ? Math.max(1, Math.floor(len / 4.2)) : Math.max(1, Math.floor(len / 9.0));
      for (let f = 1; f < finCount; f += 1) {
        const fx = -len * 0.5 + (f / finCount) * len;
        addWallBox(buckets, 'StuccoWarmTrim', 0.18, crownH + 1.35, 0.62, fx, (crownH + 1.35) * 0.5, 0.12, mid, yaw, { groundY: crownBaseY });
      }
    }

    buildRooftopEquipmentAssembly({
      buckets,
      w: W * 0.65,
      d: building.d * 0.65,
      roofY: H,
      parapetH: 0.01,
      solarRows: highDetail ? 4 : 2,
      highDetail,
      polyPts: insetPolyLocalXZ(crownPts, 1.4)
    });
  });
}

function buildCBlockRoot(building) {
  const localPoly = toLocalPolygon(building);
  return buildDualLodRootFromBuilder('C_Block_Real3D', (buckets, highDetail) => {
    buildPolygonSegmentedAcademicBuilding({
      localPoly,
      height: building.height,
      floors: 6,
      groundColonnade: true,
      topCurtainFloor: true,
      includeACUnits: true,
      includeSolar: true,
      highDetail,
      buckets
    });

    // Signature recessed glazed staircase slot tower in central courtyard notch
    buildCurtainBayAssembly({
      buckets,
      origin: [-24, 0.4, -10.5],
      yaw: 0,
      span: 6.4,
      height: building.height - 1.2,
      glassInset: 0.25,
      mullionSpacing: 2.1,
      transomRows: 6,
      groundY: 0
    });

    // Courtyard elevated covered walkway skybridge (`yt_solomon_max.jpg`)
    buildSkybridge(buckets, -2, 3.9, -15, 22, 4.2, highDetail);
  });
}

function buildFedBlockRoot(building) {
  const localPoly = toLocalPolygon(building);
  return buildDualLodRootFromBuilder('FED_Block_Real3D', (buckets, highDetail) => {
    buildPolygonSegmentedAcademicBuilding({
      localPoly,
      height: building.height,
      floors: 7,
      doubleCurtainPodium: true,
      pilasterRibs: true,
      includeACUnits: true,
      includeSolar: true,
      highDetail,
      buckets
    });
    // Tucked granite arrival forecourt plinth strictly inside FED Block recessed west entry bay
    addWallBox(buckets, 'StuccoWarmTrim', 4.2, 0.36, 14.0, -20.2, 0.18, 0, [0, 0, 0], 0, { groundY: 0 });
  });
}

function buildSdcBlockRoot(building) {
  const localPoly = toLocalPolygon(building);
  return buildDualLodRootFromBuilder('SDC_Block_Real3D', (buckets, highDetail) => {
    buildPolygonSegmentedAcademicBuilding({
      localPoly,
      height: building.height,
      floors: 8,
      facadeType: 'curtainBriseSoleil',
      includeSolar: true,
      highDetail,
      buckets
    });
  });
}

function buildMBlockRoot(building) {
  const localPoly = toLocalPolygon(building);
  return buildDualLodRootFromBuilder('M_Block_Real3D', (buckets, highDetail) => {
    buildPolygonSegmentedAcademicBuilding({
      localPoly,
      height: building.height,
      floors: 5,
      groundColonnade: true,
      includeACUnits: true,
      includeSolar: true,
      highDetail,
      buckets
    });
    buildCurtainBayAssembly({
      buckets,
      origin: [-14, 0.4, 24],
      yaw: -Math.PI * 0.5,
      span: 5.8,
      height: building.height - 1.0,
      glassInset: 0.24,
      mullionSpacing: 1.9,
      transomRows: 5,
      groundY: 0
    });
  });
}

function buildArtsBlockRoot(building) {
  const localPoly = toLocalPolygon(building);
  return buildDualLodRootFromBuilder('Arts_Block_Real3D', (buckets, highDetail) => {
    buildPolygonSegmentedAcademicBuilding({
      localPoly,
      height: building.height,
      floors: 3,
      groundColonnade: true,
      includeACUnits: true,
      includeSolar: true,
      highDetail,
      buckets
    });
    buildSkybridge(buckets, 0, 3.8, -6, 18, 5.2, highDetail);
  });
}

function buildLinearAcademicRoot(building, floors, { industrialClerestory = false, colonnade = false } = {}) {
  const localPoly = toLocalPolygon(building);
  return buildDualLodRootFromBuilder(`${building.id}_Real3D`, (buckets, highDetail) => {
    buildPolygonSegmentedAcademicBuilding({
      localPoly,
      height: building.height,
      floors,
      groundColonnade: colonnade,
      includeACUnits: false,
      includeSolar: building.w > 40,
      highDetail,
      buckets
    });
    if (industrialClerestory) {
      // Long-span sawtooth/monitor daylight ridge over Mechanical Labs workshop
      addWallBox(buckets, 'SteelVaultRoof', building.w * 0.78, 1.8, 7.2, 0, building.height + 0.9, 0, [0, 0, 0], 0, { groundY: building.height });
      addWallBox(buckets, 'CurtainGlass', building.w * 0.76, 1.25, 7.35, 0, building.height + 0.72, 0, [0, 0, 0], 0, { groundY: building.height });
    }
  });
}

function buildTulipHostelRoot(building) {
  const localPoly = toLocalPolygon(building);
  const hw = building.w * 0.36;
  const hd = building.d * 0.25;
  const holes = [
    [[-hw * 0.5, -hd * 1.4], [hw * 0.5, -hd * 1.4], [hw * 0.5, -hd * 0.2], [-hw * 0.5, -hd * 0.2]].reverse(),
    [[-hw * 0.5, hd * 0.2], [hw * 0.5, hd * 0.2], [hw * 0.5, hd * 1.4], [-hw * 0.5, hd * 1.4]].reverse()
  ];
  return buildDualLodRootFromBuilder('Tulip_Hostel_Real3D', (buckets, highDetail) => {
    buildPolygonBalconyHostel({
      localPoly,
      holes,
      height: building.height,
      floors: 13,
      podiumFloors: 2,
      podiumMat: 'CurtainGlass',
      includeSolar: true,
      highDetail,
      buckets
    });
  });
}

function buildHimalayaHostelRoot(building) {
  const localPoly = toLocalPolygon(building);
  return buildDualLodRootFromBuilder('Himalaya_Hostel_Real3D', (buckets, highDetail) => {
    buildPolygonBalconyHostel({
      localPoly,
      height: building.height,
      floors: 10,
      podiumFloors: 0,
      staggeredAquaPanels: true,
      includeSolar: true,
      highDetail,
      buckets
    });
    // Distinctive dark cantilevered perforated pergola entry canopy (`himalaya.jpg`)
    const canW = 7.2;
    const canD = 18.5;
    addWallBox(buckets, 'DarkAnodizedSteel', canW, 0.28, canD, -building.w * 0.5 - canW * 0.45, 4.1, 0, [0, 0, 0], 0, { groundY: 0, soffitDark: 0.65 });
    [-canD * 0.42, canD * 0.42].forEach((cz) => {
      addWallBox(buckets, 'DarkAnodizedSteel', 0.32, 4.1, 0.32, -building.w * 0.5 - canW * 0.85, 2.05, cz, [0, 0, 0], 0, { groundY: 0 });
    });
  });
}

function buildLotusHostelRoot(building) {
  const localPoly = toLocalPolygon(building);
  const quadHoles = [insetPolyLocalXZ(cleanPolyEdges(localPoly, 2), Math.min(building.w, building.d) * 0.25).reverse()];
  return buildDualLodRootFromBuilder('Lotus_Hostel_Real3D', (buckets, highDetail) => {
    buildPolygonBalconyHostel({
      localPoly,
      holes: quadHoles,
      height: building.height,
      floors: 12,
      podiumFloors: 2,
      podiumMat: 'TerracottaBrick',
      cornerAccentMat: 'TerracottaMetallic',
      roofTrussCrown: true,
      includeSolar: true,
      highDetail,
      buckets
    });
  });
}

function buildKghHostelRoot(building) {
  const localPoly = toLocalPolygon(building);
  const quadHoles = [insetPolyLocalXZ(cleanPolyEdges(localPoly, 2), Math.min(building.w, building.d) * 0.26).reverse()];
  return buildDualLodRootFromBuilder('KGH_Hostel_Real3D', (buckets, highDetail) => {
    buildPolygonBalconyHostel({
      localPoly,
      holes: quadHoles,
      height: building.height,
      floors: 5,
      roofPergolaBeams: true,
      verticalSlotOffsets: [
        { lx: -building.w * 0.25, lz: -building.d * 0.47, w: 3.6, d: 1.5, extraH: 1.4, matKey: 'PurpleCore' },
        { lx: building.w * 0.25, lz: -building.d * 0.47, w: 3.6, d: 1.5, extraH: 1.4, matKey: 'PurpleCore' },
        { lx: -building.w * 0.25, lz: building.d * 0.47, w: 3.6, d: 1.5, extraH: 1.4, matKey: 'PurpleCore' }
      ],
      includeSolar: true,
      highDetail,
      buckets
    });
  });
}

function buildStandardHostelRoot(building, floors, hasSteppedParapet = false) {
  const localPoly = toLocalPolygon(building);
  return buildDualLodRootFromBuilder(`${building.id}_Real3D`, (buckets, highDetail) => {
    buildPolygonBalconyHostel({
      localPoly,
      height: building.height,
      floors,
      includeSolar: floors >= 5,
      highDetail,
      buckets
    });
    if (hasSteppedParapet) {
      // Open penthouse portal arch visible in `aravali.png`
      addWallBox(buckets, 'StuccoWhite', 0.85, 2.4, 8.0, 0, building.height + 1.2, -building.d * 0.48, [0, 0, 0], 0, { groundY: building.height });
      addWallBox(buckets, 'StuccoWhite', 1.1, 0.55, 8.8, 0, building.height + 2.45, -building.d * 0.48, [0, 0, 0], 0, { groundY: building.height });
    }
  });
}

function buildIndoorStadiumRoot(building) {
  const W = building.w;
  const D = building.d;
  const wallH = 7.4;

  return buildDualLodRootFromBuilder('IndoorStadium_Real3D', (buckets, highDetail) => {
    // Stepped perimeter plinth
    addWallBox(buckets, 'StackedStone', W + 0.8, 0.75, D + 0.8, 0, 0.375, 0, [0, 0, 0], 0, { groundY: 0 });
    // Terracotta/Salmon masonry perimeter arena walls + crisp vertical white pilasters (`klufl_21_stadium.jpg`)
    addWallBox(buckets, 'IndoorBrick', W, wallH, D, 0, wallH * 0.5, 0, [0, 0, 0], 0, { groundY: 0 });
    for (let x = -3; x <= 3; x += 1) {
      const lx = (x / 3) * (W * 0.46);
      [-D * 0.5, D * 0.5].forEach((lz) => {
        addWallBox(buckets, 'StuccoWhite', 0.85, wallH, 0.65, lx, wallH * 0.5, lz, [0, 0, 0], 0, { groundY: 0 });
      });
    }
    // White stringcourse horizontal band + clerestory ribbon under curved roof
    addWallBox(buckets, 'StuccoWhite', W + 0.7, 0.42, D + 0.7, 0, wallH - 0.1, 0, [0, 0, 0], 0, { groundY: 0 });
    addWallBox(buckets, 'CurtainGlass', W - 1.8, 1.35, D - 1.8, 0, wallH + 0.68, 0, [0, 0, 0], 0, { groundY: 0 });

    // Multi-segment Barrel Vault Metallic Roof (`klufl_21_stadium.jpg`)
    const vaultR = D * 0.49;
    const vault = new THREE.CylinderGeometry(vaultR, vaultR, W * 0.98, highDetail ? 22 : 12, 1, false, 0, Math.PI);
    vault.rotateZ(Math.PI * 0.5);
    vault.scale(1.0, 0.34, 1.0);
    vault.translate(0, wallH + 1.25, 0);
    applyBoxWorldUVsAndAO(vault, { uScale: 12, vScale: 12, groundY: wallH });
    buckets.SteelVaultRoof.push(vault);

    // 7 External Curved Maroon Steel Bowstring Arch Trusses
    const ribs = highDetail ? 7 : 4;
    for (let r = 0; r < ribs; r += 1) {
      const rx = (-0.45 + (r / (ribs - 1)) * 0.9) * W;
      const rib = new THREE.CylinderGeometry(vaultR + 0.32, vaultR + 0.32, 0.65, highDetail ? 20 : 10, 1, false, 0, Math.PI);
      rib.rotateZ(Math.PI * 0.5);
      rib.scale(1.0, 0.355, 1.0);
      rib.translate(rx, wallH + 1.26, 0);
      applyBoxWorldUVsAndAO(rib, { groundY: wallH });
      buckets.MaroonArchSteel.push(rib);
    }
  });
}

function buildOpenAirTheatreRoot(building) {
  const localPoly = toLocalPolygon(building);
  const pts = cleanPolyEdges(localPoly, 2);
  return buildDualLodRootFromBuilder('OAT_Real3D', (buckets, highDetail) => {
    const tierCount = highDetail ? 6 : 4;
    const outerMaxH = 3.85;
    const arenaFloorY = 0.65;
    const tierStep = 2.4;

    // Outer stone perimeter bowl retaining wall (`hollow ring` so the sunken bowl stays completely open!)
    const ring1Inner = insetPolyLocalXZ(pts, tierStep);
    addPolygonExtrusion(buckets, pts, outerMaxH, 0, 'ConcreteMuted', 'StackedStone', { holes: [ring1Inner], aoMin: 0.72 });

    // Concentric descending granite & concrete seating rings stepping down to center arena floor
    let prevPoly = ring1Inner;
    let lowestY = outerMaxH;
    for (let t = 0; t < tierCount; t += 1) {
      const nextPoly = insetPolyLocalXZ(prevPoly, tierStep);
      if (nextPoly.length < 3) break;
      const tierH = Math.max(arenaFloorY + 0.3, outerMaxH - (t + 1) * 0.48);
      lowestY = tierH;
      addPolygonExtrusion(
        buckets,
        prevPoly,
        tierH,
        0,
        t % 2 === 0 ? 'StuccoWarmTrim' : 'ConcreteMuted',
        'StackedStone',
        { holes: [nextPoly], aoMin: 0.74 }
      );
      prevPoly = nextPoly;
    }

    // Open sunken amphitheater paved floor inside innermost ring
    if (prevPoly.length >= 3) {
      addPolygonExtrusion(buckets, prevPoly, arenaFloorY, 0, 'ConcreteMuted', 'StackedStone', { aoMin: 0.78 });
    }

    // Radial stepped seating aisles & low inner stage steps (`OAT`)
    for (let s = 0; s < 4; s += 1) {
      const ang = -0.8 + (s / 3) * 1.6;
      const sx = Math.sin(ang) * (building.w * 0.25);
      const sz = -Math.cos(ang) * (building.d * 0.22);
      addWallBox(buckets, 'StuccoWarmTrim', 1.35, Math.max(1.2, lowestY), 7.5, sx, Math.max(0.6, lowestY * 0.5), sz, [0, 0, 0], ang, { groundY: 0 });
    }
    // Elevated Stage Platform, Back Proscenium Wall & Cantilevered Acoustic Canopy inside sunken bowl
    addWallBox(buckets, 'RedGranite', building.w * 0.56, 1.55, 10.5, 0, 0.78, building.d * 0.28, [0, 0, 0], 0, { groundY: 0 });
    addWallBox(buckets, 'StuccoWarmTrim', building.w * 0.5, 3.8, 1.0, 0, 3.35, building.d * 0.37, [0, 0, 0], 0, { groundY: 1.4 });
    addWallBox(buckets, 'CrimsonFascia', building.w * 0.52, 0.52, 9.2, 0, 5.8, building.d * 0.28, [0, 0, 0], 0, { groundY: 0, soffitDark: 0.62 });
    [-building.w * 0.22, building.w * 0.22].forEach((sx) => {
      addWallBox(buckets, 'DarkAnodizedSteel', 0.45, 4.4, 0.45, sx, 3.6, building.d * 0.35, [0, 0, 0], 0, { groundY: 0 });
    });
  });
}

function buildHinduTempleRoot(building) {
  const W = building.w;
  const D = building.d;
  return buildDualLodRootFromBuilder('HinduTemple_Real3D', (buckets, highDetail) => {
    // 2-tier carved marble plinth + entrance stairs
    addWallBox(buckets, 'StuccoWarmTrim', W, 0.55, D, 0, 0.275, 0, [0, 0, 0], 0, { groundY: 0 });
    addWallBox(buckets, 'StuccoWhite', W * 0.86, 0.45, D * 0.86, 0, 0.77, 0, [0, 0, 0], 0, { groundY: 0 });
    addWallBox(buckets, 'StuccoWarmTrim', 5.4, 0.45, 2.2, 0, 0.22, -D * 0.5 - 0.6, [0, 0, 0], 0, { groundY: 0 });

    // Open Pillared Mandapa Pavilion (real walk-through open colonnade, revealing glowing inner sanctuary altar! - klufl_01_temple.jpg)
    const spanX = W * 0.34;
    const spanZ = D * 0.34;
    [-spanX, 0, spanX].forEach((px) => {
      [-spanZ, 0, spanZ].forEach((pz) => {
        if (px === 0 && pz === 0) return;
        const pillar = new THREE.CylinderGeometry(0.28, 0.34, 3.8, highDetail ? 10 : 6);
        pillar.translate(px, 2.9, pz);
        applyBoxWorldUVsAndAO(pillar, { groundY: 1.0 });
        buckets.StuccoWhite.push(pillar);
      });
    });
    // Sanctuary inner stone altar plinth glowing softly inside
    addWallBox(buckets, 'WarmAtriumInterior', 2.2, 1.35, 2.2, 0, 1.67, 0, [0, 0, 0], 0, { groundY: 1.0 });

    // Stepped Temple Roof Cornice + Octagonal Tiered Shikhara Dome & Gold Kalasha (`klufl_01_temple.jpg`)
    addWallBox(buckets, 'StuccoWhite', W * 0.84, 0.52, D * 0.84, 0, 4.95, 0, [0, 0, 0], 0, { groundY: 1.0, soffitDark: 0.64 });
    [4.4, 3.3, 2.2, 1.15].forEach((rad, idx) => {
      const tier = new THREE.CylinderGeometry(rad * 0.8, rad, 1.12, 8);
      tier.translate(0, 5.75 + idx * 1.12, 0);
      applyBoxWorldUVsAndAO(tier, { groundY: 5.0 });
      buckets.StuccoWhite.push(tier);
    });
    const kalasha = new THREE.ConeGeometry(0.45, 1.5, 10);
    kalasha.translate(0, 10.65, 0);
    applyBoxWorldUVsAndAO(kalasha, { groundY: 10.0 });
    buckets.GoldKalasha.push(kalasha);
  });
}

function buildSportsComplexRoot(building) {
  const localPoly = toLocalPolygon(building);
  return buildDualLodRootFromBuilder('SportsComplex_Provisional_Real3D', (buckets, highDetail) => {
    buildPolygonSegmentedAcademicBuilding({
      localPoly,
      height: building.height,
      floors: 4,
      groundColonnade: true,
      includeACUnits: false,
      includeSolar: false,
      highDetail,
      wallMat: 'ConcreteMuted',
      buckets
    });
  });
}

function buildBusStandRoot(building) {
  const W = building.w;
  const D = building.d;
  return buildDualLodRootFromBuilder('BusStand_Real3D', (buckets, highDetail) => {
    addWallBox(buckets, 'ConcreteMuted', W * 0.86, 0.35, D * 0.92, 0, 0.175, 0, [0, 0, 0], 0, { groundY: 0 });
    addWallBox(buckets, 'StuccoWhite', W * 0.82, 0.44, D * 0.88, 0, 4.2, 0, [0, 0, 0], 0, { groundY: 0, soffitDark: 0.62 });
    addWallBox(buckets, 'CrimsonFascia', W * 0.85, 0.24, D * 0.9, 0, 4.46, 0, [0, 0, 0], 0, { groundY: 0 });
    const postN = highDetail ? 7 : 4;
    for (let i = 0; i < postN; i += 1) {
      const pz = (-0.4 + (i / (postN - 1)) * 0.8) * D;
      const post = new THREE.CylinderGeometry(0.28, 0.34, 3.9, 10);
      post.translate(0, 2.15, pz);
      applyBoxWorldUVsAndAO(post, { groundY: 0 });
      buckets.DarkAnodizedSteel.push(post);
    }
  });
}

function buildVaddeswaramHouseRoot() {
  // Normalized 1x1x1-scaled residential unit prototype (scaled dynamically at instancing time!)
  // Built directly in [0..1] unit proportions cleanly avoiding real-scale meter clamps inside buildRecessedWindowWall.
  return buildDualLodRootFromBuilder('VaddeswaramHouse_Real3D', (buckets, highDetail) => {
    // Main two-story plastered residential volume (`w=0.94, d=0.94`)
    addWallBox(buckets, 'ConcreteMuted', 0.94, 0.92, 0.94, 0, 0.46, 0, [0, 0, 0], 0, { groundY: 0, aoMin: 0.72 });

    // Clean recessed proportional 2-story windows + chajja sun-hoods strictly inside ±0.49 unit bounds
    const floors = [0.28, 0.68];
    const bx = [-0.22, 0.22];
    [
      { axis: 'z', sign: 1, yaw: 0 },
      { axis: 'z', sign: -1, yaw: Math.PI },
      { axis: 'x', sign: 1, yaw: Math.PI * 0.5 },
      { axis: 'x', sign: -1, yaw: -Math.PI * 0.5 }
    ].forEach(({ sign, yaw }, fIdx) => {
      if (!highDetail && fIdx >= 2) return;
      floors.forEach((fy) => {
        bx.forEach((ox) => {
          addWallBox(buckets, 'RecessedCavityGlass', 0.18, 0.21, 0.03, ox, fy, 0.465, [0, 0, 0], yaw, { groundY: 0 });
          if (highDetail) {
            addWallBox(buckets, 'StuccoWarmTrim', 0.21, 0.025, 0.04, ox, fy + 0.115, 0.485, [0, 0, 0], yaw, { groundY: 0 });
          }
        });
      });
    });

    // Crisp concrete flat roof slab + thin perimeter parapet + water tank (`within 1.0x1.0 footprint`)
    addWallBox(buckets, 'RoofSlabConcrete', 0.98, 0.05, 0.98, 0, 0.945, 0, [0, 0, 0], 0, { groundY: 0 });
    addWallBox(buckets, 'StuccoWarmTrim', 0.98, 0.045, 0.04, 0, 0.99, 0.47, [0, 0, 0], 0, { groundY: 0 });
    addWallBox(buckets, 'StuccoWarmTrim', 0.98, 0.045, 0.04, 0, 0.99, -0.47, [0, 0, 0], 0, { groundY: 0 });
    addWallBox(buckets, 'StuccoWarmTrim', 0.04, 0.045, 0.90, -0.47, 0.99, 0, [0, 0, 0], 0, { groundY: 0 });
    addWallBox(buckets, 'StuccoWarmTrim', 0.04, 0.045, 0.90, 0.47, 0.99, 0, [0, 0, 0], 0, { groundY: 0 });
    if (highDetail) {
      addWallBox(buckets, 'StuccoWarmTrim', 0.18, 0.11, 0.18, -0.2, 1.025, -0.2, [0, 0, 0], 0, { groundY: 1 });
    }
  });
}

/**
 * Complete Stage C Asset Registry (excludes `cricket-ground` and `swimming-pool` terrain-flush sports grounds).
 */
export function createAllBuildingGlbSpecs() {
  const builders = {
    'central-library': () => buildCentralLibraryBenchmarkRoot(),
    'rnd-block': (b) => buildRndBlockRoot(b),
    'c-block': (b) => buildCBlockRoot(b),
    'fed-block': (b) => buildFedBlockRoot(b),
    'sdc-block': (b) => buildSdcBlockRoot(b),
    'm-block': (b) => buildMBlockRoot(b),
    'arts-block': (b) => buildArtsBlockRoot(b),
    'skc-block': (b) => buildLinearAcademicRoot(b, 4, { colonnade: true }),
    'mech-labs': (b) => buildLinearAcademicRoot(b, 2, { industrialClerestory: true }),
    'main-canteen': (b) => buildLinearAcademicRoot(b, 2, { colonnade: true }),
    'se-annex-provisional': (b) => buildLinearAcademicRoot(b, 2),
    'tulip-hostel': (b) => buildTulipHostelRoot(b),
    'himalaya-hostel': (b) => buildHimalayaHostelRoot(b),
    'lotus-hostel-provisional': (b) => buildLotusHostelRoot(b),
    'kgh-hostel': (b) => buildKghHostelRoot(b),
    'aravali-hostel': (b) => buildStandardHostelRoot(b, 7, true),
    'vindhya-hostel': (b) => buildStandardHostelRoot(b, 7, true),
    'indhu-hostel': (b) => buildStandardHostelRoot(b, 5, false),
    'staff-quarters': (b) => buildStandardHostelRoot(b, 3, false),
    'indoor-stadium': (b) => buildIndoorStadiumRoot(b),
    'sports-complex-provisional': (b) => buildSportsComplexRoot(b),
    'open-air-theatre': (b) => buildOpenAirTheatreRoot(b),
    'hindu-temple': (b) => buildHinduTempleRoot(b),
    'bus-stand': (b) => buildBusStandRoot(b)
  };

  const list = [];
  KLU_BUILDINGS.forEach((b) => {
    if (!builders[b.id]) return;
    list.push({
      id: b.id,
      fileName: b.id.replace(/-/g, '_'),
      building: b,
      buildRoot: () => builders[b.id](b)
    });
  });

  list.push({
    id: 'vaddeswaram-house',
    fileName: 'vaddeswaram_house',
    building: { id: 'vaddeswaram-house', name: 'Vaddeswaram Context House Prototype' },
    buildRoot: () => buildVaddeswaramHouseRoot()
  });

  return list;
}
