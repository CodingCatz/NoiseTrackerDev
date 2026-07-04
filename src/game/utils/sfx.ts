import Phaser from "phaser";

/**
 * Sfx：音效掛勾。保留呼叫點但目前尚無音檔——
 * play() 只在音檔確實存在於 cache 時才播放，否則安靜跳過，
 * 不硬塞無效路徑、不產生載入錯誤。日後放入音檔即自動生效。
 */
export class Sfx {
  private readonly scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /** 播放指定音效（音檔不存在時安靜跳過） */
  play(key: string, volume = 1): void {
    if (this.scene.cache.audio.exists(key)) {
      this.scene.sound.play(key, { volume });
    }
  }
}
