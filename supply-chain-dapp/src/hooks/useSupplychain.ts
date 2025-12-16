/**
 * @fileoverview Hook personalizado para interactuar con la lógica del Smart Contract de Supply Chain.
 * Centraliza las consultas de usuario, gestión de roles y creación de tokens.
 */

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useWallet } from "@/contexts/WalletContext";
import { getContract } from "@/contracts/contract";

/** Representación legible del estado de un usuario en el contrato */
type UserStatus = "Pending" | "Approved" | "Rejected" | "Canceled";

/** Estructura de datos devuelta por la función `getUserInfo` del Smart Contract */
type UserInfoResult = {
    id: bigint;
    userAddress: string;
    role: string;
    status: number; // Enum numérico
};

/**
 * Hook `useSupplyChain`.
 * Proporciona el estado del usuario actual y funciones para interactuar con el contrato.
 * * @returns {Object} Un objeto con estados (loading, role, status) y métodos (requestUserRole, createToken, etc).
 */
export function useSupplyChain() {
    // Estados
    const [isRegistered, setIsRegistered] = useState<boolean | null>(null);
    const [role, setRole] = useState<string | null>(null);
    const [status, setStatus] = useState<UserStatus | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // Obtener la conexión actual desde el contexto global
    const { account, signer, isConnected } = useWallet();

    /**
     * @memoizado contract
     * Crea la instancia del contrato solo cuando el 'signer' cambia.
     * Esto evita recrear el objeto del contrato en cada renderizado de React.
     */
    const contract = useMemo(() => {
        return signer ? getContract(signer) : null;
    }, [signer]);

    /**
     * @callback fetchUserData
     * Obtiene la información del usuario desde la Blockchain.
     * 1. Verifica si el usuario es Administrador.
     * 2. Si no es admin, verifica si está registrado y obtiene su rol/estado.
     */
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
            // Verificar si es admin
            const isAdmin = await contract.isAdmin(account);
            if (isAdmin) {
                setRole("Admin");
                setStatus("Approved");
                setIsRegistered(true);
                return;
            }

            // Verificar si está registrado
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

    /**
     * Efecto secundario: Cada vez que los datos de conexión o la función de 
     * obtención cambian, se refresca la información del usuario.
     */
    useEffect(() => {
        fetchUserData();
    }, [fetchUserData]);

    /**
     * Envía una transacción para solicitar un nuevo rol en el sistema.
     * @param {string} roleToRequest - El nombre del rol solicitado (ej: "Manufacturer").
     */
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

    /**
     * Cambia el estado de un usuario (Solo ejecutable por Admin).
     * @param {string} userAddress - Dirección de la billetera del usuario.
     * @param {number} newStatus - ID del nuevo estado (0: Pending, 1: Approved, etc).
     */
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

    /**
    * Crea un nuevo activo (Token) en la cadena de suministro.
    * @param {string} name - Nombre del activo.
    * @param {number} totalSupply - Cantidad total a emitir.
    * @param {string} features - Detalles o características técnicas.
    * @param {number} parentId - ID del token padre (si es un derivado).
    */
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
