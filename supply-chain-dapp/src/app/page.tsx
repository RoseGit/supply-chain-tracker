"use client";

import { useWallet } from "@/contexts/WalletContext";
import { useSupplyChain } from "@/hooks/useSupplychain";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

function RoleRequestForm({ loading, requestUserRole }: { loading: boolean; requestUserRole: (role: string) => Promise<void> }) {

  const [roleToRequest, setRoleToRequest] = useState<string>('');

  // Opcional: Definir los roles disponibles
  const availableRoles = ["Producer", "Factory", "Retailer", "Consumer"];

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


export default function Home() {
  // Consumimos la conexión (useWallet) y los datos del contrato (useSupplyChain)
  const { account, connectWallet } = useWallet();
  const { isRegistered, role, status, loading: supplyChainLoading, requestUserRole } = useSupplyChain();
  const router = useRouter();

  // Redirección del Admin
  useEffect(() => {
    if (role === "Admin") {
      router.push("/dashboard");
    }
  }, [role, router]);

  const isLoading = !account && !isRegistered; // Carga inicial

  // Contenido dinámico del Home

  return (
    <div className="flex items-center justify-center h-full">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md text-center">
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

        {account && !isRegistered && !supplyChainLoading && (
          <p className="text-gray-500">Verificando estado de registro...</p>
        )}

        {account && isRegistered === false && (
          <RoleRequestForm
            loading={supplyChainLoading}
            requestUserRole={requestUserRole}
          />
        )}

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
