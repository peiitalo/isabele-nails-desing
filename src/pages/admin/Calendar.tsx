import { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import apiService from '../../services/api';
import { Calendar as CalendarIcon } from 'lucide-react';
import ptBrLocale from '@fullcalendar/core/locales/pt-br';

export default function AdminCalendar() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBookings() {
      setLoading(true);
      try {
        const data = await apiService.getBookings();
        // Filtra apenas confirmados
        const confirmed = data.filter((b: any) => (b.status?.toUpperCase?.() === 'CONFIRMED'));
        // Mapeia para eventos do FullCalendar
        setEvents(
          confirmed.map((b: any) => ({
            id: b.id,
            title: `${b.clientName} - ${b.serviceName}`,
            start: `${b.date}T${b.time}`,
            end: `${b.date}T${b.time}`,
            backgroundColor: '#ec4899', // rosa
            borderColor: '#ec4899',
            textColor: '#fff',
            extendedProps: b
          }))
        );
      } catch (e) {
        // erro
      } finally {
        setLoading(false);
      }
    }
    fetchBookings();
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="flex items-center mb-6">
        <CalendarIcon className="h-8 w-8 text-primary-600 mr-2" />
        <h1 className="text-3xl font-bold">Calendário de Agendamentos</h1>
      </div>
      <div className="w-full overflow-x-auto">
        {loading ? (
          <div className="text-center py-12 text-gray-500">Carregando...</div>
        ) : (
          <div style={{ minWidth: 340 }}>
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
              }}
              locale={ptBrLocale}
              events={events}
              height="auto"
              eventTimeFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
              eventDisplay="block"
              eventContent={renderEventContent}
              dayMaxEventRows={3}
              fixedWeekCount={false}
              aspectRatio={1.5}
              eventMouseEnter={info => {
                info.el.style.filter = 'brightness(1.1)';
                info.el.style.boxShadow = '0 2px 8px #ec489955';
              }}
              eventMouseLeave={info => {
                info.el.style.filter = '';
                info.el.style.boxShadow = '';
              }}
              contentHeight="auto"
              windowResizeDelay={100}
            />
          </div>
        )}
      </div>
      <style>{`
        .fc .fc-daygrid-event {
          border-radius: 6px;
          padding: 2px 6px;
          font-size: 0.95em;
          transition: box-shadow 0.2s, filter 0.2s;
        }
        .fc .fc-daygrid-day.fc-day-today {
          background: #fdf2f8;
        }
        .fc .fc-toolbar-title {
          font-size: 1.2rem;
          font-weight: 600;
        }
        .fc .fc-button-primary {
          background: #ec4899;
          border: none;
          color: #fff;
          border-radius: 4px;
        }
        .fc .fc-button-primary:not(:disabled):hover {
          background: #be185d;
        }
        @media (max-width: 700px) {
          .fc .fc-toolbar-title { font-size: 1rem; }
          .fc .fc-daygrid-event { font-size: 0.85em; }
          .fc .fc-col-header-cell, .fc .fc-daygrid-day { padding: 2px; }
        }
      `}</style>
    </div>
  );
}

function renderEventContent(eventInfo: any) {
  return (
    <div className="text-xs" title={eventInfo.event.title}>
      <b>{eventInfo.timeText}</b> <span>{eventInfo.event.title}</span>
    </div>
  );
} 