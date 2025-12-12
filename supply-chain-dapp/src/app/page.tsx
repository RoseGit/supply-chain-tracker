
"use client";

import { useState } from "react";
import { ethers } from "ethers";

export default function Home() {
  const [account, setAccount] = useState<string | null>(null);

  async function connectWallet() {
    if (typeof window.ethereum !== "undefined") {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      setAccount(accounts[0]);
    } else {
      alert("MetaMask no está instalado");
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-blue-600 text-white px-6 py-4 flex justify-between items-center shadow-md">
        <h1 className="text-xl font-bold">Supply Chain DApp</h1>
        {account ? (
          <div className="bg-blue-500 px-3 py-1 rounded text-sm">
            Conectado: {account.slice(0, 6)}...{account.slice(-4)}
          </div>
        ) : (
          <span className="text-sm">No conectado</span>
        )}
      </header>

      {/* Contenido principal */}
      <main className="flex flex-1 items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md text-center">
          <h2 className="text-2xl font-semibold mb-4">¡Bienvenido!</h2>
          <p className="text-gray-600 mb-6">
            Conecta tu wallet para comenzar a interactuar con la aplicación.
          </p>
          <button
            onClick={connectWallet}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            {account ? "Wallet Conectada" : "Conectar Wallet"}
          </button>
        </div>
      </main>
    </div>
  );
}
