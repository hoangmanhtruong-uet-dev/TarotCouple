import * as THREE from 'three';
import { type HardwareTier } from './core';

/**
 * Generates an Offscreen/DOM Canvas containing the Sacred Octagram & Lunar Phases
 * card back artwork in Antique Gold (#C9A24A) over Velvet Obsidian (#14111C).
 * 100% immune to CORS issues and offline-ready.
 */
export function createSacredCardBackTexture(
  accentHex = '#C9A24A'
): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 448;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // 1. Deep Velvet Background
  const bgGrad = ctx.createLinearGradient(0, 0, 256, 448);
  bgGrad.addColorStop(0, '#1D1829');
  bgGrad.addColorStop(0.5, '#14111C');
  bgGrad.addColorStop(1, '#09080D');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 256, 448);

  // 2. Double Antique Gold Ornate Border
  ctx.strokeStyle = accentHex;
  ctx.lineWidth = 4;
  ctx.strokeRect(12, 12, 232, 424);

  ctx.lineWidth = 1.5;
  ctx.strokeRect(20, 20, 216, 408);

  // 3. Corner Celestial Diamonds
  const corners = [
    [28, 28],
    [228, 28],
    [28, 420],
    [228, 420],
  ];
  ctx.fillStyle = accentHex;
  for (const [cx, cy] of corners) {
    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // 4. Sacred Octagram at Center (128, 224)
  ctx.save();
  ctx.translate(128, 224);
  ctx.strokeStyle = accentHex;
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.arc(0, 0, 68, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(0, 0, 56, 0, Math.PI * 2);
  ctx.stroke();

  for (let rot = 0; rot < 2; rot++) {
    ctx.save();
    ctx.rotate((rot * Math.PI) / 4);
    ctx.strokeRect(-38, -38, 76, 76);
    ctx.restore();
  }

  // Center Sun Star
  ctx.beginPath();
  ctx.arc(0, 0, 12, 0, Math.PI * 2);
  ctx.fillStyle = accentHex;
  ctx.fill();
  ctx.restore();

  // 5. Upper & Lower Crescent Moons
  ctx.strokeStyle = accentHex;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(128, 92, 18, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(128, 356, 18, 0, Math.PI * 2);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

export interface CardFaceTextureOptions {
  roman?: string;
  title?: string;
  imageUrl?: string;
  accentHex?: string;
  onUpdate?: () => void;
}

/**
 * Generates a gilded Tarot Card Front texture immediately and asynchronously overlays
 * the official RWS 1909 artwork if `imageUrl` loads with CORS enabled.
 */
export function createCardFaceTexture(
  options: CardFaceTextureOptions
): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;

  const accentHex = options.accentHex || '#C9A24A';
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 448;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const drawFrameAndLabels = (artImg?: HTMLImageElement) => {
    const grad = ctx.createLinearGradient(0, 0, 0, 448);
    grad.addColorStop(0, '#1D1829');
    grad.addColorStop(0.5, '#14111C');
    grad.addColorStop(1, '#09080D');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 448);

    if (artImg) {
      try {
        ctx.drawImage(artImg, 18, 42, 220, 344);
      } catch {
        // Ignore taint/draw errors and keep procedural emblem
      }
    } else {
      // Procedural Mystic Tarot Emblem while loading or offline
      ctx.save();
      ctx.translate(128, 214);
      ctx.strokeStyle = accentHex;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 54, 0, Math.PI * 2);
      ctx.stroke();
      ctx.font = 'bold 26px serif';
      ctx.fillStyle = accentHex;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('✦', 0, 0);
      ctx.restore();
    }

    // Top & Bottom Bars
    ctx.fillStyle = '#09080D';
    ctx.fillRect(14, 12, 228, 30);
    ctx.fillRect(14, 386, 228, 50);

    // Outer Gold Frame
    ctx.strokeStyle = accentHex;
    ctx.lineWidth = 5;
    ctx.strokeRect(12, 12, 232, 424);

    // Roman Numeral Header
    ctx.fillStyle = accentHex;
    ctx.font = 'bold 15px serif';
    ctx.textAlign = 'center';
    ctx.fillText(options.roman || '✦', 128, 32);

    // Card Title Footer
    ctx.fillStyle = '#F8F5F0';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText((options.title || 'TAROT RWS').slice(0, 22), 128, 416);
  };

  drawFrameAndLabels();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;

  if (options.imageUrl && typeof Image !== 'undefined') {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      drawFrameAndLabels(img);
      texture.needsUpdate = true;
      options.onUpdate?.();
    };
    img.src = options.imageUrl;
  }

  return texture;
}

export interface Create3DTarotCardMeshOptions {
  roman?: string;
  title?: string;
  imageUrl?: string;
  accentHex?: string;
  width?: number;
  height?: number;
  thickness?: number;
  onTextureLoaded?: () => void;
  // PBR Gold Foil & Tier Options
  tier?: HardwareTier;
  usePhysicalMaterial?: boolean;
  envMap?: THREE.Texture | null;
  metalness?: number;
  roughness?: number;
  clearcoat?: number;
  clearcoatRoughness?: number;
  envMapIntensity?: number;
}

/**
 * Builds a complete 3D Tarot Card Box Mesh with:
 * - 4 Antique Gold foil edges (#C9A24A) with calibrated PBR clearcoat & metalness
 * - Front RWS face (+Z) with gilded borders
 * - Sacred Geometry back face (-Z) with Sacred Octagram & Lunar phases
 * - Seamless Tier-Adaptive fallback: MeshPhysicalMaterial for Tier 1, enhanced MeshStandardMaterial for Tier 2/Mobile.
 */
export function create3DTarotCardMesh(
  options: Create3DTarotCardMeshOptions = {}
): THREE.Mesh {
  const width = options.width ?? 0.72;
  const height = options.height ?? 1.26;
  const thickness = options.thickness ?? 0.016;
  const accentHex = options.accentHex ?? '#C9A24A';

  const isTier1 =
    options.tier === 'tier1' || (!options.tier && options.usePhysicalMaterial !== false);
  const usePhysical = options.usePhysicalMaterial ?? isTier1;

  const geometry = new THREE.BoxGeometry(width, height, thickness);

  // 1. Gilded Gold Foil Edge Material (Faces 0, 1, 2, 3)
  const edgeMetalness = options.metalness ?? 0.85;
  const edgeRoughness = options.roughness ?? 0.25;
  const edgeClearcoat = options.clearcoat ?? 0.7;
  const edgeClearcoatRoughness = options.clearcoatRoughness ?? 0.15;
  const edgeEnvIntensity = options.envMapIntensity ?? 1.25;

  const edgeMaterial = usePhysical
    ? new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(accentHex),
        metalness: edgeMetalness,
        roughness: edgeRoughness,
        clearcoat: edgeClearcoat,
        clearcoatRoughness: edgeClearcoatRoughness,
        reflectivity: 0.9,
        ...(options.envMap ? { envMap: options.envMap, envMapIntensity: edgeEnvIntensity } : {}),
      })
    : new THREE.MeshStandardMaterial({
        color: new THREE.Color(accentHex),
        metalness: edgeMetalness,
        roughness: edgeRoughness,
        ...(options.envMap ? { envMap: options.envMap, envMapIntensity: 1.0 } : {}),
      });

  // 2. Procedural Textures for Front & Back
  const frontTexture = createCardFaceTexture({
    roman: options.roman,
    title: options.title,
    imageUrl: options.imageUrl,
    accentHex,
    onUpdate: options.onTextureLoaded,
  });

  const backTexture = createSacredCardBackTexture(accentHex);

  // 3. Front Face Material (Face 4 / +Z)
  const frontMaterial = usePhysical
    ? new THREE.MeshPhysicalMaterial({
        ...(frontTexture ? { map: frontTexture } : {}),
        color: new THREE.Color('#ffffff'),
        metalness: 0.18,
        roughness: 0.38,
        clearcoat: 0.45,
        clearcoatRoughness: 0.2,
        ...(options.envMap ? { envMap: options.envMap, envMapIntensity: 0.85 } : {}),
      })
    : new THREE.MeshStandardMaterial({
        ...(frontTexture ? { map: frontTexture } : {}),
        color: new THREE.Color('#ffffff'),
        metalness: 0.18,
        roughness: 0.42,
        ...(options.envMap ? { envMap: options.envMap, envMapIntensity: 0.8 } : {}),
      });

  // 4. Back Face Material (Face 5 / -Z)
  const backMaterial = usePhysical
    ? new THREE.MeshPhysicalMaterial({
        ...(backTexture ? { map: backTexture } : {}),
        color: new THREE.Color('#ffffff'),
        metalness: 0.38,
        roughness: 0.32,
        clearcoat: 0.6,
        clearcoatRoughness: 0.18,
        ...(options.envMap ? { envMap: options.envMap, envMapIntensity: 1.0 } : {}),
      })
    : new THREE.MeshStandardMaterial({
        ...(backTexture ? { map: backTexture } : {}),
        color: new THREE.Color('#ffffff'),
        metalness: 0.35,
        roughness: 0.38,
        ...(options.envMap ? { envMap: options.envMap, envMapIntensity: 1.0 } : {}),
      });

  // BoxGeometry face order: [right (+X), left (-X), top (+Y), bottom (-Y), front (+Z), back (-Z)]
  const materials: THREE.Material[] = [
    edgeMaterial,
    edgeMaterial,
    edgeMaterial,
    edgeMaterial,
    frontMaterial,
    backMaterial,
  ];

  const mesh = new THREE.Mesh(geometry, materials);
  mesh.castShadow = isTier1;
  mesh.receiveShadow = isTier1;

  return mesh;
}
