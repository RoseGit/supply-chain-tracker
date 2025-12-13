"use client";

import React, { createContext, useContext, useState } from "react";
import { ethers, Signer, Provider } from "ethers";

// Definir los tipos de Ethers para el Contexto
type EthersSigner = Signer | null;
type EthersProvider = Provider | null;

interface WalletContextProps {
    account: string | null;
    signer: EthersSigner;
    provider: EthersProvider;
    connectWallet: () => Promise<void>;
    disconnectWallet:() => void;
    isConnected: boolean; // Nuevo estado derivado
}

const WalletContext = createContext<WalletContextProps | undefined>(undefined);

export const WalletProvider = ({ children }: { children: React.ReactNode }) => {
    const [account, setAccount] = useState<string | null>(null);
    const [isRegistered, setIsRegistered] = useState<boolean | null>(null);
    const [role, setRole] = useState<string | null>(null);
    const [status, setStatus] = useState<string | null>(null);

    async function connectWallet() {
        if (typeof window.ethereum === "undefined") {
            alert("MetaMask no está instalado");
            return;
        }

        const provider = new ethers.BrowserProvider(window.ethereum);

        // 1. Opcional: Verificar que MetaMask está en la red correcta
        let chainId = (await provider.getNetwork()).chainId;
        console.log('El chain Id es el siguiente: ' + chainId);
        // El ChainID de Anvil es 31337n (BigInt en Ethers v6)
        if (chainId !== 31337n) {
            // **Lógica para CAMBIAR DE RED a Anvil (Chain ID: 31337)**
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0x7a69' }], // 0x7a69 es 31337 en formato hexadecimal
            });

            // Volvemos a obtener el Provider después del cambio
            const newProvider = new ethers.BrowserProvider(window.ethereum);
            chainId = (await newProvider.getNetwork()).chainId;
            console.log('El chain Id es el siguiente 2: ' + chainId);
            // Si aún no es 31337, abortamos
            if (chainId !== 31337n) {
                alert("⚠️ No se pudo cambiar a la red Anvil (31337). Por favor, hazlo manualmente en MetaMask.");
                return;
            }
        }

        // Solicitamos cuentas y establecemos la conexión
        const accounts = await provider.send("eth_requestAccounts", []);
        const userAccount = accounts[0];
        setAccount(userAccount);

        const signer = await provider.getSigner();
        const contract = getContract(signer);
        try {
            const isAdmin = await contract.isAdmin(userAccount);
            if (isAdmin) {
                setRole("Admin");
                setIsRegistered(true);
                setStatus("Approved");
                return; // Detener el resto del proceso si es Admin
            }

            // 3. Verificamos el registro
            const registered = await contract.isUserRegistered(userAccount);
            console.log('la cuenta ', userAccount);
            console.log('se encuentra registrada ', registered);
            setIsRegistered(registered);

            if (registered) {
                const userInfo = await contract.getUserInfo(userAccount);
                setRole(userInfo.role);

                // Convertir enum numérico a texto
                const statusText = ["Pending", "Approved", "Rejected", "Canceled"][userInfo.status];
                console.log('E; estatus es ', statusText);
                setStatus(statusText);
            }
        } catch (error) {
            console.error("Error en la conexión o consulta:", error);
            alert("No se pudo conectar o verificar el registro. Revisa la consola.");
        }
    }

     async function disconnectWallet() {
        setAccount(null);
        setIsRegistered(null);
        setRole(null);
        setStatus(null);
    }

    return (
        <WalletContext.Provider value={{ account, isRegistered, role, status, connectWallet, disconnectWallet }}>
            {children}
        </WalletContext.Provider>
    );
};

export const useWallet = () => {
    const context = useContext(WalletContext);
    if (!context) {
        throw new Error("useWallet debe usarse dentro de WalletProvider");
    }
    return context;
};
