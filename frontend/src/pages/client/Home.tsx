import { useAuth } from '../../contexts/AuthContext'
import { Calendar, Clock, MapPin, Phone } from 'lucide-react'
import apiService from '../../services/api'
import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Service } from '../../types'

export default function Home() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [featuredServices, setFeaturedServices] = useState<Service[]>([])

  useEffect(() => {
    async function fetchServices() {
      try {
        const data = await apiService.getServices()
        setFeaturedServices(data.slice(0, 3))
      } catch (e) {
        // erro silencioso
      }
    }
    fetchServices()
  }, [])

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-600 to-secondary-600 rounded-lg p-8 text-white">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-bold mb-4">
            Bem-vinda ao Isa Nails Design!
          </h1>
          <p className="text-xl mb-6">
            Transforme suas unhas com nossos serviços profissionais de manicure e pedicure.
          </p>
          <div className="flex items-center space-x-6 text-sm">
            
            <div className="flex items-center space-x-2">
              <MapPin className="h-5 w-5" />
              <span>Ipaguaçu Mirim, CE</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        <div className="card text-center">
          <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Calendar className="h-6 w-6 text-primary-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Agendar Horário</h3>
          <p className="text-gray-600 mb-4">
            Escolha o melhor horário para você
          </p>
          <button className="btn-primary w-full" onClick={() => navigate('/booking')}>
            Agendar Agora
          </button>
        </div>

        <div className="card text-center">
          <div className="w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Clock className="h-6 w-6 text-secondary-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Ver Serviços</h3>
          <p className="text-gray-600 mb-4">
            Conheça todos os nossos serviços
          </p>
          <button className="btn-secondary w-full" onClick={() => navigate('/services')}>
            Ver Serviços
          </button>
        </div>

        <div className="card text-center">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Phone className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Falar Conosco</h3>
          <p className="text-gray-600 mb-4">
            Entre em contato para dúvidas
          </p>
          <button className="btn-outline w-full" onClick={() => window.open('https://wa.me/5588994158452', '_blank')}>
            Contato
          </button>
        </div>
      </div>

      {/* Featured Services */}
      <div>
        <h2 className="text-2xl font-bold mb-6">Serviços em Destaque</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {featuredServices.map((service) => (
            <div key={service.id} className="card">
              <div className="h-32 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-lg mb-4 flex items-center justify-center">
                <span className="text-2xl">💅</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">{service.name}</h3>
              <p className="text-gray-600 mb-4">{service.description}</p>
              <div className="flex justify-between items-center">
                <span className="text-2xl font-bold text-primary-600">
                  R$ {service.price.toFixed(2)}
                </span>
                <span className="text-sm text-gray-500">
                  {service.duration} min
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* About Section */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-4">Sobre o Isa Nails Design</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <p className="text-gray-600 mb-4">
              Somos especialistas em cuidar das suas unhas com produtos de qualidade 
              e técnicas profissionais. Nossa missão é deixar você se sentindo 
              linda e confiante.
            </p>
            <p className="text-gray-600">
              Trabalhamos com os melhores produtos do mercado e seguimos rigorosos 
              padrões de higiene para garantir sua segurança e satisfação.
            </p>
          </div>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-sm">✓</span>
              </div>
              <span>Produtos de qualidade</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-sm">✓</span>
              </div>
              <span>Higiene garantida</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-sm">✓</span>
              </div>
              <span>Atendimento personalizado</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-sm">✓</span>
              </div>
              <span>Ambiente acolhedor</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 