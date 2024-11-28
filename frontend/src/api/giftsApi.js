import axios from 'axios';

export const getGiftStatus = async () => {
    try {
        const response = await axios.get('/api/gifts/status');
        return response.data;
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const collectGift = async () => {
    try {
        const response = await axios.post('/api/gifts/collect');
        return response.data;
    } catch (error) {
        return { success: false, error: error.message };
    }
};
