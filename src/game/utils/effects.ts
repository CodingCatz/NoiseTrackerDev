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

/**
 * 速度線：於 (x,y) 沿運動方向噴出數條白色殘影線並向後拖曳淡出。
 * 線條沿運動軸擺放、垂直方向散開，往「逆運動方向」拖曳 → 讀成高速衝出。
 * 用於衝刺與二段跳；純 Phaser rectangle＋tween，無外部素材。
 *
 * @param dirX,dirY 運動方向（不需正規化，內部處理）；(0,-1)=向上、(1,0)=向右
 */
export function speedLines(
  scene: Phaser.Scene,
  x: number,
  y: number,
  dirX: number,
  dirY: number,
  opts: {
    count?: number;
    length?: number;
    thickness?: number;
    spread?: number;
    distance?: number;
    color?: number;
    alpha?: number;
    durationMs?: number;
    depth?: number;
  } = {}
): void {
  const {
    count = 5,
    length = 28,
    thickness = 3,
    spread = 36,
    distance = 48,
    color = 0xffffff,
    alpha = 0.7,
    durationMs = 220,
    depth = 450,
  } = opts;

  const len = Math.hypot(dirX, dirY) || 1;
  const nx = dirX / len;
  const ny = dirY / len;
  const angle = Math.atan2(ny, nx); // 線條沿運動軸
  const perpX = -ny; // 垂直運動方向（用來散開多條線）
  const perpY = nx;

  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0 : i / (count - 1) - 0.5; // -0.5 ~ 0.5
    const offset = t * spread;
    // 起點：角色中心稍後方 + 垂直散開；線長隨散開位置略減，中央最長
    const ox = x - nx * 4 + perpX * offset;
    const oy = y - ny * 4 + perpY * offset;
    const lineLen = length * (1 - Math.abs(t) * 0.45);

    const line = scene.add
      .rectangle(ox, oy, lineLen, thickness, color)
      .setRotation(angle)
      .setDepth(depth)
      .setAlpha(alpha)
      .setBlendMode(Phaser.BlendModes.ADD);

    scene.tweens.add({
      targets: line,
      x: ox - nx * distance,
      y: oy - ny * distance,
      alpha: 0,
      scaleX: 0.25,
      duration: durationMs,
      ease: "Quad.out",
      onComplete: () => line.destroy(),
    });
  }
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
