import * as THREE from 'three';

export type HardwareTier = 'tier1' | 'tier2' | 'tier3';

export interface HardwareTierConfig {
  tier: HardwareTier;
  maxDpr: number;
  starCount: number;
  enableShadows: boolean;
  enableWebGL: boolean;
}

export function isWebGLAvailable(): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return false;
  }
  try {
    const canvas = document.createElement('canvas');
    const gl =
      canvas.getContext('webgl2') ||
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl');
    return Boolean(gl);
  } catch {
    return false;
  }
}

export function detectHardwareTier(options?: {
  reducedMotion?: boolean;
  forceCores?: number;
  webglSupported?: boolean;
}): HardwareTierConfig {
  if (options?.reducedMotion) {
    return {
      tier: 'tier3',
      maxDpr: 1,
      starCount: 70,
      enableShadows: false,
      enableWebGL: false,
    };
  }

  const webglOk =
    typeof options?.webglSupported === 'boolean'
      ? options.webglSupported
      : isWebGLAvailable();

  if (!webglOk) {
    return {
      tier: 'tier3',
      maxDpr: 1,
      starCount: 70,
      enableShadows: false,
      enableWebGL: false,
    };
  }

  const cores =
    typeof options?.forceCores === 'number'
      ? options.forceCores
      : typeof navigator !== 'undefined' && navigator.hardwareConcurrency
      ? navigator.hardwareConcurrency
      : 6;

  if (cores < 4) {
    return {
      tier: 'tier3',
      maxDpr: 1,
      starCount: 80,
      enableShadows: false,
      enableWebGL: false,
    };
  }

  if (cores >= 8) {
    return {
      tier: 'tier1',
      maxDpr: 2,
      starCount: 480,
      enableShadows: true,
      enableWebGL: true,
    };
  }

  return {
    tier: 'tier2',
    maxDpr: 1.25,
    starCount: 240,
    enableShadows: false,
    enableWebGL: true,
  };
}

export interface ReaderAtmospherePalette {
  readerId: 'ba_ngoai' | 'chi_dai' | 'ban_than' | 'thay_cu_meo';
  displayName: string;
  totemName: string;
  primaryHex: string;
  secondaryHex: string;
  goldHex: string;
  rimLightHex: number;
  candleLightHex: number;
}

export const READER_ATMOSPHERE_PALETTES: Record<
  'ba_ngoai' | 'chi_dai' | 'ban_than' | 'thay_cu_meo',
  ReaderAtmospherePalette
> = {
  ba_ngoai: {
    readerId: 'ba_ngoai',
    displayName: 'Bà Ngoại',
    totemName: 'Đèn Trà Sen Gốm Cổ & Nến Ấm',
    primaryHex: '#EAB308',
    secondaryHex: '#D97706',
    goldHex: '#C9A24A',
    rimLightHex: 0xeab308,
    candleLightHex: 0xffa64d,
  },
  chi_dai: {
    readerId: 'chi_dai',
    displayName: 'Chị Đại',
    totemName: 'Ly Rượu Vang Pha Lê & Hoa Hồng Đỏ',
    primaryHex: '#E11D48',
    secondaryHex: '#C9A24A',
    goldHex: '#C9A24A',
    rimLightHex: 0xe11d48,
    candleLightHex: 0xff8a65,
  },
  ban_than: {
    readerId: 'ban_than',
    displayName: 'Bạn Thân',
    totemName: 'Tinh Cầu Ngôi Sao Hồng Lấp Lánh',
    primaryHex: '#EC4899',
    secondaryHex: '#8B5CF6',
    goldHex: '#C9A24A',
    rimLightHex: 0xec4899,
    candleLightHex: 0xf472b6,
  },
  thay_cu_meo: {
    readerId: 'thay_cu_meo',
    displayName: 'Thầy Cú Mèo',
    totemName: 'La Bàn Thiên Văn Đồng Thau',
    primaryHex: '#3B82F6',
    secondaryHex: '#6366F1',
    goldHex: '#C9A24A',
    rimLightHex: 0x3b82f6,
    candleLightHex: 0x93c5fd,
  },
};

export function getReaderAtmospherePalette(
  readerId?: string | null
): ReaderAtmospherePalette {
  if (readerId === 'chi_dai' || readerId === 'ba_co_mo_hon') {
    return READER_ATMOSPHERE_PALETTES.chi_dai;
  }
  if (readerId === 'ban_than' || readerId === 'tien_tu_chua_lanh') {
    return READER_ATMOSPHERE_PALETTES.ban_than;
  }
  if (
    readerId === 'thay_cu_meo' ||
    readerId === 'tong_tai_ly_tri' ||
    readerId === 'phap_su_toi_co'
  ) {
    return READER_ATMOSPHERE_PALETTES.thay_cu_meo;
  }
  return READER_ATMOSPHERE_PALETTES.ba_ngoai;
}

export function disposeMaterial(material: THREE.Material): void {
  material.dispose();
  const record = material as unknown as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    const val = record[key];
    if (
      val &&
      typeof val === 'object' &&
      'dispose' in val &&
      typeof (val as { dispose?: unknown }).dispose === 'function'
    ) {
      try {
        (val as { dispose: () => void }).dispose();
      } catch {
        // Ignore already-disposed textures
      }
    }
  }
}

export function disposeThreeScene(
  scene: THREE.Scene,
  renderer?: THREE.WebGLRenderer | null
): void {
  scene.traverse((obj) => {
    const renderable = obj as THREE.Mesh | THREE.Points | THREE.Line;
    if (renderable.geometry) {
      renderable.geometry.dispose();
    }
    if (renderable.material) {
      if (Array.isArray(renderable.material)) {
        renderable.material.forEach((m) => disposeMaterial(m));
      } else {
        disposeMaterial(renderable.material);
      }
    }
  });

  if (renderer) {
    renderer.dispose();
    if (renderer.domElement && renderer.domElement.parentElement) {
      renderer.domElement.parentElement.removeChild(renderer.domElement);
    }
  }
}

export function attachWebGLContextLostGuard(
  canvasOrRenderer:
    | HTMLCanvasElement
    | THREE.WebGLRenderer
    | null
    | undefined,
  onContextLost?: () => void,
  onContextRestored?: () => void
): () => void {
  if (!canvasOrRenderer) return () => {};

  const canvas =
    'domElement' in canvasOrRenderer
      ? canvasOrRenderer.domElement
      : canvasOrRenderer;

  if (!canvas || typeof canvas.addEventListener !== 'function') {
    return () => {};
  }

  const handleLost = (event: Event) => {
    event.preventDefault();
    onContextLost?.();
  };
  const handleRestored = () => {
    onContextRestored?.();
  };

  canvas.addEventListener('webglcontextlost', handleLost, false);
  canvas.addEventListener('webglcontextrestored', handleRestored, false);

  return () => {
    canvas.removeEventListener('webglcontextlost', handleLost, false);
    canvas.removeEventListener('webglcontextrestored', handleRestored, false);
  };
}

export interface RenderControllerOptions {
  onUpdate?: (delta: number, elapsed: number) => void;
  maxIdleSeconds?: number;
  continuous?: boolean;
}

export class IdleAwareRenderLoop {
  private rafId: number | null = null;
  private lastTime = 0;
  private elapsed = 0;
  private isRunning = false;
  private isDirty = true;
  private idleTimer = 0;

  constructor(
    private renderer: THREE.WebGLRenderer,
    private scene: THREE.Scene,
    private camera: THREE.Camera,
    private options: RenderControllerOptions = {}
  ) {}

  public markDirty(): void {
    this.isDirty = true;
    this.idleTimer = 0;
    if (!this.isRunning) {
      this.start();
    }
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
    this.scheduleNext();
  }

  public stop(): void {
    if (this.rafId !== null && typeof cancelAnimationFrame !== 'undefined') {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.isRunning = false;
  }

  private scheduleNext(): void {
    if (typeof requestAnimationFrame !== 'undefined') {
      this.rafId = requestAnimationFrame(this.loop);
    }
  }

  private loop = (): void => {
    if (!this.isRunning) return;

    if (typeof document !== 'undefined' && document.hidden) {
      this.scheduleNext();
      return;
    }

    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const delta = Math.min(Math.max((now - this.lastTime) / 1000, 0.001), 0.1);
    this.lastTime = now;

    if (this.isDirty || this.options.continuous) {
      this.elapsed += delta;
      this.options.onUpdate?.(delta, this.elapsed);
      this.renderer.render(this.scene, this.camera);

      if (!this.options.continuous) {
        this.idleTimer += delta;
        const maxIdle = this.options.maxIdleSeconds ?? 3;
        if (this.idleTimer >= maxIdle) {
          this.isDirty = false;
        }
      }
    }

    this.scheduleNext();
  };
}

export interface ParabolicArcPoint {
  x: number;
  y: number;
  z: number;
  rotY: number;
  rotZ: number;
  normalizedT: number;
}

/**
 * Computes the 3D position and rotation for card `index` along a parabolic cylindrical arc fan.
 */
export function computeParabolicArcTransform(
  index: number,
  totalCards: number,
  scrollOffset = 0,
  options?: {
    radius?: number;
    arcRadians?: number;
    dipFactor?: number;
    tiltRadians?: number;
  }
): ParabolicArcPoint {
  const halfSpan = Math.max(1, (totalCards - 1) / 2);
  const rawT = (index - (totalCards - 1) / 2) / halfSpan;
  const normalizedT = rawT - scrollOffset;

  const radius = options?.radius ?? 2.6;
  const arcRadians = options?.arcRadians ?? 1.28; // ~73 deg visible arc
  const dipFactor = options?.dipFactor ?? 0.22;
  const tiltRadians = options?.tiltRadians ?? 0.24;

  const theta = normalizedT * (arcRadians / 2);
  const x = radius * Math.sin(theta);
  const z = -radius * (1 - Math.cos(theta));
  const y = -dipFactor * normalizedT * normalizedT;

  return {
    x,
    y,
    z,
    rotY: -theta,
    rotZ: -normalizedT * tiltRadians,
    normalizedT,
  };
}

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

/**
 * Evaluates a 3D Cubic Bézier curve B(t) for t in [0, 1].
 */
export function evaluateCubicBezier3D(
  p0: Point3D,
  p1: Point3D,
  p2: Point3D,
  p3: Point3D,
  t: number
): Point3D {
  const clampedT = Math.max(0, Math.min(1, t));
  const u = 1 - clampedT;
  const tt = clampedT * clampedT;
  const uu = u * u;
  const uuu = uu * u;
  const ttt = tt * clampedT;

  return {
    x: uuu * p0.x + 3 * uu * clampedT * p1.x + 3 * u * tt * p2.x + ttt * p3.x,
    y: uuu * p0.y + 3 * uu * clampedT * p1.y + 3 * u * tt * p2.y + ttt * p3.y,
    z: uuu * p0.z + 3 * uu * clampedT * p1.z + 3 * u * tt * p2.z + ttt * p3.z,
  };
}
