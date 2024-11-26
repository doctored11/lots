import React, { useContext, useEffect, useRef, useState } from "react";
export function useGameAPI() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getPlayerInfo = async (chatId) => {
    const response = await fetch(`/api/user/${chatId}`);
    return response.json();
  };

  const initializePlayer = async (chatId, username) => {
    try {
      const response = await fetch('/api/user/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId, username:   username ||  `User${chatId}` }), 
      });
  
      return response.json(); 
    } catch (error) {
      console.error('Ошибка при инициализации пользователя:', error);
      return { success: false, error: error.message };
    }
  };
  
  

  const request = async (endpoint, method, body = null) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${process.env.REACT_APP_TARGET_ADDRESS}${endpoint}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : null,
      });
      if (!response.ok) throw new Error(`Ошибка: ${response.statusText}`);
      return await response.json();
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  
  const spinSlots = async (chatId, bet, balance) => {
    console.log('⚙️ Данные для спина автомата:', { chatId, balance, machineCost });
    const body = { chatId, bet, balance };
    return await request('/api/slots/spin', 'POST', body);
  };


  const getSlotInfo = async (chatId) => {
    const response = await fetch(`/api/slots/${chatId}`);
    return response.json();
  };

  const changeMachine = async (chatId, balance, machineCost = 50) => {
    console.log('⚙️ Данные для смены автомата:', { chatId, balance, machineCost });

    const body =  { chatId, balance, machineCost };
    return await request('/api/slots/change-machine', 'POST', body);
};


  return {
    getPlayerInfo,
    initializePlayer,
    getSlotInfo,
    spinSlots,
    changeMachine,
    loading,
    error,
  };
}
