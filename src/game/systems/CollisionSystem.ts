import Phaser from "phaser";
import { Player } from "../entities/Player";
import { Hazard } from "../entities/Hazard";
import { Interactable } from "../entities/Interactable";
import { AbilityPickup } from "../entities/AbilityPickup";
import { MovingPlatform } from "../entities/MovingPlatform";
import { InteractionSystem } from "./InteractionSystem";
import { AbilitySystem } from "./AbilitySystem";
import { GameState } from "./GameState";
import { CheckpointSystem } from "./CheckpointSystem";
import { INTERACTABLE_META } from "../data/interactables";
import { u } from "../utils/units";

/** CollisionSystem 發送的事件名稱 */
export const CollisionEvents = {
  PlayerDied: "player:died",
  KeyChanged: "key:changed",
  DoorOpened: "door:opened",
  CheckpointActivated: "checkpoint:activated",
  AbilityUnlocked: "ability:unlocked",
} as const;

/** 建立 CollisionSystem 所需的參照 */
export interface CollisionRefs {
  player: Player;
  solids: Phaser.GameObjects.Rectangle[];
  platforms: MovingPlatform[];
  hazards: Hazard[];
  interactions: InteractionSystem;
  abilities: AbilitySystem;
  gameState: GameState;
  checkpoints: CheckpointSystem;
  /** 掉落深淵的死亡判定 y（px） */
  deathY: number;
  /** 死亡時的實際處理（重生、計次、震動），由 GameScene 提供 */
  onPlayerDied: () => void;
}

/**
 * CollisionSystem：集中處理所有碰撞判斷。
 * - 玩家 vs 地面／移動平台（實心阻擋）
 * - 玩家 vs 陷阱／掉落深淵（致死重生）
 * - 玩家 vs 鑰匙（拾取）、checkpoint（啟用）
 * - 玩家 vs 門（阻擋）＋ 靠近按 E 開門／切換開關
 * 只負責「判斷」，死亡的實際重生交回 GameScene 提供的 onPlayerDied，維持原行為。
 */
export class CollisionSystem {
  private readonly scene: Phaser.Scene;
  private readonly refs: CollisionRefs;
  private readonly eKey: Phaser.Input.Keyboard.Key;

  constructor(scene: Phaser.Scene, refs: CollisionRefs) {
    this.scene = scene;
    this.refs = refs;
    const keyboard = scene.input.keyboard;
    if (!keyboard) throw new Error("CollisionSystem 需要鍵盤輸入");
    this.eKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.setup();
  }

  /** 註冊所有 collider / overlap */
  private setup(): void {
    const { player, solids, platforms, hazards, interactions } = this.refs;
    const physics = this.scene.physics;

    // 實心阻擋：地面、移動平台、門
    physics.add.collider(player, solids);
    for (const platform of platforms) physics.add.collider(player, platform);
    for (const door of interactions.doors.values()) physics.add.collider(player, door);

    // 陷阱：接觸即死亡
    for (const hazard of hazards) {
      physics.add.overlap(player, hazard, () => this.die());
    }

    // 鑰匙：碰到即拾取
    for (const key of interactions.keys) {
      physics.add.overlap(player, key, () => this.pickupKey(key));
    }

    // checkpoint：碰到即啟用
    for (const cp of interactions.checkpoints) {
      physics.add.overlap(player, cp, () => this.activateCheckpoint(cp));
    }

    // 能力道具：碰到即解鎖對應能力
    for (const pickup of interactions.abilityPickups) {
      physics.add.overlap(player, pickup, () => this.pickupAbility(pickup));
    }
  }

  /** 每幀連續判斷：掉落深淵死亡、E 互動（開門／切換開關） */
  update(): void {
    if (this.refs.player.y > this.refs.deathY) {
      this.die();
    }
    if (Phaser.Input.Keyboard.JustDown(this.eKey)) {
      this.handleSwitches();
      this.handleLockedDoors();
    }
  }

  // #region 判斷回應

  /** 死亡：發事件並交由 GameScene 實際重生／計次／震動 */
  private die(): void {
    this.scene.events.emit(CollisionEvents.PlayerDied);
    this.refs.onPlayerDied();
  }

  private pickupKey(key: Interactable): void {
    this.refs.gameState.addKey();
    key.destroy();
    this.scene.events.emit(CollisionEvents.KeyChanged, this.refs.gameState.keyCount);
  }

  private pickupAbility(pickup: AbilityPickup): void {
    this.refs.abilities.unlock(pickup.abilityId);
    // 牆跳與牆滑成對：撿到牆跳一併解鎖牆滑，垂直通道才好爬
    if (pickup.abilityId === "wall_jump") this.refs.abilities.unlock("wall_slide");
    pickup.destroy();
    this.scene.events.emit(CollisionEvents.AbilityUnlocked, pickup.abilityId);
  }

  private activateCheckpoint(cp: Interactable): void {
    if (cp.activated) return;
    cp.activated = true;
    cp.markActivated(0x7dffa8);
    // 重生點設在 checkpoint 上方一點，重生後落地站定
    this.refs.checkpoints.setCheckpoint(cp.x, cp.y - u(1));
    this.scene.events.emit(CollisionEvents.CheckpointActivated, cp.objId);
  }

  /** 靠近開關按 E → 切換並連動 switch_door */
  private handleSwitches(): void {
    for (const sw of this.refs.interactions.switches) {
      if (this.scene.physics.overlap(this.refs.player, sw.entity)) {
        sw.on = !sw.on;
        sw.entity.setFillStyle(sw.on ? 0x7dffa8 : INTERACTABLE_META.switch.color, 0.95);
        if (sw.targetId) {
          const door = this.refs.interactions.doors.get(sw.targetId);
          if (door) {
            sw.on ? door.open() : door.close();
            if (sw.on) this.scene.events.emit(CollisionEvents.DoorOpened, sw.targetId);
          }
        }
      }
    }
  }

  /** 靠近上鎖的門且有 key → 開門 */
  private handleLockedDoors(): void {
    for (const door of this.refs.interactions.doors.values()) {
      if (
        door.kind === "locked_door" &&
        !door.isOpen &&
        this.scene.physics.overlap(this.refs.player, door) &&
        this.refs.gameState.useKey()
      ) {
        door.open();
        this.scene.events.emit(CollisionEvents.DoorOpened, door.objId);
        this.scene.events.emit(CollisionEvents.KeyChanged, this.refs.gameState.keyCount);
      }
    }
  }

  // #endregion 判斷回應
}
