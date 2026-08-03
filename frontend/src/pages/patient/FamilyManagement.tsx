import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, FamilyResponse, FamilyMember, NewFamilyMember } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { Users, Plus, Home, ChevronRight, UserPlus } from 'lucide-react';

export default function FamilyManagement() {
  const { user } = useAuth();
  const [family, setFamily] = useState<FamilyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [familyName, setFamilyName] = useState('');
  const [memberForm, setMemberForm] = useState<NewFamilyMember>({
    name: '',
    email: '',
    password: '',
    age: undefined,
    gender: '',
    contact: '',
    medical_history: '',
  });

  const loadFamily = async () => {
    setLoading(true);
    try {
      const data = await api.family.getMyFamily();
      setFamily(data);
      if (!data.family) {
        setFamilyName(`${user?.name}'s Family`);
      } else {
        setFamilyName(data.family.family_name);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Unable to load family data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFamily();
  }, []);

  const handleCreateFamily = async () => {
    setError('');
    setSaving(true);
    try {
      await api.family.createFamily(familyName.trim());
      setSuccess('Family created successfully');
      await loadFamily();
    } catch (err: any) {
      setError(err.message || 'Could not create family');
    } finally {
      setSaving(false);
      window.setTimeout(() => setSuccess(''), 3000);
    }
  };

  const handleAddMember = async () => {
    if (!family?.family) return;
    setError('');
    setSaving(true);
    try {
      const medicalHistory = typeof memberForm.medical_history === 'string'
        ? memberForm.medical_history.split(',').map(item => item.trim()).filter(Boolean)
        : memberForm.medical_history;

      const payload: NewFamilyMember = {
        ...memberForm,
        medical_history: medicalHistory,
      };
      await api.family.addMember(family.family.id, payload);
      setSuccess('Family member added successfully');
      setMemberForm({ name: '', email: '', password: '', age: undefined, gender: '', contact: '', medical_history: '' });
      await loadFamily();
    } catch (err: any) {
      setError(err.message || 'Could not add family member');
    } finally {
      setSaving(false);
      window.setTimeout(() => setSuccess(''), 3000);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading family information…</div>;

  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Family Management</h1>
            <p className="text-gray-500">Manage your family members and share access to patient records.</p>
          </div>
          {family?.family ? (
            <div className="rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm text-blue-700">
              <div className="font-semibold">{family.family.family_name}</div>
              <div>{family.members.length} member{family.members.length === 1 ? '' : 's'}</div>
            </div>
          ) : null}
        </div>

        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        {success && <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{success}</div>}

        {!family?.family ? (
          <div className="bg-white rounded-3xl border p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-5 text-lg font-semibold">
              <Home className="h-5 w-5 text-blue-600" /> Create your first family
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm text-gray-600">
                Family name
                <input value={familyName} onChange={e => setFamilyName(e.target.value)}
                  className="w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </label>
            </div>
            <button onClick={handleCreateFamily} disabled={saving || !familyName.trim()}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
              <Plus className="h-4 w-4" /> Create Family
            </button>
          </div>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="bg-white rounded-3xl border p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-5 text-lg font-semibold">
                <Users className="h-5 w-5 text-indigo-600" /> Family members
              </div>
              {family.members.length > 0 ? (
                <div className="space-y-4">
                  {family.members.map(member => (
                    <Link key={member.id} to={`/dashboard/family/${member.id}`} className="rounded-3xl border bg-slate-50 p-5 hover:border-blue-200 hover:shadow-sm transition-all block">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="text-base font-semibold">{member.name}</div>
                          <div className="text-sm text-gray-500">{member.email}</div>
                        </div>
                        <div className="text-right text-sm text-gray-600">
                          <div>{member.gender || 'Unknown'} • {member.age ?? 'N/A'} years</div>
                          <div>{member.contact || 'No contact'}</div>
                          <div className="mt-2 text-xs text-slate-500">{member.medical_records?.length ?? 0} record(s)</div>
                        </div>
                      </div>

                      {member.medical_history?.length > 0 && (
                        <div className="mt-4 text-sm text-gray-700">
                          <div className="font-medium text-gray-900">Medical history</div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {member.medical_history.map((entry, index) => (
                              <span key={index} className="rounded-full bg-blue-100 px-3 py-1 text-xs text-blue-800">{entry}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {member.medical_records?.length ? (
                        <div className="mt-4 text-sm text-gray-700">
                          <div className="font-medium text-gray-900">Recent family medical records</div>
                          <div className="mt-2 space-y-2">
                            {member.medical_records.slice(0, 2).map(record => (
                              <div key={record.id} className="rounded-2xl bg-slate-50 p-3 border border-slate-200">
                                <div className="text-sm font-semibold text-slate-900">{record.diagnosis}</div>
                                <div className="text-xs text-slate-500">{record.visit_date} · {record.doctor_user_name || 'Doctor'}</div>
                              </div>
                            ))}
                            {member.medical_records.length > 2 && (
                              <div className="text-xs text-slate-500">+{member.medical_records.length - 2} more record(s)</div>
                            )}
                          </div>
                        </div>
                      ) : null}
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
                  No family members have been added yet.
                </div>
              )}
            </div>

            <div className="bg-white rounded-3xl border p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-5 text-lg font-semibold">
                <UserPlus className="h-5 w-5 text-green-600" /> Add a new member
              </div>

              <div className="space-y-4">
                {[
                  { label: 'Full name', value: memberForm.name, field: 'name', type: 'text' },
                  { label: 'Email address', value: memberForm.email, field: 'email', type: 'email' },
                  { label: 'Password', value: memberForm.password, field: 'password', type: 'password' },
                ].map(({ label, value, field, type }) => (
                  <label key={field} className="block text-sm text-gray-600">
                    {label}
                    <input value={(memberForm as any)[field] || ''}
                      type={type}
                      onChange={e => setMemberForm(form => ({ ...form, [field]: e.target.value }))}
                      className="mt-2 w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </label>
                ))}

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm text-gray-600">
                    Age
                    <input type="number" value={memberForm.age ?? ''}
                      onChange={e => setMemberForm(form => ({ ...form, age: e.target.value ? parseInt(e.target.value) : undefined }))}
                      className="mt-2 w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </label>
                  <label className="block text-sm text-gray-600">
                    Gender
                    <select value={memberForm.gender || ''}
                      onChange={e => setMemberForm(form => ({ ...form, gender: e.target.value }))}
                      className="mt-2 w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </label>
                </div>

                <label className="block text-sm text-gray-600">
                  Contact number
                  <input value={memberForm.contact || ''}
                    onChange={e => setMemberForm(form => ({ ...form, contact: e.target.value }))}
                    className="mt-2 w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </label>

                <label className="block text-sm text-gray-600">
                  Medical history
                  <textarea value={memberForm.medical_history || ''}
                    onChange={e => setMemberForm(form => ({ ...form, medical_history: e.target.value }))}
                    placeholder="Comma-separated list"
                    className="mt-2 w-full min-h-[108px] rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </label>

                <button onClick={handleAddMember} disabled={saving || !memberForm.name || !memberForm.email || !memberForm.password}
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50">
                  <Plus className="h-4 w-4" /> Add Member
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
