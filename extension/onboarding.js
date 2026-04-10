(() => {
  const startBtn = document.getElementById("start-learning-btn");
  const connectionCodeInput = document.getElementById("connection-code");
  const successOverlay = document.getElementById("success-overlay");

  startBtn.addEventListener("click", async () => {
    const rawCode = connectionCodeInput.value.trim();
    if (!rawCode) {
      connectionCodeInput.style.border = "1px solid var(--accent-red, #ff5c5c)";
      return;
    }

    // Set border back to normal
    connectionCodeInput.style.border = "1px solid var(--border)";

    try {
      // Setup the zero-friction $0 model
      const nextConfig = {
        provider: "openrouter",
        model: "google/gemini-2.0-flash-001",
        apiKey: rawCode,
      };

      await chrome.storage.sync.set({
        providerConfig: nextConfig
      });

      // Show success animation
      successOverlay.classList.remove("hidden");
      successOverlay.classList.add("fade-in");

      // Auto-close Window
      setTimeout(() => {
        window.close();
      }, 2000);
      
    } catch (err) {
      console.error("Failed to save config", err);
    }
  });

  // Small UX detail: trigger on 'Enter' key
  connectionCodeInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      startBtn.click();
    }
  });
})();
