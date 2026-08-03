import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, FileText, AlertTriangle, Activity, QrCode, Brain, Stethoscope } from 'lucide-react';
import { api, PatientProfile, MedicalRecord, FamilyResponse } from '../../api';
import { useAuth } from '../../context/AuthContext';

export default function PatientDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [family, setFamily] = useState<FamilyResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.patient.getProfile(), api.patient.getRecords(), api.family.getMyFamily()])
      .then(([p, r, f]) => { setProfile(p); setRecords(r); setFamily(f); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-400">Loading dashboard…</div>;

  const recentRecords = records.slice(0, 3);

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold">Welcome, {user?.name}!</h1>
          <p className="text-gray-500 mt-1">Here's an overview of your health records</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard icon={<FileText className="h-6 w-6 text-green-600" />} title="Medical Records" value={records.length} bg="bg-green-50" />
          <StatCard icon={<AlertTriangle className="h-6 w-6 text-red-600" />} title="Allergies" value={profile?.allergies?.length ?? 0} bg="bg-red-50" />
          <StatCard icon={<Activity className="h-6 w-6 text-purple-600" />} title="Conditions" value={profile?.chronic_diseases?.length ?? 0} bg="bg-purple-50" />
          <StatCard icon={<Users className="h-6 w-6 text-blue-600" />} title="Blood Group" value={profile?.blood_group || '—'} bg="bg-blue-50" />
          <StatCard icon={<Users className="h-6 w-6 text-blue-600" />} title="Family Members" value={family?.members.length ?? 0} bg="bg-indigo-50" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Profile Summary */}
          <div className="bg-white rounded-xl border p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">My Health Profile</h3>
              <Link to="/dashboard/profile" className="text-sm text-blue-600 hover:underline">Edit</Link>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Age', value: profile?.age ? `${profile.age} years` : '—' },
                { label: 'Gender', value: profile?.gender || '—' },
                { label: 'Blood Group', value: profile?.blood_group || '—' },
                { label: 'Emergency Contact', value: profile?.emergency_contact || '—' },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-500">{label}</span>
                  <span className="text-sm font-medium">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Records */}
          <div className="bg-white rounded-xl border p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Recent Records</h3>
              <Link to="/dashboard/records" className="text-sm text-blue-600 hover:underline">View All</Link>
            </div>
            <div className="space-y-3">
              {recentRecords.length > 0 ? recentRecords.map(rec => (
                <div key={rec.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-sm font-medium">{rec.diagnosis}</p>
                    <span className="text-xs text-gray-400">{rec.visit_date}</span>
                  </div>
                  <p className="text-xs text-blue-600">{rec.doctor_user_name}</p>
                  {rec.prescription && <p className="text-xs text-gray-500 mt-1">Rx: {rec.prescription}</p>}
                </div>
              )) : (
                <p className="text-sm text-gray-400 text-center py-6">No medical records yet</p>
              )}
            </div>
          </div>

          {/* Allergies & Conditions */}
          {(profile?.allergies?.length! > 0 || profile?.chronic_diseases?.length! > 0) && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
              <div className="flex gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  {profile?.allergies?.length! > 0 && (
                    <>
                      <h3 className="font-semibold text-red-900 mb-2">Allergies</h3>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {profile!.allergies.map((a, i) => (
                          <span key={i} className="px-3 py-1 bg-white text-red-900 border border-red-200 rounded-full text-xs">{a}</span>
                        ))}
                      </div>
                    </>
                  )}
                  {profile?.chronic_diseases?.length! > 0 && (
                    <>
                      <h3 className="font-semibold text-red-900 mb-2">Chronic Conditions</h3>
                      <div className="flex flex-wrap gap-2">
                        {profile!.chronic_diseases.map((d, i) => (
                          <span key={i} className="px-3 py-1 bg-white text-red-900 border border-red-200 rounded-full text-xs">{d}</span>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-white rounded-xl border p-6">
            <h3 className="font-semibold mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <Link to="/dashboard/qr-code" className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg text-center transition-colors">
                <QrCode className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                <p className="text-sm text-blue-900">My QR Code</p>
              </Link>
              <Link to="/dashboard/ai-prediction" className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg text-center transition-colors">
                <Brain className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                <p className="text-sm text-purple-900">AI Prediction</p>
              </Link>
              <Link to="/dashboard/doctors" className="p-4 bg-green-50 hover:bg-green-100 rounded-lg text-center transition-colors">
                <Stethoscope className="h-6 w-6 text-green-600 mx-auto mb-2" />
                <p className="text-sm text-green-900">Find Doctors</p>
              </Link>
              <Link to="/dashboard/records" className="p-4 bg-orange-50 hover:bg-orange-100 rounded-lg text-center transition-colors">
                <FileText className="h-6 w-6 text-orange-600 mx-auto mb-2" />
                <p className="text-sm text-orange-900">All Records</p>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, title, value, bg }: { icon: React.ReactNode; title: string; value: number | string; bg: string }) {
  return (
    <div className="bg-white rounded-xl border p-6">
      <div className="flex items-center gap-3">
        <div className={`p-3 rounded-lg ${bg}`}>{icon}</div>
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-semibold mt-0.5">{value}</p>
        </div>
      </div>
    </div>
  );
}
