import { test, expect } from '@playwright/test';

const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 375, height: 667 },
};

test.describe('Schedule Page Responsive Tests', () => {
  for (const [device, viewport] of Object.entries(VIEWPORTS)) {
    test(`${device} - should load schedule page without errors`, async ({ page }) => {
      await page.setViewportSize(viewport);
      
      const consoleErrors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      await page.goto('/dashboard/schedule');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('h1')).toContainText(/Agenda/);
      
      const criticalErrors = consoleErrors.filter(e => 
        !e.includes('Warning') && !e.includes('hydrat')
      );
      expect(criticalErrors).toHaveLength(0);
    });

    test(`${device} - should display tabs correctly`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto('/dashboard/schedule');
      await page.waitForLoadState('networkidle');

      if (device === 'mobile') {
        await expect(page.locator('text=Agenda Geral')).toBeVisible();
      } else {
        await expect(page.locator('button:has-text("Agenda Geral")')).toBeVisible();
        await expect(page.locator('button:has-text("Sessões por dia")')).toBeVisible();
        await expect(page.locator('button:has-text("Agenda de salas")')).toBeVisible();
      }
    });

    test(`${device} - should display view mode buttons`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto('/dashboard/schedule');
      await page.waitForLoadState('networkidle');

      if (device === 'mobile') {
        await expect(page.locator('button:has-text("D")')).toBeVisible();
        await expect(page.locator('button:has-text("S")')).toBeVisible();
        await expect(page.locator('button:has-text("M")')).toBeVisible();
      } else {
        await expect(page.locator('button:has-text("Dia")')).toBeVisible();
        await expect(page.locator('button:has-text("Semana")')).toBeVisible();
        await expect(page.locator('button:has-text("Mês")')).toBeVisible();
      }
    });

    test(`${device} - should display filters and controls`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto('/dashboard/schedule');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('select').first()).toBeVisible();
      await expect(page.locator('button:has-text("Agendar")')).toBeVisible();
    });

    test(`${device} - should switch between view modes`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto('/dashboard/schedule');
      await page.waitForLoadState('networkidle');

      await page.click('button:has-text("Semana")');
      await page.waitForTimeout(300);
      
      await page.click('button:has-text("Mês")');
      await page.waitForTimeout(300);
      
      await page.click('button:has-text("Dia")');
      await page.waitForTimeout(300);
    });

    if (device === 'mobile') {
      test(`${device} - should toggle mobile menu`, async ({ page }) => {
        await page.setViewportSize(viewport);
        await page.goto('/dashboard/schedule');
        await page.waitForLoadState('networkidle');

        await expect(page.locator('text=Sessões por dia')).not.toBeVisible();
        
        await page.click('button svg');
        await page.waitForTimeout(300);
        
        await expect(page.locator('text=Sessões por dia')).toBeVisible();
      });
    }
  }

  test('all viewports - should navigate between days', async ({ page }) => {
    for (const viewport of Object.values(VIEWPORTS)) {
      await page.setViewportSize(viewport);
      await page.goto('/dashboard/schedule');
      await page.waitForLoadState('networkidle');

      await page.click('button:has-text("Próxima")').catch(() => {
        return page.locator('button').nth(1).click();
      });
      await page.waitForTimeout(300);
    }
  });
});
