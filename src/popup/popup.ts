import { isOnboardingComplete, getHistory, deleteHistoryEntry, getTheme, setTheme, getApiKey, getProvider, getModel, getPendingVideoId, removePendingVideoId } from '../lib/storage';
import { fetchTranscript } from '../lib/transcript';
import { SummarizerError } from '../lib/errors';
import { extractVideoId } from '../lib/video-id';
import { LLMProviderId } from '../lib/types';
import { PROVIDER_DEFAULTS, FEATURES } from '../config';
import { renderMarkdown, escapeHtml } from '../lib/markdown';
import { exportHistoryToZip } from '../lib/export';

type View = 'onboarding' | 'idle' | 'summarizing' | 'error' | 'result' | 'history';

let lastSummary = '';
let lastTitle = '';
let lastTranscript = '';
let transcriptAvailable = false;
let fromHistory = false;
let isExporting = false;

let homeTitle = '';
let homeSummary = '';
let homeTranscript = '';
let homeTranscriptAvailable = false;

function showView(view: View) {
  const views: View[] = ['onboarding', 'idle', 'summarizing', 'error', 'result', 'history'];
  views.forEach(v => {
    const el = document.getElementById(`view-${v}`);
    if (el) el.style.display = v === view ? 'block' : 'none';
  });
}

async function getActiveTab(): Promise<chrome.tabs.Tab | undefined> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function startSummary() {
  const apiKey = await getApiKey();
  if (!apiKey) {
    showView('error');
    document.getElementById('errorMessage')!.textContent = 'Set up your API key in Settings first.';
    const actionBtn = document.getElementById('errorActionBtn')!;
    actionBtn.textContent = 'Open Settings';
    actionBtn.onclick = () => chrome.runtime.openOptionsPage();
    actionBtn.style.display = 'block';
    return;
  }

  const tab = await getActiveTab();
  if (!tab?.url) {
    showView('error');
    document.getElementById('errorMessage')!.textContent = 'Could not detect the active tab.';
    return;
  }

  const videoId = extractVideoId(tab.url);
  if (!videoId) {
    showView('error');
    document.getElementById('errorMessage')!.textContent = 'This is not a YouTube video page.';
    return;
  }

  showView('summarizing');

  try {
    const { text: transcript, title } = await fetchTranscript(videoId);
    const [provider, model] = await Promise.all([getProvider(), getModel()]);
    const resolvedModel = model || PROVIDER_DEFAULTS[provider].model;

    const response = await chrome.runtime.sendMessage({
      type: 'GENERATE_SUMMARY',
      transcript,
      provider,
      apiKey,
      model: resolvedModel,
      videoId,
      videoTitle: title || 'Summary',
    });

    if (!response || response.error) {
      throw new SummarizerError(
        response?.error || 'Generation failed',
        response?.error || 'Something went wrong. Try again.',
        'retry',
      );
    }

    const summary = response.summary;
    lastTitle = title || 'Summary';
    lastSummary = summary;
    lastTranscript = transcript;
    transcriptAvailable = true;
    document.getElementById('videoTitle')!.textContent = lastTitle;
    document.getElementById('summaryContent')!.innerHTML = renderMarkdown(summary);
    document.getElementById('backHistoryBtn')!.style.display = 'none';
    homeTitle = lastTitle;
    homeSummary = summary;
    homeTranscript = transcript;
    homeTranscriptAvailable = true;
    showView('result');
  } catch (err: unknown) {
    console.error('getSummary failed:', err);
    const msg = err instanceof SummarizerError ? err.userMessage : 'Something went wrong. Try again.';
    document.getElementById('errorMessage')!.textContent = msg;
    const actionBtn = document.getElementById('errorActionBtn')!;
    if (err instanceof SummarizerError && err.recoveryAction === 'openSettings') {
      actionBtn.textContent = 'Open Settings';
      actionBtn.style.display = 'block';
      actionBtn.onclick = () => chrome.runtime.openOptionsPage();
    } else {
      actionBtn.style.display = 'none';
    }
    showView('error');
  }
}


async function renderHistory() {
  const history = await getHistory();
  const list = document.getElementById('historyList')!;
  if (history.length === 0) {
    list.innerHTML = '<li class="hint">No summaries yet.</li>';
    return;
  }
  list.innerHTML = history.map(entry =>
    `<li data-id="${entry.id}">
      <div class="history-item">
        <div class="history-info">
          <strong>${escapeHtml(entry.videoTitle)}</strong>
          <br/><span class="hint">${new Date(entry.timestamp).toLocaleDateString()} — ${entry.provider}</span>
        </div>
        <div class="history-actions">
          <button class="history-open-btn" title="Open video">▶</button>
          <button class="history-delete-btn" title="Delete">✕</button>
        </div>
      </div>
    </li>`
  ).join('');

  list.querySelectorAll('li').forEach(li => {
    const id = li.getAttribute('data-id')!;
    const entry = history.find(h => h.id === id);
    if (!entry) return;

    li.querySelector('.history-info')!.addEventListener('click', () => {
      lastTitle = entry.videoTitle;
      lastSummary = entry.summary;
      lastTranscript = entry.transcript || '';
      transcriptAvailable = !!entry.transcript;
      document.getElementById('videoTitle')!.textContent = entry.videoTitle;
      document.getElementById('summaryContent')!.innerHTML = renderMarkdown(entry.summary);
      document.getElementById('transcriptSection')!.style.display = 'none';
      (document.getElementById('showTranscriptBtn') as HTMLElement).textContent = 'Show Transcript';
      fromHistory = true;
      document.getElementById('backHistoryBtn')!.style.display = 'block';
      showView('result');
    });

    li.querySelector('.history-open-btn')!.addEventListener('click', (e) => {
      e.stopPropagation();
      chrome.tabs.create({ url: `https://youtu.be/${entry.videoId}` });
    });

    li.querySelector('.history-delete-btn')!.addEventListener('click', async (e) => {
      e.stopPropagation();
      await deleteHistoryEntry(id);
      li.remove();
    });
  });

  const exportBtn = document.getElementById('exportHistoryBtn')!;
  if (FEATURES.exportHistory) {
    exportBtn.style.display = 'block';
    exportBtn.onclick = async () => {
      if (isExporting) return;
      isExporting = true;
      exportBtn.textContent = 'Exporting…';
      (exportBtn as HTMLButtonElement).disabled = true;
      await exportHistoryToZip();
      exportBtn.textContent = 'Export All';
      (exportBtn as HTMLButtonElement).disabled = false;
      isExporting = false;
    };
  } else {
    exportBtn.style.display = 'none';
  }
}

function applyTheme(theme: 'light' | 'dark') {
  document.documentElement.setAttribute('data-theme', theme);
  const btn = document.getElementById('themeToggle')!;
  btn.textContent = theme === 'dark' ? '☾' : '☀';
}

export async function initPopup() {
  const onboarding = await isOnboardingComplete();
  if (!onboarding) {
    showView('onboarding');
    return;
  }

  const [theme] = await Promise.all([
    getTheme(),
  ]);
  applyTheme(theme);

  document.getElementById('themeToggle')!.addEventListener('click', async () => {
    const current = await getTheme();
    const next = current === 'dark' ? 'light' : 'dark';
    await setTheme(next);
    applyTheme(next);
  });

  document.getElementById('openOnboardingBtn')!.addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('onboarding/onboarding.html') });
  });
  document.getElementById('retryBtn')!.addEventListener('click', startSummary);
  document.getElementById('newSummaryBtn')!.addEventListener('click', startSummary);
  document.getElementById('settingsLink')!.addEventListener('click', () => chrome.runtime.openOptionsPage());
  document.getElementById('historyLink')!.addEventListener('click', async () => {
    await renderHistory();
    showView('history');
  });
  document.getElementById('backHistoryBtn')!.addEventListener('click', async () => {
    await renderHistory();
    showView('history');
  });
  document.getElementById('backFromHistory')!.addEventListener('click', () => {
    if (homeSummary) {
      lastTitle = homeTitle;
      lastSummary = homeSummary;
      lastTranscript = homeTranscript;
      transcriptAvailable = homeTranscriptAvailable;
      document.getElementById('videoTitle')!.textContent = homeTitle;
      document.getElementById('summaryContent')!.innerHTML = renderMarkdown(homeSummary);
      document.getElementById('transcriptSection')!.style.display = 'none';
      (document.getElementById('showTranscriptBtn') as HTMLElement).textContent = 'Show Transcript';
      document.getElementById('backHistoryBtn')!.style.display = 'none';
      showView('result');
    } else {
      showView('idle');
    }
  });
  document.getElementById('copyBtn')!.addEventListener('click', async () => {
    await navigator.clipboard.writeText(lastSummary);
    const btn = document.getElementById('copyBtn')!;
    const original = btn.textContent;
    btn.textContent = '✓ Copied!';
    btn.setAttribute('disabled', 'true');
    setTimeout(() => { btn.textContent = original; btn.removeAttribute('disabled'); }, 1500);
  });
  document.getElementById('showTranscriptBtn')!.addEventListener('click', () => {
    const section = document.getElementById('transcriptSection')!;
    const btn = document.getElementById('showTranscriptBtn')!;
    if (section.style.display === 'none') {
      if (transcriptAvailable && lastTranscript) {
        document.getElementById('transcriptContent')!.textContent = lastTranscript;
      } else {
        document.getElementById('transcriptContent')!.textContent = 'Transcript not available for this entry.';
      }
      section.style.display = 'block';
      btn.textContent = 'Hide Transcript';
    } else {
      section.style.display = 'none';
      btn.textContent = 'Show Transcript';
    }
  });
  const tab = await getActiveTab();
  if (tab?.url) {
    const videoId = extractVideoId(tab.url);
    if (videoId) {
      const pendingId = await getPendingVideoId();
      if (pendingId === videoId) {
        await removePendingVideoId();
        await startSummary();
        return;
      }
      const history = await getHistory();
      const cached = history.find(h => h.videoId === videoId);
      if (cached) {
        lastTitle = cached.videoTitle;
        lastSummary = cached.summary;
        lastTranscript = cached.transcript || '';
        transcriptAvailable = !!cached.transcript;
        document.getElementById('videoTitle')!.textContent = cached.videoTitle;
        document.getElementById('summaryContent')!.innerHTML = renderMarkdown(cached.summary);
        document.getElementById('transcriptSection')!.style.display = 'none';
        (document.getElementById('showTranscriptBtn') as HTMLElement).textContent = 'Show Transcript';
        document.getElementById('backHistoryBtn')!.style.display = 'none';
        homeTitle = lastTitle;
        homeSummary = lastSummary;
        homeTranscript = lastTranscript;
        homeTranscriptAvailable = transcriptAvailable;
        showView('result');
        return;
      }
      await startSummary();
      return;
    }
  }
  showView('idle');
}

document.addEventListener('DOMContentLoaded', initPopup);
