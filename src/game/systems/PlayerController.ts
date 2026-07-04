import Phaser from "phaser";
import { Player } from "../entities/Player";
import { AbilitySystem } from "./AbilitySystem";
import { PLAYER_PHYSICS, DOUBLE_JUMP_CONFIG, DASH_CONFIG } from "../data/playerPhysics";
import { u } from "../utils/units";
import { moveTowards, clamp } from "../utils/math";

/** 由 dash 距離與時間推導的衝刺速度（px/s） */
const DASH_SPEED_PX = u(DASH_CONFIG.dashDistanceUnit) / (DASH_CONFIG.dashDurationMs / 1000);

/**
 * PlayerController：把鍵盤輸入轉成玩家水平移動、跳躍與衝刺。
 * 所有速度／加速度／容錯時間都讀自 playerPhysics.ts（unit/s、ms），在此轉成 px/s。
 * Phase 7 加入空中衝刺 Dash（方向依輸入，無輸入則依面向），衝刺期間關閉重力。
 */
export class PlayerController {
  private readonly player: Player;
  private readonly abilities: AbilitySystem;
  private readonly cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private readonly keyA: Phaser.Input.Keyboard.Key;
  private readonly keyD: Phaser.Input.Keyboard.Key;
  /** 跳躍鍵：Space / W / ↑ */
  private readonly jumpKeys: Phaser.Input.Keyboard.Key[];
  /** 衝刺鍵：Shift / L / C */
  private readonly dashKeys: Phaser.Input.Keyboard.Key[];
  /** 下方向鍵：↓ / S（用於衝刺方向） */
  private readonly keyS: Phaser.Input.Keyboard.Key;

  /** 上一幀跳躍鍵是否按住，用來偵測按下／放開的邊緣 */
  private prevJumpHeld = false;
  /** 上一幀衝刺鍵是否按住 */
  private prevDashHeld = false;
  /** 是否正在衝刺 */
  private isDashing = false;
  /** 衝刺剩餘時間（ms） */
  private dashTimer = 0;
  /** 衝刺冷卻剩餘時間（ms） */
  private dashCooldownTimer = 0;
  /** 衝刺速度向量（px/s） */
  private dashVX = 0;
  private dashVY = 0;
  /** 目前上升是否來自一次跳躍（用於可變跳高的削減判定） */
  private isJumpRising = false;
  /** Coyote 計時器（ms）：離地後仍可跳的剩餘時間 */
  private coyoteTimer = 0;
  /** Jump Buffer 計時器（ms）：預先按下跳躍的剩餘有效時間 */
  private jumpBufferTimer = 0;

  /** Coyote 剩餘時間（ms），供 Debug overlay 讀取 */
  get coyoteRemainingMs(): number {
    return Math.max(0, this.coyoteTimer);
  }

  /** Jump Buffer 剩餘時間（ms），供 Debug overlay 讀取 */
  get jumpBufferRemainingMs(): number {
    return Math.max(0, this.jumpBufferTimer);
  }

  /** 是否正在衝刺，供 Debug overlay / 狀態顯示 */
  get dashing(): boolean {
    return this.isDashing;
  }

  /** 衝刺是否就緒（冷卻結束且尚有次數），供 Debug overlay */
  get dashReady(): boolean {
    return this.dashCooldownTimer <= 0 && this.abilities.canAirDash();
  }

  constructor(scene: Phaser.Scene, player: Player, abilities: AbilitySystem) {
    this.player = player;
    this.abilities = abilities;

    const keyboard = scene.input.keyboard;
    if (!keyboard) {
      throw new Error("PlayerController 需要鍵盤輸入，但 scene.input.keyboard 不存在");
    }
    this.cursors = keyboard.createCursorKeys();
    this.keyA = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyD = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.jumpKeys = [
      this.cursors.space,
      this.cursors.up,
      keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
    ];
    this.dashKeys = [
      this.cursors.shift,
      keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.L),
      keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.C),
    ];
    this.keyS = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
  }

  /**
   * 每幀更新水平速度。
   * @param deltaMs 上一幀經過的毫秒
   */
  update(deltaMs: number): void {
    const dt = deltaMs / 1000;
    const body = this.player.body as Phaser.Physics.Arcade.Body;

    // 衝刺優先於一般移動；衝刺進行中直接接管本幀
    if (this.handleDash(body, deltaMs)) return;

    const dir = this.readHorizontalInput();

    const vx = body.velocity.x;
    const maxSpeed = u(PLAYER_PHYSICS.maxRunSpeedUnit);
    const targetVx = dir * maxSpeed;

    const accelUnit = this.selectAcceleration(dir, vx);
    const maxDelta = u(accelUnit) * dt;

    body.setVelocityX(moveTowards(vx, targetVx, maxDelta));

    if (dir !== 0) this.player.setFacing(dir as 1 | -1);

    this.handleJump(body, deltaMs);
    this.applyGravityScale(body);
  }

  /**
   * 衝刺處理。回傳 true 表示本幀由衝刺接管（跳過一般移動／跳躍／重力）。
   * - 方向依輸入（可斜向），無輸入則依面向
   * - 衝刺期間關閉重力並維持固定速度，結束後收尾恢復
   * - 碰撞仍生效，衝刺不會穿牆
   */
  private handleDash(body: Phaser.Physics.Arcade.Body, deltaMs: number): boolean {
    this.dashCooldownTimer = Math.max(0, this.dashCooldownTimer - deltaMs);

    const dashHeld = this.dashKeys.some((k) => k.isDown);
    const dashPressed = dashHeld && !this.prevDashHeld;
    this.prevDashHeld = dashHeld;

    // 起始衝刺
    if (!this.isDashing && dashPressed && this.dashReady) {
      this.startDash(body);
    }

    if (!this.isDashing) return false;

    // 進行中
    this.dashTimer -= deltaMs;
    if (this.dashTimer <= 0) {
      this.endDash(body);
      return false; // 本幀結束衝刺，交還一般物理
    }
    body.setVelocity(this.dashVX, this.dashVY);
    return true;
  }

  /** 依輸入方向啟動一次衝刺 */
  private startDash(body: Phaser.Physics.Arcade.Body): void {
    let dx = this.readHorizontalInput();
    let dy = (this.keyS.isDown || this.cursors.down.isDown ? 1 : 0) - (this.cursors.up.isDown ? 1 : 0);
    if (dx === 0 && dy === 0) {
      dx = this.player.facing; // 無方向輸入則依面向
    }
    const len = Math.hypot(dx, dy) || 1;
    this.dashVX = (dx / len) * DASH_SPEED_PX;
    this.dashVY = (dy / len) * DASH_SPEED_PX;

    this.isDashing = true;
    this.isJumpRising = false;
    this.dashTimer = DASH_CONFIG.dashDurationMs;
    this.dashCooldownTimer = DASH_CONFIG.dashCooldownMs;
    this.abilities.useAirDash();

    // 衝刺期間關閉重力並解除下落速度上限，維持全速
    body.setAllowGravity(false);
    body.maxVelocity.y = Number.MAX_SAFE_INTEGER;
    if (dx !== 0) this.player.setFacing(dx > 0 ? 1 : -1);
  }

  /** 結束衝刺並收尾，恢復正常物理 */
  private endDash(body: Phaser.Physics.Arcade.Body): void {
    this.isDashing = false;
    body.setAllowGravity(true);
    body.maxVelocity.y = u(PLAYER_PHYSICS.maxFallSpeedUnit);
    // 收尾：垂直歸零、水平夾到最大跑速，避免殘留超速
    const maxRun = u(PLAYER_PHYSICS.maxRunSpeedUnit);
    body.setVelocity(clamp(body.velocity.x, -maxRun, maxRun), 0);
  }

  /**
   * 跳躍、容錯與可變跳高：
   * - Coyote Time：離地後 coyoteTimeMs 內仍可起跳（降低邊緣挫折）
   * - Jump Buffer：落地前 jumpBufferMs 內預按跳躍，落地瞬間自動起跳
   * - 可變跳高：上升途中放開跳躍鍵以 jumpCutMultiplier 削減速度（短按小跳、長按高跳）
   */
  private handleJump(body: Phaser.Physics.Arcade.Body, deltaMs: number): void {
    const p = PLAYER_PHYSICS;
    const grounded = this.player.isGrounded;

    const jumpHeld = this.jumpKeys.some((k) => k.isDown);
    const jumpPressed = jumpHeld && !this.prevJumpHeld;
    const jumpReleased = !jumpHeld && this.prevJumpHeld;
    this.prevJumpHeld = jumpHeld;

    // 踩地時重置滯空次數（二段跳 / 衝刺）
    if (grounded) this.abilities.resetAirState();

    // 更新計時器：踩地時充滿 coyote；按下瞬間充滿 buffer
    this.coyoteTimer = grounded ? p.coyoteTimeMs : this.coyoteTimer - deltaMs;
    this.jumpBufferTimer = jumpPressed ? p.jumpBufferMs : this.jumpBufferTimer - deltaMs;

    // 有緩衝中的跳躍輸入，且仍在 coyote 視窗內 → 地面（或 coyote）起跳
    if (this.jumpBufferTimer > 0 && this.coyoteTimer > 0) {
      body.setVelocityY(-u(p.jumpVelocityUnit));
      this.isJumpRising = true;
      // 消耗掉，避免同一次輸入或 coyote 觸發二次跳
      this.jumpBufferTimer = 0;
      this.coyoteTimer = 0;
    } else if (jumpPressed && this.abilities.canAirJump()) {
      // 已超出 coyote 視窗、於空中再次按跳 → 二段跳
      body.setVelocityY(-u(DOUBLE_JUMP_CONFIG.doubleJumpVelocityUnit));
      this.abilities.useAirJump();
      this.isJumpRising = true;
      this.jumpBufferTimer = 0;
    }

    // 提早放開：削減仍在上升的速度
    if (jumpReleased && this.isJumpRising && body.velocity.y < 0) {
      body.setVelocityY(body.velocity.y * p.jumpCutMultiplier);
    }

    // 一旦不再上升，本次跳躍的削減判定結束
    if (body.velocity.y >= 0) this.isJumpRising = false;
  }

  /**
   * 依垂直速度調整重力倍率：接近頂點降重力（滯空感），下落時增重力（俐落）。
   */
  private applyGravityScale(body: Phaser.Physics.Arcade.Body): void {
    const p = PLAYER_PHYSICS;
    const vy = body.velocity.y;
    let multiplier = 1;

    if (vy < 0) {
      // 上升中且接近頂點
      if (Math.abs(vy) < u(p.apexThresholdUnit)) multiplier = p.apexGravityMultiplier;
    } else {
      // 下落
      multiplier = p.fallGravityMultiplier;
    }

    body.setGravityY(u(p.gravityUnit) * multiplier);
  }

  /** 讀取左右輸入：-1 左、0 無、1 右 */
  private readHorizontalInput(): number {
    const left = this.cursors.left.isDown || this.keyA.isDown;
    const right = this.cursors.right.isDown || this.keyD.isDown;
    return (right ? 1 : 0) - (left ? 1 : 0);
  }

  /**
   * 依「是否有輸入、是否反向、是否在地面」選擇加速度／減速度（unit/s²）。
   */
  private selectAcceleration(dir: number, vx: number): number {
    const p = PLAYER_PHYSICS;
    const grounded = this.player.isGrounded;

    // 有輸入：加速或轉身
    if (dir !== 0) {
      const isTurning = vx !== 0 && Math.sign(vx) !== dir;
      if (isTurning) return p.turnAccelerationUnit;
      return grounded ? p.groundAccelerationUnit : p.airAccelerationUnit;
    }

    // 無輸入：減速
    return grounded ? p.groundDecelerationUnit : p.airDecelerationUnit;
  }
}
