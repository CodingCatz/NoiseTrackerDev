/** 全專案 Scene 的識別鍵，集中管理避免散落的字串常數 */
export const SceneKeys = {
  Boot: "Boot",
  Menu: "Menu",
  Game: "Game",
  UI: "UI",
  GameOver: "GameOver",
} as const;

export type SceneKey = (typeof SceneKeys)[keyof typeof SceneKeys];

/** 佔位貼圖的識別鍵，由 BootScene 以 graphics 產生 */
export const TextureKeys = {
  Player: "tex-player",
  Ground: "tex-ground",
} as const;
