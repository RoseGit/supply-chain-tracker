"use client";

import { useState, useEffect, useCallback } from "react";
import { useWallet } from "@/contexts/WalletContext";
import { getContract } from "@/contracts/contract"; // Asume que getContract está aquí
import { ethers } from "ethers"; // Necesario para types

// Definición de tipos para mayor claridad
type UserStatus = "Pending" | "Approved" | "Rejected" | "Canceled";
// Definir un tipo para la tupla de userInfo (asumiendo que ethers.js 
// devuelve un objeto con propiedades nombradas si se usa el ABI legible)
type UserInfoResult = {
    id: bigint; // o number si tu ABI lo define así
    userAddress: string;
    role: string;
    status: number; // Numérico en el contrato
};

export function useSupplyChain() {
    // ESTADOS DERIVADOS DEL CONTRATO
    const [isRegistered, setIsRegistered] = useState<boolean | null>(null);
    const [role, setRole] = useState<string | null>(null);
    const [status, setStatus] = useState<UserStatus | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    
    // OBTENEMOS ESTADOS PRIMARIOS DEL CONTEXTO
    const { account, signer, isConnected } = useWallet();
    
    // Obtenemos la instancia del contrato (se actualiza cuando el signer cambia)
    // Usamos el signer para poder hacer transacciones; si no está conectado, usamos null
    const contract = getContract(signer as ethers.Signer || null); 

    // Función para obtener todos los datos del usuario
    const fetchUserData = useCallback(async () => {
        
        if (!account || !isConnected || !signer) {
            setIsRegistered(null);
            setRole(null);
            setStatus(null);
            return;
        }

        setLoading(true);
        try {
            // 1. Verificar si es admin
            const isAdmin = await contract.isAdmin(account);
           
            if (isAdmin) {
                setRole("Admin");
                setStatus("Approved");
                setIsRegistered(true);
                return;
            }

            // 2. Verificar si está registrado
            const registered = await contract.isUserRegistered(account);
            
            setIsRegistered(registered);

            if (registered) {
                const userInfo: UserInfoResult = await contract.getUserInfo(account);
                setRole(userInfo.role);
                
                // Conversión del enum
                const statusText = ["Pending", "Approved", "Rejected", "Canceled"][userInfo.status];
                setStatus(statusText as UserStatus);
            }
        } catch (error) {
            console.error("Error al obtener datos del usuario desde el contrato:", error);
            setIsRegistered(false); // Asumir no registrado o error
            setRole(null);
            setStatus(null);
        } finally {
            setLoading(false);
        }
    }, [account, isConnected, signer, contract]);


    // useEffect para re-ejecutar la consulta cuando la cuenta o la conexión cambian
    useEffect(() => {
        fetchUserData();
    }, [fetchUserData]); // Se ejecuta al cambiar la cuenta o la conexión

    
    // Función para solicitar rol (Transacción)
    async function requestUserRole(roleToRequest: string) {
        if (!signer) {
            alert("Conecta tu wallet primero.");
            return;
        }
        setLoading(true);
        try {
            // Usamos la instancia del contrato que ya tiene el signer
            
            const tx = await contract.requestUserRole(roleToRequest);
            alert(`Transacción enviada: ${tx.hash}. Esperando confirmación...`);
            await tx.wait();

            // Refrescar el estado después de la transacción
            await fetchUserData(); 
            alert(`Solicitud confirmada para el rol: ${roleToRequest}`);
        } catch (error) {
            console.error("Error al solicitar rol:", error);
            alert("Hubo un problema al enviar la solicitud.");
        } finally {
            setLoading(false);
        }
    }

    return {
        isRegistered,
        role,
        status,
        loading,
        requestUserRole,
        // Y las funciones de gestión de conexión ya no están aquí, se usan desde useWallet
        // como connectWallet, disconnectWallet
    };
}