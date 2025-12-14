
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useWallet } from "@/contexts/WalletContext";
import { getContract } from "@/contracts/contract";
import { ethers } from "ethers";

// Tipos
type UserStatus = "Pending" | "Approved" | "Rejected" | "Canceled";

type UserInfoResult = {
    id: bigint;
    userAddress: string;
    role: string;
    status: number; // Enum numérico
};

export function useSupplyChain() {
    // Estados derivados del contrato
    const [isRegistered, setIsRegistered] = useState<boolean | null>(null);
    const [role, setRole] = useState<string | null>(null);
    const [status, setStatus] = useState<UserStatus | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // Contexto de la wallet
    const { account, signer, isConnected } = useWallet();

    // Instancia del contrato (memoizada)
    const contract = useMemo(() => {
        return signer ? getContract(signer) : null;
    }, [signer]);

    // Función para obtener datos del usuario
    const fetchUserData = useCallback(async () => {
        if (!account || !isConnected || !contract) {
            setIsRegistered(null);
            setRole(null);
            setStatus(null);
            return;
        }

        setLoading(true);
        setError(null);

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
                const statusText = ["Pending", "Approved", "Rejected", "Canceled"][userInfo.status];
                setStatus(statusText as UserStatus);
            }
        } catch (err: any) {
            console.error("Error al obtener datos del usuario:", err);
            setError("No se pudo obtener la información del usuario.");
            setIsRegistered(false);
            setRole(null);
            setStatus(null);
        } finally {
            setLoading(false);
        }
    }, [account, isConnected, contract]);

    // Ejecutar cuando cambie la cuenta o conexión
    useEffect(() => {
        fetchUserData();
    }, [fetchUserData]);

    // Función para solicitar rol
    async function requestUserRole(roleToRequest: string) {
        if (!signer || !contract) {
            alert("Conecta tu wallet primero.");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const tx = await contract.requestUserRole(roleToRequest);
            alert(`Transacción enviada: ${tx.hash}. Esperando confirmación...`);
            await tx.wait();
            await fetchUserData();
            alert(`Solicitud confirmada para el rol: ${roleToRequest}`);
        } catch (err: any) {
            console.error("Error al solicitar rol:", err);
            setError("Hubo un problema al enviar la solicitud.");
        } finally {
            setLoading(false);
        }
    }

    // Función para cambiar estado de usuario (solo admin)
    async function changeUserStatus(userAddress: string, newStatus: number) {
        if (!signer || !contract) {
            alert("Conecta tu wallet primero.");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const tx = await contract.changeStatusUser(userAddress, newStatus);
            alert(`Transacción enviada: ${tx.hash}. Esperando confirmación...`);
            await tx.wait();
            alert("Estado actualizado correctamente");
        } catch (err: any) {
            console.error("Error al cambiar estado:", err);
            setError("Hubo un problema al actualizar el estado.");
        } finally {
            setLoading(false);
        }
    }


    async function createToken(name: string, totalSupply: number, features: string, parentId = 0) {
        if (!signer || !contract) {
            alert("Conecta tu wallet primero.");
            return;
        }
        setLoading(true);
        try {
            const tx = await contract.createToken(name, totalSupply, features, parentId);
            await tx.wait();
        } catch (error) {
            console.error("Error al crear token:", error);
            throw error;
        } finally {
            setLoading(false);
        }
    }



    return {
        isRegistered,
        role,
        status,
        loading,
        error,
        requestUserRole,
        changeUserStatus,
        createToken
    };
}
