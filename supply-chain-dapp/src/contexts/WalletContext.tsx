"use client";

import React, { createContext, useContext, useState } from "react";
import { ethers, Signer, BrowserProvider } from "ethers";

// Definir los tipos de Ethers para el Contexto
type EthersSigner = Signer | null;
type EthersProvider = ethers.BrowserProvider | null;

interface WalletContextProps {
    account: string | null;
    signer: EthersSigner;
    provider: EthersProvider;
    connectWallet: () => Promise<void>;
    disconnectWallet: () => void;
    isConnected: boolean; // Nuevo estado derivado
}

const WalletContext = createContext<WalletContextProps | undefined>(undefined);

export const WalletProvider = ({ children }: { children: React.ReactNode }) => {
    const [account, setAccount] = useState<string | null>(null);
    const [signer, setSigner] = useState<EthersSigner>(null);
    const [provider, setProvider] = useState<EthersProvider>(null);

    async function connectWallet() {
        if (typeof window.ethereum === "undefined") {
            alert("MetaMask no está instalado");
            return;
        }

        try {
            // Inicializamos el Provider localmente
            let activeProvider = new ethers.BrowserProvider(window.ethereum);

            // 1. Verificar y solicitar cambio de red
            let chainId = (await activeProvider.getNetwork()).chainId;
            if (chainId !== 31337n) {

                // Solicitud de cambio de red (se espera que el usuario la acepte)
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: '0x7a69' }], // Anvil (31337)
                });

                // Después del cambio, se necesita una nueva instancia del Provider
                activeProvider = new ethers.BrowserProvider(window.ethereum);

                // Opcional: Re-verificar chainId si fuera necesario
                // let newChainId = (await activeProvider.getNetwork()).chainId;
                // if (newChainId !== 31337n) { /* manejo de error si el usuario rechaza */ }
            }

            // En este punto, 'activeProvider' es la instancia correcta (BrowserProvider) 
            // para la red Anvil, sea que cambiamos o no.
            setProvider(activeProvider); // Guardamos la instancia en el estado del Contexto

            // 2. Solicitamos cuentas y establecemos la conexión
            const accounts = await window.ethereum.request({ method: "eth_requestAccounts" }) as string[];
            const userAccount = accounts[0];
            setAccount(userAccount);

            // 3. Obtenemos el Signer y lo guardamos
            // Usamos 'activeProvider' (que es un BrowserProvider)
            const finalSigner = await activeProvider.getSigner();
            setSigner(finalSigner);

        } catch (error) {
            console.error("Error al conectar wallet o cambiar red:", error);
            setAccount(null);
            setProvider(null);
            setSigner(null);
        }
    }

    async function disconnectWallet() {
        setAccount(null);
        setSigner(null);
        setProvider(null);
    }
/*
    React.useEffect(() => {
        if (typeof window.ethereum !== "undefined") {
            const handleAccountsChanged = (accounts: string[]) => {
                if (accounts.length > 0) {
                    setAccount(accounts[0]);
                    // Se podría re-ejecutar connectWallet o solo actualizar la cuenta
                } else {
                    disconnectWallet();
                }
            };
            const handleChainChanged = () => {
                window.location.reload(); // Recargar la página es la forma más simple
            };

            window.ethereum.on("accountsChanged", handleAccountsChanged);
            window.ethereum.on("chainChanged", handleChainChanged);

            return () => {
                window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
                window.ethereum.removeListener("chainChanged", handleChainChanged);
            };
        }
    }, []);
    */

    const isConnected = !!account && !!signer;

    return (
        <WalletContext.Provider value={{
            account,
            signer,
            provider,
            connectWallet,
            disconnectWallet,
            isConnected
        }}>
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
