/**
 * @fileoverview Página de inicio (Home) de la DApp Supply Chain.
 * Gestiona el flujo de entrada: conexión de wallet, registro de nuevos usuarios
 * mediante solicitud de roles y redirección automática según el estado del perfil.
 */

"use client";

import { useWallet } from "@/contexts/WalletContext";
import { useSupplyChain } from "@/hooks/useSupplychain";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

/**
 * Componente interno: Formulario de Solicitud de Rol.
 * * @param {Object} props
 * @param {boolean} props.loading - Indica si hay una transacción en curso.
 * @param {Function} props.requestUserRole - Función del hook para enviar la TX al contrato.
 */
function RoleRequestForm({ loading, requestUserRole }: { loading: boolean; requestUserRole: (role: string) => Promise<void> }) {

  /** @dev Estado local para el valor seleccionado en el dropdown */
  const [roleToRequest, setRoleToRequest] = useState<string>('');

  /** @dev Roles permitidos por la lógica del negocio del Smart Contract */
  const availableRoles = ["Producer", "Factory", "Retailer", "Consumer"];

  /**
   * Valida la selección y dispara la transacción hacia la Blockchain.
   */
  const handleSubmit = async () => {
    if (roleToRequest) {
      await requestUserRole(roleToRequest);
    } else {
      alert("Selecciona un rol.");
    }
  };


  return (
    <div className="mt-4">
      <h2 className="text-xl font-semibold mb-4">Registro de usuario</h2>
      <p className="text-gray-600 mb-4">Selecciona tu rol para registrarte:</p>
      <select
        value={roleToRequest}
        onChange={(e) => setRoleToRequest(e.target.value)}
        className="w-full p-2 border border-gray-300 rounded mb-4"
        disabled={loading}
      >
        <option value="" disabled>-- Selecciona un Rol --</option>
        {availableRoles.map(r => (
          <option key={r} value={r}>{r}</option>
        ))}
      </select>
      <button
        onClick={handleSubmit}
        disabled={!roleToRequest || loading}
        className={`w-full px-4 py-2 text-white rounded transition ${!roleToRequest || loading
          ? "bg-gray-400 cursor-not-allowed"
          : "bg-green-600 hover:bg-green-700"
          }`}
      >
        {loading ? "Procesando Transacción..." : "Solicitar Rol"}
      </button>
    </div>
  );
}

/**
 * Componente Principal: Home.
 * Implementa la lógica de redirección y estados de autenticación Web3.
 */
export default function Home() {
  /** @dev Consumimos hooks globales y locales */
  const { account, connectWallet } = useWallet();
  const { isRegistered, role, status, loading: supplyChainLoading, requestUserRole } = useSupplyChain();
  const router = useRouter();

  /**
  * EFECTO DE REDIRECCIÓN:
  * Si el usuario ya tiene un rol y está aprobado (o es Admin),
  * lo movemos automáticamente al Dashboard para mejorar la UX.
  */
  useEffect(() => {
    if (role === "Admin") {
      router.push("/dashboard");
    } else if (role && status === "Approved") {
      router.push("/dashboard");
    }
  }, [role, status, router]);

  return (
    <div className="flex items-center justify-center h-full">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md text-center">
        {/* ESTADO 1: Wallet no conectada */}
        {!account && (
          <>
            <h2 className="text-2xl font-semibold mb-4">¡Bienvenido!</h2>
            <p className="text-gray-600 mb-6">Conecta tu wallet para comenzar a interactuar con la aplicación.</p>
            <button
              onClick={connectWallet}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              Conectar Wallet
            </button>
          </>
        )}

        {/* ESTADO 2: Conectado pero verificando registro en la Blockchain */}
        {account && !isRegistered && !supplyChainLoading && (
          <p className="text-gray-500">Verificando estado de registro...</p>
        )}

        {/* ESTADO 3: Wallet conectada pero NO registrada en el contrato */}
        {account && isRegistered === false && (
          <RoleRequestForm
            loading={supplyChainLoading}
            requestUserRole={requestUserRole}
          />
        )}

        {/* ESTADO 4: Registrado pero quizás aún pendiente de aprobación */}
        {account && isRegistered && role !== "Admin" && (
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-green-700 font-semibold">✅ Usuario Registrado</p>
            <p className="text-sm text-gray-700 mt-2">Rol: <strong>{role}</strong></p>
            <p className="text-sm text-gray-700">Estado: <strong>{status}</strong></p>
          </div>
        )}
      </div>
    </div>
  );
}
