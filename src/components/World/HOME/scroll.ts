// ホーム画面におけるスクロール制御を外部から呼び出せるようにする

let scrollTop: () => void;

export function setScrollTop(func: () => void) {
  scrollTop = func;
}

export function moveScrollTop_Home() {
  scrollTop();
}
