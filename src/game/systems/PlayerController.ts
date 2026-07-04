import Phaser from "phaser";
import { Player } from "../entities/Player";
import { PLAYER_PHYSICS } from "../data/playerPhysics";
import { u } from "../utils/units";
import { moveTowards } from "../utils/math";

/**
 * PlayerController：把鍵盤輸入轉成玩家水平移動。
 * 所有速度／加速度都讀自 playerPhysics.ts（unit/s），在此轉成 px/s。
 * Phase 3 僅處理左右移動與加減速，跳躍留待 Phase 4。
 */
export class PlayerController {
  private readonly player: Player;
  private readonly cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private readonly keyA: Phaser.Input.Keyboard.Key;
  private readonly keyD: Phaser.Input.Keyboard.Key;
  /** 跳躍鍵：Space / W / ↑ */
  private readonly jumpKeys: Phaser.Input.Keyboard.Key[];

  /** 上一幀跳躍鍵是否按住，用來偵測按下／放開的邊緣 */
  private prevJumpHeld = false;
  /** 目前上升是否來自一次跳躍（用於可變跳高的削減判定） */
  private isJumpRising = false;

  constructor(scene: Phaser.Scene, player: Player) {
    this.player = player;

    const keyboard = scene.input.keyboard;
    if (!keyboard) {
      throw new Error("PlayerController 需要鍵盤輸入，但 scene.input.keyboard 不存在");
    }
    this.cursors = keyboard.createCursorKeys();
    this.keyA = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyD = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.jumpKeys = [
      this.cursors.space,
      this.cursors.up,
      keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
    ];
  }

  /**
   * 每幀更新水平速度。
   * @param deltaMs 上一幀經過的毫秒
   */
  update(deltaMs: number): void {
    const dt = deltaMs / 1000;
    const dir = this.readHorizontalInput();
    const body = this.player.body as Phaser.Physics.Arcade.Body;

    const vx = body.velocity.x;
    const maxSpeed = u(PLAYER_PHYSICS.maxRunSpeedUnit);
    const targetVx = dir * maxSpeed;

    const accelUnit = this.selectAcceleration(dir, vx);
    const maxDelta = u(accelUnit) * dt;

    body.setVelocityX(moveTowards(vx, targetVx, maxDelta));

    if (dir !== 0) this.player.setFacing(dir as 1 | -1);

    this.handleJump(body);
    this.applyGravityScale(body);
  }

  /**
   * 跳躍與可變跳高：
   * - 在地面按下跳躍鍵 → 給予起跳速度
   * - 上升途中放開跳躍鍵 → 削減上升速度（短按小跳、長按高跳）
   */
  private handleJump(body: Phaser.Physics.Arcade.Body): void {
    const p = PLAYER_PHYSICS;
    const jumpHeld = this.jumpKeys.some((k) => k.isDown);
    const jumpPressed = jumpHeld && !this.prevJumpHeld;
    const jumpReleased = !jumpHeld && this.prevJumpHeld;
    this.prevJumpHeld = jumpHeld;

    if (jumpPressed && this.player.isGrounded) {
      body.setVelocityY(-u(p.jumpVelocityUnit));
      this.isJumpRising = true;
    }

    // 提早放開：削減仍在上升的速度
    if (jumpReleased && this.isJumpRising && body.velocity.y < 0) {
      body.setVelocityY(body.velocity.y * p.jumpCutMultiplier);
    }

    // 一旦不再上升，本次跳躍的削減判定結束
    if (body.velocity.y >= 0) this.isJumpRising = false;
  }

  /**
   * 依垂直速度調整重力倍率：接近頂點降重力（滯空感），下落時增重力（俐落）。
   */
  private applyGravityScale(body: Phaser.Physics.Arcade.Body): void {
    const p = PLAYER_PHYSICS;
    const vy = body.velocity.y;
    let multiplier = 1;

    if (vy < 0) {
      // 上升中且接近頂點
      if (Math.abs(vy) < u(p.apexThresholdUnit)) multiplier = p.apexGravityMultiplier;
    } else {
      // 下落
      multiplier = p.fallGravityMultiplier;
    }

    body.setGravityY(u(p.gravityUnit) * multiplier);
  }

  /** 讀取左右輸入：-1 左、0 無、1 右 */
  private readHorizontalInput(): number {
    const left = this.cursors.left.isDown || this.keyA.isDown;
    const right = this.cursors.right.isDown || this.keyD.isDown;
    return (right ? 1 : 0) - (left ? 1 : 0);
  }

  /**
   * 依「是否有輸入、是否反向、是否在地面」選擇加速度／減速度（unit/s²）。
   */
  private selectAcceleration(dir: number, vx: number): number {
    const p = PLAYER_PHYSICS;
    const grounded = this.player.isGrounded;

    // 有輸入：加速或轉身
    if (dir !== 0) {
      const isTurning = vx !== 0 && Math.sign(vx) !== dir;
      if (isTurning) return p.turnAccelerationUnit;
      return grounded ? p.groundAccelerationUnit : p.airAccelerationUnit;
    }

    // 無輸入：減速
    return grounded ? p.groundDecelerationUnit : p.airDecelerationUnit;
  }
}
