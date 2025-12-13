"use client";

import { useWallet } from "@/contexts/WalletContext";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ethers } from "ethers";
import { getContract } from "@/contracts/contract"


export default function Home() {
  const { account, isRegistered, role, status, connectWallet } = useWallet();
  const router = useRouter();

  const [roleToRequest, setRoleToRequest] = useState<string>("Producer");
  const [loading, setLoading] = useState<boolean>(false);


  useEffect(() => {
    if (role === "Admin") {
      router.push("/dashboard");
    }
  }, [role, router]);


  async function requestRole() {
    if (!account) return;
    setLoading(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = getContract(signer);

      const tx = await contract.requestUserRole(roleToRequest);
      await tx.wait();

      alert(`Solicitud enviada para el rol: ${roleToRequest}`);
      // Aquí podrías actualizar el estado global o recargar la página
    } catch (error) {
      console.error("Error al solicitar rol:", error);
      alert("Hubo un problema al enviar la solicitud.");
    } finally {
      setLoading(false);
    }
  }

  
return (
    <div className="flex items-center justify-center h-full">
      {!account ? (
        <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md text-center">
          <h2 className="text-2xl font-semibold mb-4">¡Bienvenido!</h2>
          <p className="text-gray-600 mb-6">
            Conecta tu wallet para comenzar a interactuar con la aplicación.
          </p>
          <button
            onClick={connectWallet}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Conectar Wallet
          </button>
        </div>
      ) : isRegistered === false ? (
        <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md text-center">
          <h2 className="text-xl font-semibold mb-4">Registro de usuario</h2>
          <p className="text-gray-600 mb-4">Selecciona tu rol para registrarte:</p>
          <select
            value={roleToRequest}
            onChange={(e) => setRoleToRequest(e.target.value)}
            className="w-full border rounded px-3 py-2 mb-4"
          >
            <option value="Producer">Producer</option>
            <option value="Factory">Factory</option>
            <option value="Retailer">Retailer</option>
            <option value="Consumer">Consumer</option>
          </select>
          <button
            onClick={requestRole}
            disabled={loading}
            className={`w-full px-4 py-2 rounded text-white transition ${
              loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? "Enviando..." : "Solicitar Rol"}
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md text-center">
          <h2 className="text-xl font-semibold mb-4">Estado de tu cuenta</h2>
          <p className="text-gray-600 mb-4">Rol: {role}</p>
          <p className="text-gray-600 mb-4">Estado: {status}</p>
          {status === "Pending" && (
            <p className="text-yellow-600 font-semibold">
              Tu solicitud está pendiente de aprobación por el administrador.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
