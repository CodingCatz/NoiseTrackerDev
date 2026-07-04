import Phaser from "phaser";
import { Interactable } from "../entities/Interactable";
import { AbilityPickup } from "../entities/AbilityPickup";
import type { LevelConfig, LevelObjectConfig } from "../types/LevelTypes";
import { INTERACTABLE_META } from "../data/interactables";
import { u } from "../utils/units";

/** 開關與其連動目標 */
export interface SwitchEntry {
  entity: Interactable;
  targetId?: string;
  on: boolean;
}

/**
 * InteractionSystem：依關卡資料「建立」探索互動物件（key／door／switch／checkpoint）。
 * 只負責建立與登記物件，實際碰撞／overlap／E 互動判斷統一由 CollisionSystem 處理。
 * goal 由 LevelSystem 顯示標記。
 */
export class InteractionSystem {
  private readonly scene: Phaser.Scene;

  readonly keys: Interactable[] = [];
  readonly checkpoints: Interactable[] = [];
  readonly doors = new Map<string, Interactable>();
  readonly switches: SwitchEntry[] = [];
  readonly abilityPickups: AbilityPickup[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /** 依關卡資料建立互動物件 */
  build(level: LevelConfig): void {
    for (const obj of level.objects) {
      switch (obj.type) {
        case "key":
          this.keys.push(this.spawn(obj, u(0.6), u(0.6)));
          break;
        case "checkpoint":
          this.checkpoints.push(this.spawn(obj, u(0.6), u(1.2)));
          break;
        case "switch":
          this.switches.push({ entity: this.spawn(obj, u(1), u(0.3)), targetId: obj.targetId, on: false });
          break;
        case "locked_door":
        case "switch_door":
          this.doors.set(obj.id, this.spawn(obj, u(1), u(3)));
          break;
        case "ability_pickup":
          if (obj.grantsAbilityId) {
            this.abilityPickups.push(
              new AbilityPickup(this.scene, u(obj.xUnit), u(obj.yUnit), u(0.35), obj.grantsAbilityId)
            );
          }
          break;
        default:
          break; // goal 由 LevelSystem 處理
      }
    }
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
}
