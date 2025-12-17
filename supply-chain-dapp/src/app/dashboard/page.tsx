/**
 * @fileoverview Panel de Control (Dashboard) del Usuario.
 * Proporciona acceso rápido a las funciones principales y gestiona la bandeja de entrada
 * de transferencias pendientes que requieren aprobación del usuario.
 */

"use client";


import { useEffect, useState, useMemo } from "react";
import { useWallet } from "@/contexts/WalletContext";
import { getContract } from "@/contracts/contract";
import { useNotification } from "@/contexts/NotificationContext";

/**
 * Interfaz para las transferencias que aún no han sido procesadas.
 */
interface TransferInfo {
  id: number;
  tokenName: string;
  from: string;
  amount: number;
  date: string;
}

/**
 * Componente Dashboard.
 * * Lógica principal:
 * 1. Muestra accesos directos (Cards) a otras secciones.
 * 2. Filtra la actividad de la blockchain para mostrar solo lo que el usuario debe "Aceptar" o "Rechazar".
 * 3. Ejecuta transacciones de cambio de estado de transferencia.
 */
export default function Dashboard() {
  const { account, signer } = useWallet();
  const { message, setMessage } = useNotification();

  // --- ESTADOS ---
  const [pendingTransfers, setPendingTransfers] = useState<TransferInfo[]>([]);
  const [loadingTransfers, setLoadingTransfers] = useState(false);

  /** * @memoizado contract
   * Referencia al Smart Contract para realizar consultas y transacciones.
   */
  const contract = useMemo(() => (signer ? getContract(signer) : null), [signer]);

  /**
   * EFECTO: Filtro de Bandeja de Entrada.
   * Busca en el historial del usuario aquellas transferencias donde:
   * - El estado es 0 (Pending).
   * - El destinatario (to) es la cuenta actual.
   */
  useEffect(() => {
    if (!contract || !account) return;

    const fetchTransfers = async () => {
      setLoadingTransfers(true);
      try {
        const transferIds: bigint[] = await contract.getUserTransfers(account);
        const pending: TransferInfo[] = [];

        for (const id of transferIds) {
          const transfer = await contract.getTransfer(Number(id));
          // Lógica de Filtrado: Status 0 (Pendiente) e Incoming (Para mí)
          if (Number(transfer.status) === 0 && transfer.to.toLowerCase() === account.toLowerCase()) {
            const tokenData = await contract.getToken(Number(transfer.tokenId));
            pending.push({
              id: Number(transfer.id),
              tokenName: tokenData[2],
              from: transfer.from,
              amount: Number(transfer.amount),
              date: new Date(Number(transfer.dateCreated) * 1000).toLocaleString(),
            });
          }
        }
        setPendingTransfers(pending);
      } catch (err) {
        console.error("Error al obtener transferencias:", err);
      } finally {
        setLoadingTransfers(false);
      }
    };

    fetchTransfers();
  }, [contract, account]);


  /**
   * Aprueba una transferencia entrante.
   * @param id - El identificador único de la transferencia en el contrato.
   */
  async function handleAccept(id: number) {
    try {
      const tx = await contract.acceptTransfer(id);
      await tx.wait();
      setMessage("✅ Transferencia aceptada correctamente.");
      setPendingTransfers((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error(err);
      setMessage("❌ Error al aceptar la transferencia.");
    }
  }

  /**
   * Rechaza una transferencia y devuelve/cancela el movimiento.
   * @param id - El identificador único de la transferencia.
   */
  async function handleReject(id: number) {
    try {
      const tx = await contract.rejectTransfer(id);
      await tx.wait();
      setMessage("✅ Transferencia rechazada correctamente.");
      setPendingTransfers((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error(err);
      setMessage("❌ Error al rechazar la transferencia.");
    }
  }


  /** Configuración de botones de navegación principal */
  const cards = [
    {
      title: "Crear Activos",
      description: "Genera nuevos activos en la cadena de suministro.",
      icon: "📦",
      link: "/tokens/create",
    },
    {
      title: "Mis Activos",
      description: "Consulta los activos que tienes registrados.",
      icon: "🗂️",
      link: "/tokens",
    },
    {
      title: "Historial de Transferencias",
      description: "Consulta las transferencias de tus activos.",
      icon: "🔄",
      link: "/transfers/history",
    }
  ];



  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-8">
      <div className="max-w-6xl mx-auto">

        {/* ✅ Área para mostrar notificación */}
        {message && (
          <div className="mb-4 p-4 bg-green-100 text-green-700 rounded shadow flex justify-between items-center">
            <span>{message}</span>
            <button
              onClick={() => setMessage(null)}
              className="text-green-800 text-sm underline"
            >
              Cerrar
            </button>
          </div>
        )}

        <h1 className="text-3xl font-bold text-blue-700 mb-8 text-center">Panel de Usuario</h1>

        {/* GRID DE NAVEGACIÓN: Accesos directos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {cards.map((card, idx) => (
            <div key={idx} className="bg-white rounded-xl shadow-md hover:shadow-xl transition p-6 flex flex-col items-center text-center">
              <div className="text-5xl mb-4">{card.icon}</div>
              <h2 className="text-xl font-semibold text-blue-700 mb-2">{card.title}</h2>
              <p className="text-gray-600 mb-4">{card.description}</p>
              <a href={card.link} className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-lg hover:opacity-90 transition">
                Ir
              </a>
            </div>
          ))}
        </div>

        {/* BANDEJA DE ENTRADA: Gestión de Transferencias Pendientes */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-blue-700 mb-4">Transferencias Pendientes</h2>
          {loadingTransfers && <p className="text-blue-600">Cargando transferencias...</p>}
          {pendingTransfers.length === 0 && !loadingTransfers && (
            <p className="text-gray-600">No tienes transferencias pendientes.</p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingTransfers.map((transfer) => (
              <div key={transfer.id} className="border rounded-lg p-4 shadow-sm">
                <p><strong>Token:</strong> {transfer.tokenName}</p>
                <p><strong>De:</strong> {transfer.from.slice(0, 6)}...{transfer.from.slice(-4)}</p>
                <p><strong>Cantidad:</strong> {transfer.amount}</p>
                <p><strong>Fecha:</strong> {transfer.date}</p>

                {/* ACCIONES CRÍTICAS: Aceptar o Rechazar el activo */}
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => handleAccept(transfer.id)}
                    className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition"
                  >
                    Aceptar
                  </button>
                  <button
                    onClick={() => handleReject(transfer.id)}
                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition"
                  >
                    Rechazar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
