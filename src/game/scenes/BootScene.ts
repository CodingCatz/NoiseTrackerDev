import Phaser from "phaser";
import { SceneKeys, TextureKeys } from "../config/sceneKeys";
import { u } from "../utils/units";
import { runDataValidation } from "../utils/validateData";
import { ICON_PRELOAD } from "../data/abilities";

/**
 * BootScene：載入前置資源並以 graphics 產生 placeholder 貼圖，
 * 完成後切到 MenuScene。玩家／地面仍為 placeholder；動作技能剪影為真實素材。
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super(SceneKeys.Boot);
  }

  /** 載入動作技能／基本跳的人形剪影 PNG（純白透明，供圓框內染色顯示） */
  preload(): void {
    for (const icon of ICON_PRELOAD) {
      this.load.image(icon.key, `assets/ui/skills/${icon.file}`);
    }
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
