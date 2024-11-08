import { delay } from "../../../../../tools/tools";

export 
function rollSpin(
  tape: HTMLDivElement,
  itemHeight: number,
  initialSpeed: number,
  spins: number,
  targetEl: number
): Promise<void> {
  return new Promise(async (resolve) => {
    if (spins < 3) spins = 3;
    initialSpeed = Math.min(initialSpeed, spins * 1.5);

    await delay(400)

    Array.from(tape.children).forEach((el, index) => {
      if (!(el instanceof HTMLElement)) return;
      el.style.position = "absolute";
      if (!el.style.top || el.style.top === "auto") {
        el.style.top = `${index * itemHeight}px`;
      }
    });

    const minSpeed = 0.5;
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
          newTop >itemHeight/2 &&
          newTop <= itemHeight 
        ) {
          allElementsInPlace = false;
        }
      });

      if (elGetRound / tape.children.length >= 1) {
        elGetRound = 0;
        currentSpin++;
        const deltaSpeed = speed / minSpeed;
        if (
          currentSpin >= spins * 0.5 &&
          currentSpin < spins * 0.9 &&
          deltaSpeed > 10
        ) {
          deceleration =
            deceleration +
            Math.pow(deceleration, 2) +
            (1 / currentSpin) * maxDeceleration;
        } else if (deltaSpeed < 3 && currentSpin > spins * 0.9) {
          deceleration = deceleration * 1.1;
          if (deceleration > maxDeceleration) deceleration = maxDeceleration;
        }
      }

      if (speed > minSpeed) {
        if (currentSpin >= spins * 0.5) {
          deceleration += deceleration * 0.001;
        }

        if (currentSpin >= spins * 0.5) speed -= deceleration;
        if (currentSpin >= spins) {
          if (speed < minSpeed) speed = minSpeed;
          deceleration = maxDeceleration / 100;
        } else {
          if (speed < 10 * minSpeed) {
            speed = 10 * minSpeed;
            deceleration = maxDeceleration / 10;
          }
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
