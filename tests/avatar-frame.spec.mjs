import { test, expect } from '@playwright/test';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const pageUrl = pathToFileURL(resolve('index.html')).href;

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
