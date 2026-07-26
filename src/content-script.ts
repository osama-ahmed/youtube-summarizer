import { fetchTranscript as youtubeFetchTranscript } from 'youtube-transcript';

let currentUrl = location.href;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

function notifyPopup() {
  try {
    chrome.runtime.sendMessage({ type: 'URL_CHANGED', url: location.href }).catch(() => console.error('cs: failed to notify popup'));
  } catch {
    console.error('cs: extension context invalidated');
  }
}

function handleUrlChange() {
  if (location.href !== currentUrl) {
    currentUrl = location.href;
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(notifyPopup, 100);
  }
}

chrome.runtime.onMessage.addListener((msg: any, _sender, sendResponse) => {
  if (msg.type === 'FETCH_TRANSCRIPT') {
    youtubeFetchTranscript(msg.videoId)
      .then(segments => { try { sendResponse({ segments }); } catch { console.error('cs: failed to send transcript response'); } })
      .catch(err => { try { sendResponse({ error: err.message }); } catch { console.error('cs: failed to send error response', err); } });
    return true;
  }
});

const observer = new MutationObserver(handleUrlChange);
observer.observe(document.body, { childList: true, subtree: true });
notifyPopup();
