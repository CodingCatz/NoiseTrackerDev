import Phaser from "phaser";
import { SceneKeys, TextureKeys } from "../config/sceneKeys";
import { u } from "../utils/units";
import { runDataValidation } from "../utils/validateData";

/**
 * BootScene：載入前置資源並以 graphics 產生 placeholder 貼圖，
 * 完成後切到 MenuScene。此階段尚無真實美術素材。
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super(SceneKeys.Boot);
  }

  create(): void {
    // 啟動時驗證物理／關卡資料，數值填錯會在 console 提早警告
    runDataValidation();
    this.createPlaceholderTextures();
    this.scene.start(SceneKeys.Menu);
  }

  /** 用 graphics 產生玩家與地面的佔位貼圖，避免缺圖錯誤 */
  private createPlaceholderTextures(): void {
    // 玩家視覺尺寸：0.7 × 1.0 unit
    const playerW = Math.round(u(0.7));
    const playerH = Math.round(u(1.0));
    const playerGfx = this.make.graphics({ x: 0, y: 0 }, false);
    playerGfx.fillStyle(0x4fa3ff, 1).fillRect(0, 0, playerW, playerH);
    playerGfx.lineStyle(4, 0xffffff, 1).strokeRect(0, 0, playerW, playerH);
    playerGfx.generateTexture(TextureKeys.Player, playerW, playerH);
    playerGfx.destroy();

    // 地面 tile：0.5 unit = 54 px
    const tile = Math.round(u(0.5));
    const groundGfx = this.make.graphics({ x: 0, y: 0 }, false);
    groundGfx.fillStyle(0x3a3f52, 1).fillRect(0, 0, tile, tile);
    groundGfx.lineStyle(2, 0x52596f, 1).strokeRect(0, 0, tile, tile);
    groundGfx.generateTexture(TextureKeys.Ground, tile, tile);
    groundGfx.destroy();
  }
}
