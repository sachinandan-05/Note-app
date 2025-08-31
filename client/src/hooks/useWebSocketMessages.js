import { useEffect, useCallback } from 'react';

export const useWebSocketMessages = (onMessage, deps = []) => {
  const { subscribe } = useWebSocket();

  useEffect(() => {
    if (typeof onMessage !== 'function') return () => {};
    
    const unsubscribe = subscribe((message) => {
      onMessage(message);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [subscribe, onMessage, ...deps]);

  const { sendMessage } = useWebSocket();
  
  return {
    sendMessage: useCallback((type, data) => {
      return sendMessage({ type, ...data });
    }, [sendMessage])
  };
};

export default useWebSocketMessages;
