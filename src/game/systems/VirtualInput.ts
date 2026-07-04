/**
 * VirtualInput：觸控按鈕寫入、控制器讀取的虛擬輸入狀態。
 * 與鍵盤輸入合併使用，桌機不觸控時全為 false，不影響鍵盤操作。
 */
export class VirtualInput {
  left = false;
  right = false;
  jump = false;
  dash = false;

  /** 互動為一次性觸發（點一下 = 一次 E），由 consumeInteract 取用後清除 */
  private interactFlag = false;

  /** 觸控互動按鈕按下時呼叫 */
  pressInteract(): void {
    this.interactFlag = true;
  }

  /** 取用並清除互動旗標（回傳這一幀是否有互動） */
  consumeInteract(): boolean {
    const pressed = this.interactFlag;
    this.interactFlag = false;
    return pressed;
  }
}
