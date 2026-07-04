import Phaser from "phaser";

/**
 * 視覺特效輔助（集中於此，避免散落各處）。
 * 全部以 Phaser 內建 tween／graphics 實作，不引入外部素材。
 */

/** 淡入：alpha 0 → 1 */
export function fadeIn(target: Phaser.GameObjects.Components.Alpha & { scene: Phaser.Scene }, durationMs = 250): void {
  target.setAlpha(0);
  target.scene.tweens.add({ targets: target, alpha: 1, duration: durationMs });
}

/** 碎裂爆發：於 (x,y) 噴出數個小方塊後消失（死亡 placeholder） */
export function burst(scene: Phaser.Scene, x: number, y: number, color: number, count = 8): void {
  for (let i = 0; i < count; i++) {
    const piece = scene.add.rectangle(x, y, 12, 12, color).setDepth(500);
    const angle = (Math.PI * 2 * i) / count;
    scene.tweens.add({
      targets: piece,
      x: x + Math.cos(angle) * 80,
      y: y + Math.sin(angle) * 80,
      alpha: 0,
      scale: 0.2,
      duration: 350,
      ease: "Quad.out",
      onComplete: () => piece.destroy(),
    });
  }
}

/** 持續脈動：反覆放大縮小（能力道具用，讓它明顯是可撿的） */
export function pulseLoop(target: Phaser.GameObjects.GameObject, scale = 1.2, durationMs = 700): void {
  (target as unknown as { scene: Phaser.Scene }).scene.tweens.add({
    targets: target,
    scaleX: scale,
    scaleY: scale,
    duration: durationMs,
    yoyo: true,
    repeat: -1,
    ease: "Sine.inOut",
  });
}

/** 單次彈跳：放大再回復（checkpoint 亮起、開關觸發用） */
export function popOnce(target: Phaser.GameObjects.GameObject, scale = 1.4, durationMs = 180): void {
  (target as unknown as { scene: Phaser.Scene }).scene.tweens.add({
    targets: target,
    scaleX: scale,
    scaleY: scale,
    duration: durationMs,
    yoyo: true,
    ease: "Quad.out",
  });
}
