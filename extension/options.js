import { getProviderEntries, getProvider } from "./lib/providers.js";
import { getProviderConfig, getNativeLanguage, saveProviderConfig, setNativeLanguage, getChineseVoiceName, setChineseVoiceName } from "./lib/storage.js";

const form = document.getElementById("settings-form");
const providerSelect = document.getElementById("provider");
const modelInput = document.getElementById("model");
const apiKeyInput = document.getElementById("api-key");
const langSelect = document.getElementById("options-language-select");
const status = document.getElementById("status");

const voiceForm = document.getElementById("voice-form");
const voiceSelect = document.getElementById("voice-select");
const testVoiceBtn = document.getElementById("test-voice-btn");
const voiceStatus = document.getElementById("voice-status");
const voiceSaveStatus = document.getElementById("voice-save-status");

function setStatus(message) {
  status.textContent = message;
}

function renderProviderOptions() {
  // 1. Clear the select box safely
  providerSelect.textContent = "";

  // 2. Loop through and create real Option objects
  getProviderEntries().forEach((provider) => {
    // Syntax: new Option(text, value)
    const opt = new Option(provider.label, provider.id);
    providerSelect.add(opt);
  });
}

// Voice quality scoring — higher = better quality
function scoreVoice(voice) {
  const name = voice.name || "";
  if (name.includes("Natural") || name.includes("Online") || name.includes("Neural")) return 3;
  if (name.includes("Microsoft") || name.includes("Google")) return 2;
  return 1;
}

function populateVoiceSelect(savedVoiceName) {
  const voices = window.speechSynthesis.getVoices();
  const chineseVoices = voices
    .filter(v => v.lang.startsWith("zh"))
    .sort((a, b) => scoreVoice(b) - scoreVoice(a));

  // 1. Clear the dropdown safely
  voiceSelect.textContent = "";

  if (chineseVoices.length === 0) {
    voiceStatus.textContent = "No Chinese voices found on this system. Install a Chinese voice in your OS settings.";
    // Use the Option constructor: new Option(text, value)
    voiceSelect.add(new Option("— No Chinese voices available —", ""));
    return;
  }

  voiceStatus.textContent = `${chineseVoices.length} Chinese voice${chineseVoices.length > 1 ? "s" : ""} found.`;

  // 2. Loop and add real Option objects
  chineseVoices.forEach(v => {
    const isHighQuality = scoreVoice(v) === 3;
    const label = `${isHighQuality ? "✦ " : ""}${v.name} (${v.lang})`;

    // Syntax: new Option(text, value, defaultSelected, selected)
    const isSelected = v.name === savedVoiceName;
    const opt = new Option(label, v.name, isSelected, isSelected);

    voiceSelect.add(opt);
  });

  // 3. Handle status message for missing saved preference
  if (savedVoiceName && !chineseVoices.find(v => v.name === savedVoiceName)) {
    voiceStatus.textContent += " (Saved voice not found — showing best available.)";
  }
}

async function loadVoiceSettings() {
  const savedVoiceName = await getChineseVoiceName();

  const tryPopulate = () => {
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      populateVoiceSelect(savedVoiceName);
      return true;
    }
    return false;
  };

  // 1. Try immediately
  if (!tryPopulate()) {
    // 2. If empty, listen for the event
    window.speechSynthesis.onvoiceschanged = () => {
      tryPopulate();
      // Clean up the listener so it doesn't fire multiple times
      window.speechSynthesis.onvoiceschanged = null;
    };

    // 3. Fail-safe: Try again in 1 second just in case
    setTimeout(tryPopulate, 1000);
  }
}

function syncModelPlaceholder() {
  const provider = getProvider(providerSelect.value);
  if (!provider) return;

  modelInput.placeholder = provider.defaultModel || "";
  apiKeyInput.placeholder = provider.apiKeyPlaceholder || "Enter API Key";

  if (!modelInput.value.trim()) {
    modelInput.value = provider.defaultModel || "";
  }
}

async function loadSettings() {
  renderProviderOptions();

  const [config, nativeLanguage] = await Promise.all([
    getProviderConfig(),
    getNativeLanguage(),
  ]);

  providerSelect.value = config.provider;
  modelInput.value = config.model;
  apiKeyInput.value = config.apiKey;
  if (langSelect) langSelect.value = nativeLanguage;
  syncModelPlaceholder();
  setStatus("Ready");

  await loadVoiceSettings();
}

providerSelect.addEventListener("change", () => {
  const provider = getProvider(providerSelect.value);
  modelInput.value = provider.defaultModel;
  syncModelPlaceholder();
  setStatus("Unsaved changes");
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const nextConfig = {
    provider: providerSelect.value,
    model: modelInput.value.trim(),
    apiKey: apiKeyInput.value.trim(),
  };

  if (!nextConfig.apiKey) {
    setStatus("API key required");
    return;
  }

  const selectedLang = langSelect ? langSelect.value : "Bengali";
  await Promise.all([
    saveProviderConfig(nextConfig),
    setNativeLanguage(selectedLang),
  ]);
  setStatus("Saved");
});

voiceForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const selectedVoice = voiceSelect.value;
  if (!selectedVoice) {
    voiceSaveStatus.textContent = "No voice selected.";
    return;
  }
  await setChineseVoiceName(selectedVoice);
  voiceSaveStatus.textContent = "Voice saved!";
  setTimeout(() => { voiceSaveStatus.textContent = ""; }, 2000);
});

testVoiceBtn.addEventListener("click", () => {
  const selectedVoiceName = voiceSelect.value;
  if (!selectedVoiceName) return;

  const voices = window.speechSynthesis.getVoices();
  const voice = voices.find(v => v.name === selectedVoiceName);
  if (!voice) return;

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance("你好，欢迎使用 LexiDrop！");
  utterance.voice = voice;
  utterance.lang = "zh-CN";
  utterance.rate = 0.85;
  window.speechSynthesis.speak(utterance);
});

loadSettings();
