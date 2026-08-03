import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { User, ChevronLeft, FileText, AlertTriangle } from 'lucide-react';
import { api, FamilyMember, MedicalRecord } from '../../api';

export default function FamilyMemberDetail() {
  const { id } = useParams<{ id: string }>();
  const [member, setMember] = useState<FamilyMember | null>(null);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;

    const loadMemberData = async () => {
      setLoading(true);
      setError('');
      try {
        const familyData = await api.family.getMyFamily();
        const memberData = familyData.members.find(m => m.id === id);
        if (!memberData) {
          setError('Family member not found');
          return;
        }
        setMember(memberData);
        
        const memberRecords = memberData.medical_records || [];
        setRecords(memberRecords.sort((a, b) => {
          const aTime = new Date(a.visit_date).getTime();
          const bTime = new Date(b.visit_date).getTime();
          return bTime - aTime;
        }));
      } catch (err: any) {
        setError(err.message || 'Could not load family member data');
      } finally {
        setLoading(false);
      }
    };

    loadMemberData();
  }, [id]);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading member profile…</div>;
  if (error) return (
    <div className="p-8 text-center">
      <p className="text-red-500 mb-4">{error}</p>
      <Link to="/dashboard/family" className="text-blue-600 hover:underline">← Back to Family</Link>
    </div>
  );

  if (!member) return (
    <div className="p-8 text-center">
      <p className="text-gray-500 mb-4">Member not found</p>
      <Link to="/dashboard/family" className="text-blue-600 hover:underline">← Back to Family</Link>
    </div>
  );

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <Link to="/dashboard/family" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ChevronLeft className="h-4 w-4" /> Back to Family
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Member Info Sidebar */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-lg">
                  {member.name[0]}
                </div>
                <div>
                  <p className="font-semibold">{member.name}</p>
                  <p className="text-xs text-gray-500">{member.email}</p>
                </div>
              </div>
              <div className="space-y-2">
                {[
                  { l: 'Age', v: member.age ? `${member.age} years` : '—' },
                  { l: 'Gender', v: member.gender || '—' },
                  { l: 'Blood Group', v: member.blood_group || '—' },
                  { l: 'Emergency', v: member.emergency_contact || '—' },
                ].map(({ l, v }) => (
                  <div key={l} className="flex justify-between text-sm">
                    <span className="text-gray-500">{l}</span>
                    <span className="font-medium">{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {member.medical_history?.length ? (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">Medical History</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {member.medical_history.map((h, i) => (
                    <span key={i} className="px-2 py-0.5 bg-white text-blue-800 border border-blue-200 rounded text-xs">{h}</span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          {/* Medical Records */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Medical Records ({records.length})</h3>
            </div>

            <div className="space-y-3">
              {records.length === 0 ? (
                <div className="bg-white rounded-xl border p-8 text-center">
                  <FileText className="h-10 w-10 text-gray-200 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">No medical records yet. Doctors will add records here when they visit.</p>
                </div>
              ) : records.map(rec => (
                <div key={rec.id} className="bg-white rounded-xl border p-4">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-medium">{rec.diagnosis}</p>
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      {rec.visit_date}
                    </span>
                  </div>
                  {rec.prescription && <p className="text-sm text-gray-600"><span className="font-medium">Rx:</span> {rec.prescription}</p>}
                  {rec.notes && <p className="text-sm text-gray-500 mt-1">{rec.notes}</p>}
                  {rec.doctor_user_name && <p className="text-xs text-gray-400 mt-2">By {rec.doctor_user_name}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
