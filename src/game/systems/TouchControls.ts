import Phaser from "phaser";
import { VirtualInput } from "./VirtualInput";
import { isTouchLikely } from "../utils/platform";

/**
 * TouchControls：手機／平板／小螢幕才出現的虛擬按鈕，寫入 VirtualInput。
 * 按鈕半透明、置於畫面下方兩側，不遮擋主要遊戲區；桌機大螢幕完全不建立。
 * 座標使用 FHD 邏輯座標，由 Scale Manager 等比縮放。
 */
export class TouchControls {
  /** 是否有實際建立按鈕（桌機為 false） */
  readonly active: boolean;

  constructor(scene: Phaser.Scene, virtual: VirtualInput) {
    this.active = isTouchLikely();
    if (!this.active) return;

    // 允許多點觸控（同時按方向 + 跳 / 衝刺）
    scene.input.addPointer(2);

    // 左下：移動
    this.makeHoldButton(scene, 180, 900, 85, 0x4a5068, "◄", (v) => (virtual.left = v));
    this.makeHoldButton(scene, 400, 900, 85, 0x4a5068, "►", (v) => (virtual.right = v));

    // 右下：動作
    this.makeHoldButton(scene, 1780, 900, 100, 0x3a6ea5, "跳", (v) => (virtual.jump = v));
    this.makeHoldButton(scene, 1560, 770, 80, 0xffd34e, "衝", (v) => (virtual.dash = v));
    this.makeTapButton(scene, 1560, 970, 70, 0x8affc0, "E", () => virtual.pressInteract());
  }

  /** 建立「按住型」按鈕（左右、跳、衝刺）：按下 true、放開／離開 false */
  private makeHoldButton(
    scene: Phaser.Scene,
    x: number,
    y: number,
    radius: number,
    color: number,
    label: string,
    setHeld: (held: boolean) => void
  ): void {
    const btn = this.makeCircle(scene, x, y, radius, color, label);
    btn.on("pointerdown", () => setHeld(true));
    btn.on("pointerup", () => setHeld(false));
    btn.on("pointerout", () => setHeld(false));
  }

  /** 建立「點擊型」按鈕（互動）：按下觸發一次 */
  private makeTapButton(
    scene: Phaser.Scene,
    x: number,
    y: number,
    radius: number,
    color: number,
    label: string,
    onTap: () => void
  ): void {
    const btn = this.makeCircle(scene, x, y, radius, color, label);
    btn.on("pointerdown", onTap);
  }

  /** 建立半透明圓形按鈕（含標籤），固定於畫面、置頂顯示 */
  private makeCircle(
    scene: Phaser.Scene,
    x: number,
    y: number,
    radius: number,
    color: number,
    label: string
  ): Phaser.GameObjects.Arc {
    const btn = scene.add
      .circle(x, y, radius, color, 0.35)
      .setStrokeStyle(3, 0xffffff, 0.6)
      .setScrollFactor(0)
      .setDepth(9000)
      .setInteractive({ useHandCursor: true });

    scene.add
      .text(x, y, label, {
        fontFamily: "sans-serif",
        fontSize: "40px",
        color: "#ffffff",
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(9001);

    return btn;
  }
}
