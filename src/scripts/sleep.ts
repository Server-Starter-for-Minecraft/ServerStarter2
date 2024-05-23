export function sleep(millisecond: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, millisecond);
  });
}
