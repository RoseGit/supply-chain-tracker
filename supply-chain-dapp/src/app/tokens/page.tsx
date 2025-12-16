
"use client";

import { useEffect, useState, useMemo } from "react";
import { useWallet } from "@/contexts/WalletContext";
import { getContract } from "@/contracts/contract";
import { useRouter } from "next/navigation";

interface TokenInfo {
  id: number;
  name: string;
  totalSupply: number;
  creator: string;
  dateCreated: string;
  features: string;
  balance: number;
}

interface TransferInfo {
  id: number;
  from: string;
  to: string;
  amount: number;
  date: string;
}

export default function MyAssetsPage() {
  const router = useRouter();
  const { account, signer } = useWallet();
  const [tokens, setTokens] = useState<TokenInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedToken, setSelectedToken] = useState<number | null>(null);
  const [transfers, setTransfers] = useState<TransferInfo[]>([]);
  const [loadingTransfers, setLoadingTransfers] = useState(false);

  const contract = useMemo(() => {
    return signer ? getContract(signer) : null;
  }, [signer]);

  // ✅ Obtener tokens del usuario
  useEffect(() => {
    if (!contract || !account) return;

    const fetchTokens = async () => {
      setLoading(true);
      setError(null);
      try {
        const tokenIds: bigint[] = await contract.getUserTokens(account);
        const tokenDetails: TokenInfo[] = [];

        for (const id of tokenIds) {
          const tokenData = await contract.getToken(Number(id));
          const balance = await contract.getTokenBalance(Number(id), account);

          tokenDetails.push({
            id: Number(tokenData[0]),
            creator: tokenData[1],
            name: tokenData[2],
            totalSupply: Number(tokenData[3]),
            features: tokenData[4],
            dateCreated: new Date(Number(tokenData[6]) * 1000).toLocaleString(),
            balance: Number(balance),
          });
        }

        setTokens(tokenDetails);
      } catch (err) {
        setError("Error al obtener los activos.");
      } finally {
        setLoading(false);
      }
    };

    fetchTokens();
  }, [contract, account]);

  // ✅ Obtener transferencias del token seleccionado
  async function fetchTransfers(tokenId: number) {
    if (!contract || !account) return;
    setLoadingTransfers(true);
    setTransfers([]);
    try {
      const transferIds: bigint[] = await contract.getUserTransfers(account);
      const relatedTransfers: TransferInfo[] = [];

      for (const id of transferIds) {
        const transfer = await contract.getTransfer(Number(id));
        if (Number(transfer.tokenId) === tokenId) {
          relatedTransfers.push({
            id: Number(transfer.id),
            from: transfer.from,
            to: transfer.to,
            amount: Number(transfer.amount),
            date: new Date(Number(transfer.dateCreated) * 1000).toLocaleString(),
          });
        }
      }
      setTransfers(relatedTransfers);
    } catch (err) {
      console.error("Error al obtener transferencias:", err);
    } finally {
      setLoadingTransfers(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-blue-700 mb-8 text-center">
          Mis Activos
        </h1>

        {loading && <p className="text-blue-600 font-medium mb-4">Cargando activos...</p>}
        {error && <p className="text-red-500 font-medium mb-4">{error}</p>}

        {tokens.length === 0 && !loading && (
          <p className="text-gray-600 text-center">No tienes activos registrados.</p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tokens.map((token) => (
            <div
              key={token.id}
              className="bg-white rounded-xl shadow-md hover:shadow-xl transition p-6 flex flex-col"
            >
              <h2 className="text-xl font-semibold text-blue-700 mb-2">{token.name}</h2>
              <p className="text-gray-600 mb-2">
                <strong>Balance:</strong> {token.balance}
              </p>
              <p className="text-gray-600 mb-2">
                <strong>Total Supply:</strong> {token.totalSupply}
              </p>
              <p className="text-gray-600 mb-2">
                <strong>Fecha:</strong> {token.dateCreated}
              </p>
              <p className="text-gray-600 mb-2">
                <strong>Creador:</strong> {token.creator.slice(0, 6)}...{token.creator.slice(-4)}
              </p>
              <p className="text-gray-600 text-sm bg-gray-100 p-2 rounded">
                <strong>Características:</strong> {token.features}
              </p>

              <div className="flex justify-between mt-4 gap-2">
                <button
                  onClick={() => router.push(`/transfers?tokenId=${token.id}`)}
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-lg hover:opacity-90 transition"
                >
                  Transferir
                </button>
                <button
                  onClick={() => {
                    setSelectedToken(token.id);
                    fetchTransfers(token.id);
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-blue-400 to-blue-600 text-white rounded-lg hover:opacity-90 transition"
                >
                  Detalles
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* ✅ Sección de detalles */}
        {selectedToken && (
          <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-blue-700 mb-4">
              Historial de Transferencias del Token #{selectedToken}
            </h2>
            {loadingTransfers && <p className="text-blue-600">Cargando transferencias...</p>}
            {transfers.length === 0 && !loadingTransfers && (
              <p className="text-gray-600">No hay transferencias registradas para este token.</p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {transfers.map((transfer) => (
                <div key={transfer.id} className="border rounded-lg p-4 shadow-sm">
                  <p><strong>De:</strong> {transfer.from.slice(0, 6)}...{transfer.from.slice(-4)}</p>
                  <p><strong>Para:</strong> {transfer.to.slice(0, 6)}...{transfer.to.slice(-4)}</p>
                  <p><strong>Cantidad:</strong> {transfer.amount}</p>
                  <p><strong>Fecha:</strong> {transfer.date}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
``
