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

// Font picker buttons for new design
const fontPickerButtons = document.querySelectorAll('.font-picker-btn');

let localLetters = [];
let selectedLetterFont = localStorage.getItem('selectedLetterFont') || 'pen-caveat';
let currentLetterId = null;

// Apply saved font preference to textarea
if (letterTextarea) {
  letterTextarea.className = letterTextarea.className.replace(/font-[\w-]*/g, '') + ' font-' + selectedLetterFont;
}

// Font picker button handlers for new design
fontPickerButtons.forEach(btn => {
  // Set initial active state
  if (btn.dataset.font === selectedLetterFont) {
    btn.classList.add('active');
  }
  
  btn.addEventListener('click', () => {
    // Remove active from all buttons
    fontPickerButtons.forEach(b => b.classList.remove('active'));
    // Add active to clicked button
    btn.classList.add('active');
    
    selectedLetterFont = btn.dataset.font;
    localStorage.setItem('selectedLetterFont', selectedLetterFont);
    letterTextarea.className = letterTextarea.className.replace(/font-[\w-]*/g, '') + ' font-' + selectedLetterFont;
  });
});

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
  localStorage.setItem(
    CONFIG.storage.lastOpenedLetters,
    new Date().toISOString(),
  );
  checkUnreadLetters();
  loadLetters();

  // Add animation interaction feedback
  if (letterIcon) {
    letterIcon.style.transform = "scale(0.9)";
    setTimeout(() => {
      letterIcon.style.transform = "";
    }, 150);
  }
});

closeLetterModalButton.addEventListener("click", () => {
  letterModal.classList.add("hidden");
});

createNewLetterButton.addEventListener("click", () => {
  letterComposerModal.classList.remove("hidden");
  letterTextarea.value = "";
  letterTextarea.focus();
});

backToInboxButton.addEventListener("click", () => {
  letterComposerModal.classList.add("hidden");
  letterModal.classList.remove("hidden");
});

closeComposerModalButton.addEventListener("click", () => {
  letterComposerModal.classList.add("hidden");
});

saveLetterButton.addEventListener("click", async () => {
  const content = letterTextarea.value.trim();
  if (content) {
    const newLetter = {
      id: Date.now(),
      content: content,
      font: selectedLetterFont,
      date: new Date().toISOString(),
    };
    
    localLetters.unshift(newLetter);
    
    try {
      await window.SyncAPI.saveLetters(localLetters);
    } catch (error) {
      console.error('Failed to save letter:', error);
      localStorage.setItem(CONFIG.storage.letters, JSON.stringify(localLetters));
    }
    
    letterTextarea.value = "";
    letterComposerModal.classList.add("hidden");
    letterModal.classList.remove("hidden");
    renderLetters();
  }
});

// Original continuation for backward compatibility
createNewLetterButton.addEventListener("click", () => {
  setTimeout(() => {
    letterModal.classList.add("hidden");
    letterComposerModal.classList.remove("hidden");
    setTimeout(() => letterComposerModal.classList.add("visible"), 10);
  }, 200);
});

// Mobile Create New Letter Button
const createNewLetterMobileButton = document.getElementById("create-new-letter-mobile");
if (createNewLetterMobileButton) {
  createNewLetterMobileButton.addEventListener("click", () => {
    letterModal.classList.remove("visible");
    setTimeout(() => {
      letterModal.classList.add("hidden");
      letterComposerModal.classList.remove("hidden");
      setTimeout(() => letterComposerModal.classList.add("visible"), 10);
    }, 200);
  });
}

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
  localLetters.forEach((letter, index) => {
    const letterItem = document.createElement("div");
    letterItem.className = "letter-item";
    letterItem.dataset.letterId = letter.id;
    
    const date = new Date(letter.date || letter.createdAt);
    const content = letter.content || letter.text || "";
    const preview = content.substring(0, 80) + (content.length > 80 ? "..." : "");
    
    letterItem.innerHTML = `
      <div class="letter-item-date">${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
      <div class="letter-item-preview">${preview}</div>
    `;
    
    letterItem.addEventListener('click', () => {
      // Remove active class from all items
      document.querySelectorAll('.letter-item').forEach(item => item.classList.remove('active'));
      // Add active class to clicked item
      letterItem.classList.add('active');
      // Display the letter
      displayLetter(letter);
    });
    
    pastLettersContainer.appendChild(letterItem);
  });
  
  if (localLetters.length === 0) {
    pastLettersContainer.innerHTML = `
      <div style="text-align: center; padding: 32px 16px; color: rgba(255, 255, 255, 0.4);">
        <p style="font-size: 14px; margin-bottom: 8px;">No letters yet</p>
        <p style="font-size: 12px;">Click "Create New" to write your first letter</p>
      </div>
    `;
  }
}

// Display letter function for the new design
function displayLetter(letter) {
  if (!letterReadingPane) return;
  
  const date = new Date(letter.date || letter.createdAt);
  const content = letter.content || letter.text || "";
  const fontClass = 'font-' + (letter.font || 'pen-caveat');
  
  letterReadingPane.innerHTML = `
    <div class="letter-content">
      <div class="letter-content-date">${date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
      <div class="letter-content-body ${fontClass}">${content}</div>
    </div>
  `;
  
  currentLetterId = letter.id;
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

// Font picker buttons for new bottle design
const bottleFontPickerButtons = document.querySelectorAll('.bottle-font-picker-btn');

let localBottles = [];
let selectedBottleFont = localStorage.getItem('selectedBottleFont') || 'pen-caveat';
let currentBottleId = null;

// Apply saved font preference to textarea
if (bottleTextarea) {
  bottleTextarea.className = bottleTextarea.className.replace(/font-[\w-]*/g, '') + ' font-' + selectedBottleFont;
}

// Font picker button handlers for new bottle design
bottleFontPickerButtons.forEach(btn => {
  // Set initial active state
  if (btn.dataset.font === selectedBottleFont) {
    btn.classList.add('active');
  }
  
  btn.addEventListener('click', () => {
    // Remove active from all buttons
    bottleFontPickerButtons.forEach(b => b.classList.remove('active'));
    // Add active to clicked button
    btn.classList.add('active');
    
    selectedBottleFont = btn.dataset.font;
    localStorage.setItem('selectedBottleFont', selectedBottleFont);
    bottleTextarea.className = bottleTextarea.className.replace(/font-[\w-]*/g, '') + ' font-' + selectedBottleFont;
  });
});

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
  localStorage.setItem(
    CONFIG.storage.lastOpenedBottles,
    new Date().toISOString(),
  );
  checkUnreadBottles();
  loadBottles();
});

closeBottleModalButton.addEventListener("click", () => {
  bottleModal.classList.add("hidden");
});

if (createNewBottleButton) {
  createNewBottleButton.addEventListener("click", () => {
    bottleComposerModal.classList.remove("hidden");
    bottleTextarea.value = "";
    setMinUnlockDate();
    bottleTextarea.focus();
  });
}

if (backToBottlesButton) {
  backToBottlesButton.addEventListener("click", () => {
    bottleComposerModal.classList.add("hidden");
    bottleModal.classList.remove("hidden");
  });
}

if (closeBottleComposerButton) {
  closeBottleComposerButton.addEventListener("click", () => {
    bottleComposerModal.classList.add("hidden");
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
  localBottles.forEach((bottle, index) => {
    const bottleItem = document.createElement("div");
    const isLocked = new Date(bottle.unlockDate) > new Date();
    bottleItem.className = isLocked ? "bottle-item opacity-60 cursor-not-allowed" : "bottle-item";
    bottleItem.dataset.bottleId = bottle.id;
    
    const date = new Date(bottle.unlockDate);
    const content = bottle.text || "";
    const preview = isLocked
      ? "🔒 Locked until " + date.toLocaleDateString()
      : content.substring(0, 80) + (content.length > 80 ? "..." : "");
    
    const status = isLocked ? "Locked" : "Ready to open";
    
    bottleItem.innerHTML = `
      <div class="bottle-item-date">${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
      <div class="bottle-item-preview">${preview}</div>
      <div class="bottle-item-status">${status}</div>
    `;
    
    if (!isLocked) {
      bottleItem.addEventListener('click', () => {
        // Remove active class from all items
        document.querySelectorAll('.bottle-item').forEach(item => item.classList.remove('active'));
        // Add active class to clicked item
        bottleItem.classList.add('active');
        // Display the bottle
        displayBottle(bottle);
      });
    }
    
    pastBottlesContainer.appendChild(bottleItem);
  });

  if (localBottles.length === 0) {
    pastBottlesContainer.innerHTML = `
      <div style="text-align: center; padding: 32px 16px; color: rgba(255, 255, 255, 0.4);">
        <p style="font-size: 14px; margin-bottom: 8px;">No bottles yet</p>
        <p style="font-size: 12px;">Click "Create New Bottle" to send your first message to the future</p>
      </div>
    `;
  }
}

// Bottle selection is now handled in renderBottles function

function displayBottle(bottle) {
  if (!bottleReadingPane) return;
  
  const isLocked = new Date(bottle.unlockDate) > new Date();
  if (isLocked) {
    bottleReadingPane.innerHTML = `
      <div class="h-full flex items-center justify-center">
        <div class="text-center text-white/40">
          <div class="text-6xl mb-6">🔒</div>
          <h3 class="text-xl font-handwriting mb-2 text-white/60">This bottle is sealed</h3>
          <p class="text-sm">It will unlock on ${new Date(bottle.unlockDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </div>
    `;
  } else {
    const createdDate = new Date(bottle.createdAt);
    const unlockDate = new Date(bottle.unlockDate);
    const content = bottle.text || "";
    const fontClass = 'font-' + (bottle.font || 'pen-caveat');
    
    bottleReadingPane.innerHTML = `
      <div class="bottle-content">
        <div class="bottle-content-date">Created ${createdDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
        <div class="bottle-content-body ${fontClass}">${content}</div>
        <div class="bottle-content-unlock">
          <strong>Unlocked:</strong> ${unlockDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>
    `;
  }
  
  currentBottleId = bottle.id;
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

// Enhanced Weather Physics System
let weatherParticles = [];
let splashEffects = [];
let windParticles = [];
let dustMotes = [];
let snowflakes = [];
let rainDrops = [];
let fogParticles = [];
let lightningBranches = [];

function setupWeatherParticles(weather) {
  const isThunderstorm = weather === "Thunderstorm";
  const isRain = weather === "Rain" || isThunderstorm || weather === "Drizzle";
  const isCloudy = weather === "Clouds" || isThunderstorm;
  const isSnow = weather === "Snow";
  const isClear = weather === "Clear";
  const isWindy = isCloudy || isThunderstorm;
  const isFoggy = weather === "Mist" || weather === "Fog";

  const isMobile = window.innerWidth < 768;
  const particleMultiplier = isMobile ? 0.6 : 1;
  
  // Clear existing particles
  weatherParticles = [];
  splashEffects = [];
  windParticles = [];
  dustMotes = [];
  snowflakes = [];
  rainDrops = [];
  fogParticles = [];
  lightningBranches = [];
  
  // Legacy support for existing raindrops array
  raindrops = [];
  
  if (isRain) {
    const rainCount = isThunderstorm ? 
      Math.floor(CONFIG.animations.particles.rain.thunderstorm * particleMultiplier) : 
      Math.floor(CONFIG.animations.particles.rain.normal * particleMultiplier);
    
    for (let i = 0; i < rainCount; i++) {
      const drop = createRealisticRaindrop();
      rainDrops.push(drop);
      raindrops.push(createRaindrop()); // Legacy support
    }
  }
  
  if (isSnow) {
    const snowCount = Math.floor(CONFIG.animations.particles.snow * particleMultiplier);
    for (let i = 0; i < snowCount; i++) {
      const flake = createRealisticSnowflake();
      snowflakes.push(flake);
      raindrops.push(createSnowflake()); // Legacy support
    }
  }
  
  if (isWindy) {
    const windCount = Math.floor(50 * particleMultiplier);
    for (let i = 0; i < windCount; i++) {
      windParticles.push(createWindParticle());
    }
  }
  
  if (isClear) {
    const dustCount = Math.floor(30 * particleMultiplier);
    for (let i = 0; i < dustCount; i++) {
      dustMotes.push(createDustMote());
    }
  }

  if (isFoggy) {
    const fogCount = Math.floor(40 * particleMultiplier);
    for (let i = 0; i < fogCount; i++) {
      fogParticles.push(createFogParticle());
    }
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
// Realistic particle creation functions
function createRealisticRaindrop() {
  const isStorm = currentWeatherData.main === "Thunderstorm";
  const windStrength = isStorm ? 6 : 2;
  const angle = isStorm ? Math.PI / 6 : Math.PI / 12; // Slant angle
  
  return {
    x: Math.random() * (window.innerWidth + 400) - 200,
    y: Math.random() * -600 - 100,
    vx: Math.sin(angle) * windStrength + (Math.random() - 0.5) * 2,
    vy: Math.random() * 4 + (isStorm ? 15 : 10),
    length: Math.random() * 20 + (isStorm ? 15 : 10),
    width: Math.random() * 1.5 + (isStorm ? 1 : 0.5),
    opacity: Math.random() * 0.4 + 0.6,
    mass: Math.random() * 0.7 + 0.3,
    life: 1.0,
    trail: [],
    maxTrailLength: isStorm ? 5 : 3,
    type: 'rain'
  };
}

function createRealisticSnowflake() {
  const size = Math.random() * 5 + 2;
  return {
    x: Math.random() * (window.innerWidth + 200) - 100,
    y: Math.random() * -400 - 100,
    vx: (Math.random() - 0.5) * 3,
    vy: Math.random() * 1.5 + 0.8,
    radius: size,
    mass: size * 0.1,
    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: (Math.random() - 0.5) * 0.03,
    opacity: Math.random() * 0.5 + 0.5,
    meltRate: 0,
    life: 1.0,
    wobble: Math.random() * Math.PI * 2,
    wobbleSpeed: Math.random() * 0.02 + 0.01,
    crystalline: Math.random() > 0.5, // Some snowflakes are more detailed
    type: 'snow'
  };
}

function createWindParticle() {
  const isDark = document.documentElement.classList.contains('dark');
  const baseOpacity = isDark ? 0.15 : 0.25;
  
  return {
    x: Math.random() < 0.5 ? -10 : window.innerWidth + 10,
    y: Math.random() * window.innerHeight,
    vx: (Math.random() * 5 + 4) * (Math.random() < 0.5 ? 1 : -1),
    vy: (Math.random() - 0.5) * 3,
    size: Math.random() * 2 + 1,
    opacity: Math.random() * baseOpacity + baseOpacity * 0.3,
    life: Math.random() * 4 + 3,
    maxLife: Math.random() * 4 + 3,
    swayPhase: Math.random() * Math.PI * 2,
    swaySpeed: Math.random() * 0.03 + 0.015,
    turbulence: Math.random() * Math.PI,
    type: 'wind'
  };
}

function createDustMote() {
  // Adjust opacity based on theme for visibility
  const isDark = document.documentElement.classList.contains('dark');
  const baseOpacity = isDark ? 0.1 : 0.3; // Higher opacity in light mode
  
  return {
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    vx: (Math.random() - 0.5) * 0.8,
    vy: (Math.random() - 0.5) * 0.4,
    size: Math.random() * 2 + 1,
    opacity: Math.random() * baseOpacity + baseOpacity * 0.5,
    floatPhase: Math.random() * Math.PI * 2,
    floatSpeed: Math.random() * 0.015 + 0.008,
    turbulence: Math.random() * 0.5 + 0.5,
    type: 'dust'
  };
}

function createFogParticle() {
  const isDark = document.documentElement.classList.contains('dark');
  return {
    x: Math.random() * (window.innerWidth + 400) - 200,
    y: Math.random() * window.innerHeight,
    vx: Math.random() * 1 + 0.5,
    vy: (Math.random() - 0.5) * 0.5,
    size: Math.random() * 80 + 40,
    opacity: Math.random() * 0.1 + (isDark ? 0.05 : 0.15),
    life: Math.random() * 10 + 5,
    maxLife: Math.random() * 10 + 5,
    swayPhase: Math.random() * Math.PI * 2,
    swaySpeed: Math.random() * 0.01 + 0.005,
    type: 'fog'
  };
}

function createSplashEffect(x, y, intensity = 1) {
  const splashCount = Math.floor(Math.random() * 5 + 3) * intensity;
  for (let i = 0; i < splashCount; i++) {
    splashEffects.push({
      x: x + (Math.random() - 0.5) * 10,
      y: y,
      vx: (Math.random() - 0.5) * 8 * intensity,
      vy: -(Math.random() * 4 + 2) * intensity,
      size: Math.random() * 2 + 1,
      opacity: Math.random() * 0.6 + 0.4,
      life: Math.random() * 0.5 + 0.3,
      maxLife: Math.random() * 0.5 + 0.3,
      gravity: 0.3
    });
  }
  
  // Add card impact effect
  addCardImpactEffect(x, y, intensity);
}

function addCardImpactEffect(x, y, intensity) {
  // Create a subtle glow effect on the card when hit
  const cardElements = document.querySelectorAll('.glass-ui');
  cardElements.forEach(card => {
    const rect = card.getBoundingClientRect();
    if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
      // Add temporary glow class
      card.style.transition = 'box-shadow 0.1s ease-out';
      card.style.boxShadow = `0 0 ${20 * intensity}px rgba(173, 216, 230, ${0.5 * intensity}), ${card.style.boxShadow}`;
      
      // Remove effect after short duration
      setTimeout(() => {
        card.style.boxShadow = '';
        card.style.transition = '';
      }, 200);
    }
  });
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

let lastFrameTime = 0;
const targetFPS = window.innerWidth < 768 ? 30 : 60; // Lower FPS for mobile
const frameInterval = 1000 / targetFPS;

function animate(currentTime = 0) {
  // Throttle frame rate for better performance
  if (currentTime - lastFrameTime < frameInterval) {
    requestAnimationFrame(animate);
    return;
  }
  const deltaTime = currentTime - lastFrameTime;
  lastFrameTime = currentTime;

  // Clear all canvases
  bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
  weatherCtx.clearRect(0, 0, weatherCanvas.width, weatherCanvas.height);
  lightningCtx.clearRect(0, 0, lightningCanvas.width, lightningCanvas.height);
  cloudsCtx.clearRect(0, 0, cloudsCanvas.width, cloudsCanvas.height);
  constellationCtx.clearRect(0, 0, constellationCanvas.width, constellationCanvas.height);

  const isDarkMode = document.documentElement.classList.contains("dark");

  // Theme-aware background effects - preserve original colors
  if (isDarkMode) {
    // Very subtle texture overlay that won't interfere with your black background
    bgCtx.fillStyle = 'rgba(0, 0, 0, 0.02)';
    bgCtx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);
    
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
    // Very subtle texture overlay that won't interfere with your blue background
    bgCtx.fillStyle = 'rgba(255, 255, 255, 0.01)';
    bgCtx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);
    
    // Draw sun with enhanced glow
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

  // Enhanced cloud rendering
  clouds.forEach((cloud) => {
    const pulse = Math.sin(Date.now() / 4000 + cloud.pulsePhase) * 0.1 + 1;
    cloud.y += cloud.driftY;

    if (cloudsLoaded && cloudImages.variations && cloudImages.variations.length > 0) {
      cloudsCtx.save();
      const cloudImage = cloudImages.variations[cloud.imageIndex % cloudImages.variations.length];

      if (cloudImage) {
        const currentOpacity = cloud.opacity * pulse;
        cloudsCtx.globalAlpha = currentOpacity;
        cloudsCtx.translate(cloud.x + cloud.width / 2, cloud.y + cloud.height / 2);
        cloudsCtx.rotate((cloud.rotation * Math.PI) / 180);
        cloudsCtx.scale(cloud.scale * pulse, cloud.scale * pulse);

        // Enhanced weather-based effects
        if (cloud.isDark) {
          cloudsCtx.filter = "brightness(0.2) contrast(1.6) hue-rotate(220deg) saturate(0.8)";
        } else if (currentWeatherData.main === "Thunderstorm") {
          cloudsCtx.filter = "brightness(0.5) contrast(1.3) saturate(0.7) hue-rotate(10deg)";
        } else if (currentWeatherData.main === "Snow") {
          cloudsCtx.filter = "brightness(1.3) contrast(0.8) saturate(0.9)";
        } else {
          cloudsCtx.filter = "brightness(1.1) contrast(0.9) saturate(1.1)";
        }

        cloudsCtx.drawImage(cloudImage, -cloud.width / 2, -cloud.height / 2, cloud.width, cloud.height);
      }
      cloudsCtx.restore();
    } else {
      // Enhanced fallback rendering with better gradients
      cloudsCtx.save();
      cloudsCtx.globalAlpha = cloud.opacity * pulse;

      const gradient = cloudsCtx.createRadialGradient(
        cloud.x + cloud.width / 2,
        cloud.y + cloud.height / 2,
        0,
        cloud.x + cloud.width / 2,
        cloud.y + cloud.height / 2,
        cloud.width / 2,
      );

      if (cloud.isDark) {
        gradient.addColorStop(0, "rgba(60, 60, 80, 0.9)");
        gradient.addColorStop(0.6, "rgba(40, 40, 60, 0.6)");
        gradient.addColorStop(1, "rgba(30, 30, 50, 0.2)");
      } else {
        gradient.addColorStop(0, "rgba(255, 255, 255, 0.9)");
        gradient.addColorStop(0.6, "rgba(240, 240, 250, 0.6)");
        gradient.addColorStop(1, "rgba(220, 220, 240, 0.2)");
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
      cloud.isDark = currentWeatherData.main === "Thunderstorm" && Math.random() > 0.2;
      cloud.imageIndex = Math.floor(Math.random() * Math.max(1, cloudImagesTotal));
      cloud.driftY = (Math.random() - 0.5) * 0.05;
    }
  });

  // Update realistic weather particles
  updateRealisticWeatherParticles(weatherCtx, deltaTime);

  // Legacy raindrop support (for compatibility)
  raindrops.forEach((drop) => {
    if (drop.isSnow) {
      weatherCtx.beginPath();
      weatherCtx.arc(drop.x, drop.y, drop.radius, 0, Math.PI * 2);
      weatherCtx.fillStyle = isDarkMode ? "rgba(255, 255, 255, 0.8)" : "rgba(255, 255, 255, 0.9)";
      weatherCtx.fill();
      drop.y += drop.speed;
      drop.x += drop.drift;
    } else {
      weatherCtx.beginPath();
      weatherCtx.moveTo(drop.x, drop.y);
      weatherCtx.lineTo(drop.x, drop.y + drop.length);
      weatherCtx.strokeStyle = isDarkMode ? "rgba(200, 200, 255, 0.5)" : "rgba(100, 100, 150, 0.5)";
      weatherCtx.lineWidth = currentWeatherData.main === "Thunderstorm" ? 2 : 1;
      weatherCtx.stroke();
      drop.y += drop.speed;
    }

    if (drop.y > weatherCanvas.height) {
      drop.y = Math.random() * -100;
      drop.x = Math.random() * weatherCanvas.width;
    }
  });

  // Enhanced lightning effects
  if (currentWeatherData.main === "Thunderstorm") {
    // More realistic lightning frequency
    if (Math.random() < CONFIG.animations.particles.lightning.frequency) {
      lightningOpacity = 1;
      // Add screen flash effect
      document.body.style.filter = 'brightness(1.5)';
      setTimeout(() => {
        document.body.style.filter = '';
      }, 100);
    }
  }
  
  if (lightningOpacity > 0) {
    // Create more realistic lightning effect
    lightningCtx.save();
    lightningCtx.globalAlpha = lightningOpacity;
    
    // Main flash
    lightningCtx.fillStyle = `rgba(255, 255, 255, ${lightningOpacity * 0.8})`;
    lightningCtx.fillRect(0, 0, lightningCanvas.width, lightningCanvas.height);
    
    // Blue-white lightning color
    lightningCtx.fillStyle = `rgba(173, 216, 230, ${lightningOpacity * 0.4})`;
    lightningCtx.fillRect(0, 0, lightningCanvas.width, lightningCanvas.height);
    
    lightningCtx.restore();
    lightningOpacity -= 0.08; // Faster fade for more realistic effect
  }

  requestAnimationFrame(animate);
}

// Collision detection system
function getUIElements() {
  const elements = [];
  
  // Main card
  const mainCard = document.querySelector('.glass-ui.rounded-2xl');
  if (mainCard) {
    const rect = mainCard.getBoundingClientRect();
    elements.push({
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height,
      type: 'card',
      element: mainCard
    });
  }
  
  // Modal content if visible
  const modals = document.querySelectorAll('.modal.visible .modal-content');
  modals.forEach(modal => {
    const rect = modal.getBoundingClientRect();
    elements.push({
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height,
      type: 'modal',
      element: modal
    });
  });
  
  return elements;
}

function updateRealisticWeatherParticles(ctx, deltaTime) {
  const uiElements = getUIElements();
  const gravity = 0.1;
  const wind = Math.sin(Date.now() / 3000) * 0.5;
  const isDark = document.documentElement.classList.contains('dark');
  
  // Update raindrops with realistic physics
  for (let i = rainDrops.length - 1; i >= 0; i--) {
    const drop = rainDrops[i];
    
    // Store trail positions
    if (drop.trail && drop.trail.length > drop.maxTrailLength) {
      drop.trail.shift();
    }
    if (drop.trail) {
      drop.trail.push({ x: drop.x, y: drop.y });
    }
    
    // Apply gravity, air resistance and wind
    const airResistance = 0.98;
    drop.vy = Math.min(drop.vy + drop.mass * 0.3, 25); // Terminal velocity
    drop.vx = drop.vx * airResistance + wind * 0.2 + (Math.random() - 0.5) * 0.2;
    
    drop.x += drop.vx;
    drop.y += drop.vy;
    
    // Check for ground collision with varying splash heights
    const groundLevel = window.innerHeight - Math.random() * 100;
    if (drop.y > groundLevel) {
      // Create realistic splash effect
      createSplashEffect(drop.x, drop.y, drop.mass * 1.5);
      rainDrops.splice(i, 1);
      continue;
    }
    
    // Remove if off screen
    if (drop.x < -100 || drop.x > window.innerWidth + 100) {
      rainDrops.splice(i, 1);
      continue;
    }
    
    // Draw raindrop with motion blur
    ctx.save();
    ctx.globalAlpha = drop.opacity;
    
    // Draw trail for motion blur effect
    if (drop.trail && drop.trail.length > 1) {
      ctx.strokeStyle = `rgba(173, 216, 230, ${drop.opacity * 0.3})`;
      ctx.lineWidth = drop.width * 0.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      for (let j = 0; j < drop.trail.length - 1; j++) {
        const alpha = (j / drop.trail.length) * 0.3;
        ctx.globalAlpha = drop.opacity * alpha;
        ctx.moveTo(drop.trail[j].x, drop.trail[j].y);
        ctx.lineTo(drop.trail[j + 1].x, drop.trail[j + 1].y);
      }
      ctx.stroke();
    }
    
    // Draw main raindrop
    ctx.globalAlpha = drop.opacity;
    ctx.strokeStyle = `rgba(173, 216, 230, ${drop.opacity})`;
    ctx.lineWidth = drop.width;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(drop.x, drop.y);
    ctx.lineTo(drop.x - drop.vx * 2, drop.y - drop.length);
    ctx.stroke();
    
    // Add refraction effect
    ctx.globalAlpha = drop.opacity * 0.3;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = drop.width * 0.3;
    ctx.beginPath();
    ctx.moveTo(drop.x - drop.width/2, drop.y);
    ctx.lineTo(drop.x - drop.vx - drop.width/2, drop.y - drop.length * 0.7);
    ctx.stroke();
    
    ctx.restore();
  }
  
  // Update snowflakes with realistic physics
  for (let i = snowflakes.length - 1; i >= 0; i--) {
    const flake = snowflakes[i];
    
    // Apply realistic floating motion
    flake.rotation += flake.rotationSpeed;
    if (flake.wobble !== undefined) {
      flake.wobble += flake.wobbleSpeed;
      const wobbleX = Math.sin(flake.wobble) * 1.5;
      const wobbleY = Math.cos(flake.wobble * 0.7) * 0.3;
      flake.vx = flake.vx * 0.99 + (Math.random() - 0.5) * 0.05 + wobbleX * 0.1;
    } else {
      flake.vx = flake.vx * 0.99 + (Math.random() - 0.5) * 0.05;
    }
    
    flake.vy = Math.min(flake.vy + flake.mass * 0.02, 2.5);
    
    flake.x += flake.vx;
    flake.y += flake.vy;
    
    // Check if snowflake reached ground with accumulation
    const groundLevel = window.innerHeight - Math.random() * 50;
    if (flake.y > groundLevel) {
      // Melt gradually
      flake.opacity -= 0.02;
      if (flake.opacity <= 0) {
        snowflakes.splice(i, 1);
      }
      continue;
    }
    
    // Remove if off screen
    if (flake.x < -100 || flake.x > window.innerWidth + 100) {
      snowflakes.splice(i, 1);
      continue;
    }
    
    // Draw snowflake
    ctx.save();
    ctx.translate(flake.x, flake.y);
    ctx.rotate(flake.rotation);
    
    // Fade based on depth
    const depthFade = 0.3 + (flake.radius / 7) * 0.7;
    ctx.globalAlpha = flake.opacity * depthFade;
    
    if (flake.crystalline) {
      // Draw detailed crystalline snowflake
      ctx.strokeStyle = `rgba(255, 255, 255, ${flake.opacity})`;
      ctx.fillStyle = `rgba(255, 255, 255, ${flake.opacity * 0.3})`;
      
      for (let j = 0; j < 6; j++) {
        ctx.rotate(Math.PI / 3);
        
        // Main arm
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -flake.radius);
        ctx.lineWidth = flake.radius / 4;
        ctx.stroke();
        
        // Branches
        for (let k = 1; k <= 3; k++) {
          const branchPos = -flake.radius * (k / 4);
          const branchLength = flake.radius * (0.4 - k * 0.1);
          
          ctx.beginPath();
          ctx.moveTo(0, branchPos);
          ctx.lineTo(-branchLength, branchPos - branchLength * 0.5);
          ctx.moveTo(0, branchPos);
          ctx.lineTo(branchLength, branchPos - branchLength * 0.5);
          ctx.lineWidth = flake.radius / 6;
          ctx.stroke();
        }
      }
      
      // Central hexagon
      ctx.beginPath();
      for (let j = 0; j < 6; j++) {
        const angle = (Math.PI * 2 * j) / 6;
        const x = Math.cos(angle) * flake.radius * 0.2;
        const y = Math.sin(angle) * flake.radius * 0.2;
        if (j === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
    } else {
      // Simple circular snowflake with glow
      ctx.fillStyle = `rgba(255, 255, 255, ${flake.opacity})`;
      ctx.shadowBlur = flake.radius * 2;
      ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
      ctx.beginPath();
      ctx.arc(0, 0, flake.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.restore();
  }
  
  // Update wind particles with enhanced effects
  for (let i = windParticles.length - 1; i >= 0; i--) {
    const particle = windParticles[i];
    
    particle.life -= deltaTime / 1000;
    particle.swayPhase += particle.swaySpeed;
    
    // Add turbulence
    const turbulenceY = Math.sin(particle.swayPhase + (particle.turbulence || 0)) * 3;
    const turbulenceX = Math.cos(particle.swayPhase * 0.7) * 1.5;
    
    particle.x += particle.vx + turbulenceX;
    particle.y += particle.vy + turbulenceY;
    
    // Remove if out of bounds or expired
    if (particle.life <= 0 || 
        (particle.vx > 0 && particle.x > window.innerWidth + 50) ||
        (particle.vx < 0 && particle.x < -50)) {
      windParticles.splice(i, 1);
      continue;
    }
    
    // Draw enhanced wind streak
    ctx.save();
    const alpha = (particle.life / particle.maxLife) * particle.opacity;
    
    // Adjust color based on theme
    const windColor = isDark ? '200, 200, 200' : '100, 100, 100';
    
    // Create multi-layered gradient for depth
    const gradient = ctx.createLinearGradient(
      particle.x - 30, particle.y,
      particle.x + 30, particle.y
    );
    gradient.addColorStop(0, `rgba(${windColor}, 0)`);
    gradient.addColorStop(0.2, `rgba(${windColor}, ${alpha * 0.3})`);
    gradient.addColorStop(0.5, `rgba(${windColor}, ${alpha})`);
    gradient.addColorStop(0.8, `rgba(${windColor}, ${alpha * 0.3})`);
    gradient.addColorStop(1, `rgba(${windColor}, 0)`);
    
    // Draw main wind streak
    ctx.globalAlpha = alpha;
    ctx.fillStyle = gradient;
    ctx.fillRect(particle.x - 30, particle.y - particle.size, 60, particle.size * 2);
    
    // Add swirling particles
    for (let j = 0; j < 3; j++) {
      const offsetX = Math.sin(particle.swayPhase + j) * 10;
      const offsetY = Math.cos(particle.swayPhase + j) * 5;
      ctx.fillStyle = `rgba(${windColor}, ${alpha * 0.4})`;
      ctx.beginPath();
      ctx.arc(particle.x + offsetX, particle.y + offsetY, particle.size * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.restore();
  }
  
  // Update dust motes (clear weather) with theme-aware rendering
  for (let i = dustMotes.length - 1; i >= 0; i--) {
    const mote = dustMotes[i];
    
    mote.floatPhase += mote.floatSpeed;
    const turbulenceX = Math.sin(mote.floatPhase + (mote.turbulence || 0)) * 0.8;
    const turbulenceY = Math.cos(mote.floatPhase * 0.7) * 0.5;
    
    mote.x += mote.vx + turbulenceX;
    mote.y += mote.vy + turbulenceY;
    
    // Wrap around screen with smooth transition
    if (mote.x < -20) mote.x = window.innerWidth + 20;
    if (mote.x > window.innerWidth + 20) mote.x = -20;
    if (mote.y < -20) mote.y = window.innerHeight + 20;
    if (mote.y > window.innerHeight + 20) mote.y = -20;
    
    // Draw dust mote with theme-aware colors
    ctx.save();
    const shimmer = Math.sin(mote.floatPhase * 2) * 0.1;
    ctx.globalAlpha = mote.opacity + shimmer;
    
    // Use different colors for light and dark mode
    if (isDark) {
      ctx.fillStyle = `rgba(255, 223, 186, ${mote.opacity})`;
      ctx.shadowBlur = mote.size * 2;
      ctx.shadowColor = 'rgba(255, 223, 186, 0.3)';
    } else {
      // Darker particles in light mode for visibility
      ctx.fillStyle = `rgba(139, 90, 43, ${mote.opacity * 0.8})`;
      ctx.shadowBlur = mote.size * 2;
      ctx.shadowColor = 'rgba(139, 90, 43, 0.2)';
    }
    
    ctx.beginPath();
    ctx.arc(mote.x, mote.y, mote.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Update fog particles
  for (let i = fogParticles.length - 1; i >= 0; i--) {
    const fog = fogParticles[i];
    
    fog.life -= deltaTime / 1000;
    fog.swayPhase += fog.swaySpeed;
    
    const swayX = Math.sin(fog.swayPhase) * 2;
    const swayY = Math.cos(fog.swayPhase * 0.7) * 1;
    
    fog.x += fog.vx + swayX;
    fog.y += fog.vy + swayY;
    
    // Remove if expired or off screen
    if (fog.life <= 0 || fog.x > window.innerWidth + 200) {
      fogParticles.splice(i, 1);
      continue;
    }
    
    // Draw fog with gradient
    ctx.save();
    const alpha = (fog.life / fog.maxLife) * fog.opacity;
    
    const gradient = ctx.createRadialGradient(
      fog.x, fog.y, 0,
      fog.x, fog.y, fog.size
    );
    gradient.addColorStop(0, `rgba(200, 200, 200, ${alpha})`);
    gradient.addColorStop(0.7, `rgba(180, 180, 180, ${alpha * 0.5})`);
    gradient.addColorStop(1, `rgba(160, 160, 160, 0)`);
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(fog.x, fog.y, fog.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  
  // Update splash effects
  for (let i = splashEffects.length - 1; i >= 0; i--) {
    const splash = splashEffects[i];
    
    splash.vy += splash.gravity;
    splash.x += splash.vx;
    splash.y += splash.vy;
    splash.life -= deltaTime / 1000;
    
    if (splash.life <= 0) {
      splashEffects.splice(i, 1);
      continue;
    }
    
    // Draw splash particle
    ctx.save();
    ctx.globalAlpha = splash.opacity * (splash.life / splash.maxLife);
    ctx.fillStyle = `rgba(173, 216, 230, ${splash.opacity})`;
    ctx.beginPath();
    ctx.arc(splash.x, splash.y, splash.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  
  // Spawn new particles to maintain count
  if (currentWeatherData.main === "Rain" || currentWeatherData.main === "Thunderstorm") {
    const targetCount = currentWeatherData.main === "Thunderstorm" ? 
      CONFIG.animations.particles.rain.thunderstorm : 
      CONFIG.animations.particles.rain.normal;
    const adjustedTarget = Math.floor(targetCount * (window.innerWidth < 768 ? 0.6 : 1));
    
    while (rainDrops.length < adjustedTarget) {
      rainDrops.push(createRealisticRaindrop());
    }
  }
  
  if (currentWeatherData.main === "Snow") {
    const adjustedTarget = Math.floor(CONFIG.animations.particles.snow * (window.innerWidth < 768 ? 0.6 : 1));
    while (snowflakes.length < adjustedTarget) {
      snowflakes.push(createRealisticSnowflake());
    }
  }
  
  if ((currentWeatherData.main === "Clouds" || currentWeatherData.main === "Thunderstorm") && windParticles.length < 50) {
    windParticles.push(createWindParticle());
  }
  
  if (currentWeatherData.main === "Clear" && dustMotes.length < 30) {
    dustMotes.push(createDustMote());
  }

  if ((currentWeatherData.main === "Mist" || currentWeatherData.main === "Fog") && fogParticles.length < 40) {
    fogParticles.push(createFogParticle());
  }
  
  // Add heat shimmer effect for clear days
  if (currentWeatherData.main === "Clear" && !document.documentElement.classList.contains("dark")) {
    ctx.save();
    const shimmerIntensity = Math.sin(Date.now() / 2000) * 0.02 + 0.03;
    const gradient = ctx.createLinearGradient(0, window.innerHeight * 0.7, 0, window.innerHeight);
    gradient.addColorStop(0, `rgba(255, 223, 186, 0)`);
    gradient.addColorStop(0.5, `rgba(255, 223, 186, ${shimmerIntensity})`);
    gradient.addColorStop(1, `rgba(255, 223, 186, ${shimmerIntensity * 2})`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, window.innerHeight * 0.7, window.innerWidth, window.innerHeight * 0.3);
    ctx.restore();
  }
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
      case "Snow":
        statusText = `It's snowing in ${weatherData.name}. ${weatherData.temp}°C`;
        weatherClass = "snow";
        break;
      case "Mist":
      case "Fog":
        statusText = `Misty conditions in ${weatherData.name}. ${weatherData.temp}°C`;
        weatherClass = "foggy";
        break;
      case "Smoke":
      case "Haze":
      case "Dust":
        statusText = `Hazy conditions in ${weatherData.name}. ${weatherData.temp}°C`;
        weatherClass = "hazy";
        break;
      case "Sand":
      case "Ash":
        statusText = `Dusty conditions in ${weatherData.name}. ${weatherData.temp}°C`;
        weatherClass = "dusty";
        break;
      case "Squall":
      case "Tornado":
        statusText = `Severe weather in ${weatherData.name}. ${weatherData.temp}°C`;
        weatherClass = "severe";
        break;
      case "Clouds":
        statusText = `It's cloudy in ${weatherData.name}. ${weatherData.temp}°C`;
        weatherClass = "cloudy";
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

// --- Weather testing/override helpers ---
function normalizeWeatherMain(input) {
  if (!input) return null;
  const v = String(input).trim().toLowerCase();
  const map = {
    clear: 'Clear', sun: 'Clear', sunny: 'Clear',
    cloud: 'Clouds', clouds: 'Clouds', cloudy: 'Clouds',
    drizzle: 'Drizzle',
    rain: 'Rain', rainy: 'Rain',
    storm: 'Thunderstorm', thunder: 'Thunderstorm', thunderstorm: 'Thunderstorm',
    snow: 'Snow', snowy: 'Snow',
    mist: 'Mist', fog: 'Fog', foggy: 'Fog'
  };
  return map[v] || null;
}

function setWeatherUIFromMain(main, cityName = 'Test City', tempC = null) {
  // Build a minimal weatherData object so we can reuse existing UI path
  const weatherData = {
    main,
    description: main,
    temp: typeof tempC === 'number' ? Math.round(tempC) : '-',
    name: cityName,
  };

  // Keep currentWeatherData in sync
  currentWeatherData = weatherData;

  // Render status and classes (mirrors getWeatherData switch)
  const weatherMain = weatherData.main;
  let statusText = '';
  let weatherClass = '';
  switch (weatherMain) {
    case 'Thunderstorm':
      statusText = `A storm is passing by in ${weatherData.name}. ${weatherData.temp}°C`;
      weatherClass = 'thunderstorm';
      break;
    case 'Drizzle':
      statusText = `A gentle drizzle is falling in ${weatherData.name}. ${weatherData.temp}°C`;
      weatherClass = 'drizzle';
      break;
    case 'Rain':
      statusText = `It's raining in ${weatherData.name}. ${weatherData.temp}°C`;
      weatherClass = 'rain';
      break;
    case 'Snow':
      statusText = `It's snowing in ${weatherData.name}. ${weatherData.temp}°C`;
      weatherClass = 'snow';
      break;
    case 'Mist':
    case 'Fog':
      statusText = `Misty conditions in ${weatherData.name}. ${weatherData.temp}°C`;
      weatherClass = 'foggy';
      break;
    case 'Smoke':
    case 'Haze':
    case 'Dust':
      statusText = `Hazy conditions in ${weatherData.name}. ${weatherData.temp}°C`;
      weatherClass = 'hazy';
      break;
    case 'Sand':
    case 'Ash':
      statusText = `Dusty conditions in ${weatherData.name}. ${weatherData.temp}°C`;
      weatherClass = 'dusty';
      break;
    case 'Squall':
    case 'Tornado':
      statusText = `Severe weather in ${weatherData.name}. ${weatherData.temp}°C`;
      weatherClass = 'severe';
      break;
    case 'Clouds':
      statusText = `It's cloudy in ${weatherData.name}. ${weatherData.temp}°C`;
      weatherClass = 'cloudy';
      break;
    case 'Clear':
    default:
      statusText = `The sky is clear in ${weatherData.name}. ${weatherData.temp}°C`;
      weatherClass = 'clear';
      break;
  }

  const isDark = document.documentElement.classList.contains('dark');
  body.className = `weather-${weatherClass} ${isDark ? 'dark' : 'light'}`;
  if (weatherStatusElement) weatherStatusElement.textContent = statusText;
  setupWeatherParticles(weatherMain);
  updateConstellationFeatureVisibility();
}

function showWeatherOverrideBadge(label) {
  let badge = document.getElementById('weather-override-badge');
  if (!badge) {
    badge = document.createElement('div');
    badge.id = 'weather-override-badge';
    badge.style.position = 'fixed';
    badge.style.top = '8px';
    badge.style.left = '50%';
    badge.style.transform = 'translateX(-50%)';
    badge.style.zIndex = '50';
    badge.style.padding = '6px 10px';
    badge.style.borderRadius = '9999px';
    badge.style.fontSize = '12px';
    badge.style.fontWeight = '600';
    badge.style.backdropFilter = 'blur(8px)';
    badge.style.WebkitBackdropFilter = 'blur(8px)';
    badge.style.border = '1px solid rgba(255,255,255,0.3)';
    badge.style.pointerEvents = 'none';
    document.body.appendChild(badge);
  }
  const isDark = document.documentElement.classList.contains('dark');
  badge.style.color = isDark ? '#e5e7eb' : '#111827';
  badge.style.background = isDark ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.6)';
  badge.textContent = `TEST WEATHER: ${label}`;
}

function hideWeatherOverrideBadge() {
  const badge = document.getElementById('weather-override-badge');
  if (badge) badge.remove();
}

function applyWeatherOverride(rawCondition) {
  const main = normalizeWeatherMain(rawCondition);
  if (!main) return;
  setWeatherUIFromMain(main, 'Test Mode');
  showWeatherOverrideBadge(main);
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

// --- Mobile Sidebar Toggle Logic ---
const toggleLetterSidebar = document.getElementById("toggle-letter-sidebar");
const letterSidebar = document.getElementById("letter-sidebar");
const toggleBottleSidebar = document.getElementById("toggle-bottle-sidebar");
const bottleSidebar = document.getElementById("bottle-sidebar");

// Letter sidebar toggle - mobile functionality
if (toggleLetterSidebar && letterSidebar) {
  toggleLetterSidebar.addEventListener("click", () => {
    letterSidebar.classList.toggle("sidebar-open");
  });

  // Close sidebar when clicking outside on mobile
  letterModal.addEventListener("click", (e) => {
    if (window.innerWidth < 768 && !letterSidebar.contains(e.target) && !toggleLetterSidebar.contains(e.target)) {
      letterSidebar.classList.remove("sidebar-open");
    }
  });
}

// Bottle sidebar toggle
if (toggleBottleSidebar && bottleSidebar) {
  toggleBottleSidebar.addEventListener("click", () => {
    bottleSidebar.classList.toggle("-translate-x-full");
  });

  // Close sidebar when clicking outside on mobile
  bottleModal.addEventListener("click", (e) => {
    if (window.innerWidth < 768 && !bottleSidebar.contains(e.target) && !toggleBottleSidebar.contains(e.target)) {
      bottleSidebar.classList.add("-translate-x-full");
    }
  });
}

// Reset sidebar state when modals are opened/closed
const resetSidebarState = () => {
  // Reset both sidebars to closed state
  if (letterSidebar) letterSidebar.classList.remove("sidebar-open");
  if (bottleSidebar) bottleSidebar.classList.add("-translate-x-full");
};

// --- Mobile Modal Handling ---
function closeModalOnOutsideClick(modal) {
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.classList.remove("visible");
      setTimeout(() => modal.classList.add("hidden"), 300);
      resetSidebarState(); // Reset sidebar when modal closes
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
  resetSidebarState(); // Reset sidebar state when opening modal
});
closeLetterModalButton.addEventListener("click", () => {
  toggleBodyScroll(false);
  resetSidebarState();
});
closeComposerModalButton.addEventListener("click", () => {
  toggleBodyScroll(false);
  resetSidebarState();
});
openBottleModalButton.addEventListener("click", () => {
  toggleBodyScroll(true);
  resetSidebarState(); // Reset sidebar state when opening modal
});
closeBottleModalButton.addEventListener("click", () => {
  toggleBodyScroll(false);
  resetSidebarState();
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
  
  // UI Version 2 Toggle - Step 1 Foundation
  const params = new URLSearchParams(location.search);
  const uiV2 = params.get('uiv2');
  const storedUIVersion = localStorage.getItem('uiVersion');
  
  if (uiV2 === 'on') {
    localStorage.setItem('uiVersion', 'v2');
    document.body.setAttribute('data-ui', 'v2');
    console.log('UI v2 enabled - Enhanced glass morphism active');
  } else if (uiV2 === 'off') {
    localStorage.removeItem('uiVersion');
    document.body.removeAttribute('data-ui');
    console.log('UI v1 active - Original styling');
  } else if (storedUIVersion === 'v2') {
    document.body.setAttribute('data-ui', 'v2');
    console.log('UI v2 restored from localStorage');
  }
  
  // Weather override via URL (?weather=Rain), localStorage, or default to live
  const urlOverride = params.get('weather');
  const storedOverride = localStorage.getItem('weatherOverride');

  if (urlOverride) {
    localStorage.setItem('weatherOverride', urlOverride);
    applyWeatherOverride(urlOverride);
  } else if (storedOverride && storedOverride.toLowerCase() !== 'auto') {
    applyWeatherOverride(storedOverride);
  } else {
    hideWeatherOverrideBadge();
    getWeatherData();
    setInterval(getWeatherData, CONFIG.weather.updateInterval);
  }

  setupInteractiveStars();
  loadCloudImages();
  loadCustomIcons();
  animate();

  // Weather test hotkeys
  document.addEventListener('keydown', (e) => {
    const bindings = {
      '0': 'auto',
      '1': 'Clear',
      '2': 'Clouds',
      '3': 'Drizzle',
      '4': 'Rain',
      '5': 'Thunderstorm',
      '6': 'Snow',
      '7': 'Fog'
    };
    const target = bindings[e.key];
    if (!target) return;
    if (target === 'auto') {
      localStorage.setItem('weatherOverride', 'auto');
      hideWeatherOverrideBadge();
      getWeatherData();
    } else {
      localStorage.setItem('weatherOverride', target);
      applyWeatherOverride(target);
    }
  });
  
  // Interactive glass mouse tracking for v2
  if (document.body.getAttribute('data-ui') === 'v2') {
    setupInteractiveGlass();
    initializeV2FontPicker();
    enhanceV2Modals();
    enhanceV2ListCards();
    enhanceV2ReadingPaper();
  }

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

// UI v2 Interactive Glass Effects
function setupInteractiveGlass() {
  const interactiveElements = document.querySelectorAll('.interactive-glass');
  
  interactiveElements.forEach(element => {
    element.addEventListener('mousemove', (e) => {
      const rect = element.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      
      element.style.setProperty('--x', `${x}%`);
      element.style.setProperty('--y', `${y}%`);
    });
    
    element.addEventListener('mouseleave', () => {
      element.style.setProperty('--x', '50%');
      element.style.setProperty('--y', '50%');
    });
  });
  
  console.log('Interactive glass effects initialized for', interactiveElements.length, 'elements');
}

// UI v2 Font Picker System
const fontToPenMap = {
  'pen-caveat': 'resources/pen/pen1.svg',
  'pen-kalam': 'resources/pen/pen2.svg',
  'pen-shadows': 'resources/pen/pen3.svg',
  'pen-patrick': 'resources/pen/pen4.svg',
  'pen-indie': 'resources/pen/pen5.svg'
};

function applyV2Font(fontClass) {
  // Only apply if v2 is active
  if (document.body.getAttribute('data-ui') !== 'v2') return;
  
  // Remove all font classes from body
  Object.keys(fontToPenMap).forEach(font => {
    document.body.classList.remove(font);
  });
  
  // Add the selected font class
  document.body.classList.add(fontClass);
  
  // Update aria-checked states and visual selection
  const fontOptions = document.querySelectorAll('.font-option');
  fontOptions.forEach(option => {
    option.setAttribute('aria-checked', option.dataset.font === fontClass);
    if (option.dataset.font === fontClass) {
      option.classList.add('bg-blue-500/30', 'dark:bg-blue-400/30', 'border-blue-400/60', 'dark:border-blue-300/60');
      option.classList.remove('border-white/20', 'dark:border-white/30');
    } else {
      option.classList.remove('bg-blue-500/30', 'dark:bg-blue-400/30', 'border-blue-400/60', 'dark:border-blue-300/60');
      option.classList.add('border-white/20', 'dark:border-white/30');
    }
  });
  
  // Save to localStorage
  localStorage.setItem('v2SelectedFont', fontClass);
  console.log('Font applied:', fontClass);
}

function initializeV2FontPicker() {
  // Only initialize if v2 is active
  if (document.body.getAttribute('data-ui') !== 'v2') return;
  
  const fontOptions = document.querySelectorAll('.font-option');
  fontOptions.forEach(option => {
    option.addEventListener('click', () => {
      const fontClass = option.dataset.font;
      applyV2Font(fontClass);
    });
  });
  
  // Apply saved font or default
  const savedFont = localStorage.getItem('v2SelectedFont') || 'pen-kalam';
  applyV2Font(savedFont);
  
  console.log('v2 Font picker initialized');
}

// v2 Enhanced Modal Animations
function enhanceV2Modals() {
  // Only enhance if v2 is active
  if (document.body.getAttribute('data-ui') !== 'v2') return;
  
  const modals = document.querySelectorAll('.modal');
  
  modals.forEach(modal => {
    // Override existing modal show/hide with enhanced animations
    const originalShow = modal.classList.add;
    const originalHide = modal.classList.remove;
    
    // Enhanced show animation
    const showModal = () => {
      modal.classList.remove('hidden');
      modal.classList.add('visible', 'v2-modal-enter');
      
      // Remove animation class after animation completes
      setTimeout(() => {
        modal.classList.remove('v2-modal-enter');
      }, 500);
    };
    
    // Enhanced hide animation
    const hideModal = () => {
      modal.classList.remove('visible', 'v2-modal-enter');
      modal.classList.add('hidden');
    };
    
    // Listen for visibility changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          const classList = modal.classList;
          if (classList.contains('visible') && !classList.contains('v2-modal-enter')) {
            // Modal was shown, add our enhanced animation
            setTimeout(() => {
              modal.classList.add('v2-modal-enter');
              setTimeout(() => {
                modal.classList.remove('v2-modal-enter');
              }, 500);
            }, 10);
          }
        }
      });
    });
    
    observer.observe(modal, { attributes: true, attributeFilter: ['class'] });
  });
  
  // Add staggered animation to list items
  const addStaggeredAnimation = () => {
    const listCards = document.querySelectorAll('.list-card');
    listCards.forEach((card, index) => {
      card.style.animationDelay = `${index * 50}ms`;
    });
  };
  
  // Apply staggered animation when modals become visible
  const modalObserver = new MutationObserver(() => {
    setTimeout(addStaggeredAnimation, 100);
  });
  
  modals.forEach(modal => {
    modalObserver.observe(modal, { attributes: true, attributeFilter: ['class'] });
  });
  
  console.log('🎭 v2 Modal animations enhanced');
}

// v2 Enhanced List Card System
function enhanceV2ListCards() {
  // Only enhance if v2 is active
  if (document.body.getAttribute('data-ui') !== 'v2') return;
  
  // Apply organic rotation to existing and new cards
  const applyOrganicRotation = () => {
    const listCards = document.querySelectorAll('.list-card');
    listCards.forEach((card, index) => {
      // Generate consistent rotation based on content or index
      const rotation = (Math.random() * 3 - 1.5); // -1.5 to 1.5 degrees
      card.style.setProperty('--card-rotation', `rotate(${rotation}deg)`);
      
      // Set staggered animation delay
      card.style.animationDelay = `${index * 80}ms`;
    });
  };
  
  // Enhanced delete button interactions
  const enhanceDeleteButtons = () => {
    const deleteButtons = document.querySelectorAll('.list-card .delete-btn');
    deleteButtons.forEach(btn => {
      // Add enhanced hover effects
      btn.addEventListener('mouseenter', () => {
        btn.style.transform = 'scale(1.1)';
      });
      
      btn.addEventListener('mouseleave', () => {
        btn.style.transform = 'scale(1)';
      });
    });
  };
  
  // Enhanced number badge interactions
  const enhanceNumberBadges = () => {
    const numberBadges = document.querySelectorAll('.list-number');
    numberBadges.forEach(badge => {
      // Add micro-interaction on parent hover
      const parentCard = badge.closest('.list-card');
      if (parentCard) {
        parentCard.addEventListener('mouseenter', () => {
          badge.style.transform = 'scale(1.05)';
        });
        
        parentCard.addEventListener('mouseleave', () => {
          badge.style.transform = 'scale(1)';
        });
      }
    });
  };
  
  // Enhanced card hover effects
  const enhanceCardHovers = () => {
    const listCards = document.querySelectorAll('.list-card');
    listCards.forEach(card => {
      card.addEventListener('mouseenter', () => {
        // Ensure hover state removes rotation for clean scale
        const isDesktop = window.innerWidth >= 640;
        const scale = isDesktop ? 1.05 : 1.03;
        card.style.transform = `scale(${scale}) rotate(0deg)`;
        
        // Enhance content slide
        const content = card.querySelector('.list-content p');
        if (content) {
          content.style.transform = 'translateX(2px)';
        }
      });
      
      card.addEventListener('mouseleave', () => {
        // Restore organic rotation
        const rotation = card.style.getPropertyValue('--card-rotation') || 'rotate(0deg)';
        card.style.transform = `scale(1) ${rotation}`;
        
        // Reset content position
        const content = card.querySelector('.list-content p');
        if (content) {
          content.style.transform = 'translateX(0px)';
        }
      });
    });
  };
  
  // Observe for new cards being added
  const observeNewCards = () => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1 && node.classList?.contains('list-card')) {
            // Apply enhancements to new card
            setTimeout(() => {
              applyOrganicRotation();
              enhanceDeleteButtons();
              enhanceNumberBadges();
              enhanceCardHovers();
            }, 50);
          }
        });
      });
    });
    
    // Observe both letter and bottle containers
    const containers = [
      document.getElementById('past-letters-container'),
      document.getElementById('past-bottles-container')
    ].filter(Boolean);
    
    containers.forEach(container => {
      observer.observe(container, { childList: true, subtree: true });
    });
  };
  
  // Initial enhancement
  applyOrganicRotation();
  enhanceDeleteButtons();
  enhanceNumberBadges();
  enhanceCardHovers();
  observeNewCards();
  
  console.log('v2 List cards enhanced with organic rotation and micro-interactions');
}

// v2 Enhanced Reading Pane Paper Surface
function enhanceV2ReadingPaper() {
  // Only enhance if v2 is active
  if (document.body.getAttribute('data-ui') !== 'v2') return;
  
  // Enhanced paper animation triggers
  const triggerPaperAnimation = (paperElement) => {
    if (!paperElement) return;
    
    // Add entry animation
    paperElement.style.animation = 'v2PaperEnter 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)';
    
    // Remove animation class after completion
    setTimeout(() => {
      paperElement.style.animation = '';
    }, 600);
  };
  
  // Enhanced paper hover effects
  const addPaperInteractions = (paperElement) => {
    if (!paperElement) return;
    
    paperElement.addEventListener('mouseenter', () => {
      paperElement.style.transform = 'translateZ(0) translateY(-2px)';
    });
    
    paperElement.addEventListener('mouseleave', () => {
      paperElement.style.transform = 'translateZ(0) translateY(0px)';
    });
  };
  
  // Observe reading pane changes to trigger paper animations
  const observeReadingPanes = () => {
    const readingPanes = [
      document.getElementById('letter-reading-pane'),
      document.getElementById('bottle-reading-pane')
    ].filter(Boolean);
    
    readingPanes.forEach(pane => {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1 && node.classList?.contains('reading-paper')) {
              // New paper element added
              setTimeout(() => {
                triggerPaperAnimation(node);
                addPaperInteractions(node);
              }, 50);
            }
          });
        });
      });
      
      observer.observe(pane, { childList: true, subtree: true });
      
      // Enhance existing paper elements
      const existingPaper = pane.querySelector('.reading-paper');
      if (existingPaper) {
        addPaperInteractions(existingPaper);
      }
    });
  };
  
  // Enhanced typography adjustments based on selected font
  const adjustPaperTypography = () => {
    const body = document.body;
    const paperElements = document.querySelectorAll('.reading-paper');
    
    paperElements.forEach(paper => {
      // Adjust line height based on selected handwriting font
      if (body.classList.contains('pen-caveat')) {
        paper.style.lineHeight = '1.8';
        paper.style.letterSpacing = '0.02em';
      } else if (body.classList.contains('pen-kalam')) {
        paper.style.lineHeight = '1.75';
        paper.style.letterSpacing = '0.01em';
      } else if (body.classList.contains('pen-shadows')) {
        paper.style.lineHeight = '1.85';
        paper.style.letterSpacing = '0.015em';
      } else if (body.classList.contains('pen-patrick')) {
        paper.style.lineHeight = '1.7';
        paper.style.letterSpacing = '0.005em';
      } else if (body.classList.contains('pen-indie')) {
        paper.style.lineHeight = '1.8';
        paper.style.letterSpacing = '0.02em';
      }
    });
  };
  
  // Enhanced paper texture randomization
  const addPaperTextureVariation = () => {
    const paperElements = document.querySelectorAll('.reading-paper');
    
    paperElements.forEach((paper, index) => {
      // Add subtle texture variation
      const variation = (index % 3) + 1;
      paper.style.setProperty('--paper-texture-variation', variation);
      
      // Add subtle rotation for organic feel
      const rotation = (Math.random() * 0.5 - 0.25); // -0.25 to 0.25 degrees
      paper.style.setProperty('--paper-rotation', `${rotation}deg`);
    });
  };
  
  // Initialize paper enhancements
  observeReadingPanes();
  addPaperTextureVariation();
  
  // Listen for font changes to adjust typography
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('font-option')) {
      setTimeout(adjustPaperTypography, 100);
    }
  });
  
  console.log('📄 v2 Reading paper surface enhanced with animations and interactions');
}
