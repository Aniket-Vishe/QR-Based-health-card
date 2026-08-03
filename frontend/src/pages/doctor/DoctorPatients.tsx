import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Search, Calendar } from 'lucide-react';
import { api, PatientProfile } from '../../api';

export default function DoctorPatients() {
  const [patients, setPatients] = useState<PatientProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.doctor.getMyPatients().then(setPatients).catch(console.error).finally(() => setLoading(false));
  }, []);

  const filtered = patients.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="p-8 text-center text-gray-400">Loading patients…</div>;

  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold">My Patients</h1>
          <p className="text-gray-500 mt-1">{patients.length} patient{patients.length !== 1 ? 's' : ''}</p>
        </div>

        <div className="relative mb-6">
          <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input type="text" placeholder="Search patients…" value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl border p-12 text-center">
            <Users className="h-12 w-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 mb-4">{patients.length === 0 ? 'No patients yet' : 'No patients match your search'}</p>
            {patients.length === 0 && (
              <Link to="/doctor/scan-qr" className="inline-block px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm">
                Scan a QR Code →
              </Link>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['Patient', 'Age / Gender', 'Blood Group', 'Last Visit', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map(pt => (
                  <tr key={pt.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-semibold text-sm shrink-0">
                          {pt.name[0]}
                        </div>
                        <div>
                          <p className="font-medium">{pt.name}</p>
                          <p className="text-xs text-gray-400">{pt.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {pt.age ? `${pt.age} yrs` : '—'} · {pt.gender || '—'}
                    </td>
                    <td className="px-4 py-3">
                      {pt.blood_group ? (
                        <span className="px-2 py-0.5 bg-red-50 text-red-700 border border-red-100 rounded text-xs font-medium">{pt.blood_group}</span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{(pt as any).last_visit || '—'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Link to={`/doctor/patient/${pt.id}`} className="text-xs text-blue-600 hover:underline font-medium">
                        View Profile →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
