import React, { useEffect, useState } from "react";
import { GiftButton } from "./components/GiftButton";
import { GiftCooldown } from "./components/GiftCooldown";
import { getGiftStatus } from "../../api/giftsApi";

export function GiftsPage() {
  const [lastCollected, setLastCollected] = useState<string>("");

  useEffect(() => {
    const fetchGiftStatus = async () => {
      const response = await getGiftStatus();
      if (response.success) {
        setLastCollected(response.lastCollected);
      }
    };

    fetchGiftStatus();
  }, []);

  return (
    <div>
      <h1>Гифт</h1>
      <GiftCooldown lastCollected={lastCollected} />
      <GiftButton />
    </div>
  );
}
