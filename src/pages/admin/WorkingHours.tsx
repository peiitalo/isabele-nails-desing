import { useEffect, useState } from 'react';
import apiService from '../../services/api';
import toast from 'react-hot-toast';

const weekdays = [
  'Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'
];

export default function WorkingHours() {
  const [hours, setHours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ weekday: 1, startTime: '', endTime: '' });
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    fetchHours();
  }, []);

  async function fetchHours() {
    setLoading(true);
    try {
      const data = await apiService.getWorkingHours();
      setHours(data);
    } catch (e) {
      toast.error('Erro ao buscar horários');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      if (editing) {
        await apiService.updateWorkingHour(editing, form);
        toast.success('Horário atualizado!');
      } else {
        await apiService.createWorkingHour(form);
        toast.success('Horário criado!');
      }
      setForm({ weekday: 1, startTime: '', endTime: '' });
      setEditing(null);
      fetchHours();
    } catch (e) {
      toast.error('Erro ao salvar horário');
    }
  }

  async function handleDelete(id) {
    if (confirm('Deseja remover este horário?')) {
      try {
        await apiService.deleteWorkingHour(id);
        toast.success('Horário removido!');
        fetchHours();
      } catch (e) {
        toast.error('Erro ao remover horário');
      }
    }
  }

  function handleEdit(hour) {
    setForm({ weekday: hour.weekday, startTime: hour.startTime, endTime: hour.endTime });
    setEditing(hour.id);
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Horários Disponíveis</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 mb-6 bg-white p-4 rounded shadow">
        <div className="flex gap-2 items-center">
          <select
            className="input"
            value={form.weekday}
            onChange={e => setForm(f => ({ ...f, weekday: Number(e.target.value) }))}
          >
            {weekdays.map((w, i) => (
              <option key={i} value={i}>{w}</option>
            ))}
          </select>
          <input
            type="time"
            className="input"
            value={form.startTime}
            onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
            required
          />
          <span>até</span>
          <input
            type="time"
            className="input"
            value={form.endTime}
            onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
            required
          />
          <button className="btn-primary" type="submit">
            {editing ? 'Atualizar' : 'Adicionar'}
          </button>
          {editing && (
            <button className="btn-outline" type="button" onClick={() => { setEditing(null); setForm({ weekday: 1, startTime: '', endTime: '' }) }}>Cancelar</button>
          )}
        </div>
      </form>
      <div className="bg-white rounded shadow p-4">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Carregando...</div>
        ) : (
          <table className="min-w-full text-sm">
            <thead>
              <tr>
                <th className="text-left">Dia</th>
                <th className="text-left">Início</th>
                <th className="text-left">Fim</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {hours.map(hour => (
                <tr key={hour.id}>
                  <td>{weekdays[hour.weekday]}</td>
                  <td>{hour.startTime}</td>
                  <td>{hour.endTime}</td>
                  <td>
                    <button className="btn-outline mr-2" onClick={() => handleEdit(hour)}>Editar</button>
                    <button className="btn-danger" onClick={() => handleDelete(hour.id)}>Excluir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
} 