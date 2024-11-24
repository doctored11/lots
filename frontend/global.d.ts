interface Telegram {
    WebApp: {
      initDataUnsafe: {
        user?: {
          id: number;
          first_name: string;
          last_name?: string;
          username?: string;
        };
      };
    };
  }
  
  interface Window {
    Telegram?: Telegram;
  }
  