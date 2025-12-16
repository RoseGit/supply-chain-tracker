/**
 * @fileoverview Layout raíz de la aplicación (Root Layout).
 * Define la estructura HTML base, carga los estilos globales y configura la jerarquía 
 * de los Context Providers que gestionan el estado global de la aplicación.
 */

import "./globals.css";
import { WalletProvider, useWallet } from "@/contexts/WalletContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import ClientHeader from "@/components/ClientHeader";
import ClientFooter from "@/components/ClientFooter";

/**
 * Componente RootLayout.
 * * Este componente envuelve a todas las páginas de la aplicación.
 * * @param {React.ReactNode} children - Representa el contenido de la página actual 
 * que se renderizará dentro del layout (el "cuerpo" de cada página).
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      {/* Estructura de Body con Flexbox:
          - min-h-screen: Asegura que el cuerpo ocupe al menos el 100% de la altura de la pantalla.
          - flex-col: Alinea Header, Main y Footer en columna.
      */}
      <body className="min-h-screen bg-gray-100 flex flex-col">
        {/* JERARQUÍA DE PROVIDERS:
            1. WalletProvider: Provee datos de Web3 (Ethers.js) a toda la app.
            2. NotificationProvider: Permite enviar alertas desde cualquier componente.
        */}
        <WalletProvider>
          <NotificationProvider>
            {/* Componente de Navegación superior */}
            <ClientHeader /> {/* Llamamos al componente de Cliente */}

            {/* Contenedor Principal:
                - flex-1: Crece para ocupar todo el espacio disponible, empujando el Footer hacia abajo.
            */}
            <main className="flex-1">
              {children}
            </main>
            
            {/* Componente de Pie de página */}
            <ClientFooter />
          </NotificationProvider>
        </WalletProvider>
      </body>
    </html>
  );
}