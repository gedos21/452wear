// "452" rakam dış hatlarını üretir (src/components/home/intro/glyphs-452.ts
// için kaynak). Çalıştırmak: npm i --no-save polygon-clipping@0.15 &&
// node scripts/glyphs-452.gen.mjs → glyphs.json + preview.svg üretir.

import pc from "polygon-clipping";
import fs from "node:fs";

// Kübik Bezier örnekleme
const bez = (p0, p1, p2, p3, t) => {
  const u = 1 - t;
  return [0, 1].map(i => u*u*u*p0[i] + 3*u*u*t*p1[i] + 3*u*t*t*p2[i] + t*t*t*p3[i]);
};
// Çok parçalı yol: [p0, c1, c2, p1, c1, c2, p2 ...]
function samplePath(pts, n = 40) {
  const out = [];
  for (let s = 0; s + 3 < pts.length; s += 3)
    for (let i = s === 0 ? 0 : 1; i <= n; i++) out.push(bez(pts[s], pts[s+1], pts[s+2], pts[s+3], i / n));
  return out;
}
// Bıçak: merkez çizgisi + genişlik profili → kapalı çokgen
function blade(pts, W, { a = 0, b = 0, pow = 0.55, zone = 0.5, round = "" } = {}) {
  // a/b: başlangıç/bitişte kalan genişlik oranı (0 = sivri uç)
  const c = samplePath(pts);
  const L = [], R = [];
  const len = [0];
  for (let i = 1; i < c.length; i++) len.push(len[i-1] + Math.hypot(c[i][0]-c[i-1][0], c[i][1]-c[i-1][1]));
  const T = len.at(-1);
  for (let i = 0; i < c.length; i++) {
    const t = len[i] / T;
    const p = c[Math.max(0, i-1)], q = c[Math.min(c.length-1, i+1)];
    let nx = -(q[1]-p[1]), ny = q[0]-p[0]; const nl = Math.hypot(nx, ny) || 1; nx/=nl; ny/=nl;
    // uçlara doğru daralan profil
    const za = a < 0.5 ? zone : 0.15, zb = b < 0.5 ? zone : 0.15;
    const up = Math.min(1, t / za), down = Math.min(1, (1 - t) / zb);
    const fa = a + (1 - a) * Math.pow(up, pow), fb = b + (1 - b) * Math.pow(down, pow);
    const w = (W / 2) * fa * fb;
    L.push([c[i][0] + nx*w, c[i][1] + ny*w]); R.push([c[i][0] - nx*w, c[i][1] - ny*w]);
  }
  // Küt uçlara yarım daire kapak: başka darbenin içinde kalan uç köşe
  // bırakmaz, birleşimde çentik oluşmaz.
  const norm = (x) => { while (x > Math.PI) x -= 2*Math.PI; while (x <= -Math.PI) x += 2*Math.PI; return x; };
  // from → to noktaları arasında, merkez etrafında `outDir` yönünden geçen yay
  const arc = (ctr, from, outDir) => {
    const a0 = Math.atan2(from[1]-ctr[1], from[0]-ctr[0]);
    const w = Math.hypot(from[0]-ctr[0], from[1]-ctr[1]);
    const sign = Math.sign(norm(Math.atan2(outDir[1], outDir[0]) - a0)) || 1;
    const pts = [];
    for (let k = 1; k < 12; k++) { const ang = a0 + sign*Math.PI*k/12; pts.push([ctr[0]+Math.cos(ang)*w, ctr[1]+Math.sin(ang)*w]); }
    return pts;
  };
  const tan = (i) => { const p = c[Math.max(0,i-1)], q = c[Math.min(c.length-1,i+1)]; return [q[0]-p[0], q[1]-p[1]]; };
  const n = c.length - 1;
  const endCap = b >= 0.5 && round.includes("b") ? arc(c[n], L[n], tan(n)) : [];
  const t0 = tan(0);
  const startCap = a >= 0.5 && round.includes("a") ? arc(c[0], R[0], [-t0[0], -t0[1]]) : [];
  const ring = [...L, ...endCap, ...[...R].reverse(), ...startCap]; ring.push([...ring[0]]);
  return [ring];
}
const G = {};
// ---------- 4 ----------
G["4"] = [
  blade([[70,118],[54,92],[28,60],[12,36]], 19, { a: 0, b: 0.7, zone: 0.55, round: "b" }),          // ana çapraz, üstte uzun iğne
  blade([[-16,30],[16,36],[58,34],[96,42]], 16, { a: 0, b: 0, zone: 0.4 }),          // bar, iki uçta iğne
  blade([[55,90],[57,60],[52,24],[40,-16]], 20, { a: 1, b: 0, zone: 0.45, round: "a" }),         // gövde, altta iğne
];
// ---------- 5 ----------
G["5"] = [
  blade([[4,94],[34,100],[64,102],[94,116]], 15, { a: 0, b: 0, zone: 0.5 }),        // üst bar, sağda iğne
  blade([[24,98],[22,86],[20,74],[18,62]], 16, { a: 1, b: 1, zone: 0.35, round: "b" }),         // gövde, üstte diken
  blade([[12,58],[40,72],[74,64],[74,36],[74,8],[40,-4],[-10,-12]], 21, { a: 1, b: 0, zone: 0.3 }), // karın
  blade([[64,62],[72,70],[82,78],[96,84]], 9, { a: 1, b: 0, zone: 0.8 }),            // karından çıkan diken
];
// ---------- 2 ----------
G["2"] = [
  blade([[2,52],[0,88],[26,106],[50,104],[78,102],[84,74],[64,54],[44,36],[24,22],[12,10]], 21, { a: 0, b: 0.6, zone: 0.22, round: "b" }), // kıvrım + çapraz
  blade([[0,4],[30,10],[64,8],[102,-6]], 17, { a: 1, b: 0, zone: 0.55 }),            // alt bar, sağda iğne
  blade([[70,96],[82,102],[92,110],[100,122]], 9, { a: 1, b: 0, zone: 0.8 }),        // üst diken
];
// hafif italik eğim
for (const parts of Object.values(G)) for (const poly of parts) for (const ring of poly) for (const p of ring) p[0] += p[1] * 0.12;
const out = {};
for (const [k, parts] of Object.entries(G)) out[k] = pc.union(...parts);
fs.writeFileSync("glyphs.json", JSON.stringify(out));
// SVG önizleme
const adv = { "4": 0, "5": 100, "2": 200 };
let paths = "";
for (const [k, mp] of Object.entries(out)) for (const poly of mp) {
  const d = poly.map(r => "M" + r.map(([x,y]) => `${(x+adv[k]).toFixed(1)},${(-y).toFixed(1)}`).join("L") + "Z").join("");
  paths += `<path d="${d}" fill="white" fill-rule="evenodd"/>`;
}
fs.writeFileSync("preview.svg", `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${process.env.VB || "-30 -130 340 160"}" width="1020" height="480" style="background:#000">${paths}</svg>`);
console.log(Object.fromEntries(Object.entries(out).map(([k,v])=>[k, v.length + " poly, " + v.map(p=>p.length).join("/")+" rings"])));
