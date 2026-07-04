import Phaser from "phaser";
import type { AbilityId, AbilityState } from "../types/AbilityTypes";
import { DOUBLE_JUMP_CONFIG, DASH_CONFIG } from "../data/playerPhysics";

/** Registry 鍵：已解鎖能力清單，供 UIScene 讀取 */
export const REGISTRY_UNLOCKED_ABILITIES = "unlockedAbilities";

/**
 * AbilitySystem：管理玩家可解鎖能力與滯空使用次數。
 * 能力狀態集中於此，不寫死在 Player。解鎖變動會寫入 scene.registry 供 UI 讀取。
 */
export class AbilitySystem {
  private readonly scene: Phaser.Scene;
  private readonly state: AbilityState;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.state = {
      unlocked: {
        double_jump: false,
        dash: false,
        wall_slide: false,
        wall_jump: false,
        ground_pound: false,
      },
      airJumpsUsed: 0,
      airDashesUsed: 0,
    };
    this.publish();
  }

  /** 該能力是否已解鎖 */
  isUnlocked(id: AbilityId): boolean {
    return this.state.unlocked[id];
  }

  /** 解鎖能力並通知 UI */
  unlock(id: AbilityId): void {
    if (this.state.unlocked[id]) return;
    this.state.unlocked[id] = true;
    this.publish();
  }

  /** 目前滯空已用的額外跳躍次數（供 Debug overlay） */
  get airJumpsUsed(): number {
    return this.state.airJumpsUsed;
  }

  /** 目前滯空已用的衝刺次數（供 Phase 7 / Debug overlay） */
  get airDashesUsed(): number {
    return this.state.airDashesUsed;
  }

  /** 是否還能進行空中二段跳 */
  canAirJump(): boolean {
    return (
      this.isUnlocked("double_jump") &&
      this.state.airJumpsUsed < DOUBLE_JUMP_CONFIG.maxAirJumps
    );
  }

  /** 消耗一次空中跳躍 */
  useAirJump(): void {
    this.state.airJumpsUsed++;
  }

  /** 是否還能進行空中衝刺（Phase 7 使用） */
  canAirDash(): boolean {
    return this.isUnlocked("dash") && this.state.airDashesUsed < DASH_CONFIG.maxAirDashes;
  }

  /** 消耗一次空中衝刺（Phase 7 使用） */
  useAirDash(): void {
    this.state.airDashesUsed++;
  }

  /** 落地時重置滯空次數 */
  resetAirState(): void {
    this.state.airJumpsUsed = 0;
    this.state.airDashesUsed = 0;
  }

  /** 將已解鎖能力清單寫入 registry，供其他 Scene（UI）讀取 */
  private publish(): void {
    const ids = (Object.keys(this.state.unlocked) as AbilityId[]).filter(
      (id) => this.state.unlocked[id]
    );
    this.scene.registry.set(REGISTRY_UNLOCKED_ABILITIES, ids);
  }
}
