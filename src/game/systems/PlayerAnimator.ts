import Phaser from "phaser";
import { Player } from "../entities/Player";
import { PlayerController } from "./PlayerController";
import { CHAR_CELL, CHAR_BASELINE, CHAR_SOURCE, PRESENTATION_SCALE, NEON_CLIPS, type AnimClip } from "../data/characterAnim";
import { RIG_PRELOAD } from "../data/neonRig";
import { CutoutRig, type RigState } from "./CutoutRig";
import { PLAYER_PHYSICS } from "../data/playerPhysics";
import { u } from "../utils/units";

/** 落地／轉向轉場態的持續時間（ms） */
const LAND_MS = 180;
const TURN_MS = 160;

/**
 * PlayerAnimator：玩家的「表演層」，與控制器/碰撞體分離（同 3D：控制器＋模型子物件）。
 * 碰撞體維持不動；表演層每幀同步到控制器位置、腳底對齊碰撞體底部、依面向鏡像。
 *
 * 表演來源優先序：
 *  1) cut-out rig（正式路線）：部件由固定骨架程序驅動，尺度由常數鎖死、零飄移
 *  2) AI 逐幀 strip（fallback，已退役）：部件貼圖缺失時退回舊 strip，不讓遊戲壞掉
 *  3) 皆無 → 休眠（維持玩家原視覺）
 */
export class PlayerAnimator {
  private readonly player: Player;
  private readonly controller: PlayerController;
  private readonly rig: CutoutRig | null = null;
  private readonly sprite: Phaser.GameObjects.Sprite | null = null;
  private readonly mode: "rig" | "strip" | "off";

  private landTimer = 0;
  private turnTimer = 0;
  private prevGrounded = true;
  private prevFacing: 1 | -1 = 1;

  /** BootScene 呼叫：載入 rig 部件（正式）與 strip（fallback） */
  static preload(scene: Phaser.Scene): void {
    for (const p of RIG_PRELOAD) {
      scene.load.image(p.key, `assets/${p.file}`);
    }
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

    if (CHAR_SOURCE === "rig" && CutoutRig.texturesReady(scene)) {
      this.mode = "rig";
      this.rig = new CutoutRig(scene);
      player.setVisible(false);
    } else if (scene.textures.exists(NEON_CLIPS.idle.texture)) {
      this.mode = "strip";
      this.createAnims(scene);
      player.setVisible(false);
      this.sprite = scene.add
        .sprite(player.x, this.footY(), NEON_CLIPS.idle.texture, 0)
        .setOrigin(0.5, CHAR_BASELINE / CHAR_CELL)
        .setScale(PRESENTATION_SCALE)
        .setDepth(5);
      this.sprite.play(NEON_CLIPS.idle.key);
    } else {
      this.mode = "off";
    }
  }

  /** 每幀：同步表演層位置/面向，並依控制器狀態切姿勢 */
  update(deltaMs: number): void {
    if (this.mode === "off") return;
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

    if (this.mode === "rig" && this.rig) {
      const speedRatio = Math.min(1, Math.abs(body.velocity.x) / u(PLAYER_PHYSICS.maxRunSpeedUnit));
      this.rig.update(this.resolveState(body, grounded), this.player.x, this.footY(), facing, speedRatio, deltaMs);
      return;
    }

    if (this.sprite) {
      this.sprite.setPosition(this.player.x, this.footY());
      this.sprite.setFlipX(facing === -1);
      const clip = this.resolveClip(body, grounded);
      if (this.sprite.anims.currentAnim?.key !== clip.key) {
        this.sprite.play(clip.key, true);
      }
    }
  }

  /** 依控制器狀態決定 rig 姿勢（轉場態優先；turn 由整體鏡像呈現，不需獨立姿勢） */
  private resolveState(body: Phaser.Physics.Arcade.Body, grounded: boolean): RigState {
    if (this.landTimer > 0 && grounded) return "land";
    if (this.controller.dashing) return "dash";
    if (!grounded) {
      if (this.controller.isWallSliding) return "wall_slide";
      return body.velocity.y < 0 ? "jump" : "fall";
    }
    return Math.abs(body.velocity.x) > 10 ? "run" : "idle";
  }

  /** strip fallback：依狀態決定 clip（含落地/轉向轉場態） */
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

  /** 依幀表建立各 strip clip 的 Phaser 動畫（fallback 用；已存在則略過） */
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
