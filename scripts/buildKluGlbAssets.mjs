import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { createAllBuildingGlbSpecs } from '../src/scenes/kluBuildingModels.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'public', 'assets', 'models');

// Node.js Blob -> ArrayBuffer shim for Three.js GLTFExporter binary mode
if (typeof globalThis.FileReader === 'undefined') {
  globalThis.FileReader = class NodeFileReader {
    readAsArrayBuffer(blob) {
      blob
        .arrayBuffer()
        .then((buf) => {
          this.result = buf;
          if (typeof this.onloadend === 'function') this.onloadend({ target: this });
        })
        .catch((err) => {
          if (typeof this.onerror === 'function') this.onerror(err);
        });
    }
    readAsDataURL(blob) {
      blob
        .arrayBuffer()
        .then((buf) => {
          const b64 = Buffer.from(buf).toString('base64');
          this.result = `data:${blob.type || 'application/octet-stream'};base64,${b64}`;
          if (typeof this.onloadend === 'function') this.onloadend({ target: this });
        })
        .catch((err) => {
          if (typeof this.onerror === 'function') this.onerror(err);
        });
    }
  };
}

function countStats(obj) {
  let vertices = 0;
  let triangles = 0;
  let meshes = 0;
  obj.traverse((child) => {
    if (child.isMesh && child.geometry?.attributes?.position) {
      meshes += 1;
      const count = child.geometry.attributes.position.count;
      vertices += count;
      triangles += child.geometry.index ? child.geometry.index.count / 3 : count / 3;
    }
  });
  return { meshes, vertices, triangles: Math.round(triangles) };
}

async function main() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  const exporter = new GLTFExporter();
  const specs = createAllBuildingGlbSpecs();
  const manifestAssets = [];
  let totalBytes = 0;

  for (const spec of specs) {
    const rootGroup = spec.buildRoot();
    const glbBuffer = await exporter.parseAsync(rootGroup, {
      binary: true,
      onlyVisible: false
    });
    const outPath = path.join(OUTPUT_DIR, `${spec.fileName}.glb`);
    await fs.writeFile(outPath, Buffer.from(glbBuffer));

    const lod0 = rootGroup.getObjectByName('LOD0_High');
    const lod1 = rootGroup.getObjectByName('LOD1_Medium');
    const stat = await fs.stat(outPath);
    totalBytes += stat.size;

    manifestAssets.push({
      id: spec.id,
      file: `/assets/models/${spec.fileName}.glb`,
      bytes: stat.size,
      provenance: 'stage-c-parametric-architectural-glb',
      photogrammetry: false,
      blenderExternal: false,
      lodLevels: {
        LOD0_High: lod0 ? countStats(lod0) : null,
        LOD1_Medium: lod1 ? countStats(lod1) : null
      }
    });

    rootGroup.traverse((c) => {
      if (c.isMesh && c.geometry) c.geometry.dispose();
      if (c.material) {
        const ms = Array.isArray(c.material) ? c.material : [c.material];
        ms.forEach((m) => m?.dispose?.());
      }
    });
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    generator: 'scripts/buildKluGlbAssets.mjs (Three.js GLTFExporter binary .glb w/ mergeVertices)',
    stageStatus: 'Stage C Complete Campus Architectural GLBs (24 KLU structures + 1 residential prototype)',
    totalBytes,
    totalMB: +(totalBytes / (1024 * 1024)).toFixed(2),
    assets: manifestAssets
  };

  await fs.writeFile(path.join(OUTPUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(`EXPORTED ${manifestAssets.length} GLB MODELS | TOTAL SIZE = ${manifest.totalMB} MB`);
  for (const a of manifestAssets) {
    console.log(` - ${a.id}: ${Math.round(a.bytes / 1024)} KB | LOD0=${a.lodLevels.LOD0_High?.triangles} tris | LOD1=${a.lodLevels.LOD1_Medium?.triangles} tris`);
  }
}

main().catch((err) => {
  console.error('GLB_BUILD_FAILED:', err);
  process.exit(1);
});
