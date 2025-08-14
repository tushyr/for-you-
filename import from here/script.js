// --- Global Elements ---
const body = document.body;

// --- Font Picker Logic ---
const fontToPenMap = {
  'pen-caveat': 'resources/pen/pen1.svg',
  'pen-kalam': 'resources/pen/pen2.svg',
  'pen-shadows': 'resources/pen/pen3.svg',
  'pen-patrick': 'resources/pen/pen4.svg',
  'pen-indie': 'resources/pen/pen5.svg'
};

// Apply saved font on load
function applyFont(fontClass) {
  // Remove all font classes from body
  Object.keys(fontToPenMap).forEach(font => {
    body.classList.remove(font);
  });
  
  // Add the selected font class
  body.classList.add(fontClass);
  
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
}

// Handle font selection
function initializeFontPicker() {
  const fontOptions = document.querySelectorAll('.font-option');
  fontOptions.forEach(option => {
    option.addEventListener('click', () => {
      const selectedFont = option.dataset.font;
      localStorage.setItem('selectedFont', selectedFont);
      applyFont(selectedFont);
    });
  });
}



// --- Letter Box Logic ---
const letterModal = document.getElementById("letter-modal");
const letterComposer = document.getElementById("letter-composer");
const openLetterModalButton = document.getElementById("open-letter-modal");
const closeLetterModalButton = document.getElementById("close-letter-modal");
const openLetterComposerButton = document.getElementById("open-letter-composer");
const closeLetterComposerButton = document.getElementById("close-letter-composer");
const backToLetterInboxButton = document.getElementById("back-to-letter-inbox");
const saveLetterButton = document.getElementById("save-letter-button");
const letterTextarea = document.getElementById("letter-textarea");
const pastLettersContainer = document.getElementById("past-letters-container");
const letterNotificationDot = document.getElementById(
  "letter-notification-dot",
);
const letterReadingPane = document.getElementById("letter-reading-pane");
const letterIcon = document.getElementById("weather-animation");

// Modal content containers
const letterModalContent = document.getElementById("letter-modal-content");
const bottleModalContent = document.getElementById("bottle-modal-content");

let localLetters = [];

// --- Delete Confirmation Dialog Logic ---
let deleteConfirmation = null;
let deleteDialog = null;
let confirmDeleteBtn = null;
let cancelDeleteBtn = null;
let pendingDeleteAction = null;

function initializeDeleteConfirmation() {
  deleteConfirmation = document.getElementById("delete-confirmation");
  deleteDialog = document.getElementById("delete-dialog");
  confirmDeleteBtn = document.getElementById("confirm-delete");
  cancelDeleteBtn = document.getElementById("cancel-delete");

  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener("click", async () => {
      if (pendingDeleteAction) {
        await pendingDeleteAction();
      }
      hideDeleteConfirmation();
    });
  }

  if (cancelDeleteBtn) {
    cancelDeleteBtn.addEventListener("click", () => {
      hideDeleteConfirmation();
    });
  }

  // Close dialog when clicking on backdrop
  if (deleteConfirmation) {
    deleteConfirmation.addEventListener("click", (e) => {
      if (e.target === deleteConfirmation) {
        hideDeleteConfirmation();
      }
    });
  }
}

function showDeleteConfirmation(deleteAction) {
  console.log('showDeleteConfirmation called');
  
  if (!deleteConfirmation || !deleteDialog) {
    console.error('Delete confirmation elements not found!');
    return;
  }
  
  pendingDeleteAction = deleteAction;
  deleteConfirmation.classList.remove("hidden");
  
  // Use requestAnimationFrame to ensure the DOM update has been processed
  requestAnimationFrame(() => {
    deleteDialog.classList.remove("scale-95", "opacity-0");
    deleteDialog.classList.add("scale-100", "opacity-100");
  });
}

function hideDeleteConfirmation() {
  if (!deleteDialog || !deleteConfirmation) return;
  
  deleteDialog.classList.remove("scale-100", "opacity-100");
  deleteDialog.classList.add("scale-95", "opacity-0");
  
  setTimeout(() => {
    deleteConfirmation.classList.add("hidden");
    pendingDeleteAction = null;
  }, 300);
}

// Delete letter function
function deleteLetter(id) {
  console.log('Delete letter clicked for ID:', id);
  showDeleteConfirmation(async () => {
    try {
      await SyncAPI.deleteLetter(id);
      await renderLetters();
      checkUnreadLetters();
      
      // Clear reading pane if deleted letter was being displayed
      // Check if we still have letters after deletion
      if (localLetters.length === 0 || !localLetters.find(l => l.id === id)) {
        letterReadingPane.innerHTML = `<div class="reading-paper"><p class="text-center p-4 sm:p-8 text-gray-700 dark:text-gray-300">Select a letter from the list, or write a new one.</p></div>`;
      }
    } catch (error) {
      console.error("Failed to delete letter:", error);
    }
  });
}

// Delete bottle function
function deleteBottle(id) {
  console.log('Delete bottle clicked for ID:', id);
  showDeleteConfirmation(async () => {
    try {
      await SyncAPI.deleteBottle(id);
      await renderBottles();
      checkUnreadBottles();
      
      // Clear reading pane if deleted bottle was being displayed
      // Check if we still have bottles after deletion
      if (localBottles.length === 0 || !localBottles.find(b => b.id === id)) {
        bottleReadingPane.innerHTML = `<div class="reading-paper"><p class="text-center p-4 sm:p-8 text-gray-700 dark:text-gray-300">Send a message to the future.</p></div>`;
      }
    } catch (error) {
      console.error("Failed to delete bottle:", error);
    }
  });
}

// Open letter inbox
if (openLetterModalButton) {
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
}
// Close letter inbox
if (closeLetterModalButton) {
  closeLetterModalButton.addEventListener("click", () => {
    letterModal.classList.remove("visible");
    setTimeout(() => letterModal.classList.add("hidden"), 400);
  });
}

// Open letter composer
if (openLetterComposerButton) {
  openLetterComposerButton.addEventListener("click", () => {
    letterComposer.classList.remove("hidden");
    setTimeout(() => letterComposer.classList.add("visible"), 10);
    // Focus on textarea
    setTimeout(() => letterTextarea && letterTextarea.focus(), 100);
  });
}

// Close letter composer
if (closeLetterComposerButton) {
  closeLetterComposerButton.addEventListener("click", () => {
    letterComposer.classList.remove("visible");
    setTimeout(() => letterComposer.classList.add("hidden"), 400);
    // Clear textarea
    if (letterTextarea) letterTextarea.value = "";
  });
}

// Back to letter inbox
if (backToLetterInboxButton) {
  backToLetterInboxButton.addEventListener("click", () => {
    letterComposer.classList.remove("visible");
    setTimeout(() => {
      letterComposer.classList.add("hidden");
      letterModal.classList.remove("hidden");
      setTimeout(() => letterModal.classList.add("visible"), 10);
    }, 400);
    // Clear textarea
    if (letterTextarea) letterTextarea.value = "";
  });
}

// Remove old mobile FAB actions since we have dedicated composer now

saveLetterButton.addEventListener("click", async () => {
  const text = letterTextarea.value.trim();
  if (text) {
    const newLetter = {
      id: Date.now(),
      text,
      createdAt: new Date().toISOString(),
      updatedAt: Date.now()
    };
    await SyncAPI.saveLetter(newLetter);
    letterTextarea.value = "";
    await renderLetters();
    
    // Navigate back to inbox after saving
    letterComposer.classList.remove("visible");
    setTimeout(() => {
      letterComposer.classList.add("hidden");
      letterModal.classList.remove("hidden");
      setTimeout(() => letterModal.classList.add("visible"), 10);
    }, 400);
  }
});

async function renderLetters() {
  pastLettersContainer.innerHTML = "";
  localLetters = await SyncAPI.getLetters();
  const sortedLetters = [...localLetters].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  );

  if (sortedLetters.length === 0) {
    letterReadingPane.innerHTML = `<div class="reading-paper"><p class="text-center p-4 sm:p-8 text-gray-700 dark:text-gray-300">Select a letter from the list, or write a new one.</p></div>`;
    pastLettersContainer.innerHTML =
      '<p class="text-base sm:text-lg text-gray-500 dark:text-gray-400">No letters written yet.</p>';
  } else {
    sortedLetters.forEach((letter, index) => {
      const letterCard = document.createElement("div");
      letterCard.className =
        "list-card group p-2 sm:p-3 rounded-lg border-2 border-transparent cursor-pointer";
      letterCard.style.transform = `rotate(${Math.random() * 3 - 1.5}deg)`;
      letterCard.dataset.letterId = letter.id;
      const number = index + 1;
      
      letterCard.innerHTML = `
        <div class="list-item relative">
          <span class="list-number">${number}</span>
          <div class="list-content">
            <p class="font-semibold text-gray-800 dark:text-gray-100 truncate text-base sm:text-lg">${letter.text}</p>
            <p class="text-sm sm:text-base text-gray-500 dark:text-gray-300 mt-1">${new Date(letter.createdAt).toLocaleDateString()}</p>
          </div>
          <button 
            class="delete-btn absolute top-1 right-1 w-5 h-5 bg-red-500/80 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold transition-all hover:scale-110 opacity-0 group-hover:opacity-100"
            data-letter-id="${letter.id}"
            title="Delete letter"
          >
            ×
          </button>
        </div>`;
      pastLettersContainer.appendChild(letterCard);
    });
    displayLetter(sortedLetters[0]);
  }
}

pastLettersContainer.addEventListener("click", (e) => {
  console.log('Letter container clicked, target:', e.target);
  
  // Check if delete button was clicked (or any child element inside it)
  const deleteBtn = e.target.closest(".delete-btn");
  if (deleteBtn) {
    console.log('Delete button detected!');
    e.stopPropagation();
    const letterId = Number(deleteBtn.dataset.letterId);
    console.log('Letter ID to delete:', letterId);
    deleteLetter(letterId);
    return;
  }
  
  const card = e.target.closest(".list-card");
  if (card) {
    const letter = localLetters.find(
      (l) => l.id === Number(card.dataset.letterId),
    );
    if (letter) {
      displayLetter(letter);
      // Auto-hide sidebar on mobile after selecting
      if (window.innerWidth < 768 && letterModalContent) {
        letterModalContent.classList.remove("show-sidebar");
      }
    }
  }
});

function displayLetter(letter) {
  letterReadingPane.innerHTML = `<div class="reading-paper"><div class="whitespace-pre-wrap">${letter.text}</div></div>`;
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
    (letter) => new Date(letter.createdAt) > new Date(lastOpened),
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
const bottleComposer = document.getElementById("bottle-composer");
const openBottleModalButton = document.getElementById("open-bottle-modal");
const closeBottleModalButton = document.getElementById("close-bottle-modal");
const openBottleComposerButton = document.getElementById("open-bottle-composer");
const closeBottleComposerButton = document.getElementById("close-bottle-composer");
const backToBottleInboxButton = document.getElementById("back-to-bottle-inbox");
const saveBottleButton = document.getElementById("save-bottle-button");
const bottleTextarea = document.getElementById("bottle-textarea");
const unlockDateInput = document.getElementById("unlock-date");
const pastBottlesContainer = document.getElementById("past-bottles-container");
const bottleNotificationDot = document.getElementById(
  "bottle-notification-dot",
);
const bottleReadingPane = document.getElementById("bottle-reading-pane");

let localBottles = [];

function setMinUnlockDate() {
  const today = new Date();
  today.setDate(today.getDate() + 1);
  unlockDateInput.min = today.toISOString().split("T")[0];
  unlockDateInput.value = unlockDateInput.min;
}

// Open bottle inbox
if (openBottleModalButton) {
  openBottleModalButton.addEventListener("click", () => {
    bottleModal.classList.remove("hidden");
    setTimeout(() => bottleModal.classList.add("visible"), 10);
    localStorage.setItem(
      CONFIG.storage.lastOpenedBottles,
      new Date().toISOString(),
    );
    checkUnreadBottles();
  });
}
// Close bottle inbox
if (closeBottleModalButton) {
  closeBottleModalButton.addEventListener("click", () => {
    bottleModal.classList.remove("visible");
    setTimeout(() => bottleModal.classList.add("hidden"), 400);
  });
}

// Open bottle composer
if (openBottleComposerButton) {
  openBottleComposerButton.addEventListener("click", () => {
    bottleComposer.classList.remove("hidden");
    setTimeout(() => bottleComposer.classList.add("visible"), 10);
    // Focus on textarea
    setTimeout(() => bottleTextarea && bottleTextarea.focus(), 100);
  });
}

// Close bottle composer
if (closeBottleComposerButton) {
  closeBottleComposerButton.addEventListener("click", () => {
    bottleComposer.classList.remove("visible");
    setTimeout(() => bottleComposer.classList.add("hidden"), 400);
    // Clear form
    if (bottleTextarea) bottleTextarea.value = "";
    setMinUnlockDate();
  });
}

// Back to bottle inbox
if (backToBottleInboxButton) {
  backToBottleInboxButton.addEventListener("click", () => {
    bottleComposer.classList.remove("visible");
    setTimeout(() => {
      bottleComposer.classList.add("hidden");
      bottleModal.classList.remove("hidden");
      setTimeout(() => bottleModal.classList.add("visible"), 10);
    }, 400);
    // Clear form
    if (bottleTextarea) bottleTextarea.value = "";
    setMinUnlockDate();
  });
}

// Remove old mobile FAB actions since we have dedicated composer now

saveBottleButton.addEventListener("click", async () => {
  const text = bottleTextarea.value.trim();
  const unlockDate = unlockDateInput.value;

  if (text && unlockDate) {
    const newBottle = {
      id: Date.now(),
      text,
      unlockDate,
      createdAt: new Date().toISOString(),
      updatedAt: Date.now()
    };
    await SyncAPI.saveBottle(newBottle);
    bottleTextarea.value = "";
    unlockDateInput.value = "";
    setMinUnlockDate();
    await renderBottles();
    
    // Navigate back to inbox after saving
    bottleComposer.classList.remove("visible");
    setTimeout(() => {
      bottleComposer.classList.add("hidden");
      bottleModal.classList.remove("hidden");
      setTimeout(() => bottleModal.classList.add("visible"), 10);
    }, 400);
  }
});

async function renderBottles() {
  pastBottlesContainer.innerHTML = "";
  localBottles = await SyncAPI.getBottles();
  const sortedBottles = [...localBottles].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  );
  const now = new Date();

  if (sortedBottles.length === 0) {
    bottleReadingPane.innerHTML = `<div class=\"reading-paper\"><p class=\"text-center p-4 sm:p-8 text-gray-700 dark:text-gray-300\">Send a message to the future.</p></div>`;
    pastBottlesContainer.innerHTML =
      '<p class="text-base sm:text-lg text-gray-500 dark:text-gray-400">No bottles sent yet.</p>';
    return;
  }

  let firstUnlockedBottle = null;
  sortedBottles.forEach((bottle) => {
    const unlockDate = new Date(bottle.unlockDate);
    unlockDate.setHours(0, 0, 0, 0);
    const isUnlocked = now >= unlockDate;
    if (isUnlocked && !firstUnlockedBottle) firstUnlockedBottle = bottle;

    const bottleCard = document.createElement("div");
    bottleCard.className =
      "list-card group p-2 sm:p-3 rounded-lg border-2 border-transparent";
    bottleCard.style.transform = `rotate(${Math.random() * 3 - 1.5}deg)`;
    bottleCard.dataset.bottleId = bottle.id;

    const deleteButton = `
      <button 
        class="delete-btn absolute top-1 right-1 w-5 h-5 bg-red-500/80 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold transition-all hover:scale-110 opacity-0 group-hover:opacity-100"
        data-bottle-id="${bottle.id}"
        title="Delete bottle"
      >
        ×
      </button>
    `;

    if (isUnlocked) {
      bottleCard.classList.add("cursor-pointer");
      bottleCard.innerHTML = `<div class="relative"><p class="font-semibold text-gray-800 dark:text-gray-100 truncate text-base sm:text-lg">${bottle.text}</p><p class="text-sm sm:text-base text-gray-500 dark:text-gray-300 mt-1">Opened on ${unlockDate.toLocaleDateString()}</p>${deleteButton}</div>`;
    } else {
      bottleCard.classList.add("locked");
      bottleCard.innerHTML = `<div class="relative"><div class="flex items-center space-x-2"><svg class="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 2a2 2 0 00-2 2v1H6a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2V4a2 2 0 00-2-2zm-1 4V4a1 1 0 112 0v2H9z" clip-rule="evenodd" /></svg><p class="font-semibold text-gray-800 dark:text-gray-100 text-base sm:text-lg">Message in a Bottle</p></div><p class="text-sm sm:text-base text-gray-500 dark:text-gray-300 mt-1">Unlocks on ${unlockDate.toLocaleDateString()}</p>${deleteButton}</div>`;
    }
    pastBottlesContainer.appendChild(bottleCard);
  });

  if (firstUnlockedBottle) {
    displayBottle(firstUnlockedBottle);
  } else {
    bottleReadingPane.innerHTML = `<div class=\"reading-paper\"><p class=\"text-center p-4 sm:p-8 text-gray-700 dark:text-gray-300\">A bottle is waiting to be opened...</p></div>`;
  }
}

pastBottlesContainer.addEventListener("click", (e) => {
  console.log('Bottle container clicked, target:', e.target);
  
  // Check if delete button was clicked (or any child element inside it)
  const deleteBtn = e.target.closest(".delete-btn");
  if (deleteBtn) {
    console.log('Delete button detected for bottle!');
    e.stopPropagation();
    const bottleId = Number(deleteBtn.dataset.bottleId);
    console.log('Bottle ID to delete:', bottleId);
    deleteBottle(bottleId);
    return;
  }
  
  const card = e.target.closest(".list-card:not(.locked)");
  if (card) {
    const bottle = localBottles.find(
      (b) => b.id === Number(card.dataset.bottleId),
    );
    if (bottle) {
      displayBottle(bottle);
      // Auto-hide sidebar on mobile after selecting
      if (window.innerWidth < 768 && bottleModalContent) {
        bottleModalContent.classList.remove("show-sidebar");
      }
    }
  }
});

function displayBottle(bottle) {
  const now = new Date();
  const unlockDate = new Date(bottle.unlockDate);
  unlockDate.setHours(0, 0, 0, 0);
  if (now < unlockDate) {
    bottleReadingPane.innerHTML = `<p class="text-center p-4 sm:p-8 text-gray-700 dark:text-gray-300">This bottle is still sealed. It will open on ${unlockDate.toLocaleDateString()}.</p>`;
    return;
  }

  bottleReadingPane.innerHTML = `<div class="reading-paper"><div class="whitespace-pre-wrap">${bottle.text}</div></div>`;
  document
    .querySelectorAll("#past-bottles-container .list-card")
    .forEach((c) => c.classList.remove("active"));
  const activeCard = document.querySelector(
    `#past-bottles-container .list-card[data-bottle-id='${bottle.id}']`,
  );
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

  if (document.documentElement.classList.contains("dark")) {
    localStorage.setItem(CONFIG.storage.theme, "dark");
    // In dark mode, show light mode icon (to switch to light)
    if (themeToggleIcon) {
      themeToggleIcon.src = "resources/icons/when_light_mode.svg";
      themeToggleIcon.alt = "Switch to Light Mode";
    }
  } else {
    localStorage.setItem(CONFIG.storage.theme, "light");
    // In light mode, show dark mode icon (to switch to dark)
    if (themeToggleIcon) {
      themeToggleIcon.src = "resources/icons/when_dark_mode.svg";
      themeToggleIcon.alt = "Switch to Dark Mode";
    }
  }
  
});

function setInitialTheme() {
  if (
    localStorage.getItem(CONFIG.storage.theme) === "dark" ||
    (!(CONFIG.storage.theme in localStorage) &&
      window.matchMedia("(prefers-color-scheme: dark)").matches)
  ) {
    document.documentElement.classList.add("dark");
    // In dark mode, show light mode icon (to switch to light)
    if (themeToggleIcon) {
      themeToggleIcon.src = "resources/icons/when_light_mode.svg";
      themeToggleIcon.alt = "Switch to Light Mode";
    }
  } else {
    document.documentElement.classList.remove("dark");
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


const bgCtx = bgCanvas.getContext("2d");
const weatherCtx = weatherCanvas.getContext("2d");
const lightningCtx = lightningCanvas.getContext("2d");
const cloudsCtx = cloudsCanvas.getContext("2d");


const weatherStatusElement = document.getElementById("weather-status");


function resizeCanvases() {
  const isMobile = window.innerWidth < 768;
  
  // Work entirely in logical pixels - no DPR scaling
  [bgCanvas, weatherCanvas, lightningCanvas, cloudsCanvas].forEach(canvas => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    
    const ctx = canvas.getContext('2d');
    // Remove DPR scaling to maintain consistent coordinate system
    
    // Optimize canvas context
    ctx.imageSmoothingEnabled = !isMobile;
    ctx.imageSmoothingQuality = isMobile ? 'low' : 'high';
  });
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

// --- Sprite Sheet System ---
// --- Bird Sequence State ---
let birdsSequenceToday = { morning: false, evening: false };
let lastBirdSequenceDay = null;
let birdSequenceTimeouts = [];

function isBirdSequenceTime() {
  // Get local time (use timezone if needed)
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  // Morning: 5:30-8:30, Evening: 17:30-19:30
  const isMorning = (hours > 5 && hours < 8) || (hours === 5 && minutes >= 30) || (hours === 8 && minutes <= 30);
  const isEvening = (hours > 17 && hours < 19) || (hours === 17 && minutes >= 30) || (hours === 19 && minutes <= 30);
  return { isMorning, isEvening, day: now.toDateString() };
}

function maybeTriggerBirdSequence() {
  // Reset flags at midnight
  const now = new Date();
  const { isMorning, isEvening, day } = isBirdSequenceTime();
  if (lastBirdSequenceDay !== day) {
    birdsSequenceToday = { morning: false, evening: false };
    lastBirdSequenceDay = day;
    // Clear any pending timeouts
    birdSequenceTimeouts.forEach(clearTimeout);
    birdSequenceTimeouts = [];
  }
  if (!currentWeatherData || currentWeatherData.main !== "Clear") return;
  if (isMorning && !birdsSequenceToday.morning) {
    startBirdSequence("morning");
  } else if (isEvening && !birdsSequenceToday.evening) {
    startBirdSequence("evening");
  }
}

function startBirdSequence(period) {
  birdsSequenceToday[period] = true;
  // Sequence: 1 bird now, 3 after 15s, 5 after 30s, 8 after 30s (total 74s)
  spawnBirdFlock(1);
  birdSequenceTimeouts.push(setTimeout(() => spawnBirdFlock(3), 15000));
  birdSequenceTimeouts.push(setTimeout(() => spawnBirdFlock(5), 15000 + 30000));
  birdSequenceTimeouts.push(setTimeout(() => spawnBirdFlock(8), 15000 + 30000 + 30000));
}

function spawnBirdFlock(count) {
  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      spawnSprite("bird", {
        y: 80 + Math.random() * 250,
        vx: 1.5 + Math.random() * 2.5,
        vy: (Math.random() - 0.5) * 0.3,
        scale: 0.25 + Math.random() * 0.15
      });
    }, i * (200 + Math.random() * 300));
  }
}

const SPRITE_SHEETS = {
  bird: {
    src: "resources/sprites/bird.png",
    cols: 4,
    rows: 2,
    frames: 8,
    fps: 12
  }
};

const loadedSheets = {};
const sprites = [];
let spritesLoaded = false;
// Pixels to trim from each side of a frame to avoid sampling neighboring frames
const SPRITE_BLEED = 2;

function loadSpriteSheets() {
  const keys = Object.keys(SPRITE_SHEETS);
  if (keys.length === 0) {
    spritesLoaded = true;
    return;
  }
  
  let loaded = 0;
  keys.forEach((key) => {
    const def = SPRITE_SHEETS[key];
    const img = new Image();
    
    img.onload = () => {
      const frameWidth = Math.floor(img.naturalWidth / def.cols);
      const frameHeight = Math.floor(img.naturalHeight / def.rows);
      loadedSheets[key] = { 
        ...def, 
        img, 
        frameWidth, 
        frameHeight 
      };
      
      loaded++;
      if (loaded === keys.length) {
        spritesLoaded = true;
        console.log(`Loaded ${keys.length} sprite sheets`);
      }
    };
    
    img.onerror = () => {
      console.warn(`Failed to load sprite sheet: ${def.src}`);
      loaded++;
      if (loaded === keys.length) {
        spritesLoaded = true;
      }
    };
    
    img.src = def.src;
  });
}

function spawnSprite(name, options = {}) {
  const def = loadedSheets[name];
  if (!def) return;
  
  const now = performance.now();
  sprites.push({
    name,
    x: options.x ?? -def.frameWidth * 0.3, // Start further off-screen
    y: options.y ?? 120,
    vx: options.vx ?? 3,
    vy: options.vy ?? 0,
    scale: options.scale ?? 0.3, // Much smaller default scale
    rotation: options.rotation ?? 0,
    alpha: options.alpha ?? 1,
    frame: 0,
    lastFrameChange: now,
    alive: true,
    loop: options.loop ?? true,
    lifeMs: options.lifeMs ?? null,
    birth: now
  });
}

function updateAndDrawSprites(ctx) {
  if (!spritesLoaded) return;
  
  const now = performance.now();
  
  for (let i = sprites.length - 1; i >= 0; i--) {
    const sprite = sprites[i];
    const def = loadedSheets[sprite.name];
    
    if (!def) {
      sprites.splice(i, 1);
      continue;
    }
    
    // Update animation frame
    const frameInterval = 1000 / def.fps;
    if (now - sprite.lastFrameChange >= frameInterval) {
      sprite.frame = (sprite.frame + 1) % def.frames;
      sprite.lastFrameChange = now;
      
      if (!sprite.loop && sprite.frame === def.frames - 1) {
        sprite.alive = false;
      }
    }
    
    // Update position
    sprite.x += sprite.vx;
    sprite.y += sprite.vy;
    
    // Check if sprite should be removed
    if (sprite.lifeMs && now - sprite.birth > sprite.lifeMs) {
      sprite.alive = false;
    }
    
    // Use cropped (safe) dimensions for culling to prevent edge bleed
    const bleed = typeof def.bleed === 'number' ? def.bleed : SPRITE_BLEED;
    const safeW = Math.max(1, def.frameWidth - bleed * 2);
    const safeH = Math.max(1, def.frameHeight - bleed * 2);
    const scaledWidth = safeW * sprite.scale;
    const scaledHeight = safeH * sprite.scale;
    
    if (sprite.x > window.innerWidth + scaledWidth || 
        sprite.x < -scaledWidth ||
        sprite.y > window.innerHeight + scaledHeight || 
        sprite.y < -scaledHeight) {
      sprite.alive = false;
    }
    
    if (!sprite.alive) {
      sprites.splice(i, 1);
      continue;
    }
    
    // Calculate source rectangle
    const col = sprite.frame % def.cols;
    const row = Math.floor(sprite.frame / def.cols);
    const sx = col * def.frameWidth + bleed;
    const sy = row * def.frameHeight + bleed;
    const sw = safeW;
    const sh = safeH;
    
    // Draw sprite
    ctx.save();
    ctx.globalAlpha = sprite.alpha;
    // Snap to integer pixels to reduce sampling of neighbor frames
    ctx.translate(Math.round(sprite.x), Math.round(sprite.y));
    if (sprite.rotation) ctx.rotate(sprite.rotation);
    ctx.scale(sprite.scale, sprite.scale);
    
    ctx.drawImage(
      def.img,
      sx, sy, sw, sh,
      -sw / 2, -sh / 2,
      sw, sh
    );
    
    ctx.restore();
  }
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

function setupWeatherParticles(weather) {
  const isThunderstorm = weather === "Thunderstorm";
  const isRain = weather === "Rain" || isThunderstorm || weather === "Drizzle";
  const isCloudy = weather === "Clouds" || isThunderstorm;
  const isSnow = weather === "Snow";
  const isClear = weather === "Clear";
  const isWindy = isCloudy || isThunderstorm;

  const isMobile = window.innerWidth < 768;
  const particleMultiplier = isMobile ? 0.6 : 1;
  
  // Clear existing particles
  weatherParticles = [];
  splashEffects = [];
  windParticles = [];
  dustMotes = [];
  snowflakes = [];
  rainDrops = [];
  
  if (isRain) {
    const rainCount = isThunderstorm ? 
      Math.floor(200 * particleMultiplier) : 
      Math.floor(150 * particleMultiplier);
    
    for (let i = 0; i < rainCount; i++) {
      rainDrops.push(createRealisticRaindrop());
    }
  }
  
  if (isSnow) {
    const snowCount = Math.floor(100 * particleMultiplier);
    for (let i = 0; i < snowCount; i++) {
      snowflakes.push(createRealisticSnowflake());
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

  setupWeatherParticles(currentWeatherData.main);
});

function createStar() {
  return {
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
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

function createCloud() {
  const isStorm = currentWeatherData.main === "Thunderstorm";
  // Reduce cloud sizes for mobile
  const isMobile = window.innerWidth < 768;
  const baseSize = isMobile ? 
    (Math.random() * 60 + 40) : // Smaller on mobile
    (Math.random() * 100 + 80);  // Original size on desktop
  
  return {
    x: Math.random() * (window.innerWidth + 300) - 150,
    y: Math.random() * window.innerHeight * 0.5,
    width: baseSize + Math.random() * (isMobile ? 30 : 60),
    height: baseSize * 0.7 + Math.random() * (isMobile ? 15 : 30),
    speed: Math.random() * (isMobile ? 0.2 : 0.4) + 0.1,
    opacity: Math.random() * (isStorm ? 0.5 : 0.4) + (isStorm ? 0.7 : 0.5),
    scale: isMobile ? (0.4 + Math.random() * 0.4) : (0.6 + Math.random() * 0.8),
    rotation: Math.random() * 30 - 15,
    isDark: isStorm && Math.random() > 0.2,
    imageIndex: Math.floor(Math.random() * cloudImagesTotal),
    driftY: (Math.random() - 0.5) * (isMobile ? 0.03 : 0.05),
    pulsePhase: Math.random() * Math.PI * 2,
  };
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

function checkParticleCollision(particle, elements) {
  for (const element of elements) {
    if (particle.x >= element.x && 
        particle.x <= element.x + element.width &&
        particle.y >= element.y && 
        particle.y <= element.y + element.height) {
      return element;
    }
  }
  return null;
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
      // Simple circular snowflake
      ctx.fillStyle = `rgba(255, 255, 255, ${flake.opacity})`;
      ctx.beginPath();
      ctx.arc(0, 0, flake.radius, 0, Math.PI * 2);
      ctx.fill();
      
      // Add subtle glow
      ctx.shadowBlur = flake.radius * 2;
      ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
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
    } else {
      // Darker particles in light mode for visibility
      ctx.fillStyle = `rgba(139, 90, 43, ${mote.opacity * 0.8})`;
    }
    
    // Add subtle glow effect
    ctx.shadowBlur = mote.size * 2;
    ctx.shadowColor = isDark ? 'rgba(255, 223, 186, 0.3)' : 'rgba(139, 90, 43, 0.2)';
    
    ctx.beginPath();
    ctx.arc(mote.x, mote.y, mote.size, 0, Math.PI * 2);
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
    const targetCount = currentWeatherData.main === "Thunderstorm" ? 200 : 150;
    while (rainDrops.length < targetCount * (window.innerWidth < 768 ? 0.6 : 1)) {
      rainDrops.push(createRealisticRaindrop());
    }
  }
  
  if (currentWeatherData.main === "Snow") {
    while (snowflakes.length < 100 * (window.innerWidth < 768 ? 0.6 : 1)) {
      snowflakes.push(createRealisticSnowflake());
    }
  }
  
  if ((currentWeatherData.main === "Clouds" || currentWeatherData.main === "Thunderstorm") && windParticles.length < 50) {
    windParticles.push(createWindParticle());
  }
  
  if (currentWeatherData.main === "Clear" && dustMotes.length < 30) {
    dustMotes.push(createDustMote());
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

resizeCanvases();
for (let i = 0; i < CONFIG.animations.stars.count; i++) {
  stars.push(createStar());
} // Reduced for mobile performance

let lastFrameTime = 0;
const targetFPS = 30; // Lower FPS for mobile
const frameInterval = 1000 / targetFPS;

function animate(currentTime) {
  maybeTriggerBirdSequence();
  // Throttle frame rate
  if (currentTime - lastFrameTime < frameInterval) {
    requestAnimationFrame(animate);
    return;
  }
  lastFrameTime = currentTime;

  const isDarkMode = document.documentElement.classList.contains("dark");

  // Theme-aware background fill
  if (isDarkMode) {
    bgCtx.fillStyle = 'rgba(0, 0, 0, 0.2)';
  } else {
    bgCtx.fillStyle = 'rgba(135, 206, 235, 0.1)'; // Light blue overlay for light mode
  }
  bgCtx.fillRect(0, 0, window.innerWidth, window.innerHeight);
  
  // Clear all other canvases
  cloudsCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  weatherCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  lightningCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  
  // Reset transforms to identity matrix
  cloudsCtx.setTransform(1, 0, 0, 1, 0, 0);
  weatherCtx.setTransform(1, 0, 0, 1, 0, 0);
  
  // Update and draw sprites (behind clouds)
  updateAndDrawSprites(weatherCtx);

  if (isDarkMode) {
    // Draw regular stars
    stars.forEach((star) => {
      bgCtx.beginPath();
      bgCtx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      bgCtx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
      bgCtx.fill();
      star.x += star.speedX;
      star.y += star.speedY;
      if (star.x < 0) star.x = window.innerWidth;
      if (star.x > window.innerWidth) star.x = 0;
      if (star.y < 0) star.y = window.innerHeight;
      if (star.y > window.innerHeight) star.y = 0;
    });
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

// ...

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
      toggleBodyScroll(false);
    }
  });
}

closeModalOnOutsideClick(letterModal);
closeModalOnOutsideClick(bottleModal);

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

if (openLetterModalButton) {
  openLetterModalButton.addEventListener("click", () => {
    toggleBodyScroll(true);
  });
}
if (closeLetterModalButton) {
  closeLetterModalButton.addEventListener("click", () => {
    toggleBodyScroll(false);
  });
}
if (openBottleModalButton) {
  openBottleModalButton.addEventListener("click", () => {
    toggleBodyScroll(true);
  });
}
if (closeBottleModalButton) {
  closeBottleModalButton.addEventListener("click", () => {
    toggleBodyScroll(false);
  });
}

// --- Mobile Sidebar Toggle Logic ---
function setupMobileSidebars() {
  // Letter sidebar elements
  const toggleLetterSidebar = document.getElementById("toggle-letter-sidebar");
  const closeLetterSidebar = document.getElementById("close-letter-sidebar");
  const letterSidebar = document.getElementById("letter-sidebar");
  const letterSidebarOverlay = document.getElementById("letter-sidebar-overlay");

  // Bottle sidebar elements
  const toggleBottleSidebar = document.getElementById("toggle-bottle-sidebar");
  const closeBottleSidebar = document.getElementById("close-bottle-sidebar");
  const bottleSidebar = document.getElementById("bottle-sidebar");
  const bottleSidebarOverlay = document.getElementById("bottle-sidebar-overlay");

  // Letter sidebar functionality
  if (toggleLetterSidebar && letterSidebar && letterSidebarOverlay) {
    toggleLetterSidebar.addEventListener("click", () => {
      letterSidebar.classList.remove("-translate-x-full");
      letterSidebarOverlay.classList.remove("opacity-0", "pointer-events-none");
      letterSidebarOverlay.classList.add("opacity-100", "pointer-events-auto");
    });

    const closeLetterSidebarHandler = () => {
      letterSidebar.classList.add("-translate-x-full");
      letterSidebarOverlay.classList.add("opacity-0", "pointer-events-none");
      letterSidebarOverlay.classList.remove("opacity-100", "pointer-events-auto");
    };

    if (closeLetterSidebar) {
      closeLetterSidebar.addEventListener("click", closeLetterSidebarHandler);
    }

    letterSidebarOverlay.addEventListener("click", closeLetterSidebarHandler);
  }

  // Bottle sidebar functionality
  if (toggleBottleSidebar && bottleSidebar && bottleSidebarOverlay) {
    toggleBottleSidebar.addEventListener("click", () => {
      bottleSidebar.classList.remove("-translate-x-full");
      bottleSidebarOverlay.classList.remove("opacity-0", "pointer-events-none");
      bottleSidebarOverlay.classList.add("opacity-100", "pointer-events-auto");
    });

    const closeBottleSidebarHandler = () => {
      bottleSidebar.classList.add("-translate-x-full");
      bottleSidebarOverlay.classList.add("opacity-0", "pointer-events-none");
      bottleSidebarOverlay.classList.remove("opacity-100", "pointer-events-auto");
    };

    if (closeBottleSidebar) {
      closeBottleSidebar.addEventListener("click", closeBottleSidebarHandler);
    }

    bottleSidebarOverlay.addEventListener("click", closeBottleSidebarHandler);
  }

  // Close sidebars when modals are closed
  const originalCloseLetterModal = closeLetterModalButton?.onclick;
  if (closeLetterModalButton) {
    closeLetterModalButton.addEventListener("click", () => {
      if (letterSidebar) {
        letterSidebar.classList.add("-translate-x-full");
        letterSidebarOverlay?.classList.add("opacity-0", "pointer-events-none");
        letterSidebarOverlay?.classList.remove("opacity-100", "pointer-events-auto");
      }
    });
  }

  const originalCloseBottleModal = closeBottleModalButton?.onclick;
  if (closeBottleModalButton) {
    closeBottleModalButton.addEventListener("click", () => {
      if (bottleSidebar) {
        bottleSidebar.classList.add("-translate-x-full");
        bottleSidebarOverlay?.classList.add("opacity-0", "pointer-events-none");
        bottleSidebarOverlay?.classList.remove("opacity-100", "pointer-events-auto");
      }
    });
  }
}

// --- Constellation Logic ---
function setupInteractiveStars() {
  interactiveStars = [];
  for (let i = 0; i < 20; i++) {
    // Reduced for mobile performance
    interactiveStars.push({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      radius: Math.random() * 2 + 1,
      opacity: Math.random() * 0.5 + 0.5,
    });
  }
}

// --- Initial Load ---
document.addEventListener("DOMContentLoaded", async () => {
  setInitialTheme();
  shuffle(randomContent);
  startContentInterval();
  setInterval(updateTimer, CONFIG.timer.updateInterval);
  updateTimer();
  
  // Initialize delete confirmation dialog
  initializeDeleteConfirmation();
  
  // Initialize mobile sidebars
  setupMobileSidebars();
  
  // Initialize sync system
  await SyncAPI.init();
  
  await renderLetters();
  checkUnreadLetters();
  await renderBottles();
  checkUnreadBottles();
  setMinUnlockDate();

  // Auto-update UI when remote changes are applied via sync
  window.addEventListener('sync:updated', async (e) => {
    try {
      await renderLetters();
      await renderBottles();
      console.log('[sync] UI refreshed after pull', e?.detail || {});
    } catch (err) {
      console.warn('[sync] UI refresh failed', err);
    }
  });

  getWeatherData();
  setInterval(getWeatherData, CONFIG.weather.updateInterval);

  setupInteractiveStars();
  loadCloudImages();
  loadCustomIcons();
  loadSpriteSheets();
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
      setupWeatherParticles(currentWeatherData.main);
    }, 100);
  });
  
  // Clear old font preference if it's caveat (one-time migration)
  if (localStorage.getItem('selectedFont') === 'pen-caveat') {
    localStorage.removeItem('selectedFont');
  }

  // Initialize font from localStorage or default
  let currentFont = localStorage.getItem('selectedFont') || 'pen-kalam';
  
  // Apply saved font on page load
  applyFont(currentFont);
  
  // Initialize font picker event listeners
  initializeFontPicker();

  // Sprite triggers
  document.addEventListener("keydown", (e) => {
    if (e.key.toLowerCase() === "b") {
      // Spawn multiple birds
      const birdCount = 3 + Math.floor(Math.random() * 4); // 3-6 birds
      for (let i = 0; i < birdCount; i++) {
        setTimeout(() => {
          spawnSprite("bird", {
            y: 80 + Math.random() * 250,
            vx: 1.5 + Math.random() * 2.5,
            vy: (Math.random() - 0.5) * 0.3,
            scale: 0.25 + Math.random() * 0.15 // Much smaller: 0.25-0.4
          });
        }, i * (200 + Math.random() * 300)); // Stagger spawning
      }
    }
  });
  
});
}
