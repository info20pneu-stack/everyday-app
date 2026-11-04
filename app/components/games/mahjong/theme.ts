import { mulberry } from '../../../../lib/games/mahjong';
import type { SkinId, TableId } from '../../../../lib/games/mahjongI18n';

/* Looks of Mahjong: table textures (drawn once on a canvas in the browser), the medallion
   ornament and the colour variables of tables and tile skins. Ported from games-reference/mahjong. */

export const SKIN_IDS: SkinId[] = ['porcelan', 'slonovina', 'med', 'nefrit', 'kral', 'noc'];
export const TABLE_IDS: TableId[] = ['more', 'platno', 'chram', 'zahrada', 'ruze', 'nefrit', 'noc'];

function grain(ctx: CanvasRenderingContext2D, w: number, h: number, amt: number, r: () => number) {
  const img = ctx.getImageData(0, 0, w, h), d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (r() - 0.5) * amt;
    if (d[i + 3] === 0) { d[i] = n > 0 ? 255 : 0; d[i + 1] = d[i]; d[i + 2] = d[i]; d[i + 3] = Math.abs(n) * 1.6; }
    else { d[i] += n; d[i + 1] += n; d[i + 2] += n; }
  }
  ctx.putImageData(img, 0, 0);
}

function makeTexture(id: TableId): { url: string; w: number; h: number } {
  const r = mulberry(id.length * 977 + 13);
  let W = 256, H = 256, gr = 8;
  let draw: (ctx: CanvasRenderingContext2D) => void;
  if (id === 'more') {
    W = 192; H = 96; gr = 8;
    draw = ctx => {
      ctx.fillStyle = '#1874C4'; ctx.fillRect(0, 0, W, H);
      const R = 24;
      for (let row = -2; row <= H / 12 + 2; row++) {
        const y = row * 12, off = row % 2 !== 0 ? R : 0;
        for (let x = -2 * R; x <= W + 2 * R; x += 2 * R) {
          const cx = x + off;
          ctx.beginPath(); ctx.arc(cx, y, R, Math.PI, 0); ctx.lineTo(cx + R, y + R); ctx.lineTo(cx - R, y + R); ctx.closePath();
          const g = ctx.createLinearGradient(0, y - R, 0, y + 4); g.addColorStop(0, '#2A93E3'); g.addColorStop(1, '#1670BF');
          ctx.fillStyle = g; ctx.fill();
          [1, 0.78, 0.56, 0.34].forEach((f, i) => { ctx.beginPath(); ctx.arc(cx, y, R * f, Math.PI, 0); ctx.strokeStyle = `rgba(255,255,255,${i === 0 ? 0.16 : 0.09})`; ctx.lineWidth = i === 0 ? 1.6 : 1.2; ctx.stroke(); });
        }
      }
    };
  } else if (id === 'platno') {
    W = H = 180; gr = 22;
    draw = ctx => {
      ctx.fillStyle = '#13853F'; ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 900; i++) {
        const x = r() * W, y = r() * H, a = r() * Math.PI, l = 2 + r() * 5;
        ctx.strokeStyle = r() < 0.5 ? 'rgba(255,255,255,.035)' : 'rgba(0,0,0,.05)'; ctx.lineWidth = 0.6;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); ctx.stroke();
      }
    };
  } else if (id === 'chram') {
    W = H = 160; gr = 12;
    draw = ctx => {
      const s = 40, rad = s / Math.SQRT2;
      ctx.strokeStyle = 'rgba(120,72,0,.20)'; ctx.lineWidth = 1.3;
      for (let i = -1; i <= W / s + 1; i++) for (let j = -1; j <= H / s + 1; j++) { ctx.beginPath(); ctx.arc(i * s, j * s, rad, 0, Math.PI * 2); ctx.stroke(); }
      ctx.fillStyle = 'rgba(255,244,210,.35)';
      for (let i = 0; i <= W / s; i++) for (let j = 0; j <= H / s; j++) {
        ctx.beginPath(); ctx.arc(i * s + s / 2, j * s + s / 2, 1.6, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(i * s, j * s, 2.2, 0, Math.PI * 2); ctx.fill();
      }
    };
  } else if (id === 'zahrada') {
    W = H = 220; gr = 10;
    draw = ctx => {
      for (let k = 0; k < 11; k++) {
        const bx = r() * W, by = r() * H, sz = 5 + r() * 9, rot = r() * Math.PI;
        for (let ox = -W; ox <= W; ox += W) for (let oy = -H; oy <= H; oy += H) {
          const x = bx + ox, y = by + oy;
          if (x < -30 || x > W + 30 || y < -30 || y > H + 30) continue;
          ctx.fillStyle = 'rgba(255,235,255,.075)';
          for (let p = 0; p < 5; p++) { const a = rot + p * Math.PI * 2 / 5; ctx.beginPath(); ctx.ellipse(x + Math.cos(a) * sz * 0.62, y + Math.sin(a) * sz * 0.62, sz * 0.5, sz * 0.38, a, 0, Math.PI * 2); ctx.fill(); }
          ctx.fillStyle = 'rgba(255,220,140,.16)'; ctx.beginPath(); ctx.arc(x, y, sz * 0.2, 0, Math.PI * 2); ctx.fill();
        }
      }
    };
  } else if (id === 'ruze') {
    W = H = 72; gr = 10;
    draw = ctx => {
      ctx.strokeStyle = 'rgba(255,255,255,.07)'; ctx.lineWidth = 1;
      for (let k = -H; k <= W + H; k += 36) {
        ctx.beginPath(); ctx.moveTo(k, 0); ctx.lineTo(k + H, H); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(k, H); ctx.lineTo(k + H, 0); ctx.stroke();
      }
      ctx.fillStyle = 'rgba(255,230,240,.10)';
      [[0, 0], [36, 36], [72, 0], [0, 72], [72, 72]].forEach(p => {
        for (let q = 0; q < 4; q++) { const a = q * Math.PI / 2; ctx.beginPath(); ctx.arc(p[0] + Math.cos(a) * 4, p[1] + Math.sin(a) * 4, 3, 0, Math.PI * 2); ctx.fill(); }
      });
    };
  } else if (id === 'nefrit') {
    W = H = 64; gr = 10;
    draw = ctx => {
      ctx.strokeStyle = 'rgba(190,255,225,.07)'; ctx.lineWidth = 1.4; ctx.lineCap = 'square';
      for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
        const x = i * 32, y = j * 32;
        ctx.beginPath(); ctx.moveTo(x + 4, y + 4); ctx.lineTo(x + 28, y + 4); ctx.lineTo(x + 28, y + 28); ctx.lineTo(x + 8, y + 28); ctx.lineTo(x + 8, y + 8); ctx.lineTo(x + 24, y + 8);
        ctx.lineTo(x + 24, y + 24); ctx.lineTo(x + 12, y + 24); ctx.lineTo(x + 12, y + 12); ctx.lineTo(x + 20, y + 12); ctx.lineTo(x + 20, y + 20); ctx.lineTo(x + 16, y + 20); ctx.stroke();
      }
    };
  } else {
    draw = ctx => {
      for (let k = 0; k < 110; k++) {
        const x = r() * W, y = r() * H, s = r();
        ctx.fillStyle = r() < 0.18 ? `rgba(240,200,120,${0.3 + s * 0.6})` : `rgba(255,255,255,${0.15 + s * 0.6})`;
        ctx.beginPath(); ctx.arc(x, y, 0.35 + s * 1.1, 0, Math.PI * 2); ctx.fill();
      }
      ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 0.5;
      [[40, 60], [190, 170]].forEach(p => { ctx.beginPath(); ctx.moveTo(p[0] - 4, p[1]); ctx.lineTo(p[0] + 4, p[1]); ctx.moveTo(p[0], p[1] - 4); ctx.lineTo(p[0], p[1] + 4); ctx.stroke(); });
    };
  }
  const c = document.createElement('canvas'), DPR = 2;
  c.width = W * DPR; c.height = H * DPR;
  const ctx = c.getContext('2d')!;
  ctx.scale(DPR, DPR);
  draw(ctx);
  try { grain(ctx, c.width, c.height, gr, r); } catch {}
  return { url: c.toDataURL('image/png'), w: W, h: H };
}

/** Adds the table textures as CSS once per page. */
export function installTextures() {
  if (typeof document === 'undefined' || document.getElementById('mj-textures')) return;
  let css = '';
  TABLE_IDS.forEach(id => {
    try {
      const t = makeTexture(id);
      css += `.mj [data-table="${id}"], .mj[data-table="${id}"] { --board-pattern: url(${t.url}) 0 0/${t.w}px ${t.h}px repeat; }\n`;
    } catch {}
  });
  const st = document.createElement('style');
  st.id = 'mj-textures';
  st.textContent = css;
  document.head.appendChild(st);
}

/** The medallion in the middle of every table (static markup). */
export function ornamentSvg(): string {
  let petals = '', dots = '', fret = '';
  for (let i = 0; i < 16; i++) petals += `<ellipse cx="0" cy="-47" rx="6.5" ry="25" transform="rotate(${i * 22.5})" fill="none" stroke="currentColor" stroke-width=".9"/>`;
  for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; dots += `<circle cx="${(Math.cos(a) * 30).toFixed(2)}" cy="${(Math.sin(a) * 30).toFixed(2)}" r="1.6" fill="currentColor"/>`; }
  for (let i = 0; i < 48; i++) fret += `<path d="M-2.6 -88.6h5.2v5.2h-3.4v-3.4h1.6" transform="rotate(${i * 7.5})" fill="none" stroke="currentColor" stroke-width=".8"/>`;
  return '<svg class="mj-ornament" viewBox="-100 -100 200 200" aria-hidden="true">'
    + '<circle r="97" fill="none" stroke="currentColor" stroke-width=".7"/><circle r="94" fill="none" stroke="currentColor" stroke-width="2.6"/>'
    + `<circle r="91" fill="none" stroke="currentColor" stroke-width=".6"/>${fret}<circle r="81.5" fill="none" stroke="currentColor" stroke-width=".6"/>`
    + `<circle r="77" fill="none" stroke="currentColor" stroke-width="1.4"/>${petals}`
    + `<circle r="21" fill="none" stroke="currentColor" stroke-width="1.6"/><circle r="13" fill="none" stroke="currentColor" stroke-width=".8"/>${dots}`
    + '<circle r="4" fill="currentColor"/></svg>';
}
export const ORNAMENT = ornamentSvg();
