import { useState, useEffect } from "react";
import apiService from "../../services/api";
import { Service } from "../../types";
import { Clock, Filter } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Services() {
  const [services, setServices] = useState<Service[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  const categories = [
    { id: "all", name: "Todos" },
    { id: "MANICURE", name: "Manicure" },
    { id: "PEDICURE", name: "Pedicure" },
    { id: "ESMALTACAO", name: "Esmaltação" },
    { id: "DECORACAO", name: "Decoração" },
  ];

  useEffect(() => {
    async function fetchServices() {
      setLoading(true);
      try {
        const data = await apiService.getServices();
        setServices(data);
      } catch (e) {
        // erro
      } finally {
        setLoading(false);
      }
    }
    fetchServices();
  }, []);

  const filteredServices = services.filter((service) => {
    const matchesCategory =
      selectedCategory === "all" || service.category === selectedCategory;
    const matchesSearch =
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "MANICURE":
        return "💅";
      case "PEDICURE":
        return "🦶";
      case "ESMALTACAO":
        return "💎";
      case "DECORACAO":
        return "✨";
      default:
        return "💅";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "MANICURE":
        return "bg-pink-100 text-pink-800";
      case "PEDICURE":
        return "bg-blue-100 text-blue-800";
      case "ESMALTACAO":
        return "bg-purple-100 text-purple-800";
      case "DECORACAO":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Nossos Serviços
        </h1>
        <p className="text-gray-600">
          Escolha o serviço perfeito para cuidar das suas unhas
        </p>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Buscar serviços..."
            className="input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-gray-400" />
          <select
            className="input"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServices.map((service) => (
          <div
            key={service.id}
            className="card hover:shadow-lg transition-shadow duration-200 flex justify-between flex-col"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl">
                  {getCategoryIcon(service.category)}
                </span>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(
                    service.category
                  )}`}
                >
                  {service.category}
                </span>
              </div>

              <h3 className="text-xl font-semibold mb-2">{service.name}</h3>
              <p className="text-gray-600 mb-4">{service.description}</p>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Clock className="h-4 w-4" />
                  <span>{service.duration} min</span>
                </div>
                <span className="text-2xl font-bold text-primary-600">
                  R$ {service.price.toFixed(2)}
                </span>
              </div>
              <button
                className="btn-primary w-full mt-4 "
                onClick={() =>
                  navigate("/booking", { state: { serviceId: service.id } })
                }
              >
                Agendar
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredServices.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhum serviço encontrado
          </h3>
          <p className="text-gray-600">
            Tente ajustar os filtros ou termos de busca
          </p>
        </div>
      )}

      {/* Service Categories Info */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Categorias de Serviços</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.slice(1).map((category) => (
            <div
              key={category.id}
              className="text-center p-4 rounded-lg bg-gray-50"
            >
              <div className="text-3xl mb-2">
                {getCategoryIcon(category.id)}
              </div>
              <h3 className="font-medium">{category.name}</h3>
              <p className="text-sm text-gray-600">
                {services.filter((s) => s.category === category.id).length}{" "}
                serviços
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
