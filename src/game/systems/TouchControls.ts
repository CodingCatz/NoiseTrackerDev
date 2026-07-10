import Phaser from "phaser";
import { VirtualInput } from "./VirtualInput";
import { isTouchLikely } from "../utils/platform";
import { bakeGlowTexture } from "../utils/glowTexture";
import { JUMP_ICON, SKILL_ICONS, KEY_ICON, type IconMeta } from "../data/abilities";

/** 視覺常數：全部純白，方便日後統一染色與調透明 */
const DEPTH_HIT = 9000;
const DEPTH_VISUAL = 9001;
const WHITE = 0xffffff;

/** 方向箭頭：半透白＋光暈，按下時提亮 */
const ARROW_ALPHA = 0.35;
const ARROW_ALPHA_HELD = 0.8;

/** 動作鈕：極簡扁平白細圓框，無填色（按下時透出淡填色回饋） */
const FRAME_STROKE = 4;
const FRAME_ALPHA = 0.7;
const FRAME_FILL_HELD = 0.15;

/** 動作鈕內的人形剪影（半透＋光暈，與箭頭同調；按下提亮） */
const ICON_ALPHA = 0.55;
const ICON_ALPHA_HELD = 0.95;

/**
 * TouchControls：手機／平板／小螢幕才出現的虛擬按鈕，寫入 VirtualInput。
 * 方向鍵為半透明白色光暈三角；動作鍵為極簡扁平白細圓框（內含文字，日後可換人形剪影圖示）。
 * 全部純白便於染色與調透明；座標使用 FHD 邏輯座標，由 Scale Manager 等比縮放；桌機大螢幕完全不建立。
 */
export class TouchControls {
  /** 是否有實際建立按鈕（桌機為 false） */
  readonly active: boolean;

  constructor(scene: Phaser.Scene, virtual: VirtualInput) {
    this.active = isTouchLikely();
    if (!this.active) return;

    // 允許多點觸控（同時按方向 + 跳 / 衝刺）
    scene.input.addPointer(2);

    // 左下：移動（半透白光暈三角）
    this.makeArrowButton(scene, 180, 900, 85, "left", (v) => (virtual.left = v));
    this.makeArrowButton(scene, 400, 900, 85, "right", (v) => (virtual.right = v));

    // 右下：動作（白細圓框 + 半透光暈人形剪影；E 為鑰匙圖，待 Codex 交付前只顯示框）
    this.makeActionHoldButton(scene, 1780, 900, 100, JUMP_ICON, (v) => (virtual.jump = v));
    this.makeActionHoldButton(scene, 1560, 770, 80, SKILL_ICONS.dash, (v) => (virtual.dash = v));
    this.makeActionTapButton(scene, 1560, 970, 70, KEY_ICON, () => virtual.pressInteract());
  }

  // #region 方向箭頭

  /** 方向箭頭鈕（按住型）：半透白光暈三角（烤成貼圖）+ 透明命中圓，按下提亮 */
  private makeArrowButton(
    scene: Phaser.Scene,
    x: number,
    y: number,
    radius: number,
    dir: "left" | "right",
    setHeld: (held: boolean) => void
  ): void {
    const key = `ui_arrow_${dir}`;
    this.ensureArrowTexture(scene, key, radius, dir);

    // 純白貼圖 → 可 setTint 染色、setAlpha 調透明
    const arrow = scene.add
      .image(x, y, key)
      .setAlpha(ARROW_ALPHA)
      .setScrollFactor(0)
      .setDepth(DEPTH_VISUAL);

    const hit = this.makeHitCircle(scene, x, y, radius);
    hit.on("pointerdown", () => {
      setHeld(true);
      arrow.setAlpha(ARROW_ALPHA_HELD);
    });
    const release = (): void => {
      setHeld(false);
      arrow.setAlpha(ARROW_ALPHA);
    };
    hit.on("pointerup", release);
    hit.on("pointerout", release);
  }

  /**
   * 以離屏 canvas 將「白三角 + 柔光暈」烤成一張純白貼圖（只建一次）。
   * Phaser 3.90 的 Shape 物件不吃 postFX 濾鏡，改以 canvas shadowBlur 產生光暈，
   * 全白便於 runtime 染色與調透明，且不依賴 WebGL FX pipeline。
   */
  private ensureArrowTexture(
    scene: Phaser.Scene,
    key: string,
    radius: number,
    dir: "left" | "right"
  ): void {
    if (scene.textures.exists(key)) return;

    const w = radius * 1.05;
    const h = radius * 1.35;
    const pad = 26; // 留給光暈的邊距
    const cw = Math.ceil(w + pad * 2);
    const ch = Math.ceil(h + pad * 2);

    const tex = scene.textures.createCanvas(key, cw, ch);
    if (!tex) return;
    const ctx = tex.getContext();

    const drawTriangle = (): void => {
      ctx.beginPath();
      if (dir === "left") {
        ctx.moveTo(pad, pad + h / 2);
        ctx.lineTo(pad + w, pad);
        ctx.lineTo(pad + w, pad + h);
      } else {
        ctx.moveTo(pad, pad);
        ctx.lineTo(pad, pad + h);
        ctx.lineTo(pad + w, pad + h / 2);
      }
      ctx.closePath();
      ctx.fill();
    };

    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "#ffffff";
    ctx.shadowBlur = 18;
    drawTriangle(); // 光暈第一層
    drawTriangle(); // 加強光暈
    ctx.shadowBlur = 0;
    drawTriangle(); // 銳利核心
    tex.refresh();
  }

  // #endregion 方向箭頭

  // #region 動作鈕

  /** 動作鈕（按住型）：跳 / 衝刺 */
  private makeActionHoldButton(
    scene: Phaser.Scene,
    x: number,
    y: number,
    radius: number,
    icon: IconMeta,
    setHeld: (held: boolean) => void
  ): void {
    const frame = this.makeActionFrame(scene, x, y, radius);
    const glyph = this.makeButtonIcon(scene, x, y, radius, icon);
    frame.on("pointerdown", () => {
      setHeld(true);
      frame.setFillStyle(WHITE, FRAME_FILL_HELD);
      glyph?.setAlpha(ICON_ALPHA_HELD);
    });
    const release = (): void => {
      setHeld(false);
      frame.setFillStyle(WHITE, 0);
      glyph?.setAlpha(ICON_ALPHA);
    };
    frame.on("pointerup", release);
    frame.on("pointerout", release);
  }

  /** 動作鈕（點擊型）：互動 E（鑰匙圖），按下觸發一次 */
  private makeActionTapButton(
    scene: Phaser.Scene,
    x: number,
    y: number,
    radius: number,
    icon: IconMeta,
    onTap: () => void
  ): void {
    const frame = this.makeActionFrame(scene, x, y, radius);
    const glyph = this.makeButtonIcon(scene, x, y, radius, icon);
    frame.on("pointerdown", () => {
      frame.setFillStyle(WHITE, FRAME_FILL_HELD);
      glyph?.setAlpha(ICON_ALPHA_HELD);
      onTap();
    });
    const clear = (): void => {
      frame.setFillStyle(WHITE, 0);
      glyph?.setAlpha(ICON_ALPHA);
    };
    frame.on("pointerup", clear);
    frame.on("pointerout", clear);
  }

  /** 極簡扁平白細圓框（無填色），本身為互動命中目標 */
  private makeActionFrame(
    scene: Phaser.Scene,
    x: number,
    y: number,
    radius: number
  ): Phaser.GameObjects.Arc {
    return scene.add
      .circle(x, y, radius, WHITE, 0)
      .setStrokeStyle(FRAME_STROKE, WHITE, FRAME_ALPHA)
      .setScrollFactor(0)
      .setDepth(DEPTH_VISUAL)
      .setInteractive({ useHandCursor: true });
  }

  /**
   * 圓框內的半透光暈人形剪影。以 icon 貼圖烤出光暈版、正規化到框內大小；
   * 貼圖未載入（如 key 圖尚未交付）時回傳 null，該鈕暫時只有框。
   */
  private makeButtonIcon(
    scene: Phaser.Scene,
    x: number,
    y: number,
    radius: number,
    icon: IconMeta
  ): Phaser.GameObjects.Image | null {
    if (!scene.textures.exists(icon.key)) return null;
    const glowKey = `${icon.key}-glow`;
    bakeGlowTexture(scene, icon.key, glowKey);
    return scene.add
      .image(x, y, glowKey)
      .setScale((radius * 1.15) / icon.contentLongest)
      .setAlpha(ICON_ALPHA)
      .setScrollFactor(0)
      .setDepth(DEPTH_VISUAL);
  }

  // #endregion 動作鈕

  /** 透明命中圓（提供大範圍觸控目標；視覺由三角負責） */
  private makeHitCircle(
    scene: Phaser.Scene,
    x: number,
    y: number,
    radius: number
  ): Phaser.GameObjects.Arc {
    return scene.add
      .circle(x, y, radius, WHITE, 0)
      .setScrollFactor(0)
      .setDepth(DEPTH_HIT)
      .setInteractive({ useHandCursor: true });
  }
}
