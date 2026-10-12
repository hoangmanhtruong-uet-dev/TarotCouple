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
  const goldPanel = new THREE.Mesh(
    new THREE.SphereGeometry(4, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0xf3e5ab, side: THREE.BackSide })
  );
  goldPanel.position.set(0, 6, 3);
  goldPanel.scale.set(1.5, 0.3, 1.5);
  envScene.add(goldPanel);

  // Mystic Violet Left Rim Light
  const violetPanel = new THREE.Mesh(
    new THREE.SphereGeometry(3, 12, 12),
    new THREE.MeshBasicMaterial({ color: 0x8b5cf6, side: THREE.BackSide })
  );
  violetPanel.position.set(-6, 1, -2);
  envScene.add(violetPanel);

  // Rose Quartz Right Rim Light
  const rosePanel = new THREE.Mesh(
    new THREE.SphereGeometry(3, 12, 12),
    new THREE.MeshBasicMaterial({ color: 0xe879a8, side: THREE.BackSide })
  );
  rosePanel.position.set(6, -1, 2);
  envScene.add(rosePanel);

  const renderTarget = pmremGenerator.fromScene(envScene, 0.04);
  pmremGenerator.dispose();

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
    float ringOuter = smoothstep(0.024, 0.0, abs(r - 0.72 - 0.035 * sin(theta * petals + uTime * 0.8)));
    float ringInner = smoothstep(0.02, 0.0, abs(r - 0.44 + 0.025 * cos(theta * petals - uTime * 0.6)));

    float mouseDist = length(centered - uMouse);
    float mouseHalo = exp(-mouseDist * 3.2) * 0.45;

    float waveMix = smoothstep(-0.1, 0.12, vWave);
    vec3 auraColor = mix(uSecondaryColor, uAccentColor, waveMix * 0.75 + ringOuter * 0.5);
    vec3 finalColor = auraColor + uAccentColor * (ringOuter * 0.85 + ringInner * 0.65 + mouseHalo);

    float alpha = smoothstep(1.0, 0.12, r) * (0.26 + ringOuter * 0.48 + ringInner * 0.38 + mouseHalo * 0.45);
    gl_FragColor = vec4(finalColor, clamp(alpha, 0.0, 0.86));
  }
`;

