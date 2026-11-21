/**
 * Generates poster-style event covers into public/covers/*.webp.
 *
 * Why generated: the demo must work offline and without licensing questions.
 * Each event gets its own composition so the catalog never looks like a wall of
 * identical cards. Deterministic: the same key always produces the same image.
 *
 *   npm run covers
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { EVENTS, PALETTES, type CoverStyle, type Palette } from "../prisma/seed-data";

const W = 1600;
const H = 1000;

function rng(seedText: string) {
  let seed = 0;
  for (const ch of seedText) seed = (Math.imul(seed ^ ch.charCodeAt(0), 2654435761) >>> 0) + 1;
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Draw = (p: Palette, r: () => number) => string;
const between = (r: () => number, min: number, max: number) => min + r() * (max - min);

const styles: Record<CoverStyle, Draw> = {
  rings: (p, r) => {
    const cx = between(r, 950, 1250);
    const cy = between(r, 380, 620);
    let out = "";
    for (let i = 14; i > 0; i--)
      out += `<circle cx="${cx}" cy="${cy}" r="${i * 58}" fill="${i % 2 ? p.a : p.bg}" opacity="${i % 2 ? 0.92 : 1}"/>`;
    out += `<circle cx="${cx}" cy="${cy}" r="70" fill="${p.b}"/>`;
    out += `<rect x="0" y="${H - 180}" width="${W}" height="180" fill="${p.c}"/>`;
    return out;
  },
  sunburst: (p, r) => {
    const cx = between(r, 500, 1100);
    const cy = H + 80;
    let out = "";
    const rays = 22;
    for (let i = 0; i < rays; i++) {
      const a0 = Math.PI + (i / rays) * Math.PI;
      const a1 = Math.PI + ((i + 0.5) / rays) * Math.PI;
      const R = 2200;
      out += `<path d="M${cx} ${cy} L${cx + R * Math.cos(a0)} ${cy + R * Math.sin(a0)} L${cx + R * Math.cos(a1)} ${cy + R * Math.sin(a1)} Z" fill="${p.b}" opacity="0.28"/>`;
    }
    out += `<circle cx="${cx}" cy="${cy}" r="420" fill="${p.a}"/>`;
    out += `<circle cx="${cx}" cy="${cy}" r="300" fill="${p.c}"/>`;
    out += `<circle cx="${between(r, 200, 1400)}" cy="${between(r, 120, 260)}" r="46" fill="${p.a}"/>`;
    return out;
  },
  arches: (p, r) => {
    let out = "";
    const n = 5;
    const w = W / n;
    for (let i = 0; i < n; i++) {
      const x = i * w;
      const h = between(r, 560, 860);
      const color = [p.a, p.c, p.b][i % 3];
      out += `<path d="M${x + 24} ${H} V${H - h + w / 2} A${w / 2 - 24} ${w / 2 - 24} 0 0 1 ${x + w - 24} ${H - h + w / 2} V${H} Z" fill="${color}" opacity="${i % 3 === 2 ? 0.85 : 1}"/>`;
    }
    out += `<circle cx="${between(r, 300, 1300)}" cy="170" r="64" fill="${p.b}"/>`;
    return out;
  },
  halftone: (p, r) => {
    let out = "";
    const cx = between(r, 1000, 1300);
    const cy = between(r, 350, 650);
    for (let y = 20; y < H; y += 44) {
      for (let x = 20; x < W; x += 44) {
        const rad = Math.max(0, 19 - Math.hypot(x - cx, y - cy) / 40);
        if (rad > 0.6) out += `<circle cx="${x}" cy="${y}" r="${rad.toFixed(1)}" fill="${p.a}"/>`;
      }
    }
    out += `<rect x="120" y="${H - 300}" width="40" height="300" fill="${p.a}"/>`;
    out += `<circle cx="140" cy="${H - 330}" r="70" fill="${p.a}"/>`;
    out += `<circle cx="140" cy="${H - 330}" r="44" fill="${p.c}"/>`;
    return out;
  },
  grid: (p, r) => {
    let out = "";
    for (let x = 0; x <= W; x += 80)
      out += `<line x1="${x}" y1="0" x2="${x}" y2="${H}" stroke="${p.a}" stroke-opacity="0.16" stroke-width="2"/>`;
    for (let y = 0; y <= H; y += 80)
      out += `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="${p.a}" stroke-opacity="0.16" stroke-width="2"/>`;
    const nodes = Array.from(
      { length: 9 },
      () => [Math.round(between(r, 4, 19)) * 80, Math.round(between(r, 1, 11)) * 80] as const,
    );
    for (let i = 1; i < nodes.length; i++) {
      const [x0, y0] = nodes[i - 1]!;
      const [x1, y1] = nodes[i]!;
      out += `<path d="M${x0} ${y0} H${x1} V${y1}" fill="none" stroke="${p.a}" stroke-width="6"/>`;
    }
    for (const [i, [x, y]] of nodes.entries()) {
      out +=
        i % 3 === 0
          ? `<rect x="${x - 44}" y="${y - 44}" width="88" height="88" fill="${p.b}"/>`
          : `<circle cx="${x}" cy="${y}" r="22" fill="${p.a}"/>`;
    }
    return out;
  },
  stripes: (p, r) => {
    let out = `<g transform="rotate(${between(r, -28, -18)} ${W / 2} ${H / 2})">`;
    for (let i = -6; i < 16; i++) {
      out += `<rect x="-400" y="${i * 120}" width="${W + 800}" height="${i % 3 === 0 ? 70 : 26}" fill="${i % 3 === 0 ? p.a : p.b}" opacity="${i % 3 === 0 ? 1 : 0.55}"/>`;
    }
    out += "</g>";
    out += `<circle cx="${between(r, 1050, 1350)}" cy="${between(r, 300, 500)}" r="190" fill="${p.c}"/>`;
    return out;
  },
  bauhaus: (p, r) => {
    const s = 250;
    let out = "";
    const cells = [p.a, p.b, p.c, p.bg, p.a, p.c, p.b, p.a];
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 7; col++) {
        const x = col * s - 50;
        const y = row * s;
        const color = cells[Math.floor(r() * cells.length)]!;
        const kind = Math.floor(r() * 4);
        if (kind === 0)
          out += `<rect x="${x}" y="${y}" width="${s}" height="${s}" fill="${color}"/>`;
        if (kind === 1)
          out += `<path d="M${x} ${y + s} A${s} ${s} 0 0 1 ${x + s} ${y} V${y + s} Z" fill="${color}"/>`;
        if (kind === 2)
          out += `<circle cx="${x + s / 2}" cy="${y + s / 2}" r="${s / 2 - 10}" fill="${color}"/>`;
        if (kind === 3)
          out += `<path d="M${x} ${y + s} L${x + s / 2} ${y} L${x + s} ${y + s} Z" fill="${color}"/>`;
      }
    }
    return out;
  },
  waves: (p, r) => {
    let out = "";
    const amp = between(r, 30, 60);
    const freq = between(r, 0.004, 0.007);
    for (let i = 0; i < 22; i++) {
      const y0 = 60 + i * 46;
      let d = `M0 ${y0}`;
      for (let x = 0; x <= W; x += 20)
        d += ` L${x} ${(y0 + Math.sin(x * freq + i * 0.45) * amp * (0.4 + i / 22)).toFixed(1)}`;
      out += `<path d="${d}" fill="none" stroke="${i % 5 === 2 ? p.b : p.a}" stroke-width="${i % 5 === 2 ? 10 : 4}" stroke-linecap="round" opacity="${i % 5 === 2 ? 1 : 0.7}"/>`;
    }
    out += `<circle cx="${between(r, 1100, 1400)}" cy="${between(r, 160, 300)}" r="110" fill="${p.b}"/>`;
    return out;
  },
  confetti: (p, r) => {
    let out = "";
    const colors = [p.a, p.b, p.c];
    for (let i = 0; i < 70; i++) {
      const x = between(r, 0, W);
      const y = between(r, 0, H);
      const c = colors[i % 3]!;
      const rot = between(r, 0, 360);
      const k = i % 4;
      if (k === 0) out += `<circle cx="${x}" cy="${y}" r="${between(r, 14, 40)}" fill="${c}"/>`;
      if (k === 1)
        out += `<rect x="${x}" y="${y}" width="${between(r, 30, 80)}" height="22" rx="11" fill="${c}" transform="rotate(${rot} ${x} ${y})"/>`;
      if (k === 2)
        out += `<path d="M${x} ${y} l40 0 l-20 -36 z" fill="${c}" transform="rotate(${rot} ${x} ${y})"/>`;
      if (k === 3)
        out += `<path d="M${x} ${y} q20 -30 40 0 t40 0" fill="none" stroke="${c}" stroke-width="10" stroke-linecap="round" transform="rotate(${rot} ${x} ${y})"/>`;
    }
    out += `<circle cx="${W * 0.68}" cy="${H * 0.5}" r="230" fill="${p.a}"/>`;
    out += `<circle cx="${W * 0.68 + 60}" cy="${H * 0.5 - 60}" r="70" fill="${p.bg}"/>`;
    return out;
  },
  orbit: (p, r) => {
    const cx = between(r, 1000, 1200);
    const cy = between(r, 420, 560);
    let out = "";
    for (let i = 1; i <= 6; i++) {
      out += `<ellipse cx="${cx}" cy="${cy}" rx="${170 + i * 95}" ry="${60 + i * 34}" fill="none" stroke="${p.a}" stroke-width="${i === 3 ? 6 : 2}" stroke-opacity="${i === 3 ? 1 : 0.5}" transform="rotate(-14 ${cx} ${cy})"/>`;
    }
    out += `<circle cx="${cx}" cy="${cy}" r="150" fill="${p.a}"/>`;
    out += `<circle cx="${cx - 50}" cy="${cy - 50}" r="150" fill="${p.bg}" opacity="0.35"/>`;
    for (let i = 0; i < 4; i++) {
      const a = between(r, 0, Math.PI * 2);
      out += `<circle cx="${cx + Math.cos(a) * (300 + i * 80)}" cy="${cy + Math.sin(a) * (110 + i * 30)}" r="${between(r, 10, 26)}" fill="${p.b}"/>`;
    }
    for (let i = 0; i < 120; i++)
      out += `<circle cx="${between(r, 0, W)}" cy="${between(r, 0, H)}" r="${between(r, 1, 3)}" fill="${p.b}" opacity="0.6"/>`;
    return out;
  },
  bars: (p, r) => {
    let out = "";
    const n = 28;
    const bw = W / n;
    for (let i = 0; i < n; i++) {
      const h = 120 + Math.abs(Math.sin(i * 0.55 + r() * 0.8)) * 620 + r() * 80;
      out += `<rect x="${i * bw + 8}" y="${H - h}" width="${bw - 16}" height="${h}" rx="${(bw - 16) / 2}" fill="${i % 7 === 3 ? p.b : p.a}"/>`;
    }
    out += `<rect x="0" y="0" width="${W}" height="10" fill="${p.a}"/>`;
    return out;
  },
  petals: (p, r) => {
    const cx = between(r, 1000, 1200);
    const cy = between(r, 450, 550);
    let out = "";
    const n = 12;
    for (let i = 0; i < n; i++) {
      out += `<ellipse cx="${cx}" cy="${cy - 220}" rx="70" ry="220" fill="${i % 2 ? p.a : p.b}" opacity="${i % 2 ? 0.95 : 0.7}" transform="rotate(${(360 / n) * i} ${cx} ${cy})"/>`;
    }
    out += `<circle cx="${cx}" cy="${cy}" r="90" fill="${p.c}"/>`;
    out += `<circle cx="${cx}" cy="${cy}" r="40" fill="${p.a}"/>`;
    return out;
  },
};

function svgFor(key: string, style: CoverStyle, palette: Palette) {
  const r = rng(key);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <filter id="grain" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/>
      <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.22 0"/>
    </filter>
    <linearGradient id="shade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0.45" stop-color="#000" stop-opacity="0"/>
      <stop offset="1" stop-color="#000" stop-opacity="0.28"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="${palette.bg}"/>
  ${styles[style](palette, r)}
  <rect width="${W}" height="${H}" fill="url(#shade)"/>
  <rect width="${W}" height="${H}" filter="url(#grain)"/>
</svg>`;
}

async function main() {
  const outDir = path.join(process.cwd(), "public", "covers");
  await mkdir(outDir, { recursive: true });
  for (const event of EVENTS) {
    const svg = svgFor(event.key, event.cover.style, PALETTES[event.cover.palette]);
    const buf = await sharp(Buffer.from(svg)).webp({ quality: 82 }).toBuffer();
    await writeFile(path.join(outDir, `${event.key}.webp`), buf);
    console.log(`✓ ${event.key}.webp (${(buf.length / 1024).toFixed(0)} KB)`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
