import Phaser from "phaser";
import type { MovingPlatformConfig } from "../types/LevelTypes";
import { u } from "../utils/units";

/**
 * MovingPlatform：於兩點來回的移動平台。
 * 使用不可推動（immovable）、無重力的動態身體，以速度驅動；到端點停留後反向。
 * 玩家站在上面時，由 Arcade immovable body 的內建摩擦（friction.x = 1）自動帶著走，穩定不抖動。
 */
export class MovingPlatform extends Phaser.GameObjects.Rectangle {
  private readonly p0: { x: number; y: number };
  private readonly p1: { x: number; y: number };
  private readonly speedPx: number;
  private readonly waitMs: number;

  private target: { x: number; y: number };
  private waiting = false;
  private waitTimer = 0;

  constructor(scene: Phaser.Scene, cfg: MovingPlatformConfig) {
    super(scene, u(cfg.xUnit), u(cfg.yUnit), u(cfg.wUnit), u(cfg.hUnit), 0x6f7bd6, 1);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setImmovable(true);
    body.setAllowGravity(false);

    this.p0 = { x: u(cfg.xUnit), y: u(cfg.yUnit) };
    this.p1 = { x: u(cfg.toXUnit), y: u(cfg.toYUnit) };
    this.speedPx = u(cfg.speedUnit ?? 1.5);
    this.waitMs = cfg.waitMs ?? 500;
    this.target = this.p1;
    this.aim();
  }

  /** 每幀更新移動邏輯（端點停留後反向） */
  step(deltaMs: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body;

    if (this.waiting) {
      this.waitTimer -= deltaMs;
      if (this.waitTimer <= 0) {
        this.waiting = false;
        this.target = this.target === this.p1 ? this.p0 : this.p1;
        this.aim();
      }
      return;
    }

    const dist = Phaser.Math.Distance.Between(this.x, this.y, this.target.x, this.target.y);
    if (dist < 4) {
      body.reset(this.target.x, this.target.y);
      body.setVelocity(0, 0);
      this.waiting = true;
      this.waitTimer = this.waitMs;
    }
  }

  /** 朝目前目標點設定速度 */
  private aim(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const dx = this.target.x - this.x;
    const dy = this.target.y - this.y;
    const len = Math.hypot(dx, dy) || 1;
    body.setVelocity((dx / len) * this.speedPx, (dy / len) * this.speedPx);
  }
}
