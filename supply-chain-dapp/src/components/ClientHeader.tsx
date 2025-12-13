"use client";

import React from 'react';
import { useWallet } from "@/contexts/WalletContext";
import { useRouter } from "next/navigation";

export default function ClientHeader() {
    const { account, role, disconnectWallet } = useWallet();
    const router = useRouter();

    function handleDisconnect() {
        disconnectWallet();
        router.push("/"); // Redirige a la página de inicio
    }



    
return (
    <header className="bg-blue-600 text-white px-6 py-4 flex justify-between items-center shadow-md">
      <h1 className="text-xl font-bold">Supply Chain DApp</h1>
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
