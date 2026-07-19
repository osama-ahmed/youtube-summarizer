// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';

function setupHTML() {
  document.body.innerHTML = `
    <div class="container">
      <h1>YouTube Summarizer Settings</h1>
      <section>
        <h2>API Configuration</h2>
        <div class="field">
          <label for="provider">Provider</label>
          <select id="provider">
            <option value="gemini">Gemini</option>
            <option value="openai">OpenAI</option>
            <option value="anthropic">Anthropic</option>
            <option value="deepseek">DeepSeek</option>
            <option value="xai">xAI (Grok)</option>
          </select>
        </div>
        <div class="field">
          <label for="model">Model</label>
          <select id="model"></select>
        </div>
        <div class="field">
          <label for="apiKey">API Key</label>
          <div class="key-row">
            <input type="password" id="apiKey" />
            <button id="toggleKey" type="button" class="btn-small">Show</button>
            <button id="validateKey" type="button" class="btn-small btn-primary">Test</button>
          </div>
          <span id="validationStatus" class="hint"></span>
        </div>
        <div class="field">
          <label></label>
          <button id="saveBtn" class="btn-primary">Save Settings</button>
          <span id="saveStatus"></span>
        </div>
      </section>
      <section>
        <h2>Analytics</h2>
        <label><input type="checkbox" id="gaEnabled" checked /> Analytics</label>
      </section>
      <section>
        <h2>Theme</h2>
        <select id="themeSelect"><option value="light">Light</option><option value="dark">Dark</option></select>
      </section>
      <section>
        <h2>Privacy</h2>
        <a href="#" id="privacyLink">Privacy Policy</a>
      </section>
    </div>
  `;
}

describe('options', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
    await chrome.storage.sync.clear();
    setupHTML();
  });

  async function initOptions() {
    const { initOptions } = await import('../options/options');
    await initOptions();
  }

  it('loads saved config into form fields', async () => {
    await chrome.storage.sync.set({
      provider: 'openai', apiKey: 'sk-test', model: 'gpt-5.6-luna',
      theme: 'dark', gaEnabled: true,
    });
    await initOptions();

    expect((document.getElementById('provider') as HTMLSelectElement).value).toBe('openai');
    expect((document.getElementById('apiKey') as HTMLInputElement).value).toBe('sk-test');
    expect((document.getElementById('themeSelect') as HTMLSelectElement).value).toBe('dark');
  });

  it('saves settings on save click', async () => {
    await chrome.storage.sync.set({ apiKey: '' });
    await initOptions();

    (document.getElementById('apiKey') as HTMLInputElement).value = 'new-key';
    (document.getElementById('provider') as HTMLSelectElement).value = 'anthropic';
    document.getElementById('saveBtn')!.click();
    await new Promise(r => setTimeout(r, 10));

    expect(chrome.storage.sync.set).toHaveBeenCalledWith({ apiKey: 'new-key' });
    expect(chrome.storage.sync.set).toHaveBeenCalledWith({ provider: 'anthropic' });
    expect(document.getElementById('saveStatus')!.textContent).toContain('Saved');
  });

  it('toggles API key visibility', async () => {
    await initOptions();

    const input = document.getElementById('apiKey') as HTMLInputElement;
    expect(input.type).toBe('password');
    document.getElementById('toggleKey')!.click();
    expect(input.type).toBe('text');
    document.getElementById('toggleKey')!.click();
    expect(input.type).toBe('password');
  });

  it('opens privacy policy in new tab', async () => {
    await initOptions();

    document.getElementById('privacyLink')!.click();
    await new Promise(r => setTimeout(r, 10));
    expect(chrome.tabs.create).toHaveBeenCalledWith(
      { url: 'chrome-extension://id/privacy.html' }
    );
  });
});
