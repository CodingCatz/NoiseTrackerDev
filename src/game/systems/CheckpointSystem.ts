import { Player } from "../entities/Player";

/**
 * CheckpointSystem：記錄目前啟用的重生點並執行重生。
 * 預設重生點為關卡 spawn，碰到 checkpoint 後更新。
 */
export class CheckpointSystem {
  private activeX: number;
  private activeY: number;

  constructor(spawnPx: { x: number; y: number }) {
    this.activeX = spawnPx.x;
    this.activeY = spawnPx.y;
  }

  /** 更新啟用中的重生點（像素座標） */
  setCheckpoint(xPx: number, yPx: number): void {
    this.activeX = xPx;
    this.activeY = yPx;
  }

  /** 將玩家重生到目前重生點，速度歸零 */
  respawn(player: Player): void {
    const body = player.body as Phaser.Physics.Arcade.Body;
    body.reset(this.activeX, this.activeY);
    body.setVelocity(0, 0);
  }
}
