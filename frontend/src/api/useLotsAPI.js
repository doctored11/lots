import React, { useContext, useEffect, useRef, useState } from "react";
export function useGameAPI() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
    const body = { chatId, bet, balance };
    return await request('/api/slots/spin', 'POST', body);
  };


  const changeMachine = async (chatId, balance, machineCost = 50) => {
    const body = { chatId, balance, machineCost };
    return await request('/api/slots/change-machine', 'POST', body);
};


  return {
    spinSlots,
    changeMachine,
    loading,
    error,
  };
}
