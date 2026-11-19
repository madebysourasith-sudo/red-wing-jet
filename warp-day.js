// Warp day carousel: a ring of cards turning in 3D, the side cards flaring through a wide lens with colour fringes,
// mirrored backs on the far side, a colour-matched glow above and below the card in front. After Louis Studios'
// "Warp Carousel" (21st.dev), rebuilt for the Red Wing "A day at 15,000 m" section, driven by scroll.
// mountWarp(host, items, { bg }) -> { set(f) }   f = continuous card index (0 .. items.length - 1)
import * as THREE from 'three';

const loadImg = src => new Promise(res => { const i = new Image(); i.decoding = 'async'; i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });

function cardCanvas(it, img, W, H) {
  const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
  const ink = '#1e1618', red = '#c8102e';
  if (img) {
    const s = Math.max(W / img.width, H / img.height), w = img.width * s, h = img.height * s;
    g.drawImage(img, (W - w) / 2, (H - h) / 2, w, h);
    const gr = g.createLinearGradient(0, H * 0.5, 0, H); gr.addColorStop(0, 'rgba(14,10,11,0)'); gr.addColorStop(1, 'rgba(14,10,11,.78)');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    const gt = g.createLinearGradient(0, 0, 0, H * 0.22); gt.addColorStop(0, 'rgba(14,10,11,.35)'); gt.addColorStop(1, 'rgba(14,10,11,0)'); g.fillStyle = gt; g.fillRect(0, 0, W, H * 0.22);
    g.fillStyle = 'rgba(255,255,255,.86)'; g.font = `500 ${W * 0.034}px ui-monospace, Menlo, monospace`; g.textBaseline = 'top';
    g.fillText('IN FLIGHT', W * 0.07, H * 0.055);
    g.fillStyle = '#fff'; g.font = `700 ${W * 0.2}px Switzer, sans-serif`; g.textBaseline = 'alphabetic';
    g.letterSpacing = `${-W * 0.01}px`; g.fillText(it.t, W * 0.065, H * 0.77); g.letterSpacing = '0px';
    g.font = `500 ${W * 0.06}px Switzer, sans-serif`; g.fillText(it.h, W * 0.07, H * 0.865);
    g.fillStyle = 'rgba(255,255,255,.72)'; g.font = `400 ${W * 0.042}px Switzer, sans-serif`; g.fillText(it.l, W * 0.07, H * 0.925);
  } else if (it.fig) {
    const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#ffffff'); gr.addColorStop(1, '#ece8e1'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    g.fillStyle = red; g.font = `500 ${W * 0.034}px ui-monospace, Menlo, monospace`; g.textBaseline = 'top'; g.fillText(it.t + '  ·  CABIN ALTITUDE', W * 0.07, H * 0.055);
    g.fillStyle = ink; g.font = `700 ${W * 0.25}px Switzer, sans-serif`; g.textBaseline = 'alphabetic'; g.letterSpacing = `${-W * 0.013}px`;
    g.fillText('1,800', W * 0.06, H * 0.62); g.fillText('m', W * 0.06, H * 0.8); g.letterSpacing = '0px';
    g.fillStyle = 'rgba(30,22,24,.65)'; g.font = `400 ${W * 0.045}px Switzer, sans-serif`;
    g.fillText('Held the whole flight. Lower than most', W * 0.07, H * 0.88); g.fillText('airliners, so you land rested.', W * 0.07, H * 0.935);
  } else {
    const gr = g.createLinearGradient(0, 0, W, H); gr.addColorStop(0, '#d8142f'); gr.addColorStop(1, '#a40c25'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    g.fillStyle = 'rgba(255,255,255,.8)'; g.font = `500 ${W * 0.034}px ui-monospace, Menlo, monospace`; g.textBaseline = 'top'; g.fillText('11:30  ·  DWC', W * 0.07, H * 0.055);
    g.fillStyle = '#fff'; g.font = `700 ${W * 0.15}px Switzer, sans-serif`; g.textBaseline = 'alphabetic'; g.letterSpacing = `${-W * 0.008}px`;
    g.fillText('Wheels', W * 0.065, H * 0.6); g.fillText('down in', W * 0.065, H * 0.73); g.fillText('Dubai.', W * 0.065, H * 0.86); g.letterSpacing = '0px';
    g.fillStyle = 'rgba(255,255,255,.8)'; g.font = `400 ${W * 0.045}px Switzer, sans-serif`; g.fillText('Your day aboard starts with one call.', W * 0.07, H * 0.935);
  }
  return c;
}

const avgColour = cv => { const s = document.createElement('canvas'); s.width = s.height = 8; const g = s.getContext('2d'); g.drawImage(cv, 0, 0, 8, 8);
  const d = g.getImageData(0, 0, 8, 8).data; let r = 0, gg = 0, b = 0; for (let i = 0; i < d.length; i += 4) { r += d[i]; gg += d[i + 1]; b += d[i + 2]; } const n = d.length / 4;
  const c = new THREE.Color(r / n / 255, gg / n / 255, b / n / 255); const hsl = {}; c.getHSL(hsl); c.setHSL(hsl.h, Math.min(1, hsl.s * 1.6 + 0.15), 0.55); return c; };

export async function mountWarp(host, items, opts = {}) {
  const bg = new THREE.Color(opts.bg || '#f2f0eb');
  const canvas = document.createElement('canvas'); canvas.className = 'warp-cv'; host.appendChild(canvas);
  const glowT = document.createElement('div'), glowB = document.createElement('div'); glowT.className = 'warp-glow t'; glowB.className = 'warp-glow b'; host.append(glowT, glowB);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setClearColor(bg, 1); renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  const N = items.length, R = 3.1; let STEP = Math.PI / 7.2; const CWH = 0; const CW = 1, CH = 1.28;
  await (document.fonts ? Promise.all(['700 40px Switzer', '500 20px Switzer', '400 20px Switzer'].map(f => document.fonts.load(f).catch(() => {}))) : null);
  const imgs = await Promise.all(items.map(it => it.img ? loadImg(it.img) : null));
  const geo = new THREE.PlaneGeometry(CW, CH, 1, 1);
  const cards = [], cols = [];
  const ring = new THREE.Group(); scene.add(ring);
  items.forEach((it, i) => {
    const cv = cardCanvas(it, imgs[i], 900, 1152), tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8; tex.generateMipmaps = true; tex.minFilter = THREE.LinearMipmapLinearFilter;
    cols.push(avgColour(cv));
    const mat = new THREE.ShaderMaterial({
      uniforms: { map: { value: tex }, uDim: { value: 0 }, uFade: { value: 1 }, uAsp: { value: CW / CH }, uRim: { value: cols[i] } },
      vertexShader: `varying vec2 vUv; varying vec3 vN; varying vec3 vV; void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position,1.0); vN = normalize(mat3(modelMatrix) * normal); vV = normalize(cameraPosition - w.xyz); gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: /* glsl */`uniform sampler2D map; uniform float uDim, uFade, uAsp; uniform vec3 uRim; varying vec2 vUv; varying vec3 vN; varying vec3 vV;
        float rr(vec2 p, vec2 b, float r){ vec2 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }
        void main(){
          vec2 p = (vUv - 0.5) * vec2(uAsp, 1.0);
          float d = rr(p, vec2(uAsp, 1.0) * 0.5, 0.045);
          float aa = fwidth(d); float a = 1.0 - smoothstep(-aa, aa, d);
          if (a < 0.01) discard;
          vec4 c = texture2D(map, vUv);
          float back = gl_FrontFacing ? 0.0 : 1.0;
          vec3 col = c.rgb * (1.0 - uDim * 0.35) * (1.0 - back * 0.25);
          float rim = smoothstep(-0.03, 0.0, d) * (0.35 + 0.65 * pow(1.0 - abs(dot(normalize(vN), vV)), 1.5));
          col = mix(col, uRim * 1.2 + 0.15, rim * 0.85);
          gl_FragColor = vec4(col, a * uFade);
          #include <colorspace_fragment>
        }`,
      side: THREE.DoubleSide, transparent: true, extensions: { derivatives: true },
    });
    const m = new THREE.Mesh(geo, mat); ring.add(m); cards.push(m);
  });
  // offscreen render, then the lens pass
  const rt = new THREE.WebGLRenderTarget(4, 4, { samples: 4, colorSpace: THREE.SRGBColorSpace });
  const post = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
    uniforms: { t: { value: rt.texture }, uAsp: { value: 1 }, uK: { value: 0.8 }, uCA: { value: 0.0045 }, uBg: { value: bg } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
    fragmentShader: /* glsl */`uniform sampler2D t; uniform float uAsp, uK, uCA; uniform vec3 uBg; varying vec2 vUv;
      vec2 lens(vec2 uv, float k){ vec2 p = uv * 2.0 - 1.0; float ax = pow(abs(p.x), 2.4);
        p.y /= 1.0 + k * ax;                 // the sides flare: content near the left/right edges is stretched tall
        p.x *= 1.0 - 0.10 * k * p.y * p.y;   // and pinched a little towards the middle at the top and bottom
        return p * 0.5 + 0.5; }
      vec3 tap(vec2 uv){ return (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) ? uBg : texture2D(t, uv).rgb; }
      void main(){
        float e = pow(abs(vUv.x * 2.0 - 1.0), 2.0);
        vec3 c;
        c.r = tap(lens(vUv, uK * (1.0 + uCA * 18.0 * e))).r;
        c.g = tap(lens(vUv, uK)).g;
        c.b = tap(lens(vUv, uK * (1.0 - uCA * 18.0 * e))).b;
        gl_FragColor = vec4(c, 1.0);
      }`,
    depthTest: false, depthWrite: false,
  }));
  const postScene = new THREE.Scene(), postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1); postScene.add(post);

  let W = 0, H = 0, f = 0, want = 0, alive = true;
  const size = () => { const r = host.getBoundingClientRect(), w = Math.max(2, Math.round(r.width)), h = Math.max(2, Math.round(r.height)); if (w === W && h === H) return;
    W = w; H = h; const dpr = Math.min(devicePixelRatio || 1, 2); renderer.setPixelRatio(dpr); renderer.setSize(W, H, false); rt.setSize(W * dpr, H * dpr);
    camera.aspect = W / H; const mob = W / H < 0.8; STEP = mob ? Math.PI / 9 : Math.PI / 7.2; camera.fov = mob ? 44 : 26; camera.position.set(0, 0, R + (mob ? 4.4 : 5.0)); camera.setViewOffset(W, H, 0, -H * (mob ? 0.04 : 0.06), W, H); camera.updateProjectionMatrix();
    post.material.uniforms.uK.value = mob ? 0.3 : 0.8; };
  const draw = () => {
    size();
    ring.rotation.y = -f * STEP;
    cards.forEach((m, i) => { const a = i * STEP; m.position.set(Math.sin(a) * R, 0, Math.cos(a) * R); m.rotation.y = a;
      const d = Math.abs(i - f); m.material.uniforms.uDim.value = Math.min(1, d); m.material.uniforms.uFade.value = 1 - Math.min(1, Math.max(0, (d - 1.25) / 0.5)); m.visible = d < 1.8; m.renderOrder = -Math.round(d * 10); });
    renderer.setRenderTarget(rt); renderer.render(scene, camera); renderer.setRenderTarget(null); renderer.render(postScene, postCam);
    // glows take the colour of the card in front, blended between neighbours
    const i0 = Math.floor(f), i1 = Math.min(N - 1, i0 + 1), k = f - i0, c = cols[Math.max(0, i0)].clone().lerp(cols[i1], k);
    const css = `rgb(${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)})`; glowT.style.background = glowB.style.background = `radial-gradient(closest-side, ${css}, transparent)`;
  };
  const loop = () => { if (!alive) return; if (Math.abs(want - f) > 1e-4 || !W) { f += (want - f) * 0.18; if (Math.abs(want - f) < 1e-4) f = want; draw(); } requestAnimationFrame(loop); };
  requestAnimationFrame(loop); draw();
  addEventListener('resize', () => { W = 0; draw(); });
  return { set(x) { want = x; }, draw, destroy() { alive = false; renderer.dispose(); } };
}
