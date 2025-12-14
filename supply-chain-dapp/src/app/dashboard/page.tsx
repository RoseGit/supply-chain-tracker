
"use client";

export default function Dashboard() {
  const cards = [
    {
      title: "Crear Activos",
      description: "Genera nuevos activos en la cadena de suministro.",
      icon: "📦",
      link: "/tokens/create",
    },
    {
      title: "Transferencias",
      description: "Gestiona las transferencias de tus activos.",
      icon: "🔄",
      link: "/dashboard/transfers",
    },
    {
      title: "Mis Activos",
      description: "Consulta los activos que tienes registrados.",
      icon: "🗂️",
      link: "/dashboard/my-assets",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-blue-700 mb-8 text-center">
          Panel de Usuario
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cards.map((card, idx) => (
            <div
              key={idx}
              className="bg-white rounded-xl shadow-md hover:shadow-xl transition p-6 flex flex-col items-center text-center"
            >
              <div className="text-5xl mb-4">{card.icon}</div>
              <h2 className="text-xl font-semibold text-blue-700 mb-2">
                {card.title}
              </h2>
              <p className="text-gray-600 mb-4">{card.description}</p>
              <a
                href={card.link}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-lg hover:opacity-90 transition"
              >
                Ir
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
