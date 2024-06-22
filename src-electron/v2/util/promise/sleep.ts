export function sleep(millisecond: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, millisecond);
  });
}
