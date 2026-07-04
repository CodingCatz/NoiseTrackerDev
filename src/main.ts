import Phaser from "phaser";
import "./styles.css";
import { createGameConfig } from "./game/config/gameConfig";
import { BootScene } from "./game/scenes/BootScene";
import { MenuScene } from "./game/scenes/MenuScene";
import { GameScene } from "./game/scenes/GameScene";
import { UIScene } from "./game/scenes/UIScene";
import { GameOverScene } from "./game/scenes/GameOverScene";

// 場景順序：陣列第一個（BootScene）會自動啟動，其餘由流程切換
const game = new Phaser.Game(
  createGameConfig([BootScene, MenuScene, GameScene, UIScene, GameOverScene])
);

// 開發模式下暴露 game 參照，方便除錯；正式 build 會被移除
if (import.meta.env.DEV) {
  (window as unknown as { __game: Phaser.Game }).__game = game;
}
