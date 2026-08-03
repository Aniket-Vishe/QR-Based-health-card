import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Users, Stethoscope, FileText, Activity, Search,
  CheckCircle, XCircle, Trash2, QrCode, Shield, TrendingUp,
  Edit3, Save, X,
} from 'lucide-react';
import { api, AdminStats, PatientProfile, DoctorProfile, QRLog } from '../../api';

export default function AdminDashboard() {
  const location = useLocation();
  const section = location.pathname.split('/')[2] || 'dashboard';
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [patients, setPatients] = useState<PatientProfile[]>([]);
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [qrLogs, setQrLogs] = useState<QRLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingPatientId, setEditingPatientId] = useState<string | null>(null);
  const [patientDraft, setPatientDraft] = useState<Partial<PatientProfile>>({});
  const [editingDoctorId, setEditingDoctorId] = useState<string | null>(null);
  const [doctorDraft, setDoctorDraft] = useState<Partial<DoctorProfile>>({});
  const [saving, setSaving] = useState(false);

  const formatDate = (value: any) => {
    if (!value) return '—';
    if (typeof value === 'string') return value.split('T')[0];
    if (typeof value.toDate === 'function') return value.toDate().toISOString().split('T')[0];
    if (typeof value.seconds === 'number') return new Date(value.seconds * 1000).toISOString().split('T')[0];
    return String(value);
  };

  useEffect(() => {
    setLoading(true);
    const fetches: Promise<any>[] = [api.admin.getStats()];
    if (section === 'dashboard' || section === 'users') fetches.push(api.admin.getPatients());
    if (section === 'dashboard' || section === 'doctors') fetches.push(api.admin.getDoctors());
    if (section === 'records') fetches.push(api.admin.getQRLogs());

    Promise.all(fetches).then(([s, ...rest]) => {
      setStats(s);
      if (section === 'dashboard') { setPatients(rest[0] || []); setDoctors(rest[1] || []); }
      else if (section === 'users') setPatients(rest[0] || []);
      else if (section === 'doctors') setDoctors(rest[0] || []);
      else if (section === 'records') setQrLogs(rest[0] || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, [section]);

  const handleVerify = async (id: string, verified: boolean) => {
    await api.admin.verifyDoctor(id, verified);
    setDoctors(ds => ds.map(d => d.id === id ? { ...d, verified } : d));
    setStats(s => s ? { ...s, verifiedDoctors: s.verifiedDoctors + (verified ? 1 : -1), pendingDoctors: s.pendingDoctors + (verified ? -1 : 1) } : s);
  };

  const handleDeletePatient = async (id: string) => {
    if (!confirm('Delete this patient? This cannot be undone.')) return;
    await api.admin.deletePatient(id);
    setPatients(ps => ps.filter(p => p.id !== id));
    setStats(s => s ? { ...s, totalPatients: s.totalPatients - 1 } : s);
  };

  const handleEditPatient = (patient: PatientProfile) => {
    setEditingPatientId(patient.id);
    setPatientDraft({
      name: patient.name,
      age: patient.age,
      blood_group: patient.blood_group,
      emergency_contact: patient.emergency_contact,
      contact: patient.contact,
    });
  };

  const handleCancelPatientEdit = () => {
    setEditingPatientId(null);
    setPatientDraft({});
  };

  const handleSavePatient = async (id: string) => {
    setSaving(true);
    try {
      const updated = await api.admin.updatePatient(id, patientDraft);
      setPatients(ps => ps.map(p => p.id === id ? { ...p, ...updated } : p));
      setEditingPatientId(null);
      setPatientDraft({});
    } finally {
      setSaving(false);
    }
  };

  const handleEditDoctor = (doctor: DoctorProfile) => {
    setEditingDoctorId(doctor.id);
    setDoctorDraft({
      name: doctor.name,
      specialization: doctor.specialization,
      qualification: doctor.qualification,
      experience: doctor.experience,
      hospital: doctor.hospital,
      about: doctor.about,
      verified: doctor.verified,
    });
  };

  const handleCancelDoctorEdit = () => {
    setEditingDoctorId(null);
    setDoctorDraft({});
  };

  const handleSaveDoctor = async (id: string) => {
    setSaving(true);
    try {
      const updated = await api.admin.updateDoctor(id, doctorDraft);
      setDoctors(ds => ds.map(d => d.id === id ? { ...d, ...updated } : d));
      setEditingDoctorId(null);
      setDoctorDraft({});
    } finally {
      setSaving(false);
    }
  };

  const handleVerifyAll = async () => {
    if (!confirm('Verify all pending doctors?')) return;
    await api.admin.verifyAllDoctors();
    setDoctors(ds => ds.map(d => ({ ...d, verified: true })));
    setStats(s => s ? { ...s, verifiedDoctors: s.verifiedDoctors + s.pendingDoctors, pendingDoctors: 0 } : s);
  };

  const handleDeleteDoctor = async (id: string) => {
    if (!confirm('Delete this doctor? This cannot be undone.')) return;
    await api.admin.deleteDoctor(id);
    setDoctors(ds => ds.filter(d => d.id !== id));
    setStats(s => s ? { ...s, totalDoctors: s.totalDoctors - 1 } : s);
  };

  if (loading) return <div className="p-8 text-center text-gray-400">Loading…</div>;

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Stats always shown */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold">
            {section === 'dashboard' ? 'Admin Dashboard' :
             section === 'users' ? 'Manage Patients' :
             section === 'doctors' ? 'Manage Doctors' :
             section === 'records' ? 'QR Scan Logs' : 'Admin'}
          </h1>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {[
            { label: 'Patients', value: stats?.totalPatients, icon: <Users className="h-5 w-5 text-blue-600" />, bg: 'bg-blue-50' },
            { label: 'Doctors', value: stats?.totalDoctors, icon: <Stethoscope className="h-5 w-5 text-green-600" />, bg: 'bg-green-50' },
            { label: 'Verified', value: stats?.verifiedDoctors, icon: <CheckCircle className="h-5 w-5 text-emerald-600" />, bg: 'bg-emerald-50' },
            { label: 'Pending', value: stats?.pendingDoctors, icon: <Shield className="h-5 w-5 text-amber-600" />, bg: 'bg-amber-50' },
            { label: 'Records', value: stats?.totalRecords, icon: <FileText className="h-5 w-5 text-purple-600" />, bg: 'bg-purple-50' },
            { label: 'QR Scans', value: stats?.totalScans, icon: <QrCode className="h-5 w-5 text-orange-600" />, bg: 'bg-orange-50' },
          ].map(({ label, value, icon, bg }) => (
            <div key={label} className="bg-white rounded-xl border p-4">
              <div className={`${bg} p-2 rounded-lg inline-block mb-2`}>{icon}</div>
              <p className="text-2xl font-bold">{value ?? 0}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          ))}
        </div>

        {/* Patients */}
        {(section === 'dashboard' || section === 'users') && (
          <div className="bg-white rounded-xl border mb-6">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="font-semibold">Patients</h3>
              <div className="relative">
                <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input type="text" placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)}
                  className="pl-9 pr-3 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 w-48" />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    {['Name', 'Email', 'Age', 'Blood', 'Records', 'Joined', 'Action'].map(h => (
                      <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {patients.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.email?.toLowerCase().includes(search.toLowerCase()))
                    .slice(0, section === 'dashboard' ? 5 : undefined).map(pt => (
                    <tr key={pt.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5 font-medium">
                        {editingPatientId === pt.id ? (
                          <input
                            type="text"
                            value={patientDraft.name ?? ''}
                            onChange={e => setPatientDraft(d => ({ ...d, name: e.target.value }))}
                            className="w-full px-2 py-1 border rounded-lg text-sm"
                          />
                        ) : pt.name}
                      </td>
                      <td className="px-4 py-2.5 text-gray-500">{pt.email}</td>
                      <td className="px-4 py-2.5">
                        {editingPatientId === pt.id ? (
                          <input
                            type="number"
                            value={patientDraft.age ?? ''}
                            onChange={e => setPatientDraft(d => ({ ...d, age: e.target.value ? Number(e.target.value) : null }))}
                            className="w-20 px-2 py-1 border rounded-lg text-sm"
                          />
                        ) : pt.age || '—'}
                      </td>
                      <td className="px-4 py-2.5">
                        {editingPatientId === pt.id ? (
                          <input
                            type="text"
                            value={patientDraft.blood_group ?? ''}
                            onChange={e => setPatientDraft(d => ({ ...d, blood_group: e.target.value }))}
                            className="w-24 px-2 py-1 border rounded-lg text-sm"
                          />
                        ) : pt.blood_group ? <span className="px-1.5 py-0.5 bg-red-50 text-red-700 rounded text-xs">{pt.blood_group}</span> : '—'}
                      </td>
                      <td className="px-4 py-2.5">{pt.record_count ?? 0}</td>
                      <td className="px-4 py-2.5 text-gray-400">{formatDate(pt.created_at)}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-1">
                          {editingPatientId === pt.id ? (
                            <>
                              <button onClick={() => handleSavePatient(pt.id)} disabled={saving}
                                className="p-1.5 text-green-500 hover:text-green-700 hover:bg-green-50 rounded transition-colors">
                                <Save className="h-3.5 w-3.5" />
                              </button>
                              <button onClick={handleCancelPatientEdit} disabled={saving}
                                className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded transition-colors">
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => handleEditPatient(pt)}
                                className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors">
                                <Edit3 className="h-3.5 w-3.5" />
                              </button>
                              <button onClick={() => handleDeletePatient(pt.id)}
                                className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {patients.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No patients yet</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Doctors */}
        {(section === 'dashboard' || section === 'doctors') && (
          <div className="bg-white rounded-xl border mb-6">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between p-5 border-b">
              <div className="flex items-center gap-3">
                <h3 className="font-semibold">Doctors</h3>
                {stats?.pendingDoctors! > 0 && (
                  <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-medium">
                    {stats?.pendingDoctors} pending
                  </span>
                )}
              </div>
              {stats?.pendingDoctors! > 0 && (
                <button onClick={handleVerifyAll}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors">
                  <CheckCircle className="h-4 w-4" /> Verify All Pending
                </button>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    {['Name', 'Specialization', 'Hospital', 'Experience', 'Records', 'Status', 'Actions'].map(h => (
                      <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {doctors.slice(0, section === 'dashboard' ? 5 : undefined).map(doc => (
                    <tr key={doc.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5 font-medium">
                        {editingDoctorId === doc.id ? (
                          <input
                            type="text"
                            value={doctorDraft.name ?? ''}
                            onChange={e => setDoctorDraft(d => ({ ...d, name: e.target.value }))}
                            className="w-full px-2 py-1 border rounded-lg text-sm"
                          />
                        ) : doc.name}
                      </td>
                      <td className="px-4 py-2.5 text-gray-600">
                        {editingDoctorId === doc.id ? (
                          <input
                            type="text"
                            value={doctorDraft.specialization ?? ''}
                            onChange={e => setDoctorDraft(d => ({ ...d, specialization: e.target.value }))}
                            className="w-full px-2 py-1 border rounded-lg text-sm"
                          />
                        ) : doc.specialization || '—'}
                      </td>
                      <td className="px-4 py-2.5 text-gray-500 max-w-xs truncate">
                        {editingDoctorId === doc.id ? (
                          <input
                            type="text"
                            value={doctorDraft.hospital ?? ''}
                            onChange={e => setDoctorDraft(d => ({ ...d, hospital: e.target.value }))}
                            className="w-full px-2 py-1 border rounded-lg text-sm"
                          />
                        ) : doc.hospital || '—'}
                      </td>
                      <td className="px-4 py-2.5">
                        {editingDoctorId === doc.id ? (
                          <input
                            type="number"
                            value={doctorDraft.experience ?? ''}
                            onChange={e => setDoctorDraft(d => ({ ...d, experience: e.target.value ? Number(e.target.value) : 0 }))}
                            className="w-20 px-2 py-1 border rounded-lg text-sm"
                          />
                        ) : doc.experience ? `${doc.experience} yrs` : '—'}
                      </td>
                      <td className="px-4 py-2.5">{doc.record_count ?? 0}</td>
                      <td className="px-4 py-2.5">
                        {doc.verified ? (
                          <span className="flex items-center gap-1 text-xs text-green-700"><CheckCircle className="h-3.5 w-3.5" />Verified</span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-amber-700"><Activity className="h-3.5 w-3.5" />Pending</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-1">
                          {editingDoctorId === doc.id ? (
                            <>
                              <button onClick={() => handleSaveDoctor(doc.id)} disabled={saving}
                                className="p-1.5 text-green-500 hover:text-green-700 hover:bg-green-50 rounded transition-colors">
                                <Save className="h-3.5 w-3.5" />
                              </button>
                              <button onClick={handleCancelDoctorEdit} disabled={saving}
                                className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded transition-colors">
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => handleEditDoctor(doc)}
                                className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors">
                                <Edit3 className="h-3.5 w-3.5" />
                              </button>
                              {doc.verified ? (
                                <button onClick={() => handleVerify(doc.id, false)} title="Revoke"
                                  className="p-1.5 text-amber-500 hover:text-amber-700 hover:bg-amber-50 rounded transition-colors">
                                  <XCircle className="h-3.5 w-3.5" />
                                </button>
                              ) : (
                                <button onClick={() => handleVerify(doc.id, true)} title="Verify"
                                  className="p-1.5 text-green-500 hover:text-green-700 hover:bg-green-50 rounded transition-colors">
                                  <CheckCircle className="h-3.5 w-3.5" />
                                </button>
                              )}
                              <button onClick={() => handleDeleteDoctor(doc.id)}
                                className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {doctors.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No doctors yet</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* QR Logs */}
        {section === 'records' && (
          <div className="bg-white rounded-xl border">
            <div className="p-5 border-b">
              <h3 className="font-semibold">QR Scan Logs</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    {['Patient', 'Scanned By', 'Time'].map(h => (
                      <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {qrLogs.map(log => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5 font-medium">{log.patient_name}</td>
                      <td className="px-4 py-2.5 text-gray-600">{log.doctor_name || 'Unknown'}</td>
                      <td className="px-4 py-2.5 text-gray-400">{new Date(log.scanned_at).toLocaleString()}</td>
                    </tr>
                  ))}
                  {qrLogs.length === 0 && <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-400">No scans yet</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
