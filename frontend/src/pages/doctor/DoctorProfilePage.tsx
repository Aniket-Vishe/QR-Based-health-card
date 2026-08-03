import { useEffect, useState } from 'react';
import { Save, CheckCircle, AlertCircle } from 'lucide-react';
import { api, DoctorProfile } from '../../api';

export default function DoctorProfilePage() {
  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [form, setForm] = useState({ specialization: '', qualification: '', experience: '', hospital: '', about: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.doctor.getProfile().then(p => {
      setProfile(p);
      setForm({ specialization: p.specialization || '', qualification: p.qualification || '', experience: p.experience?.toString() || '', hospital: p.hospital || '', about: p.about || '' });
    }).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.doctor.updateProfile({ ...form, experience: form.experience ? parseInt(form.experience) : undefined } as any);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="p-8 text-center text-gray-400">Loading…</div>;

  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold">My Profile</h1>
            <p className="text-gray-500 mt-1">Update your professional information</p>
          </div>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors text-sm font-medium">
            {saved ? <><CheckCircle className="h-4 w-4" /> Saved</> : <><Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save'}</>}
          </button>
        </div>

        {!profile?.verified && (
          <div className="mb-6 flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
            <p className="text-sm text-amber-800">Your account is pending admin verification.</p>
          </div>
        )}

        <div className="bg-white rounded-xl border p-6 space-y-4">
          {[
            { label: 'Specialization', field: 'specialization', placeholder: 'e.g. Cardiology' },
            { label: 'Qualification', field: 'qualification', placeholder: 'e.g. MD, FACC' },
            { label: 'Hospital / Clinic', field: 'hospital', placeholder: 'Hospital name' },
          ].map(({ label, field, placeholder }) => (
            <div key={field}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <input type="text" value={(form as any)[field]} placeholder={placeholder}
                onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm" />
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Experience (years)</label>
            <input type="number" value={form.experience} min="0"
              onChange={e => setForm(f => ({ ...f, experience: e.target.value }))}
              className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">About</label>
            <textarea value={form.about} rows={4}
              onChange={e => setForm(f => ({ ...f, about: e.target.value }))}
              className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm resize-none" />
          </div>
        </div>
      </div>
    </div>
  );
}
