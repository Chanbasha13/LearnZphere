import * as THREE from 'three';

function createSeededRandom(seed = 1337) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// Fast tileable 2D periodic value-noise generator for crisp FBM & Sobel normal maps
function createTileableNoise(gridSize = 64, seed = 42) {
  const rand = createSeededRandom(seed);
  const grid = new Float32Array(gridSize * gridSize);
  for (let i = 0; i < grid.length; i += 1) {
    grid[i] = rand();
  }
  const sample = (x, y, freq) => {
    const u = ((x * freq) % gridSize + gridSize) % gridSize;
    const v = ((y * freq) % gridSize + gridSize) % gridSize;
    const x0 = Math.floor(u) % gridSize;
    const y0 = Math.floor(v) % gridSize;
    const x1 = (x0 + 1) % gridSize;
    const y1 = (y0 + 1) % gridSize;
    const fx = u - Math.floor(u);
    const fy = v - Math.floor(v);
    const sx = fx * fx * (3 - 2 * fx);
    const sy = fy * fy * (3 - 2 * fy);
    const n00 = grid[y0 * gridSize + x0];
    const n10 = grid[y0 * gridSize + x1];
    const n01 = grid[y1 * gridSize + x0];
    const n11 = grid[y1 * gridSize + x1];
    const nx0 = n00 + sx * (n10 - n00);
    const nx1 = n01 + sx * (n11 - n01);
    return nx0 + sy * (nx1 - nx0);
  };
  return (u, v, octaves = 3, baseFreq = 8) => {
    let sum = 0;
    let amp = 0.5;
    let norm = 0;
    let f = baseFreq;
    for (let o = 0; o < octaves; o += 1) {
      sum += amp * sample(u, v, f);
      norm += amp;
      amp *= 0.5;
      f *= 2;
    }
    return sum / norm;
  };
}

// Converts an offscreen height canvas (grayscale 0..255) into a seamless Sobel normal map canvas
function buildSobelNormalTexture(heightCanvas, strength = 2.2, repeatX = 1, repeatY = 1, maxAnisotropy = 4) {
  const w = heightCanvas.width;
  const h = heightCanvas.height;
  const hCtx = heightCanvas.getContext('2d');
  const src = hCtx.getImageData(0, 0, w, h).data;

  const outCanvas = document.createElement('canvas');
  outCanvas.width = w;
  outCanvas.height = h;
  const oCtx = outCanvas.getContext('2d');
  const outImg = oCtx.createImageData(w, h);
  const dst = outImg.data;

  const getH = (x, y) => {
    const wx = ((x % w) + w) % w;
    const wy = ((y % h) + h) % h;
    return src[(wy * w + wx) * 4] / 255;
  };

  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const tl = getH(x - 1, y - 1);
      const t = getH(x, y - 1);
      const tr = getH(x + 1, y - 1);
      const l = getH(x - 1, y);
      const r = getH(x + 1, y);
      const bl = getH(x - 1, y + 1);
      const b = getH(x, y + 1);
      const br = getH(x + 1, y + 1);

      const dX = (tr + 2 * r + br) - (tl + 2 * l + bl);
      const dY = (bl + 2 * b + br) - (tl + 2 * t + tr);

      let nx = -dX * strength;
      let ny = -dY * strength;
      let nz = 1.0;
      const len = Math.hypot(nx, ny, nz) || 1;
      nx /= len;
      ny /= len;
      nz /= len;

      const idx = (y * w + x) * 4;
      dst[idx] = Math.round((nx * 0.5 + 0.5) * 255);
      dst[idx + 1] = Math.round((ny * 0.5 + 0.5) * 255);
      dst[idx + 2] = Math.round((nz * 0.5 + 0.5) * 255);
      dst[idx + 3] = 255;
    }
  }
  oCtx.putImageData(outImg, 0, 0);

  const tex = new THREE.CanvasTexture(outCanvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.anisotropy = maxAnisotropy;
  tex.colorSpace = THREE.NoColorSpace;
  return tex;
}

function finalizeTexture(canvas, { repeatX = 1, repeatY = 1, srgb = true, maxAnisotropy = 4 } = {}) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.anisotropy = maxAnisotropy;
  tex.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  return tex;
}

/**
 * Generates procedural PBR albedo, Sobel normal, and roughness textures calibrated to
 * KL University (KLEF), Vaddeswaram architectural photography and Krishna Delta landscape.
 */
export function createCampusTextures(maxAnisotropy = 4) {
  const fbm = createTileableNoise(64, 9021);
  const fbmB = createTileableNoise(64, 4177);

  // 1. Limestone Plinth + Paved Granite Plaza
  const limeCanvas = document.createElement('canvas');
  limeCanvas.width = 512;
  limeCanvas.height = 512;
  const limeCtx = limeCanvas.getContext('2d');
  limeCtx.fillStyle = '#ddd7cb';
  limeCtx.fillRect(0, 0, 512, 512);
  const randL = createSeededRandom(101);
  const tile = 64;
  for (let y = 0; y < 512; y += tile) {
    const offset = ((y / tile) % 2) * (tile * 0.5);
    for (let x = -tile; x < 512 + tile; x += tile) {
      const shade = 212 + Math.floor((randL() - 0.5) * 18);
      limeCtx.fillStyle = `rgb(${shade}, ${shade - 5}, ${shade - 13})`;
      limeCtx.fillRect(x + offset + 1, y + 1, tile - 2, tile - 2);
    }
  }
  for (let i = 0; i < 4200; i += 1) {
    limeCtx.fillStyle = randL() > 0.5 ? 'rgba(130,122,108,0.08)' : 'rgba(255,252,244,0.09)';
    limeCtx.fillRect(randL() * 512, randL() * 512, 2 + randL() * 3, 2);
  }
  const limestoneMap = finalizeTexture(limeCanvas, { repeatX: 6, repeatY: 6, maxAnisotropy });

  // 2. Architectural Painted Masonry & Precast Concrete (Albedo + Height -> Normal + Roughness)
  const concSize = 512;
  const concCanvas = document.createElement('canvas');
  concCanvas.width = concSize;
  concCanvas.height = concSize;
  const concCtx = concCanvas.getContext('2d');

  const concHCanvas = document.createElement('canvas');
  concHCanvas.width = concSize;
  concHCanvas.height = concSize;
  const concHCtx = concHCanvas.getContext('2d');

  const concRCanvas = document.createElement('canvas');
  concRCanvas.width = concSize;
  concRCanvas.height = concSize;
  const concRCtx = concRCanvas.getContext('2d');

  const cImg = concCtx.createImageData(concSize, concSize);
  const hImg = concHCtx.createImageData(concSize, concSize);
  const rImg = concRCtx.createImageData(concSize, concSize);

  for (let y = 0; y < concSize; y += 1) {
    const v = y / concSize;
    const isHorizJoint = (y % 128) < 2;
    for (let x = 0; x < concSize; x += 1) {
      const u = x / concSize;
      const isVertJoint = (x % 256) < 2;
      const nFine = fbm(u, v, 4, 16);
      const nStain = fbmB(u * 1.5, v * 0.5, 3, 6);
      const jointDrop = (isHorizJoint || isVertJoint) ? 0.90 : 1.0;

      // Warm Kerala/Andhra architectural cream-white concrete
      const lum = (224 + (nFine - 0.5) * 18 + (nStain - 0.5) * 14) * jointDrop;
      const idx = (y * concSize + x) * 4;
      cImg.data[idx] = Math.min(255, Math.max(0, Math.round(lum + 3)));
      cImg.data[idx + 1] = Math.min(255, Math.max(0, Math.round(lum + 1)));
      cImg.data[idx + 2] = Math.min(255, Math.max(0, Math.round(lum - 5)));
      cImg.data[idx + 3] = 255;

      const hVal = Math.max(0, Math.min(255, Math.round((nFine * 0.65 + 0.35) * 235 * (jointDrop < 1 ? 0.52 : 1))));
      hImg.data[idx] = hVal;
      hImg.data[idx + 1] = hVal;
      hImg.data[idx + 2] = hVal;
      hImg.data[idx + 3] = 255;

      const rVal = Math.max(150, Math.min(248, Math.round(205 + (1 - nFine) * 42)));
      rImg.data[idx] = rVal;
      rImg.data[idx + 1] = rVal;
      rImg.data[idx + 2] = rVal;
      rImg.data[idx + 3] = 255;
    }
  }
  concCtx.putImageData(cImg, 0, 0);
  concHCtx.putImageData(hImg, 0, 0);
  concRCtx.putImageData(rImg, 0, 0);

  const concreteMap = finalizeTexture(concCanvas, { repeatX: 2, repeatY: 2, maxAnisotropy });
  const concreteBumpMap = finalizeTexture(concHCanvas, { repeatX: 2, repeatY: 2, srgb: false, maxAnisotropy });
  const concreteNormalMap = buildSobelNormalTexture(concHCanvas, 1.35, 2, 2, maxAnisotropy);
  const concreteRoughnessMap = finalizeTexture(concRCanvas, { repeatX: 2, repeatY: 2, srgb: false, maxAnisotropy });

  // 3. Punched Architectural Masonry Wall (C Block / FED / Arts / M / SKC — deep recessed windows + warm white piers!)
  // Reference: klufl_02_admin.jpg, yt_official_max.jpg, yt_solomon_max.jpg
  const punSize = 512;
  const punCanvas = document.createElement('canvas');
  punCanvas.width = punSize;
  punCanvas.height = punSize;
  const punCtx = punCanvas.getContext('2d');
  punCtx.drawImage(concCanvas, 0, 0, punSize, punSize);

  const punHCanvas = document.createElement('canvas');
  punHCanvas.width = punSize;
  punHCanvas.height = punSize;
  const punHCtx = punHCanvas.getContext('2d');
  punHCtx.fillStyle = '#ebecee';
  punHCtx.fillRect(0, 0, punSize, punSize);

  const punRCanvas = document.createElement('canvas');
  punRCanvas.width = punSize;
  punRCanvas.height = punSize;
  const punRCtx = punRCanvas.getContext('2d');
  punRCtx.fillStyle = '#d4d4d4'; // matte painted plaster roughness ~0.83
  punRCtx.fillRect(0, 0, punSize, punSize);

  const floors = 4;
  const cols = 4;
  const flH = punSize / floors;
  const colW = punSize / cols;
  const randP = createSeededRandom(311);

  for (let row = 0; row < floors; row += 1) {
    const sy = row * flH;
    // Floor slab spandrel band shadow & highlight molding
    punCtx.fillStyle = 'rgba(205,202,194,0.65)';
    punCtx.fillRect(0, sy + flH - 16, punSize, 16);
    punCtx.fillStyle = 'rgba(110,115,125,0.28)';
    punCtx.fillRect(0, sy + 2, punSize, 6); // under-lintel drop shadow

    for (let c = 0; c < cols; c += 1) {
      const sx = c * colW;
      const winX = sx + 22;
      const winY = sy + 20;
      const winW = colW - 44;
      const winH = flH - 52;

      // Cast concrete window drip sill & top chajja shadow
      punCtx.fillStyle = 'rgba(72,76,84,0.45)';
      punCtx.fillRect(winX - 4, winY - 5, winW + 8, 7);
      punHCtx.fillStyle = '#ffffff';
      punHCtx.fillRect(winX - 4, winY - 6, winW + 8, 6); // protruding hood

      // Deep dark structural reveal jamb
      punCtx.fillStyle = '#252930';
      punCtx.fillRect(winX - 2, winY - 2, winW + 4, winH + 4);
      punHCtx.fillStyle = '#383838'; // deep physical recess for Sobel normal bevel!
      punHCtx.fillRect(winX, winY, winW, winH);
      punRCtx.fillStyle = '#1e1e1e'; // mirror glossy window glass roughness ~0.12
      punRCtx.fillRect(winX, winY, winW, winH);

      // Dark tinted interior glass cavity + faint warm blind/office depth
      const gGrad = punCtx.createLinearGradient(winX, winY, winX, winY + winH);
      const isLit = randP() > 0.62;
      gGrad.addColorStop(0, '#0f1821');
      gGrad.addColorStop(0.45, isLit ? '#1d2f3c' : '#14202b');
      gGrad.addColorStop(1, isLit ? '#2d3b42' : '#101820');
      punCtx.fillStyle = gGrad;
      punCtx.fillRect(winX + 2, winY + 2, winW - 4, winH - 4);

      // Subtle exterior sky sheen streak
      punCtx.fillStyle = 'rgba(165, 200, 224, 0.14)';
      punCtx.beginPath();
      punCtx.moveTo(winX + 4, winY + 4);
      punCtx.lineTo(winX + winW * 0.62, winY + 4);
      punCtx.lineTo(winX + winW * 0.25, winY + winH - 4);
      punCtx.lineTo(winX + 4, winY + winH - 4);
      punCtx.closePath();
      punCtx.fill();

      // Anodized dark aluminum mullions (center mullion + transom)
      punCtx.fillStyle = '#181c22';
      punCtx.fillRect(winX + winW * 0.5 - 2, winY, 4, winH);
      punCtx.fillRect(winX, winY + winH * 0.34 - 1.5, winW, 3);

      // Window bottom stone sill highlight
      punCtx.fillStyle = '#cbc5b9';
      punCtx.fillRect(winX - 3, winY + winH + 2, winW + 6, 4);
      punHCtx.fillStyle = '#f5f5f5';
      punHCtx.fillRect(winX - 3, winY + winH + 2, winW + 6, 4);
    }
  }
  const punchedAcademicMap = finalizeTexture(punCanvas, { repeatX: 1, repeatY: 1, maxAnisotropy });
  const punchedAcademicNormalMap = buildSobelNormalTexture(punHCanvas, 2.8, 1, 1, maxAnisotropy);
  const punchedAcademicRoughnessMap = finalizeTexture(punRCanvas, { repeatX: 1, repeatY: 1, srgb: false, maxAnisotropy });

  // 4. Deep Dark Mirror Curtain Glass (Library / R&D / FED Podium / SDC) — Reference: library01.jpg & aboutus.jpg
  const cgCanvas = document.createElement('canvas');
  cgCanvas.width = 512;
  cgCanvas.height = 512;
  const cgCtx = cgCanvas.getContext('2d');
  const cgGrad = cgCtx.createLinearGradient(0, 0, 0, 512);
  cgGrad.addColorStop(0, '#13222e');
  cgGrad.addColorStop(0.5, '#1b3140');
  cgGrad.addColorStop(1, '#0e1820');
  cgCtx.fillStyle = cgGrad;
  cgCtx.fillRect(0, 0, 512, 512);

  const cgRCanvas = document.createElement('canvas');
  cgRCanvas.width = 512;
  cgRCanvas.height = 512;
  const cgRCtx = cgRCanvas.getContext('2d');
  cgRCtx.fillStyle = '#161616'; // glassy smooth roughness ~0.085
  cgRCtx.fillRect(0, 0, 512, 512);

  const randG = createSeededRandom(55);
  const gRows = 4;
  const gCols = 6;
  const gw = 512 / gCols;
  const gh = 512 / gRows;
  for (let r = 0; r < gRows; r += 1) {
    const yy = r * gh;
    // Interior slab shadow band behind spandrel glass
    cgCtx.fillStyle = 'rgba(7, 11, 16, 0.72)';
    cgCtx.fillRect(0, yy + gh - 28, 512, 26);

    for (let c = 0; c < gCols; c += 1) {
      const xx = c * gw;
      const tint = randG() * 14 - 7;
      cgCtx.fillStyle = `rgba(${28 + tint}, ${48 + tint}, ${62 + tint}, 0.55)`;
      cgCtx.fillRect(xx + 3, yy + 3, gw - 6, gh - 32);

      // Faint warm interior acoustic ceiling bay visible near upper glass
      if (randG() > 0.38) {
        cgCtx.fillStyle = 'rgba(218, 198, 165, 0.08)';
        cgCtx.fillRect(xx + 8, yy + 10, gw - 16, 18);
      }
      // Thin crisp dark anodized mullions
      cgCtx.fillStyle = '#101419';
      cgCtx.fillRect(xx, yy, 3, gh);
      cgCtx.fillRect(xx, yy, gw, 3);
      cgRCtx.fillStyle = '#5a5a5a';
      cgRCtx.fillRect(xx, yy, 3, gh);
      cgRCtx.fillRect(xx, yy, gw, 3);
    }
  }
  const curtainGlassMap = finalizeTexture(cgCanvas, { repeatX: 1, repeatY: 1, maxAnisotropy });
  const curtainGlassRoughnessMap = finalizeTexture(cgRCanvas, { repeatX: 1, repeatY: 1, srgb: false, maxAnisotropy });
  const glassMap = curtainGlassMap; // keep legacy alias crisp & dark!

  // 5. Hostel Loggia Balcony & Recessed Room Shadows (Tulip, Himalaya, Lotus, KGH)
  const hstCanvas = document.createElement('canvas');
  hstCanvas.width = 512;
  hstCanvas.height = 512;
  const hstCtx = hstCanvas.getContext('2d');
  hstCtx.fillStyle = '#e7e4dc';
  hstCtx.fillRect(0, 0, 512, 512);

  const hstHCanvas = document.createElement('canvas');
  hstHCanvas.width = 512;
  hstHCanvas.height = 512;
  const hstHCtx = hstHCanvas.getContext('2d');
  hstHCtx.fillStyle = '#f2f2f2';
  hstHCtx.fillRect(0, 0, 512, 512);

  const hFloors = 4;
  const hBays = 4;
  const hfH = 512 / hFloors;
  const hbW = 512 / hBays;
  for (let r = 0; r < hFloors; r += 1) {
    const yy = r * hfH;
    for (let b = 0; b < hBays; b += 1) {
      const xx = b * hbW;
      // Deep shaded loggia balcony recess
      hstCtx.fillStyle = '#1e2228';
      hstCtx.fillRect(xx + 12, yy + 10, hbW - 24, hfH - 42);
      hstHCtx.fillStyle = '#242424';
      hstHCtx.fillRect(xx + 12, yy + 10, hbW - 24, hfH - 42);
      // Sliding door glass inside loggia
      hstCtx.fillStyle = '#152532';
      hstCtx.fillRect(xx + 20, yy + 22, hbW - 40, hfH - 54);
      // Horizontal floor parapet balustrade + crisp cap shadow
      hstCtx.fillStyle = '#dbd7cd';
      hstCtx.fillRect(xx + 4, yy + hfH - 34, hbW - 8, 30);
      hstCtx.fillStyle = 'rgba(0,0,0,0.22)';
      hstCtx.fillRect(xx + 4, yy + hfH - 8, hbW - 8, 8);
      // Dark steel top handrail
      hstCtx.fillStyle = '#333840';
      hstCtx.fillRect(xx + 12, yy + hfH - 42, hbW - 24, 4);
    }
  }
  const hostelLoggiaMap = finalizeTexture(hstCanvas, { repeatX: 1, repeatY: 1, maxAnisotropy });
  const hostelLoggiaNormalMap = buildSobelNormalTexture(hstHCanvas, 2.5, 1, 1, maxAnisotropy);

  // 6. Warm Stacked Portico Stone (R&D Lobby Base + Library Planters — aboutus.jpg & library01.jpg)
  const stCanvas = document.createElement('canvas');
  stCanvas.width = 512;
  stCanvas.height = 512;
  const stCtx = stCanvas.getContext('2d');
  const stHCanvas = document.createElement('canvas');
  stHCanvas.width = 512;
  stHCanvas.height = 512;
  const stHCtx = stHCanvas.getContext('2d');
  stCtx.fillStyle = '#4e4842';
  stCtx.fillRect(0, 0, 512, 512);
  stHCtx.fillStyle = '#444444';
  stHCtx.fillRect(0, 0, 512, 512);

  const randS = createSeededRandom(82);
  for (let y = 0; y < 512; y += 24) {
    let x = -Math.floor(randS() * 48);
    while (x < 512) {
      const bw = 54 + Math.floor(randS() * 68);
      const tone = 82 + Math.floor((randS() - 0.5) * 34);
      stCtx.fillStyle = `rgb(${tone + 12}, ${tone + 5}, ${tone - 3})`;
      stCtx.fillRect(x + 1, y + 1, bw - 2, 22);
      const ht = 155 + Math.floor(randS() * 90);
      stHCtx.fillStyle = `rgb(${ht},${ht},${ht})`;
      stHCtx.fillRect(x + 2, y + 2, bw - 4, 20);
      x += bw;
    }
  }
  const stackedStoneMap = finalizeTexture(stCanvas, { repeatX: 4, repeatY: 2, maxAnisotropy });
  const stackedStoneNormalMap = buildSobelNormalTexture(stHCanvas, 2.4, 4, 2, maxAnisotropy);

  // 7. High-Resolution Vaddeswaram Agricultural Valley Ortho-Map (modeled after klu_sat_raw.jpg crop parcels & bunds)
  const farmSize = 2048;
  const farmCanvas = document.createElement('canvas');
  farmCanvas.width = farmSize;
  farmCanvas.height = farmSize;
  const fCtx = farmCanvas.getContext('2d');

  // Warm alluvial delta soil base
  fCtx.fillStyle = '#5c4d3c';
  fCtx.fillRect(0, 0, farmSize, farmSize);

  const randF = createSeededRandom(4409);
  const fieldPalette = [
    { fill: '#473c30', furrow: '#3c3227', type: 'plowed' },     // dark black-cotton loam
    { fill: '#82694d', furrow: '#735a40', type: 'plowed' },     // sandy tilled earth
    { fill: '#947e54', furrow: '#826d44', type: 'stubble' },    // golden harvested plot
    { fill: '#2c4b27', furrow: '#233d1e', type: 'denseCrop' },  // sugarcane/deep green crop
    { fill: '#4a6433', furrow: '#3d5428', type: 'paddy' },      // olive paddy field
    { fill: '#3a552a', furrow: '#2f4721', type: 'paddy' },      // rich emerald plot
    { fill: '#796248', furrow: '#68523a', type: 'clay' }        // dry laterite lot
  ];

  // Draw 16-deg rotated agricultural parcel subdivision matching Vaddeswaram field geometry
  fCtx.save();
  fCtx.translate(farmSize * 0.5, farmSize * 0.5);
  fCtx.rotate(0.26);
  const gridSpan = farmSize * 1.45;
  let py = -gridSpan;
  while (py < gridSpan) {
    const rowH = 110 + Math.floor(randF() * 145);
    let px = -gridSpan;
    while (px < gridSpan) {
      const colW = 120 + Math.floor(randF() * 170);
      const pal = fieldPalette[Math.floor(randF() * fieldPalette.length)];
      const slant = (randF() - 0.5) * 18;

      fCtx.beginPath();
      fCtx.moveTo(px + slant, py);
      fCtx.lineTo(px + colW + (randF() - 0.5) * 14, py + (randF() - 0.5) * 10);
      fCtx.lineTo(px + colW + slant, py + rowH);
      fCtx.lineTo(px + (randF() - 0.5) * 12, py + rowH + (randF() - 0.5) * 8);
      fCtx.closePath();
      fCtx.fillStyle = pal.fill;
      fCtx.fill();

      // Subtle plowing furrows & crop rows clipped inside field
      fCtx.save();
      fCtx.clip();
      fCtx.strokeStyle = pal.furrow;
      fCtx.lineWidth = pal.type === 'plowed' ? 2.2 : 1.6;
      const horiz = randF() > 0.4;
      const step = pal.type === 'denseCrop' ? 7 : 9;
      fCtx.beginPath();
      if (horiz) {
        for (let fy = py; fy < py + rowH; fy += step) {
          fCtx.moveTo(px - 20, fy);
          fCtx.lineTo(px + colW + 20, fy);
        }
      } else {
        for (let fx = px; fx < px + colW; fx += step) {
          fCtx.moveTo(fx, py - 20);
          fCtx.lineTo(fx, py + rowH + 20);
        }
      }
      fCtx.stroke();

      // Subtle natural crop patch variation without hard circles
      if (randF() > 0.42) {
        const grad = fCtx.createRadialGradient(
          px + colW * randF(), py + rowH * randF(), 4,
          px + colW * 0.5, py + rowH * 0.5, Math.max(colW, rowH) * 0.65
        );
        grad.addColorStop(0, 'rgba(38, 32, 24, 0.16)');
        grad.addColorStop(1, 'rgba(38, 32, 24, 0)');
        fCtx.fillStyle = grad;
        fCtx.fillRect(px, py, colW, rowH);
      }
      fCtx.restore();

      // Crisp warm tan dirt bund separating field parcels
      fCtx.strokeStyle = randF() > 0.3 ? 'rgba(154, 134, 104, 0.72)' : 'rgba(42, 62, 32, 0.78)';
      fCtx.lineWidth = randF() > 0.8 ? 5.2 : 3.0;
      fCtx.stroke();

      // Hedgerow shrubs dotted organically along field bunds
      if (randF() > 0.48) {
        const hedgeN = 4 + Math.floor(randF() * 5);
        for (let h = 0; h < hedgeN; h += 1) {
          const hx = px + (h / hedgeN) * colW;
          const hy = py + (randF() - 0.5) * 5;
          fCtx.fillStyle = randF() > 0.5 ? 'rgba(38,63,30,0.75)' : 'rgba(53,81,40,0.72)';
          fCtx.beginPath();
          fCtx.ellipse(hx, hy, 3.5 + randF() * 4.5, 2.5 + randF() * 3.5, randF() * Math.PI, 0, Math.PI * 2);
          fCtx.fill();
        }
      }

      px += colW;
    }
    py += rowH;
  }
  fCtx.restore();

  // Blend micro soil grain across the whole valley ortho-map
  const fImg = fCtx.getImageData(0, 0, farmSize, farmSize);
  const nHed = createTileableNoise(64, 2049);
  for (let y = 0; y < farmSize; y += 2) {
    const v = y / farmSize;
    for (let x = 0; x < farmSize; x += 2) {
      const micro = (nHed(x / farmSize, v, 3, 28) - 0.5) * 26;
      for (let dy = 0; dy < 2; dy += 1) {
        for (let dx = 0; dx < 2; dx += 1) {
          const idx = ((y + dy) * farmSize + (x + dx)) * 4;
          fImg.data[idx] = Math.max(24, Math.min(220, fImg.data[idx] + micro));
          fImg.data[idx + 1] = Math.max(28, Math.min(220, fImg.data[idx + 1] + micro * 0.9));
          fImg.data[idx + 2] = Math.max(20, Math.min(200, fImg.data[idx + 2] + micro * 0.75));
        }
      }
    }
  }
  fCtx.putImageData(fImg, 0, 0);
  const farmlandMap = finalizeTexture(farmCanvas, { repeatX: 5, repeatY: 5, maxAnisotropy });
  // Separate fine macro normal map for farmlands (avoids high-repeat grass normal aliasing on 6km valley plane)
  const farmNormHCanvas = document.createElement('canvas');
  farmNormHCanvas.width = 256;
  farmNormHCanvas.height = 256;
  const fnhCtx = farmNormHCanvas.getContext('2d');
  const fnhImg = fnhCtx.createImageData(256, 256);
  for (let y = 0; y < 256; y += 1) {
    for (let x = 0; x < 256; x += 1) {
      const hV = Math.round(90 + fbmB(x / 256, y / 256, 3, 12) * 140);
      const i = (y * 256 + x) * 4;
      fnhImg.data[i] = hV;
      fnhImg.data[i + 1] = hV;
      fnhImg.data[i + 2] = hV;
      fnhImg.data[i + 3] = 255;
    }
  }
  fnhCtx.putImageData(fnhImg, 0, 0);
  const farmlandNormalMap = buildSobelNormalTexture(farmNormHCanvas, 0.9, 18, 18, maxAnisotropy);

  // 7b. Natural Krishna Canal Water Map (deep murky green-slate center + hyacinth drift along shore edges!)
  const cwCanvas = document.createElement('canvas');
  cwCanvas.width = 512;
  cwCanvas.height = 512;
  const cwCtx = cwCanvas.getContext('2d');
  const cwImg = cwCtx.createImageData(512, 512);
  const nCanalA = createTileableNoise(64, 8821);
  for (let y = 0; y < 512; y += 1) {
    const v = y / 512; // 0 and 1 are banks, 0.5 is mid-channel
    const shoreProximity = Math.max(0, 1 - Math.abs(v - 0.5) / 0.5);
    const edgeWeeds = Math.pow(Math.max(0, Math.abs(v - 0.5) * 2 - 0.58) / 0.42, 1.4);
    for (let x = 0; x < 512; x += 1) {
      const u = x / 512;
      const flowN = nCanalA(u * 2.0, v * 0.8, 3, 14);
      const weedPatch = Math.max(0, (nCanalA(u * 1.4, v * 1.8, 3, 20) - 0.46) * 2.2) * edgeWeeds;
      // Dark olive-slate canal water blending subtly into mossy bank weed clusters
      let r = 24 + flowN * 14 + (1 - shoreProximity) * 14;
      let g = 46 + flowN * 18 + (1 - shoreProximity) * 10;
      let b = 33 + flowN * 10;
      const wMix = Math.min(0.75, weedPatch);
      r = r * (1 - wMix) + 66 * wMix;
      g = g * (1 - wMix) + 96 * wMix;
      b = b * (1 - wMix) + 46 * wMix;
      const idx = (y * 512 + x) * 4;
      cwImg.data[idx] = Math.round(r);
      cwImg.data[idx + 1] = Math.round(g);
      cwImg.data[idx + 2] = Math.round(b);
      cwImg.data[idx + 3] = 255;
    }
  }
  cwCtx.putImageData(cwImg, 0, 0);
  const canalWaterMap = finalizeTexture(cwCanvas, { repeatX: 1, repeatY: 1, maxAnisotropy });

  // 8. Mowed Campus Turf + Compacted Laterite Soil/Gravel Apron Map
  const grassSize = 512;
  const grassCanvas = document.createElement('canvas');
  grassCanvas.width = grassSize;
  grassCanvas.height = grassSize;
  const gCtx = grassCanvas.getContext('2d');
  const gImg = gCtx.createImageData(grassSize, grassSize);
  const gHCanvas = document.createElement('canvas');
  gHCanvas.width = grassSize;
  gHCanvas.height = grassSize;
  const gHCtx = gHCanvas.getContext('2d');
  const ghImg = gHCtx.createImageData(grassSize, grassSize);

  for (let y = 0; y < grassSize; y += 1) {
    const v = y / grassSize;
    const mowStripe = Math.sin(v * Math.PI * 16) * 3;
    for (let x = 0; x < grassSize; x += 1) {
      const u = x / grassSize;
      const n = fbm(u, v, 4, 24);
      const patch = fbmB(u, v, 3, 6);
      const idx = (y * grassSize + x) * 4;
      const baseR = 56 + (n - 0.5) * 26 + (patch - 0.5) * 22 + mowStripe;
      const baseG = 84 + (n - 0.5) * 28 + (patch - 0.5) * 18 + mowStripe;
      const baseB = 40 + (n - 0.5) * 16;
      gImg.data[idx] = Math.max(28, Math.min(132, Math.round(baseR)));
      gImg.data[idx + 1] = Math.max(48, Math.min(155, Math.round(baseG)));
      gImg.data[idx + 2] = Math.max(22, Math.min(88, Math.round(baseB)));
      gImg.data[idx + 3] = 255;

      const hVal = Math.max(60, Math.min(250, Math.round(n * 210 + 25)));
      ghImg.data[idx] = hVal;
      ghImg.data[idx + 1] = hVal;
      ghImg.data[idx + 2] = hVal;
      ghImg.data[idx + 3] = 255;
    }
  }
  gCtx.putImageData(gImg, 0, 0);
  gHCtx.putImageData(ghImg, 0, 0);
  // Repeat 1x1 cleanly since planar campus ShapeGeometry UVs are explicitly normalized in meters!
  const grassMap = finalizeTexture(grassCanvas, { repeatX: 1, repeatY: 1, maxAnisotropy });
  const terrainNormalMap = buildSobelNormalTexture(gHCanvas, 1.8, 1, 1, maxAnisotropy);

  // 9. Paver Walkways (Albedo + Normal — interlocking stone bricks in warm sandstone & charcoal trim)
  const pavCanvas = document.createElement('canvas');
  pavCanvas.width = 512;
  pavCanvas.height = 512;
  const pCtx = pavCanvas.getContext('2d');
  const pavHCanvas = document.createElement('canvas');
  pavHCanvas.width = 512;
  pavHCanvas.height = 512;
  const pHCtx = pavHCanvas.getContext('2d');
  pCtx.fillStyle = '#6f695f';
  pCtx.fillRect(0, 0, 512, 512);
  pHCtx.fillStyle = '#383838';
  pHCtx.fillRect(0, 0, 512, 512);
  const randPv = createSeededRandom(212);
  for (let y = 0; y < 512; y += 32) {
    const stagger = ((y / 32) % 2) * 32;
    const isBand = (y / 32) % 4 === 0;
    for (let x = -32; x < 512 + 32; x += 64) {
      const s = (isBand ? 148 : 182) + Math.floor((randPv() - 0.5) * 24);
      const warm = isBand ? 18 : Math.floor(randPv() * 12);
      pCtx.fillStyle = `rgb(${s + warm}, ${s - 4}, ${s - 18})`;
      pCtx.fillRect(x + stagger + 2, y + 2, 60, 28);
      pHCtx.fillStyle = '#ececec';
      pHCtx.fillRect(x + stagger + 3, y + 3, 58, 26);
    }
  }
  const paverMap = finalizeTexture(pavCanvas, { repeatX: 1, repeatY: 1, maxAnisotropy });
  const paverNormalMap = buildSobelNormalTexture(pavHCanvas, 2.0, 1, 1, maxAnisotropy);

  // 10. Terracotta Brick (Indoor Stadium & Athletic Track)
  const terCanvas = document.createElement('canvas');
  terCanvas.width = 512;
  terCanvas.height = 512;
  const tCtx = terCanvas.getContext('2d');
  const terHCanvas = document.createElement('canvas');
  terHCanvas.width = 512;
  terHCanvas.height = 512;
  const tHCtx = terHCanvas.getContext('2d');
  tCtx.fillStyle = '#754132';
  tCtx.fillRect(0, 0, 512, 512);
  tHCtx.fillStyle = '#505050';
  tHCtx.fillRect(0, 0, 512, 512);
  const randT = createSeededRandom(73);
  for (let y = 0; y < 512; y += 22) {
    const off = ((y / 22) % 2) * 26;
    for (let x = -32; x < 512 + 32; x += 52) {
      const shift = Math.floor((randT() - 0.5) * 24);
      tCtx.fillStyle = `rgb(${156 + shift}, ${82 + Math.floor(shift * 0.5)}, ${62 + Math.floor(shift * 0.35)})`;
      tCtx.fillRect(x + off + 2, y + 2, 48, 18);
      tHCtx.fillStyle = '#e5e5e5';
      tHCtx.fillRect(x + off + 2, y + 2, 48, 18);
    }
  }
  const terracottaMap = finalizeTexture(terCanvas, { repeatX: 3, repeatY: 2, maxAnisotropy });
  const terracottaNormalMap = buildSobelNormalTexture(terHCanvas, 1.8, 3, 2, maxAnisotropy);

  // 11. Indoor Stadium Salmon-Brick + White Panel Texture (`klufl_21_stadium.jpg`)
  const indCanvas = document.createElement('canvas');
  indCanvas.width = 512;
  indCanvas.height = 512;
  const inCtx = indCanvas.getContext('2d');
  inCtx.drawImage(terCanvas, 0, 0);
  inCtx.fillStyle = 'rgba(225,212,202,0.22)';
  inCtx.fillRect(0, 0, 512, 512);
  inCtx.fillStyle = '#e4e0d8';
  inCtx.fillRect(0, 0, 512, 16);
  inCtx.fillRect(0, 248, 512, 16);
  for (let x = 0; x < 512; x += 128) {
    inCtx.fillRect(x, 0, 14, 512);
  }
  const indoorBrickMap = finalizeTexture(indCanvas, { repeatX: 2, repeatY: 1, maxAnisotropy });
  const indoorBrickNormalMap = buildSobelNormalTexture(terHCanvas, 1.4, 2, 1, maxAnisotropy);

  // 12. Rooftop Solar Photovoltaic Array
  const solCanvas = document.createElement('canvas');
  solCanvas.width = 512;
  solCanvas.height = 512;
  const sCtx = solCanvas.getContext('2d');
  sCtx.fillStyle = '#141e2e';
  sCtx.fillRect(0, 0, 512, 512);
  for (let y = 4; y < 512; y += 64) {
    for (let x = 4; x < 512; x += 64) {
      const cellGrad = sCtx.createLinearGradient(x, y, x + 56, y + 56);
      cellGrad.addColorStop(0, '#182b44');
      cellGrad.addColorStop(1, '#203b5c');
      sCtx.fillStyle = cellGrad;
      sCtx.fillRect(x, y, 56, 56);
      sCtx.strokeStyle = 'rgba(182, 208, 232, 0.32)';
      sCtx.lineWidth = 1;
      sCtx.strokeRect(x + 2, y + 2, 52, 52);
    }
  }
  const solarMap = finalizeTexture(solCanvas, { repeatX: 2, repeatY: 1, maxAnisotropy });

  // 13. Weathered Dark Asphalt Campus Road (Albedo + Normal + Roughness)
  const rdSize = 512;
  const rdCanvas = document.createElement('canvas');
  rdCanvas.width = rdSize;
  rdCanvas.height = rdSize;
  const rCtx = rdCanvas.getContext('2d');
  const rdHCanvas = document.createElement('canvas');
  rdHCanvas.width = rdSize;
  rdHCanvas.height = rdSize;
  const rHCtx = rdHCanvas.getContext('2d');
  const rdRCanvas = document.createElement('canvas');
  rdRCanvas.width = rdSize;
  rdRCanvas.height = rdSize;
  const rRCtx = rdRCanvas.getContext('2d');

  const rdImg = rCtx.createImageData(rdSize, rdSize);
  const rhImg = rHCtx.createImageData(rdSize, rdSize);
  const rrImg = rRCtx.createImageData(rdSize, rdSize);

  for (let y = 0; y < rdSize; y += 1) {
    const v = y / rdSize;
    // Wheel tracks around v = 0.30 & 0.70 (slightly smoother + darker)
    const trackWeight = Math.exp(-((v - 0.30) ** 2) / 0.012) + Math.exp(-((v - 0.70) ** 2) / 0.012);
    for (let x = 0; x < rdSize; x += 1) {
      const u = x / rdSize;
      const grit = fbm(u, v, 4, 32);
      const patch = fbmB(u, v, 2, 6);
      const base = 66 + (grit - 0.5) * 20 + (patch - 0.5) * 12 - trackWeight * 6;
      const idx = (y * rdSize + x) * 4;
      rdImg.data[idx] = Math.round(base);
      rdImg.data[idx + 1] = Math.round(base + 1);
      rdImg.data[idx + 2] = Math.round(base + 3);
      rdImg.data[idx + 3] = 255;

      const hV = Math.round(120 + (grit - 0.5) * 140);
      rhImg.data[idx] = hV;
      rhImg.data[idx + 1] = hV;
      rhImg.data[idx + 2] = hV;
      rhImg.data[idx + 3] = 255;

      const rV = Math.max(155, Math.min(245, Math.round(224 - trackWeight * 38)));
      rrImg.data[idx] = rV;
      rrImg.data[idx + 1] = rV;
      rrImg.data[idx + 2] = rV;
      rrImg.data[idx + 3] = 255;
    }
  }
  rCtx.putImageData(rdImg, 0, 0);
  rHCtx.putImageData(rhImg, 0, 0);
  rRCtx.putImageData(rrImg, 0, 0);

  // Subtle asphalt edge painted yellow-white curb lines & dashed center stripe
  rCtx.fillStyle = 'rgba(225, 224, 215, 0.42)';
  rCtx.fillRect(0, 14, 512, 5);
  rCtx.fillRect(0, 493, 512, 5);
  rCtx.fillStyle = 'rgba(235, 232, 222, 0.58)';
  for (let x = 16; x < 512; x += 64) {
    rCtx.fillRect(x, 253, 28, 6);
  }
  const roadMap = finalizeTexture(rdCanvas, { repeatX: 1, repeatY: 1, maxAnisotropy });
  const roadNormalMap = buildSobelNormalTexture(rdHCanvas, 1.35, 1, 1, maxAnisotropy);
  const roadRoughnessMap = finalizeTexture(rdRCanvas, { repeatX: 1, repeatY: 1, srgb: false, maxAnisotropy });

  // 14. Red & Yellow Painted KL University Curb Stripes (`klufl_04_cse.jpg` + `klufl_34_newlib_back.jpg`)
  const curbCanvas = document.createElement('canvas');
  curbCanvas.width = 512;
  curbCanvas.height = 64;
  const cbCtx = curbCanvas.getContext('2d');
  for (let x = 0; x < 512; x += 64) {
    cbCtx.fillStyle = (x / 64) % 2 === 0 ? '#a8342a' : '#d6a42e';
    cbCtx.fillRect(x, 0, 64, 64);
  }
  cbCtx.fillStyle = 'rgba(24,20,18,0.16)';
  cbCtx.fillRect(0, 48, 512, 16);
  const curbStripeMap = finalizeTexture(curbCanvas, { repeatX: 8, repeatY: 1, maxAnisotropy });

  // 15. Warm Teak Wood Planks (Library Awning & Atrium Gallery — library01.jpg & lib_slider2.jpg)
  const wCanvas = document.createElement('canvas');
  wCanvas.width = 512;
  wCanvas.height = 512;
  const wCtx = wCanvas.getContext('2d');
  const wHCanvas = document.createElement('canvas');
  wHCanvas.width = 512;
  wHCanvas.height = 512;
  const wHCtx = wHCanvas.getContext('2d');
  wCtx.fillStyle = '#a36834';
  wCtx.fillRect(0, 0, 512, 512);
  wHCtx.fillStyle = '#d0d0d0';
  wHCtx.fillRect(0, 0, 512, 512);
  const randW = createSeededRandom(707);
  for (let y = 0; y < 512; y += 32) {
    const d = Math.floor((randW() - 0.5) * 26);
    wCtx.fillStyle = `rgb(${168 + d}, ${106 + Math.floor(d * 0.7)}, ${52 + Math.floor(d * 0.45)})`;
    wCtx.fillRect(0, y + 1, 512, 30);
    wCtx.fillStyle = 'rgba(65,36,15,0.42)';
    wCtx.fillRect(0, y + 30, 512, 2);
    wHCtx.fillStyle = '#3c3c3c';
    wHCtx.fillRect(0, y + 30, 512, 2);
  }
  const woodMap = finalizeTexture(wCanvas, { repeatX: 3, repeatY: 1, maxAnisotropy });
  const woodNormalMap = buildSobelNormalTexture(wHCanvas, 1.5, 3, 1, maxAnisotropy);

  // 16. Canal Water Normal Map (Soft organic wave ripples — avoids harsh mirror peaks)
  const wnCanvas = document.createElement('canvas');
  wnCanvas.width = 512;
  wnCanvas.height = 512;
  const wnCtx = wnCanvas.getContext('2d');
  const wnImg = wnCtx.createImageData(512, 512);
  const nWaterA = createTileableNoise(64, 991);
  const nWaterB = createTileableNoise(64, 331);
  for (let y = 0; y < 512; y += 1) {
    const v = y / 512;
    for (let x = 0; x < 512; x += 1) {
      const u = x / 512;
      const dx = (nWaterA(u + 0.005, v, 3, 10) - nWaterA(u - 0.005, v, 3, 10)) * 2.4;
      const dy = (nWaterB(u, v + 0.005, 3, 12) - nWaterB(u, v - 0.005, 3, 12)) * 2.4;
      let nx = -dx;
      let ny = -dy;
      let nz = 1.0;
      const len = Math.hypot(nx, ny, nz) || 1;
      nx /= len;
      ny /= len;
      nz /= len;
      const idx = (y * 512 + x) * 4;
      wnImg.data[idx] = Math.round((nx * 0.5 + 0.5) * 255);
      wnImg.data[idx + 1] = Math.round((ny * 0.5 + 0.5) * 255);
      wnImg.data[idx + 2] = Math.round((nz * 0.5 + 0.5) * 255);
      wnImg.data[idx + 3] = 255;
    }
  }
  wnCtx.putImageData(wnImg, 0, 0);
  const waterNormalsMap = finalizeTexture(wnCanvas, { repeatX: 6, repeatY: 16, srgb: false, maxAnisotropy });

  // 17. Fissured Tropical Tree Bark (Albedo + Sobel Normal Map)
  const bkSize = 512;
  const bkCanvas = document.createElement('canvas');
  bkCanvas.width = bkSize;
  bkCanvas.height = bkSize;
  const bkCtx = bkCanvas.getContext('2d');
  const bkHCanvas = document.createElement('canvas');
  bkHCanvas.width = bkSize;
  bkHCanvas.height = bkSize;
  const bkHCtx = bkHCanvas.getContext('2d');
  const bkImg = bkCtx.createImageData(bkSize, bkSize);
  const bkhImg = bkHCtx.createImageData(bkSize, bkSize);

  for (let y = 0; y < bkSize; y += 1) {
    const v = y / bkSize;
    const ring = Math.sin(v * Math.PI * 24) * 10;
    for (let x = 0; x < bkSize; x += 1) {
      const u = x / bkSize;
      const ridge = fbm(u * 2.4, v * 0.45, 4, 18);
      const fine = fbmB(u * 4, v, 3, 24);
      const val = 68 + ridge * 46 + (fine - 0.5) * 18 + ring * 0.4;
      const idx = (y * bkSize + x) * 4;
      bkImg.data[idx] = Math.max(24, Math.min(148, Math.round(val + 14)));
      bkImg.data[idx + 1] = Math.max(20, Math.min(130, Math.round(val + 4)));
      bkImg.data[idx + 2] = Math.max(16, Math.min(110, Math.round(val - 8)));
      bkImg.data[idx + 3] = 255;

      const hV = Math.max(15, Math.min(245, Math.round(ridge * 200 + fine * 40)));
      bkhImg.data[idx] = hV;
      bkhImg.data[idx + 1] = hV;
      bkhImg.data[idx + 2] = hV;
      bkhImg.data[idx + 3] = 255;
    }
  }
  bkCtx.putImageData(bkImg, 0, 0);
  bkHCtx.putImageData(bkhImg, 0, 0);
  const barkMap = finalizeTexture(bkCanvas, { repeatX: 2, repeatY: 4, maxAnisotropy });
  const barkNormalMap = buildSobelNormalTexture(bkHCanvas, 2.2, 2, 4, maxAnisotropy);

  // Helper to pre-bleed alpha=0 pixels with foliage RGB so mipmaps never create dark fringes around leaf cutouts
  const prebleedAlphaCanvas = (canvas, r = 56, g = 88, b = 38) => {
    const ctx = canvas.getContext('2d');
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] < 10) {
        d[i] = r;
        d[i + 1] = g;
        d[i + 2] = b;
        d[i + 3] = 0;
      }
    }
    ctx.putImageData(img, 0, 0);
  };

  // 17b. Alpha-Masked Samanea saman Rain-Tree Foliage Sprig Atlas (512x512 RGBA)
  const buildFoliageClusterAtlas = (seed, withBlossoms = false) => {
    const size = 512;
    const cv = document.createElement('canvas');
    cv.width = size;
    cv.height = size;
    const ctx = cv.getContext('2d');
    ctx.clearRect(0, 0, size, size);
    const rnd = createSeededRandom(seed);

    // Subtle interior woody twig forks anchored near center/bottom
    ctx.strokeStyle = '#473a2c';
    ctx.lineCap = 'round';
    for (let t = 0; t < 11; t += 1) {
      const ang = (t / 11) * Math.PI * 2 + (rnd() - 0.5) * 0.35;
      const len = 115 + rnd() * 95;
      ctx.lineWidth = 3 + rnd() * 3.5;
      ctx.beginPath();
      ctx.moveTo(256 + (rnd() - 0.5) * 32, 256 + (rnd() - 0.5) * 32);
      ctx.quadraticCurveTo(
        256 + Math.cos(ang + 0.25) * len * 0.55,
        256 + Math.sin(ang + 0.25) * len * 0.55,
        256 + Math.cos(ang) * len,
        256 + Math.sin(ang) * len
      );
      ctx.stroke();
    }

    // Layered pinnate leaflet rosettes leaving airy sky gaps around the outer canopy crown
    const count = 360;
    for (let i = 0; i < count; i += 1) {
      const ang = rnd() * Math.PI * 2;
      const rad = Math.pow(rnd(), 0.68) * 218;
      const cx = 256 + Math.cos(ang) * rad;
      const cy = 256 + Math.sin(ang) * rad;
      const radialFrac = rad / 218;
      const baseG = Math.round(78 + (1 - radialFrac * 0.15) * 32 + rnd() * 48);
      const rCol = Math.round(baseG * (withBlossoms ? 0.55 : 0.62) + rnd() * 14);
      const bCol = Math.round(baseG * 0.42 + rnd() * 10);
      ctx.fillStyle = `rgb(${rCol}, ${baseG}, ${bCol})`;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 11 + rnd() * 11, 5.5 + rnd() * 5.5, ang + (rnd() - 0.5) * 0.9, 0, Math.PI * 2);
      ctx.fill();
    }

    if (withBlossoms) {
      // Scarlet-coral Delonix regia (Gulmohar) flower clusters atop emerald leaflet tufts
      for (let f = 0; f < 56; f += 1) {
        const ang = rnd() * Math.PI * 2;
        const rad = (0.28 + rnd() * 0.65) * 205;
        const fx = 256 + Math.cos(ang) * rad;
        const fy = 256 + Math.sin(ang) * rad;
        const red = 205 + Math.floor(rnd() * 45);
        const grn = 58 + Math.floor(rnd() * 48);
        ctx.fillStyle = `rgb(${red}, ${grn}, 28)`;
        ctx.beginPath();
        ctx.ellipse(fx, fy, 7 + rnd() * 6, 5 + rnd() * 4.5, rnd() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    prebleedAlphaCanvas(cv, 62, 96, 40);
    return finalizeTexture(cv, { repeatX: 1, repeatY: 1, maxAnisotropy });
  };

  const rainLeafAtlasMap = buildFoliageClusterAtlas(614, false);
  const gulmoharLeafAtlasMap = buildFoliageClusterAtlas(927, true);
  const leafFoliageMap = rainLeafAtlasMap;
  const leafSprigMap = rainLeafAtlasMap;

  // 17c. Alpha-Masked Ornament Shrub & Variegated Garden Bush Atlas (512x512 RGBA)
  const buildShrubAtlas = () => {
    const size = 512;
    const cv = document.createElement('canvas');
    cv.width = size;
    cv.height = size;
    const ctx = cv.getContext('2d');
    ctx.clearRect(0, 0, size, size);
    const rnd = createSeededRandom(1204);
    for (let i = 0; i < 290; i += 1) {
      const rx = 256 + (rnd() - 0.5) * 390;
      const ry = 465 - Math.pow(rnd(), 0.78) * 395;
      const heightFrac = 1 - ry / 480;
      const g = Math.round(74 + heightFrac * 62 + rnd() * 40);
      const r = Math.round(g * 0.6 + rnd() * 18);
      const b = Math.round(g * 0.42);
      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      ctx.beginPath();
      ctx.ellipse(rx, ry, 14 + rnd() * 14, 6 + rnd() * 7, (rnd() - 0.5) * 1.4, 0, Math.PI * 2);
      ctx.fill();
    }
    prebleedAlphaCanvas(cv, 58, 92, 36);
    return finalizeTexture(cv, { repeatX: 1, repeatY: 1, maxAnisotropy });
  };
  const shrubAtlasMap = buildShrubAtlas();

  // 17d. High-Res Alpha-Cutout Pinnate Coconut Palm Frond Atlas (512x512 RGBA — zero green triangle look!)
  const palmCanvas = document.createElement('canvas');
  palmCanvas.width = 512;
  palmCanvas.height = 512;
  const pmCtx = palmCanvas.getContext('2d');
  pmCtx.clearRect(0, 0, 512, 512);
  // Woody golden-olive central rachis midrib running V=0 (base) -> V=1 (tip)
  const rachisGrad = pmCtx.createLinearGradient(256, 510, 256, 10);
  rachisGrad.addColorStop(0, '#7c7542');
  rachisGrad.addColorStop(1, '#5d8437');
  pmCtx.strokeStyle = rachisGrad;
  pmCtx.lineCap = 'round';
  pmCtx.lineWidth = 9;
  pmCtx.beginPath();
  pmCtx.moveTo(256, 508);
  pmCtx.lineTo(256, 18);
  pmCtx.stroke();

  const randPm = createSeededRandom(308);
  for (let y = 26; y <= 490; y += 10) {
    const tTip = 1 - (y - 26) / 464; // 0 = base, 1 = tip
    const spread = (Math.sin(Math.pow(1 - tTip, 0.72) * Math.PI) * 208 + 26);
    const leafW = 3.2 + (1 - Math.abs(tTip - 0.5)) * 2.2;
    [-1, 1].forEach((side) => {
      const shade = Math.round(86 + randPm() * 44 - tTip * 12);
      pmCtx.strokeStyle = `rgb(${Math.round(shade * 0.62)}, ${shade}, ${Math.round(shade * 0.36)})`;
      pmCtx.lineWidth = leafW;
      pmCtx.beginPath();
      pmCtx.moveTo(256, y);
      const endX = 256 + side * (spread + (randPm() - 0.5) * 14);
      const midX = 256 + side * spread * 0.56;
      const midY = y - 16 - (1 - tTip) * 8;
      const endY = y + 18 + randPm() * 14;
      pmCtx.quadraticCurveTo(midX, midY, endX, endY);
      pmCtx.stroke();
    });
  }
  prebleedAlphaCanvas(palmCanvas, 64, 96, 38);
  const palmFrondAtlasMap = finalizeTexture(palmCanvas, { repeatX: 1, repeatY: 1, maxAnisotropy });
  const palmFrondMap = palmFrondAtlasMap;

  // 17e. Crisp KL University Crimson Main Gate Header Banner Texture
  const gateCanvas = document.createElement('canvas');
  gateCanvas.width = 1024;
  gateCanvas.height = 192;
  const gtCtx = gateCanvas.getContext('2d');
  gtCtx.fillStyle = '#8d1922';
  gtCtx.fillRect(0, 0, 1024, 192);
  gtCtx.strokeStyle = '#dfae48';
  gtCtx.lineWidth = 6;
  gtCtx.strokeRect(12, 12, 1000, 168);
  gtCtx.fillStyle = '#f8f5ec';
  gtCtx.textAlign = 'center';
  gtCtx.font = 'bold 62px Georgia, serif';
  gtCtx.fillText('KL UNIVERSITY  (KLEF)', 512, 92);
  gtCtx.fillStyle = '#f1d898';
  gtCtx.font = '600 28px sans-serif';
  gtCtx.fillText('GREEN FIELDS • VADDESWARAM CAMPUS', 512, 142);
  const gateSignMap = finalizeTexture(gateCanvas, { repeatX: 1, repeatY: 1, maxAnisotropy });

  // 18. Azure Swimming Pool Lane Tiles
  const poolCanvas = document.createElement('canvas');
  poolCanvas.width = 256;
  poolCanvas.height = 256;
  const plCtx = poolCanvas.getContext('2d');
  plCtx.fillStyle = '#298fb5';
  plCtx.fillRect(0, 0, 256, 256);
  plCtx.strokeStyle = 'rgba(255,255,255,0.22)';
  for (let k = 0; k < 256; k += 16) {
    plCtx.beginPath();
    plCtx.moveTo(k, 0);
    plCtx.lineTo(k, 256);
    plCtx.moveTo(0, k);
    plCtx.lineTo(256, k);
    plCtx.stroke();
  }
  plCtx.fillStyle = '#0f2836';
  for (let x = 28; x < 256; x += 50) {
    plCtx.fillRect(x, 12, 4, 232);
  }
  const poolMap = finalizeTexture(poolCanvas, { repeatX: 1, repeatY: 1, maxAnisotropy });

  const all = {
    limestoneMap,
    concreteBumpMap,
    concreteMap,
    concreteNormalMap,
    concreteRoughnessMap,
    glassMap,
    curtainGlassMap,
    curtainGlassRoughnessMap,
    punchedAcademicMap,
    punchedAcademicNormalMap,
    punchedAcademicRoughnessMap,
    hostelLoggiaMap,
    hostelLoggiaNormalMap,
    stackedStoneMap,
    stackedStoneNormalMap,
    grassMap,
    terrainNormalMap,
    farmlandMap,
    farmlandNormalMap,
    canalWaterMap,
    paverMap,
    paverNormalMap,
    terracottaMap,
    terracottaNormalMap,
    indoorBrickMap,
    indoorBrickNormalMap,
    solarMap,
    roadMap,
    roadNormalMap,
    roadRoughnessMap,
    curbStripeMap,
    woodMap,
    woodNormalMap,
    waterNormalsMap,
    barkMap,
    barkNormalMap,
    rainLeafAtlasMap,
    gulmoharLeafAtlasMap,
    shrubAtlasMap,
    palmFrondAtlasMap,
    gateSignMap,
    leafFoliageMap,
    leafSprigMap,
    palmFrondMap,
    poolMap
  };

  return {
    ...all,
    dispose: () => {
      Object.values(all).forEach((tex) => {
        if (tex && typeof tex.dispose === 'function') tex.dispose();
      });
    }
  };
}
