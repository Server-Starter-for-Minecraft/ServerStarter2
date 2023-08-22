<template>
  <div class="test">
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 123 142"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      xmlns:xlink="http://www.w3.org/1999/xlink"
      xml:space="preserve"
      xmlns:serif="http://www.serif.com/"
      style="
        fill-rule: evenodd;
        clip-rule: evenodd;
        stroke-linejoin: round;
        stroke-miterlimit: 2;
      "
    >
      <path
        class="line p1"
        d="M-0,0l24.549,14.173l-24.549,14.173l-0,-28.346Z"
      />
      <path
        class="line p2"
        d="M0,56.693l49.098,-28.347l24.548,14.174l-49.097,28.346l49.097,28.347l-73.646,42.519l-0,-28.346l24.549,-14.173l-24.549,-14.174l0,-28.346Z"
      />
      <path
        class="line p3"
        d="M98.195,56.693l-24.549,14.173l24.549,14.173l24.549,-14.173l-24.549,-14.173Z"
      />
    </svg>
  </div>
</template>
<style scoped lang="scss">
.test {
  width: 10rem;
}
.line {
  stroke-linejoin: miter;
  fill: none;
  stroke: var(--q-primary);
  stroke-width: 4.17px;
}
.p1 {
  stroke-dasharray: 595.27780998 595.27780998;
  animation: p1 6s linear infinite;
}
@keyframes p1 {
  0% {
    stroke-dashoffset: 1785.83342994;
    fill: transparent;
  }
  100% {
    stroke-dashoffset: 595.27780998;
  }
}
.p2 {
  stroke-dasharray: 595.27780998 595.27780998;
  animation: p2 6s linear infinite;
}
@keyframes p2 {
  0% {
    stroke-dashoffset: 1870.8731170800002;
    fill: transparent;
  }
  100% {
    stroke-dashoffset: 680.3174971200001;
  }
}
.p3 {
  stroke-dasharray: 595.27780998 595.27780998;
  animation: p3 6s linear infinite;
}
@keyframes p3 {
  0% {
    stroke-dashoffset: 2267.7249904;
    fill: transparent;
  }
  100% {
    stroke-dashoffset: 1077.16937044;
  }
}
</style>
