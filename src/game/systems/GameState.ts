import Phaser from "phaser";
import type { AbilityId } from "../types/AbilityTypes";
import { REGISTRY_UNLOCKED_ABILITIES } from "./AbilitySystem";

/** Registry 鍵：供 UI 讀取的遊戲狀態 */
export const REGISTRY_KEY_COUNT = "keyCount";
export const REGISTRY_DEATHS = "deaths";

/** 進度快照 */
export interface ProgressSnapshot {
  deaths: number;
  keyCount: number;
  unlockedAbilities: AbilityId[];
  checkpointId: string | null;
  currentArea: string;
  isVictory: boolean;
}

/**
 * GameState：集中管理整場遊戲的進度狀態。
 * 死亡次數、鑰匙數、已解鎖能力、目前存檔點、目前區域、是否通關全由此查詢。
 * deaths／keyCount 寫入 registry 供 UI 讀取；能力清單由 AbilitySystem 發佈到同一 registry，這裡代為彙整。
 * 隨 GameScene 重新建立而重置，達成「重來時清乾淨舊狀態」。
 */
export class GameState {
  private readonly scene: Phaser.Scene;
  private _checkpointId: string | null = null;
  private _currentArea = "";
  private _isVictory = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.scene.registry.set(REGISTRY_KEY_COUNT, 0);
    this.scene.registry.set(REGISTRY_DEATHS, 0);
  }

  // #region 鑰匙

  get keyCount(): number {
    return (this.scene.registry.get(REGISTRY_KEY_COUNT) as number) ?? 0;
  }

  addKey(amount = 1): void {
    this.scene.registry.set(REGISTRY_KEY_COUNT, this.keyCount + amount);
  }

  useKey(): boolean {
    if (this.keyCount <= 0) return false;
    this.scene.registry.set(REGISTRY_KEY_COUNT, this.keyCount - 1);
    return true;
  }

  // #endregion 鑰匙

  // #region 死亡

  get deaths(): number {
    return (this.scene.registry.get(REGISTRY_DEATHS) as number) ?? 0;
  }

  addDeath(): void {
    this.scene.registry.set(REGISTRY_DEATHS, this.deaths + 1);
  }

  // #endregion 死亡

  // #region 存檔點 / 區域 / 通關

  /** 目前啟用中的存檔點 id（null 表示尚未啟用） */
  get checkpointId(): string | null {
    return this._checkpointId;
  }

  setCheckpoint(id: string): void {
    this._checkpointId = id;
  }

  /** 目前區域名稱 */
  get currentArea(): string {
    return this._currentArea;
  }

  setArea(name: string): void {
    this._currentArea = name;
  }

  /** 是否已通關 */
  get isVictory(): boolean {
    return this._isVictory;
  }

  win(): void {
    this._isVictory = true;
  }

  // #endregion 存檔點 / 區域 / 通關

  /** 已解鎖能力（彙整自 AbilitySystem 發佈的 registry） */
  get unlockedAbilities(): AbilityId[] {
    return (this.scene.registry.get(REGISTRY_UNLOCKED_ABILITIES) as AbilityId[]) ?? [];
  }

  /** 目前完整進度快照（除錯／存檔用） */
  snapshot(): ProgressSnapshot {
    return {
      deaths: this.deaths,
      keyCount: this.keyCount,
      unlockedAbilities: this.unlockedAbilities,
      checkpointId: this._checkpointId,
      currentArea: this._currentArea,
      isVictory: this._isVictory,
    };
  }
}
