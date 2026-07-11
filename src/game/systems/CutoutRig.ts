import Phaser from "phaser";
import { NEON_PARTS, RIG_SCALE, type RigPart, type RigPartName } from "../data/neonRig";
import type { PlayerState } from "../types/PlayerTypes";

/** 表演層可播的姿勢狀態（PlayerState + 轉場態 land） */
export type RigState = PlayerState | "land";

/** 跑步擺腿/擺臂幅度（弧度）與步頻（每秒相位圈數，會再乘速度比） */
const RUN_SWING = 0.55;
const RUN_ARM_SWING = 0.45;
const RUN_HZ = 2.2;
/** 呼吸頻率（Hz） */
const BREATH_HZ = 0.9;
/** 垂直位移（顯示像素，不隨 RIG_SCALE 變動） */
const RUN_BOB_PX = 3;
const IDLE_BOB_PX = 1;
const LAND_SINK_PX = 2;

/**
 * CutoutRig：Neon 的 cut-out 骨骼表演層（v2 部件：頭/軀幹/雙臂/雙腿）。
 * Container + 6 個部件 Sprite，同一固定骨架驅動，
 * 所有動作為程序式（旋轉/位移/縮放），尺度由 RIG_SCALE 鎖死——不會忽大忽小。
 * 深度序：後臂→腿→軀幹→前臂→頭（面向右時 armL 為後臂）。
 */
export class CutoutRig {
  readonly root: Phaser.GameObjects.Container;
  private readonly parts: Record<RigPartName, Phaser.GameObjects.Sprite>;
  private t = 0;

  /** 部件貼圖是否已載入（決定 rig 模式可否啟用） */
  static texturesReady(scene: Phaser.Scene): boolean {
    return Object.values(NEON_PARTS).every((p) => scene.textures.exists(p.key));
  }

  constructor(scene: Phaser.Scene) {
    this.root = scene.add.container(0, 0).setDepth(5);
    const make = (p: RigPart) => {
      const s = scene.add.sprite(0, 0, p.key).setOrigin(p.originX, p.originY).setDepth(p.depth);
      // 位置 = 部件左上偏移 + origin 在部件內的位置（源像素座標，container 統一縮放）
      s.setPosition(p.dx + p.originX * s.width, p.dy + p.originY * s.height);
      return s;
    };
    this.parts = {
      armL: make(NEON_PARTS.armL),
      legL: make(NEON_PARTS.legL),
      legR: make(NEON_PARTS.legR),
      torso: make(NEON_PARTS.torso),
      armR: make(NEON_PARTS.armR),
      head: make(NEON_PARTS.head),
    };
    // 依 depth 排序加入（Container 內以加入順序繪製）
    this.root.add(Object.values(this.parts).sort((a, b) => a.depth - b.depth));
    this.root.setScale(RIG_SCALE);
  }

  /**
   * 每幀更新姿勢。
   * @param state 目前狀態
   * @param x 世界 x（玩家中心）
   * @param footY 世界 y（碰撞體底部＝腳底）
   * @param facing 面向（1 右 / -1 左）
   * @param speedRatio 水平速度比（0~1，驅動步頻）
   * @param dtMs 幀時間
   */
  update(state: RigState, x: number, footY: number, facing: 1 | -1, speedRatio: number, dtMs: number): void {
    const dt = dtMs / 1000;
    this.t += dt;
    // 面向：整體鏡像（部件畫右向）
    this.root.setPosition(x, footY);
    this.root.setScale(RIG_SCALE * facing, RIG_SCALE);

    const P = this.parts;
    // 重置每幀會改的屬性（各姿勢只疊自己的）
    P.torso.setScale(1).setRotation(0);
    P.head.setRotation(0);
    P.legL.setRotation(0);
    P.legR.setRotation(0);
    P.armL.setRotation(0);
    P.armR.setRotation(0);

    switch (state) {
      case "run": {
        const ph = this.t * Math.PI * 2 * RUN_HZ * Math.max(0.5, speedRatio);
        const swing = RUN_SWING * Math.max(0.6, speedRatio);
        const armSwing = RUN_ARM_SWING * Math.max(0.6, speedRatio);
        P.legL.setRotation(Math.sin(ph) * swing);
        P.legR.setRotation(Math.sin(ph + Math.PI) * swing);
        P.armL.setRotation(Math.sin(ph + Math.PI) * armSwing); // 臂與同側腿反相
        P.armR.setRotation(Math.sin(ph) * armSwing);
        this.root.y = footY - Math.abs(Math.sin(ph)) * RUN_BOB_PX; // 2×頻起伏（四相節奏）
        P.torso.setRotation(0.09); // 前傾
        P.head.setRotation(-0.05 + Math.sin(ph - 0.6) * 0.03); // 頭髮/頭部延遲跟隨（secondary）
        break;
      }
      case "dash": {
        P.torso.setRotation(0.22);
        P.head.setRotation(-0.1);
        P.legL.setRotation(0.5);
        P.legR.setRotation(-0.35);
        P.armL.setRotation(-0.55); // 雙臂後掠
        P.armR.setRotation(-0.75);
        break;
      }
      case "jump": {
        P.legL.setRotation(0.35);
        P.legR.setRotation(-0.25); // 收腿
        P.torso.setRotation(0.05);
        P.head.setRotation(0.04);
        P.armL.setRotation(-0.45); // 臂上揚
        P.armR.setRotation(-0.6);
        break;
      }
      case "fall": {
        P.legL.setRotation(-0.2);
        P.legR.setRotation(0.3);
        P.torso.setRotation(-0.03);
        P.head.setRotation(-0.05);
        P.armL.setRotation(-0.7); // 臂高舉緩衝
        P.armR.setRotation(-0.55);
        break;
      }
      case "wall_slide": {
        P.torso.setRotation(-0.12); // 背貼牆
        P.legL.setRotation(0.4);
        P.legR.setRotation(0.3); // 屈膝抵牆
        P.head.setRotation(0.06);
        P.armL.setRotation(-0.5); // 手扶牆
        P.armR.setRotation(-0.3);
        break;
      }
      case "land": {
        P.torso.setScale(1.06, 0.88); // 落地擠壓（squash）
        P.legL.setRotation(0.18);
        P.legR.setRotation(-0.18);
        P.armL.setRotation(0.25); // 臂外張平衡
        P.armR.setRotation(-0.25);
        this.root.y = footY + LAND_SINK_PX;
        break;
      }
      case "idle":
      default: {
        const b = Math.sin(this.t * Math.PI * 2 * BREATH_HZ);
        P.torso.setScale(1 + b * 0.006, 1 + b * 0.015); // 呼吸
        P.head.setRotation(Math.sin(this.t * Math.PI * 2 * BREATH_HZ - 0.9) * 0.022); // 髮/頭延遲微擺
        P.armL.setRotation(Math.sin(this.t * Math.PI * 2 * BREATH_HZ - 0.5) * 0.02); // 臂隨呼吸微晃
        P.armR.setRotation(Math.sin(this.t * Math.PI * 2 * BREATH_HZ - 0.7) * 0.02);
        this.root.y = footY - Math.max(0, b) * IDLE_BOB_PX;
        break;
      }
    }
  }

  setVisible(v: boolean): void {
    this.root.setVisible(v);
  }

  destroy(): void {
    this.root.destroy();
  }
}
