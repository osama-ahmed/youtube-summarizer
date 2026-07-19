// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';

function setupHTML() {
  document.body.innerHTML = `
    <div class="popup-container">
      <header><h1>YouTube Summarizer</h1></header>
      <div id="view-onboarding"><p>Welcome!</p><button id="openOnboardingBtn" class="btn-primary">Set Up API Key</button></div>
      <div id="view-idle"><p class="hint">Go to a YouTube video...</p></div>
      <div id="view-summarizing"><div class="spinner"></div><p>Fetching transcript...</p></div>
      <div id="view-error"><p id="errorMessage" class="error-text"></p><button id="errorActionBtn" class="btn-secondary"></button><button id="retryBtn" class="btn-primary">Retry</button></div>
      <div id="view-result"><button id="backHistoryBtn" class="btn-secondary" style="display:none;">← Back</button>
        <h2 id="videoTitle"></h2><div id="summaryContent" class="summary-content"></div>
        <div class="result-actions"><button id="copyBtn" class="btn-secondary">Copy</button></div>
        <div id="transcriptSection" style="display:none;"><div id="transcriptContent"></div></div>
        <button id="showTranscriptBtn" class="btn-secondary">Show Transcript</button>
        <button id="newSummaryBtn" class="btn-primary">New Summary</button>
      </div>
      <div id="view-history"><button id="backFromHistory" class="btn-secondary">← Back</button><h2>History</h2><ul id="historyList"></ul></div>
      <footer>
        <button id="themeToggle" class="theme-btn">☀</button>
        <button id="settingsLink" class="link-btn">Settings</button>
        <button id="historyLink" class="link-btn">History</button>
        <a href="mailto:test@test.com" class="link-btn">Feedback</a>
      </footer>
    </div>
  `;
}

describe('popup', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
    await chrome.storage.sync.clear();
    await chrome.storage.local.clear();
    setupHTML();
  });

  async function initPopup() {
    const { initPopup } = await import('../popup/popup');
    await initPopup();
  }

  it('shows onboarding view when incomplete', async () => {
    await chrome.storage.sync.set({ onboardingComplete: false });
    await initPopup();

    expect(document.getElementById('view-onboarding')!.style.display).toBe('block');
    expect(document.getElementById('view-idle')!.style.display).toBe('none');
  });

  it('shows idle view when onboarded', async () => {
    await chrome.storage.sync.set({ onboardingComplete: true, theme: 'light' });
    await initPopup();

    expect(document.getElementById('view-idle')!.style.display).toBe('block');
  });

  it('navigates to settings when settingsLink clicked', async () => {
    await chrome.storage.sync.set({ onboardingComplete: true, theme: 'light' });
    await initPopup();

    document.getElementById('settingsLink')!.click();
    expect(chrome.runtime.openOptionsPage).toHaveBeenCalled();
  });

  it('navigates to history when historyLink clicked', async () => {
    await chrome.storage.sync.set({ onboardingComplete: true, theme: 'light' });
    await chrome.storage.local.set({ summary_history: [] });
    await initPopup();

    document.getElementById('historyLink')!.click();
    await new Promise(r => setTimeout(r, 10));
    expect(document.getElementById('view-history')!.style.display).toBe('block');
  });

  it('toggles theme', async () => {
    await chrome.storage.sync.set({ onboardingComplete: true, theme: 'light' });
    await initPopup();

    document.getElementById('themeToggle')!.click();
    await new Promise(r => setTimeout(r, 10));
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(chrome.storage.sync.set).toHaveBeenCalledWith({ theme: 'dark' });
  });
});
