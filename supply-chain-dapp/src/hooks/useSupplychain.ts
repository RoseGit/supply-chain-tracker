
"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { getContract } from "@/contracts/contract";

type UserStatus = "Pending" | "Approved" | "Rejected" | "Canceled";

interface UserInfo {
  id: number;
  userAddress: string;
  role: string;
  status: UserStatus;
}

export function useSupplyChain() {
  const [account, setAccount] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [status, setStatus] = useState<UserStatus | null>(null);
  const [isRegistered, setIsRegistered] = useState<boolean | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Conectar wallet y obtener info del usuario
  async function connectWallet() {
    if (typeof window.ethereum === "undefined") {
      alert("MetaMask no está instalado");
      return;
    }

    setLoading(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      const userAccount = accounts[0];
      setAccount(userAccount);

      const signer = await provider.getSigner();
      const contract = getContract(signer);

      // Verificar si es admin
      const isAdmin = await contract.isAdmin(userAccount);
      if (isAdmin) {
        setRole("Admin");
        setStatus("Approved");
        setIsRegistered(true);
        return;
      }

      // Verificar si está registrado
      const registered = await contract.isUserRegistered(userAccount);
      setIsRegistered(registered);

      if (registered) {
        const userInfo = await contract.getUserInfo(userAccount);
        setRole(userInfo.role);
        const statusText = ["Pending", "Approved", "Rejected", "Canceled"][userInfo.status];
        setStatus(statusText as UserStatus);
      }
    } catch (error) {
      console.error("Error al conectar wallet:", error);
    } finally {
      setLoading(false);
    }
  }

  // Desconectar wallet
  function disconnectWallet() {
    setAccount(null);
    setRole(null);
    setStatus(null);
    setIsRegistered(null);
  }

  // Solicitar rol
  async function requestUserRole(roleToRequest: string) {
    if (!account) return;
    setLoading(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = getContract(signer);

      const tx = await contract.requestUserRole(roleToRequest);
      await tx.wait();

      alert(`Solicitud enviada para el rol: ${roleToRequest}`);
      setRole(roleToRequest);
      setStatus("Pending");
      setIsRegistered(true);
    } catch (error) {
      console.error("Error al solicitar rol:", error);
      alert("Hubo un problema al enviar la solicitud.");
    } finally {
      setLoading(false);
    }
  }

  // Detectar cambios en MetaMask (cuenta/red)
  useEffect(() => {
    if (typeof window.ethereum !== "undefined") {
      window.ethereum.on("accountsChanged", async (accounts: string[]) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          await connectWallet();
        } else {
          disconnectWallet();
        }
      });

      window.ethereum.on("chainChanged", () => {
        window.location.reload();
      });
    }
  }, []);

  return {
    account,
    role,
    status,
    isRegistered,
    loading,
    connectWallet,
    disconnectWallet,
    requestUserRole,
  };
}
