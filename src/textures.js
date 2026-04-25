import * as THREE from 'three';

function textureFromCanvas(canvas, repeatX = 1, repeatY = 1) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeatX, repeatY);
  texture.anisotropy = 8;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function rand(seed) {
  let value = seed;
  return () => {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
}

function makeCanvas(seed, base, accent, detail, mode = 'noise') {
  const r = rand(seed);
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 512, 512);

  if (mode === 'concrete') {
    ctx.strokeStyle = 'rgba(20,20,20,.32)';
    ctx.lineWidth = 3;
    for (let i = 0; i <= 512; i += 128) {
      ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,512); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(512,i); ctx.stroke();
    }
  }

  if (mode === 'belt') {
    ctx.strokeStyle = 'rgba(255,255,255,.18)';
    ctx.lineWidth = 8;
    for (let y = -512; y < 1024; y += 52) {
      ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(512,y+180); ctx.stroke();
    }
  }

  if (mode === 'wall') {
    ctx.strokeStyle = 'rgba(70,70,70,.35)';
    ctx.lineWidth = 4;
    for (let x = 0; x <= 512; x += 128) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,512); ctx.stroke(); }
    for (let y = 0; y <= 512; y += 96) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(512,y); ctx.stroke(); }
  }

  if (mode === 'metal') {
    for (let y = 0; y < 512; y += 10) {
      ctx.fillStyle = `rgba(255,255,255,${0.05 + r() * 0.08})`;
      ctx.fillRect(0, y, 512, 2);
    }
  }

  for (let i = 0; i < 7500; i++) {
    const v = Math.floor(60 + r() * 170);
    ctx.fillStyle = `rgba(${v},${v},${v},${0.05 + r() * 0.12})`;
    ctx.fillRect(r() * 512, r() * 512, 1 + r() * 3, 1 + r() * 3);
  }

  for (let i = 0; i < 60; i++) {
    ctx.strokeStyle = accent;
    ctx.globalAlpha = 0.12 + r() * 0.18;
    ctx.lineWidth = 1 + r() * 5;
    ctx.beginPath();
    let x = r() * 512, y = r() * 512;
    ctx.moveTo(x, y);
    for (let j = 0; j < 4; j++) {
      x += (r() - 0.5) * 140;
      y += (r() - 0.5) * 140;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  for (let i = 0; i < 28; i++) {
    ctx.fillStyle = detail;
    ctx.globalAlpha = 0.08 + r() * 0.16;
    ctx.beginPath();
    ctx.ellipse(r() * 512, r() * 512, 18 + r() * 70, 10 + r() * 44, r() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = 1;
  return c;
}

export function createFactoryTextures() {
  return {
    concrete: textureFromCanvas(makeCanvas(11, '#9ca3af', '#111827', '#334155', 'concrete'), 5, 5),
    wall: textureFromCanvas(makeCanvas(22, '#c9c1b8', '#57534e', '#78716c', 'wall'), 3, 2),
    metal: textureFromCanvas(makeCanvas(33, '#64748b', '#0f172a', '#cbd5e1', 'metal'), 3, 3),
    belt: textureFromCanvas(makeCanvas(44, '#050609', '#000000', '#475569', 'belt'), 4, 1),
    glass: textureFromCanvas(makeCanvas(55, '#93c5fd', '#dbeafe', '#60a5fa', 'noise'), 2, 1)
  };
}
