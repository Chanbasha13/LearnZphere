import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

/**
 * Modular GLB + LOD runtime asset loader for KL University architectural assets.
 * Binds shared PBR texture maps onto named GLTF semantic material slots so VRAM is
 * reused cleanly across the entire 1.1 km campus, supporting both compiled parametric GLBs
 * and external Blender / Draco `.glb` models.
 */
export function createKluAssetLoader(textures, dracoDecoderPath = null) {
  const loader = new GLTFLoader();
  let draco = null;
  if (dracoDecoderPath) {
    draco = new DRACOLoader();
    draco.setDecoderPath(dracoDecoderPath);
    loader.setDRACOLoader(draco);
  }

  const sharedMaterials = buildSharedGlbMaterialMap(textures);
  const cache = new Map();

  function buildSharedGlbMaterialMap(tex) {
    if (!tex) return {};
    return {
      StuccoWhite: new THREE.MeshStandardMaterial({
        map: tex.concreteMap,
        normalMap: tex.concreteNormalMap,
        normalScale: new THREE.Vector2(0.45, 0.45),
        roughnessMap: tex.concreteRoughnessMap,
        color: 0xf4f0e8,
        roughness: 0.85,
        metalness: 0.02,
        vertexColors: true
      }),
      StuccoWarmTrim: new THREE.MeshStandardMaterial({
        map: tex.concreteMap,
        normalMap: tex.concreteNormalMap,
        normalScale: new THREE.Vector2(0.4, 0.4),
        color: 0xe6dfd3,
        roughness: 0.82,
        metalness: 0.02,
        vertexColors: true
      }),
      ConcreteMuted: new THREE.MeshStandardMaterial({
        map: tex.concreteMap,
        normalMap: tex.concreteNormalMap,
        normalScale: new THREE.Vector2(0.38, 0.38),
        color: 0xd5cfc4,
        roughness: 0.88,
        metalness: 0.02,
        vertexColors: true
      }),
      CharcoalPrecast: new THREE.MeshStandardMaterial({
        map: tex.concreteMap,
        normalMap: tex.concreteNormalMap,
        normalScale: new THREE.Vector2(0.4, 0.4),
        color: 0x2c313a,
        roughness: 0.68,
        metalness: 0.14,
        vertexColors: true
      }),
      TerracottaMetallic: new THREE.MeshStandardMaterial({
        color: 0xb14925,
        roughness: 0.44,
        metalness: 0.34
      }),
      TerracottaBrick: new THREE.MeshStandardMaterial({
        map: tex.terracottaMap,
        normalMap: tex.terracottaNormalMap,
        normalScale: new THREE.Vector2(0.6, 0.6),
        color: 0xdca08b,
        roughness: 0.82,
        metalness: 0.04,
        vertexColors: true
      }),
      IndoorBrick: new THREE.MeshStandardMaterial({
        map: tex.indoorBrickMap,
        normalMap: tex.indoorBrickNormalMap,
        normalScale: new THREE.Vector2(0.6, 0.6),
        color: 0xecd8cc,
        roughness: 0.82,
        metalness: 0.04,
        vertexColors: true
      }),
      StackedStone: new THREE.MeshStandardMaterial({
        map: tex.stackedStoneMap,
        normalMap: tex.stackedStoneNormalMap,
        normalScale: new THREE.Vector2(0.85, 0.85),
        color: 0xded9d0,
        roughness: 0.9,
        metalness: 0.02,
        vertexColors: true
      }),
      TimberFascia: new THREE.MeshStandardMaterial({
        map: tex.woodMap,
        normalMap: tex.woodNormalMap,
        normalScale: new THREE.Vector2(0.55, 0.55),
        color: 0xf4e3cf,
        roughness: 0.65,
        metalness: 0.04,
        vertexColors: true
      }),
      DarkAnodizedSteel: new THREE.MeshStandardMaterial({
        color: 0x1c2026,
        roughness: 0.36,
        metalness: 0.72
      }),
      BrushedSteel: new THREE.MeshStandardMaterial({
        color: 0x7e8792,
        roughness: 0.4,
        metalness: 0.58
      }),
      SteelVaultRoof: new THREE.MeshStandardMaterial({
        color: 0xb7bdc4,
        roughness: 0.36,
        metalness: 0.56
      }),
      MaroonArchSteel: new THREE.MeshStandardMaterial({
        color: 0x5c241d,
        roughness: 0.46,
        metalness: 0.48
      }),
      CurtainGlass: new THREE.MeshPhysicalMaterial({
        map: tex.curtainGlassMap,
        roughnessMap: tex.curtainGlassRoughnessMap,
        color: 0x203242,
        roughness: 0.1,
        metalness: 0.34,
        reflectivity: 0.72,
        clearcoat: 0.62,
        clearcoatRoughness: 0.08,
        envMapIntensity: 0.85
      }),
      ClearAtriumGlass: new THREE.MeshPhysicalMaterial({
        color: 0x4a697c,
        roughness: 0.08,
        metalness: 0.12,
        transparent: true,
        opacity: 0.36,
        reflectivity: 0.78,
        clearcoat: 0.75,
        clearcoatRoughness: 0.08,
        envMapIntensity: 0.75
      }),
      RecessedCavityGlass: new THREE.MeshPhysicalMaterial({
        map: tex.curtainGlassMap,
        color: 0x162430,
        roughness: 0.12,
        metalness: 0.28,
        clearcoat: 0.48,
        envMapIntensity: 0.55
      }),
      AquaBalconyGlass: new THREE.MeshPhysicalMaterial({
        color: 0x43a1a6,
        roughness: 0.28,
        metalness: 0.12,
        transparent: true,
        opacity: 0.84
      }),
      PurpleCore: new THREE.MeshStandardMaterial({
        color: 0x5c3e66,
        roughness: 0.72,
        metalness: 0.06,
        vertexColors: true
      }),
      RedGranite: new THREE.MeshStandardMaterial({
        map: tex.terracottaMap,
        normalMap: tex.terracottaNormalMap,
        normalScale: new THREE.Vector2(0.45, 0.45),
        color: 0xa25444,
        roughness: 0.58,
        metalness: 0.06,
        vertexColors: true
      }),
      CrimsonFascia: new THREE.MeshStandardMaterial({
        color: 0x8f1922,
        roughness: 0.38,
        metalness: 0.18
      }),
      GoldKalasha: new THREE.MeshStandardMaterial({
        color: 0xd1a141,
        roughness: 0.26,
        metalness: 0.72
      }),
      RoofSlabConcrete: new THREE.MeshStandardMaterial({
        map: tex.concreteMap,
        normalMap: tex.concreteNormalMap,
        normalScale: new THREE.Vector2(0.4, 0.4),
        color: 0xb7b1a6,
        roughness: 0.92,
        metalness: 0.02,
        vertexColors: true
      }),
      SolarPV: new THREE.MeshPhysicalMaterial({
        map: tex.solarMap,
        roughness: 0.16,
        metalness: 0.45,
        clearcoat: 0.85,
        clearcoatRoughness: 0.12
      }),
      WarmAtriumInterior: new THREE.MeshStandardMaterial({
        color: 0xedd6b4,
        emissive: 0xffd194,
        emissiveIntensity: 0.36,
        roughness: 0.68
      }),
      SoilBed: new THREE.MeshStandardMaterial({
        color: 0x473c32,
        roughness: 0.95,
        metalness: 0.0
      }),
      PlanterFoliage: new THREE.MeshStandardMaterial({
        map: tex.leafFoliageMap,
        color: 0x90ba7b,
        roughness: 0.84,
        metalness: 0.0,
        vertexColors: true
      })
    };
  }

  function hydrateNodeMaterials(root, building) {
    root.traverse((child) => {
      if (!child.isMesh) return;
      const matName = child.material?.name;
      if (matName && sharedMaterials[matName]) {
        child.material.dispose?.();
        child.material = sharedMaterials[matName];
      } else if (child.material && child.material.vertexColors && !child.geometry?.attributes?.color) {
        child.material.vertexColors = false;
      }

      const isGlass = matName && matName.includes('Glass');
      child.castShadow = !isGlass && matName !== 'SoilBed';
      child.receiveShadow = true;

      if (building) {
        child.userData.buildingId = building.id;
        child.userData.building = building;
      }
    });
  }

  async function loadBuildingGlbLOD(url, building, lodSwitchDist = 240) {
    let baseGltf = cache.get(url);
    if (!baseGltf) {
      baseGltf = await loader.loadAsync(url);
      cache.set(url, baseGltf);
    }

    const lod = new THREE.LOD();
    lod.name = `lod-building-${building.id}`;
    lod.userData.buildingId = building.id;
    lod.userData.building = building;

    const clonedScene = baseGltf.scene.clone(true);
    const lod0 = clonedScene.getObjectByName('LOD0_High');
    const lod1 = clonedScene.getObjectByName('LOD1_Medium');

    if (lod0 && lod1) {
      hydrateNodeMaterials(lod0, building);
      hydrateNodeMaterials(lod1, building);
      lod.addLevel(lod0, 0);
      lod.addLevel(lod1, lodSwitchDist);
    } else {
      hydrateNodeMaterials(clonedScene, building);
      lod.addLevel(clonedScene, 0);
    }

    if (building.center) {
      lod.position.set(building.center[0], 0, building.center[1]);
    }
    if (typeof building.angle === 'number') {
      lod.rotation.y = -building.angle;
    }

    return lod;
  }

  /**
   * Loads a single modular `.glb` asset once and returns hydrated geometry + material pairs for instancing (`InstancedMesh`).
   */
  async function loadPrototypeGlbMeshes(url) {
    let baseGltf = cache.get(url);
    if (!baseGltf) {
      baseGltf = await loader.loadAsync(url);
      cache.set(url, baseGltf);
    }
    const items = [];
    const cloned = baseGltf.scene.clone(true);
    const lod0 = cloned.getObjectByName('LOD0_High') || cloned;
    lod0.traverse((child) => {
      if (!child.isMesh) return;
      const matName = child.material?.name;
      const mat = (matName && sharedMaterials[matName]) ? sharedMaterials[matName] : child.material;
      items.push({ geometry: child.geometry, material: mat, name: child.name });
    });
    return items;
  }

  return {
    loadBuildingGlbLOD,
    loadPrototypeGlbMeshes,
    sharedMaterials,
    dispose: () => {
      Object.values(sharedMaterials).forEach((m) => m.dispose?.());
      cache.forEach((gltf) => {
        gltf.scene?.traverse((c) => {
          if (c.isMesh) {
            c.geometry?.dispose?.();
            c.material?.dispose?.();
          }
        });
      });
      cache.clear();
      draco?.dispose?.();
    }
  };
}
