export const getGiftStatus = async () => {
    try {
        const response = await fetch('/api/gifts/status', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });
        const data = await response.json();
        return data;
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const collectGift = async () => {
    try {
        const response = await fetch('/api/gifts/collect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        });
        const data = await response.json();
        return data;
    } catch (error) {
        return { success: false, error: error.message };
    }
};
