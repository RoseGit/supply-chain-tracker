import "./globals.css";
import { WalletProvider, useWallet } from "@/contexts/WalletContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import ClientHeader from "@/components/ClientHeader";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      {/* Es importante que la clase min-h-screen esté en el body para que h-full funcione */}
      <body className="min-h-screen bg-gray-100 flex flex-col">
        <WalletProvider>
          <NotificationProvider>
            <ClientHeader /> {/* Llamamos al componente de Cliente */}
            <main className="flex-1">{children}</main>
          </NotificationProvider>
        </WalletProvider>
      </body>
    </html>
  );
}