/**
 * @fileoverview Página de transferencia de activos (Tokens).
 * Permite a un usuario enviar una cantidad específica de un token a otro
 * usuario registrado y aprobado dentro del sistema de Supply Chain.
 */

"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useWallet } from "@/contexts/WalletContext";
import { getContract } from "@/contracts/contract";
import { useNotification } from "@/contexts/NotificationContext";

/**
 * Componente TransferPage.
 * * Flujo principal:
 * 1. Recupera el `tokenId` desde la URL.
 * 2. Obtiene la lista de todos los usuarios con estado 'Approved' desde el contrato.
 * 3. Gestiona el formulario de envío (Destinatario y Cantidad).
 * 4. Ejecuta la transacción de transferencia y notifica el resultado.
 */
export default function TransferPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  /** @dev ID del token a transferir, obtenido de los parámetros de búsqueda (?tokenId=X) */
  const tokenId = searchParams.get("tokenId");
  const { account, signer } = useWallet();
  const { setMessage } = useNotification();

  // --- ESTADOS LOCALES ---
  const [users, setUsers] = useState<{ address: string; role: string }[]>([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [amount, setAmount] = useState<number | "">("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** @dev Bandera para evitar múltiples peticiones a la blockchain en el mismo ciclo de vida */
  const [hasFetched, setHasFetched] = useState(false);

  /**
   * Instancia memoizada del contrato con el firmante (signer) actual.
   */
  const contract = useMemo(() => {
    return signer ? getContract(signer) : null;
  }, [signer]);

  /**
   * EFECTO: Carga de usuarios aprobados.
   * Itera sobre el mapeo de usuarios del contrato para filtrar aquellos que 
   * están aprobados (status === 1) y no son el usuario actual.
   */
  useEffect(() => {
    if (!contract || hasFetched) return;

    const fetchApprovedUsers = async () => {
      try {
        // Obtiene el contador total de usuarios registrados
        const totalUsers = await contract.nextUserId();
        console.log('numero total de usuario', totalUsers);

        const approvedUsers: { address: string; role: string }[] = [];

        // Bucle para consultar cada usuario (Iteración sobre Mapping de Solidity)
        for (let i = 1; i < Number(totalUsers); i++) {
          const user = await contract.users(i);
          console.log('usuario', user.userAddress);
          console.log('status', Number(user.status));
          console.log('role', user.role);
          console.log(' ');

          // Filtro: Solo usuarios con status 1 (Approved) y diferentes al emisor
          if (Number(user.status) === 1 && user.userAddress !== account) {
            console.log('Agregando usuario', user.userAddress);
            approvedUsers.push({ address: user.userAddress, role: user.role });
          }
        }
        setUsers(approvedUsers);
        setHasFetched(true); // ✅ Evita recargar
      } catch (err) {
        console.error(err);
        setError("Error al cargar usuarios.");
      }
    };

    fetchApprovedUsers();
  }, [contract, hasFetched]);


  /**
  * Ejecuta la lógica de transferencia en el Smart Contract.
  * Maneja el envío, la espera de confirmación y la gestión de errores específicos de Ethers.
  */
  async function handleTransfer() {
    if (!selectedUser || !amount || !tokenId) {
      setError("Completa todos los campos.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Llamada al método transfer(address to, uint256 tokenId, uint256 amount)
      const tx = await contract.transfer(selectedUser, Number(tokenId), Number(amount));
      await tx.wait();// Espera la confirmación del bloque

      setMessage(`✅ Transferencia enviada correctamente al usuario ${selectedUser.slice(0, 6)}...${selectedUser.slice(-4)} por ${amount} unidades.`);
      router.push("/dashboard");
    } catch (err) {
      console.error(err);

      // Si existe la propiedad reason, la usamos por el require del smartcontract
      const reason = err.reason || "Error desconocido";
      setError(reason);
      setMessage(`❌ ${reason}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-8 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-lg">
        <h1 className="text-2xl font-bold text-blue-700 mb-6 text-center">
          Transferir Activo
        </h1>

        {/* Mensajes de error locales */}
        {error && <p className="text-red-500 mb-4">{error}</p>}

        {/* Selector de Destinatario */}
        <div className="space-y-4">
          <div>
            <label className="block text-gray-700 font-medium mb-2">Selecciona destinatario</label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Selecciona usuario --</option>
              {users.map((u, idx) => (
                <option key={idx} value={u.address}>
                  {u.role} - {u.address.slice(0, 6)}...{u.address.slice(-4)}
                </option>
              ))}
            </select>
          </div>

          {/* Campo de Cantidad */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">Cantidad a transferir</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              placeholder="Ej. 10"
            />
          </div>
        </div>

        {/* Acciones */}
        <div className="flex justify-between mt-6">
          <button
            onClick={() => router.push("/dashboard")}
            className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleTransfer}
            disabled={loading}
            className={`px-4 py-2 rounded text-white transition ${loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"}`}
          >
            {loading ? "Enviando..." : "Send Transfer Request"}
          </button>
        </div>
      </div>
    </div>
  );
}
