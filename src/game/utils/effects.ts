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
 * 一次性建立柔邊圓點貼圖（radial gradient 白點），供粒子/煙霧/發光爆發共用。
 * 回傳貼圖鍵；已存在則直接回傳不重建。
 */
export function ensureSoftDotTexture(scene: Phaser.Scene, key = "fx-soft-dot", radius = 16): string {
  if (scene.textures.exists(key)) return key;
  const size = radius * 2;
  const tex = scene.textures.createCanvas(key, size, size);
  if (!tex) return key;
  const ctx = tex.getContext();
  const g = ctx.createRadialGradient(radius, radius, 0, radius, radius, radius);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.45, "rgba(255,255,255,0.65)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  tex.refresh();
  return key;
}

/**
 * 一次性建立紡錘狀拖尾貼圖：沿長軸(x)兩端 alpha 收尖、厚度方向(y)柔化。
 * 供速度線用，讓線條兩端漸細而非矩形硬邊。
 */
export function ensureStreakTexture(scene: Phaser.Scene, key = "fx-streak", w = 64, h = 12): string {
  if (scene.textures.exists(key)) return key;
  const tex = scene.textures.createCanvas(key, w, h);
  if (!tex) return key;
  const ctx = tex.getContext();
  const img = ctx.createImageData(w, h);
  const cx = (w - 1) / 2;
  const cy = (h - 1) / 2;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const tx = 1 - Math.abs(x - cx) / cx; // 長軸：兩端 0、中央 1
      const ty = 1 - Math.abs(y - cy) / cy; // 厚度：邊緣 0、中央 1
      const a = Math.pow(Math.max(0, tx), 1.7) * Math.pow(Math.max(0, ty), 0.85); // 兩端更尖
      const idx = (y * w + x) * 4;
      img.data[idx] = 255;
      img.data[idx + 1] = 255;
      img.data[idx + 2] = 255;
      img.data[idx + 3] = Math.round(a * 255);
    }
  }
  ctx.putImageData(img, 0, 0);
  tex.refresh();
  return key;
}

/**
 * 煙霧縷：於 (x,y) 冒出一縷灰白柔邊煙，邊擴張邊飄移邊淡出（一般混合，非加亮）。
 * 用於滑牆牆面摩擦；連續呼叫即成煙流。
 */
export function smokePuff(
  scene: Phaser.Scene,
  x: number,
  y: number,
  opts: { size?: number; color?: number; alpha?: number; driftX?: number; driftY?: number; grow?: number; durationMs?: number } = {}
): void {
  const { size = 13, color = 0xd9d9d9, alpha = 0.5, driftX = 0, driftY = -16, grow = 2.3, durationMs = 380 } = opts;
  const key = ensureSoftDotTexture(scene);
  const puff = scene.add
    .image(x, y, key)
    .setDisplaySize(size, size)
    .setTint(color)
    .setAlpha(alpha)
    .setDepth(350);
  const s0 = puff.scaleX;
  scene.tweens.add({
    targets: puff,
    x: x + driftX,
    y: y + driftY,
    scaleX: s0 * grow,
    scaleY: s0 * grow,
    alpha: 0,
    duration: durationMs,
    ease: "Quad.out",
    onComplete: () => puff.destroy(),
  });
}

/**
 * 白色發光爆發：從 (x,y) 向四周噴出一圈加亮柔光點後淡出。
 * 用於存檔點啟用回饋。
 */
export function glowBurst(
  scene: Phaser.Scene,
  x: number,
  y: number,
  opts: { count?: number; color?: number; distance?: number; size?: number; durationMs?: number } = {}
): void {
  const { count = 12, color = 0xffffff, distance = 44, size = 16, durationMs = 480 } = opts;
  const key = ensureSoftDotTexture(scene);

  // 擴張衝擊環：從小圈擴到 distance 半徑並淡出，讓「範圍」邊界明確
  const ring = scene.add
    .circle(x, y, distance)
    .setStrokeStyle(4, color, 0.9)
    .setFillStyle(color, 0)
    .setScale(0.25)
    .setDepth(459)
    .setBlendMode(Phaser.BlendModes.ADD);
  scene.tweens.add({
    targets: ring,
    scale: 1,
    alpha: 0,
    duration: durationMs,
    ease: "Cubic.out",
    onComplete: () => ring.destroy(),
  });

  for (let i = 0; i < count; i++) {
    const a = (Math.PI * 2 * i) / count + (i % 2) * 0.26; // 交錯抖動避免死板
    const dot = scene.add
      .image(x, y, key)
      .setDisplaySize(size, size)
      .setTint(color)
      .setAlpha(0.9)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(460);
    const s0 = dot.scaleX;
    scene.tweens.add({
      targets: dot,
      x: x + Math.cos(a) * distance,
      y: y + Math.sin(a) * distance,
      alpha: 0,
      scaleX: s0 * 0.3,
      scaleY: s0 * 0.3,
      duration: durationMs,
      ease: "Quad.out",
      onComplete: () => dot.destroy(),
    });
  }
}

/**
 * 速度線：於 (x,y) 沿運動方向噴出數條白色殘影線並向後拖曳淡出。
 * 線條沿運動軸擺放、垂直方向散開，往「逆運動方向」拖曳 → 讀成高速衝出。
 * 用於衝刺與二段跳；純 Phaser rectangle＋tween，無外部素材。
 *
 * 拉伸拖尾：線在「起點」錨定，沿運動方向拉長到「位移距離的 lengthRatio(預設 0.85)」，
 * 由 scaleX 0→1 拉伸過去（前緣跟著角色跑），拉滿後淡出。長度足以橫跨大半段位移。
 *
 * @param dirX,dirY 運動方向（不需正規化）；(0,-1)=向上、(1,0)=向右
 * @param distance 本次動作的位移距離（px）；線長 = distance × lengthRatio
 */
export function speedLines(
  scene: Phaser.Scene,
  x: number,
  y: number,
  dirX: number,
  dirY: number,
  distance: number,
  opts: {
    count?: number;
    lengthRatio?: number;
    thickness?: number;
    spread?: number;
    color?: number;
    alpha?: number;
    stretchMs?: number;
    durationMs?: number;
    depth?: number;
  } = {}
): void {
  const {
    count = 4,
    lengthRatio = 0.85,
    thickness = 6,
    spread = 30,
    color = 0xffffff,
    alpha = 0.72,
    stretchMs = 130,
    durationMs = 300,
    depth = 450,
  } = opts;

  const len = Math.hypot(dirX, dirY) || 1;
  const nx = dirX / len;
  const ny = dirY / len;
  const angle = Math.atan2(ny, nx); // 線條沿運動軸
  const perpX = -ny; // 垂直運動方向（用來散開多條線）
  const perpY = nx;
  const fullLen = Math.max(distance * lengthRatio, 1);
  const key = ensureStreakTexture(scene);
  const rand = (span: number) => (Math.random() - 0.5) * span; // 對稱抖動

  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0 : i / (count - 1) - 0.5; // -0.5 ~ 0.5
    // 隨機抖動：長度、粗細、垂直位置、角度、濃淡、拉伸時間 — 讓線條不工整
    const lineLen = fullLen * (1 - Math.abs(t) * 0.25) * (0.85 + Math.random() * 0.3);
    const th = thickness * (0.7 + Math.random() * 0.7);
    const offset = t * spread + rand(spread * 0.28);
    const ax = x + perpX * offset;
    const ay = y + perpY * offset;

    // 紡錘貼圖：兩端漸細；origin(0,0.5) 錨在起點沿 +運動方向延伸
    const streak = scene.add
      .image(ax, ay, key)
      .setOrigin(0, 0.5)
      .setDisplaySize(lineLen, th)
      .setRotation(angle + rand(0.14))
      .setTint(color)
      .setDepth(depth)
      .setAlpha(alpha * (0.75 + Math.random() * 0.35))
      .setBlendMode(Phaser.BlendModes.ADD);
    const targetSX = streak.scaleX; // setDisplaySize 已設定，記下當目標
    streak.scaleX = 0;

    const grow = stretchMs * (0.85 + Math.random() * 0.4);
    // 拉伸：前緣跟著角色跑
    scene.tweens.add({ targets: streak, scaleX: targetSX, duration: grow, ease: "Cubic.out" });
    // 拉到一半後開始淡出
    scene.tweens.add({
      targets: streak,
      alpha: 0,
      delay: grow * 0.5,
      duration: durationMs - grow * 0.5,
      ease: "Quad.in",
      onComplete: () => streak.destroy(),
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
