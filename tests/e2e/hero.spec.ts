import { expect, test } from '@playwright/test';

test.setTimeout(60_000);

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('gm_scenario', 'padrao'));
  await page.goto('/');
  await expect(
    page.getByRole('region', { name: 'Destaques', exact: true })
  ).toBeVisible({ timeout: 15_000 });
  await page.evaluate(async () => {
    const moduleUrl = '/src/lib/http/client.ts';
    const { http } = await import(moduleUrl);
    await http.post('/api/_mock/reset');
  });
  await page.reload();
  await expect(
    page.getByRole('button', { name: 'Ir para destaque 1' })
  ).toHaveAttribute('aria-current', 'true');
});

test('indicators, keyboard loop, inactive links and explore', async ({
  page,
}) => {
  const hero = page.getByRole('region', { name: 'Destaques', exact: true });
  await expect(hero.getByRole('button')).toHaveCount(3);
  await page.getByRole('button', { name: 'Ir para destaque 2' }).click();
  await expect(
    hero.getByRole('heading', { name: 'DESCUBRA NOVAS EXPRESSÕES' })
  ).toBeVisible();

  await expect(hero.getByRole('link', { name: 'EXPLORAR' })).toHaveCount(1);
  await expect(hero.locator('[inert]')).toHaveCount(2);
  await hero.focus();
  await page.keyboard.press('ArrowRight');
  await expect(
    page.getByRole('button', { name: 'Ir para destaque 3' })
  ).toHaveAttribute('aria-current', 'true');
  await page.keyboard.press('ArrowRight');
  await expect(
    page.getByRole('button', { name: 'Ir para destaque 1' })
  ).toHaveAttribute('aria-current', 'true');
  await page.keyboard.press('ArrowLeft');
  await expect(
    page.getByRole('button', { name: 'Ir para destaque 3' })
  ).toHaveAttribute('aria-current', 'true');
  await hero.getByRole('link', { name: 'EXPLORAR' }).click();
  await expect(page).toHaveURL(/#catalogo$/);
});

test('autoplay suspends on focus and resumes on blur', async ({ page }) => {
  await page.clock.install();
  await page.reload();
  const first = page.getByRole('button', { name: 'Ir para destaque 1' });
  const second = page.getByRole('button', { name: 'Ir para destaque 2' });
  await expect(first).toHaveAttribute('aria-current', 'true');
  await page.mouse.move(0, 0);
  await page.clock.runFor(6500);
  await expect(second).toHaveAttribute('aria-current', 'true');
  await expect(
    page.locator('[aria-live="polite"]').filter({ hasText: /^Destaque / })
  ).toHaveCount(0);
  const hero = page.getByRole('region', { name: 'Destaques', exact: true });
  await hero.focus();
  await page.clock.runFor(6500);
  await expect(second).toHaveAttribute('aria-current', 'true');
  await hero.evaluate((element) => (element as HTMLElement).blur());
  await page.mouse.move(0, 0);
  await page.clock.runFor(6500);
  await expect(
    page.getByRole('button', { name: 'Ir para destaque 3' })
  ).toHaveAttribute('aria-current', 'true');
  const viewport = page.viewportSize()!;
  await page.setViewportSize({ ...viewport, width: viewport.width + 1 });
  await page.clock.runFor(6500);
  await expect(first).toHaveAttribute('aria-current', 'true');
});

test('drag selects a slide', async ({ page }, info) => {
  const hero = page.getByRole('region', { name: 'Destaques', exact: true });
  const bounds = await hero.boundingBox();
  if (!bounds) throw new Error('Hero sem dimensões');
  const y = bounds.y + 80;
  if (info.project.name === 'mobile') {
    const session = await page.context().newCDPSession(page);
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: bounds.x + bounds.width * 0.8, y }],
    });
    for (let step = 1; step <= 12; step++) {
      await session.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [
          { x: bounds.x + bounds.width * (0.8 - (step * 0.65) / 12), y },
        ],
      });
    }
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchEnd',
      touchPoints: [],
    });
    await session.detach();
  } else {
    await page.mouse.move(bounds.x + bounds.width * 0.8, y);
    await page.mouse.down();
    await page.mouse.move(bounds.x + bounds.width * 0.15, y, { steps: 12 });
    await page.mouse.up();
  }
  await expect(
    page.getByRole('button', { name: 'Ir para destaque 2' })
  ).toHaveAttribute('aria-current', 'true');
});

test('reduced motion disables autoplay and keeps manual navigation', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.reload();
  await page.clock.install();

  await page.clock.runFor(12000);
  await expect(
    page.getByRole('button', { name: 'Ir para destaque 1' })
  ).toHaveAttribute('aria-current', 'true');
  await page.getByRole('button', { name: 'Ir para destaque 3' }).click();
  await expect(
    page.getByRole('heading', { name: 'CRIE SUA COLEÇÃO DIGITAL' })
  ).toBeVisible();
});

test('slides keep their height and assets fit responsive widths', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const hero = page.getByRole('region', { name: 'Destaques', exact: true });
  for (const width of [390, 414, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.evaluate(() => document.fonts.ready);
    const initialHeight = (await hero.boundingBox())!.height;
    const controls = hero.locator('[aria-label="Controles dos destaques"]');
    const geometry = await controls.boundingBox();
    expect(geometry!.width).toBe(width < 768 ? 33 : 40);
    expect(geometry!.height).toBe(width < 768 ? 7 : 8);
    expect(await controls.evaluate((el) => getComputedStyle(el).position)).toBe(
      width < 768 ? 'relative' : 'absolute'
    );
    if (width >= 768) {
      const heroBounds = (await hero.boundingBox())!;
      expect(
        heroBounds.y + heroBounds.height - geometry!.y - geometry!.height
      ).toBeCloseTo(43, 0);
    }
    for (let index = 1; index <= 3; index++) {
      await page
        .getByRole('button', { name: `Ir para destaque ${index}` })
        .click();
      expect((await hero.boundingBox())!.height).toBe(initialHeight);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth
        )
      ).toBe(true);
      const active = hero.locator(
        '[aria-roledescription="slide"][aria-hidden="false"]'
      );
      await expect
        .poll(() =>
          active
            .locator('img')
            .evaluateAll((images) =>
              images.every(
                (img) =>
                  (img as HTMLImageElement).complete &&
                  (img as HTMLImageElement).naturalWidth > 0
              )
            )
        )
        .toBe(true);
      await expect(
        active.getByRole('link', { name: 'EXPLORAR' })
      ).toBeVisible();
      const slideBounds = (await active.boundingBox())!;
      const headingBounds = (await active.getByRole('heading').boundingBox())!;
      const linkBounds = (await active
        .getByRole('link', { name: 'EXPLORAR' })
        .boundingBox())!;
      expect(headingBounds.y).toBeGreaterThanOrEqual(slideBounds.y);
      expect(linkBounds.y + linkBounds.height).toBeLessThanOrEqual(
        slideBounds.y + slideBounds.height
      );
    }
    await hero.screenshot({ path: `test-results/hero-${width}.png` });
  }
});

test('hover and hidden document suspend autoplay until resumed', async ({
  page,
}) => {
  await page.clock.install();
  await page.reload();
  const hero = page.getByRole('region', { name: 'Destaques', exact: true });
  const first = page.getByRole('button', { name: 'Ir para destaque 1' });
  await expect(first).toHaveAttribute('aria-current', 'true');
  await hero.hover();
  await page.clock.runFor(12000);
  await expect(first).toHaveAttribute('aria-current', 'true');
  await page.mouse.move(0, 0);
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      value: true,
    });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.clock.runFor(12000);
  await expect(first).toHaveAttribute('aria-current', 'true');
  await page.evaluate(() => {
    Reflect.deleteProperty(document, 'hidden');
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.clock.runFor(6500);
  await expect(
    page.getByRole('button', { name: 'Ir para destaque 2' })
  ).toHaveAttribute('aria-current', 'true');
});
