import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { User, FileText, AlertTriangle, Plus, ChevronLeft, Calendar, CheckCircle } from 'lucide-react';
import { api, PatientProfile, MedicalRecord } from '../../api';

export default function PatientDetail() {
  const { id } = useParams<{ id: string }>();
  const [patient, setPatient] = useState<PatientProfile | null>(null);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ diagnosis: '', prescription: '', notes: '', visit_date: new Date().toISOString().split('T')[0] });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([api.patient.getById(id), api.patient.getRecordsById(id)])
      .then(([p, r]) => { setPatient(p); setRecords(r); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddRecord = async () => {
    if (!form.diagnosis.trim() || !id) return;
    setSaving(true);
    try {
      const rec = await api.doctor.addRecord({ patient_id: id, ...form });
      setRecords([rec, ...records]);
      setForm({ diagnosis: '', prescription: '', notes: '', visit_date: new Date().toISOString().split('T')[0] });
      setShowForm(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-400">Loading patient…</div>;
  if (error) return (
    <div className="p-8 text-center">
      <p className="text-red-500 mb-4">{error}</p>
      <Link to="/doctor/scan-qr" className="text-blue-600 hover:underline">← Back to Scanner</Link>
    </div>
  );

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <Link to="/doctor/patients" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ChevronLeft className="h-4 w-4" /> Back to Patients
        </Link>

        {saved && (
          <div className="mb-4 flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-lg p-3 text-sm">
            <CheckCircle className="h-4 w-4" /> Medical record added successfully
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Patient Info Sidebar */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-lg">
                  {patient?.name[0]}
                </div>
                <div>
                  <p className="font-semibold">{patient?.name}</p>
                  <p className="text-xs text-gray-500">{patient?.email}</p>
                </div>
              </div>
              <div className="space-y-2">
                {[
                  { l: 'Age', v: patient?.age ? `${patient.age} years` : '—' },
                  { l: 'Gender', v: patient?.gender || '—' },
                  { l: 'Blood Group', v: patient?.blood_group || '—' },
                  { l: 'Emergency', v: patient?.emergency_contact || '—' },
                ].map(({ l, v }) => (
                  <div key={l} className="flex justify-between text-sm">
                    <span className="text-gray-500">{l}</span>
                    <span className="font-medium">{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {(patient?.allergies?.length! > 0) && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium text-red-900">Allergies</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {patient!.allergies.map((a, i) => (
                    <span key={i} className="px-2 py-0.5 bg-white text-red-800 border border-red-200 rounded text-xs">{a}</span>
                  ))}
                </div>
              </div>
            )}

            {(patient?.chronic_diseases?.length! > 0) && (
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium text-orange-900">Conditions</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {patient!.chronic_diseases.map((c, i) => (
                    <span key={i} className="px-2 py-0.5 bg-white text-orange-800 border border-orange-200 rounded text-xs">{c}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Records + Add Form */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Medical Records ({records.length})</h3>
              <button onClick={() => setShowForm(!showForm)}
                className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium">
                <Plus className="h-4 w-4" /> Add Record
              </button>
            </div>

            {showForm && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-5 space-y-3">
                <h4 className="font-medium text-green-900">New Medical Record</h4>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Diagnosis *</label>
                  <input type="text" value={form.diagnosis} onChange={e => setForm(f => ({ ...f, diagnosis: e.target.value }))}
                    placeholder="e.g. Hypertension Management"
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Prescription</label>
                  <input type="text" value={form.prescription} onChange={e => setForm(f => ({ ...f, prescription: e.target.value }))}
                    placeholder="e.g. Amlodipine 5mg once daily"
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Notes</label>
                  <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    rows={2} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Visit Date</label>
                  <input type="date" value={form.visit_date} onChange={e => setForm(f => ({ ...f, visit_date: e.target.value }))}
                    className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div className="flex gap-2 pt-1">
                  <button onClick={handleAddRecord} disabled={saving || !form.diagnosis.trim()}
                    className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors text-sm font-medium">
                    {saving ? 'Saving…' : 'Save Record'}
                  </button>
                  <button onClick={() => setShowForm(false)}
                    className="px-4 py-2 bg-white border rounded-lg hover:bg-gray-50 transition-colors text-sm">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {records.length === 0 ? (
                <div className="bg-white rounded-xl border p-8 text-center">
                  <FileText className="h-10 w-10 text-gray-200 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">No records yet</p>
                </div>
              ) : records.map(rec => (
                <div key={rec.id} className="bg-white rounded-xl border p-4">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-medium">{rec.diagnosis}</p>
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <Calendar className="h-3 w-3" />{rec.visit_date}
                    </span>
                  </div>
                  {rec.prescription && <p className="text-sm text-gray-600"><span className="font-medium">Rx:</span> {rec.prescription}</p>}
                  {rec.notes && <p className="text-sm text-gray-500 mt-1">{rec.notes}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
