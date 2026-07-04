import Phaser from "phaser";

/** Registry 鍵：供 UI 讀取的遊戲狀態 */
export const REGISTRY_KEY_COUNT = "keyCount";
export const REGISTRY_DEATHS = "deaths";

/**
 * GameState：管理跨系統的遊戲狀態（Phase 11/12 先做 keyCount 與 deaths）。
 * 狀態寫入 scene.registry，UI 只讀不寫。Phase 16 會擴充能力／區域／通關等欄位。
 */
export class GameState {
  private readonly scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.scene.registry.set(REGISTRY_KEY_COUNT, 0);
    this.scene.registry.set(REGISTRY_DEATHS, 0);
  }

  get keyCount(): number {
    return (this.scene.registry.get(REGISTRY_KEY_COUNT) as number) ?? 0;
  }

  get deaths(): number {
    return (this.scene.registry.get(REGISTRY_DEATHS) as number) ?? 0;
  }

  /** 取得鑰匙 */
  addKey(amount = 1): void {
    this.scene.registry.set(REGISTRY_KEY_COUNT, this.keyCount + amount);
  }

  /** 消耗一把鑰匙，成功回傳 true */
  useKey(): boolean {
    if (this.keyCount <= 0) return false;
    this.scene.registry.set(REGISTRY_KEY_COUNT, this.keyCount - 1);
    return true;
  }

  /** 死亡次數 +1 */
  addDeath(): void {
    this.scene.registry.set(REGISTRY_DEATHS, this.deaths + 1);
  }
}
