import React, { useState, useEffect } from 'react';

interface GiftCooldownProps {
    lastCollected: string; 
}

export function GiftCooldown(props: GiftCooldownProps) {
    const [timeLeft, setTimeLeft] = useState<number>(0);

    useEffect(() => {
        function updateCooldown() {
            const now = Date.now(); 
            const last = new Date(props.lastCollected).getTime(); 
            const cooldown = 30 * 60 * 1000; 
            const remaining = Math.max(0, cooldown - (now - last)); 
            setTimeLeft(remaining); 
        }

        updateCooldown();

        const interval = setInterval(updateCooldown, 1000); 

        return () => clearInterval(interval);
    }, [props.lastCollected]);

   
    if (timeLeft <= 0) {
        return <span>🎁можно забрать поинты!</span>;
    }

    const minutes = Math.floor(timeLeft / 60000);
    const seconds = Math.floor((timeLeft % 60000) / 1000);

    return (
        <span>
            ⏳ Следующий гифт через {minutes}:{seconds.toString().padStart(2, '0')}
        </span>
    );
}
