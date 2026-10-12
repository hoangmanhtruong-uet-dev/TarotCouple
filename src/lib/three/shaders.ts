import * as THREE from 'three';

/**
 * Custom GLSL Vertex Shader for the Astral Energy Vortex & Distortion Field.
 * Deforms a high-segment plane/ring using multi-layered harmonic waves, mouse proximity,
 * and scroll velocity.
 */
export const ASTRAL_VORTEX_VERTEX_SHADER = /* glsl */ `
  uniform float uTime;
  uniform float uScrollProgress;
  uniform float uVelocity;
  uniform vec2 uMouse;

  varying vec2 vUv;
  varying float vElevation;
  varying float vRadialDist;

  void main() {
    vUv = uv;
    vec3 pos = position;

    // Normalized radial distance from center
    vec2 centeredUv = (uv - 0.5) * 2.0;
    float dist = length(centeredUv);
    vRadialDist = dist;

    // Mouse influence in UV-like space (-1 to 1)
    float mouseDist = length(centeredUv - uMouse);
    float mouseRipple = sin(mouseDist * 12.0 - uTime * 3.5) * exp(-mouseDist * 2.4) * 0.14;

    // Scroll-driven vortex twist and wave elevation
    float angle = atan(centeredUv.y, centeredUv.x);
    float spiralWave = sin(dist * 9.0 - uTime * 1.8 + angle * 3.0 + uScrollProgress * 6.2831);
    float secondaryNoise = cos(pos.x * 4.5 + uTime * 1.1) * sin(pos.y * 4.5 - uTime * 0.9) * 0.08;

    float velocityBoost = 1.0 + clamp(abs(uVelocity) * 0.35, 0.0, 1.5);
    float elevation = (spiralWave * 0.09 + secondaryNoise + mouseRipple) * velocityBoost;

    pos.z += elevation;
    vElevation = elevation;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

/**
 * Custom GLSL Fragment Shader for the Astral Energy Vortex.
 * Renders sacred concentric rings, nebula plasma noise, and interactive cursor glow.
 */
export const ASTRAL_VORTEX_FRAGMENT_SHADER = /* glsl */ `
  uniform float uTime;
  uniform float uScrollProgress;
  uniform vec2 uMouse;
  uniform vec3 uColorGold;
  uniform vec3 uColorViolet;
  uniform vec3 uColorRose;

  varying vec2 vUv;
  varying float vElevation;
  varying float vRadialDist;

  // Lightweight pseudo-noise helper
  float hash21(vec2 p) {
    p = fract(p * vec2(234.34, 435.345));
    p += dot(p, p + 34.23);
    return fract(p.x * p.y);
  }

  void main() {
    vec2 centered = (vUv - 0.5) * 2.0;
    float r = length(centered);
    float theta = atan(centered.y, centered.x);

    // Sacred geometry concentric rings + octagram harmonic
    float ring1 = smoothstep(0.022, 0.0, abs(r - 0.42 - 0.04 * sin(theta * 8.0 + uTime * 0.6)));
    float ring2 = smoothstep(0.018, 0.0, abs(r - 0.68 - 0.03 * cos(theta * 8.0 - uTime * 0.5)));
    float ring3 = smoothstep(0.012, 0.0, abs(r - 0.88));

    // Dynamic color shift across the 3 Scroll Acts
    vec3 actPalette = mix(uColorGold, uColorViolet, smoothstep(0.0, 0.55, uScrollProgress));
    actPalette = mix(actPalette, uColorRose, smoothstep(0.55, 1.0, uScrollProgress));

    // Elevation highlight
    float waveGlow = smoothstep(-0.12, 0.18, vElevation);
    vec3 baseColor = mix(vec3(0.04, 0.03, 0.07), actPalette, waveGlow * 0.65);

    // Add sacred golden rings
    vec3 ringColor = uColorGold * (ring1 * 0.85 + ring2 * 0.65 + ring3 * 0.45);

    // Cursor proximity aura
    float mouseDist = length(centered - uMouse);
    float cursorAura = exp(-mouseDist * 3.8) * 0.42;

    // Subtle procedural grain
    float grain = (hash21(vUv * 400.0 + uTime) - 0.5) * 0.03;

    vec3 finalColor = baseColor + ringColor + actPalette * cursorAura + grain;

    // Radial soft fade so edges blend seamlessly into #09080D background
    float alpha = smoothstep(1.05, 0.18, r) * (0.28 + ring1 * 0.45 + ring2 * 0.35 + cursorAura * 0.5);

    gl_FragColor = vec4(finalColor, clamp(alpha, 0.0, 0.88));
  }
`;

/**
 * Custom GLSL Vertex Shader for Mystical Ritual Mist.
 * Gentle fluid undulation on vertex plane for subtle 3D depth and parallax.
 */
export const MYSTICAL_MIST_VERTEX_SHADER = /* glsl */ `
  uniform float uTime;
  uniform vec2 uMouse;

  varying vec2 vUv;
  varying vec2 vCenteredUv;
  varying float vElevation;

  void main() {
    vUv = uv;
    vec2 centered = (uv - 0.5) * 2.0;
    vCenteredUv = centered;
    vec3 pos = position;

    // Subtle fluid wave undulation on vertex plane for 3D depth
    float wave1 = sin(pos.x * 1.8 + uTime * 0.45) * cos(pos.y * 1.8 - uTime * 0.35) * 0.08;
    float wave2 = sin((pos.x + pos.y) * 2.5 + uTime * 0.65) * 0.04;
    float elevation = wave1 + wave2;
    pos.z += elevation;
    vElevation = elevation;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

/**
 * Custom GLSL Fragment Shader for Mystical Ritual Mist.
 * 2-Octave FBM procedural smoke tendrils, interactive cursor vortex,
 * Reader accent color blending, and soft edge fade.
 */
export const MYSTICAL_MIST_FRAGMENT_SHADER = /* glsl */ `
  uniform float uTime;
  uniform vec2 uMouse;
  uniform vec3 uColorBase;
  uniform vec3 uColorAccent;
  uniform float uMistDensity;

  varying vec2 vUv;
  varying vec2 vCenteredUv;
  varying float vElevation;

  // Ultra-fast trigonometric-free 2D hash (safe on low-precision mobile GPUs)
  float hash21(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }

  // 2D Value Noise with smooth Hermite interpolation (zero texture lookups)
  float valueNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);

    float a = hash21(i);
    float b = hash21(i + vec2(1.0, 0.0));
    float c = hash21(i + vec2(0.0, 1.0));
    float d = hash21(i + vec2(1.0, 1.0));

    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }

  // 2-Octave Fractional Brownian Motion (unrolled for zero branch/loop overhead)
  float fbm2(vec2 p) {
    float v = 0.65 * valueNoise(p);
    p = p * 2.18 + vec2(2.39, 1.47);
    v += 0.35 * valueNoise(p);
    return v;
  }

  void main() {
    vec2 centered = vCenteredUv;
    float dist = length(centered);

    // Time-based dual-layer drift for advective mystical fog movement
    vec2 drift1 = vec2(uTime * 0.035, uTime * 0.018);
    vec2 drift2 = vec2(-uTime * 0.022, uTime * 0.028);

    // Interactive mouse vortex deflection
    vec2 mouseDelta = centered - uMouse;
    float mouseDist = length(mouseDelta);
    float mouseFalloff = exp(-mouseDist * 2.5);
    vec2 vortexSwirl = vec2(-mouseDelta.y, mouseDelta.x) * 0.45;
    vec2 vortexPush = normalize(mouseDelta + 0.001) * 0.2;
    vec2 mouseDeflection = (vortexSwirl + vortexPush) * mouseFalloff;

    // Domain warping with 2-octave FBM for wispy ethereal smoke tendrils
    vec2 coord = centered * 2.2 + mouseDeflection;
    float warpA = fbm2(coord + drift1);
    float warpB = fbm2(coord + drift2 + vec2(warpA * 0.8));
    vec2 warpedCoord = coord + vec2(warpA, warpB) * 0.65;

    float mist = fbm2(warpedCoord);
    mist = smoothstep(0.18, 0.82, mist) * uMistDensity;

    // Reader accent color blending:
    // Base dark background -> Reader accent -> Luminous celestial highlights
    vec3 mistHighlight = mix(uColorAccent, vec3(1.0, 0.95, 0.88), 0.4);
    vec3 color = mix(uColorBase, uColorAccent, mist * 0.85);
    color = mix(color, mistHighlight, pow(mist, 2.5) * 0.7);

    // Add subtle cursor proximity luminous aura
    float cursorAura = mouseFalloff * 0.35;
    color += uColorAccent * cursorAura;

    // Soft edge radial fade using smoothstep (seamless integration with sanctuary background)
    float edgeFade = smoothstep(1.05, 0.25, dist);
    float alpha = clamp(mist * edgeFade * (0.55 + cursorAura * 0.4), 0.0, 0.88);

    gl_FragColor = vec4(color, alpha);
  }
`;

/**
 * Custom GLSL Vertex Shader for Interactive Energy Ripple Waves.
 * Displaces surface vertices in 3D along Z-axis on card click / touch.
 */
export const ENERGY_WAVE_VERTEX_SHADER = /* glsl */ `
  uniform float uTime;
  uniform vec2 uTouchOrigin;
  uniform float uTouchStartTime;
  uniform float uWaveSpeed;
  uniform float uWaveFrequency;
  uniform float uDecayRate;
  uniform float uTemporalDecay;
  uniform float uWaveIntensity;

  varying vec2 vUv;
  varying vec2 vCenteredUv;
  varying float vDistToOrigin;
  varying float vWaveDisplacement;
  varying float vElapsed;

  void main() {
    vUv = uv;
    vec2 centered = (uv - 0.5) * 2.0;
    vCenteredUv = centered;
    vec3 pos = position;

    float dt = max(0.0, uTime - uTouchStartTime);
    vElapsed = dt;

    float dist = length(centered - uTouchOrigin);
    vDistToOrigin = dist;

    float waveFront = dt * uWaveSpeed;
    float distFromFront = dist - waveFront;

    float packet = exp(-pow(distFromFront * 4.0, 2.0));
    float sineWave = sin(dist * uWaveFrequency - dt * (uWaveSpeed * uWaveFrequency));
    float attenuation = exp(-dist * uDecayRate) * exp(-dt * uTemporalDecay);

    float displacement = sineWave * packet * attenuation * uWaveIntensity;
    pos.z += displacement;
    vWaveDisplacement = displacement;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

/**
 * Custom GLSL Fragment Shader for Interactive Energy Ripple Waves.
 * Renders glowing wavefront packet, leading edge rim, and chromatic dissipation.
 */
export const ENERGY_WAVE_FRAGMENT_SHADER = /* glsl */ `
  uniform float uTime;
  uniform vec2 uTouchOrigin;
  uniform float uTouchStartTime;
  uniform float uWaveSpeed;
  uniform float uWaveFrequency;
  uniform float uDecayRate;
  uniform float uTemporalDecay;
  uniform vec3 uColorBase;
  uniform vec3 uColorWave;
  uniform vec3 uColorCrest;
  uniform float uWaveIntensity;

  varying vec2 vUv;
  varying vec2 vCenteredUv;
  varying float vDistToOrigin;
  varying float vWaveDisplacement;
  varying float vElapsed;

  void main() {
    float dt = vElapsed;
    float dist = vDistToOrigin;

    // Wavefront position and leading rim
    float waveFront = dt * uWaveSpeed;
    float distFromFront = dist - waveFront;
    float ringPacket = exp(-pow(distFromFront * 4.5, 2.0));

    // Temporal and spatial damping
    float attenuation = exp(-dist * uDecayRate) * exp(-dt * uTemporalDecay);

    // High-frequency harmonic energy rings
    float rings = (0.5 + 0.5 * sin(dist * uWaveFrequency - dt * (uWaveSpeed * uWaveFrequency))) * ringPacket;

    // Physical displacement energy visualization
    float displacementGlow = abs(vWaveDisplacement) * 14.0;

    // Leading edge sharp crest
    float leadRim = smoothstep(0.06, 0.0, abs(distFromFront)) * exp(-dt * uTemporalDecay * 0.7);

    // Chromatic energy color mixing
    vec3 waveColor = mix(uColorWave, uColorCrest, clamp(rings * 0.7 + leadRim * 0.9, 0.0, 1.0));
    vec3 finalColor = mix(uColorBase, waveColor, clamp(attenuation * 1.5, 0.0, 1.0));
    finalColor += uColorCrest * (leadRim * 0.8 + displacementGlow * 0.6);

    // Soft edge radial fade around outer perimeter
    float edgeFade = smoothstep(1.05, 0.25, length(vCenteredUv));
    float alpha = clamp((rings * 0.85 + leadRim * 0.95 + displacementGlow * 0.5) * attenuation * edgeFade, 0.0, 0.92);

    gl_FragColor = vec4(finalColor, alpha);
  }
`;

/**
 * Custom GLSL Vertex Shader for Luminescent Point Particles.
 */
export const LUMINESCENT_PARTICLES_VERTEX_SHADER = /* glsl */ `
  attribute float aScale;
  attribute float aPhase;
  attribute vec3 aColor;
  attribute float aSpeed;

  uniform float uTime;
  uniform vec2 uMouse;
  uniform float uPixelRatio;
  uniform float uBaseSize;

  varying vec3 vColor;
  varying float vTwinkle;

  void main() {
    vColor = aColor;
    vec3 pos = position;

    // Subtle natural celestial drift
    pos.x += sin(uTime * aSpeed * 0.7 + aPhase) * 0.12;
    pos.y += cos(uTime * aSpeed * 0.9 + aPhase * 1.4) * 0.12;

    // Interactive mouse vortex/repulsion
    vec2 mouseDelta = pos.xy - (uMouse * 3.5);
    float mouseDist = length(mouseDelta);
    float mouseInfluence = exp(-mouseDist * 1.8);
    vec2 mouseRepel = normalize(mouseDelta + 0.0001) * mouseInfluence * 0.35;
    pos.xy += mouseRepel;

    // Twinkle pulsation factor
    float twinkle = 0.75 + 0.25 * sin(uTime * 2.5 + aPhase * 3.1415);
    vTwinkle = twinkle;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = (uBaseSize * aScale * twinkle * uPixelRatio) / (-mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

/**
 * Custom GLSL Fragment Shader for Luminescent Point Particles.
 * Dual-lobe radial glow: intense luminous core + soft celestial halo.
 */
export const LUMINESCENT_PARTICLES_FRAGMENT_SHADER = /* glsl */ `
  varying vec3 vColor;
  varying float vTwinkle;

  void main() {
    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist = length(coord);

    // Branchless soft circular cutoff (mobile TBDR friendly)
    float circleMask = smoothstep(0.5, 0.44, dist);

    float core = smoothstep(0.12, 0.0, dist);
    float halo = exp(-dist * 5.5) * smoothstep(0.5, 0.0, dist);

    vec3 finalColor = mix(vColor, vec3(1.0, 0.98, 0.94), core * 0.85);
    float alpha = clamp((core * 1.1 + halo * 0.75) * vTwinkle * circleMask, 0.0, 1.0);

    gl_FragColor = vec4(finalColor, alpha);
  }
`;

export interface MysticalMistUniforms {
  uTime: { value: number };
  uMouse: { value: THREE.Vector2 };
  uColorBase: { value: THREE.Color };
  uColorAccent: { value: THREE.Color };
  uMistDensity: { value: number };
}

export function createMysticalMistUniforms(options?: {
  accentHex?: string | number;
  baseHex?: string | number;
  density?: number;
}): MysticalMistUniforms {
  return {
    uTime: { value: 0 },
    uMouse: { value: new THREE.Vector2(0, 0) },
    uColorBase: { value: new THREE.Color(options?.baseHex ?? 0x09080d) },
    uColorAccent: { value: new THREE.Color(options?.accentHex ?? 0xc9a24a) },
    uMistDensity: { value: options?.density ?? 1.0 },
  };
}

export interface EnergyWaveUniforms {
  uTime: { value: number };
  uTouchOrigin: { value: THREE.Vector2 };
  uTouchStartTime: { value: number };
  uWaveSpeed: { value: number };
  uWaveFrequency: { value: number };
  uDecayRate: { value: number };
  uTemporalDecay: { value: number };
  uColorBase: { value: THREE.Color };
  uColorWave: { value: THREE.Color };
  uColorCrest: { value: THREE.Color };
  uWaveIntensity: { value: number };
}

export function createEnergyWaveUniforms(options?: {
  waveColorHex?: string | number;
  crestColorHex?: string | number;
  baseHex?: string | number;
  speed?: number;
  frequency?: number;
  decayRate?: number;
  intensity?: number;
}): EnergyWaveUniforms {
  return {
    uTime: { value: 0 },
    uTouchOrigin: { value: new THREE.Vector2(0, 0) },
    uTouchStartTime: { value: -100.0 }, // Inactive initially
    uWaveSpeed: { value: options?.speed ?? 2.4 },
    uWaveFrequency: { value: options?.frequency ?? 16.0 },
    uDecayRate: { value: options?.decayRate ?? 2.8 },
    uTemporalDecay: { value: 1.8 },
    uColorBase: { value: new THREE.Color(options?.baseHex ?? 0x09080d) },
    uColorWave: { value: new THREE.Color(options?.waveColorHex ?? 0xc9a24a) },
    uColorCrest: { value: new THREE.Color(options?.crestColorHex ?? 0xf3e5ab) },
    uWaveIntensity: { value: options?.intensity ?? 0.12 },
  };
}

export interface LuminescentParticlesUniforms {
  uTime: { value: number };
  uMouse: { value: THREE.Vector2 };
  uPixelRatio: { value: number };
  uBaseSize: { value: number };
}

export function createLuminescentParticlesUniforms(options?: {
  baseSize?: number;
  pixelRatio?: number;
}): LuminescentParticlesUniforms {
  return {
    uTime: { value: 0 },
    uMouse: { value: new THREE.Vector2(0, 0) },
    uPixelRatio: { value: options?.pixelRatio ?? 1.0 },
    uBaseSize: { value: options?.baseSize ?? 24.0 },
  };
}

/**
 * Post-Processing ShaderPass: Chromatic Aberration (Lens RGB Split) + Cinematic Vignette.
 */
export const CHROMATIC_VIGNETTE_SHADER = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    uChromaticIntensity: { value: 0.0022 },
    uVignetteOffset: { value: 0.95 },
    uVignetteDarkness: { value: 1.35 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uChromaticIntensity;
    uniform float uVignetteOffset;
    uniform float uVignetteDarkness;

    varying vec2 vUv;

    void main() {
      vec2 centered = vUv - 0.5;
      float dist = length(centered);

      // Radial Chromatic Aberration (stronger toward lens edges)
      vec2 offset = centered * dist * uChromaticIntensity;

      float r = texture2D(tDiffuse, vUv + offset).r;
      float g = texture2D(tDiffuse, vUv).g;
      float b = texture2D(tDiffuse, vUv - offset).b;
      float a = texture2D(tDiffuse, vUv).a;

      vec3 color = vec3(r, g, b);

      // Smooth Cinematic Vignette
      float vig = smoothstep(uVignetteOffset, uVignetteOffset - 0.65, dist * uVignetteDarkness);
      color *= mix(0.32, 1.0, vig);

      gl_FragColor = vec4(color, a);
    }
  `,
};

/**
 * Generates a procedural HDRI-like Environment Map using PMREMGenerator
 * so THREE.MeshPhysicalMaterial (clearcoat, gilded gold edges) reflects realistic sanctuary lighting
 * without external .hdr file downloads.
 */
export function createProceduralSanctuaryEnvMap(
  renderer: THREE.WebGLRenderer
): THREE.Texture {
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  pmremGenerator.compileCubemapShader();

  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color(0x09080d);

  // Warm Gold Top Dome Light
  const goldGeom = new THREE.SphereGeometry(4, 16, 16);
  const goldMat = new THREE.MeshBasicMaterial({ color: 0xf3e5ab, side: THREE.BackSide });
  const goldPanel = new THREE.Mesh(goldGeom, goldMat);
  goldPanel.position.set(0, 6, 3);
  goldPanel.scale.set(1.5, 0.3, 1.5);
  envScene.add(goldPanel);

  // Mystic Violet Left Rim Light
  const violetGeom = new THREE.SphereGeometry(3, 12, 12);
  const violetMat = new THREE.MeshBasicMaterial({ color: 0x8b5cf6, side: THREE.BackSide });
  const violetPanel = new THREE.Mesh(violetGeom, violetMat);
  violetPanel.position.set(-6, 1, -2);
  envScene.add(violetPanel);

  // Rose Quartz Right Rim Light
  const roseGeom = new THREE.SphereGeometry(3, 12, 12);
  const roseMat = new THREE.MeshBasicMaterial({ color: 0xe879a8, side: THREE.BackSide });
  const rosePanel = new THREE.Mesh(roseGeom, roseMat);
  rosePanel.position.set(6, -1, 2);
  envScene.add(rosePanel);

  const renderTarget = pmremGenerator.fromScene(envScene, 0.04);
  pmremGenerator.dispose();

  // Dispose temporary geometry & materials
  goldGeom.dispose();
  goldMat.dispose();
  violetGeom.dispose();
  violetMat.dispose();
  roseGeom.dispose();
  roseMat.dispose();
  envScene.clear();

  return renderTarget.texture;
}

/**
 * Custom GLSL Vertex Shader for the 4 Reader Persona Aura Stage (ReaderIntroModal).
 * Single-pass, zero-lag wave & mouse distortion tailored for each Reader's harmonic frequency.
 */
export const PERSONA_AURA_VERTEX_SHADER = /* glsl */ `
  uniform float uTime;
  uniform vec2 uMouse;
  uniform float uPersonaIndex;

  varying vec2 vUv;
  varying float vWave;

  void main() {
    vUv = uv;
    vec3 pos = position;

    vec2 centered = (uv - 0.5) * 2.0;
    float dist = length(centered);
    float angle = atan(centered.y, centered.x);

    // Harmonic symmetry changes subtly per Reader (4, 6, 8, 12 petals)
    float symmetry = 4.0 + uPersonaIndex * 2.0;
    float mandalaWave = sin(dist * 8.0 - uTime * 1.6 + angle * symmetry) * 0.07;

    float mouseDist = length(centered - uMouse);
    float cursorPulse = cos(mouseDist * 10.0 - uTime * 3.0) * exp(-mouseDist * 2.5) * 0.09;

    vWave = mandalaWave + cursorPulse;
    pos.z += vWave;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

/**
 * Custom GLSL Fragment Shader for the 4 Reader Persona Aura Stage.
 * Smoothly interpolates uAccentColor and uSecondaryColor in real time without recreating WebGL context.
 */
export const PERSONA_AURA_FRAGMENT_SHADER = /* glsl */ `
  uniform float uTime;
  uniform vec2 uMouse;
  uniform vec3 uAccentColor;
  uniform vec3 uSecondaryColor;
  uniform float uPersonaIndex;

  varying vec2 vUv;
  varying float vWave;

  void main() {
    vec2 centered = (vUv - 0.5) * 2.0;
    float r = length(centered);
    float theta = atan(centered.y, centered.x);

    float petals = 4.0 + uPersonaIndex * 2.0;
    float ringOuter = smoothstep(0.036, 0.0, abs(r - 0.78 - 0.045 * sin(theta * petals + uTime * 1.1)));
    float ringMid = smoothstep(0.03, 0.0, abs(r - 0.58 + 0.035 * cos(theta * petals - uTime * 0.9)));
    float ringInner = smoothstep(0.026, 0.0, abs(r - 0.36 + 0.025 * sin(theta * (petals * 2.0) + uTime * 1.3)));

    // Radial starlight rays visible around card edges on Mobile
    float starRays = pow(max(0.0, cos(theta * petals + uTime * 0.5)), 6.0) * smoothstep(0.98, 0.35, r) * 0.45;

    float mouseDist = length(centered - uMouse);
    float mouseHalo = exp(-mouseDist * 2.8) * 0.62;

    float waveMix = smoothstep(-0.1, 0.12, vWave);
    vec3 auraColor = mix(uSecondaryColor, uAccentColor, waveMix * 0.8 + ringOuter * 0.55);
    vec3 finalColor = auraColor + uAccentColor * (ringOuter * 1.15 + ringMid * 0.9 + ringInner * 0.75 + starRays + mouseHalo);

    float alpha = smoothstep(1.02, 0.08, r) * (0.38 + ringOuter * 0.55 + ringMid * 0.45 + starRays * 0.5 + mouseHalo * 0.55);
    gl_FragColor = vec4(finalColor, clamp(alpha, 0.0, 0.92));
  }
`;
