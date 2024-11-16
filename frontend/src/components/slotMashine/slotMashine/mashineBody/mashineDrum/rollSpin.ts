import { delay } from "../../../../../tools/tools";

export function rollSpin(
  tape: HTMLDivElement,
  itemHeight: number,
  initialSpeed: number,
  spins: number,
  targetEl: number
): Promise<void> {
  return new Promise(async (resolve) => {
    if (spins < 3) spins = 3;
    initialSpeed = Math.max(initialSpeed, spins * 2);

    await delay(400);

    Array.from(tape.children).forEach((el, index) => {
      if (!(el instanceof HTMLElement)) return;
      el.style.position = "absolute";
      if (!el.style.top || el.style.top === "auto") {
        el.style.top = `${index * itemHeight}px`;
      }
    });

    const minSpeed = 0.8;
    const maxDeceleration = initialSpeed / (spins * 10);
    let deceleration = 0.001 * maxDeceleration;
    let speed = initialSpeed;
    let currentSpin = 0;
    let allElementsInPlace = true;
    let elGetRound = 0;

    function animate() {
      Array.from(tape.children).forEach((el, index) => {
        if (!(el instanceof HTMLElement)) return;
        let currentTop = parseFloat((el as HTMLElement).style.top || "0");
        let newTop = currentTop + speed;

        if (newTop > itemHeight * 3) {
          newTop = newTop - itemHeight * tape.children.length;
          el.style.transition = "none";
          elGetRound++;
        } else {
          el.style.transition = "";
        }

        el.style.top = `${newTop}px`;

        if (
          index === targetEl &&
          currentSpin >= spins &&
          newTop > itemHeight / 2 &&
          newTop <= itemHeight
        ) {
          allElementsInPlace = false;
        }
      });

      if (elGetRound / tape.children.length >= 1) {
        elGetRound = 0;
        currentSpin++;
        // if (speed < 3 * minSpeed) {
        //   // console.log("низкая скорость",speed);
        // }
        if (currentSpin >= spins * 0.8) {
          // console.log("конец вращения",speed);
          speed *= 0.95;
          if (speed < minSpeed) speed = minSpeed;
        } else if (currentSpin >= spins * 0.4) {
          // console.log("половина вращения ",speed);
          speed *= 0.7;
          if (speed < minSpeed * 2) speed = 2 * minSpeed;
        }
      }

      if (currentSpin < spins || allElementsInPlace) {
        requestAnimationFrame(animate);
      } else {
        resolve();
      }
    }

    animate();
  });
}
