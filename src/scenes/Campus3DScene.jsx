import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Sky } from 'three/examples/jsm/objects/Sky.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/examples/jsm/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import {
  Compass,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Map as MapIcon,
  Box,
  SlidersHorizontal,
  ArrowRight,
  X,
  MapPin,
  BookOpen,
  Building2,
  AlertTriangle,
  Search,
  Footprints,
  Maximize2,
  Minimize2,
  Play,
  ExternalLink,
  GraduationCap,
  CheckCircle2,
  ChevronDown
} from 'lucide-react';
import { KLU_BUILDINGS } from '../data/kluCampusData';
import {
  KLU_BUILDING_CATALOGUE,
  KLU_MEDIA_SOURCES,
  KLU_SOURCE_REGISTRY,
  AERIAL_TOUR_PRESETS,
  GROUND_TOUR_WAYPOINTS
} from '../data/kluReferenceCatalogue';
import { DEPARTMENTS } from '../data/departmentsData';
import { useTheme } from '../context/ThemeContext';
import { useCourses } from '../context/CourseContext';
import { createCampusTextures } from '../utils/campusTextures';
import { buildCampusSceneGraph } from './campusBuildings';
import { pushOutFromPolygonXZ } from './kluArchBuilders';

const DEFAULT_AERIAL_POS = new THREE.Vector3(-8, 360, 578);
const DEFAULT_AERIAL_TARGET = new THREE.Vector3(32, 6, 8);

const CATEGORY_FILTERS = [
  { id: 'all', label: 'All (26)' },
  { id: 'academic', label: 'Academic' },
  { id: 'sports', label: 'Sports' },
  { id: 'hostel', label: 'Hostels' },
  { id: 'campus', label: 'Campus Life' }
];

const CORE_OVERVIEW_PIN_IDS = new Set([
  'central-library',
  'c-block',
  'fed-block',
  'rnd-block',
  'sdc-block',
  'cricket-ground',
  'himalaya-hostel',
  'tulip-hostel',
  'kgh-hostel'
]);

const PIN_SHORT_NAMES = {
  'central-library': 'Central Library',
  'c-block': 'C Block',
  'fed-block': 'FED Block',
  'rnd-block': 'R&D Block',
  'sdc-block': 'SDC (S Block)',
  'arts-block': 'Arts Block',
  'm-block': 'M Block',
  'skc-block': 'SKC-Block',
  'mech-labs': 'Mech Labs',
  'se-annex-provisional': 'SE Annex*',
  'open-air-theatre': 'Open Air Theatre',
  'main-canteen': 'Main Canteen',
  'hindu-temple': 'Temple',
  'bus-stand': 'Bus Stand',
  'indoor-stadium': 'Indoor Stadium',
  'sports-complex-provisional': 'Sports Complex*',
  'cricket-ground': 'Cricket Stadium',
  'swimming-pool': 'Swimming Pool',
  'kgh-hostel': 'KGH Hostel',
  'aravali-hostel': 'Aravali',
  'vindhya-hostel': 'Vindhya',
  'staff-quarters': 'Staff Quarters',
  'indhu-hostel': 'Indhu Hostel',
  'himalaya-hostel': 'Himalaya Hostel',
  'lotus-hostel-provisional': 'Lotus Hostel',
  'tulip-hostel': 'Tulip Hostel'
};

export default function Campus3DScene({
  isExpanded = true,
  isClosing = false,
  onRequestOpen = null,
  onRequestClose = null
}) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isDark } = useTheme();
  const { courses } = useCourses();
  const isTeaser = Boolean(onRequestOpen) && !isExpanded;

  const sectionRef = useRef(null);
  const viewportRef = useRef(null);
  const canvasRef = useRef(null);
  const labelRefs = useRef({});
  const pressedKeysRef = useRef({});

  const cameraModeRef = useRef('aerial');
  const activeFilterRef = useRef('all');
  const selectedIdRef = useRef(null);
  const hoveredIdRef = useRef(null);

  const threeStateRef = useRef({
    scene: null,
    camera: null,
    renderer: null,
    composer: null,
    gtaoPass: null,
    sky: null,
    sunVec: new THREE.Vector3(140, 260, 120),
    envRT: null,
    pmrem: null,
    controls: null,
    graph: null,
    dirLight: null,
    hemiLight: null,
    ambientLight: null,
    flight: null
  });

  const [selectedBuildingId, setSelectedBuildingId] = useState(null);
  const [hoveredBuildingId, setHoveredBuildingId] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [cameraMode, setCameraMode] = useState('aerial'); // 'aerial' | 'ground'
  const [activeGroundId, setActiveGroundId] = useState('walk-library');
  const [viewMode, setViewMode] = useState('3d'); // '3d' | 'directory'
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [presetsOpen, setPresetsOpen] = useState(false);
  const [videoExpanded, setVideoExpanded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [quality, setQuality] = useState(() => {
    if (typeof window === 'undefined') return 'high';
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const isSmallScreen = window.innerWidth < 768;
    return reducedMotion || isSmallScreen ? 'reduced' : 'high';
  });
  const [isSceneReady, setIsSceneReady] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [webglUnavailable, setWebglUnavailable] = useState(false);

  cameraModeRef.current = cameraMode;
  activeFilterRef.current = categoryFilter;
  selectedIdRef.current = selectedBuildingId;
  hoveredIdRef.current = hoveredBuildingId;

  const filteredBuildings = useMemo(() => {
    if (categoryFilter === 'all') return KLU_BUILDINGS;
    return KLU_BUILDINGS.filter((b) => {
      if (categoryFilter === 'campus') return b.category === 'campus' || b.category === 'facility';
      return b.category === categoryFilter;
    });
  }, [categoryFilter]);

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return KLU_BUILDINGS.slice(0, 8);
    return KLU_BUILDINGS.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.code.toLowerCase().includes(q) ||
        b.subtitle.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [searchQuery]);

  const selectedBuilding = KLU_BUILDINGS.find((b) => b.id === selectedBuildingId) || null;
  const selectedCatalogue = selectedBuilding ? KLU_BUILDING_CATALOGUE[selectedBuilding.id] || null : null;
  const linkedDepartment = selectedBuilding?.departmentId
    ? DEPARTMENTS.find((d) => d.id === selectedBuilding.departmentId) || null
    : null;
  const linkedCourses = selectedBuilding
    ? courses.filter(
        (c) =>
          (selectedBuilding.courseIds && selectedBuilding.courseIds.includes(Number(c.id))) ||
          (selectedBuilding.departmentId && c.departmentId === selectedBuilding.departmentId)
      )
    : [];

  useEffect(() => {
    setVideoExpanded(false);
  }, [selectedBuildingId]);

  const flyCameraTo = useCallback((targetPos, targetLookAt, duration = 950, nextMode = null) => {
    const { camera, controls } = threeStateRef.current;
    if (!camera || !controls) return;

    if (nextMode === 'ground') {
      controls.minDistance = 0.8;
      controls.maxDistance = 8.0;
      controls.maxPolarAngle = Math.PI * 0.72;
      controls.minPolarAngle = Math.PI * 0.14;
      controls.screenSpacePanning = false;
    } else if (nextMode === 'aerial') {
      controls.minDistance = 18;
      controls.maxDistance = 1150;
      controls.maxPolarAngle = Math.PI / 2 - 0.04;
      controls.minPolarAngle = 0.08;
      controls.screenSpacePanning = false;
    }

    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion || duration <= 0) {
      camera.position.copy(targetPos);
      controls.target.copy(targetLookAt);
      controls.update();
      return;
    }

    threeStateRef.current.flight = {
      startTime: performance.now(),
      duration,
      fromPos: camera.position.clone(),
      toPos: targetPos.clone(),
      fromTarget: controls.target.clone(),
      toTarget: targetLookAt.clone()
    };
  }, []);

  const handleSelectBuilding = useCallback(
    (building) => {
      setSelectedBuildingId(building.id);
      setSearchOpen(false);
      setPresetsOpen(false);
      if (viewMode !== '3d') return;

      const cx = building.center[0];
      const cz = building.center[1];

      if (cameraModeRef.current === 'ground') {
        // Move pedestrian observer cleanly to street-level courtyard vantage outside building walls
        const approachOffset = Math.max(30, Math.max(building.w || 40, building.d || 40) * 0.72);
        const approachX = cx > 120 ? cx - approachOffset * 0.78 : cx - approachOffset * 0.52;
        const approachZ = cz - approachOffset * 0.68;
        const [safeX, safeZ] = building.polygon
          ? pushOutFromPolygonXZ(approachX, approachZ, building.polygon, 6.5)
          : [approachX, approachZ];
        const pos = new THREE.Vector3(safeX, 1.85, safeZ);
        const dir = new THREE.Vector3(cx - pos.x, 4.2, cz - pos.z).normalize().multiplyScalar(2.6);
        flyCameraTo(pos, pos.clone().add(dir), 950, 'ground');
      } else {
        const span = Math.max(building.w || 40, building.d || 40, building.height || 20);
        const camDist = Math.min(185, Math.max(66, span * 1.18));
        const sideSign = cx > 180 ? -1 : 1;
        const toPos = new THREE.Vector3(
          cx + camDist * 0.55 * sideSign,
          Math.max(32, building.height * 1.25 + 24),
          cz + camDist * 0.85
        );
        const toTarget = new THREE.Vector3(cx, Math.min(16, building.height * 0.42), cz);
        flyCameraTo(toPos, toTarget, 950, 'aerial');
      }
    },
    [flyCameraTo, viewMode]
  );

  const handleAerialPreset = useCallback(
    (preset) => {
      setPresetsOpen(false);
      setCameraMode('aerial');
      if (preset.id !== 'overview') {
        const match = KLU_BUILDINGS.find(
          (b) => b.id === preset.id || (preset.id === 'hostels' && b.id === 'himalaya-hostel') || (preset.id === 'sports-complex' && b.id === 'sports-complex-provisional')
        );
        setSelectedBuildingId(match ? match.id : null);
      } else {
        setSelectedBuildingId(null);
      }
      flyCameraTo(new THREE.Vector3(...preset.pos), new THREE.Vector3(...preset.target), 950, 'aerial');
    },
    [flyCameraTo]
  );

  const handleGroundWaypoint = useCallback(
    (wp) => {
      setPresetsOpen(false);
      setSelectedBuildingId(null);
      setCameraMode('ground');
      setActiveGroundId(wp.id);
      const pos = new THREE.Vector3(...wp.pos);
      const lookDir = new THREE.Vector3(...wp.lookAt).sub(pos).normalize().multiplyScalar(2.4);
      flyCameraTo(pos, pos.clone().add(lookDir), 1000, 'ground');
    },
    [flyCameraTo]
  );

  const handleToggleCameraMode = useCallback(
    (mode) => {
      if (mode === 'ground') {
        setSelectedBuildingId(null);
        const wp = GROUND_TOUR_WAYPOINTS.find((w) => w.id === activeGroundId) || GROUND_TOUR_WAYPOINTS[1];
        handleGroundWaypoint(wp);
      } else {
        setCameraMode('aerial');
        setSelectedBuildingId(null);
        flyCameraTo(DEFAULT_AERIAL_POS, DEFAULT_AERIAL_TARGET, 900, 'aerial');
      }
    },
    [activeGroundId, flyCameraTo, handleGroundWaypoint]
  );

  const handleZoomStep = useCallback((factor) => {
    const { camera, controls } = threeStateRef.current;
    if (!camera || !controls) return;
    threeStateRef.current.flight = null;
    const offset = camera.position.clone().sub(controls.target);
    const minD = cameraModeRef.current === 'ground' ? 0.8 : 18;
    const maxD = cameraModeRef.current === 'ground' ? 8.0 : 1150;
    const nextLen = THREE.MathUtils.clamp(offset.length() * factor, minD, maxD);
    offset.setLength(nextLen);
    camera.position.copy(controls.target).add(offset);
    controls.update();
  }, []);

  const toggleFullscreen = useCallback(() => {
    const targetEl = viewportRef.current || sectionRef.current;
    if (!targetEl) return;
    if (!document.fullscreenElement) {
      targetEl.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  }, []);

  useEffect(() => {
    const onFs = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  // Main WebGL Digital-Twin Lifecycle
  useEffect(() => {
    if (viewMode !== '3d' || !canvasRef.current || !viewportRef.current) return;

    setLoadProgress(18);
    const canvas = canvasRef.current;
    const container = viewportRef.current;
    const width = Math.max(container.clientWidth, 320);
    const height = Math.max(container.clientHeight, 360);

    let renderer;
    let textures = null;
    let composer = null;
    let gtaoPass = null;
    let pmrem = null;
    let envRT = null;

    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: quality === 'high',
        powerPreference: quality === 'high' ? 'high-performance' : 'low-power'
      });
    } catch {
      setWebglUnavailable(true);
      setViewMode('directory');
      return;
    }

    const isHigh = quality === 'high';
    renderer.setSize(width, height, false);
    renderer.setPixelRatio(isHigh ? Math.min(window.devicePixelRatio || 1, 2) : 1);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.82;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = isHigh ? THREE.PCFSoftShadowMap : THREE.BasicShadowMap;

    const scene = new THREE.Scene();

    // Physical Preetham Atmospheric Sky Dome + Real Sky IBL Reflection Environment
    const sky = new Sky();
    sky.scale.setScalar(18000);
    scene.add(sky);

    const sunVec = new THREE.Vector3();
    pmrem = new THREE.PMREMGenerator(renderer);
    pmrem.compileEquirectangularShader();

    const updateSkyAndIBL = (dark) => {
      const uniforms = sky.material.uniforms;
      uniforms['turbidity'].value = dark ? 8.5 : 3.4;
      uniforms['rayleigh'].value = dark ? 2.6 : 1.15;
      uniforms['mieCoefficient'].value = 0.0042;
      uniforms['mieDirectionalG'].value = 0.8;

      const elevationDeg = dark ? 1.4 : 39.0;
      const azimuthDeg = dark ? 222 : 142;
      const phi = THREE.MathUtils.degToRad(90 - elevationDeg);
      const theta = THREE.MathUtils.degToRad(azimuthDeg);
      sunVec.setFromSphericalCoords(1, phi, theta);
      uniforms['sunPosition'].value.copy(sunVec);

      renderer.toneMappingExposure = dark ? 0.94 : 0.92;
      scene.fog = new THREE.FogExp2(dark ? 0x141f32 : 0xdde8f2, dark ? 0.00048 : 0.00024);

      // Re-bake quick sky HDR reflection map for realistic water, solar PV & glazing reflections
      try {
        const skyOnlyScene = new THREE.Scene();
        const skyClone = new Sky();
        skyClone.scale.setScalar(500);
        Object.keys(uniforms).forEach((k) => {
          skyClone.material.uniforms[k].value = uniforms[k].value.clone ? uniforms[k].value.clone() : uniforms[k].value;
        });
        skyOnlyScene.add(skyClone);
        if (envRT) envRT.dispose();
        envRT = pmrem.fromScene(skyOnlyScene, 0.04);
        scene.environment = envRT.texture;
        skyClone.geometry.dispose();
        skyClone.material.dispose();
      } catch {
        // Non-critical IBL fallback
      }
    };

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.8, 3400);
    camera.position.copy(DEFAULT_AERIAL_POS);

    const controls = new OrbitControls(camera, canvas);
    controls.target.copy(DEFAULT_AERIAL_TARGET);
    controls.enableDamping = true;
    controls.dampingFactor = 0.068;
    controls.screenSpacePanning = false;
    controls.minDistance = 18;
    controls.maxDistance = 1150;
    controls.maxPolarAngle = Math.PI / 2 - 0.04;
    controls.minPolarAngle = 0.08;
    controls.panSpeed = 0.85;
    controls.rotateSpeed = 0.7;
    controls.zoomSpeed = 0.92;
    controls.update();

    const cancelFlight = () => {
      threeStateRef.current.flight = null;
    };
    controls.addEventListener('start', cancelFlight);

    const hemiLight = new THREE.HemisphereLight(0xdfeefa, 0x676d57, 0.5);
    scene.add(hemiLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.05);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffe9cf, 2.75);
    dirLight.position.set(190, 310, 155);
    dirLight.castShadow = true;
    const shadowSize = isHigh ? 2048 : 1024;
    dirLight.shadow.mapSize.set(shadowSize, shadowSize);
    dirLight.shadow.camera.near = 40;
    dirLight.shadow.camera.far = 1250;
    dirLight.shadow.camera.left = -430;
    dirLight.shadow.camera.right = 430;
    dirLight.shadow.camera.top = 340;
    dirLight.shadow.camera.bottom = -340;
    dirLight.shadow.bias = -0.00025;
    dirLight.shadow.normalBias = 0.036;
    scene.add(dirLight);
    scene.add(dirLight.target);

    updateSkyAndIBL(isDark);
    setLoadProgress(48);

    const maxAniso = isHigh ? Math.min(renderer.capabilities.getMaxAnisotropy(), 8) : 2;
    textures = createCampusTextures(maxAniso);
    setLoadProgress(72);

    const graph = buildCampusSceneGraph(scene, textures, quality, sunVec);
    setLoadProgress(92);

    // Optional Ground-Truth Ambient Occlusion (GTAO) Post-Processing in High Arch-Viz Quality
    if (isHigh) {
      try {
        composer = new EffectComposer(renderer);
        const renderPass = new RenderPass(scene, camera);
        composer.addPass(renderPass);

        gtaoPass = new GTAOPass(scene, camera, width, height);
        gtaoPass.output = GTAOPass.OUTPUT.Default;
        gtaoPass.blendIntensity = 0.56;
        gtaoPass.updateGtaoMaterial({
          radius: 3.1,
          distanceExponent: 1.6,
          thickness: 1.15,
          scale: 0.9,
          samples: 10
        });
        composer.addPass(gtaoPass);
        composer.addPass(new OutputPass());
      } catch {
        composer = null;
        gtaoPass = null;
      }
    }

    threeStateRef.current = {
      scene,
      camera,
      renderer,
      composer,
      gtaoPass,
      sky,
      sunVec,
      envRT,
      pmrem,
      controls,
      graph,
      dirLight,
      hemiLight,
      ambientLight,
      updateSkyAndIBL,
      flight: null
    };

    let disposed = false;
    const applyLighting = (dark) => {
      updateSkyAndIBL(dark);
      if (dark) {
        hemiLight.color.setHex(0x6382ad);
        hemiLight.groundColor.setHex(0x1e2636);
        hemiLight.intensity = 0.62;
        dirLight.color.setHex(0xdcb089);
        dirLight.intensity = 1.62;
        ambientLight.intensity = 0.14;
      } else {
        hemiLight.color.setHex(0xdfeefa);
        hemiLight.groundColor.setHex(0x676d57);
        hemiLight.intensity = 0.5;
        dirLight.color.setHex(0xffe9cf);
        dirLight.intensity = 2.75;
        ambientLight.intensity = 0.05;
      }
      graph.applyThemeLighting(dark);
    };
    applyLighting(isDark);
    setLoadProgress(96);

    Promise.resolve(graph.readyPromise).finally(() => {
      if (!disposed) {
        setLoadProgress(100);
        setIsSceneReady(true);
      }
    });

    // Optional URL deep-linking (/?building=rnd-block, /?mode=ground&stop=walk-library, /?preset=c-block)
    const paramBuilding = searchParams.get('building');
    const paramMode = searchParams.get('mode');
    const paramStop = searchParams.get('stop');
    const paramPreset = searchParams.get('preset');

    if (paramMode === 'ground') {
      const wp = GROUND_TOUR_WAYPOINTS.find((w) => w.id === paramStop) || GROUND_TOUR_WAYPOINTS[1];
      setTimeout(() => handleGroundWaypoint(wp), 60);
    } else if (paramPreset) {
      const pr = AERIAL_TOUR_PRESETS.find((p) => p.id === paramPreset);
      if (pr) setTimeout(() => handleAerialPreset(pr), 60);
    } else if (paramBuilding) {
      const bld = KLU_BUILDINGS.find((b) => b.id === paramBuilding);
      if (bld) setTimeout(() => handleSelectBuilding(bld), 60);
    }

    // Raycasting
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const downPos = { x: 0, y: 0 };
    const interactiveMeshes = Array.from(graph.buildingGroups.values());

    const getHitBuildingId = (clientX, clientY) => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return null;
      pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(interactiveMeshes, true);
      if (hits.length > 0) return hits[0].object.userData.buildingId || null;
      return null;
    };

    const onPointerDown = (e) => {
      downPos.x = e.clientX;
      downPos.y = e.clientY;
    };
    const onPointerMove = (e) => {
      const hitId = getHitBuildingId(e.clientX, e.clientY);
      canvas.style.cursor = hitId ? 'pointer' : 'grab';
      setHoveredBuildingId((prev) => (prev === hitId ? prev : hitId));
    };
    const onPointerUp = (e) => {
      const dist = Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y);
      if (dist < 6) {
        const hitId = getHitBuildingId(e.clientX, e.clientY);
        if (hitId) {
          const bld = KLU_BUILDINGS.find((b) => b.id === hitId);
          if (bld) handleSelectBuilding(bld);
        }
      }
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);

    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w <= 0 || h <= 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
      if (composer) composer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    let animId = 0;
    let lastTime = performance.now();
    let prevShadowHalf = 430;
    const projVec = new THREE.Vector3();
    const walkForward = new THREE.Vector3();
    const walkRight = new THREE.Vector3();
    const shadowForward = new THREE.Vector3();

    const animate = (now) => {
      animId = requestAnimationFrame(animate);
      const dt = Math.min(0.05, (now - lastTime) * 0.001);
      lastTime = now;

      // Update distance-based GLB LOD levels
      if (graph.lods && graph.lods.length) {
        for (let l = 0; l < graph.lods.length; l += 1) {
          graph.lods[l].update(camera);
        }
      }

      // Smoothly transition FOV between Aerial Architecture (42°) and Human Eye Ground Walk (54°)
      const targetFov = cameraModeRef.current === 'ground' ? 54 : 42;
      if (Math.abs(camera.fov - targetFov) > 0.03) {
        camera.fov += (targetFov - camera.fov) * Math.min(1, dt * 6.5);
        camera.updateProjectionMatrix();
      }

      // Animate Krishna Canal ripple water
      if (graph.animatedWaters) {
        graph.animatedWaters.forEach((w) => {
          if (w.material?.normalMap) {
            w.material.normalMap.offset.x += dt * 0.032;
            w.material.normalMap.offset.y += dt * 0.014;
          } else if (w.material?.uniforms?.time) {
            w.material.uniforms.time.value += dt * 0.42;
          }
        });
      }

      // Smooth cubic ease-in-out flight
      const flight = threeStateRef.current.flight;
      if (flight) {
        const elapsed = now - flight.startTime;
        const t = Math.min(1, elapsed / flight.duration);
        const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        camera.position.lerpVectors(flight.fromPos, flight.toPos, ease);
        controls.target.lerpVectors(flight.fromTarget, flight.toTarget, ease);
        if (t >= 1) threeStateRef.current.flight = null;
      } else if (cameraModeRef.current === 'ground') {
        // Continuous WASD / Arrow pedestrian walking along campus paths with wall collision clamping
        const keys = pressedKeysRef.current;
        const moveF = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0);
        const moveR = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0);
        if (moveF !== 0 || moveR !== 0) {
          camera.getWorldDirection(walkForward);
          walkForward.y = 0;
          if (walkForward.lengthSq() > 0.001) walkForward.normalize();
          walkRight.crossVectors(walkForward, new THREE.Vector3(0, 1, 0)).normalize();
          const speed = 13.5 * dt;
          const delta = new THREE.Vector3()
            .addScaledVector(walkForward, moveF * speed)
            .addScaledVector(walkRight, moveR * speed);
          camera.position.add(delta);
          controls.target.add(delta);

          // Deflect pedestrian smoothly outside building polygons
          for (let bIdx = 0; bIdx < KLU_BUILDINGS.length; bIdx += 1) {
            const b = KLU_BUILDINGS[bIdx];
            if (!b.polygon || b.height <= 2.5 || b.id === 'open-air-theatre' || b.id === 'bus-stand') continue;
            const boundR = Math.max(b.w || 25, b.d || 25) * 0.72 + 2.2;
            if (Math.hypot(camera.position.x - b.center[0], camera.position.z - b.center[1]) > boundR) continue;
            const [nx, nz] = pushOutFromPolygonXZ(camera.position.x, camera.position.z, b.polygon, 1.8);
            const pushDx = nx - camera.position.x;
            const pushDz = nz - camera.position.z;
            if (Math.abs(pushDx) > 0.001 || Math.abs(pushDz) > 0.001) {
              camera.position.x = nx;
              camera.position.z = nz;
              controls.target.x += pushDx;
              controls.target.z += pushDz;
            }
          }
        }
        camera.position.y = 1.85;
      }

      if (cameraModeRef.current === 'aerial') {
        controls.target.x = THREE.MathUtils.clamp(controls.target.x, -440, 560);
        controls.target.z = THREE.MathUtils.clamp(controls.target.z, -350, 260);
        controls.target.y = THREE.MathUtils.clamp(controls.target.y, 0.5, 48);
      } else {
        camera.position.x = THREE.MathUtils.clamp(camera.position.x, -420, 560);
        camera.position.z = THREE.MathUtils.clamp(camera.position.z, -330, 240);
      }

      // Dynamic sun frustum shadow tightening (~3.8cm texel detail near ground/close-ups!)
      const viewDist = cameraModeRef.current === 'ground' ? 110 : camera.position.distanceTo(controls.target);
      const nextHalf = THREE.MathUtils.clamp(viewDist * 0.62, 78, 430);
      if (Math.abs(nextHalf - prevShadowHalf) > 6) {
        prevShadowHalf = nextHalf;
        dirLight.shadow.camera.left = -nextHalf;
        dirLight.shadow.camera.right = nextHalf;
        dirLight.shadow.camera.top = nextHalf * 0.84;
        dirLight.shadow.camera.bottom = -nextHalf * 0.84;
        dirLight.shadow.camera.updateProjectionMatrix();
      }
      let focusX = controls.target.x;
      let focusZ = controls.target.z;
      if (cameraModeRef.current === 'ground') {
        camera.getWorldDirection(shadowForward);
        shadowForward.y = 0;
        if (shadowForward.lengthSq() > 0.001) shadowForward.normalize();
        focusX = camera.position.x + shadowForward.x * 28;
        focusZ = camera.position.z + shadowForward.z * 28;
      }
      dirLight.target.position.set(focusX, 0, focusZ);
      dirLight.position.set(focusX + sunVec.x * 410, sunVec.y * 410, focusZ + sunVec.z * 410);

      controls.update();
      if (composer) {
        composer.render();
      } else {
        renderer.render(scene, camera);
      }

      // Project crisp building labels
      const w = container.clientWidth;
      const h = container.clientHeight;
      const camDist = camera.position.distanceTo(controls.target);
      const curFilter = activeFilterRef.current;
      const curSel = selectedIdRef.current;
      const curHov = hoveredIdRef.current;

      KLU_BUILDINGS.forEach((bld) => {
        const el = labelRefs.current[bld.id];
        if (!el) return;

        const matchesFilter =
          curFilter === 'all' ||
          (curFilter === 'campus' ? bld.category === 'campus' || bld.category === 'facility' : bld.category === curFilter);
        const isPriority = bld.id === curSel || bld.id === curHov;

        let visibleByDistance = false;
        if (isPriority) {
          visibleByDistance = true;
        } else if (cameraModeRef.current === 'ground') {
          const distToCam = Math.hypot(bld.center[0] - camera.position.x, bld.center[1] - camera.position.z);
          visibleByDistance = distToCam < 85;
        } else {
          const distToTarget = Math.hypot(bld.center[0] - controls.target.x, bld.center[1] - controls.target.z);
          visibleByDistance =
            matchesFilter && (curFilter !== 'all' ? true : camDist < 220 ? distToTarget < 190 : CORE_OVERVIEW_PIN_IDS.has(bld.id));
        }

        if (!visibleByDistance) {
          el.style.opacity = '0';
          el.style.pointerEvents = 'none';
          return;
        }

        projVec.set(bld.center[0], bld.height + 5.8, bld.center[1]);
        projVec.project(camera);

        if (projVec.z > 1 || projVec.z < -1) {
          el.style.opacity = '0';
          el.style.pointerEvents = 'none';
        } else {
          const sx = (projVec.x * 0.5 + 0.5) * w;
          const sy = (-projVec.y * 0.5 + 0.5) * h;
          el.style.transform = `translate(-50%, -100%) translate3d(${sx.toFixed(1)}px, ${sy.toFixed(1)}px, 0)`;
          el.style.opacity = '1';
          el.style.pointerEvents = 'auto';
        }
      });
    };

    animId = requestAnimationFrame(animate);

    return () => {
      disposed = true;
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      controls.removeEventListener('start', cancelFlight);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);

      controls.dispose();
      if (composer) composer.dispose();
      if (gtaoPass && gtaoPass.dispose) gtaoPass.dispose();
      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
          else obj.material.dispose();
        }
      });
      if (textures) textures.dispose();
      if (graph?.assetLoader) graph.assetLoader.dispose();
      if (envRT) envRT.dispose();
      if (pmrem) pmrem.dispose();
      renderer.dispose();
      threeStateRef.current.scene = null;
      setIsSceneReady(false);
    };
  }, [viewMode, quality]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isSceneReady) return;
    const paramBuilding = searchParams.get('building');
    const paramMode = searchParams.get('mode');
    const paramStop = searchParams.get('stop');
    const paramPreset = searchParams.get('preset');

    if (paramMode === 'ground') {
      const wp = GROUND_TOUR_WAYPOINTS.find((w) => w.id === paramStop) || GROUND_TOUR_WAYPOINTS[1];
      handleGroundWaypoint(wp);
    } else if (paramPreset) {
      const pr = AERIAL_TOUR_PRESETS.find((p) => p.id === paramPreset);
      if (pr) handleAerialPreset(pr);
    } else if (paramBuilding) {
      const bld = KLU_BUILDINGS.find((b) => b.id === paramBuilding);
      if (bld && bld.id !== selectedIdRef.current) {
        setViewMode('3d');
        handleSelectBuilding(bld);
      }
    }
  }, [searchParams, isSceneReady, handleSelectBuilding, handleGroundWaypoint, handleAerialPreset]);

  // Lock page scroll only when overlay drawer is expanded, and trigger clean resize tick
  useEffect(() => {
    if (!onRequestClose) return undefined;
    if (isExpanded) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      const t = setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 60);
      return () => {
        clearTimeout(t);
        document.body.style.overflow = prevOverflow;
      };
    }
    return undefined;
  }, [isExpanded, onRequestClose]);

  useEffect(() => {
    if (!isExpanded || !onRequestClose) return undefined;
    const onWinKeyDown = (e) => {
      if (e.key !== 'Escape') return;
      if (selectedIdRef.current) {
        setSelectedBuildingId(null);
      } else {
        onRequestClose();
      }
    };
    window.addEventListener('keydown', onWinKeyDown);
    return () => window.removeEventListener('keydown', onWinKeyDown);
  }, [isExpanded, onRequestClose]);

  // Smooth theme transitions between Daylight Arch-Viz & Warm Dusk
  useEffect(() => {
    const st = threeStateRef.current;
    if (!st.scene || !st.updateSkyAndIBL || !st.hemiLight || !st.dirLight || !st.ambientLight || !st.graph) return;
    st.updateSkyAndIBL(isDark);
    if (isDark) {
      st.hemiLight.color.setHex(0x6382ad);
      st.hemiLight.groundColor.setHex(0x1e2636);
      st.hemiLight.intensity = 0.62;
      st.dirLight.color.setHex(0xdcb089);
      st.dirLight.intensity = 1.62;
      st.ambientLight.intensity = 0.14;
    } else {
      st.hemiLight.color.setHex(0xdfeefa);
      st.hemiLight.groundColor.setHex(0x676d57);
      st.hemiLight.intensity = 0.5;
      st.dirLight.color.setHex(0xffe9cf);
      st.dirLight.intensity = 2.75;
      st.ambientLight.intensity = 0.05;
    }
    st.graph.applyThemeLighting(isDark);
  }, [isDark]);

  // Keyboard tracking for smooth walking + camera controls
  const handleKeyDown = (e) => {
    pressedKeysRef.current[e.code] = true;
    if (e.key === 'Escape') {
      setSelectedBuildingId(null);
      setSearchOpen(false);
      setPresetsOpen(false);
      return;
    }
    if (e.key === 'r' || e.key === 'R' || e.key === 'Home') {
      handleToggleCameraMode('aerial');
      return;
    }
    if (e.key === '=' || e.key === '+') {
      e.preventDefault();
      handleZoomStep(0.84);
      return;
    }
    if (e.key === '-' || e.key === '_') {
      e.preventDefault();
      handleZoomStep(1.18);
      return;
    }

    const num = Number(e.key);
    if (num >= 1 && num <= 9 && filteredBuildings[num - 1]) {
      handleSelectBuilding(filteredBuildings[num - 1]);
      return;
    }

    if (cameraModeRef.current === 'aerial') {
      const { camera, controls } = threeStateRef.current;
      if (!camera || !controls) return;
      const rotStep = 0.08;
      const offset = camera.position.clone().sub(controls.target);
      const spherical = new THREE.Spherical().setFromVector3(offset);
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        threeStateRef.current.flight = null;
        spherical.theta += rotStep;
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        threeStateRef.current.flight = null;
        spherical.theta -= rotStep;
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        threeStateRef.current.flight = null;
        spherical.phi = Math.max(0.12, spherical.phi - rotStep * 0.7);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        threeStateRef.current.flight = null;
        spherical.phi = Math.min(Math.PI / 2 - 0.05, spherical.phi + rotStep * 0.7);
      } else return;

      offset.setFromSpherical(spherical);
      camera.position.copy(controls.target).add(offset);
      controls.update();
    }
  };

  const handleKeyUp = (e) => {
    pressedKeysRef.current[e.code] = false;
  };

  return (
    <section
      ref={sectionRef}
      data-campus-expanded={isExpanded ? 'true' : 'false'}
      className={`arch-campus-section ${isTeaser ? 'is-hero-preview' : ''} ${
        onRequestClose && isExpanded ? 'is-expanded-stage' : ''
      } ${isClosing ? 'is-closing-stage' : ''}`}
      aria-label="KL University Digital Twin 3D Explorer"
    >
      {/* Compact Architectural Top Control Bar (Shown in Full Interactive View) */}
      {!isTeaser && (
        <div className="dt-top-toolbar">
          <div className="dt-title-block">
            <span className="arch-eyebrow">KL University (KLEF) • Vaddeswaram Digital Twin</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h2 className="dt-heading">Explore KLU 3D Campus</h2>
              <span className="dt-hint-chip">Drag 360° • Zoom • Pins</span>
            </div>
          </div>

          {/* Building Search Input */}
          <div className="dt-search-wrap">
            <div className="dt-search-box">
              <Search size={14} className="dt-search-icon" />
              <input
                type="text"
                value={searchQuery}
                onFocus={() => setSearchOpen(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSearchOpen(true);
                }}
                placeholder="Search C Block, Library, R&D, Tulip..."
                className="dt-search-input"
                aria-label="Search KL University campus buildings"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="dt-search-clear"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {searchOpen && (
              <div className="dt-dropdown-menu" role="listbox">
                {searchResults.length === 0 ? (
                  <div className="dt-dropdown-empty">No matching campus structures</div>
                ) : (
                  searchResults.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      className="dt-dropdown-item"
                      onClick={() => {
                        if (viewMode !== '3d') setViewMode('3d');
                        handleSelectBuilding(b);
                      }}
                    >
                      <span className="arch-marker-code">{b.code}</span>
                      <span className="dt-drop-name">{b.name}</span>
                      <span className="dt-drop-cat">{b.category}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Mode, Tour, Quality & Return Switchers */}
          <div className="dt-actions-group">
            <div className="dt-segmented" role="group" aria-label="Camera Experience Mode">
              <button
                type="button"
                onClick={() => handleToggleCameraMode('aerial')}
                className={`dt-seg-btn ${cameraMode === 'aerial' && viewMode === '3d' ? 'active' : ''}`}
              >
                <Compass size={13} /> Aerial 3D
              </button>
              <button
                type="button"
                onClick={() => handleToggleCameraMode('ground')}
                className={`dt-seg-btn ${cameraMode === 'ground' && viewMode === '3d' ? 'active' : ''}`}
              >
                <Footprints size={13} /> Ground Tour
              </button>
            </div>

            {/* Preset Tours Dropdown */}
            <div className="dt-presets-wrap">
              <button
                type="button"
                className="arch-ctrl-btn"
                onClick={() => setPresetsOpen((o) => !o)}
                aria-expanded={presetsOpen}
              >
                Guided Presets <ChevronDown size={13} />
              </button>
              {presetsOpen && (
                <div className="dt-presets-menu">
                  <div className="dt-presets-section">Aerial Architectural Views</div>
                  <div className="dt-presets-grid">
                    {AERIAL_TOUR_PRESETS.map((p) => (
                      <button key={p.id} type="button" className="dt-preset-pill" onClick={() => handleAerialPreset(p)}>
                        {p.label}
                      </button>
                    ))}
                  </div>
                  <div className="dt-presets-section" style={{ marginTop: 8 }}>
                    Pedestrian Ground Stops (y = 1.8m)
                  </div>
                  <div className="dt-presets-grid">
                    {GROUND_TOUR_WAYPOINTS.map((w) => (
                      <button key={w.id} type="button" className="dt-preset-pill ground" onClick={() => handleGroundWaypoint(w)}>
                        {w.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              className="arch-ctrl-btn"
              onClick={() => setViewMode((m) => (m === '3d' ? 'directory' : '3d'))}
            >
              {viewMode === '3d' ? <MapIcon size={14} /> : <Box size={14} />}
              <span>{viewMode === '3d' ? 'Directory' : '3D Twin'}</span>
            </button>

            {onRequestClose && (
              <button
                type="button"
                onClick={onRequestClose}
                className="dt-close-stage-btn"
                aria-label="Close campus view and return to homepage"
              >
                <X size={15} />
                <span>Return to Home</span>
              </button>
            )}
          </div>
        </div>
      )}

      {viewMode === '3d' && !webglUnavailable ? (
        <div
          ref={viewportRef}
          className={`arch-viewport-frame dt-hero-frame ${isTeaser ? 'is-teaser-viewport' : ''}`}
          tabIndex={0}
          onKeyDown={handleKeyDown}
          onKeyUp={handleKeyUp}
          onClick={() => {
            if (isTeaser) return;
            if (searchOpen) setSearchOpen(false);
            if (presetsOpen) setPresetsOpen(false);
          }}
          aria-label="KL University 3D Digital Twin Explorer"
        >
          <canvas ref={canvasRef} className="arch-webgl-canvas" />

          {!isSceneReady && (
            <div className="arch-scene-loader">
              <div className="arch-loader-line" />
              <span>Constructing KLU Digital Twin ({loadProgress}%)...</span>
            </div>
          )}

          {/* Projected 3D Building Markers */}
          <div className="arch-labels-layer" style={isTeaser ? { display: 'none' } : undefined}>
            {KLU_BUILDINGS.map((bld) => {
              const isSelected = selectedBuildingId === bld.id;
              const isHovered = hoveredBuildingId === bld.id;
              return (
                <button
                  key={bld.id}
                  type="button"
                  ref={(el) => {
                    labelRefs.current[bld.id] = el;
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectBuilding(bld);
                  }}
                  className={`arch-building-marker ${isSelected ? 'selected' : ''} ${isHovered ? 'hovered' : ''} ${
                    bld.provisional ? 'provisional' : ''
                  }`}
                >
                  <span className="arch-marker-code">{bld.code}</span>
                  <span className="arch-marker-name">{PIN_SHORT_NAMES[bld.id] || bld.name}</span>
                </button>
              );
            })}
          </div>

          {/* Subtle Top-Left Contextual Filter / Walk Instruction Pill */}
          {!isTeaser && (
            <div className={`dt-overlay-top ${selectedBuilding ? 'has-drawer-open' : ''}`}>
              {cameraMode === 'ground' ? (
                <div className="dt-walk-banner">
                  <Footprints size={14} />
                  <span>
                    <strong>Ground Tour Mode:</strong> Drag to look 360° • WASD / Arrows to walk • Pick a stop below
                  </span>
                </div>
              ) : (
                <div className="arch-category-tabs dt-overlay-cats">
                  {CATEGORY_FILTERS.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategoryFilter(cat.id)}
                      className={`arch-cat-pill ${categoryFilter === cat.id ? 'active' : ''}`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Ground Tour Stop Strip OR Bottom Camera Dock */}
          {!isTeaser && (
            <div className="arch-controls-bar">
            {cameraMode === 'ground' ? (
              <div className="arch-controls-group">
                {GROUND_TOUR_WAYPOINTS.map((wp) => (
                  <button
                    key={wp.id}
                    type="button"
                    className={`arch-ctrl-btn ${activeGroundId === wp.id ? 'active-ctrl' : ''}`}
                    onClick={() => handleGroundWaypoint(wp)}
                  >
                    {wp.label}
                  </button>
                ))}
                <button type="button" className="arch-ctrl-btn" onClick={() => handleToggleCameraMode('aerial')}>
                  <RotateCcw size={13} /> Exit to Aerial
                </button>
              </div>
            ) : (
              <div className="arch-controls-group">
                <button
                  type="button"
                  className="arch-ctrl-btn"
                  onClick={() => handleAerialPreset(AERIAL_TOUR_PRESETS[0])}
                  title="Aerial Campus Overview (Key: R)"
                >
                  <RotateCcw size={13} /> Overview
                </button>
                <button type="button" className="arch-ctrl-btn" onClick={() => handleAerialPreset(AERIAL_TOUR_PRESETS[2])}>
                  Library
                </button>
                <button type="button" className="arch-ctrl-btn" onClick={() => handleAerialPreset(AERIAL_TOUR_PRESETS[5])}>
                  R&amp;D Block
                </button>
                <button type="button" className="arch-ctrl-btn" onClick={() => handleAerialPreset(AERIAL_TOUR_PRESETS[3])}>
                  C Block
                </button>
                <button type="button" className="arch-ctrl-btn" onClick={() => handleAerialPreset(AERIAL_TOUR_PRESETS[8])}>
                  Hostels
                </button>
                <button
                  type="button"
                  className="arch-ctrl-btn"
                  onClick={() => handleZoomStep(0.82)}
                  aria-label="Zoom In"
                >
                  <ZoomIn size={14} />
                </button>
                <button
                  type="button"
                  className="arch-ctrl-btn"
                  onClick={() => handleZoomStep(1.22)}
                  aria-label="Zoom Out"
                >
                  <ZoomOut size={14} />
                </button>
              </div>
            )}

            <div className="arch-controls-group">
              <button
                type="button"
                className="arch-ctrl-btn"
                onClick={() => setQuality((q) => (q === 'high' ? 'reduced' : 'high'))}
                title="Switch Arch-Viz (Sky, Water Reflection & Ambient Occlusion) vs Reduced Performance Mode"
              >
                <SlidersHorizontal size={13} />
                {quality === 'high' ? 'High (AO + Water)' : 'Reduced'}
              </button>
              <button
                type="button"
                className="arch-ctrl-btn"
                onClick={toggleFullscreen}
                aria-label="Toggle Fullscreen"
              >
                {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              </button>
            </div>
          </div>
          )}

          {/* KLU Digital-Twin Building Information Drawer */}
          {selectedBuilding && (
            <aside className="arch-building-drawer" aria-label={`${selectedBuilding.name} Inspector`}>
              <div className="arch-drawer-head">
                <div>
                  <span className="arch-drawer-meta">
                    {selectedBuilding.code} • {selectedBuilding.category.toUpperCase()}
                  </span>
                  <h2 className="arch-drawer-title">{selectedBuilding.name}</h2>
                  <div className="arch-drawer-dept">{selectedBuilding.subtitle}</div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedBuildingId(null)}
                  className="arch-close-btn"
                  aria-label="Close building details"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="arch-drawer-body">
                {selectedBuilding.provisional ? (
                  <div className="arch-provisional-note">
                    <AlertTriangle size={14} />
                    <span>{selectedCatalogue?.verificationStatus || 'Provisional tag — evidence noted transparently.'}</span>
                  </div>
                ) : (
                  <div className="dt-verified-pill">
                    <CheckCircle2 size={13} />
                    <span>{selectedCatalogue?.verificationStatus || 'Verified (OSM + KLU Tour)'}</span>
                  </div>
                )}

                <div className="arch-style-tag">{selectedBuilding.levelsNote}</div>
                <p className="arch-drawer-desc">{selectedBuilding.description}</p>

                <div className="arch-info-rows">
                  <div className="arch-info-row">
                    <MapPin size={14} />
                    <span>
                      <strong>Surveyed Bounds:</strong> {Math.round(selectedBuilding.w)}m × {Math.round(selectedBuilding.d)}m
                      {' • '}Height ~{Math.round(selectedBuilding.height)}m
                    </span>
                  </div>
                  {linkedDepartment && (
                    <div className="arch-info-row">
                      <Building2 size={14} />
                      <span>
                        <strong>Academic Unit:</strong> {linkedDepartment.name}
                      </span>
                    </div>
                  )}
                </div>

                {selectedCatalogue?.architecturalFeatures && (
                  <div className="arch-facilities-block">
                    <div className="arch-subhead">Verified Architectural Features</div>
                    <ul className="arch-facilities-list">
                      {selectedCatalogue.architecturalFeatures.map((feat) => (
                        <li key={feat}>{feat}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedCatalogue?.facilities && (
                  <div className="arch-facilities-block">
                    <div className="arch-subhead">Campus Facilities</div>
                    <ul className="arch-facilities-list">
                      {selectedCatalogue.facilities.map((fac) => (
                        <li key={fac}>{fac}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Attributed Official Video Walkthrough Drawer Toggle */}
                {selectedCatalogue?.videoSourceKey && KLU_MEDIA_SOURCES[selectedCatalogue.videoSourceKey] && (
                  <div className="dt-media-card">
                    <div className="dt-media-head">
                      <div>
                        <div className="arch-subhead" style={{ marginBottom: 2 }}>Real Campus Reference Video</div>
                        <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                          Source: {KLU_MEDIA_SOURCES[selectedCatalogue.videoSourceKey].author}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="arch-btn-secondary"
                        style={{ padding: '5px 9px', fontSize: '0.74rem' }}
                        onClick={() => setVideoExpanded((v) => !v)}
                      >
                        <Play size={12} /> {videoExpanded ? 'Hide' : 'Watch Tour'}
                      </button>
                    </div>
                    {videoExpanded && (
                      <div className="dt-video-frame-wrap">
                        <iframe
                          src={KLU_MEDIA_SOURCES[selectedCatalogue.videoSourceKey].embedUrl}
                          title={KLU_MEDIA_SOURCES[selectedCatalogue.videoSourceKey].title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    )}
                    <div className="dt-ext-links">
                      <a href={KLU_MEDIA_SOURCES[selectedCatalogue.videoSourceKey].url} target="_blank" rel="noreferrer">
                        Open YouTube Source <ExternalLink size={11} />
                      </a>
                      <a href={selectedBuilding.id === 'central-library' ? KLU_MEDIA_SOURCES.librarySite : KLU_MEDIA_SOURCES.website} target="_blank" rel="noreferrer">
                        Official KLU Portal <ExternalLink size={11} />
                      </a>
                    </div>
                  </div>
                )}

                {/* LearnSphere LMS Connections (Shown for Academic & Research Facilities) */}
                {linkedCourses.length > 0 && (
                  <div className="arch-courses-preview">
                    <div className="arch-subhead">LearnSphere LMS Modules</div>
                    <div className="arch-mini-course-list">
                      {linkedCourses.map((c) => (
                        <div key={c.id} className="dt-lms-course-row">
                          <div className="dt-lms-course-title">{c.title}</div>
                          <div className="dt-lms-course-actions">
                            <Link to={`/course/${c.id}`}>Syllabus</Link>
                            <Link to={`/classroom/${c.id}`}>Classroom</Link>
                            <Link to={`/quiz/${c.id}`}>Quiz</Link>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="dt-lms-dash-links">
                      <Link to="/student-dashboard">
                        <GraduationCap size={12} /> Student Dashboard
                      </Link>
                      <Link to="/instructor-dashboard">
                        <BookOpen size={12} /> Instructor Hub
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              <div className="arch-drawer-footer">
                <button
                  type="button"
                  onClick={() => {
                    setCameraMode('ground');
                    const cx = selectedBuilding.center[0];
                    const cz = selectedBuilding.center[1];
                    const pos = new THREE.Vector3(cx - 42, 1.85, cz - 28);
                    const dir = new THREE.Vector3(cx - pos.x, 3, cz - pos.z).normalize().multiplyScalar(2.4);
                    flyCameraTo(pos, pos.clone().add(dir), 900, 'ground');
                  }}
                  className="arch-btn-secondary"
                >
                  <Footprints size={13} /> Street View
                </button>
                {linkedDepartment ? (
                  <button
                    type="button"
                    onClick={() => navigate(`/courses?department=${linkedDepartment.id}`)}
                    className="arch-btn-primary"
                  >
                    Course Catalog <ArrowRight size={14} />
                  </button>
                ) : (
                  <button type="button" onClick={() => handleToggleCameraMode('aerial')} className="arch-btn-primary">
                    Aerial View <RotateCcw size={13} />
                  </button>
                )}
              </div>
            </aside>
          )}
        </div>
      ) : (
        /* Accessible Full Campus Site Directory */
        <div className="arch-directory-fallback">
          <div className="arch-fallback-header">
            <div>
              <h2>KL University Vaddeswaram Digital Twin Directory</h2>
              <p>
                {webglUnavailable
                  ? 'WebGL 3D rendering is unavailable on this browser. Browse all 26 surveyed KLU campus landmarks below.'
                  : 'Complete building directory anchored in surveyed OpenStreetMap coordinates and official KLU references.'}
              </p>
            </div>
            {!webglUnavailable && (
              <button type="button" className="arch-btn-primary" onClick={() => setViewMode('3d')}>
                <Box size={15} /> Open 3D Campus
              </button>
            )}
          </div>

          <div className="arch-category-tabs" style={{ marginBottom: 18 }}>
            {CATEGORY_FILTERS.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryFilter(cat.id)}
                className={`arch-cat-pill ${categoryFilter === cat.id ? 'active' : ''}`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="arch-site-grid">
            {filteredBuildings.map((bld) => (
              <article key={bld.id} className="arch-site-card">
                <div className="arch-site-card-top">
                  <span className="arch-drawer-meta">
                    {bld.code} • {bld.category.toUpperCase()}
                  </span>
                  <MapPin size={15} style={{ color: 'var(--accent-bronze, #9A5B25)' }} />
                </div>
                <h3>{bld.name}</h3>
                <div className="arch-site-dept-name">{bld.subtitle}</div>
                <p>{bld.description}</p>
                <div className="arch-site-card-meta">
                  <span>
                    {Math.round(bld.w)}×{Math.round(bld.d)}m
                  </span>
                  <span>•</span>
                  <span>{bld.levelsNote}</span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {!webglUnavailable && (
                    <button
                      type="button"
                      className="arch-btn-secondary"
                      style={{ flex: 1 }}
                      onClick={() => {
                        setViewMode('3d');
                        setTimeout(() => handleSelectBuilding(bld), 200);
                      }}
                    >
                      Fly in 3D
                    </button>
                  )}
                  <Link
                    to={bld.departmentId ? `/courses?department=${bld.departmentId}` : '/courses'}
                    className="arch-btn-primary"
                    style={{ flex: 1 }}
                  >
                    {bld.departmentId ? 'Courses' : 'Catalog'} <ArrowRight size={13} />
                  </Link>
                </div>
              </article>
            ))}
          </div>

          {/* Multi-Source Geospatial & Reference Attribution Registry */}
          <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid rgba(15,23,42,0.1)' }}>
            <h3 style={{ fontSize: '0.96rem', fontWeight: 700, marginBottom: 10 }}>
              Verified Campus Source &amp; Licence Registry
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
              {KLU_SOURCE_REGISTRY.map((src) => (
                <div
                  key={src.sourceName}
                  style={{
                    padding: 12,
                    borderRadius: 10,
                    background: 'rgba(15, 23, 42, 0.03)',
                    border: '1px solid rgba(15, 23, 42, 0.08)',
                    fontSize: '0.78rem',
                    lineHeight: 1.45
                  }}
                >
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>
                    <a href={src.url} target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>
                      {src.sourceName}
                    </a>
                    <span style={{ marginLeft: 6, fontSize: '0.7rem', opacity: 0.72 }}>({src.confidence})</span>
                  </div>
                  <div style={{ opacity: 0.85, marginBottom: 4 }}>{src.verifiedFeatures}</div>
                  <div style={{ opacity: 0.68, fontSize: '0.72rem' }}>
                    {src.dateCaptured} • {src.licence}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
