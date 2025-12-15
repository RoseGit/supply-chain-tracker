"use client";

import React, { createContext, useContext, useState } from "react";

interface NotificationContextProps {
  message: string | null;
  setMessage: (msg: string | null) => void;
}

const NotificationContext = createContext<NotificationContextProps | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const [message, setMessage] = useState<string | null>(null);

  return (
    <NotificationContext.Provider value={{ message, setMessage }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotification debe usarse dentro de NotificationProvider");
  }
  return context;
};
