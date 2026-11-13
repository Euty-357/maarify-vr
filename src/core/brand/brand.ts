import * as THREE from 'three';
import { PALETTE, FONTS, standardMaterial } from '../design/tokens.js';

export const BRAND_NAME = 'Maarify';
export const BRAND_LOGO_URL = '/assets/brand/maarify-logo.png';

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
    wCtx.strokeStyle="#b08d57";wCtx.lineWidth=2;
    wCtx.beginPath();wCtx.moveTo(24,58);wCtx.lineTo(744,58);wCtx.stroke();
    wCtx.beginPath();wCtx.moveTo(24,186);wCtx.lineTo(744,186);wCtx.stroke();
    const dc=(cx:number,cy:number,sx:number,sy:number)=>{wCtx.save();wCtx.translate(cx,cy);wCtx.scale(sx,sy);wCtx.strokeStyle="#b08d57";wCtx.lineWidth=2;wCtx.beginPath();wCtx.arc(0,0,18,0,Math.PI/2);wCtx.stroke();wCtx.beginPath();wCtx.arc(0,0,10,0,Math.PI/2);wCtx.stroke();wCtx.restore();};
    dc(28,62,1,1);dc(740,62,-1,1);dc(28,182,1,-1);dc(740,182,-1,-1);
    wCtx.fillStyle="#e8dcc0";
    wCtx.font="bold 92px "+FONTS.serif;
    wCtx.fillText("M",32,172);
    wCtx.font="bold 72px "+FONTS.serif;
    wCtx.fillText("AARIFY",118,168);
    wCtx.fillStyle="#b08d57";wCtx.font="18px "+FONTS.serif;wCtx.textAlign="center";
    wCtx.fillText("A SPATIAL LEARNING EXPERIENCE",384,210);
    const wTex=new THREE.CanvasTexture(wCanvas);wTex.minFilter=THREE.LinearFilter;
    wordmark=new THREE.Mesh(new THREE.PlaneGeometry(widthMeters*0.92,heightMeters*0.7),new THREE.MeshBasicMaterial({map:wTex,transparent:true,side:THREE.DoubleSide}));
  } else {
    wordmark=new THREE.Mesh(new THREE.PlaneGeometry(widthMeters*0.9,heightMeters*0.62),new THREE.MeshBasicMaterial({color:0xe8dcc0}));
  }
  wordmark.position.z=0.032;
  group.add(wordmark);

  // Headless tests and software rendering skip the full-size texture; the serif
  // wordmark is used there. The device loads the real logo.
  const isAutomated = typeof navigator !== 'undefined' && navigator.webdriver === true;
  if (!isAutomated && typeof document !== 'undefined' && typeof Image !== 'undefined') {
    new THREE.TextureLoader().load(
      BRAND_LOGO_URL,
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        const image = texture.image as { width?: number; height?: number } | undefined;
        const aspect = image?.width && image?.height ? image.width / image.height : 1;
        const logoWidth = widthMeters * 0.86;
        const logo = new THREE.Mesh(
          new THREE.PlaneGeometry(logoWidth, logoWidth / aspect),
          new THREE.MeshBasicMaterial({ map: texture, transparent: true })
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
