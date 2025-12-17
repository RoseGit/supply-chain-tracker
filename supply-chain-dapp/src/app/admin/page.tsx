/**
 * @fileoverview Panel de Administración de Usuarios.
 * Esta página permite a los usuarios con rol "Admin" gestionar el acceso de nuevos
 * integrantes a la plataforma, permitiendo aprobar, rechazar o revertir estados de registro.
 */

"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useWallet } from "@/contexts/WalletContext";
import { getContract } from "@/contracts/contract";
import { ethers } from "ethers";

/**
 * Componente AdminPage.
 * Implementa un flujo de seguridad donde primero se verifica el privilegio administrativo
 * antes de realizar cualquier consulta pesada a la Blockchain.
 */
export default function AdminPage() {
  const { account, signer, isConnected } = useWallet();

  // --- ESTADOS DE GESTIÓN ---
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ Memoizamos la instancia del contrato para evitar recreación en cada render
  const contract = useMemo(() => {
    return signer ? getContract(signer as ethers.Signer) : null;
  }, [signer]);

  /**
   * @callback fetchUsers
   * Recupera la lista completa de usuarios desde la Blockchain.
   * Itera sobre el mapping de usuarios utilizando el contador global `nextUserId`.
   */
  const fetchUsers = useCallback(async () => {
    if (!contract) return;
    setLoading(true);
    setError(null);
    try {
      // Obtiene el límite superior de la iteración
      const totalUsers = await contract.nextUserId();
      const userList = [];

      // Itera desde el ID 1 hasta el total (los mappings suelen ser 1-based en este contrato)
      for (let i = 1; i < Number(totalUsers); i++) {
        const user = await contract.users(i);
        userList.push({
          id: Number(user.id),
          userAddress: user.userAddress,
          role: user.role,
          status: ["Pending", "Approved", "Rejected", "Canceled"][user.status],
        });
      }
      setUsers(userList);
    } catch (err) {
      console.error(err);
      setError("Error al obtener usuarios.");
    } finally {
      setLoading(false);
    }
  }, [contract]);

  /**
   * EFECTO: Validación de Identidad.
   * Verifica si la cuenta conectada tiene permisos de Administrador.
   * Si es exitoso, dispara la carga de usuarios.
   */
  useEffect(() => {
    async function checkAdmin() {
      if (account && isConnected && contract) {
        const adminStatus = await contract.isAdmin(account);
        setIsAdmin(adminStatus);
        if (adminStatus) {
          await fetchUsers();
        }
      }
    }
    checkAdmin();
  }, [account, isConnected, contract, fetchUsers]);

  /**
   * Cambia el estado de un usuario en la Blockchain.
   * @param address - Dirección pública del usuario a modificar.
   * @param status - Nuevo estado numérico (0: Pending, 1: Approved, 2: Rejected).
   */
  async function changeStatus(address: string, status: number) {
    if (!contract) return;
    setLoading(true);
    setError(null);
    try {
      const tx = await contract.changeStatusUser(address, status);
      await tx.wait();
      alert("Estado actualizado correctamente");
      await fetchUsers();
    } catch (err) {
      console.error(err);
      setError("Error al actualizar estado.");
    } finally {
      setLoading(false);
    }
  }

  // --- RENDERIZADO CONDICIONAL DE SEGURIDAD ---
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-screen bg-blue-50">
        <p className="text-xl font-semibold text-blue-700">
          No tienes permisos para ver esta página.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-8">
      <div className="max-w-5xl mx-auto bg-white shadow-lg rounded-xl p-6">
        <h1 className="text-3xl font-bold text-blue-700 mb-6 text-center">
          Panel de Administración de Usuarios
        </h1>

        {/* FEEDBACK DE ESTADO */}
        {loading && (
          <p className="text-blue-600 font-medium mb-4 animate-pulse">
            Cargando usuarios...
          </p>
        )}
        {error && (
          <p className="text-red-500 font-medium mb-4">{error}</p>
        )}

        <div className="overflow-x-auto">
          <table className="w-full border-collapse rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-blue-600 text-white">
                <th className="p-3 text-left">ID</th>
                <th className="p-3 text-left">Dirección</th>
                <th className="p-3 text-left">Rol</th>
                <th className="p-3 text-left">Estado</th>
                <th className="p-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, idx) => (
                <tr
                  key={idx}
                  className="border-b hover:bg-blue-50 transition duration-200"
                >
                  <td className="p-3">{u.id}</td>
                  <td className="p-3 text-sm">{u.userAddress}</td>
                  <td className="p-3">{u.role}</td>
                  <td
                    className={`p-3 font-semibold ${u.status === "Approved"
                      ? "text-green-600"
                      : u.status === "Rejected"
                        ? "text-red-600"
                        : "text-yellow-600"
                      }`}
                  >
                    {u.status}
                  </td>

                  {/* ACCIONES PARA SOLICITUDES PENDIENTES */}
                  <td className="p-3 text-center space-x-2">
                    {u.status === "Pending" && (
                      <>
                        <button
                          onClick={() => changeStatus(u.userAddress, 1)}
                          className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-lg hover:opacity-90 transition"
                        >
                          Aprobar
                        </button>
                        <button
                          onClick={() => changeStatus(u.userAddress, 2)}
                          className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-700 text-white rounded-lg hover:opacity-90 transition"
                        >
                          Rechazar
                        </button>
                      </>
                    )}

                    {/* REVERTIR ESTADO: Permite corregir errores de aprobación/rechazo */}
                    {(u.status === "Approved" || u.status === "Rejected") && (
                      <button
                        onClick={() => changeStatus(u.userAddress, 0)}
                        className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white rounded-lg hover:opacity-90 transition"
                      >
                        Set Pending
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
