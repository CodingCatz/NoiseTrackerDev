import Phaser from "phaser";
import { TextureKeys } from "../config/sceneKeys";
import { PLAYER_PHYSICS } from "../data/playerPhysics";
import { u } from "../utils/units";
import type { PlayerState } from "../types/PlayerTypes";

/** 各 PlayerState 的顯示顏色（placeholder 視覺差異） */
const STATE_TINT: Record<PlayerState, number> = {
  idle: 0x4fa3ff,
  run: 0x7dd0ff,
  jump: 0xbfe6ff,
  fall: 0xffc46b,
  double_jump: 0xbfe6ff,
  dash: 0xffffff,
  wall_slide: 0x8affc0,
  wall_jump: 0x8affc0,
  dead: 0xff5a5a,
};

/**
 * Player entity：以 Arcade Physics sprite 呈現玩家。
 * 視覺尺寸 0.7×1.0 unit，碰撞盒 0.45×0.85 unit（比視覺小，降低擦邊卡住）。
 * Phase 3 僅負責身體設定與面向記錄，實際控制邏輯在 PlayerController。
 */
export class Player extends Phaser.Physics.Arcade.Sprite {
  /** 玩家面向：1 = 右、-1 = 左 */
  private _facing: 1 | -1 = 1;

  constructor(scene: Phaser.Scene, xPx: number, yPx: number) {
    super(scene, xPx, yPx, TextureKeys.Player);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setupBody();
  }

  /** 面向方向（1 右 / -1 左） */
  get facing(): 1 | -1 {
    return this._facing;
  }

  /** 依水平輸入更新面向 */
  setFacing(dir: 1 | -1): void {
    this._facing = dir;
    this.setFlipX(dir === -1);
  }

  /** 依 PlayerState 套用視覺顏色（每幀呼叫） */
  applyStateVisual(state: PlayerState): void {
    this.setTintFill(STATE_TINT[state] ?? STATE_TINT.idle);
  }

  /** 是否踩在地面上 */
  get isGrounded(): boolean {
    const body = this.body as Phaser.Physics.Arcade.Body;
    return body.blocked.down || body.touching.down;
  }

  /** 設定碰撞盒尺寸、重力與最大下落速度 */
  private setupBody(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;

    const colliderW = u(0.45);
    const colliderH = u(0.85);
    body.setSize(colliderW, colliderH);
    // 水平置中、底部對齊視覺腳底，讓踩地判定穩定
    body.setOffset((u(0.7) - colliderW) / 2, u(1.0) - colliderH);

    // 重力與最大下落速度（跳躍留待 Phase 4，這裡先讓玩家會落地不穿地）
    body.setGravityY(u(PLAYER_PHYSICS.gravityUnit));
    body.setMaxVelocity(Number.MAX_SAFE_INTEGER, u(PLAYER_PHYSICS.maxFallSpeedUnit));
  }
}
