
"use client";

import { useEffect, useState } from "react";
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
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-3xl font-bold mb-4">Supply Chain DApp</h1>
      <button
        onClick={connectWallet}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Conectar Wallet
      </button>
      {account && <p className="mt-4">Cuenta conectada: {account}</p>}
    </main>
  );
}
