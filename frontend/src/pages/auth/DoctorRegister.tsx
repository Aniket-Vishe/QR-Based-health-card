import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Stethoscope, AlertCircle, CheckCircle } from 'lucide-react';
import { api } from '../../api';

export default function DoctorRegister() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    specialization: '', qualification: '', experience: '',
    hospital: '', about: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await api.auth.registerDoctor({
        name: form.name, email: form.email, password: form.password,
        specialization: form.specialization, qualification: form.qualification,
        experience: form.experience ? parseInt(form.experience) : undefined,
        hospital: form.hospital, about: form.about,
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border p-10 text-center max-w-md w-full">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold mb-2">Application Submitted!</h2>
          <p className="text-gray-500 mb-6">Your doctor account is pending admin verification. You'll be able to log in once approved.</p>
          <Link to="/login" className="inline-block px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="bg-green-600 p-3 rounded-xl">
              <Stethoscope className="h-7 w-7 text-white" />
            </div>
            <span className="font-bold text-2xl text-gray-900">HealthCard</span>
          </Link>
          <p className="text-gray-500 mt-2">Doctor Registration</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
                <AlertCircle className="h-4 w-4 shrink-0" />{error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input type="text" value={form.name} onChange={update('name')} required
                  className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input type="email" value={form.email} onChange={update('email')} required
                  className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                <input type="password" value={form.password} onChange={update('password')} required
                  className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm *</label>
                <input type="password" value={form.confirmPassword} onChange={update('confirmPassword')} required
                  className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
            </div>

            <div className="border-t pt-4">
              <p className="text-sm font-medium text-gray-700 mb-3">Professional Information</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Specialization</label>
                  <input type="text" value={form.specialization} onChange={update('specialization')} placeholder="e.g. Cardiology"
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Qualification</label>
                  <input type="text" value={form.qualification} onChange={update('qualification')} placeholder="e.g. MD, MBBS"
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Experience (years)</label>
                  <input type="number" value={form.experience} onChange={update('experience')} min="0"
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Hospital / Clinic</label>
                  <input type="text" value={form.hospital} onChange={update('hospital')}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm text-gray-600 mb-1">About</label>
                  <textarea value={form.about} onChange={update('about')} rows={3}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" />
                </div>
              </div>
            </div>

            <div className="bg-amber-50 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-700">Your account requires admin verification before you can access the doctor portal.</p>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition-colors">
              {loading ? 'Submitting…' : 'Submit Application'}
            </button>
          </form>

          <div className="mt-5 text-center text-sm text-gray-500">
            Already registered? <Link to="/login" className="text-green-600 hover:underline font-medium">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
