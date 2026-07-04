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

  constructor(scene: Phaser.Scene, player: Player) {
    this.player = player;

    const keyboard = scene.input.keyboard;
    if (!keyboard) {
      throw new Error("PlayerController 需要鍵盤輸入，但 scene.input.keyboard 不存在");
    }
    this.cursors = keyboard.createCursorKeys();
    this.keyA = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyD = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
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
