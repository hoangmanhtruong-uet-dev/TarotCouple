/**
 * Client-Side Deterministic Hardware Device Fingerprinting (Anti-Spam V2)
 *
 * Gathers immutable hardware and browser characteristics to form a unique device identifier:
 * - Screen resolution & color depth
 * - WebGL unmasked GPU renderer
 * - Canvas 2D rendering signature
 * - Timezone & System language
 * - Hardware concurrency
 *
 * Persists in localStorage (`tc_device_fp_v1`) and cookie (`tc_device_fp`)
 * Attached in `x-device-id` header on API requests to prevent abuse of the 3 free daily draws.
 */

const STORAGE_KEY = 'tc_device_fp_v1';
const COOKIE_NAME = 'tc_device_fp';

/**
 * Fast 32-bit FNV-1a non-cryptographic hash function
 */
function fnv1a(str: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

/**
 * 2D Canvas rendering fingerprint
 */
function getCanvasFingerprint(): string {
  if (typeof document === 'undefined') return 'server_canvas';
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 160;
    canvas.height = 40;
    const ctx = canvas.getContext('2d');
    if (!ctx) return 'no_ctx';
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#C9A24A';
    ctx.fillRect(0, 0, 160, 40);
    ctx.fillStyle = '#14111C';
    ctx.fillText('TarotCoupleFP_v2', 8, 12);
    return canvas.toDataURL().slice(-36);
  } catch {
    return 'canvas_fallback';
  }
}

/**
 * WebGL GPU Unmasked Renderer fingerprint
 */
function getWebGLFingerprint(): string {
  if (typeof document === 'undefined') return 'server_webgl';
  try {
    const canvas = document.createElement('canvas');
    const gl =
      canvas.getContext('webgl') ||
      (canvas.getContext('experimental-webgl') as WebGLRenderingContext | null);
    if (!gl) return 'no_webgl';
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    if (!ext) return 'no_debug_info';
    return gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || 'generic_gpu';
  } catch {
    return 'webgl_fallback';
  }
}

/**
 * Generates raw device hardware signature string
 */
export function generateHardwareSignature(): string {
  if (typeof window === 'undefined') return 'server_side_identity';

  const screenInfo = `${window.screen?.width || 0}x${window.screen?.height || 0}x${window.screen?.colorDepth || 0}`;
  const tz = Intl?.DateTimeFormat?.().resolvedOptions?.().timeZone || 'UTC';
  const lang = navigator.language || 'vi';
  const cores = navigator.hardwareConcurrency || 4;
  const canvasHash = fnv1a(getCanvasFingerprint());
  const webglHash = fnv1a(getWebGLFingerprint());

  const rawSeed = `${screenInfo}|${tz}|${lang}|${cores}|${canvasHash}|${webglHash}`;
  const primaryHash = fnv1a(rawSeed);
  const secondaryHash = fnv1a(rawSeed.split('').reverse().join(''));

  return `tc_dfp_${primaryHash}${secondaryHash}`;
}

/**
 * Returns cached or newly generated persistent device fingerprint
 */
export function getOrSetDeviceFingerprint(): string {
  if (typeof window === 'undefined') return 'server_runtime';

  let cached: string | null = null;
  try {
    cached = localStorage?.getItem(STORAGE_KEY);
  } catch {
    // localStorage might be blocked or restricted (e.g. incognito/iframe)
  }

  if (cached && /^tc_dfp_[a-f0-9]{16}$/.test(cached)) {
    try {
      if (typeof document !== 'undefined' && !document.cookie?.includes(`${COOKIE_NAME}=`)) {
        document.cookie = `${COOKIE_NAME}=${cached}; Path=/; Max-Age=31536000; SameSite=Lax`;
      }
    } catch {
      // ignore cookie write error
    }
    return cached;
  }

  // 2. Generate deterministic fingerprint
  const fp = generateHardwareSignature();

  try {
    localStorage?.setItem(STORAGE_KEY, fp);
  } catch {
    // ignore localStorage write error
  }

  try {
    if (typeof document !== 'undefined') {
      document.cookie = `${COOKIE_NAME}=${fp}; Path=/; Max-Age=31536000; SameSite=Lax`;
    }
  } catch {
    // ignore cookie write error
  }

  return fp;
}

/**
 * Returns header object with `x-device-id` for fetch requests
 */
export function getDeviceFingerprintHeaders(): Record<string, string> {
  const fp = getOrSetDeviceFingerprint();
  return fp ? { 'x-device-id': fp } : {};
}
