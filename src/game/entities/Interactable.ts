import Phaser from "phaser";
import type { InteractableType } from "../types/LevelTypes";
import { popOnce } from "../utils/effects";

/**
 * Interactable：共用的互動物件實體（key／door／switch／checkpoint／goal）。
 * 以帶靜態物理身體的矩形呈現；solid 者用於碰撞阻擋，其餘用於 overlap 觸發。
 */
export class Interactable extends Phaser.GameObjects.Rectangle {
  readonly kind: InteractableType;
  readonly objId: string;
  readonly targetId?: string;
  /** checkpoint 是否已啟用（避免重複觸發） */
  activated = false;

  constructor(
    scene: Phaser.Scene,
    xPx: number,
    yPx: number,
    widthPx: number,
    heightPx: number,
    color: number,
    kind: InteractableType,
    objId: string,
    targetId?: string
  ) {
    // 以底部中心為基準，讓物件坐落在地面上
    super(scene, xPx, yPx, widthPx, heightPx, color, 0.9);
    this.setOrigin(0.5, 1);
    scene.add.existing(this);
    scene.physics.add.existing(this, true);

    this.kind = kind;
    this.objId = objId;
    this.targetId = targetId;
  }

  /** 啟用狀態的視覺變化（如 checkpoint 亮起）＋ 彈跳回饋 */
  markActivated(color: number): void {
    this.setFillStyle(color, 0.95);
    this.setStrokeStyle(4, 0xffffff);
    popOnce(this, 1.4, 200);
  }

  /** 開啟（門）：立即關閉碰撞讓玩家可通過，視覺淡出 */
  open(): void {
    const body = this.body as Phaser.Physics.Arcade.StaticBody;
    body.enable = false;
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scaleX: 0.4,
      duration: 200,
      ease: "Quad.out",
      onComplete: () => this.setVisible(false),
    });
  }

  /** 關閉（門）：恢復碰撞並顯示 */
  close(): void {
    const body = this.body as Phaser.Physics.Arcade.StaticBody;
    body.enable = true;
    this.setVisible(true);
    this.setAlpha(1);
    this.setScale(1);
  }

  /** 門目前是否為開啟（可通過）狀態 */
  get isOpen(): boolean {
    return !(this.body as Phaser.Physics.Arcade.StaticBody).enable;
  }
}
