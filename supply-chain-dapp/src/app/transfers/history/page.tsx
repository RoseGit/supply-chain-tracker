/**
 * @fileoverview Página de Historial de Transferencias.
 * Recupera y muestra todas las transacciones de activos en las que el usuario 
 * actual ha participado (como emisor o receptor).
 */

"use client";

import { useEffect, useState, useMemo } from "react";
import { useWallet } from "@/contexts/WalletContext";
import { getContract } from "@/contracts/contract";

/**
 * Interfaz que define la estructura de una transferencia para la interfaz de usuario.
 */
interface TransferInfo {
  /** ID único de la transferencia en el contrato */
  id: number;

  /** Nombre del activo obtenido mediante el tokenId */
  tokenName: string;

  /** Dirección de la billetera del emisor */
  from: string;

  /** Dirección de la billetera del receptor *
  to: string;

  /** Cantidad de unidades transferidas */
  amount: number;

  /** Fecha formateada en string (DD/MM/AAAA) */
  date: string;

  /** Estado legible: Pending, Accepted o Rejected */
  status: string;
}

/**
 * Componente TransferHistoryPage.
 * * Realiza una carga masiva de datos mediante:
 * 1. Obtención de una lista de IDs de transferencia asociados al usuario.
 * 2. Consulta individual de detalles de cada transferencia y datos del token.
 * 3. Formateo de tiempos de bloque (Unix) a fechas locales.
 */
export default function TransferHistoryPage() {
  const { account, signer } = useWallet();
  const [transfers, setTransfers] = useState<TransferInfo[]>([]);
  const [loading, setLoading] = useState(false);

  /**
   * Instancia memoizada del contrato para optimizar el rendimiento.
   */
  const contract = useMemo(() => (signer ? getContract(signer) : null), [signer]);

  /**
   * EFECTO: Recuperación de datos históricos.
   * Se dispara al detectar el contrato y la cuenta conectada.
   */
  useEffect(() => {
    if (!contract || !account) return;

    const fetchTransfers = async () => {
      setLoading(true);
      try {
        /** @dev Obtiene array de bigints con los IDs de transferencias vinculadas */
        const transferIds: bigint[] = await contract.getUserTransfers(account);
        const history: TransferInfo[] = [];

        /**
         * @loop Proceso de Hidratación de Datos:
         * Por cada ID, consultamos el contrato para obtener el detalle completo.
         */
        for (const id of transferIds) {
          // Obtiene estructura de la transferencia
          const transfer = await contract.getTransfer(Number(id));
          // Obtiene metadatos del token (nombre, etc.)
          const tokenData = await contract.getToken(Number(transfer.tokenId));
          // Mapeo del Enum Status (0, 1, 2)
          const statusText = ["Pending", "Accepted", "Rejected"][Number(transfer.status)];

          history.push({
            id: Number(transfer.id),
            tokenName: tokenData[2],
            from: transfer.from,
            to: transfer.to,
            amount: Number(transfer.amount),
            date: new Date(Number(transfer.dateCreated) * 1000).toLocaleString(),
            status: statusText,
          });
        }

        setTransfers(history);
      } catch (err) {
        console.error("Error al obtener historial:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTransfers();
  }, [contract, account]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-blue-700 mb-8 text-center">
          Historial de Transferencias
        </h1>

        {/* Indicador de carga */}
        {loading && <p className="text-blue-600">Cargando historial...</p>}

        {/* Estado vacío */}
        {transfers.length === 0 && !loading && (
          <p className="text-gray-600 text-center">No hay transferencias registradas.</p>
        )}

        {/* Grid de Tarjetas de Transferencia */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {transfers.map((transfer) => (
            <div key={transfer.id} className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-semibold text-blue-700 mb-2">
                Token: {transfer.tokenName}
              </h2>
              <p><strong>De:</strong> {transfer.from.slice(0, 6)}...{transfer.from.slice(-4)}</p>
              <p><strong>Para:</strong> {transfer.to.slice(0, 6)}...{transfer.to.slice(-4)}</p>
              <p><strong>Cantidad:</strong> {transfer.amount}</p>
              <p><strong>Fecha:</strong> {transfer.date}</p>
              <p>
                <strong>Estado:</strong>{" "}
                <span
                  className={`font-bold ${transfer.status === "Accepted"
                    ? "text-green-600"
                    : transfer.status === "Rejected"
                      ? "text-red-600"
                      : "text-yellow-600"
                    }`}
                >
                  {transfer.status}
                </span>
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}