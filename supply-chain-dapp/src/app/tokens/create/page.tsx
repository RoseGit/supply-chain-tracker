
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSupplyChain } from "@/hooks/useSupplychain";

export default function CreateTokenPage() {
    const router = useRouter();
    const { loading, createToken } = useSupplyChain(); // Aquí usaremos createToken después
    const [name, setName] = useState("");
    const [totalSupply, setTotalSupply] = useState<number | "">("");
    const [features, setFeatures] = useState("");

    // ✅ Función para crear el token
    async function handleCreateToken() {
        if (!name || !totalSupply || !features) {
            alert("Por favor completa todos los campos.");
            return;
        }

        try {
            // Aquí llamamos a la función del contrato (debes agregarla en el hook useSupplyChain)
            const tx = await createToken(name, totalSupply, features, 0);
            alert("Activo creado correctamente.");
            router.push("/dashboard");
        } catch (error) {
            console.error(error);
            alert("Error al crear el activo.");
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-8 flex items-center justify-center">
            <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-lg">
                <h1 className="text-2xl font-bold text-blue-700 mb-6 text-center">
                    Crear Activo
                </h1>

                <div className="space-y-4">
                    {/* Nombre del activo */}
                    <div>
                        <label className="block text-gray-700 font-medium mb-2">
                            Nombre del activo
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Ej. Producto A"
                        />
                    </div>

                    {/* Total Supply */}
                    <div>
                        <label className="block text-gray-700 font-medium mb-2">
                            Total Supply
                        </label>
                        <input
                            type="number"
                            value={totalSupply}
                            onChange={(e) => setTotalSupply(Number(e.target.value))}
                            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Ej. 100"
                        />
                    </div>

                    {/* Características */}
                    <div>
                        <label className="block text-gray-700 font-medium mb-2">
                            Características (JSON)
                        </label>
                        <textarea
                            value={features}
                            onChange={(e) => setFeatures(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows={4}
                            placeholder='Ej. {"color": "azul", "peso": "10kg"}'
                        />
                    </div>
                </div>

                {/* Botones */}
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
                        className={`px-4 py-2 rounded text-white transition ${loading
                                ? "bg-gray-400 cursor-not-allowed"
                                : "bg-blue-600 hover:bg-blue-700"
                            }`}
                    >
                        {loading ? "Creando..." : "Crear Activo"}
                    </button>
                </div>
            </div>
        </div>
    );
}