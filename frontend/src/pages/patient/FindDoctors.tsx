import { useEffect, useState } from 'react';
import { Search, Stethoscope, MapPin, Award, Clock } from 'lucide-react';
import { api, DoctorProfile } from '../../api';

export default function FindDoctors() {
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [spec, setSpec] = useState('');

  useEffect(() => {
    api.doctor.listAll().then(setDoctors).catch(console.error).finally(() => setLoading(false));
  }, []);

  const specializations = [...new Set(doctors.map(d => d.specialization).filter(Boolean))];

  const filtered = doctors.filter(d =>
    (d.name.toLowerCase().includes(search.toLowerCase()) ||
     d.specialization?.toLowerCase().includes(search.toLowerCase()) ||
     d.hospital?.toLowerCase().includes(search.toLowerCase())) &&
    (!spec || d.specialization === spec)
  );

  if (loading) return <div className="p-8 text-center text-gray-400">Loading doctors…</div>;

  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold">Find Doctors</h1>
          <p className="text-gray-500 mt-1">{doctors.length} verified doctors available</p>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input type="text" placeholder="Search by name, specialization, or hospital…"
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <select value={spec} onChange={e => setSpec(e.target.value)}
            className="px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white">
            <option value="">All Specializations</option>
            {specializations.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl border p-12 text-center">
            <Stethoscope className="h-12 w-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400">No doctors found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map(doc => (
              <div key={doc.id} className="bg-white rounded-xl border p-5 hover:shadow-sm transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold text-lg shrink-0">
                    {doc.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{doc.name}</p>
                    <p className="text-sm text-green-600">{doc.specialization}</p>
                    <p className="text-xs text-gray-400">{doc.qualification}</p>
                    <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                      {doc.hospital && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{doc.hospital}</span>}
                      {doc.experience > 0 && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{doc.experience} yrs exp</span>}
                      <span className="flex items-center gap-1"><Award className="h-3 w-3 text-green-500" />Verified</span>
                    </div>
                    {doc.about && <p className="text-xs text-gray-500 mt-2 line-clamp-2">{doc.about}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
