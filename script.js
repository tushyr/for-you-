// --- Global Elements ---
const body = document.body;

// --- Music Logic ---
const musicToggle = document.getElementById("music-toggle");
const audio = document.getElementById("background-music");
const soundOnIcon = document.getElementById("sound-on-icon");
const soundOffIcon = document.getElementById("sound-off-icon");
let isPlaying = false;

musicToggle.addEventListener("click", () => {
  if (audio.src) {
    if (isPlaying) {
      audio.pause();
      soundOnIcon.classList.add("hidden");
      soundOffIcon.classList.remove("hidden");
    } else {
      audio.play();
      soundOnIcon.classList.remove("hidden");
      soundOffIcon.classList.add("hidden");
    }
    isPlaying = !isPlaying;
  }
});

// --- Letter Box Logic ---
const letterModal = document.getElementById("letter-modal");
const letterComposerModal = document.getElementById("letter-composer-modal");
const openLetterModalButton = document.getElementById("open-letter-modal");
const closeLetterModalButton = document.getElementById("close-letter-modal");
const createNewLetterButton = document.getElementById("create-new-letter");
const backToInboxButton = document.getElementById("back-to-inbox");
const closeComposerModalButton = document.getElementById("close-composer-modal");
const saveLetterButton = document.getElementById("save-letter-button");
const letterTextarea = document.getElementById("letter-textarea");
const letterFontSelector = document.getElementById("letter-font-selector");
const pastLettersContainer = document.getElementById("past-letters-container");
const letterNotificationDot = document.getElementById(
  "letter-notification-dot",
);
const letterReadingPane = document.getElementById("letter-reading-pane");
const letterIcon = document.getElementById("weather-animation");

let localLetters = [];
let selectedLetterFont = localStorage.getItem('selectedLetterFont') || 'font-letter';

// Apply saved font preference
if (letterFontSelector) {
  letterFontSelector.value = selectedLetterFont;
  letterTextarea.className = letterTextarea.className.replace(/font-letter[\w-]*/g, '') + ' ' + selectedLetterFont;
}

// Font selector change handler
if (letterFontSelector) {
  letterFontSelector.addEventListener('change', (e) => {
    selectedLetterFont = e.target.value;
    localStorage.setItem('selectedLetterFont', selectedLetterFont);
    letterTextarea.className = letterTextarea.className.replace(/font-letter[\w-]*/g, '') + ' ' + selectedLetterFont;
  });
}

// Load letters from sync API
async function loadLetters() {
  try {
    localLetters = await window.SyncAPI.getLetters();
    renderLetters();
  } catch (error) {
    console.error('Failed to load letters:', error);
    // Fallback to localStorage
    localLetters = JSON.parse(localStorage.getItem(CONFIG.storage.letters) || '[]');
    renderLetters();
  }
}

openLetterModalButton.addEventListener("click", () => {
  letterModal.classList.remove("hidden");
  setTimeout(() => letterModal.classList.add("visible"), 10);
  localStorage.setItem(
    CONFIG.storage.lastOpenedLetters,
    new Date().toISOString(),
  );
  checkUnreadLetters();

  // Add animation interaction feedback
  if (letterIcon) {
    letterIcon.style.transform = "scale(0.9)";
    setTimeout(() => {
      letterIcon.style.transform = "";
    }, 150);
  }
});

closeLetterModalButton.addEventListener("click", () => {
  letterModal.classList.remove("visible");
  setTimeout(() => letterModal.classList.add("hidden"), 400);
});

createNewLetterButton.addEventListener("click", () => {
  letterModal.classList.remove("visible");
  setTimeout(() => {
    letterModal.classList.add("hidden");
    letterComposerModal.classList.remove("hidden");
    setTimeout(() => letterComposerModal.classList.add("visible"), 10);
  }, 200);
});

backToInboxButton.addEventListener("click", () => {
  letterComposerModal.classList.remove("visible");
  setTimeout(() => {
    letterComposerModal.classList.add("hidden");
    letterModal.classList.remove("hidden");
    setTimeout(() => letterModal.classList.add("visible"), 10);
  }, 200);
});

closeComposerModalButton.addEventListener("click", () => {
  letterComposerModal.classList.remove("visible");
  setTimeout(() => letterComposerModal.classList.add("hidden"), 400);
});

saveLetterButton.addEventListener("click", async () => {
  const text = letterTextarea.value.trim();
  if (text) {
    const newLetter = {
      id: Date.now(),
      text,
      font: selectedLetterFont,
      createdAt: new Date().toISOString(),
    };
    try {
      await window.SyncAPI.saveLetter(newLetter);
      letterTextarea.value = "";
      await loadLetters();
      
      // Close composer and go back to inbox
      letterComposerModal.classList.remove("visible");
      setTimeout(() => {
        letterComposerModal.classList.add("hidden");
        letterModal.classList.remove("hidden");
        setTimeout(() => letterModal.classList.add("visible"), 10);
      }, 200);
    } catch (error) {
      console.error('Failed to save letter:', error);
      // Fallback to local storage
      localLetters.push(newLetter);
      localStorage.setItem(CONFIG.storage.letters, JSON.stringify(localLetters));
      letterTextarea.value = "";
      renderLetters();
      
      // Close composer and go back to inbox
      letterComposerModal.classList.remove("visible");
      setTimeout(() => {
        letterComposerModal.classList.add("hidden");
        letterModal.classList.remove("hidden");
        setTimeout(() => letterModal.classList.add("visible"), 10);
      }, 200);
    }
  }
});

function renderLetters() {
  if (!pastLettersContainer) return;
  
  pastLettersContainer.innerHTML = "";
  localLetters.forEach((letter) => {
    const letterCard = document.createElement("div");
    letterCard.className =
      "list-card p-3 bg-white/30 dark:bg-black/20 rounded-lg cursor-pointer hover:bg-white/40 dark:hover:bg-black/30 transition-colors";
    letterCard.dataset.letterId = letter.id;
    const date = new Date(letter.createdAt);
    const preview = letter.text.substring(0, 50) + (letter.text.length > 50 ? "..." : "");
    const fontClass = letter.font || 'font-letter';
    letterCard.innerHTML = `
      <div class="text-xs text-gray-600 dark:text-gray-400 mb-1">${date.toLocaleDateString()}</div>
      <div class="text-sm text-gray-800 dark:text-gray-100 ${fontClass}">${preview}</div>
    `;
    pastLettersContainer.appendChild(letterCard);
  });
  
  if (localLetters.length === 0) {
    pastLettersContainer.innerHTML = `
      <div class="text-center text-gray-500 dark:text-gray-400 py-8">
        <p class="text-sm">No letters yet</p>
        <p class="text-xs mt-2">Create your first letter to get started</p>
      </div>
    `;
  }
}

pastLettersContainer.addEventListener("click", (e) => {
  const card = e.target.closest(".list-card");
  if (card) {
    const letter = localLetters.find(
      (l) => l.id === Number(card.dataset.letterId),
    );
    if (letter) displayLetter(letter);
  }
});

function displayLetter(letter) {
  if (!letterReadingPane) return;
  
  const date = new Date(letter.createdAt);
  const fontClass = letter.font || 'font-letter';
  letterReadingPane.innerHTML = `
    <div class="mb-4 text-sm text-gray-600 dark:text-gray-400">${date.toLocaleDateString()} at ${date.toLocaleTimeString()}</div>
    <div class="whitespace-pre-wrap ${fontClass}">${letter.text}</div>
  `;
  document
    .querySelectorAll("#past-letters-container .list-card")
    .forEach((c) => c.classList.remove("active"));
  const activeCard = document.querySelector(
    `#past-letters-container .list-card[data-letter-id='${letter.id}']`,
  );
  if (activeCard) activeCard.classList.add("active");
}

function checkUnreadLetters() {
  const lastOpened = localStorage.getItem(CONFIG.storage.lastOpenedLetters);
  if (!lastOpened && localLetters.length > 0) {
    letterNotificationDot.classList.remove("hidden");
    // Weather animation doesn't need src updates
    return;
  }
  const hasUnread = localLetters.some(
    (letter) => new Date(letter.date) > new Date(lastOpened),
  );
  letterNotificationDot.classList.toggle("hidden", !hasUnread);

  // Weather animation doesn't need src updates for unread status
  // But we can add visual feedback for unread letters
  if (letterIcon && hasUnread) {
    letterIcon.style.filter = "brightness(1.3)";
  } else if (letterIcon) {
    letterIcon.style.filter = "brightness(1)";
  }
}

// --- Message in a Bottle Logic ---
const bottleModal = document.getElementById("bottle-modal");
const bottleComposerModal = document.getElementById("bottle-composer-modal");
const openBottleModalButton = document.getElementById("open-bottle-modal");
const closeBottleModalButton = document.getElementById("close-bottle-modal");
const createNewBottleButton = document.getElementById("create-new-bottle");
const backToBottlesButton = document.getElementById("back-to-bottles");
const closeBottleComposerButton = document.getElementById("close-bottle-composer");
const saveBottleButton = document.getElementById("save-bottle-button");
const bottleTextarea = document.getElementById("bottle-textarea");
const bottleFontSelector = document.getElementById("bottle-font-selector");
const unlockDateInput = document.getElementById("unlock-date");
const pastBottlesContainer = document.getElementById("past-bottles-container");
const bottleNotificationDot = document.getElementById(
  "bottle-notification-dot",
);
const bottleReadingPane = document.getElementById("bottle-reading-pane");

let localBottles = [];
let selectedBottleFont = localStorage.getItem('selectedBottleFont') || 'font-letter';

// Apply saved font preference
if (bottleFontSelector) {
  bottleFontSelector.value = selectedBottleFont;
  bottleTextarea.className = bottleTextarea.className.replace(/font-letter[\w-]*/g, '') + ' ' + selectedBottleFont;
}

// Font selector change handler
if (bottleFontSelector) {
  bottleFontSelector.addEventListener('change', (e) => {
    selectedBottleFont = e.target.value;
    localStorage.setItem('selectedBottleFont', selectedBottleFont);
    bottleTextarea.className = bottleTextarea.className.replace(/font-letter[\w-]*/g, '') + ' ' + selectedBottleFont;
  });
}

// Load bottles from sync API
async function loadBottles() {
  try {
    localBottles = await window.SyncAPI.getBottles();
    renderBottles();
  } catch (error) {
    console.error('Failed to load bottles:', error);
    // Fallback to localStorage
    localBottles = JSON.parse(localStorage.getItem(CONFIG.storage.bottles) || '[]');
    renderBottles();
  }
}

function setMinUnlockDate() {
  const today = new Date();
  today.setDate(today.getDate() + 1);
  unlockDateInput.min = today.toISOString().split("T")[0];
  unlockDateInput.value = unlockDateInput.min;
}

openBottleModalButton.addEventListener("click", () => {
  bottleModal.classList.remove("hidden");
  setTimeout(() => bottleModal.classList.add("visible"), 10);
  localStorage.setItem(
    CONFIG.storage.lastOpenedBottles,
    new Date().toISOString(),
  );
  checkUnreadBottles();
});

closeBottleModalButton.addEventListener("click", () => {
  bottleModal.classList.remove("visible");
  setTimeout(() => bottleModal.classList.add("hidden"), 400);
});

if (createNewBottleButton) {
  createNewBottleButton.addEventListener("click", () => {
    bottleModal.classList.remove("visible");
    setTimeout(() => {
      bottleModal.classList.add("hidden");
      bottleComposerModal.classList.remove("hidden");
      setTimeout(() => bottleComposerModal.classList.add("visible"), 10);
    }, 200);
  });
}

if (backToBottlesButton) {
  backToBottlesButton.addEventListener("click", () => {
    bottleComposerModal.classList.remove("visible");
    setTimeout(() => {
      bottleComposerModal.classList.add("hidden");
      bottleModal.classList.remove("hidden");
      setTimeout(() => bottleModal.classList.add("visible"), 10);
    }, 200);
  });
}

if (closeBottleComposerButton) {
  closeBottleComposerButton.addEventListener("click", () => {
    bottleComposerModal.classList.remove("visible");
    setTimeout(() => bottleComposerModal.classList.add("hidden"), 400);
  });
}

saveBottleButton.addEventListener("click", async () => {
  const text = bottleTextarea.value.trim();
  const unlockDate = unlockDateInput.value;
  if (text && unlockDate) {
    const newBottle = {
      id: Date.now(),
      text,
      font: selectedBottleFont,
      unlockDate,
      createdAt: new Date().toISOString(),
    };
    try {
      await window.SyncAPI.saveBottle(newBottle);
      bottleTextarea.value = "";
      setMinUnlockDate();
      await loadBottles();
    } catch (error) {
      console.error('Failed to save bottle:', error);
      // Fallback to local storage
      localBottles.push(newBottle);
      localStorage.setItem(CONFIG.storage.bottles, JSON.stringify(localBottles));
      bottleTextarea.value = "";
      setMinUnlockDate();
      renderBottles();
      
      // Close composer and go back to inbox
      bottleComposerModal.classList.remove("visible");
      setTimeout(() => {
        bottleComposerModal.classList.add("hidden");
        bottleModal.classList.remove("hidden");
        setTimeout(() => bottleModal.classList.add("visible"), 10);
      }, 200);
    }
  }
});

function renderBottles() {
  if (!pastBottlesContainer) return;
  
  pastBottlesContainer.innerHTML = "";
  localBottles.forEach((bottle) => {
    const bottleCard = document.createElement("div");
    const isLocked = new Date(bottle.unlockDate) > new Date();
    bottleCard.className = isLocked
      ? "list-card p-3 bg-gray-200/30 dark:bg-gray-700/30 rounded-lg opacity-60 cursor-not-allowed locked"
      : "list-card p-3 bg-white/30 dark:bg-black/20 rounded-lg cursor-pointer hover:bg-white/40 dark:hover:bg-black/30 transition-colors";
    bottleCard.dataset.bottleId = bottle.id;
    const date = new Date(bottle.unlockDate);
    const fontClass = bottle.font || 'font-letter';
    const preview = isLocked
      ? "Locked until " + date.toLocaleDateString()
      : bottle.text.substring(0, 50) + (bottle.text.length > 50 ? "..." : "");
    bottleCard.innerHTML = `
      <div class="text-xs text-gray-600 dark:text-gray-400 mb-1">
        ${isLocked ? "" : ""} ${date.toLocaleDateString()}
      </div>
      <div class="text-sm text-gray-800 dark:text-gray-100 ${fontClass}">${preview}</div>
    `;
    pastBottlesContainer.appendChild(bottleCard);
  });
  const now = new Date();

  if (localBottles.length === 0) {
    pastBottlesContainer.innerHTML = `
      <div class="text-center text-gray-500 dark:text-gray-400 py-8">
        <p class="text-sm">No bottles yet</p>
        <p class="text-xs mt-2">Create your first bottle to get started</p>
      </div>
    `;
  }
}

pastBottlesContainer.addEventListener("click", (e) => {
  const card = e.target.closest(".list-card:not(.locked)");
  if (card) {
    const bottle = localBottles.find(
      (b) => b.id === Number(card.dataset.bottleId),
    );
    if (bottle) displayBottle(bottle);
  }
});

function displayBottle(bottle) {
  if (!bottleReadingPane) return;
  
  const isLocked = new Date(bottle.unlockDate) > new Date();
  if (isLocked) {
    bottleReadingPane.innerHTML = `
      <div class="text-center mt-20">
        <div class="text-6xl mb-4">🔒</div>
        <p class="text-xl text-gray-600 dark:text-gray-400">This bottle is locked</p>
        <p class="text-sm text-gray-500 dark:text-gray-500 mt-2">It will unlock on ${new Date(
          bottle.unlockDate,
        ).toLocaleDateString()}</p>
      </div>
    `;
  } else {
    const date = new Date(bottle.createdAt);
    const fontClass = bottle.font || 'font-letter';
    bottleReadingPane.innerHTML = `
      <div class="mb-4 text-sm text-gray-600 dark:text-gray-400">${date.toLocaleDateString()} at ${date.toLocaleTimeString()}</div>
      <div class="whitespace-pre-wrap ${fontClass}">${bottle.text}</div>
    `;
  }
  if (activeCard) activeCard.classList.add("active");
}

function checkUnreadBottles() {
  const lastOpened = localStorage.getItem(CONFIG.storage.lastOpenedBottles);
  if (!lastOpened) return;

  const now = new Date();
  const hasNewlyUnlocked = localBottles.some((b) => {
    const unlockDate = new Date(b.unlockDate);
    unlockDate.setHours(0, 0, 0, 0);
    return now >= unlockDate && unlockDate > new Date(lastOpened);
  });
  bottleNotificationDot.classList.toggle("hidden", !hasNewlyUnlocked);
}

// --- Dark Mode Logic ---
const themeToggleIcon = document.getElementById("theme-toggle-icon");
const themeToggleButton = document.getElementById("theme-toggle");

themeToggleButton.addEventListener("click", function () {
  document.documentElement.classList.toggle("dark");

  const isDark = document.documentElement.classList.contains("dark");
  const currentWeatherClass = body.className.match(/weather-(\w+)/)?.[1] || 'clear';
  
  if (isDark) {
    localStorage.setItem(CONFIG.storage.theme, "dark");
    body.className = `weather-${currentWeatherClass} dark`;
    // In dark mode, show light mode icon (to switch to light)
    if (themeToggleIcon) {
      themeToggleIcon.src = "resources/icons/when_light_mode.svg";
      themeToggleIcon.alt = "Switch to Light Mode";
    }
  } else {
    localStorage.setItem(CONFIG.storage.theme, "light");
    body.className = `weather-${currentWeatherClass} light`;
    // In light mode, show dark mode icon (to switch to dark)
    if (themeToggleIcon) {
      themeToggleIcon.src = "resources/icons/when_dark_mode.svg";
      themeToggleIcon.alt = "Switch to Dark Mode";
    }
  }
  updateConstellationFeatureVisibility();
});

function setInitialTheme() {
  const isDark = localStorage.getItem(CONFIG.storage.theme) === "dark" ||
    (!(CONFIG.storage.theme in localStorage) &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);
      
  if (isDark) {
    document.documentElement.classList.add("dark");
    body.className = "weather-clear dark"; // Default until weather loads
    // In dark mode, show light mode icon (to switch to light)
    if (themeToggleIcon) {
      themeToggleIcon.src = "resources/icons/when_light_mode.svg";
      themeToggleIcon.alt = "Switch to Light Mode";
    }
  } else {
    document.documentElement.classList.remove("dark");
    body.className = "weather-clear light"; // Default until weather loads
    // In light mode, show dark mode icon (to switch to dark)
    if (themeToggleIcon) {
      themeToggleIcon.src = "resources/icons/when_dark_mode.svg";
      themeToggleIcon.alt = "Switch to Dark Mode";
    }
  }
}

// --- Animated Background & Shared Sky ---
const bgCanvas = document.getElementById("animated-bg");
const weatherCanvas = document.getElementById("weather-overlay");
const lightningCanvas = document.getElementById("lightning-overlay");
const cloudsCanvas = document.getElementById("clouds-overlay");
const constellationCanvas = document.getElementById("constellation-overlay");

const bgCtx = bgCanvas.getContext("2d");
const weatherCtx = weatherCanvas.getContext("2d");
const lightningCtx = lightningCanvas.getContext("2d");
const cloudsCtx = cloudsCanvas.getContext("2d");
const constellationCtx = constellationCanvas.getContext("2d");

const weatherStatusElement = document.getElementById("weather-status");
const constellationToggle = document.getElementById("constellation-toggle");

function resizeCanvases() {
  bgCanvas.width =
    weatherCanvas.width =
    lightningCanvas.width =
    cloudsCanvas.width =
    constellationCanvas.width =
      window.innerWidth;
  bgCanvas.height =
    weatherCanvas.height =
    lightningCanvas.height =
    cloudsCanvas.height =
    constellationCanvas.height =
      window.innerHeight;
}

let stars = [],
  raindrops = [],
  clouds = [],
  interactiveStars = [];
let constellationLines =
  JSON.parse(localStorage.getItem(CONFIG.storage.constellations)) || [];
let currentConstellationPoint = null;
let isDrawingConstellations = false;

let sun = {
  x: CONFIG.visuals.sun.x,
  y: CONFIG.visuals.sun.y,
  radius: CONFIG.visuals.sun.radius,
  opacity: 0,
};
let lightningOpacity = 0;
let currentWeatherData = { main: "Clear", name: "your city" };

// Load cloud images
const cloudImages = {};
let cloudsLoaded = false;
let cloudImagesLoading = 0;
let cloudImagesTotal = 0;

function loadCloudImages() {
  const cloudPaths = [
    "resources/clouds/cloud.png",
    // Add more cloud variations here if you create them:
    // "resources/clouds/cloud2.png",
    // "resources/clouds/cloud3.png",
  ];

  cloudImagesTotal = cloudPaths.length;
  cloudImages.variations = [];

  cloudPaths.forEach((path, index) => {
    const cloudImg = new Image();
    cloudImg.onload = function () {
      cloudImages.variations[index] = cloudImg;
      cloudImagesLoading++;
      if (cloudImagesLoading >= cloudImagesTotal) {
        cloudsLoaded = true;
        console.log(`Loaded ${cloudImagesTotal} cloud images`);
      }
    };
    cloudImg.onerror = function () {
      console.warn(`Failed to load cloud image: ${path}`);
      cloudImagesLoading++;
      if (cloudImagesLoading >= cloudImagesTotal) {
        cloudsLoaded = true;
      }
    };
    cloudImg.src = path;
  });
}

// Load and cache custom icons
function loadCustomIcons() {
  const iconPaths = {
    bottle: "resources/icons/bottle.svg",
    goodnight: "resources/icons/goodnight_button.svg",
    mailUnread: "resources/icons/mail_unread.svg",
    mailboxRead: "resources/icons/mailbox_read.svg",
    darkMode: "resources/icons/when_dark_mode.svg",
    lightMode: "resources/icons/when_light_mode.svg",
  };

  Object.entries(iconPaths).forEach(([key, path]) => {
    const img = new Image();
    img.onerror = function () {
      console.warn(`Failed to load custom icon: ${path}`);
    };
    img.src = path; // Preload the icon
  });

  console.log("Custom icons loaded");
}

function setupWeatherParticles(weather) {
  const isThunderstorm = weather === "Thunderstorm";
  const isRain = weather === "Rain" || isThunderstorm || weather === "Drizzle";
  const isCloudy = weather === "Clouds" || isThunderstorm;
  const isSnow = weather === "Snow";

  const rainCount = isThunderstorm
    ? CONFIG.animations.particles.rain.thunderstorm
    : isRain
      ? CONFIG.animations.particles.rain.normal
      : 0;
  raindrops = [];
  for (let i = 0; i < rainCount; i++) {
    raindrops.push(createRaindrop());
  }

  // Add snow particles
  const snowCount = isSnow ? CONFIG.animations.particles.snow : 0;
  for (let i = 0; i < snowCount; i++) {
    raindrops.push(createSnowflake());
  }

  const cloudCount = isCloudy
    ? CONFIG.animations.particles.clouds.normal
    : isSnow
      ? CONFIG.animations.particles.clouds.snow
      : 0;
  clouds = [];
  for (let i = 0; i < cloudCount; i++) {
    clouds.push(createCloud());
  }
}

window.addEventListener("resize", () => {
  resizeCanvases();
  stars = [];
  for (let i = 0; i < CONFIG.animations.stars.count; i++) {
    stars.push(createStar());
  } // Reduced for mobile performance
  setupInteractiveStars();
  setupWeatherParticles(currentWeatherData.main);
});

function createStar() {
  return {
    x: Math.random() * bgCanvas.width,
    y: Math.random() * bgCanvas.height,
    radius: Math.random() * 1.5,
    opacity: Math.random() * 0.5 + 0.2,
    speedX: (Math.random() - 0.5) * 0.3,
    speedY: (Math.random() - 0.5) * 0.3,
  };
}
function createRaindrop() {
  return {
    x: Math.random() * weatherCanvas.width,
    y: Math.random() * -weatherCanvas.height,
    length: Math.random() * 20 + 10,
    speed:
      Math.random() * 5 + (currentWeatherData.main === "Thunderstorm" ? 10 : 5),
  };
}
function createCloud() {
  const isStorm = currentWeatherData.main === "Thunderstorm";
  const baseSize = Math.random() * 100 + 80;
  return {
    x: Math.random() * (cloudsCanvas.width + 300) - 150,
    y: Math.random() * cloudsCanvas.height * 0.5,
    width: baseSize + Math.random() * 60,
    height: baseSize * 0.7 + Math.random() * 30,
    speed: Math.random() * 0.4 + 0.1,
    opacity: Math.random() * (isStorm ? 0.5 : 0.4) + (isStorm ? 0.7 : 0.5),
    scale: 0.6 + Math.random() * 0.8,
    rotation: Math.random() * 30 - 15,
    isDark: isStorm && Math.random() > 0.2,
    imageIndex: Math.floor(Math.random() * cloudImagesTotal),
    driftY: (Math.random() - 0.5) * 0.05,
    pulsePhase: Math.random() * Math.PI * 2,
  };
}

function createSnowflake() {
  return {
    x: Math.random() * weatherCanvas.width,
    y: Math.random() * -weatherCanvas.height,
    radius: Math.random() * 3 + 2,
    speed: Math.random() * 2 + 1,
    drift: Math.random() * 0.5 - 0.25,
    isSnow: true,
  };
}

resizeCanvases();
for (let i = 0; i < CONFIG.animations.stars.count; i++) {
  stars.push(createStar());
} // Reduced for mobile performance

function animate() {
  bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
  weatherCtx.clearRect(0, 0, weatherCanvas.width, weatherCanvas.height);
  lightningCtx.clearRect(0, 0, lightningCanvas.width, lightningCanvas.height);
  cloudsCtx.clearRect(0, 0, cloudsCanvas.width, cloudsCanvas.height);
  constellationCtx.clearRect(
    0,
    0,
    constellationCanvas.width,
    constellationCanvas.height,
  );

  const isDarkMode = document.documentElement.classList.contains("dark");

  if (isDarkMode) {
    // Draw regular stars
    stars.forEach((star) => {
      bgCtx.beginPath();
      bgCtx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      bgCtx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
      bgCtx.fill();
      star.x += star.speedX;
      star.y += star.speedY;
      if (star.x < 0) star.x = bgCanvas.width;
      if (star.x > bgCanvas.width) star.x = 0;
      if (star.y < 0) star.y = bgCanvas.height;
      if (star.y > bgCanvas.height) star.y = 0;
    });

    // Draw constellations if conditions are right
    if (currentWeatherData.main === "Clear") {
      // Draw interactive stars
      interactiveStars.forEach((star) => {
        const pulse = Math.sin(Date.now() / 400 + star.x) * 0.3 + 0.7;
        constellationCtx.beginPath();
        constellationCtx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        constellationCtx.fillStyle = `rgba(255, 255, 255, ${star.opacity * pulse})`;
        constellationCtx.fill();
      });
      // Draw saved lines
      constellationLines.forEach((line) => {
        constellationCtx.beginPath();
        constellationCtx.moveTo(line.start.x, line.start.y);
        constellationCtx.lineTo(line.end.x, line.end.y);
        constellationCtx.strokeStyle = "rgba(255, 255, 255, 0.4)";
        constellationCtx.lineWidth = 1;
        constellationCtx.stroke();
      });
    }
  } else {
    sun.opacity += (1 - sun.opacity) * CONFIG.visuals.sun.opacitySpeed;
    if (sun.opacity > 0.01) {
      bgCtx.save();
      const glow = Math.sin(Date.now() / 800) * 10 + 25;
      const gradient = bgCtx.createRadialGradient(
        sun.x,
        sun.y,
        0,
        sun.x,
        sun.y,
        sun.radius + glow,
      );
      gradient.addColorStop(0, `rgba(255, 223, 186, ${sun.opacity * 0.8})`);
      gradient.addColorStop(0.7, `rgba(255, 223, 186, ${sun.opacity * 0.1})`);
      gradient.addColorStop(1, `rgba(255, 223, 186, 0)`);
      bgCtx.fillStyle = gradient;
      bgCtx.beginPath();
      bgCtx.arc(sun.x, sun.y, sun.radius + glow, 0, Math.PI * 2);
      bgCtx.fill();
      bgCtx.restore();
    }
  }

  clouds.forEach((cloud) => {
    // Add subtle floating motion
    const pulse = Math.sin(Date.now() / 4000 + cloud.pulsePhase) * 0.1 + 1;
    cloud.y += cloud.driftY;

    if (
      cloudsLoaded &&
      cloudImages.variations &&
      cloudImages.variations.length > 0
    ) {
      cloudsCtx.save();

      // Get the appropriate cloud image
      const cloudImage =
        cloudImages.variations[
          cloud.imageIndex % cloudImages.variations.length
        ];

      if (cloudImage) {
        // Apply transformations
        const currentOpacity = cloud.opacity * pulse;
        cloudsCtx.globalAlpha = currentOpacity;
        cloudsCtx.translate(
          cloud.x + cloud.width / 2,
          cloud.y + cloud.height / 2,
        );
        cloudsCtx.rotate((cloud.rotation * Math.PI) / 180);
        cloudsCtx.scale(cloud.scale * pulse, cloud.scale * pulse);

        // Apply weather-based effects
        if (cloud.isDark) {
          cloudsCtx.filter = "brightness(0.3) contrast(1.4) hue-rotate(220deg)";
        } else if (currentWeatherData.main === "Thunderstorm") {
          cloudsCtx.filter = "brightness(0.6) contrast(1.2) saturate(0.8)";
        } else {
          cloudsCtx.filter = "brightness(1.1) contrast(0.9) saturate(1.1)";
        }

        // Draw cloud image
        cloudsCtx.drawImage(
          cloudImage,
          -cloud.width / 2,
          -cloud.height / 2,
          cloud.width,
          cloud.height,
        );
      }

      cloudsCtx.restore();
    } else {
      // Enhanced fallback rendering
      cloudsCtx.save();
      cloudsCtx.globalAlpha = cloud.opacity * pulse;

      // Create gradient for better fallback appearance
      const gradient = cloudsCtx.createRadialGradient(
        cloud.x + cloud.width / 2,
        cloud.y + cloud.height / 2,
        0,
        cloud.x + cloud.width / 2,
        cloud.y + cloud.height / 2,
        cloud.width / 2,
      );

      if (cloud.isDark) {
        gradient.addColorStop(0, "rgba(80, 80, 90, 0.9)");
        gradient.addColorStop(1, "rgba(60, 60, 70, 0.3)");
      } else {
        gradient.addColorStop(0, "rgba(255, 255, 255, 0.9)");
        gradient.addColorStop(1, "rgba(240, 240, 250, 0.3)");
      }

      cloudsCtx.fillStyle = gradient;
      cloudsCtx.beginPath();
      cloudsCtx.ellipse(
        cloud.x + cloud.width / 2,
        cloud.y + cloud.height / 2,
        cloud.width / 2,
        cloud.height / 2,
        0,
        0,
        Math.PI * 2,
      );
      cloudsCtx.fill();
      cloudsCtx.restore();
    }

    cloud.x += cloud.speed;
    if (cloud.x > cloudsCanvas.width + cloud.width) {
      cloud.x = -cloud.width - 50;
      cloud.y = Math.random() * cloudsCanvas.height * 0.5;
      cloud.isDark =
        currentWeatherData.main === "Thunderstorm" && Math.random() > 0.2;
      cloud.imageIndex = Math.floor(
        Math.random() * Math.max(1, cloudImagesTotal),
      );
      cloud.driftY = (Math.random() - 0.5) * 0.05;
    }
  });

  raindrops.forEach((drop) => {
    if (drop.isSnow) {
      // Draw snowflake
      weatherCtx.beginPath();
      weatherCtx.arc(drop.x, drop.y, drop.radius, 0, Math.PI * 2);
      weatherCtx.fillStyle = isDarkMode
        ? "rgba(255, 255, 255, 0.8)"
        : "rgba(255, 255, 255, 0.9)";
      weatherCtx.fill();
      drop.y += drop.speed;
      drop.x += drop.drift;
    } else {
      // Draw raindrop
      weatherCtx.beginPath();
      weatherCtx.moveTo(drop.x, drop.y);
      weatherCtx.lineTo(drop.x, drop.y + drop.length);
      weatherCtx.strokeStyle = isDarkMode
        ? "rgba(200, 200, 255, 0.5)"
        : "rgba(100, 100, 150, 0.5)";
      weatherCtx.lineWidth = currentWeatherData.main === "Thunderstorm" ? 2 : 1;
      weatherCtx.stroke();
      drop.y += drop.speed;
    }

    if (drop.y > weatherCanvas.height) {
      drop.y = Math.random() * -100;
      drop.x = Math.random() * weatherCanvas.width;
    }
  });

  if (currentWeatherData.main === "Thunderstorm" && Math.random() < 0.005) {
    lightningOpacity = 1;
  }
  if (lightningOpacity > 0) {
    lightningCtx.fillStyle = `rgba(255, 255, 255, ${lightningOpacity})`;
    lightningCtx.fillRect(0, 0, lightningCanvas.width, lightningCanvas.height);
    lightningOpacity -= 0.05;
  }

  requestAnimationFrame(animate);
}

async function getUserLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation || !CONFIG.weather.useGeolocation) {
      reject('Geolocation not available or disabled');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lon: position.coords.longitude
        });
      },
      (error) => {
        reject(error);
      }
    );
  });
}

// Replace the existing getWeatherData function
async function getWeatherData() {
  const apiKey = CONFIG.weather.apiKey;
  let url;

  try {
    // Try to get user's location
    const coords = await getUserLocation();
    url = `https://api.openweathermap.org/data/2.5/weather?lat=${coords.lat}&lon=${coords.lon}&appid=${apiKey}&units=metric`;
  } catch (error) {
    // Fallback to default city if geolocation fails
    console.log("Falling back to default city:", error);
    const city = CONFIG.weather.city;
    url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Weather data not found: ${response.status}`);
    }
    const data = await response.json();
    const weatherData = {
      main: data.weather[0].main,
      description: data.weather[0].description,
      temp: Math.round(data.main.temp),
      name: data.name,
    };

    currentWeatherData = weatherData;
    const weatherMain = currentWeatherData.main;

    let statusText = "";
    let weatherClass = "";
    switch (weatherMain) {
      case "Thunderstorm":
        statusText = `A storm is passing by in ${weatherData.name}. ${weatherData.temp}°C`;
        weatherClass = "thunderstorm";
        break;
      case "Drizzle":
        statusText = `A gentle drizzle is falling in ${weatherData.name}. ${weatherData.temp}°C`;
        weatherClass = "drizzle";
        break;
      case "Rain":
        statusText = `It's raining in ${weatherData.name}. ${weatherData.temp}°C`;
        weatherClass = "rain";
        break;
      case "Clouds":
        statusText = `It's cloudy in ${weatherData.name}. ${weatherData.temp}°C`;
        weatherClass = "cloudy";
        break;
      case "Snow":
        statusText = `It's snowing in ${weatherData.name}. ${weatherData.temp}°C`;
        weatherClass = "snow";
        break;
      case "Clear":
      default:
        statusText = `The sky is clear in ${weatherData.name}. ${weatherData.temp}°C`;
        weatherClass = "clear";
        break;
    }
    
    // Set weather class while preserving dark/light mode
    const isDark = document.documentElement.classList.contains("dark");
    body.className = `weather-${weatherClass} ${isDark ? 'dark' : 'light'}`;
    weatherStatusElement.textContent = statusText;
    setupWeatherParticles(weatherMain);
    updateConstellationFeatureVisibility();
  } catch (error) {
    console.error("Failed to fetch weather data:", error);
    const isDark = document.documentElement.classList.contains("dark");
    body.className = `weather-clear ${isDark ? 'dark' : 'light'}`;
    weatherStatusElement.textContent = "Weather unavailable - using clear sky.";
    currentWeatherData = { main: "Clear", name: "your city" };
    setupWeatherParticles("Clear");
    updateConstellationFeatureVisibility();
  }
}

// --- Interactive Glass Effect ---
const interactiveCard = document.querySelector(".interactive-glass");
if (interactiveCard) {
  interactiveCard.addEventListener("mousemove", (e) => {
    const rect = interactiveCard.getBoundingClientRect();
    interactiveCard.style.setProperty("--x", `${e.clientX - rect.left}px`);
    interactiveCard.style.setProperty("--y", `${e.clientY - rect.top}px`);
  });
  // Add touch support for mobile
  interactiveCard.addEventListener("touchmove", (e) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const rect = interactiveCard.getBoundingClientRect();
      interactiveCard.style.setProperty(
        "--x",
        `${touch.clientX - rect.left}px`,
      );
      interactiveCard.style.setProperty("--y", `${touch.clientY - rect.top}px`);
    }
  });
}

// --- Constellation Logic ---
function setupInteractiveStars() {
  interactiveStars = [];
  for (let i = 0; i < 20; i++) {
    // Reduced for mobile performance
    interactiveStars.push({
      x: Math.random() * constellationCanvas.width,
      y: Math.random() * constellationCanvas.height,
      radius: Math.random() * 2 + 1,
      opacity: Math.random() * 0.5 + 0.5,
    });
  }
}

constellationToggle.addEventListener("click", () => {
  isDrawingConstellations = !isDrawingConstellations;
  constellationToggle.classList.toggle("active");
  constellationCanvas.style.pointerEvents = isDrawingConstellations
    ? "auto"
    : "none";
  currentConstellationPoint = null;
});

// Enhanced constellation interaction for mobile
function handleConstellationInteraction(clientX, clientY) {
  if (!isDrawingConstellations) return;

  const rect = constellationCanvas.getBoundingClientRect();
  const clickX = clientX - rect.left;
  const clickY = clientY - rect.top;

  let closestStar = null;
  let minDistance = window.innerWidth < 640 ? 25 : 15; // Larger touch target on mobile

  interactiveStars.forEach((star) => {
    const distance = Math.sqrt(
      Math.pow(star.x - clickX, 2) + Math.pow(star.y - clickY, 2),
    );
    if (distance < minDistance) {
      minDistance = distance;
      closestStar = star;
    }
  });

  if (closestStar) {
    if (!currentConstellationPoint) {
      currentConstellationPoint = closestStar;
    } else {
      const newLine = { start: currentConstellationPoint, end: closestStar };
      constellationLines.push(newLine);
      localStorage.setItem(
        CONFIG.storage.constellations,
        JSON.stringify(constellationLines),
      );
      currentConstellationPoint = null;
    }
  }
}

constellationCanvas.addEventListener("click", (e) => {
  handleConstellationInteraction(e.clientX, e.clientY);
});

constellationCanvas.addEventListener("touchend", (e) => {
  e.preventDefault();
  if (e.changedTouches.length === 1) {
    const touch = e.changedTouches[0];
    handleConstellationInteraction(touch.clientX, touch.clientY);
  }
});

function updateConstellationFeatureVisibility() {
  const isDarkMode = document.documentElement.classList.contains("dark");
  const isClear = currentWeatherData.main === "Clear";

  if (isDarkMode && isClear) {
    constellationToggle.style.display = "block";
  } else {
    constellationToggle.style.display = "none";
    isDrawingConstellations = false;
    constellationToggle.classList.remove("active");
    constellationCanvas.style.pointerEvents = "none";
    currentConstellationPoint = null;
  }
}

// --- Content & Memory Lane Logic ---
const memoryModeToggle = document.getElementById("memory-mode-toggle");
const storyIcon = document.getElementById("story-icon");
const randomIcon = document.getElementById("random-icon");
const goodnightButton = document.getElementById("goodnight-button");
const goodnightOverlay = document.getElementById("goodnight-overlay");
const prevMemoryButton = document.getElementById("prev-memory");
const nextMemoryButton = document.getElementById("next-memory");
let isStoryMode = false;
let contentInterval;

const messages = CONFIG.memories.messages;
const gifs = CONFIG.memories.images;

const storyContent = messages.map((message, index) => ({
  message,
  gif: gifs[index] || gifs[0], // Fallback to first image if index out of bounds
}));
let randomContent = [...storyContent];

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

const textElement = document.getElementById("changing-text");
const gifElement = document.getElementById("changing-gif");
let contentIndex = 0;

function displayCurrentMemory() {
  const content = isStoryMode ? storyContent : randomContent;
  if (!content || !content[contentIndex]) return;
  textElement.style.opacity = 0;
  gifElement.style.opacity = 0;
  setTimeout(() => {
    textElement.innerText = content[contentIndex].message;
    gifElement.src = content[contentIndex].gif;
    textElement.style.opacity = 1;
    gifElement.style.opacity = 1;
  }, 300);
}

function cycleContent() {
  contentIndex =
    (contentIndex + 1) %
    (isStoryMode ? storyContent.length : randomContent.length);
  displayCurrentMemory();
}

function startContentInterval() {
  clearInterval(contentInterval);
  displayCurrentMemory();
  contentInterval = setInterval(cycleContent, CONFIG.memories.cycleDuration);
}

memoryModeToggle.addEventListener("click", () => {
  isStoryMode = !isStoryMode;
  contentIndex = 0;
  if (isStoryMode) {
    storyIcon.classList.remove("hidden");
    randomIcon.classList.add("hidden");
    clearInterval(contentInterval);
    prevMemoryButton.classList.add("visible");
    nextMemoryButton.classList.add("visible");
  } else {
    shuffle(randomContent);
    storyIcon.classList.add("hidden");
    randomIcon.classList.remove("hidden");
    prevMemoryButton.classList.remove("visible");
    nextMemoryButton.classList.remove("visible");
    startContentInterval();
  }
  displayCurrentMemory();
});

nextMemoryButton.addEventListener("click", () => {
  contentIndex = (contentIndex + 1) % storyContent.length;
  displayCurrentMemory();
});

prevMemoryButton.addEventListener("click", () => {
  contentIndex = (contentIndex - 1 + storyContent.length) % storyContent.length;
  displayCurrentMemory();
});

goodnightButton.addEventListener("click", () => {
  goodnightOverlay.classList.add("active");
  if (isPlaying) audio.pause();
});

goodnightOverlay.addEventListener("click", () => {
  goodnightOverlay.classList.remove("active");
  if (isPlaying) audio.play();
});

// --- Timer Logic ---
const timerElement = document.getElementById("timer");
const startDate = new Date(CONFIG.timer.startDate);
function updateTimer() {
  const diff = new Date() - startDate;
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  timerElement.innerText = `Missing you for: ${days} days, ${hours} hours, ${minutes} minutes, and ${seconds} seconds.`;
}

// --- Mobile Modal Handling ---
function closeModalOnOutsideClick(modal) {
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.classList.remove("visible");
      setTimeout(() => modal.classList.add("hidden"), 300);
    }
  });
}

closeModalOnOutsideClick(letterModal);
closeModalOnOutsideClick(letterComposerModal);
closeModalOnOutsideClick(bottleModal);
if (bottleComposerModal) closeModalOnOutsideClick(bottleComposerModal);

// Prevent body scroll when modals are open
function toggleBodyScroll(shouldPrevent) {
  if (shouldPrevent) {
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.width = "100%";
  } else {
    document.body.style.overflow = "";
    document.body.style.position = "";
    document.body.style.width = "";
  }
}

// Update modal event listeners to handle body scroll

openLetterModalButton.addEventListener("click", () => {
  toggleBodyScroll(true);
});
closeLetterModalButton.addEventListener("click", () => {
  toggleBodyScroll(false);
});
closeComposerModalButton.addEventListener("click", () => {
  toggleBodyScroll(false);
});
openBottleModalButton.addEventListener("click", () => {
  toggleBodyScroll(true);
});
closeBottleModalButton.addEventListener("click", () => {
  toggleBodyScroll(false);
});

// --- Initial Load ---
document.addEventListener("DOMContentLoaded", async () => {
  setInitialTheme();
  shuffle(randomContent);
  startContentInterval();
  setInterval(updateTimer, CONFIG.timer.updateInterval);
  updateTimer();
  
  // Initialize sync API
  try {
    await window.SyncAPI.init();
    console.log('[sync] Sync API initialized');
  } catch (error) {
    console.warn('[sync] Failed to initialize sync API:', error);
  }
  
  // Load data (with sync or fallback to localStorage)
  await loadLetters();
  checkUnreadLetters();
  await loadBottles();
  checkUnreadBottles();
  setMinUnlockDate();
  getWeatherData();
  setInterval(getWeatherData, CONFIG.weather.updateInterval);

  setupInteractiveStars();
  loadCloudImages();
  loadCustomIcons();
  animate();

  // Prevent viewport zoom on double tap (iOS Safari)
  let lastTouchEnd = 0;
  document.addEventListener(
    "touchend",
    function (event) {
      const now = new Date().getTime();
      if (now - lastTouchEnd <= 300) {
        event.preventDefault();
      }
      lastTouchEnd = now;
    },
    false,
  );

  // Handle orientation change
  window.addEventListener("orientationchange", () => {
    setTimeout(() => {
      resizeCanvases();
      setupInteractiveStars();
      setupWeatherParticles(currentWeatherData.main);
    }, 100);
  });
  
  // Listen for sync updates
  window.addEventListener('sync:updated', async (event) => {
    console.log('[sync] Data updated, refreshing UI');
    await loadLetters();
    checkUnreadLetters();
    await loadBottles();
    checkUnreadBottles();
  });
});
