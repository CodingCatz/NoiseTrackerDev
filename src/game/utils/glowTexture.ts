import Phaser from "phaser";

/**
 * 將既有的純白剪影貼圖烤成「剪影 + 柔光暈」的新貼圖（只建一次）。
 * Phaser 3.90 的 postFX 濾鏡在本專案失效，改以離屏 canvas 的 shadowBlur 產生光暈；
 * 產物仍為純白（含白色光暈），可 runtime setTint 染色、setAlpha 調透明。
 *
 * @param scene 目前場景
 * @param srcKey 來源貼圖鍵（已載入的純白剪影）
 * @param outKey 產物貼圖鍵
 * @param blur 光暈模糊半徑（px，以 512 來源為基準）
 * @param pad 四邊留給光暈溢出的邊距（px）
 */
export function bakeGlowTexture(
  scene: Phaser.Scene,
  srcKey: string,
  outKey: string,
  blur = 22,
  pad = 28
): void {
  if (scene.textures.exists(outKey)) return;
  if (!scene.textures.exists(srcKey)) return;

  const src = scene.textures.get(srcKey).getSourceImage() as HTMLImageElement | HTMLCanvasElement;
  const cw = src.width + pad * 2;
  const ch = src.height + pad * 2;

  const tex = scene.textures.createCanvas(outKey, cw, ch);
  if (!tex) return;
  const ctx = tex.getContext();

  ctx.shadowColor = "#ffffff";
  ctx.shadowBlur = blur;
  ctx.drawImage(src, pad, pad); // 光暈第一層
  ctx.drawImage(src, pad, pad); // 加強光暈
  ctx.shadowBlur = 0;
  ctx.drawImage(src, pad, pad); // 銳利核心
  tex.refresh();
}
