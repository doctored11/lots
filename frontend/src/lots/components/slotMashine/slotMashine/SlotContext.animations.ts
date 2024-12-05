import styles from "../../changeMashine/changeMashine.module.css";
import { useSlotContext } from "./SlotContext";
import { SlotContextType, PendingStateType } from "./SlotContext.types";
export const startAnimation = () => {
  const { setIsAnimating } = useSlotContext()
  setIsAnimating(true);
  const shadowView = document.getElementById("shadow");
  const mashineView = document.getElementById("mashine");

  shadowView?.classList.add(styles.shadow);

  if (mashineView) {
    mashineView.style.opacity = "1";
    setTimeout(() => {
      mashineView.classList.add(styles.mashineHide);
      shadowView?.classList.add(styles.shadowGrow);
    }, 100);
  }
};

export const startExplosionAnimation = (
 
) => {
  const { setIsAnimating } = useSlotContext(); 
  const timing = 300; //todo вынести все тайминг константы в файли ли объект
  setIsAnimating(true);
  const explosion = document.getElementById("explosion");
  const mashineView = document.getElementById("mashine");

  if (mashineView && explosion) {
    explosion.style.display = "block";
    explosion.classList.add(styles.explosion);
    // mashineView.classList.add(styles.mashineHide);
    setTimeout(() => {
      mashineView.style.opacity = "0";
    }, timing / 2);

    setTimeout(() => {
      explosion.style.display = "none";
      explosion.classList.remove(styles.explosion);
    }, timing);
  }
};

export const endAnimation = (

  applyPendingState: () => void
) => {
  const { setIsAnimating } = useSlotContext();
  const shadowView = document.getElementById("shadow");
  const mashineView = document.getElementById("mashine");

  if (!mashineView) return;
  mashineView?.classList.remove(styles.mashineHide);
  shadowView?.classList.remove(styles.shadowGrow);
  mashineView.style.opacity = "1";

  applyPendingState();

  mashineView?.classList.add(styles.mashineShow);
  shadowView?.classList.add(styles.shadowAppearance);

  setTimeout(() => {
    mashineView?.classList.remove(styles.mashineShow);
    shadowView?.classList.remove(styles.shadowAppearance);
    setIsAnimating(false);
  }, 1300);
};
