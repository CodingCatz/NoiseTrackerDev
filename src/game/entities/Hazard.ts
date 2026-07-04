import Phaser from "phaser";
import type { HazardConfig } from "../types/LevelTypes";
import { TILES } from "../data/tiles";
import { u } from "../utils/units";

/**
 * Hazard：陷阱實體（spike／saw）。接觸玩家即致死，實際重生由 GameScene 處理。
 * 以帶靜態物理身體的矩形呈現，作為 overlap 感測用（不阻擋移動）。
 */
export class Hazard extends Phaser.GameObjects.Rectangle {
  readonly hazardType: HazardConfig["type"];

  constructor(scene: Phaser.Scene, cfg: HazardConfig) {
    const color = cfg.type === "spike" ? TILES.spike.color : 0xff8a3a;
    super(scene, u(cfg.xUnit), u(cfg.yUnit), u(cfg.wUnit), u(cfg.hUnit), color, 0.95);
    // 以左下角為基準，坐落在地面上
    this.setOrigin(0, 1);
    scene.add.existing(this);
    scene.physics.add.existing(this, true);
    this.hazardType = cfg.type;
  }
}
