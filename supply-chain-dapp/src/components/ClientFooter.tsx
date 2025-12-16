/**
 * @fileoverview Componente de pie de página (Footer) de la aplicación.
 * Proporciona información manteniéndose 
 * siempre al final de la vista gracias a clases de Flexbox.
 */

"use client";

/**
 * Componente funcional ClientFooter.
 * * Renderiza una barra inferior con el año actual dinámico y los créditos del proyecto.
 * * @returns {JSX.Element} El pie de página estilizado con Tailwind CSS.
 */
export default function ClientFooter() {
  return (
    <footer className="bg-blue-600 text-white px-6 py-4 flex justify-center items-center shadow-md mt-auto">
      <p className="text-sm">
        © {new Date().getFullYear()}  Supply Chain DApp. PFM By Rosalio Garica Cruz.
      </p>
    </footer>
  );
}