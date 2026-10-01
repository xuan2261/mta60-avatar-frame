import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import QRCode from 'qrcode';

const SITE_URL = 'https://xuan2261.github.io/mta60-avatar-frame/';
const qrPath = fileURLToPath(new URL('../share-qr-v1.png', import.meta.url));
const ogPath = fileURLToPath(new URL('../og-image-v2.png', import.meta.url));
const posterPath = fileURLToPath(new URL('../share-poster-v1.png', import.meta.url));
const source = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const match = source.match(/frame\.src='(data:image\/webp;base64,[^']+)'/);
if (!match) throw new Error('Không tìm thấy ảnh khung nhúng trong index.html');
const frameSrc = match[1];

const qrDataUrl = await QRCode.toDataURL(SITE_URL, {
  errorCorrectionLevel: 'H', margin: 3, width: 720,
  color: { dark: '#0d4a26', light: '#ffffff' },
});

await QRCode.toFile(qrPath, SITE_URL, {
  errorCorrectionLevel: 'H', margin: 4, width: 900,
  color: { dark: '#0d4a26', light: '#ffffff' },
});

const commonCss = `*{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;overflow:hidden}body{font-family:Inter,"Segoe UI",Arial,sans-serif;color:#fff;background:#0d4a26}`;
const ogHtml = `<!doctype html><html><head><meta charset="utf-8"><style>${commonCss}
body{background:radial-gradient(circle at 82% 25%,#438a4c 0,#2f6e38 27%,#0d4a26 78%);position:relative}
body:before{content:"";position:absolute;inset:-15%;background:repeating-radial-gradient(circle at 15% 70%,rgba(216,181,74,.12) 0 2px,transparent 3px 42px);opacity:.45;transform:rotate(-8deg)}
.wrap{position:relative;width:1200px;height:630px;padding:66px 62px;display:grid;grid-template-columns:650px 1fr;gap:28px;align-items:center}
.kicker{font-size:24px;font-weight:850;letter-spacing:.14em;text-transform:uppercase;color:#f4d16a;margin-bottom:18px}
h1{font-size:58px;line-height:1.02;letter-spacing:-.035em;margin:0 0 18px;max-width:650px}
.years{font-size:25px;font-weight:800;letter-spacing:.1em;color:#f4d16a;margin-bottom:24px}
.desc{font-size:23px;line-height:1.45;max-width:610px;margin:0 0 25px;color:rgba(255,255,255,.9)}
.cta{display:inline-flex;padding:12px 18px;border-radius:999px;background:#fff;color:#174f31;font-weight:850;font-size:19px;box-shadow:0 8px 28px rgba(0,0,0,.15)}
.url{position:absolute;left:62px;bottom:38px;font-size:16px;font-weight:700;color:rgba(255,255,255,.72)}
.framebox{justify-self:end;width:456px;height:456px;display:grid;place-items:center;position:relative}
.framebox:before{content:"";position:absolute;width:390px;height:390px;border-radius:50%;background:rgba(255,255,255,.95);box-shadow:0 25px 70px rgba(0,0,0,.28)}
.frame{position:relative;width:456px;height:456px;object-fit:contain;filter:drop-shadow(0 18px 30px rgba(0,0,0,.28))}
.creator{position:absolute;right:62px;bottom:38px;font-size:14px;color:rgba(255,255,255,.68)}
</style></head><body><div class="wrap"><section><div class="kicker">Kỷ niệm 60 năm · 1966–2026</div><h1>Học viện Kỹ thuật Quân sự</h1><div class="years">28/10/1966 — 28/10/2026</div><p class="desc">Kết nối truyền thống MTA với dấu ấn Hải quân.</p><div class="cta">TẠO ẢNH ĐẠI DIỆN</div></section><div class="framebox"><img class="frame" src="${frameSrc}" alt=""></div><div class="url">xuan2261.github.io/mta60-avatar-frame</div><div class="creator">Bùi Thanh Xuân · fb.com/xuan2261</div></div></body></html>`;

const posterHtml = `<!doctype html><html><head><meta charset="utf-8"><style>${commonCss}
body{background:radial-gradient(circle at 50% 0,#4a8b52 0,#2f6e38 36%,#0d4a26 100%)}
.wrap{width:1080px;height:1350px;padding:64px 72px 58px;display:flex;flex-direction:column;align-items:center;text-align:center;position:relative}
.kicker{font-size:22px;font-weight:900;letter-spacing:.16em;text-transform:uppercase;color:#f4d16a}
h1{font-size:56px;line-height:1.08;letter-spacing:-.03em;margin:16px 0 10px;max-width:900px}
.sub{font-size:24px;line-height:1.45;color:rgba(255,255,255,.86);margin:0 0 8px}
.tagline{font-size:20px;line-height:1.4;color:#f4d16a;font-weight:800;margin:0 0 14px}
.hero{display:flex;align-items:center;justify-content:center;gap:34px;width:100%;margin:8px 0 24px}
.frame{width:550px;height:550px;object-fit:contain;filter:drop-shadow(0 20px 34px rgba(0,0,0,.3))}
.qrbox{background:#fff;padding:18px;border-radius:26px;box-shadow:0 18px 42px rgba(0,0,0,.22)}
.qr{width:286px;height:286px;display:block}.qrlabel{color:#174f31;font-size:18px;font-weight:900;margin-top:10px}
.steps{font-size:23px;font-weight:750;letter-spacing:.01em;margin:0 0 16px}.url{font-size:20px;color:#f4d16a;font-weight:850;margin-top:4px}
 </style></head><body><div class="wrap"><div class="kicker">Kỷ niệm 60 năm · 1966–2026</div><h1>Học viện Kỹ thuật Quân sự</h1><p class="sub">28/10/1966 — 28/10/2026 · Trí tuệ tỏa sáng</p><p class="tagline">Kết nối truyền thống MTA với dấu ấn Hải quân</p><div class="hero"><img class="frame" src="${frameSrc}" alt=""><div class="qrbox"><img class="qr" src="${qrDataUrl}" alt=""><div class="qrlabel">QUÉT ĐỂ TẠO AVATAR</div></div></div><div class="steps">Chọn ảnh → căn chỉnh → tải về → đặt làm avatar Facebook/Zalo</div><div class="url">${SITE_URL}</div></div></body></html>`;

const browser = await chromium.launch({ headless: true });
try {
  const ogPage = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await ogPage.setContent(ogHtml, { waitUntil: 'load' });
  await ogPage.waitForFunction(() => [...document.images].every(img => img.complete && img.naturalWidth));
  await ogPage.screenshot({ path: ogPath, type: 'png' });
  const posterPage = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
  await posterPage.setContent(posterHtml, { waitUntil: 'load' });
  await posterPage.waitForFunction(() => [...document.images].every(img => img.complete && img.naturalWidth));
  await posterPage.screenshot({ path: posterPath, type: 'png' });
} finally { await browser.close(); }
console.log('Generated og-image-v2.png, share-qr-v1.png, share-poster-v1.png');
