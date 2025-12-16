
"use client";

import { useEffect, useState, useMemo } from "react";
import { useWallet } from "@/contexts/WalletContext";
import { getContract } from "@/contracts/contract";

interface TransferInfo {
  id: number;
  tokenName: string;
  from: string;
  to: string;
  amount: number;
  date: string;
  status: string;
}

export default function TransferHistoryPage() {
  const { account, signer } = useWallet();
  const [transfers, setTransfers] = useState<TransferInfo[]>([]);
  const [loading, setLoading] = useState(false);

  const contract = useMemo(() => (signer ? getContract(signer) : null), [signer]);

  useEffect(() => {
    if (!contract || !account) return;

    const fetchTransfers = async () => {
      setLoading(true);
      try {
        const transferIds: bigint[] = await contract.getUserTransfers(account);
        const history: TransferInfo[] = [];

        for (const id of transferIds) {
          const transfer = await contract.getTransfer(Number(id));
          const tokenData = await contract.getToken(Number(transfer.tokenId));

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

        {loading && <p className="text-blue-600">Cargando historial...</p>}
        {transfers.length === 0 && !loading && (
          <p className="text-gray-600 text-center">No hay transferencias registradas.</p>
        )}

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
                  className={`font-bold ${
                    transfer.status === "Accepted"
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