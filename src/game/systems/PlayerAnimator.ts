import Phaser from "phaser";
import { Player } from "../entities/Player";
import { PlayerController } from "./PlayerController";
import { CHAR_CELL, CHAR_BASELINE, PRESENTATION_SCALE, NEON_CLIPS, type AnimClip } from "../data/characterAnim";

/** 落地／轉向轉場態的持續時間（ms） */
const LAND_MS = 180;
const TURN_MS = 160;

/**
 * PlayerAnimator：玩家的「表演層」，與控制器/碰撞體分離（同 3D：控制器＋模型子物件）。
 * 碰撞體維持不動；本層以獨立 sprite 呈現角色動畫，每幀同步到控制器位置、依腳底基線對齊、依面向鏡像。
 *
 * strip 未載入時整層休眠（維持玩家原視覺）；Codex 交付動畫 strip 後（BootScene 載入）自動啟用。
 */
export class PlayerAnimator {
  private readonly player: Player;
  private readonly controller: PlayerController;
  private readonly sprite: Phaser.GameObjects.Sprite | null = null;
  private readonly active: boolean;

  private landTimer = 0;
  private turnTimer = 0;
  private prevGrounded = true;
  private prevFacing: 1 | -1 = 1;

  /** BootScene 於 strip 就緒後呼叫：把每個 clip 當 spritesheet 載入 */
  static preload(scene: Phaser.Scene): void {
    for (const clip of Object.values(NEON_CLIPS)) {
      scene.load.spritesheet(clip.texture, `assets/char/${clip.file}`, {
        frameWidth: CHAR_CELL,
        frameHeight: CHAR_CELL,
      });
    }
  }

  constructor(scene: Phaser.Scene, player: Player, controller: PlayerController) {
    this.player = player;
    this.controller = controller;

    // 只有動畫 strip 已載入才啟用表演層；否則休眠，玩家維持原視覺
    this.active = scene.textures.exists(NEON_CLIPS.idle.texture);
    if (!this.active) return;

    this.createAnims(scene);
    player.setVisible(false); // 隱藏控制器本體視覺，改由表演層呈現

    this.sprite = scene.add
      .sprite(player.x, this.footY(), NEON_CLIPS.idle.texture, 0)
      .setOrigin(0.5, CHAR_BASELINE / CHAR_CELL)
      .setScale(PRESENTATION_SCALE)
      .setDepth(5);
    this.sprite.play(NEON_CLIPS.idle.key);
  }

  /** 每幀：同步表演層位置/面向，並依控制器狀態切 clip */
  update(deltaMs: number): void {
    if (!this.active || !this.sprite) return;
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    const grounded = this.player.isGrounded;
    const facing = this.player.facing;

    // 轉場態（邊緣偵測）：落地瞬間、原地轉向
    if (grounded && !this.prevGrounded) this.landTimer = LAND_MS;
    if (grounded && facing !== this.prevFacing && Math.abs(body.velocity.x) < 20) {
      this.turnTimer = TURN_MS;
    }
    this.landTimer = Math.max(0, this.landTimer - deltaMs);
    this.turnTimer = Math.max(0, this.turnTimer - deltaMs);
    this.prevGrounded = grounded;
    this.prevFacing = facing;

    // 表演層跟隨控制器：水平置中於控制器、腳底對齊碰撞體底部、依面向鏡像
    this.sprite.setPosition(this.player.x, this.footY());
    this.sprite.setFlipX(facing === -1);

    const clip = this.resolveClip(body, grounded);
    if (this.sprite.anims.currentAnim?.key !== clip.key) {
      this.sprite.play(clip.key, true);
    }
  }

  /** 依控制器狀態決定要播的 clip（轉場態優先） */
  private resolveClip(body: Phaser.Physics.Arcade.Body, grounded: boolean): AnimClip {
    if (this.landTimer > 0 && grounded) return NEON_CLIPS.land;
    if (this.turnTimer > 0 && grounded) return NEON_CLIPS.turn;
    if (this.controller.dashing) return NEON_CLIPS.dash;
    if (!grounded) {
      if (this.controller.isWallSliding) return NEON_CLIPS.wall_slide;
      return body.velocity.y < 0 ? NEON_CLIPS.jump_rise : NEON_CLIPS.jump_fall;
    }
    return Math.abs(body.velocity.x) > 10 ? NEON_CLIPS.run : NEON_CLIPS.idle;
  }

  /** 碰撞體底部的世界 y（腳底對齊基準） */
  private footY(): number {
    return (this.player.body as Phaser.Physics.Arcade.Body).bottom;
  }

  /** 依幀表建立各 clip 的 Phaser 動畫（已存在則略過） */
  private createAnims(scene: Phaser.Scene): void {
    for (const clip of Object.values(NEON_CLIPS)) {
      if (scene.anims.exists(clip.key) || !scene.textures.exists(clip.texture)) continue;
      scene.anims.create({
        key: clip.key,
        frames: scene.anims.generateFrameNumbers(clip.texture, { start: 0, end: clip.frames - 1 }),
        frameRate: clip.fps,
        repeat: clip.loop ? -1 : 0,
      });
    }
  }
}
