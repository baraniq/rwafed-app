export const haptic = {
  light: () => {
    if (navigator.vibrate) navigator.vibrate(10);
  },
  medium: () => {
    if (navigator.vibrate) navigator.vibrate(25);
  },
  heavy: () => {
    if (navigator.vibrate) navigator.vibrate(50);
  },
  success: () => {
    if (navigator.vibrate) navigator.vibrate([10, 50, 10]);
  },
  warning: () => {
    if (navigator.vibrate) navigator.vibrate([30, 30, 30]);
  },
  error: () => {
    if (navigator.vibrate) navigator.vibrate([50, 30, 50, 30, 50]);
  },
};
