import type { InteractableType } from "../types/LevelTypes";

/** 互動物件類型的顯示中繼資料（placeholder 色與說明） */
export interface InteractableMeta {
  label: string;
  color: number;
}

export const INTERACTABLE_META: Record<InteractableType, InteractableMeta> = {
  key: { label: "Key", color: 0xffd34e },
  locked_door: { label: "Locked Door", color: 0x9a6b2f },
  switch: { label: "Switch", color: 0x4ec3ff },
  switch_door: { label: "Switch Door", color: 0x2f6b9a },
  checkpoint: { label: "Checkpoint", color: 0x7dffa8 },
  ability_pickup: { label: "Ability", color: 0xc98cff },
  goal: { label: "Goal", color: 0x7dffa8 },
};
