import * as THREE from 'three';

/**
 * Builds the Maarify floor crest inlay — a circular brass-on-dark institutional
 * medallion at world origin, featuring the official Maarify brand logo and clean
 * 'MAARIFY' brass typography. Strictly no arbitrary symbols or Arabic text.
 *
 * Position: (0, 0.003, 0) — just above the floor to avoid z-fighting.
 * Rotation: −π/2 on X so the circle faces upward.
 * Name: 'hub-floor-crest-inlay'
 */
export function buildFloorInlay(): THREE.Mesh {
  // Circular geometry ensures no square border artifacts on the floor
  const geo = new THREE.CircleGeometry(0.85, 48);

  const isBrowser = typeof document !== 'undefined';
  let texture: THREE.Texture;

  if (isBrowser) {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;

    function renderMedallion(logoImg?: HTMLImageElement) {
      ctx.clearRect(0, 0, 1024, 1024);

      // Clip to circle so nothing spills outside
      ctx.save();
      ctx.beginPath();
      ctx.arc(512, 512, 500, 0, Math.PI * 2);
      ctx.clip();

      // Rich dark walnut/brass seal background
      const grad = ctx.createRadialGradient(512, 512, 100, 512, 512, 500);
      grad.addColorStop(0, '#221913');
      grad.addColorStop(0.75, '#15100c');
      grad.addColorStop(1, '#0d0a08');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1024, 1024);

      // Outer heavy brass ring
      ctx.strokeStyle = '#b08d57';
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.arc(512, 512, 480, 0, Math.PI * 2);
      ctx.stroke();

      // Inner thin brass accent ring
      ctx.strokeStyle = '#d9b877';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(512, 512, 452, 0, Math.PI * 2);
      ctx.stroke();

      // Second inner ring framing the logo
      ctx.strokeStyle = '#8c6d3b';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(512, 512, 340, 0, Math.PI * 2);
      ctx.stroke();

      // Subtle brass stud accents around the rim
      ctx.fillStyle = '#d9b877';
      for (let i = 0; i < 24; i++) {
        const angle = (i * Math.PI * 2) / 24;
        const sx = 512 + Math.cos(angle) * 466;
        const sy = 512 + Math.sin(angle) * 466;
        ctx.beginPath();
        ctx.arc(sx, sy, 5, 0, Math.PI * 2);
        ctx.fill();
      }

      // If official logo image is loaded, draw it prominently in the center
      if (logoImg && logoImg.complete && logoImg.naturalWidth > 0) {
        const logoSize = 420;
        ctx.drawImage(
          logoImg,
          512 - logoSize / 2,
          460 - logoSize / 2,
          logoSize,
          logoSize
        );
      } else {
        // High-fidelity brass 'M' monogram fallback until PNG loads
        ctx.fillStyle = '#d9b877';
        ctx.font = 'bold 220px Georgia, serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('M', 512, 440);
      }

      // "MAARIFY" institutional text in bold brass serif below the logo
      ctx.fillStyle = '#f5e0b8';
      ctx.font = 'bold 78px Georgia, "Times New Roman", serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.letterSpacing = '12px';
      ctx.fillText('MAARIFY', 512, 730);

      // Subtle brass separator line below text
      ctx.strokeStyle = '#b08d57';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(340, 785);
      ctx.lineTo(684, 785);
      ctx.stroke();

      ctx.restore();
    }

    renderMedallion();

    const canvasTexture = new THREE.CanvasTexture(canvas);
    canvasTexture.minFilter = THREE.LinearFilter;
    canvasTexture.magFilter = THREE.LinearFilter;
    texture = canvasTexture;

    // Load actual maarify-logo.png from assets/brand/
    const logoImg = new Image();
    logoImg.src = '/assets/brand/maarify-logo.png';
    logoImg.onload = () => {
      renderMedallion(logoImg);
      canvasTexture.needsUpdate = true;
    };
  } else {
    texture = new THREE.Texture();
  }

  const mat = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity: 0.96,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = 'hub-floor-crest-inlay';
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(0, 0.003, 0);

  return mesh;
}
