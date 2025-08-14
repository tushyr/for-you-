// Configuration file for "For You" application
// Edit these values to customize the experience

const CONFIG = {
  // Weather Settings
  weather: {
    apiKey: "c5df4cc6f9dc76bc9479874a71fce43c",
    city: "Lucknow", // Fallback city
    updateInterval: 300000, // 5 minutes in milliseconds
    enableRealWeather: true,
    useGeolocation: true, // New setting for geolocation
  },

  // Memory Lane Content
  memories: {
    messages: [
      "Missing you a little more each day.",
      "The world feels empty without you.",
      "Counting every second.",
      "My thoughts are always with you.",
      "Every song reminds me of you.",
      "It's not the same here without you.",
      "Hoping you're okay.",
      "Wish you were here.",
      "Thinking of all our memories.",
      "You're always in my heart.",
      "Can't wait for the day we meet again.",
      "The silence is too loud.",
      "Sending all my love, wherever you are.",
      "You are deeply missed.",
      "Life is different now.",
      "Holding on to the good times.",
      "Some days are harder than others.",
      "You haven't been forgotten.",
      "Your memory is my keepsake.",
      "Until we meet again.",
    ],
    // Add your own image URLs here (replace placeholder URLs)
    images: [
      "https://placehold.co/400x300/E8D8C4/6D4C41?text=Memory+1",
      "https://placehold.co/400x300/F4BFBF/6D4C41?text=Memory+2",
      "https://placehold.co/400x300/D4E2D4/6D4C41?text=Memory+3",
      "https://placehold.co/400x300/FFD9C0/6D4C41?text=Memory+4",
      "https://placehold.co/400x300/C0D8C0/6D4C41?text=Memory+5",
      "https://placehold.co/400x300/E8D8C4/6D4C41?text=Memory+6",
      "https://placehold.co/400x300/F4BFBF/6D4C41?text=Memory+7",
      "https://placehold.co/400x300/D4E2D4/6D4C41?text=Memory+8",
      "https://placehold.co/400x300/FFD9C0/6D4C41?text=Memory+9",
      "https://placehold.co/400x300/C0D8C0/6D4C41?text=Memory+10",
      "https://placehold.co/400x300/E8D8C4/6D4C41?text=Memory+11",
      "https://placehold.co/400x300/F4BFBF/6D4C41?text=Memory+12",
      "https://placehold.co/400x300/D4E2D4/6D4C41?text=Memory+13",
      "https://placehold.co/400x300/FFD9C0/6D4C41?text=Memory+14",
      "https://placehold.co/400x300/C0D8C0/6D4C41?text=Memory+15",
      "https://placehold.co/400x300/E8D8C4/6D4C41?text=Memory+16",
      "https://placehold.co/400x300/F4BFBF/6D4C41?text=Memory+17",
      "https://placehold.co/400x300/D4E2D4/6D4C41?text=Memory+18",
      "https://placehold.co/400x300/FFD9C0/6D4C41?text=Memory+19",
      "https://placehold.co/400x300/C0D8C0/6D4C41?text=Memory+20",
    ],
    cycleDuration: 4000, // Time between automatic transitions (milliseconds)
  },

  // Timer Settings
  timer: {
    startDate: "2025-06-02T00:00:00", // Change to your meaningful date
    updateInterval: 1000, // 1 second
  },

  // Animation Settings
  animations: {

      count: 100, // Reduce for better mobile performance
      speed: 0.3,
    },
    particles: {
      rain: {
        normal: 150,
        thunderstorm: 400,
        heavy: 250,
      },
      clouds: {
        normal: 25,
        storm: 35,
        snow: 20,
        layers: 3,
        useCustomImages: true,
        imageVariations: ["cloud.png"], // Add more cloud images here
        size: {
          min: 80,
          max: 180,
          variation: 60,
        },
        movement: {
          speed: {
            min: 0.1,
            max: 0.5,
          },
          drift: 0.05,
          pulse: true,
        },
        effects: {
          stormDarkening: 0.3,
          weatherFilters: true,
          rotation: {
            min: -15,
            max: 15,
          },
        },
      },
      snow: 120,
      lightning: {
        frequency: 0.003,
        branches: 3,
        intensity: 1.0,
      },
    },
    transitions: {
      fadeTime: 500, // Milliseconds for content fade transitions
      modalTime: 400, // Milliseconds for modal animations
      staggerDelay: 100, // Delay between elements
    },
    weather: {
      cloudSpeed: 0.3,
      windEffect: true,
      thunderDelay: 60, // frames
      lightningDuration: 200, // milliseconds
    },
  },

  // Visual Settings
  visuals: {
    sun: {
      x: 100,
      y: 100,
      radius: 60,
      opacitySpeed: 0.03,
    },
    glassmorphism: {
      blur: "12px",
      opacity: {
        light: 0.15,
        dark: 0.2,
      },
    },
  },

  // Music Settings
  music: {
    autoplay: false, // Set to true for automatic music playbook
    volume: 0.5, // 0.0 to 1.0
    // Add your music file URL here
    defaultTrack: "", // "path/to/your/music.mp3"
  },

  // Cloud Settings
  clouds: {
    resourcePath: "resources/clouds/",
    fallbackEnabled: true,
    preloadImages: true,
    debugMode: false, // Set to true to see loading status
  },

  // Icon Settings
  icons: {
    resourcePath: "resources/icons/",
    useCustomIcons: true,
    preloadIcons: true,
    iconMap: {
      guide: "origami.svg",
      darkMode: "when_dark_mode.svg",
      lightMode: "when_light_mode.svg",
      goodnight: "goodnight_button.svg",
      bottle: "bottle.svg",
      mailRead: "mailbox_read.svg",
      mailUnread: "mail_unread.svg",
    },
    animations: {
      hoverScale: 1.1,
      clickScale: 0.9,
      notificationPulse: true,
    },
    theming: {
      autoColorMatch: true, // Match icons to theme colors
      hoverBrightness: 1.2,
    },
  },

  // Audio Effects
  audio: {
    enableSoundEffects: true,
    thunderVolume: 0.4,
    rainVolume: 0.2,
    clickVolume: 0.1,
    notificationVolume: 0.3,
    enableProceduralAudio: true,
  },

  // Personalization
  personalization: {
    title: "For Jane Doe <3", // Change the main title
    language: "en", // Language code for date formatting
    timezone: "Asia/Kolkata", // Your timezone
  },

  // Feature Flags
  features: {
    enableWeather: true,

    enableMusic: true,
    enableLetters: true,
    enableBottles: true,
    enableGoodnightMode: true,
    enableMemoryLane: true,
    enableEnhancedWeather: true,
    enableAudioFeedback: true,
    enableRealisticClouds: true,
    enableLightning: true,
    enableThunder: true,
    enableSnowflakes: true,
  },

  // Storage Keys (don't change unless you know what you're doing)
  storage: {
    letters: "janeDoeLetters",
    bottles: "janeDoeBottles",

    theme: "color-theme",
    lastOpenedLetters: "lastOpenedLetters",
    lastOpenedBottles: "lastOpenedBottles",
  },

  // Sync Settings (cross-device synchronization)
  sync: {
    enabled: true,
    // Unique namespace for this deployment (change this to a new UUID for your site)
    namespace: "for-you-sync-0d79c67f-9c68-4b2c-92b3-ef51c5779c43",
    // Encryption key (base64) - generate a new one for your deployment
    encKey: "zbsNbdEx2qOsr+uxHlmOWGg4OMhuhkKqD2iDsYb9Fu0=",
    // Sync intervals and settings
    intervalMs: 30000, // Check for changes every 30 seconds
    batchSize: 50, // Max records per sync batch
    retryDelayMs: 5000, // Retry delay on failure
    maxRetries: 3,
    // Cloudflare Worker endpoint (you'll need to deploy this)
    endpoint: "https://for-you-sync.tushyrr.workers.dev"
  },
};

// Export for use in other files
if (typeof module !== "undefined" && module.exports) {
  module.exports = CONFIG;
}
