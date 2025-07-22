import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import apiService from '../../services/api'
import { Service, TimeSlot } from '../../types'
import { Calendar, Clock, User, MessageSquare } from 'lucide-react'
import toast from 'react-hot-toast'
import { useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion';

export default function Booking() {
  const { user } = useAuth()
  const [services, setServices] = useState<Service[]>([])
  const [selectedService, setSelectedService] = useState<string>('')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const location = useLocation()

  // Buscar serviços reais
  useEffect(() => {
    async function fetchServices() {
      setLoading(true)
      try {
        const data = await apiService.getServices()
        setServices(data)
        // Se veio serviceId via state, já seleciona
        if (location.state && location.state.serviceId) {
          setSelectedService(location.state.serviceId)
        }
      } catch (e) {
        toast.error('Erro ao buscar serviços')
      } finally {
        setLoading(false)
      }
    }
    fetchServices()
  }, [])

  // Gerar datas para os próximos 30 dias
  const generateDates = () => {
    const dates = []
    const today = new Date()
    for (let i = 0; i < 30; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      dates.push(date.toISOString().split('T')[0])
    }
    return dates
  }

  const availableDates = generateDates()

  // Buscar horários disponíveis reais do backend
  useEffect(() => {
    if (!selectedDate || !selectedService) return;
    async function fetchSlots() {
      try {
        const slots = await apiService.getAvailableSlots(selectedDate, selectedService);
        setAvailableSlots(slots);
      } catch (e) {
        toast.error('Erro ao buscar horários disponíveis');
        setAvailableSlots([]);
      }
    }
    fetchSlots();
  }, [selectedDate, selectedService]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedService || !selectedDate || !selectedTime) {
      toast.error('Por favor, preencha todos os campos obrigatórios')
      return
    }
    setIsSubmitting(true)
    try {
      await apiService.createBooking({
        serviceId: selectedService,
        date: selectedDate,
        time: selectedTime,
        notes
      })
      toast.success('Agendamento realizado com sucesso!')
      setSelectedService('')
      setSelectedDate('')
      setSelectedTime('')
      setNotes('')
    } catch (error) {
      toast.error('Erro ao realizar agendamento')
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedServiceData = services.find(s => s.id === selectedService)

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Carregando...</div>
  }

  return (
    <motion.div className="max-w-4xl mx-auto space-y-8" initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Agendar Horário</h1>
        <p className="text-gray-600">
          Escolha o serviço, data e horário que melhor se adequam à sua agenda
        </p>
      </motion.div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Step 1: Selecionar Serviço */}
        <motion.div className="card" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-primary-600 font-semibold">1</span>
            </div>
            <h2 className="text-xl font-semibold">Escolha o Serviço</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {services.map((service) => (
              <motion.div
                key={service.id}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${selectedService === service.id ? 'border-primary-500 bg-primary-50 shadow-lg scale-105' : 'border-gray-200 hover:border-gray-300'}`}
                onClick={() => setSelectedService(service.id)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                layoutId={selectedService === service.id ? 'selected-service' : undefined}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold">{service.name}</h3>
                  <span className="text-primary-600 font-bold">
                    R$ {service.price.toFixed(2)}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{service.description}</p>
                <div className="flex items-center text-sm text-gray-500">
                  <Clock className="h-4 w-4 mr-1" />
                  {service.duration} minutos
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Step 2: Selecionar Data */}
        <motion.div className="card" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-primary-600 font-semibold">2</span>
            </div>
            <h2 className="text-xl font-semibold">Escolha a Data</h2>
          </div>
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
            {availableDates.slice(0, 10).map((date) => {
              const dateObj = new Date(date)
              const isToday = date === new Date().toISOString().split('T')[0]
              const isSelected = selectedDate === date
              return (
                <motion.button
                  key={date}
                  type="button"
                  className={`p-3 text-center rounded-lg border transition-colors ${isSelected ? 'border-primary-500 bg-primary-50 text-primary-700 scale-105 shadow' : 'border-gray-200 hover:border-gray-300'} ${isToday ? 'bg-yellow-50 border-yellow-300' : ''}`}
                  onClick={() => setSelectedDate(date)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  <div className="text-xs font-medium">
                    {dateObj.toLocaleDateString('pt-BR', { weekday: 'short' })}
                  </div>
                  <div className="text-lg font-bold">
                    {dateObj.getDate()}
                  </div>
                  {isToday && (
                    <div className="text-xs text-yellow-600">Hoje</div>
                  )}
                </motion.button>
              )
            })}
          </div>
        </motion.div>

        {/* Step 3: Selecionar Horário */}
        <AnimatePresence>
        {selectedDate && (
          <motion.div className="card" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 24 }} transition={{ delay: 0.25 }}>
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-primary-600 font-semibold">3</span>
              </div>
              <h2 className="text-xl font-semibold">Escolha o Horário</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {availableSlots.length === 0 ? (
                <div className="col-span-5 text-gray-500">Nenhum horário disponível para este dia.</div>
              ) : (
                availableSlots.map((slot) => (
                  <motion.button
                    key={slot.time}
                    type="button"
                    disabled={!slot.available}
                    className={`p-3 text-center rounded-lg border transition-colors ${selectedTime === slot.time ? 'border-primary-500 bg-primary-50 text-primary-700 scale-105 shadow' : slot.available ? 'border-gray-200 hover:border-gray-300' : 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed'}`}
                    onClick={() => slot.available && setSelectedTime(slot.time)}
                    whileHover={slot.available ? { scale: 1.05 } : {}}
                    whileTap={slot.available ? { scale: 0.97 } : {}}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  >
                    {slot.time}
                  </motion.button>
                ))
              )}
            </div>
          </motion.div>
        )}
        </AnimatePresence>

        {/* Step 4: Observações */}
        <motion.div className="card" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-primary-600 font-semibold">4</span>
            </div>
            <h2 className="text-xl font-semibold">Observações (Opcional)</h2>
          </div>
          <textarea
            placeholder="Alguma preferência ou observação especial?"
            className="input h-24 resize-none"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </motion.div>

        {/* Resumo do Agendamento */}
        <AnimatePresence>
        {(selectedService || selectedDate || selectedTime) && (
          <motion.div className="card bg-gray-50" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 24 }} transition={{ delay: 0.35 }}>
            <h3 className="text-lg font-semibold mb-4">Resumo do Agendamento</h3>
            <div className="space-y-3">
              {selectedServiceData && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Serviço:</span>
                  <span className="font-medium">{selectedServiceData.name}</span>
                </div>
              )}
              {selectedDate && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Data:</span>
                  <span className="font-medium">
                    {new Date(selectedDate).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              )}
              {selectedTime && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Horário:</span>
                  <span className="font-medium">{selectedTime}</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
        </AnimatePresence>
        <motion.div className="flex justify-end" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <button
            type="submit"
            className={`btn-primary px-8 py-3 text-lg font-semibold rounded transition-all duration-300 ${isSubmitting ? 'opacity-60 cursor-not-allowed' : ''}`}
            disabled={isSubmitting}
            whileTap={{ scale: 0.97 }}
          >
            {isSubmitting ? 'Agendando...' : 'Confirmar Agendamento'}
          </button>
        </motion.div>
      </form>
    </motion.div>
  );
} 