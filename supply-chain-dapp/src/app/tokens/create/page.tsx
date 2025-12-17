/**
 * @fileoverview Página para la creación de nuevos activos (tokens) en la Supply Chain.
 * Permite definir las propiedades del producto y establecer relaciones de 
 * parentesco entre activos para mantener la trazabilidad.
 */
"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSupplyChain } from "@/hooks/useSupplychain";
import { useWallet } from "@/contexts/WalletContext";
import { getContract } from "@/contracts/contract";
import { useNotification } from "@/contexts/NotificationContext";

/**
 * Componente CreateTokenPage.
 * * Funcionalidades clave:
 * 1. Formulario vinculado a estados para capturar metadatos del activo.
 * 2. Carga dinámica de activos existentes del usuario para definir un "Activo Padre".
 * 3. Integración con el Smart Contract para emitir la transacción de creación.
 */
export default function CreateTokenPage() {
    const router = useRouter();
    /** @dev Hook de lógica de negocio para ejecutar la creación en la blockchain */
    const { loading, createToken } = useSupplyChain();
    /** @dev Datos de conexión y feedback */
    const { account, signer } = useWallet();
    const { setMessage } = useNotification();

    // --- ESTADOS DEL FORMULARIO ---
    const [name, setName] = useState("");
    const [totalSupply, setTotalSupply] = useState<number | "">("");
    const [features, setFeatures] = useState("");
    const [parentAssets, setParentAssets] = useState<{ id: number; name: string }[]>([]);
    const [selectedParent, setSelectedParent] = useState<number | "">("");

    /**
     * @memoizado contract
     * Instancia del contrato conectada al firmante actual.
     */
    const contract = useMemo(() => (signer ? getContract(signer) : null), [signer]);

    /**
     * EFECTO: Carga de Activos Propios.
     * Busca los tokens que ya posee el usuario para listarlos como posibles "padres".
     * Esto permite, por ejemplo, que un "Lote de Harina" sea padre de un "Lote de Pan".
     */
    useEffect(() => {
        if (!contract || !account) return;

        const fetchAssets = async () => {
            try {
                // Obtiene los IDs de los tokens del usuario desde el contrato
                const tokenIds: bigint[] = await contract.getUserTokens(account);
                const assets: { id: number; name: string }[] = [];

                for (const id of tokenIds) {
                    const tokenData = await contract.getToken(Number(id));
                    assets.push({ id: Number(tokenData[0]), name: tokenData[2] });
                }
                setParentAssets(assets);
            } catch (err) {
                console.error("Error al cargar activos:", err);
            }
        };

        fetchAssets();
    }, [contract, account]);


    /**
     * Valida los datos y dispara la transacción de creación.
     * Si se selecciona un padre, se envía su ID; de lo contrario, se envía 0 (raíz).
     */
    async function handleCreateToken() {
        if (!name || !totalSupply || !features) {
            alert("Por favor completa todos los campos.");
            return;
        }

        try {
            // Aquí llamamos a la función del contrato (debes agregarla en el hook useSupplyChain)
            await createToken(name, Number(totalSupply), features, selectedParent ? Number(selectedParent) : 0);
            setMessage(`✅ Activo "${name}" creado correctamente.`);
            router.push("/dashboard");

        } catch (error) {
            console.error(error);
            setMessage("❌ Error al crear el activo.");
        }
    }


    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-8 flex items-center justify-center">
            <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-lg">
                <h1 className="text-2xl font-bold text-blue-700 mb-6 text-center">Crear Activo</h1>

                <div className="space-y-4">
                    {/* Campo: Nombre */}
                    <div>
                        <label className="block text-gray-700 font-medium mb-2">Nombre del activo</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                            placeholder="Ej. Botella de aceite 1L"
                        />
                    </div>

                    {/* Campo: Suministro Total */}
                    <div>
                        <label className="block text-gray-700 font-medium mb-2">Total Supply</label>
                        <input
                            type="number"
                            value={totalSupply}
                            onChange={(e) => setTotalSupply(Number(e.target.value))}
                            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                            placeholder="Ej. 100"
                        />
                    </div>

                    {/* Campo: Características / Metadatos */}
                    <div>
                        <label className="block text-gray-700 font-medium mb-2">Características (JSON)</label>
                        <textarea
                            value={features}
                            onChange={(e) => setFeatures(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                            rows={4}
                            placeholder='Ej. {"color": "azul", "peso": "1L"}'
                        />
                    </div>

                    {/* Selector: Activo Padre (Opcional) */}
                    <div>
                        <label className="block text-gray-700 font-medium mb-2">Parent Asset (opcional)</label>
                        <select
                            value={selectedParent}
                            onChange={(e) => setSelectedParent(Number(e.target.value))}
                            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">-- Selecciona un activo --</option>
                            {parentAssets.map((asset) => (
                                <option key={asset.id} value={asset.id}>
                                    {asset.name} (ID: {asset.id})
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Acciones del formulario */}
                <div className="flex justify-between mt-6">
                    <button
                        onClick={() => router.push("/dashboard")}
                        className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 transition"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleCreateToken}
                        disabled={loading}
                        className={`px-4 py-2 rounded text-white transition ${loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"}`}
                    >
                        {loading ? "Creando..." : "Crear Activo"}
                    </button>
                </div>
            </div>
        </div>
    );
}
