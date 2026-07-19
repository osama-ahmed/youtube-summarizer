import {
  getProvider, getApiKey, getModel,
  getGaEnabled, getTheme, setProvider, setApiKey, setModel,
  setGaEnabled, setTheme,
} from '../lib/storage';
import { LLMProviderId } from '../lib/types';
import { PROVIDER_DEFAULTS, AVAILABLE_MODELS, MODEL_LABELS } from '../config';
import { validateApiKey } from '../lib/llm';

function populateModels(provider: LLMProviderId, selectEl: HTMLSelectElement, currentModel: string) {
  const models = AVAILABLE_MODELS[provider] || [];
  const defaultModel = PROVIDER_DEFAULTS[provider].model;
  selectEl.innerHTML = models.map(m =>
    `<option value="${m}" ${(m === currentModel || (!currentModel && m === defaultModel)) ? 'selected' : ''}>${MODEL_LABELS[m] || m}</option>`
  ).join('');
}

function applyTheme(theme: 'light' | 'dark') {
  document.documentElement.setAttribute('data-theme', theme);
}

export async function initOptions() {
  const providerEl = document.getElementById('provider') as HTMLSelectElement;
  const modelEl = document.getElementById('model') as HTMLSelectElement;
  const apiKeyEl = document.getElementById('apiKey') as HTMLInputElement;
  const toggleKeyBtn = document.getElementById('toggleKey') as HTMLButtonElement;
  const validateBtn = document.getElementById('validateKey') as HTMLButtonElement;
  const validationStatus = document.getElementById('validationStatus') as HTMLSpanElement;
  const saveBtn = document.getElementById('saveBtn') as HTMLButtonElement;
  const saveStatus = document.getElementById('saveStatus') as HTMLSpanElement;
  const gaEnabled = document.getElementById('gaEnabled') as HTMLInputElement;
  const themeSelect = document.getElementById('themeSelect') as HTMLSelectElement;

  const [
    provider, apiKey, model, ga, theme,
  ] = await Promise.all([
    getProvider(), getApiKey(), getModel(), getGaEnabled(), getTheme(),
  ]);

  applyTheme(theme);
  providerEl.value = provider;
  populateModels(provider, modelEl, model);
  apiKeyEl.value = apiKey;
  gaEnabled.checked = ga;
  themeSelect.value = theme;

  providerEl.addEventListener('change', () => {
    const newProvider = providerEl.value as LLMProviderId;
    populateModels(newProvider, modelEl, '');
  });

  toggleKeyBtn.addEventListener('click', () => {
    const isPassword = apiKeyEl.type === 'password';
    apiKeyEl.type = isPassword ? 'text' : 'password';
    toggleKeyBtn.textContent = isPassword ? 'Hide' : 'Show';
  });

  validateBtn.addEventListener('click', async () => {
    const prov = providerEl.value as LLMProviderId;
    const key = apiKeyEl.value.trim();
    if (!key) { validationStatus.textContent = 'Enter an API key first.'; return; }
    validationStatus.textContent = 'Validating…';
    validateBtn.disabled = true;
    const valid = await validateApiKey(prov, key);
    validationStatus.textContent = valid ? '✓ Key is valid' : '✗ Key rejected';
    validationStatus.style.color = valid ? '#16a34a' : '#dc2626';
    validateBtn.disabled = false;
  });

  themeSelect.addEventListener('change', async () => {
    const newTheme = themeSelect.value as 'light' | 'dark';
    await setTheme(newTheme);
    applyTheme(newTheme);
    saveStatus.textContent = '✓ Saved';
    setTimeout(() => { saveStatus.textContent = ''; }, 2000);
  });

  saveBtn.addEventListener('click', async () => {
    const prov = providerEl.value as LLMProviderId;
    await Promise.all([
      setProvider(prov),
      setModel(modelEl.value),
      setApiKey(apiKeyEl.value.trim()),
      setGaEnabled(gaEnabled.checked),
    ]);
    saveStatus.textContent = '✓ Saved';
    setTimeout(() => { saveStatus.textContent = ''; }, 2000);
  });

  document.getElementById('privacyLink')!.addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: chrome.runtime.getURL('privacy.html') });
  });
}

document.addEventListener('DOMContentLoaded', initOptions);
