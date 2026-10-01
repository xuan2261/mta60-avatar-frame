import { test, expect } from '@playwright/test';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { existsSync, readFileSync } from 'node:fs';

const pageUrl = pathToFileURL(resolve('index.html')).href;
const ogImagePath = resolve('og-image-v1.png');
const qrImagePath = resolve('share-qr-v1.png');
const posterImagePath = resolve('share-poster-v1.png');

async function openApp(page) {
  await page.goto(pageUrl);
  await page.waitForFunction(() => frame.complete && frame.naturalWidth > 0);
}

async function installSyntheticPhoto(page) {
  await page.evaluate(async () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200"><rect width="900" height="1200" fill="#ff00aa"/></svg>';
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    });
    photo = img;
    state = defaultState();
    stage.classList.add('has-photo');
    render(false);
  });
}

test('portrait layer never leaks outside the configured aperture', async ({ page }) => {
  await openApp(page);

  const baseline = await page.evaluate(() => {
    photo = null;
    state = defaultState();
    render(false);
    const points = [];
    for (let y = 32; y < canvas.height; y += 128) {
      for (let x = 32; x < canvas.width; x += 128) {
        const n = ((x - APERTURE.cx) / APERTURE.rx) ** 2 + ((y - APERTURE.cy) / APERTURE.ry) ** 2;
        if (n > 1.15) points.push([x, y]);
      }
    }
    return points.map(([x, y]) => [x, y, ...ctx.getImageData(x, y, 1, 1).data]);
  });

  await installSyntheticPhoto(page);

  const after = await page.evaluate((points) => points.map(([x, y]) => [x, y, ...ctx.getImageData(x, y, 1, 1).data]), baseline);
  expect(after).toEqual(baseline);
});

test('PNG keeps transparency and JPG gets a white background', async ({ page }) => {
  await openApp(page);
  await installSyntheticPhoto(page);

  const result = await page.evaluate(async () => {
    const decodePixel = async (blob, x, y) => {
      const bitmap = await createImageBitmap(blob);
      const c = document.createElement('canvas');
      c.width = bitmap.width;
      c.height = bitmap.height;
      const g = c.getContext('2d', { willReadFrequently: true });
      g.drawImage(bitmap, 0, 0);
      return Array.from(g.getImageData(x, y, 1, 1).data);
    };

    render(false);
    const png = await canvasBlob('image/png');
    render(true);
    const jpg = await canvasBlob('image/jpeg', 0.94);
    render(false);

    return {
      pngCorner: await decodePixel(png, 0, 0),
      jpgCorner: await decodePixel(jpg, 0, 0),
      pngType: png.type,
      jpgType: jpg.type,
    };
  });

  expect(result.pngType).toBe('image/png');
  expect(result.jpgType).toBe('image/jpeg');
  expect(result.pngCorner[3]).toBe(0);
  expect(result.jpgCorner.slice(0, 3)).toEqual([255, 255, 255]);
});

test('safe-area preview is UI-only and contact information is usable', async ({ page }) => {
  await openApp(page);
  await installSyntheticPhoto(page);

  const before = await page.evaluate(() => Array.from(ctx.getImageData(1024, 900, 1, 1).data));
  await expect(page.locator('#safePreview')).toBeChecked();
  await expect(page.locator('#stage')).toHaveClass(/safe-on/);
  await page.locator('#safePreview').uncheck();
  await expect(page.locator('#stage')).not.toHaveClass(/safe-on/);
  const after = await page.evaluate(() => Array.from(ctx.getImageData(1024, 900, 1, 1).data));
  expect(after).toEqual(before);

  await expect(page.locator('.creator')).toContainText('Bùi Thanh Xuân');
  await expect(page.locator('.creator a[href="https://fb.com/xuan2261"]')).toBeVisible();
  await expect(page.locator('.creator a[href="tel:+84374037026"]')).toContainText('0374 037 026');
});

test('mobile layout has no horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openApp(page);
  const dimensions = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.width + 1);
  await expect(page.locator('.safe-toggle')).toBeVisible();
  await expect(page.locator('.creator')).toBeVisible();
});

test('social metadata, share assets and invite copy are wired', async ({ page }) => {
  expect(existsSync(ogImagePath)).toBe(true);
  expect(existsSync(qrImagePath)).toBe(true);
  expect(existsSync(posterImagePath)).toBe(true);
  await openApp(page);

  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://xuan2261.github.io/mta60-avatar-frame/');
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', 'https://xuan2261.github.io/mta60-avatar-frame/');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', 'https://xuan2261.github.io/mta60-avatar-frame/og-image-v1.png');
  await expect(page.locator('meta[property="og:image:width"]')).toHaveAttribute('content', '1200');
  await expect(page.locator('meta[property="og:image:height"]')).toHaveAttribute('content', '630');
  await expect(page.locator('.share-assets a[href="share-qr-v1.png"]')).toBeVisible();
  await expect(page.locator('.share-assets a[href="share-poster-v1.png"]')).toBeVisible();
  await expect(page.locator('#showQrBtn')).toBeVisible();
  await expect(page.locator('#sharePosterBtn')).toBeVisible();
  await expect(page.locator('#inviteTemplate option')).toHaveCount(3);

  await page.evaluate(() => {
    window.__invite = '';
    window.prompt = (_message, value) => { window.__invite = value; return value; };
  });
  await page.locator('#inviteTemplate').selectOption('alumni');
  await page.locator('#copyInviteBtn').click();
  const invite = await page.evaluate(() => window.__invite);
  expect(invite).toContain('60 năm Học viện Kỹ thuật Quân sự');
  expect(invite).toContain('cựu học viên');
  expect(invite).toContain('https://xuan2261.github.io/mta60-avatar-frame/');

  await page.evaluate(() => { window.__invite = ''; });
  await page.locator('#shareBtn').click();
  const sharedUrl = await page.evaluate(() => window.__invite);
  expect(sharedUrl).toBe('https://xuan2261.github.io/mta60-avatar-frame/');
});

test('QR dialog opens, closes, and poster sharing uses a file when supported', async ({ page }) => {
  await openApp(page);
  await page.locator('#showQrBtn').click();
  await expect(page.locator('#qrDialog')).toHaveJSProperty('open', true);
  await expect(page.locator('#qrDialog img[src="share-qr-v1.png"]')).toBeVisible();
  await page.locator('#closeQrBtn').click();
  await expect(page.locator('#qrDialog')).toHaveJSProperty('open', false);

  await page.evaluate(() => {
    posterFile = new File([new Blob(['poster'], { type: 'image/png' })], 'MTA60-HaiQuan-poster.png', { type: 'image/png' });
    window.__sharedPoster = null;
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: data => !!data?.files?.length });
    Object.defineProperty(navigator, 'share', { configurable: true, value: async data => { window.__sharedPoster = { title: data.title, text: data.text, fileName: data.files?.[0]?.name, fileType: data.files?.[0]?.type }; } });
  });
  await page.locator('#sharePosterBtn').click();
  const shared = await page.evaluate(() => window.__sharedPoster);
  expect(shared).toEqual({
    title: 'MTA 60 năm – Dấu ấn Hải quân',
    text: 'Mời mọi người tạo ảnh đại diện kỷ niệm 60 năm Học viện Kỹ thuật Quân sự.',
    fileName: 'MTA60-HaiQuan-poster.png',
    fileType: 'image/png',
  });
});

test('generated share images have the locked dimensions', async ({ page }) => {
  const readSize = async (path) => {
    await page.goto(pathToFileURL(path).href);
    return page.locator('img').evaluate(img => [img.naturalWidth, img.naturalHeight]);
  };
  expect(await readSize(ogImagePath)).toEqual([1200, 630]);
  expect(await readSize(qrImagePath)).toEqual([900, 900]);
  expect(await readSize(posterImagePath)).toEqual([1080, 1350]);
});

test('poster source omits creator contact and internal design codes', async () => {
  const generator = readFileSync(resolve('scripts/generate-social-assets.mjs'), 'utf8');
  const posterStart = generator.indexOf('const posterHtml');
  const posterEnd = generator.indexOf('const browser', posterStart);
  expect(posterStart).toBeGreaterThan(-1);
  expect(posterEnd).toBeGreaterThan(posterStart);
  const posterSource = generator.slice(posterStart, posterEnd);
  expect(posterSource).not.toMatch(/PA\d+/i);
  expect(posterSource).not.toContain('Người tạo:');
  expect(posterSource).not.toContain('Bùi Thanh Xuân');
  expect(posterSource).not.toContain('fb.com/xuan2261');
  expect(posterSource).not.toContain('0374 037 026');
  expect(posterSource).toContain('Kỷ niệm 60 năm · 1966–2026');
});

test('public source no longer exposes internal design codes and uses the naval-audience description', async () => {
  const indexSource = readFileSync(resolve('index.html'), 'utf8');
  const readmeSource = readFileSync(resolve('README.md'), 'utf8');
  const generatorSource = readFileSync(resolve('scripts/generate-social-assets.mjs'), 'utf8');
  const indexTextSource = indexSource.replace(/frame\.src='data:image\/webp;base64,[^']+'/g, "frame.src='<embedded-frame>'");
  for (const source of [indexTextSource, readmeSource, generatorSource]) {
    expect(source).not.toMatch(/PA\d+/i);
  }
  expect(indexSource).toContain('Mẫu khung cộng đồng kỷ niệm 60 năm Học viện Kỹ thuật Quân sự · kết nối truyền thống MTA với dấu ấn Hải quân.');
  expect(readmeSource).toContain('kết nối truyền thống MTA với dấu ấn Hải quân');
  expect(indexSource).not.toContain('hướng đối tượng công tác ở Hải quân');
  expect(readmeSource).not.toContain('hướng đối tượng công tác ở Hải quân');
});
