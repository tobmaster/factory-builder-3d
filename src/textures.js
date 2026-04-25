import * as THREE from 'three';

function textureFromCanvas(canvas, repeatX = 1, repeatY = 1) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeatX, repeatY);
  texture.anisotropy = 8;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function rand(seed) {
  let value = seed;
  return () => {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
}

function makeCanvas(seed, base, accent, detail) {
  const r = rand(seed);
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 3800; i++) {
    const v = Math.floor(100 + r() * 95);
    ctx.fillStyle = `rgba(${v},${v},${v},${0.025 + r() * 0.06})`;
    ctx.fillRect(r() * 512, r() * 512, 1 + r() * 2, 1 + r() * 2);
  }

  for (let i = 0; i < 34; i++) {
    ctx.strokeStyle = accent;
    ctx.globalAlpha = 0.05 + r() * 0.08;
    ctx.lineWidth = 1 + r() * 3;
    ctx.beginPath();
    let x = r() * 512;
    let y = r() * 512;
    ctx.moveTo(x, y);
    for (let j = 0; j < 5; j++) {
      x += (r() - 0.5) * 120;
      y += (r() - 0.5) * 120;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  for (let i = 0; i < 12; i++) {
    ctx.fillStyle = detail;
    ctx.globalAlpha = 0.05 + r() * 0.08;
    ctx.beginPath();
    ctx.ellipse(r() * 512, r() * 512, 16 + r() * 60, 8 + r() * 34, r() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = 1;
  return c;
}

export function createFactoryTextures() {
  return {
    concrete: textureFromCanvas(makeCanvas(11, '#aeb4bd', '#111827', '#334155'), 8, 8),
    wall: textureFromCanvas(makeCanvas(22, '#d6d3d1', '#78716c', '#a8a29e'), 4, 2),
    metal: textureFromCanvas(makeCanvas(33, '#64748b', '#1f2937', '#cbd5e1'), 3, 3),
    belt: textureFromCanvas(makeCanvas(44, '#111827', '#020617', '#475569'), 6, 1),
    glass: textureFromCanvas(makeCanvas(55, '#93c5fd', '#dbeafe', '#60a5fa'), 2, 1)
  };
}
