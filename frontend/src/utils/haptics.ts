// Haptic feedback utility for mobile devices
// Uses the Vibration API when available

export const haptics = {
  // Light tap - for drag start
  light: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  },

  // Medium tap - for drop on valid target
  medium: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(20);
    }
  },

  // Success pattern - for successful placement
  success: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([10, 50, 20]);
    }
  },

  // Error pattern - for invalid drop
  error: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([30, 50, 30]);
    }
  },

  // Selection feedback
  selection: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(15);
    }
  }
};
