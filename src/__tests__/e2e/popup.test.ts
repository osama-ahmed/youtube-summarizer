import { test, expect, beforeAll, afterAll } from 'vitest';
import puppeteer, { Browser, Page } from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EXTENSION_PATH = path.resolve(__dirname, '../../../dist');

let browser: Browser;
let extensionId: string;

async function findExtensionId(b: Browser, timeoutMs = 8000): Promise<string> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    for (const target of b.targets()) {
      const url = target.url();
      if (url.startsWith('chrome-extension://')) {
        return new URL(url).hostname;
      }
    }
    await new Promise(r => setTimeout(r, 200));
  }
  throw new Error('Could not find extension target');
}

beforeAll(async () => {
  browser = await puppeteer.launch({
    headless: true,
    args: [
      `--disable-extensions-except=${EXTENSION_PATH}`,
      `--load-extension=${EXTENSION_PATH}`,
      '--no-sandbox',
      '--disable-setuid-sandbox',
    ],
  });

  extensionId = await findExtensionId(browser);
});

afterAll(async () => {
  await browser.close();
});

async function popupPage(): Promise<Page> {
  const page = await browser.newPage();
  await page.goto(`chrome-extension://${extensionId}/popup/popup.html`, {
    waitUntil: 'networkidle0',
  });
  return page;
}

test('shows onboarding view when onboarding is incomplete', async () => {
  const page = await popupPage();

  // Ensure no storage state
  await page.evaluate(() => chrome.storage.sync.clear());
  await page.reload({ waitUntil: 'networkidle0' });

  const onboardingView = await page.waitForSelector('#view-onboarding', {
    visible: true,
    timeout: 3000,
  });
  expect(onboardingView).toBeTruthy();
});

test('shows idle view when onboarded and not on YouTube', async () => {
  const page = await popupPage();

  await page.evaluate(() =>
    chrome.storage.sync.set({ onboardingComplete: true })
  );
  await page.reload({ waitUntil: 'networkidle0' });

  const idleView = await page.waitForSelector('#view-idle', {
    visible: true,
    timeout: 3000,
  });
  expect(idleView).toBeTruthy();
});

test('footer contains Settings, History and Feedback links', async () => {
  const page = await popupPage();

  await page.evaluate(() =>
    chrome.storage.sync.set({
      onboardingComplete: true,
      summaryCount: 3,
    })
  );
  await page.reload({ waitUntil: 'networkidle0' });

  const footer = await page.$('footer');
  expect(footer).toBeTruthy();

  const settingsBtn = await page.$('#settingsLink');
  expect(settingsBtn).toBeTruthy();
  expect(await settingsBtn!.evaluate(el => el.textContent)).toBe('Settings');

  const historyBtn = await page.$('#historyLink');
  expect(historyBtn).toBeTruthy();
  expect(await historyBtn!.evaluate(el => el.textContent)).toBe('History');

  const feedbackLink = await page.$('a[href^="mailto:"]');
  expect(feedbackLink).toBeTruthy();
});

test('history view renders and shows empty state', async () => {
  const page = await popupPage();

  await page.evaluate(() =>
    chrome.storage.sync.set({ onboardingComplete: true })
  );
  await page.reload({ waitUntil: 'networkidle0' });

  // Click History link in footer
  await page.click('#historyLink');
  await page.waitForSelector('#view-history', { visible: true, timeout: 3000 });

  const historyList = await page.$('#historyList');
  expect(historyList).toBeTruthy();

  const emptyHint = await historyList!.$('.hint');
  expect(emptyHint).toBeTruthy();
  expect(await emptyHint!.evaluate(el => el.textContent)).toContain('No summaries yet');
});

test('back from history returns to idle', async () => {
  const page = await popupPage();

  await page.evaluate(() =>
    chrome.storage.sync.set({ onboardingComplete: true })
  );
  await page.reload({ waitUntil: 'networkidle0' });

  await page.click('#historyLink');
  await page.waitForSelector('#view-history', { visible: true, timeout: 3000 });

  await page.click('#backFromHistory');
  await page.waitForSelector('#view-idle', { visible: true, timeout: 3000 });
});

test('theme toggle switches between light and dark', async () => {
  const page = await popupPage();

  await page.evaluate(() =>
    chrome.storage.sync.set({
      onboardingComplete: true,
      theme: 'light',
    })
  );
  await page.reload({ waitUntil: 'networkidle0' });

  // Should start as light
  let theme = await page.evaluate(() =>
    document.documentElement.getAttribute('data-theme')
  );
  expect(theme).toBe('light');

  // Toggle to dark
  await page.click('#themeToggle');
  await new Promise(r => setTimeout(r, 300));
  theme = await page.evaluate(() =>
    document.documentElement.getAttribute('data-theme')
  );
  expect(theme).toBe('dark');

  // Toggle back to light
  await page.click('#themeToggle');
  await new Promise(r => setTimeout(r, 300));
  theme = await page.evaluate(() =>
    document.documentElement.getAttribute('data-theme')
  );
  expect(theme).toBe('light');
});
