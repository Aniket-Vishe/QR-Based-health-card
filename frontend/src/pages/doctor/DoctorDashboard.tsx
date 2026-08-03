import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, FileText, QrCode, Clock, AlertCircle } from 'lucide-react';
import { api, DoctorProfile, PatientProfile } from '../../api';
import { useAuth } from '../../context/AuthContext';

export default function DoctorDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [patients, setPatients] = useState<PatientProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.doctor.getProfile(), api.doctor.getMyPatients()])
      .then(([p, pts]) => { setProfile(p); setPatients(pts); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-400">Loading dashboard…</div>;

  const isVerified = profile?.verified;

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {!isVerified && (
          <div className="mb-6 flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
            <p className="text-sm text-amber-800">
              <strong>Account pending verification.</strong> An admin must approve your account before you can add medical records.
            </p>
          </div>
        )}

        <div className="mb-8">
          <h1 className="text-2xl font-semibold">Welcome, {user?.name}!</h1>
          <p className="text-gray-500 mt-1">{profile?.specialization} · {profile?.hospital}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard icon={<Users className="h-6 w-6 text-green-600" />} title="Total Patients" value={patients.length} bg="bg-green-50" />
          <StatCard icon={<FileText className="h-6 w-6 text-blue-600" />} title="Specialization" value={profile?.specialization || '—'} bg="bg-blue-50" />
          <StatCard icon={<Clock className="h-6 w-6 text-purple-600" />} title="Experience" value={`${profile?.experience || 0} yrs`} bg="bg-purple-50" />
          <StatCard icon={<QrCode className="h-6 w-6 text-orange-600" />} title="Status" value={isVerified ? 'Verified ✓' : 'Pending'} bg={isVerified ? 'bg-green-50' : 'bg-amber-50'} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Patients */}
          <div className="bg-white rounded-xl border p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Recent Patients</h3>
              <Link to="/doctor/patients" className="text-sm text-blue-600 hover:underline">View All</Link>
            </div>
            <div className="space-y-3">
              {patients.slice(0, 5).map(pt => (
                <div key={pt.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div>
                    <p className="text-sm font-medium">{pt.name}</p>
                    <p className="text-xs text-gray-500">{pt.age ? `${pt.age} yrs` : '—'} · {pt.blood_group || '—'}</p>
                  </div>
                  <Link to={`/doctor/patient/${pt.id}`} className="text-xs text-blue-600 hover:underline px-2 py-1 rounded">
                    View →
                  </Link>
                </div>
              ))}
              {patients.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-6">No patients yet. Scan a QR code to get started.</p>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gradient-to-br from-green-600 to-blue-600 rounded-xl p-6 text-white">
            <h3 className="font-semibold text-white mb-5">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <Link to="/doctor/scan-qr" className="bg-white/20 hover:bg-white/30 rounded-xl p-5 text-center transition-colors">
                <QrCode className="h-7 w-7 mx-auto mb-2" />
                <p className="text-sm">Scan QR Code</p>
              </Link>
              <Link to="/doctor/patients" className="bg-white/20 hover:bg-white/30 rounded-xl p-5 text-center transition-colors">
                <Users className="h-7 w-7 mx-auto mb-2" />
                <p className="text-sm">All Patients</p>
              </Link>
              <Link to="/doctor/add-record" className="bg-white/20 hover:bg-white/30 rounded-xl p-5 text-center transition-colors">
                <FileText className="h-7 w-7 mx-auto mb-2" />
                <p className="text-sm">Add Record</p>
              </Link>
              <Link to="/doctor/profile" className="bg-white/20 hover:bg-white/30 rounded-xl p-5 text-center transition-colors">
                <Clock className="h-7 w-7 mx-auto mb-2" />
                <p className="text-sm">My Profile</p>
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
          <p className="text-xl font-semibold mt-0.5">{value}</p>
        </div>
      </div>
    </div>
  );
}
