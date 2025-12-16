/**
 * @fileoverview Contexto para la gestión de notificaciones globales.
 * Permite mostrar y limpiar mensajes de feedback (éxito, error, info) 
 * desde cualquier parte de la aplicación.
 */

"use client";

import React, { createContext, useContext, useState } from "react";

/**
 * Propiedades expuestas por el contexto de notificaciones.
 */
interface NotificationContextProps {
  /** El contenido del mensaje actual. `null` si no hay ninguna notificación activa. */
  message: string | null;
  /** * Función para actualizar el mensaje. 
   * @param msg - El texto a mostrar o `null` para ocultar la notificación.
   */
  setMessage: (msg: string | null) => void;
}

/**
 * Creación del contexto con valor inicial indefinido.
 */
const NotificationContext = createContext<NotificationContextProps | undefined>(undefined);

/**
 * Proveedor de Notificaciones.
 * Debe envolver la aplicación (usualmente dentro del WalletProvider) para 
 * habilitar el sistema de alertas.
 * * @param {React.ReactNode} children - Componentes que podrán emitir o leer notificaciones.
 */
export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const [message, setMessage] = useState<string | null>(null);

  return (
    <NotificationContext.Provider value={{ message, setMessage }}>
      {children}
    </NotificationContext.Provider>
  );
};

/**
 * Hook personalizado para interactuar con el sistema de notificaciones.
 * * @returns {NotificationContextProps} El estado del mensaje y su función actualizadora.
 * @throws {Error} Si se utiliza fuera del componente `NotificationProvider`.
 * * @example
 * const { setMessage } = useNotification();
 * setMessage("¡Transacción enviada con éxito!");
 */
export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotification debe usarse dentro de NotificationProvider");
  }
  return context;
};
