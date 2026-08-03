import { useEffect, useState } from 'react';
import { FileText, Search, Calendar, User } from 'lucide-react';
import { api, MedicalRecord } from '../../api';

export default function MedicalRecords() {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<MedicalRecord | null>(null);

  useEffect(() => {
    api.patient.getRecords()
      .then(setRecords)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = records.filter(r =>
    r.diagnosis.toLowerCase().includes(search.toLowerCase()) ||
    r.doctor_user_name?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="p-8 text-center text-gray-400">Loading records…</div>;

  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold">Medical Records</h1>
          <p className="text-gray-500 mt-1">{records.length} record{records.length !== 1 ? 's' : ''} found</p>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by diagnosis or doctor…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl border p-12 text-center">
            <FileText className="h-12 w-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400">{records.length === 0 ? 'No medical records yet' : 'No records match your search'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filtered.map(rec => (
              <div key={rec.id} className="bg-white rounded-xl border p-5 hover:shadow-sm transition-shadow cursor-pointer"
                onClick={() => setSelected(rec)}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-4 w-4 text-blue-600 shrink-0" />
                      <p className="font-medium">{rec.diagnosis}</p>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" />{rec.doctor_user_name}</span>
                      <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{rec.visit_date}</span>
                      {rec.specialization && <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">{rec.specialization}</span>}
                    </div>
                    {rec.prescription && (
                      <p className="text-sm text-gray-600 mt-2"><span className="font-medium">Rx:</span> {rec.prescription}</p>
                    )}
                  </div>
                  <button className="text-xs text-blue-600 hover:underline shrink-0">Details</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Detail Modal */}
        {selected && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setSelected(null)}>
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl" onClick={e => e.stopPropagation()}>
              <h3 className="font-bold text-lg mb-4">{selected.diagnosis}</h3>
              <div className="space-y-3 text-sm">
                <Row label="Doctor" value={selected.doctor_user_name} />
                <Row label="Specialization" value={selected.specialization || '—'} />
                <Row label="Visit Date" value={selected.visit_date} />
                <Row label="Prescription" value={selected.prescription || '—'} />
                {selected.notes && <Row label="Notes" value={selected.notes} />}
              </div>
              <button onClick={() => setSelected(null)}
                className="mt-5 w-full py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors">
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-gray-500 shrink-0">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}
