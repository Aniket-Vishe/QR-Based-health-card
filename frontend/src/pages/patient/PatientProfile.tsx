import { useEffect, useState } from 'react';
import { Save, Plus, X, CheckCircle } from 'lucide-react';
import { api } from '../../api';
import type { PatientProfile as PatientProfileType } from '../../api';

export default function PatientProfile() {
  const [profile, setProfile] = useState<PatientProfileType | null>(null);
  const [form, setForm] = useState({ age: '', gender: '', blood_group: '', emergency_contact: '' });
  const [allergies, setAllergies] = useState<string[]>([]);
  const [conditions, setConditions] = useState<string[]>([]);
  const [newAllergy, setNewAllergy] = useState('');
  const [newCondition, setNewCondition] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.patient.getProfile().then(p => {
      setProfile(p);
      setForm({
        age: p.age?.toString() || '',
        gender: p.gender || '',
        blood_group: p.blood_group || '',
        emergency_contact: p.emergency_contact || '',
      });
      setAllergies(p.allergies || []);
      setConditions(p.chronic_diseases || []);
    }).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patient.updateProfile({
        age: form.age ? parseInt(form.age) : undefined,
        gender: form.gender || undefined,
        blood_group: form.blood_group || undefined,
        emergency_contact: form.emergency_contact || undefined,
        allergies,
        chronic_diseases: conditions,
      } as any);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const addAllergy = () => {
    if (newAllergy.trim() && !allergies.includes(newAllergy.trim())) {
      setAllergies([...allergies, newAllergy.trim()]);
      setNewAllergy('');
    }
  };

  const addCondition = () => {
    if (newCondition.trim() && !conditions.includes(newCondition.trim())) {
      setConditions([...conditions, newCondition.trim()]);
      setNewCondition('');
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-400">Loading…</div>;

  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold">My Profile</h1>
            <p className="text-gray-500 mt-1">Update your health information</p>
          </div>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm font-medium">
            {saved ? <><CheckCircle className="h-4 w-4" /> Saved</> : <><Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save Changes'}</>}
          </button>
        </div>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="bg-white rounded-xl border p-6">
            <h3 className="font-semibold mb-4">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Family', value: profile?.family_name || '—', readOnly: true },
                { label: 'Age', field: 'age', type: 'number' },
                { label: 'Emergency Contact', field: 'emergency_contact', type: 'tel' },
              ].map(({ label, field, type, readOnly }) => (
                <div key={label}>
                  <label className="block text-sm text-gray-600 mb-1">{label}</label>
                  {readOnly ? (
                    <div className="w-full px-3 py-2 rounded-lg border bg-gray-50 text-sm text-gray-700">{String((profile as any)?.family_name || '—')}</div>
                  ) : (
                    <input type={type} value={(form as any)[field]}
                      onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  )}
                </div>
              ))}
              <div>
                <label className="block text-sm text-gray-600 mb-1">Gender</label>
                <select value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select</option>
                  <option>Male</option><option>Female</option><option>Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Blood Group</label>
                <select value={form.blood_group} onChange={e => setForm(f => ({ ...f, blood_group: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select</option>
                  {['A+','A-','B+','B-','O+','O-','AB+','AB-'].map(bg => <option key={bg}>{bg}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Allergies */}
          <div className="bg-white rounded-xl border p-6">
            <h3 className="font-semibold mb-4">Allergies</h3>
            <div className="flex flex-wrap gap-2 mb-3">
              {allergies.map((a, i) => (
                <span key={i} className="flex items-center gap-1 px-3 py-1 bg-red-50 text-red-800 border border-red-200 rounded-full text-sm">
                  {a}
                  <button onClick={() => setAllergies(allergies.filter((_, j) => j !== i))} className="ml-1 hover:text-red-600">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input type="text" value={newAllergy} onChange={e => setNewAllergy(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addAllergy()}
                placeholder="Add allergy…"
                className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <button onClick={addAllergy} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Chronic Conditions */}
          <div className="bg-white rounded-xl border p-6">
            <h3 className="font-semibold mb-4">Chronic Conditions</h3>
            <div className="flex flex-wrap gap-2 mb-3">
              {conditions.map((c, i) => (
                <span key={i} className="flex items-center gap-1 px-3 py-1 bg-orange-50 text-orange-800 border border-orange-200 rounded-full text-sm">
                  {c}
                  <button onClick={() => setConditions(conditions.filter((_, j) => j !== i))} className="ml-1 hover:text-orange-600">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input type="text" value={newCondition} onChange={e => setNewCondition(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addCondition()}
                placeholder="Add condition…"
                className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <button onClick={addCondition} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
