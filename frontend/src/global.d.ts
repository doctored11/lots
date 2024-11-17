interface TelegramWebApp {
    initData: string;
    initDataUnsafe: Record<string, any>;
    close: () => void;
    ready: () => void;
    sendData: (data: string) => void;
    expand: () => void;
    onEvent: (eventType: string, callback: () => void) => void;
    offEvent: (eventType: string, callback: () => void) => void;
    showPopup: (params: Record<string, any>) => void;
}

interface Window {
    Telegram: {
        WebApp: TelegramWebApp;
    };
}
