/**
 * @fileoverview Contexto de Autenticación y Conexión Web3.
 * Este módulo gestiona el estado global de la billetera del usuario (MetaMask),
 * manejando conexiones, cambios de red y persistencia de sesión.
 */

"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { ethers, Signer, BrowserProvider } from "ethers";

/** @type {Signer | null} Instancia del firmante para transacciones */
type EthersSigner = Signer | null;

/** @type {BrowserProvider | null} Instancia del proveedor de conexión con el navegador */
type EthersProvider = ethers.BrowserProvider | null;

/**
 * Interfaz que define los valores expuestos por el WalletContext.
 */
interface WalletContextProps {
    /** Dirección hexadecimal de la cuenta conectada */
    account: string | null;
    /** Signer de ethers para firmar mensajes y transacciones */
    signer: EthersSigner;
    /** Provider de ethers para consultas de lectura en la blockchain */
    provider: EthersProvider;
    /** Función asíncrona para solicitar conexión a MetaMask y validar red */
    connectWallet: () => Promise<void>;
    /** Función para limpiar el estado y desconectar la vista de la wallet */
    disconnectWallet: () => void;
    /** Estado booleano derivado que indica si hay una conexión activa y válida */
    isConnected: boolean;
}

/**Sirve para crear un "contenedor" de datos que puede ser accedido por cualquier componente sin necesidad de pasar variables manualmente de padre a hijo */
const WalletContext = createContext<WalletContextProps | undefined>(undefined);

/**
 * Proveedor del contexto de Wallet.
 * Envuelve la aplicación para permitir el acceso al estado de Web3 en cualquier componente.
 * * @param {React.ReactNode} children - Componentes hijos que tendrán acceso al contexto.
 */
// Esto es lo que usamos en layout.tsx y todos los hijos pueden usarlo, (conectarse ametamask)
export const WalletProvider = ({ children }: { children: React.ReactNode }) => {
    const [account, setAccount] = useState<string | null>(null);
    const [signer, setSigner] = useState<EthersSigner>(null);
    const [provider, setProvider] = useState<EthersProvider>(null);

    /**
   * Intenta conectar la billetera del usuario.
   * Verifica la presencia de MetaMask, solicita el cambio a la red Anvil (31337)
   * y actualiza los estados de provider, account y signer.
   * * @throws Mostrará un alert si MetaMask no está instalado o un error en consola si falla la red.
   */
    async function connectWallet() {
        if (typeof window.ethereum === "undefined") {
            alert("MetaMask no está instalado");
            return;
        }

        try {
            // Inicializamos el Provider localmente
            let activeProvider = new ethers.BrowserProvider(window.ethereum);

            // 1. Verificar y solicitar cambio de red, 
            // problema con Metamask parecia no reconocer la red anvil aun cuando estaba bien configurada
            // por eso se realiza una conexion forzada con este codigo
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

            // Solicitamos cuentas y establecemos la conexión
            const accounts = await window.ethereum.request({ method: "eth_requestAccounts" }) as string[];
            const userAccount = accounts[0];
            setAccount(userAccount);

            // Obtenemos el Signer y lo guardamos
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

    /**
    * Resetea el estado de la conexión localmente.
    */
    async function disconnectWallet() {
        setAccount(null);
        setSigner(null);
        setProvider(null);
    }

    /**
    * Efecto inicial para verificar si el usuario ya tenía una cuenta conectada
    * al cargar la aplicación (persistencia de sesión).
    */
    useEffect(() => {
        async function checkConnection() {
            if (typeof window.ethereum !== "undefined") {
                const accounts = await window.ethereum.request({ method: "eth_accounts" });
                if (accounts.length > 0) {
                    const activeProvider = new ethers.BrowserProvider(window.ethereum);
                    setProvider(activeProvider);
                    setAccount(accounts[0]);
                    const finalSigner = await activeProvider.getSigner();
                    setSigner(finalSigner);
                }
            }
        }
        checkConnection();
    }, []);

    /* Pendiente validar los cambios de red cuando se selecciona desde el metamask
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

/**
 * Hook personalizado para acceder al WalletContext.
 * @returns {WalletContextProps} Objeto con el estado y funciones de la wallet.
 * @throws {Error} Si se usa fuera de un `WalletProvider`.
 * * @example
 * const { account, connectWallet, isConnected } = useWallet();
 */
export const useWallet = () => {
    const context = useContext(WalletContext);
    if (!context) {
        throw new Error("useWallet debe usarse dentro de WalletProvider");
    }
    return context;
};
