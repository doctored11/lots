import React, { useState } from 'react';
import { collectGift } from '../../../api/giftsApi';

export function GiftButton () {
    const [loading, setLoading] = useState(false);

    const handleClick = async () => {
        setLoading(true);
        const response = await collectGift();
        setLoading(false);

        if (response.success) {
            alert(`Вы получили ${response.reward} монет!`);
        } else {
            alert(response.error || 'Ошибка получения подарка');
        }
    };

    return (
        <button onClick={handleClick} disabled={loading}>
            {loading ? 'Загрузка...' : 'Получить подарок'}
        </button>
    );
};
