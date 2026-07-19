// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';

function setupHTML() {
  document.body.innerHTML = `
    <div class="container">
      <h1>YouTube Summarizer</h1>
      <div id="stepIndicator" class="step-indicator">Step 1 of 3</div>
      <h2 id="stepTitle" class="step-title">Pick a Provider</h2>
      <div id="step1" class="step">
        <div class="provider-grid" id="providerGrid">
          <button class="provider-btn selected" data-provider="gemini">Gemini</button>
          <button class="provider-btn" data-provider="openai">OpenAI</button>
          <button class="provider-btn" data-provider="anthropic">Anthropic</button>
          <button class="provider-btn" data-provider="deepseek">DeepSeek</button>
          <button class="provider-btn" data-provider="xai">xAI (Grok)</button>
        </div>
        <div class="field">
          <label for="modelSelect">Model</label>
          <select id="modelSelect"></select>
        </div>
      </div>
      <div id="step2" class="step" style="display:none">
        <p>1. Visit <strong id="providerConsoleLabel">Gemini API Console</strong></p>
        <p>Get your key from <strong id="providerName2">Gemini</strong></p>
        <a id="consoleLink" href="#" class="console-link">Open</a>
        <p class="key-hint" id="keyHint">Keys: <code>AIza...</code></p>
      </div>
      <div id="step3" class="step" style="display:none">
        <p>Paste your <strong id="providerName3">Gemini</strong> key</p>
        <input type="password" id="apiKeyInput" />
        <button id="toggleKeyBtn" class="btn-small">Show</button>
        <div id="validationStatus" class="validation-status"></div>
      </div>
      <div id="stepSuccess" class="step" style="display:none">
        <div class="success-icon">✓</div>
        <p class="success-text">All set!</p>
      </div>
      <div id="actionButtons" class="action-buttons">
        <button id="continueBtn" class="btn-primary">Continue</button>
        <button id="skipBtn" class="btn-link">Skip, I'll set up later</button>
      </div>
      <div id="successButtons" class="action-buttons" style="display:none">
        <button id="finishBtn" class="btn-primary">Start Summarizing →</button>
      </div>
    </div>
  `;
}

describe('onboarding', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
    await chrome.storage.sync.clear();
    setupHTML();
  });

  async function initOnboarding() {
    const { initOnboarding } = await import('../onboarding/onboarding');
    await initOnboarding();
  }

  it('shows first step when onboarding incomplete', async () => {
    await chrome.storage.sync.set({ onboardingComplete: false, theme: 'light' });
    await initOnboarding();

    expect(document.getElementById('step1')!.style.display).toBe('block');
    expect(document.getElementById('step2')!.style.display).toBe('none');
    expect(document.getElementById('step3')!.style.display).toBe('none');
  });

  it('shows success view if already onboarded', async () => {
    await chrome.storage.sync.set({ onboardingComplete: true, theme: 'light' });
    await initOnboarding();

    expect(document.getElementById('stepSuccess')!.style.display).toBe('block');
  });

  it('navigates to step 2 on continue', async () => {
    await chrome.storage.sync.set({ onboardingComplete: false, theme: 'light' });
    await initOnboarding();

    document.getElementById('continueBtn')!.click();
    await new Promise(r => setTimeout(r, 10));
    expect(document.getElementById('stepIndicator')!.textContent).toBe('Step 2 of 3');
  });

  it('completes onboarding on skip', async () => {
    await chrome.storage.sync.set({ onboardingComplete: false, theme: 'light' });
    await initOnboarding();

    document.getElementById('skipBtn')!.click();
    await new Promise(r => setTimeout(r, 10));
    expect(chrome.runtime.openOptionsPage).toHaveBeenCalled();
    const result = await chrome.storage.sync.get('onboardingComplete');
    expect(result.onboardingComplete).toBe(true);
  });

  it('shows success on finish', async () => {
    await chrome.storage.sync.set({ onboardingComplete: true, theme: 'light' });
    await initOnboarding();

    expect(document.getElementById('stepSuccess')!.style.display).toBe('block');
    expect(document.getElementById('stepIndicator')!.textContent).toBe('');
    expect(document.getElementById('stepTitle')!.textContent).toBe('All Set!');
  });
});
