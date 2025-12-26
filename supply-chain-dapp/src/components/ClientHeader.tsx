/**
 * @fileoverview Componente de encabezado (Header) principal para la interfaz de cliente.
 * Gestiona la navegación, muestra información de la wallet conectada, 
 * el rol del usuario en el Smart Contract y el cierre de sesión.
 */

"use client";

import { useWallet } from "@/contexts/WalletContext";
import { useRouter, usePathname } from "next/navigation";
import { useSupplyChain } from "@/hooks/useSupplychain";

/**
 * Componente funcional ClientHeader.
 * * Renderiza una barra de navegación superior que se adapta según:
 * 1. El estado de conexión de la wallet.
 * 2. El rol del usuario (Admin o Usuario común).
 * 3. La ruta actual (para mostrar/ocultar el botón de Dashboard).
 * * @returns {JSX.Element} El encabezado renderizado con Tailwind CSS.
 */
export default function ClientHeader() {
  /** @dev Datos globales de la conexión Web3 */
  // deben conincidir con los declarados en la interface, de lo contrario renombrar la variable de esta forma 
  // const { account: miCuenta } = useWallet(); ahora podemos usar miCuenta
  const { account, disconnectWallet } = useWallet();

  /** @dev Hook personalizado para interactuar con la lógica del negocio (Smart Contract) */
  const { role } = useSupplyChain();

  /** @dev Hooks de Next.js para navegación y detección de rutas, lo hace en automatico por el nombrado de carpetas, etc. */
  const router = useRouter();
  const pathname = usePathname(); // ✅ Detecta la ruta actual

  /**
   * Gestiona la desconexión de la wallet y limpia la sesión del usuario.
   * Redirige al usuario a la página raíz.
   */
  function handleDisconnect() {
    disconnectWallet();
    router.push("/"); // Redirige a la página de inicio
  }

  //las llaves entre el html retornado es similar a los scriptles de jsp, solo que estos se ejecutan en el cliente
  return (
    <header className="bg-blue-600 text-white px-6 py-4 flex justify-between items-center shadow-md">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold">Supply Chain DApp</h1>
        {/* ✅ Botón solo visible si NO estamos en /dashboard */}
        {
          pathname !== "/dashboard" && pathname !== "/" && (
            <button
              onClick={() => router.push("/dashboard")}
              className="flex items-center gap-2 px-3 py-1 bg-blue-500 rounded hover:bg-blue-700 transition text-sm"
            >
              <span className="text-lg">←</span>
              <span>Dashboard</span>
            </button>
          )
        }
      </div>

      {account ? (
        <div className="flex items-center gap-4">
          <span>{role ? `Rol: ${role}` : "Cargando rol..."}</span>
          <span className="bg-blue-500 px-3 py-1 rounded text-sm">
            {account.slice(0, 6)}...{account.slice(-4)}
          </span>

          {/* Botón para Admin */}
          {role === "Admin" && (
            <button
              onClick={() => router.push("/admin")}
              className="px-3 py-1 bg-green-500 rounded hover:bg-green-600 transition text-sm"
            >
              Administración de usuarios
            </button>
          )}

          {/* Botón desconectar */}
          <button
            onClick={handleDisconnect}
            className="px-3 py-1 bg-red-500 rounded hover:bg-red-600 transition text-sm"
          >
            Desconectar
          </button>
        </div>
      ) : (
        <span className="text-sm">No conectado</span>
      )}
    </header>
  );
}
