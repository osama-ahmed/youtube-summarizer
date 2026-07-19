import { LLMProviderId } from '../lib/types';
import { PROVIDER_DEFAULTS, AVAILABLE_MODELS } from '../config';
import {
  getProvider, getApiKey, getModel, getTheme, setProvider, setApiKey, setModel, setOnboardingComplete, isOnboardingComplete,
} from '../lib/storage';
import { validateApiKey } from '../lib/llm';

const STEP_TITLES = ['Pick a Provider', 'Get Your Key', 'Paste Key'];

const PROVIDER_INFO: Record<LLMProviderId, { label: string; consoleUrl: string; consoleLabel: string; keyHint: string }> = {
  gemini: {
    label: 'Gemini',
    consoleUrl: 'https://aistudio.google.com/app/apikey',
    consoleLabel: 'Gemini API Console',
    keyHint: 'AIza...',
  },
  openai: {
    label: 'OpenAI',
    consoleUrl: 'https://platform.openai.com/api-keys',
    consoleLabel: 'OpenAI API Console',
    keyHint: 'sk-...',
  },
  anthropic: {
    label: 'Anthropic',
    consoleUrl: 'https://console.anthropic.com/settings/keys',
    consoleLabel: 'Anthropic Console',
    keyHint: 'sk-ant-...',
  },
  deepseek: {
    label: 'DeepSeek',
    consoleUrl: 'https://platform.deepseek.com/api_keys',
    consoleLabel: 'DeepSeek Platform',
    keyHint: 'sk-...',
  },
  xai: {
    label: 'xAI (Grok)',
    consoleUrl: 'https://console.x.ai',
    consoleLabel: 'xAI Console',
    keyHint: 'xai-...',
  },
};

let currentStep = 0;
let selectedProvider: LLMProviderId = 'gemini';

function populateModels(provider: LLMProviderId) {
  const select = document.getElementById('modelSelect') as HTMLSelectElement;
  const models = AVAILABLE_MODELS[provider] || [];
  const defaultModel = PROVIDER_DEFAULTS[provider].model;
  select.innerHTML = models.map(m =>
    `<option value="${m}" ${m === defaultModel ? 'selected' : ''}>${m}</option>`
  ).join('');
}

function showStep(step: number) {
  currentStep = step;
  const titles = ['step1', 'step2', 'step3'] as const;
  titles.forEach((id, i) => {
    const el = document.getElementById(id)!;
    el.style.display = i === step ? 'block' : 'none';
  });
  document.getElementById('stepSuccess')!.style.display = 'none';
  document.getElementById('stepIndicator')!.textContent = `Step ${step + 1} of 3`;
  document.getElementById('stepTitle')!.textContent = STEP_TITLES[step];
  document.getElementById('actionButtons')!.style.display = 'flex';
  document.getElementById('successButtons')!.style.display = 'none';
}

function showSuccess() {
  document.getElementById('step1')!.style.display = 'none';
  document.getElementById('step2')!.style.display = 'none';
  document.getElementById('step3')!.style.display = 'none';
  document.getElementById('stepSuccess')!.style.display = 'block';
  document.getElementById('stepIndicator')!.textContent = '';
  document.getElementById('stepTitle')!.textContent = 'All Set!';
  document.getElementById('actionButtons')!.style.display = 'none';
  document.getElementById('successButtons')!.style.display = 'flex';
}

function updateProviderUI(provider: LLMProviderId) {
  const info = PROVIDER_INFO[provider];
  document.querySelectorAll('.provider-btn').forEach(btn => {
    btn.classList.toggle('selected', btn.getAttribute('data-provider') === provider);
  });

  document.getElementById('providerName2')!.innerHTML = info.label;
  document.getElementById('providerConsoleLabel')!.textContent = info.consoleLabel;
  (document.getElementById('consoleLink') as HTMLAnchorElement).href = info.consoleUrl;
  document.getElementById('keyHint')!.innerHTML = `Keys look like: <code>${info.keyHint}</code>`;
  document.getElementById('providerName3')!.innerHTML = info.label;
  (document.getElementById('apiKeyInput') as HTMLInputElement).placeholder = `Paste your ${info.label} API key`;

  populateModels(provider);
}

async function handleContinue() {
  if (currentStep === 0) {
    showStep(1);
    return;
  }
  if (currentStep === 1) {
    showStep(2);
    return;
  }
  // Step 2: test & save
  const apiKey = (document.getElementById('apiKeyInput') as HTMLInputElement).value.trim();
  if (!apiKey) {
    const status = document.getElementById('validationStatus')!;
    status.textContent = 'Enter an API key first.';
    status.className = 'validation-status error';
    return;
  }

  const btn = document.getElementById('continueBtn') as HTMLButtonElement;
  const status = document.getElementById('validationStatus')!;
  btn.disabled = true;
  status.textContent = 'Testing key...';
  status.className = 'validation-status loading';

  const valid = await validateApiKey(selectedProvider, apiKey);
  if (valid) {
    status.className = 'validation-status valid';
    status.textContent = '✓ Key is valid!';

    await Promise.all([
      setProvider(selectedProvider),
      setModel((document.getElementById('modelSelect') as HTMLSelectElement).value),
      setApiKey(apiKey),
    ]);
    await setOnboardingComplete();
    showSuccess();
  } else {
    status.className = 'validation-status error';
    status.textContent = 'That key didn\'t work. Check and try again.';
    btn.disabled = false;
  }
}

async function handleSkip() {
  await setOnboardingComplete();
  chrome.runtime.openOptionsPage();
}

async function handleFinish() {
  window.close();
}

export async function initOnboarding() {
  const [theme, apiKey, provider] = await Promise.all([
    getTheme(), getApiKey(), getProvider(),
  ]);
  document.documentElement.setAttribute('data-theme', theme);
  const onboarded = await isOnboardingComplete();
  if (onboarded) {
    showSuccess();
    return;
  }

  selectedProvider = apiKey ? provider : 'gemini';
  showStep(0);
  updateProviderUI(selectedProvider);

  if (apiKey) {
    (document.getElementById('apiKeyInput') as HTMLInputElement).value = apiKey;
  }

  document.querySelectorAll('.provider-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedProvider = (btn.getAttribute('data-provider') as LLMProviderId);
      updateProviderUI(selectedProvider);
    });
  });

  document.getElementById('continueBtn')!.addEventListener('click', handleContinue);
  document.getElementById('skipBtn')!.addEventListener('click', handleSkip);
  document.getElementById('finishBtn')!.addEventListener('click', handleFinish);

  document.getElementById('toggleKeyBtn')!.addEventListener('click', () => {
    const input = document.getElementById('apiKeyInput') as HTMLInputElement;
    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';
    document.getElementById('toggleKeyBtn')!.textContent = isPassword ? 'Hide' : 'Show';
  });
}

document.addEventListener('DOMContentLoaded', initOnboarding);
