import Phaser from "phaser";
import type { LevelConfig } from "../types/LevelTypes";
import { TextureKeys } from "../config/sceneKeys";
import { u } from "../utils/units";

/** LevelSystem 建構關卡後回傳的結果 */
export interface BuiltLevel {
  /** 全部實心地形碰撞體 */
  solids: Phaser.GameObjects.Rectangle[];
  /** 玩家起始像素座標 */
  spawnPx: { x: number; y: number };
  /** 世界像素尺寸 */
  worldPx: { width: number; height: number };
}

/**
 * LevelSystem：依關卡資料生成地形、物件標記，並設定世界與相機邊界。
 * 地形座標全來自 levels.ts，GameScene 不再寫死平台。
 */
export class LevelSystem {
  /**
   * 建構關卡。
   * @param scene 目標場景
   * @param level 關卡資料
   */
  build(scene: Phaser.Scene, level: LevelConfig): BuiltLevel {
    const solids = level.solids.map((s) =>
      this.createSolid(scene, u(s.xUnit), u(s.yUnit), u(s.wUnit), u(s.hUnit))
    );

    // 互動物件（含 goal）一律由 InteractionSystem 建立

    const worldW = u(level.worldWidthUnit);
    const worldH = u(level.worldHeightUnit);
    scene.physics.world.setBounds(0, 0, worldW, worldH);
    scene.cameras.main.setBounds(0, 0, worldW, worldH);

    return {
      solids,
      spawnPx: { x: u(level.spawnUnit.x), y: u(level.spawnUnit.y) },
      worldPx: { width: worldW, height: worldH },
    };
  }

  /**
   * 建立單一實心體：鋪滿 placeholder tile 並附加靜態碰撞矩形。
   * @returns 靜態碰撞矩形
   */
  private createSolid(
    scene: Phaser.Scene,
    leftPx: number,
    topPx: number,
    widthPx: number,
    heightPx: number
  ): Phaser.GameObjects.Rectangle {
    const tile = Math.round(u(0.5));
    const cols = Math.ceil(widthPx / tile);
    const rows = Math.ceil(heightPx / tile);
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        scene.add.image(leftPx + col * tile, topPx + row * tile, TextureKeys.Ground).setOrigin(0, 0);
      }
    }

    const rect = scene.add.rectangle(
      leftPx + widthPx / 2,
      topPx + heightPx / 2,
      widthPx,
      heightPx
    );
    scene.physics.add.existing(rect, true);
    return rect;
  }
}
