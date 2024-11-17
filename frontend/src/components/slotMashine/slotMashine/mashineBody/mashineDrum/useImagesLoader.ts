import { useState, useEffect } from "react";

export function useImagesLoader(reel: string[], setItemHeight: (height: number) => void) {
  useEffect(() => {
    reel.forEach((src) => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        setItemHeight(img.height);
      };
    });
  }, [reel, setItemHeight]);
}
