/**
 * 判斷是否該顯示觸控操作：觸控裝置或小螢幕（手機／平板）。
 * 桌機大螢幕回傳 false，維持純鍵盤操作。
 */
export function isTouchLikely(): boolean {
  const hasTouch = "ontouchstart" in window || (navigator.maxTouchPoints ?? 0) > 0;
  const smallScreen = window.innerWidth < 900;
  return hasTouch || smallScreen;
}
