import Phaser from "phaser";
import { Player } from "../entities/Player";
import { PlayerController } from "./PlayerController";
import { AbilitySystem } from "./AbilitySystem";
import { pxToUnit } from "../utils/units";

/**
 * DebugOverlay：按 F3 開關的物理狀態面板（預設關閉）。
 * 顯示座標、速度、接地／貼牆、coyote／buffer 計時、滯空次數、PlayerState 與 FPS。
 * 純 Phaser 文字，不引入外部 library；關閉時 update 直接跳出，不影響正式遊玩。
 */
export class DebugOverlay {
  private readonly text: Phaser.GameObjects.Text;
  private isOn = false;

  constructor(scene: Phaser.Scene) {
    this.text = scene.add
      .text(20, 130, "", {
        fontFamily: "monospace",
        fontSize: "22px",
        color: "#7dffa8",
        backgroundColor: "rgba(0,0,0,0.55)",
        padding: { x: 10, y: 8 },
      })
      .setScrollFactor(0)
      .setDepth(10000)
      .setVisible(false);

    scene.input.keyboard?.on("keydown-F3", () => this.toggle());
  }

  /** 切換顯示 */
  toggle(): void {
    this.isOn = !this.isOn;
    this.text.setVisible(this.isOn);
  }

  /** 每幀更新（關閉時直接跳出） */
  update(player: Player, controller: PlayerController, abilities: AbilitySystem, fps: number): void {
    if (!this.isOn) return;

    const body = player.body as Phaser.Physics.Arcade.Body;
    const f = (n: number) => n.toFixed(2);

    this.text.setText([
      `state        : ${controller.currentState}`,
      `pos (unit)   : ${f(pxToUnit(player.x))}, ${f(pxToUnit(player.y))}`,
      `vel (unit/s) : ${f(pxToUnit(body.velocity.x))}, ${f(pxToUnit(body.velocity.y))}`,
      `grounded     : ${player.isGrounded}`,
      `touchingWall : ${controller.isTouchingWall}`,
      `wallSliding  : ${controller.isWallSliding}`,
      `coyote  (ms) : ${Math.round(controller.coyoteRemainingMs)}`,
      `buffer  (ms) : ${Math.round(controller.jumpBufferRemainingMs)}`,
      `airJumpsUsed : ${abilities.airJumpsUsed}`,
      `airDashesUsed: ${abilities.airDashesUsed}`,
      `dashReady    : ${controller.dashReady}`,
      `FPS          : ${Math.round(fps)}`,
    ]);
  }
}
