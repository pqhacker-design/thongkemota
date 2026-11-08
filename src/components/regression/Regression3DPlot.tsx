import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  RotateCcw,
  Eye,
  Camera,
  Maximize2,
  Box,
  Layers,
  ChevronDown,
  ChevronUp,
  Sliders,
  Check,
} from 'lucide-react';
import { MultipleRegressionResult } from '../../types/regression';
import { formatNum } from '../../utils/mathStatistics';

interface Regression3DPlotProps {
  result: MultipleRegressionResult;
  digits?: number;
}

// Procedural 3D Text Sprite using Canvas
function createTextSprite(
  text: string,
  color: string = '#f8fafc',
  bgColor: string = 'rgba(15, 23, 42, 0.75)',
  fontSize: number = 26
): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 384;
  canvas.height = 96;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, 384, 96);

    if (bgColor !== 'transparent') {
      ctx.fillStyle = bgColor;
      ctx.beginPath();
      ctx.roundRect(8, 8, 368, 80, 16);
      ctx.fill();
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    ctx.font = `bold ${fontSize}px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 192, 48);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(3.2, 0.8, 1);
  return sprite;
}

export const Regression3DPlot: React.FC<Regression3DPlotProps> = ({
  result,
  digits = 4,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  // Variable selection for 3D axes (default X1 vs X2 if k >= 2)
  const [varXIndex, setVarXIndex] = useState<number>(0);
  const [varZIndex, setVarZIndex] = useState<number>(1);

  // Visual toggles
  const [showPlane, setShowPlane] = useState<boolean>(true);
  const [showResidualLines, setShowResidualLines] = useState<boolean>(true);
  const [autoRotate, setAutoRotate] = useState<boolean>(false);
  const [controlsCollapsed, setControlsCollapsed] = useState<boolean>(false);
  const [hoveredObs, setHoveredObs] = useState<{
    index: number;
    xVal: number;
    zVal: number;
    yVal: number;
    yPred: number;
    residual: number;
    screenX: number;
    screenY: number;
  } | null>(null);

  const { rows, variableNames, coefficients, means, k } = result;

  // Safe variable indices
  const safeXIdx = varXIndex < k ? varXIndex : 0;
  const safeZIdx = varZIndex < k && varZIndex !== safeXIdx ? varZIndex : (safeXIdx + 1) % k;

  const varNameX = variableNames[safeXIdx] || 'X1';
  const varNameZ = variableNames[safeZIdx] || 'X2';

  // Extents of chosen variables and dependent variable Y
  const extents = useMemo(() => {
    const xVals = rows.map((r) => r.xValues[safeXIdx]);
    const zVals = rows.map((r) => r.xValues[safeZIdx]);
    const yVals = rows.map((r) => r.y);

    const minX = Math.min(...xVals);
    const maxX = Math.max(...xVals);
    const minZ = Math.min(...zVals);
    const maxZ = Math.max(...zVals);
    const minY = Math.min(...yVals);
    const maxY = Math.max(...yVals);

    const spanX = maxX - minX || 1;
    const spanZ = maxZ - minZ || 1;
    const spanY = maxY - minY || 1;

    return {
      minX,
      maxX,
      spanX,
      minZ,
      maxZ,
      spanZ,
      minY,
      maxY,
      spanY,
    };
  }, [rows, safeXIdx, safeZIdx]);

  // Coordinate normalizers: maps real data into Three.js coordinate box
  // Box size: X in [-5, 5], Z in [-5, 5], Y in [-3.5, 3.5]
  const BOX_HALF_X = 5;
  const BOX_HALF_Z = 5;
  const BOX_HALF_Y = 3.5;

  const to3D = (x: number, y: number, z: number): [number, number, number] => {
    const nx = ((x - extents.minX) / extents.spanX - 0.5) * (BOX_HALF_X * 2);
    const ny = ((y - extents.minY) / extents.spanY - 0.5) * (BOX_HALF_Y * 2);
    const nz = ((z - extents.minZ) / extents.spanZ - 0.5) * (BOX_HALF_Z * 2);
    return [nx, ny, nz];
  };

  // Predicted Y on the 3D plane when holding all other variables at mean
  const predictOnPlane = (xVal: number, zVal: number): number => {
    const b0 = coefficients[0]?.value || 0;
    const bX = coefficients[safeXIdx + 1]?.value || 0;
    const bZ = coefficients[safeZIdx + 1]?.value || 0;

    let yPred = b0 + bX * xVal + bZ * zVal;
    for (let j = 0; j < k; j++) {
      if (j !== safeXIdx && j !== safeZIdx) {
        const bj = coefficients[j + 1]?.value || 0;
        yPred += bj * means[j];
      }
    }
    return yPred;
  };

  // Main Three.js Scene Setup & Rebuilding on variable change / data change
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Detect software WebGL
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    rendererRef.current = renderer;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a); // Slate-900
    sceneRef.current = scene;

    // Environment map for specular highlights
    try {
      const pmrem = new THREE.PMREMGenerator(renderer);
      scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      pmrem.dispose();
    } catch {
      // Fallback gracefully
    }

    // Camera
    const camera = new THREE.PerspectiveCamera(
      42,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.set(12, 10, 15);
    cameraRef.current = camera;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.maxDistance = 40;
    controls.minDistance = 4;
    controlsRef.current = controls;

    // Lights
    const hemiLight = new THREE.HemisphereLight(0xe2e8f0, 0x1e293b, 1.4);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.6);
    dirLight.position.set(15, 20, 12);
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.8);
    fillLight.position.set(-15, -10, -12);
    scene.add(fillLight);

    // Coordinate Box Wireframe & Base Grid
    const boxGroup = new THREE.Group();

    // Floor Grid (at bottom Y = -BOX_HALF_Y)
    const floorGrid = new THREE.GridHelper(
      BOX_HALF_X * 2,
      10,
      0x38bdf8,
      0x334155
    );
    floorGrid.position.y = -BOX_HALF_Y;
    boxGroup.add(floorGrid);

    // Box wireframe edges
    const boxGeo = new THREE.BoxGeometry(
      BOX_HALF_X * 2,
      BOX_HALF_Y * 2,
      BOX_HALF_Z * 2
    );
    const boxEdges = new THREE.LineSegments(
      new THREE.EdgesGeometry(boxGeo),
      new THREE.LineBasicMaterial({ color: 0x475569, transparent: true, opacity: 0.6 })
    );
    boxGroup.add(boxEdges);

    // Axis Arrows
    const axisMaterial = new THREE.LineBasicMaterial({ color: 0x94a3b8, linewidth: 2 });

    // X Axis line
    const xLineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-BOX_HALF_X, -BOX_HALF_Y, -BOX_HALF_Z),
      new THREE.Vector3(BOX_HALF_X + 1.2, -BOX_HALF_Y, -BOX_HALF_Z),
    ]);
    boxGroup.add(new THREE.Line(xLineGeo, axisMaterial));

    // Y Axis line
    const yLineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-BOX_HALF_X, -BOX_HALF_Y, -BOX_HALF_Z),
      new THREE.Vector3(-BOX_HALF_X, BOX_HALF_Y + 1.2, -BOX_HALF_Z),
    ]);
    boxGroup.add(new THREE.Line(yLineGeo, axisMaterial));

    // Z Axis line
    const zLineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-BOX_HALF_X, -BOX_HALF_Y, -BOX_HALF_Z),
      new THREE.Vector3(-BOX_HALF_X, -BOX_HALF_Y, BOX_HALF_Z + 1.2),
    ]);
    boxGroup.add(new THREE.Line(zLineGeo, axisMaterial));

    // Axis Text Sprites
    const xLabel = createTextSprite(`Trục X: ${varNameX}`, '#38bdf8');
    xLabel.position.set(BOX_HALF_X + 2.4, -BOX_HALF_Y, -BOX_HALF_Z);
    boxGroup.add(xLabel);

    const yLabel = createTextSprite('Trục Y (Phụ thuộc)', '#4ade80');
    yLabel.position.set(-BOX_HALF_X, BOX_HALF_Y + 1.8, -BOX_HALF_Z);
    boxGroup.add(yLabel);

    const zLabel = createTextSprite(`Trục Z: ${varNameZ}`, '#c084fc');
    zLabel.position.set(-BOX_HALF_X, -BOX_HALF_Y, BOX_HALF_Z + 2.4);
    boxGroup.add(zLabel);

    // Min / Max tick labels
    const xMinLabel = createTextSprite(`${formatNum(extents.minX, 1)}`, '#94a3b8', 'transparent', 22);
    xMinLabel.position.set(-BOX_HALF_X, -BOX_HALF_Y - 0.7, -BOX_HALF_Z);
    boxGroup.add(xMinLabel);

    const xMaxLabel = createTextSprite(`${formatNum(extents.maxX, 1)}`, '#94a3b8', 'transparent', 22);
    xMaxLabel.position.set(BOX_HALF_X, -BOX_HALF_Y - 0.7, -BOX_HALF_Z);
    boxGroup.add(xMaxLabel);

    const yMinLabel = createTextSprite(`${formatNum(extents.minY, 1)}`, '#94a3b8', 'transparent', 22);
    yMinLabel.position.set(-BOX_HALF_X - 1.2, -BOX_HALF_Y, -BOX_HALF_Z);
    boxGroup.add(yMinLabel);

    const yMaxLabel = createTextSprite(`${formatNum(extents.maxY, 1)}`, '#94a3b8', 'transparent', 22);
    yMaxLabel.position.set(-BOX_HALF_X - 1.2, BOX_HALF_Y, -BOX_HALF_Z);
    boxGroup.add(yMaxLabel);

    scene.add(boxGroup);

    // 2. Regression Plane Mesh (Parametric Surface)
    const planeGroup = new THREE.Group();
    planeGroup.name = 'regressionPlaneGroup';

    const segments = 20;
    const planeGeometry = new THREE.BufferGeometry();
    const planeVertices: number[] = [];
    const planeIndices: number[] = [];

    for (let i = 0; i <= segments; i++) {
      const u = i / segments;
      const xVal = extents.minX + u * extents.spanX;

      for (let j = 0; j <= segments; j++) {
        const v = j / segments;
        const zVal = extents.minZ + v * extents.spanZ;

        const yHat = predictOnPlane(xVal, zVal);
        const [px, py, pz] = to3D(xVal, yHat, zVal);
        planeVertices.push(px, py, pz);
      }
    }

    for (let i = 0; i < segments; i++) {
      for (let j = 0; j < segments; j++) {
        const a = i * (segments + 1) + j;
        const b = (i + 1) * (segments + 1) + j;
        const c = (i + 1) * (segments + 1) + (j + 1);
        const d = i * (segments + 1) + (j + 1);
        planeIndices.push(a, b, d);
        planeIndices.push(b, c, d);
      }
    }

    planeGeometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(planeVertices, 3)
    );
    planeGeometry.setIndex(planeIndices);
    planeGeometry.computeVertexNormals();

    const planeMaterial = new THREE.MeshStandardMaterial({
      color: 0x0284c7, // Sky-600
      transparent: true,
      opacity: 0.62,
      side: THREE.DoubleSide,
      roughness: 0.25,
      metalness: 0.15,
      depthWrite: false,
    });

    const planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);
    planeGroup.add(planeMesh);

    // Plane Wireframe Grid
    const planeWireframe = new THREE.LineSegments(
      new THREE.WireframeGeometry(planeGeometry),
      new THREE.LineBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.45,
      })
    );
    planeGroup.add(planeWireframe);

    planeGroup.visible = showPlane;
    scene.add(planeGroup);

    // 3. Observations Data Points & Residual Droplines
    const pointsGroup = new THREE.Group();
    pointsGroup.name = 'pointsGroup';

    const sphereGeo = new THREE.SphereGeometry(0.24, 24, 24);
    const positiveMat = new THREE.MeshStandardMaterial({
      color: 0x10b981, // Emerald-500
      roughness: 0.2,
      metalness: 0.4,
    });
    const negativeMat = new THREE.MeshStandardMaterial({
      color: 0xf43f5e, // Rose-500
      roughness: 0.2,
      metalness: 0.4,
    });

    const residualLinesGroup = new THREE.Group();
    residualLinesGroup.name = 'residualLinesGroup';

    rows.forEach((r, idx) => {
      const xVal = r.xValues[safeXIdx];
      const zVal = r.xValues[safeZIdx];
      const yVal = r.y;
      const yHatPlane = predictOnPlane(xVal, zVal);
      const residual = yVal - yHatPlane;

      const [px, py, pz] = to3D(xVal, yVal, zVal);
      const [projX, projY, projZ] = to3D(xVal, yHatPlane, zVal);

      // Observation Sphere
      const sphere = new THREE.Mesh(
        sphereGeo,
        residual >= 0 ? positiveMat : negativeMat
      );
      sphere.position.set(px, py, pz);
      sphere.userData = {
        index: idx + 1,
        xVal,
        zVal,
        yVal,
        yPred: yHatPlane,
        residual,
      };
      pointsGroup.add(sphere);

      // Residual Line (Segment from observed point to regression plane)
      const lineGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(px, py, pz),
        new THREE.Vector3(projX, projY, projZ),
      ]);
      const lineMat = new THREE.LineBasicMaterial({
        color: residual >= 0 ? 0x34d399 : 0xfb7185,
        transparent: true,
        opacity: 0.85,
        linewidth: 2,
      });
      const resLine = new THREE.Line(lineGeo, lineMat);
      residualLinesGroup.add(resLine);
    });

    residualLinesGroup.visible = showResidualLines;
    scene.add(residualLinesGroup);
    scene.add(pointsGroup);

    // 4. Raycasting for hover tooltip
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerMove = (event: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / container.clientWidth) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / container.clientHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(pointsGroup.children, false);

      if (intersects.length > 0) {
        const hit = intersects[0].object as THREE.Mesh;
        const data = hit.userData;
        container.style.cursor = 'pointer';
        setHoveredObs({
          index: data.index,
          xVal: data.xVal,
          zVal: data.zVal,
          yVal: data.yVal,
          yPred: data.yPred,
          residual: data.residual,
          screenX: event.clientX - rect.left,
          screenY: event.clientY - rect.top,
        });
      } else {
        container.style.cursor = 'default';
        setHoveredObs(null);
      }
    };

    container.addEventListener('mousemove', handlePointerMove);

    // 5. Render Loop
    let animId = 0;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      if (autoRotate) {
        scene.rotation.y += 0.005;
      }

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    // Resize handler
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup on unmount or re-render
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousemove', handlePointerMove);
      controls.dispose();
      renderer.dispose();
      boxGeo.dispose();
      planeGeometry.dispose();
      planeMaterial.dispose();
      sphereGeo.dispose();
      positiveMat.dispose();
      negativeMat.dispose();
    };
  }, [
    rows,
    coefficients,
    means,
    k,
    safeXIdx,
    safeZIdx,
    extents,
    showPlane,
    showResidualLines,
    autoRotate,
  ]);

  // Update Plane and Lines visibility without full rebuild
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    const plane = scene.getObjectByName('regressionPlaneGroup');
    if (plane) plane.visible = showPlane;
    const lines = scene.getObjectByName('residualLinesGroup');
    if (lines) lines.visible = showResidualLines;
  }, [showPlane, showResidualLines]);

  // Camera Presets
  const handleSetCameraPreset = (preset: 'iso' | 'top' | 'front' | 'side') => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    const scene = sceneRef.current;
    if (!camera || !controls || !scene) return;

    scene.rotation.y = 0;

    if (preset === 'iso') {
      camera.position.set(12, 10, 15);
    } else if (preset === 'top') {
      camera.position.set(0.001, 24, 0);
    } else if (preset === 'front') {
      camera.position.set(0, 0, 22);
    } else if (preset === 'side') {
      camera.position.set(22, 0, 0);
    }

    controls.target.set(0, 0, 0);
    controls.update();
  };

  // Download 3D Scene Snapshot PNG
  const handleDownloadSnapshot = () => {
    const renderer = rendererRef.current;
    if (!renderer) return;

    const dataUrl = renderer.domElement.toDataURL('image/png');
    const a = document.createElement('a');
    a.download = `bieu-do-3d-hoi-quy-boi-${varNameX}-${varNameZ}.png`;
    a.href = dataUrl;
    a.click();
  };

  return (
    <div className="space-y-3">
      {/* 3D Canvas Box */}
      <div className="relative w-full h-[520px] rounded-2xl overflow-hidden shadow-md border border-slate-700 bg-slate-900 select-none">
        <div ref={containerRef} className="w-full h-full" />

        {/* Top Badges Overlay */}
        <div className="absolute top-3 left-3 flex flex-wrap items-center gap-2 pointer-events-none z-10">
          <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-slate-800/90 text-sky-300 border border-slate-700 shadow-xs flex items-center gap-1.5 backdrop-blur-xs">
            <Box className="w-3.5 h-3.5 text-sky-400" /> Không Gian 3D: {varNameX} × {varNameZ} → Y
          </span>
          <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-800/90 text-slate-300 border border-slate-700 shadow-xs">
            R² = {formatNum(result.rSquared, digits)}
          </span>
        </div>

        {/* Top-Right Quick Snapshot */}
        <div className="absolute top-3 right-3 z-10">
          <button
            onClick={handleDownloadSnapshot}
            className="p-2 rounded-lg bg-slate-800/90 text-slate-200 hover:text-white hover:bg-slate-700 border border-slate-700 shadow-xs transition-colors cursor-pointer"
            title="Chụp ảnh 3D tải về PNG"
          >
            <Camera className="w-4 h-4 text-teal-400" />
          </button>
        </div>

        {/* Hover Observation Tooltip */}
        {hoveredObs && (
          <div
            className="absolute z-20 pointer-events-none bg-slate-950/95 border border-slate-600 rounded-xl p-3 shadow-xl text-xs text-white space-y-1 font-sans transition-all duration-75"
            style={{
              left: Math.min(hoveredObs.screenX + 14, (containerRef.current?.clientWidth || 500) - 180),
              top: Math.max(hoveredObs.screenY - 110, 15),
            }}
          >
            <div className="font-bold text-sky-300 border-b border-slate-800 pb-1 flex items-center justify-between gap-3">
              <span>Quan sát #{hoveredObs.index}</span>
              <span className="font-mono text-[10px] text-slate-400">3D OLS</span>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px] pt-0.5">
              <span className="text-slate-400">{varNameX}:</span>
              <span className="font-mono font-bold text-slate-200">{formatNum(hoveredObs.xVal, 2)}</span>

              <span className="text-slate-400">{varNameZ}:</span>
              <span className="font-mono font-bold text-slate-200">{formatNum(hoveredObs.zVal, 2)}</span>

              <span className="text-slate-400">Y thực tế:</span>
              <span className="font-mono font-extrabold text-teal-300">{formatNum(hoveredObs.yVal, 2)}</span>

              <span className="text-slate-400">Ŷ trên mặt phẳng:</span>
              <span className="font-mono font-bold text-indigo-300">{formatNum(hoveredObs.yPred, 2)}</span>
            </div>
            <div className="pt-1 border-t border-slate-800 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Phần dư e:</span>
              <span
                className={`font-mono font-bold ${
                  hoveredObs.residual >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {hoveredObs.residual >= 0 ? '+' : ''}
                {formatNum(hoveredObs.residual, digits)}
              </span>
            </div>
          </div>
        )}

        {/* Legend Hint in Canvas (Bottom-Left) */}
        <div className="absolute bottom-3 left-3 z-10 pointer-events-none hidden sm:flex items-center gap-3 text-[11px] text-slate-300 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800 backdrop-blur-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
            <span>e &gt; 0 (Trên mặt phẳng)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
            <span>e &lt; 0 (Dưới mặt phẳng)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-sky-500/60 border border-sky-400 inline-block"></span>
            <span>Mặt phẳng Ŷ OLS</span>
          </div>
        </div>

        {/* Interactive Instruction Note (Bottom-Right) */}
        <div className="absolute bottom-3 right-3 z-10 pointer-events-none hidden md:block text-[11px] text-slate-400 bg-slate-900/70 px-2.5 py-1 rounded-md border border-slate-800">
          Kéo chuột để xoay 360° · Cuộn để phóng to/thu nhỏ
        </div>
      </div>

      {/* Unified Bottom Control Dock */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs space-y-3">
        {/* Toggle Collapse Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-teal-600" />
            <h4 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wider">
              Bảng Điều Khiển Biểu Đồ 3D
            </h4>
          </div>
          <button
            onClick={() => setControlsCollapsed(!controlsCollapsed)}
            className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 font-semibold"
          >
            {controlsCollapsed ? (
              <>
                <ChevronDown className="w-4 h-4" /> Mở rộng điều khiển
              </>
            ) : (
              <>
                <ChevronUp className="w-4 h-4" /> Thu gọn
              </>
            )}
          </button>
        </div>

        {!controlsCollapsed && (
          <div className="space-y-3 pt-1 border-t border-slate-100">
            {/* Row 1: Variable Selectors for Axes (Crucial when k > 2) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Select X Axis Variable */}
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-center justify-between gap-2">
                <label className="text-xs font-bold text-sky-800 shrink-0">Trục X (Ngang 1):</label>
                <select
                  value={safeXIdx}
                  onChange={(e) => setVarXIndex(Number(e.target.value))}
                  className="bg-white border border-slate-300 rounded px-2.5 py-1 text-xs font-semibold text-slate-800 focus:ring-1 focus:ring-sky-500 w-full"
                >
                  {variableNames.map((name, idx) => (
                    <option key={idx} value={idx}>
                      {name} (b_{idx + 1} = {formatNum(coefficients[idx + 1]?.value, 2)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Z Axis Variable */}
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-center justify-between gap-2">
                <label className="text-xs font-bold text-purple-800 shrink-0">Trục Z (Ngang 2):</label>
                <select
                  value={safeZIdx}
                  onChange={(e) => setVarZIndex(Number(e.target.value))}
                  className="bg-white border border-slate-300 rounded px-2.5 py-1 text-xs font-semibold text-slate-800 focus:ring-1 focus:ring-purple-500 w-full"
                >
                  {variableNames.map((name, idx) => (
                    <option key={idx} value={idx} disabled={idx === safeXIdx}>
                      {name} {idx === safeXIdx ? '(Đang chọn ở trục X)' : `(b_${idx + 1} = ${formatNum(coefficients[idx + 1]?.value, 2)})`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dependent Variable Info */}
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-800">Trục đứng Y:</span>
                <span className="font-mono font-bold text-slate-700">Biến phụ thuộc Y</span>
              </div>
            </div>

            {/* Row 2: Camera Angles & Toggles */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              {/* Camera Presets */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-slate-500 font-semibold mr-1">Góc nhìn:</span>
                <button
                  onClick={() => handleSetCameraPreset('iso')}
                  className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
                >
                  Phối cảnh 3D
                </button>
                <button
                  onClick={() => handleSetCameraPreset('top')}
                  className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
                >
                  Nhìn từ trên (X-Z)
                </button>
                <button
                  onClick={() => handleSetCameraPreset('front')}
                  className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
                >
                  Nhìn ngang (X-Y)
                </button>
                <button
                  onClick={() => handleSetCameraPreset('side')}
                  className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
                >
                  Nhìn dọc (Z-Y)
                </button>
                <button
                  onClick={() => handleSetCameraPreset('iso')}
                  className="px-2 py-1 rounded border border-slate-300 text-slate-600 hover:text-slate-900 transition-colors"
                  title="Đặt lại góc nhìn ban đầu"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Toggles */}
              <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-700">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showPlane}
                    onChange={(e) => setShowPlane(e.target.checked)}
                    className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
                  />
                  <span>Mặt phẳng Ŷ</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showResidualLines}
                    onChange={(e) => setShowResidualLines(e.target.checked)}
                    className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
                  />
                  <span>Đoạn phần dư (e)</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoRotate}
                    onChange={(e) => setAutoRotate(e.target.checked)}
                    className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
                  />
                  <span>Tự động xoay</span>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
