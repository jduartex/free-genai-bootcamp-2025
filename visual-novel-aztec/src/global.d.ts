interface Window {
  initialScene?: string;
  notifyMenuSceneReady?: () => void;
  showCurrentScene?: () => void;
  checkFontsLoaded?: () => { crimson: boolean, noto: boolean };
}
