import Phaser from "phaser";
import { Player } from "../entities/Player";
import { Interactable } from "../entities/Interactable";
import { GameState } from "./GameState";
import { CheckpointSystem } from "./CheckpointSystem";
import type { LevelConfig, LevelObjectConfig } from "../types/LevelTypes";
import { INTERACTABLE_META } from "../data/interactables";
import { u } from "../utils/units";

interface SwitchEntry {
  entity: Interactable;
  targetId?: string;
  on: boolean;
}

/**
 * InteractionSystem：建立並管理探索互動物件（key／door／switch／checkpoint）。
 * - key：碰到即拾取，keyCount +1
 * - locked_door：靠近按 E 且有 key 才開
 * - switch：靠近按 E 切換，控制對應 switch_door 開關
 * - checkpoint：碰到即啟用為重生點
 * goal 的通關判定留待 Phase 16，此處僅由 LevelSystem 顯示標記。
 */
export class InteractionSystem {
  private readonly scene: Phaser.Scene;
  private readonly player: Player;
  private readonly gameState: GameState;
  private readonly checkpoints: CheckpointSystem;
  private readonly eKey: Phaser.Input.Keyboard.Key;

  private readonly doors = new Map<string, Interactable>();
  private readonly switches: SwitchEntry[] = [];

  constructor(
    scene: Phaser.Scene,
    player: Player,
    gameState: GameState,
    checkpoints: CheckpointSystem
  ) {
    this.scene = scene;
    this.player = player;
    this.gameState = gameState;
    this.checkpoints = checkpoints;
    const keyboard = scene.input.keyboard;
    if (!keyboard) throw new Error("InteractionSystem 需要鍵盤輸入");
    this.eKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
  }

  /** 依關卡資料建立互動物件並設定碰撞／overlap */
  build(level: LevelConfig): void {
    for (const obj of level.objects) {
      switch (obj.type) {
        case "key":
          this.createKey(obj);
          break;
        case "checkpoint":
          this.createCheckpoint(obj);
          break;
        case "switch":
          this.createSwitch(obj);
          break;
        case "locked_door":
          this.createDoor(obj, u(1), u(3));
          break;
        case "switch_door":
          this.createDoor(obj, u(1), u(3));
          break;
        default:
          break; // goal 由 LevelSystem 處理
      }
    }
  }

  /** 每幀處理 E 互動（開門、切換開關） */
  update(): void {
    if (!Phaser.Input.Keyboard.JustDown(this.eKey)) return;

    // 開關切換
    for (const sw of this.switches) {
      if (this.scene.physics.overlap(this.player, sw.entity)) {
        sw.on = !sw.on;
        sw.entity.setFillStyle(sw.on ? 0x7dffa8 : INTERACTABLE_META.switch.color, 0.95);
        if (sw.targetId) {
          const door = this.doors.get(sw.targetId);
          if (door) (sw.on ? door.open() : door.close());
        }
      }
    }

    // 靠近上鎖的門且有 key → 開門
    for (const door of this.doors.values()) {
      if (
        door.kind === "locked_door" &&
        !door.isOpen &&
        this.scene.physics.overlap(this.player, door) &&
        this.gameState.useKey()
      ) {
        door.open();
      }
    }
  }

  // #region 建立各類物件

  private createKey(obj: LevelObjectConfig): void {
    const key = this.spawn(obj, u(0.6), u(0.6));
    this.scene.physics.add.overlap(this.player, key, () => {
      this.gameState.addKey();
      key.destroy();
    });
  }

  private createCheckpoint(obj: LevelObjectConfig): void {
    const cp = this.spawn(obj, u(0.6), u(1.2));
    let activated = false;
    this.scene.physics.add.overlap(this.player, cp, () => {
      if (activated) return;
      activated = true;
      cp.markActivated(0x7dffa8);
      // 重生點設在 checkpoint 上方一點，重生後落地站定
      this.checkpoints.setCheckpoint(cp.x, cp.y - u(1));
    });
  }

  private createSwitch(obj: LevelObjectConfig): void {
    const sw = this.spawn(obj, u(1), u(0.3));
    this.switches.push({ entity: sw, targetId: obj.targetId, on: false });
  }

  private createDoor(obj: LevelObjectConfig, widthPx: number, heightPx: number): void {
    const door = this.spawn(obj, widthPx, heightPx);
    this.doors.set(obj.id, door);
    this.scene.physics.add.collider(this.player, door);
  }

  /** 依物件設定與尺寸建立 Interactable */
  private spawn(obj: LevelObjectConfig, widthPx: number, heightPx: number): Interactable {
    const meta = INTERACTABLE_META[obj.type];
    return new Interactable(
      this.scene,
      u(obj.xUnit),
      u(obj.yUnit),
      widthPx,
      heightPx,
      meta.color,
      obj.type,
      obj.id,
      obj.targetId
    );
  }

  // #endregion 建立各類物件
}
