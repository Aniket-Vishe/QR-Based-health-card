import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Users, ChevronLeft, User, FileText } from 'lucide-react';
import { api, FamilyResponse } from '../../api';

export default function FamilyDetail() {
  const { id } = useParams<{ id: string }>();
  const [family, setFamily] = useState<FamilyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;

    const loadFamily = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await api.family.getFamilyMembers(id);
        setFamily(data);
      } catch (err: any) {
        setError(err.message || 'Could not load family data');
      } finally {
        setLoading(false);
      }
    };

    loadFamily();
  }, [id]);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading family information…</div>;
  if (error) return (
    <div className="p-8 text-center">
      <p className="text-red-500 mb-4">{error}</p>
      <Link to="/doctor/scan-qr" className="text-blue-600 hover:underline">← Back to Scanner</Link>
    </div>
  );

  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Family Records</h1>
            <p className="text-gray-500">Access all family members from the scanned QR code or entered patient ID. Tap a member to view records and add a new visit note.</p>
          </div>
          <Link to="/doctor/scan-qr" className="text-blue-600 hover:underline text-sm">← Scan another QR</Link>
        </div>

        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Users className="h-5 w-5 text-indigo-600" />
                Family group
              </div>
              <div className="mt-2 text-xl font-semibold text-slate-900">{family?.family?.family_name || 'Family group'}</div>
              <div className="mt-1 text-sm text-slate-500">Family ID: <code className="font-mono text-xs bg-slate-100 px-2 py-1 rounded">{id}</code></div>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
              {family?.members.length ?? 0} member{family?.members.length === 1 ? '' : 's'} available
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          {family?.members.length ? family.members.map(member => (
            <Link key={member.id} to={`/doctor/patient/${member.id}`} className="block rounded-3xl border bg-white p-6 shadow-sm hover:border-blue-200 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 text-sm text-slate-500 mb-2">
                    <User className="h-4 w-4 text-slate-400" />
                    <span>{member.gender || 'Unknown'} · {member.age ?? 'N/A'} years</span>
                  </div>
                  <div className="text-lg font-semibold text-slate-900">{member.name}</div>
                  <div className="text-sm text-slate-500">{member.email}</div>
                </div>
                <div className="text-right text-sm text-slate-500">
                  <div>Show records & add visit note</div>
                  <div className="mt-2 font-medium text-slate-700">Open member</div>
                </div>
              </div>
              {member.medical_history?.length ? (
                <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-600">
                  {member.medical_history.map((entry, index) => (
                    <span key={index} className="rounded-full bg-slate-100 px-3 py-1">{entry}</span>
                  ))}
                </div>
              ) : (
                <div className="mt-4 text-sm text-slate-400">No medical history details available.</div>
              )}
            </Link>
          )) : (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
              No family members were found for this group.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
