import Phaser from "phaser";
import { CAMERA_CONFIG } from "../data/cameraConfig";
import { u } from "../utils/units";

/**
 * CameraSystem：集中管理主相機的跟隨、死區與震動。
 * 世界邊界由 LevelSystem 設定，Phaser 會自動把相機夾在邊界內，不會超出關卡。
 * 相機設定不散落在 GameScene，數值讀自 cameraConfig.ts。
 */
export class CameraSystem {
  private readonly cam: Phaser.Cameras.Scene2D.Camera;

  constructor(scene: Phaser.Scene, target: Phaser.GameObjects.GameObject) {
    this.cam = scene.cameras.main;
    this.cam.startFollow(
      target,
      true,
      CAMERA_CONFIG.followLerpX,
      CAMERA_CONFIG.followLerpY
    );
    this.cam.setDeadzone(u(CAMERA_CONFIG.deadZoneWidthUnit), u(CAMERA_CONFIG.deadZoneHeightUnit));
  }

  /** 輕微震動（落地重擊等） */
  smallShake(): void {
    this.cam.shake(CAMERA_CONFIG.smallShakeMs, CAMERA_CONFIG.smallShakeIntensity);
  }

  /** 較強震動（死亡等） */
  largeShake(): void {
    this.cam.shake(CAMERA_CONFIG.largeShakeMs, CAMERA_CONFIG.largeShakeIntensity);
  }
}
