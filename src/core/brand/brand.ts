import * as THREE from 'three';
import { PALETTE, FONTS, standardMaterial } from '../design/tokens.js';
import logoAssetUrl from '../../../assets/brand/maarify-logo.png';

export const BRAND_NAME = 'Maarify';
export const BRAND_LOGO_URL = logoAssetUrl;

/**
 * Brand plaque: a brass-framed wordmark that swaps to the logo once
 * assets/brand/maarify-logo.png exists. Dropping the file in is enough — no code
 * change is needed; if it is missing the serif wordmark stays.
 */
export function createBrandPlaque(widthMeters = 1.5, heightMeters = 0.55): THREE.Group {
  const group = new THREE.Group();
  group.name = 'brand-plaque';

  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(widthMeters, heightMeters, 0.05),
    standardMaterial('brass')
  );
  group.add(frame);

  const inset = new THREE.Mesh(
    new THREE.PlaneGeometry(widthMeters * 0.94, heightMeters * 0.86),
    new THREE.MeshStandardMaterial({ color: PALETTE.walnut, roughness: 0.7, metalness: 0.1 })
  );
  inset.position.z = 0.028;
  group.add(inset);

  const wCanvas=typeof document!=="undefined"?document.createElement("canvas"):null;
  let wordmark:THREE.Mesh;
  if(wCanvas){
    wCanvas.width=768;wCanvas.height=256;
    const wCtx=wCanvas.getContext("2d")!;
    wCtx.fillStyle="#241610";wCtx.fillRect(0,0,768,256);
    // Swahili carved-door border geometry: Lamu/Zanzibar geometric fret & diamond lozenges (kikapu/kamba motif)
    wCtx.strokeStyle = '#b08d57';
    wCtx.lineWidth = 2;
    wCtx.strokeRect(16, 16, 736, 224);
    wCtx.strokeRect(22, 22, 724, 212);
    for (let x = 32; x < 720; x += 32) {
      wCtx.beginPath();
      wCtx.moveTo(x, 22);
      wCtx.lineTo(x + 16, 36);
      wCtx.lineTo(x + 32, 22);
      wCtx.stroke();

      wCtx.beginPath();
      wCtx.moveTo(x, 234);
      wCtx.lineTo(x + 16, 220);
      wCtx.lineTo(x + 32, 234);
      wCtx.stroke();
    }

    wCtx.fillStyle = '#e8dcc0';
    wCtx.font = 'bold 92px ' + FONTS.serif;
    wCtx.fillText('M', 40, 160);
    wCtx.font = 'bold 72px ' + FONTS.serif;
    wCtx.fillText('AARIFY', 128, 156);
    wCtx.fillStyle = '#b08d57';
    wCtx.font = '18px ' + FONTS.serif;
    wCtx.textAlign = 'center';
    wCtx.fillText('A SPATIAL LEARNING EXPERIENCE', 384, 198);
    const wTex = new THREE.CanvasTexture(wCanvas);
    wTex.minFilter = THREE.LinearFilter;
    wordmark = new THREE.Mesh(
      new THREE.PlaneGeometry(widthMeters * 0.92, heightMeters * 0.7),
      new THREE.MeshBasicMaterial({ map: wTex, transparent: true, side: THREE.FrontSide })
    );
  } else {
    wordmark = new THREE.Mesh(
      new THREE.PlaneGeometry(widthMeters * 0.9, heightMeters * 0.62),
      new THREE.MeshBasicMaterial({ color: 0xe8dcc0, side: THREE.FrontSide })
    );
  }
  wordmark.position.z = 0.032;
  group.add(wordmark);

  // Logo loading: loads the real Maarify brand logo texture onto the plaque
  if (typeof document !== 'undefined' && typeof Image !== 'undefined') {
    new THREE.TextureLoader().load(
      BRAND_LOGO_URL,
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        const image = texture.image as { width?: number; height?: number } | undefined;
        const aspect = image?.width && image?.height ? image.width / image.height : 1;
        const logoWidth = widthMeters * 0.86;
        const logo = new THREE.Mesh(
          new THREE.PlaneGeometry(logoWidth, logoWidth / aspect),
          new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.FrontSide })
        );
        logo.position.z = 0.034;
        logo.name = 'brand-logo';
        wordmark.visible = false;
        group.add(logo);
      },
      undefined,
      () => {
        /* no logo file yet: keep the serif wordmark */
      }
    );
  }

  return group;
}

/** Page title and a generated monogram favicon in the brand palette. */
export function applyBrandDocument(): void {
  if (typeof document === 'undefined') return;
  document.title = `${BRAND_NAME} — A WebXR Reading Room`;

  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const context = canvas.getContext('2d');
  if (context) {
    context.fillStyle = '#241610';
    context.fillRect(0, 0, 64, 64);
    context.strokeStyle = '#b08d57';
    context.lineWidth = 4;
    context.strokeRect(3, 3, 58, 58);
    context.fillStyle = '#e8dcc0';
    context.font = `bold 40px ${FONTS.serif}`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText('M', 32, 35);
  }
  const link = document.createElement('link');
  link.rel = 'icon';
  link.href = canvas.toDataURL('image/png');
  document.head.appendChild(link);
}
