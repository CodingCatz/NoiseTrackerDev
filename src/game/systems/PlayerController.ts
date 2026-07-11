import Phaser from "phaser";
import { Player } from "../entities/Player";
import { AbilitySystem } from "./AbilitySystem";
import { VirtualInput } from "./VirtualInput";
import type { PlayerState } from "../types/PlayerTypes";
import {
  PLAYER_PHYSICS,
  DOUBLE_JUMP_CONFIG,
  DASH_CONFIG,
  WALL_CONFIG,
} from "../data/playerPhysics";
import { u } from "../utils/units";
import { moveTowards, clamp } from "../utils/math";

/** 由 dash 距離與時間推導的衝刺速度（px/s） */
const DASH_SPEED_PX = u(DASH_CONFIG.dashDistanceUnit) / (DASH_CONFIG.dashDurationMs / 1000);

/** 牆面方向：-1 牆在左、+1 牆在右、0 無牆 */
type WallSide = -1 | 0 | 1;

/**
 * PlayerController：把鍵盤輸入轉成玩家水平移動、跳躍、衝刺、牆滑與牆跳。
 * 所有數值都讀自 playerPhysics.ts（unit/s、ms），在此轉成 px/s。
 * Phase 8 加入牆滑（限速下滑）與牆跳（推離牆面 + 短暫鎖水平輸入避免黏牆）。
 */
export class PlayerController {
  private readonly player: Player;
  private readonly abilities: AbilitySystem;
  private readonly virtual: VirtualInput;
  private readonly cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private readonly keyA: Phaser.Input.Keyboard.Key;
  private readonly keyD: Phaser.Input.Keyboard.Key;
  private readonly keyS: Phaser.Input.Keyboard.Key;
  /** 跳躍鍵：Space / W / ↑ */
  private readonly jumpKeys: Phaser.Input.Keyboard.Key[];
  /** 衝刺鍵：Shift / L / C */
  private readonly dashKeys: Phaser.Input.Keyboard.Key[];

  private prevJumpHeld = false;
  private prevDashHeld = false;
  private isJumpRising = false;
  private coyoteTimer = 0;
  private jumpBufferTimer = 0;

  // Dash 狀態
  private isDashing = false;
  private dashTimer = 0;
  private dashCooldownTimer = 0;
  private dashVX = 0;
  private dashVY = 0;

  // 牆壁狀態
  /** 牆跳後鎖定水平輸入的剩餘時間（ms），避免立刻貼回牆面 */
  private wallJumpLockTimer = 0;
  private isWallSlidingNow = false;
  private touchingWallSide: WallSide = 0;

  constructor(scene: Phaser.Scene, player: Player, abilities: AbilitySystem, virtual: VirtualInput) {
    this.player = player;
    this.abilities = abilities;
    this.virtual = virtual;

    const keyboard = scene.input.keyboard;
    if (!keyboard) {
      throw new Error("PlayerController 需要鍵盤輸入，但 scene.input.keyboard 不存在");
    }
    this.cursors = keyboard.createCursorKeys();
    this.keyA = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyD = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keyS = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
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
  }

  // #region Debug getters

  get coyoteRemainingMs(): number {
    return Math.max(0, this.coyoteTimer);
  }
  get jumpBufferRemainingMs(): number {
    return Math.max(0, this.jumpBufferTimer);
  }
  get dashing(): boolean {
    return this.isDashing;
  }
  get grounded(): boolean {
    return this.player.isGrounded;
  }
  get dashReady(): boolean {
    return this.dashCooldownTimer <= 0 && this.abilities.canAirDash();
  }
  get isWallSliding(): boolean {
    return this.isWallSlidingNow;
  }
  get isTouchingWall(): boolean {
    return this.touchingWallSide !== 0;
  }

  /** 由目前物理狀態推導的 PlayerState（供 Debug overlay 顯示） */
  get currentState(): PlayerState {
    if (this.isDashing) return "dash";
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    if (this.player.isGrounded) {
      return Math.abs(body.velocity.x) > 10 ? "run" : "idle";
    }
    if (this.isWallSlidingNow) return "wall_slide";
    return body.velocity.y < 0 ? "jump" : "fall";
  }

  // #endregion Debug getters

  /**
   * 每幀更新。順序：衝刺（最高優先）→ 牆跳 → 水平移動 → 一般跳躍 → 可變跳高 → 牆滑限速 → 重力倍率。
   * @param deltaMs 上一幀經過的毫秒
   */
  update(deltaMs: number): void {
    const body = this.player.body as Phaser.Physics.Arcade.Body;

    // 衝刺進行中直接接管本幀
    if (this.handleDash(body, deltaMs)) return;

    const grounded = this.player.isGrounded;
    const wall = this.readWallSide(body, grounded);
    this.touchingWallSide = wall;

    // 跳躍鍵邊緣偵測
    const jumpHeld = this.jumpKeys.some((k) => k.isDown) || this.virtual.jump;
    const jumpPressed = jumpHeld && !this.prevJumpHeld;
    const jumpReleased = !jumpHeld && this.prevJumpHeld;
    this.prevJumpHeld = jumpHeld;

    // 計時器更新
    if (grounded) this.abilities.resetAirState();
    this.coyoteTimer = grounded ? PLAYER_PHYSICS.coyoteTimeMs : this.coyoteTimer - deltaMs;
    this.jumpBufferTimer = jumpPressed ? PLAYER_PHYSICS.jumpBufferMs : this.jumpBufferTimer - deltaMs;
    this.wallJumpLockTimer = Math.max(0, this.wallJumpLockTimer - deltaMs);

    // 牆跳優先：空中貼牆且按跳 → 往反方向斜上跳開，並消耗此次跳躍輸入
    let jumpConsumed = false;
    if (jumpPressed && !grounded && wall !== 0 && this.abilities.isUnlocked("wall_jump")) {
      this.doWallJump(body, wall);
      this.jumpBufferTimer = 0;
      jumpConsumed = true;
    }

    this.applyHorizontal(body, deltaMs, grounded);
    this.applyJump(body, jumpPressed, jumpConsumed);

    // 可變跳高：上升途中放開跳躍鍵 → 削減
    if (jumpReleased && this.isJumpRising && body.velocity.y < 0) {
      body.setVelocityY(body.velocity.y * PLAYER_PHYSICS.jumpCutMultiplier);
    }
    if (body.velocity.y >= 0) this.isJumpRising = false;

    this.applyWallSlide(body, grounded, wall);
    this.applyGravityScale(body);
  }

  // #region 水平移動

  /** 套用左右移動加減速；牆跳鎖定期間跳過輸入，讓推力生效避免黏牆 */
  private applyHorizontal(body: Phaser.Physics.Arcade.Body, deltaMs: number, grounded: boolean): void {
    if (this.wallJumpLockTimer > 0) return;

    const dt = deltaMs / 1000;
    const dir = this.readHorizontalInput();
    const vx = body.velocity.x;
    const targetVx = dir * u(PLAYER_PHYSICS.maxRunSpeedUnit);
    const maxDelta = u(this.selectAcceleration(dir, vx, grounded)) * dt;

    body.setVelocityX(moveTowards(vx, targetVx, maxDelta));
    if (dir !== 0) this.player.setFacing(dir as 1 | -1);
  }

  /** 讀取左右輸入（鍵盤 + 觸控）：-1 左、0 無、1 右 */
  private readHorizontalInput(): number {
    const left = this.cursors.left.isDown || this.keyA.isDown || this.virtual.left;
    const right = this.cursors.right.isDown || this.keyD.isDown || this.virtual.right;
    return (right ? 1 : 0) - (left ? 1 : 0);
  }

  /** 依「是否有輸入、是否反向、是否在地面」選擇加速度／減速度（unit/s²） */
  private selectAcceleration(dir: number, vx: number, grounded: boolean): number {
    const p = PLAYER_PHYSICS;
    if (dir !== 0) {
      const isTurning = vx !== 0 && Math.sign(vx) !== dir;
      if (isTurning) return p.turnAccelerationUnit;
      return grounded ? p.groundAccelerationUnit : p.airAccelerationUnit;
    }
    return grounded ? p.groundDecelerationUnit : p.airDecelerationUnit;
  }

  // #endregion 水平移動

  // #region 跳躍

  /** 地面／coyote 起跳與二段跳；牆跳已消耗此次輸入時跳過 */
  private applyJump(body: Phaser.Physics.Arcade.Body, jumpPressed: boolean, jumpConsumed: boolean): void {
    if (jumpConsumed) return;

    if (this.jumpBufferTimer > 0 && this.coyoteTimer > 0) {
      body.setVelocityY(-u(PLAYER_PHYSICS.jumpVelocityUnit));
      this.isJumpRising = true;
      this.jumpBufferTimer = 0;
      this.coyoteTimer = 0;
    } else if (jumpPressed && this.abilities.canAirJump()) {
      body.setVelocityY(-u(DOUBLE_JUMP_CONFIG.doubleJumpVelocityUnit));
      this.abilities.useAirJump();
      this.isJumpRising = true;
      this.jumpBufferTimer = 0;
    }
  }

  /** 依垂直速度調整重力倍率：接近頂點降重力，下落時增重力 */
  private applyGravityScale(body: Phaser.Physics.Arcade.Body): void {
    const p = PLAYER_PHYSICS;
    const vy = body.velocity.y;
    let multiplier = 1;
    if (vy < 0) {
      if (Math.abs(vy) < u(p.apexThresholdUnit)) multiplier = p.apexGravityMultiplier;
    } else {
      multiplier = p.fallGravityMultiplier;
    }
    body.setGravityY(u(p.gravityUnit) * multiplier);
  }

  // #endregion 跳躍

  // #region 牆滑與牆跳

  /**
   * 判定貼牆方向。只在空中且水平被實心體擋住時成立，
   * 以 blocked.left/right（水平方向）判定，天生不會把地板（blocked.down）誤判成牆。
   */
  private readWallSide(body: Phaser.Physics.Arcade.Body, grounded: boolean): WallSide {
    if (grounded) return 0;
    if (body.blocked.left) return -1;
    if (body.blocked.right) return 1;
    return 0;
  }

  /** 牆滑：空中貼牆且下落時限制最大下落速度 */
  private applyWallSlide(body: Phaser.Physics.Arcade.Body, grounded: boolean, wall: WallSide): void {
    const sliding =
      !grounded &&
      wall !== 0 &&
      body.velocity.y > 0 &&
      this.abilities.isUnlocked("wall_slide");

    if (sliding) {
      const maxSlide = u(WALL_CONFIG.wallSlideMaxFallSpeedUnit);
      if (body.velocity.y > maxSlide) body.setVelocityY(maxSlide);
    }
    this.isWallSlidingNow = sliding;
  }

  /** 牆跳：往牆的反方向斜上跳開，並鎖定水平輸入一小段時間避免黏回牆 */
  private doWallJump(body: Phaser.Physics.Arcade.Body, wall: WallSide): void {
    const away = wall === -1 ? 1 : -1; // 牆在左 → 往右跳；牆在右 → 往左跳
    body.setVelocity(
      away * u(WALL_CONFIG.wallJumpXVelocityUnit),
      -u(WALL_CONFIG.wallJumpYVelocityUnit)
    );
    this.wallJumpLockTimer = WALL_CONFIG.wallJumpLockMs;
    this.isJumpRising = true;
    this.player.setFacing(away > 0 ? 1 : -1);
  }

  // #endregion 牆滑與牆跳

  // #region Dash

  /** 衝刺處理。回傳 true 表示本幀由衝刺接管 */
  private handleDash(body: Phaser.Physics.Arcade.Body, deltaMs: number): boolean {
    this.dashCooldownTimer = Math.max(0, this.dashCooldownTimer - deltaMs);

    const dashHeld = this.dashKeys.some((k) => k.isDown) || this.virtual.dash;
    const dashPressed = dashHeld && !this.prevDashHeld;
    this.prevDashHeld = dashHeld;

    if (!this.isDashing && dashPressed && this.dashReady) {
      this.startDash(body);
    }
    if (!this.isDashing) return false;

    this.dashTimer -= deltaMs;
    if (this.dashTimer <= 0) {
      this.endDash(body);
      return false;
    }
    body.setVelocity(this.dashVX, this.dashVY);
    return true;
  }

  /** 依輸入方向啟動一次衝刺（無輸入則依面向） */
  private startDash(body: Phaser.Physics.Arcade.Body): void {
    let dx = this.readHorizontalInput();
    const dy = (this.keyS.isDown || this.cursors.down.isDown ? 1 : 0) - (this.cursors.up.isDown ? 1 : 0);
    if (dx === 0 && dy === 0) dx = this.player.facing;

    const len = Math.hypot(dx, dy) || 1;
    this.dashVX = (dx / len) * DASH_SPEED_PX;
    this.dashVY = (dy / len) * DASH_SPEED_PX;

    this.isDashing = true;
    this.isJumpRising = false;
    this.dashTimer = DASH_CONFIG.dashDurationMs;
    this.dashCooldownTimer = DASH_CONFIG.dashCooldownMs;
    this.abilities.useAirDash();

    body.setAllowGravity(false);
    body.maxVelocity.y = Number.MAX_SAFE_INTEGER;
    if (dx !== 0) this.player.setFacing(dx > 0 ? 1 : -1);
  }

  /** 結束衝刺並收尾，恢復正常物理 */
  private endDash(body: Phaser.Physics.Arcade.Body): void {
    this.isDashing = false;
    body.setAllowGravity(true);
    body.maxVelocity.y = u(PLAYER_PHYSICS.maxFallSpeedUnit);
    const maxRun = u(PLAYER_PHYSICS.maxRunSpeedUnit);
    body.setVelocity(clamp(body.velocity.x, -maxRun, maxRun), 0);
  }

  // #endregion Dash
}
