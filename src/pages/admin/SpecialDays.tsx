import { useEffect, useState } from 'react';
import apiService from '../../services/api';
import toast from 'react-hot-toast';

export default function SpecialDays() {
  const [days, setDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ date: '', startTime: '', endTime: '' });
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    fetchDays();
  }, []);

  async function fetchDays() {
    setLoading(true);
    try {
      const data = await apiService.getSpecialDays();
      setDays(data);
    } catch (e) {
      toast.error('Erro ao buscar dias especiais');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      if (editing) {
        await apiService.updateSpecialDay(editing, form);
        toast.success('Dia especial atualizado!');
      } else {
        await apiService.createSpecialDay(form);
        toast.success('Dia especial criado!');
      }
      setForm({ date: '', startTime: '', endTime: '' });
      setEditing(null);
      fetchDays();
    } catch (e) {
      toast.error('Erro ao salvar dia especial');
    }
  }

  async function handleDelete(id) {
    if (confirm('Deseja remover este horário especial?')) {
      try {
        await apiService.deleteSpecialDay(id);
        toast.success('Horário removido!');
        fetchDays();
      } catch (e) {
        toast.error('Erro ao remover horário');
      }
    }
  }

  function handleEdit(day) {
    setForm({ date: day.date, startTime: day.startTime, endTime: day.endTime });
    setEditing(day.id);
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Dias Especiais</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 mb-6 bg-white p-4 rounded shadow">
        <div className="flex gap-2 items-center">
          <input
            type="date"
            className="input"
            value={form.date}
            onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
            required
          />
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
            <button className="btn-outline" type="button" onClick={() => { setEditing(null); setForm({ date: '', startTime: '', endTime: '' }) }}>Cancelar</button>
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
                <th className="text-left">Data</th>
                <th className="text-left">Início</th>
                <th className="text-left">Fim</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {days.map(day => (
                <tr key={day.id}>
                  <td>{day.date}</td>
                  <td>{day.startTime}</td>
                  <td>{day.endTime}</td>
                  <td>
                    <button className="btn-outline mr-2" onClick={() => handleEdit(day)}>Editar</button>
                    <button className="btn-danger" onClick={() => handleDelete(day.id)}>Excluir</button>
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