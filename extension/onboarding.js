(() => {
  let currentSlide = 0;
  const TOTAL_SLIDES = 3;

  const slides = [
    document.getElementById("slide-1"),
    document.getElementById("slide-2"),
    document.getElementById("slide-3"),
  ];

  const dots = [
    document.getElementById("dot-0"),
    document.getElementById("dot-1"),
    document.getElementById("dot-2"),
  ];

  function goToSlide(index) {
    if (index < 0 || index >= TOTAL_SLIDES) return;

    const direction = index > currentSlide ? "forward" : "backward";

    // Exit current slide
    const leaving = slides[currentSlide];
    leaving.classList.remove("active");
    leaving.classList.add(direction === "forward" ? "exit-left" : "exit-right");

    // Remove exit class after transition so it resets
    setTimeout(() => {
      leaving.classList.remove("exit-left", "exit-right");
      leaving.style.position = "absolute";
    }, 420);

    // Enter next slide
    const entering = slides[index];
    entering.style.position = "relative";
    entering.style.transform = direction === "forward" ? "translateX(40px)" : "translateX(-40px)";
    entering.style.opacity = "0";
    entering.style.pointerEvents = "none";

    // Trigger reflow then animate in
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        entering.style.transform = "";
        entering.style.opacity = "";
        entering.classList.add("active");
        entering.style.pointerEvents = "";
      });
    });

    // Update dots
    dots[currentSlide].classList.remove("active");
    dots[index].classList.add("active");

    currentSlide = index;
  }

  // Dot navigation
  dots.forEach((dot, index) => {
    dot.addEventListener("click", () => goToSlide(index));
  });

  // Slide 1 → 2 (save language first)
  document.getElementById("slide-1-next").addEventListener("click", async () => {
    const langSelect = document.getElementById("language-select");
    const selectedLang = langSelect ? langSelect.value : "Bengali";
    try {
      await chrome.storage.sync.set({ nativeLanguage: selectedLang });
    } catch (_err) {
      // Non-blocking — proceed regardless
    }
    goToSlide(1);
  });

  // Slide 2 → back / → 3
  document.getElementById("slide-2-back").addEventListener("click", () => goToSlide(0));
  document.getElementById("slide-2-next").addEventListener("click", () => goToSlide(2));

  // Slide 3 — Open Settings
  document.getElementById("open-settings-btn").addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
    window.close();
  });

  // Slide 3 — Skip
  document.getElementById("skip-btn").addEventListener("click", () => {
    window.close();
  });
})();
