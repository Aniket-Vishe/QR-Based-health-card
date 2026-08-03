import { Link, useNavigate } from 'react-router-dom';
import { QrCode, Users, Brain, Stethoscope, Shield, Clock } from 'lucide-react';
import { useAuth } from './context/AuthContext';
import { useEffect } from 'react';

export default function Landing() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      if (user.role === 'patient') navigate('/dashboard', { replace: true });
      else if (user.role === 'doctor') navigate('/doctor', { replace: true });
      else if (user.role === 'admin') navigate('/admin', { replace: true });
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 p-2 rounded-lg">
                <QrCode className="h-6 w-6 text-white" />
              </div>
              <span className="font-semibold text-xl">HealthCard</span>
            </div>
            <div className="flex gap-3">
              <Link to="/login" className="px-4 py-2 text-blue-600 hover:text-blue-700 transition-colors font-medium">
                Login
              </Link>
              <Link to="/signup" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 py-20 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-medium mb-6 border border-blue-100">
            <Shield className="h-4 w-4" /> Secure · Private · Always Available
          </div>
          <h1 className="text-5xl font-bold mb-6 leading-tight">
            Your Digital Health Card, <span className="text-blue-600">Always Ready</span>
          </h1>
          <p className="text-xl text-gray-500 mb-10">
            Store, manage, and share your medical records securely. Doctors can scan your QR code for instant access in any emergency.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/signup" className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium shadow-sm">
              Create Free Account
            </Link>
            <Link to="/login" className="px-8 py-3 border-2 border-blue-200 text-blue-700 rounded-xl hover:bg-blue-50 transition-colors font-medium">
              Sign In
            </Link>
          </div>
        </div>

        {/* Hero visual */}
        <div className="mt-16">
          <div className="bg-gradient-to-r from-blue-100 to-green-100 rounded-2xl p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-white/40" />
            <div className="relative">
              <QrCode className="h-32 w-32 mx-auto text-blue-600 opacity-30" />
              <p className="mt-4 text-gray-600 font-medium">Emergency Medical Access via QR Code</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 py-20 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center mb-3">Everything You Need</h2>
        <p className="text-center text-gray-500 mb-12">One platform for patients, doctors, and admins.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <FeatureCard icon={<QrCode className="h-8 w-8 text-blue-600" />} title="QR Code Access" description="Unique QR code per patient for instant, secure record access in emergencies." />
          <FeatureCard icon={<Brain className="h-8 w-8 text-purple-600" />} title="AI Health Prediction" description="AI-powered symptom analysis using your actual medical history." />
          <FeatureCard icon={<Stethoscope className="h-8 w-8 text-green-600" />} title="Doctor Portal" description="Doctors scan QR codes, view full history, and add diagnoses and prescriptions." />
          <FeatureCard icon={<Shield className="h-8 w-8 text-blue-600" />} title="Role-Based Access" description="Patients, doctors, and admins each have secure, scoped access." />
          <FeatureCard icon={<Users className="h-8 w-8 text-orange-600" />} title="Admin Control" description="Admins manage users, verify doctors, and monitor all activity." />
          <FeatureCard icon={<Clock className="h-8 w-8 text-green-600" />} title="24/7 Availability" description="Access your health records any time from any device." />
        </div>
      </section>

      {/* How it works */}
      <section className="bg-blue-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <StepCard number="1" title="Create Account" description="Sign up as a patient, or apply as a doctor and get verified by admin." />
            <StepCard number="2" title="Build Your Profile" description="Add your health information — allergies, conditions, and medical history." />
            <StepCard number="3" title="Share Your QR" description="Show your QR code to any doctor for instant, secure access to your records." />
          </div>
        </div>
      </section>

      {/* Three Portals */}
      <section className="max-w-7xl mx-auto px-4 py-20 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center mb-3">Three Portals, One Platform</h2>
        <p className="text-center text-gray-500 mb-12">Each role has a dedicated, fully functional dashboard.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <RoleCard
            color="blue"
            icon={<Users className="h-8 w-8 text-blue-600" />}
            title="Patient Portal"
            description="Manage your health records, view your QR code, use AI prediction, and find verified doctors."
            features={['Unique QR Code', 'Medical Records', 'AI Symptom Analysis', 'Find Verified Doctors']}
            link="/signup"
            buttonLabel="Register as Patient"
          />
          <RoleCard
            color="green"
            icon={<Stethoscope className="h-8 w-8 text-green-600" />}
            title="Doctor Portal"
            description="Scan patient QR codes, access full medical history, and add diagnoses and prescriptions."
            features={['QR Code Scanner', 'Patient History', 'Add Diagnoses', 'Manage Prescriptions']}
            link="/doctor/register"
            buttonLabel="Apply as Doctor"
          />
          <RoleCard
            color="purple"
            icon={<Shield className="h-8 w-8 text-purple-600" />}
            title="Admin Portal"
            description="Manage all users, verify doctors, and monitor platform activity and QR scan logs."
            features={['User Management', 'Doctor Verification', 'QR Scan Logs', 'Platform Analytics']}
            link="/login"
            buttonLabel="Admin Login"
          />
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 py-20 sm:px-6 lg:px-8 text-center">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-12 text-white shadow-lg">
          <h2 className="text-3xl font-bold mb-4 text-white">Ready to Get Started?</h2>
          <p className="text-xl mb-8 text-blue-100">Create your account in under 2 minutes.</p>
          <Link to="/signup" className="inline-block px-8 py-3 bg-white text-blue-600 rounded-xl hover:bg-blue-50 transition-colors font-semibold">
            Create Free Account →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-blue-600 p-2 rounded-lg"><QrCode className="h-5 w-5 text-white" /></div>
                <span className="font-semibold">HealthCard</span>
              </div>
              <p className="text-sm text-gray-500">Secure digital health records for everyone.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-sm">Portals</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><Link to="/signup" className="hover:text-blue-600">Patient Portal</Link></li>
                <li><Link to="/doctor/register" className="hover:text-blue-600">Doctor Portal</Link></li>
                <li><Link to="/login" className="hover:text-blue-600">Admin Portal</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-sm">Account</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><Link to="/login" className="hover:text-blue-600">Login</Link></li>
                <li><Link to="/signup" className="hover:text-blue-600">Sign Up</Link></li>
                <li><Link to="/doctor/register" className="hover:text-blue-600">Doctor Registration</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-sm">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
                <li>HIPAA Compliance</li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2026 HealthCard. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-shadow">
      <div className="mb-4">{icon}</div>
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-gray-500">{description}</p>
    </div>
  );
}

function StepCard({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 text-white rounded-full mb-4 text-2xl font-bold">{number}</div>
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-gray-500">{description}</p>
    </div>
  );
}

function RoleCard({ color, icon, title, description, features, link, buttonLabel }: {
  color: 'blue' | 'green' | 'purple';
  icon: React.ReactNode;
  title: string;
  description: string;
  features: string[];
  link: string;
  buttonLabel: string;
}) {
  const colorMap = {
    blue:   { bg: 'bg-blue-50',   border: 'border-blue-200',   btn: 'bg-blue-600 hover:bg-blue-700',     dot: 'bg-blue-500'   },
    green:  { bg: 'bg-green-50',  border: 'border-green-200',  btn: 'bg-green-600 hover:bg-green-700',   dot: 'bg-green-500'  },
    purple: { bg: 'bg-purple-50', border: 'border-purple-200', btn: 'bg-purple-600 hover:bg-purple-700', dot: 'bg-purple-500' },
  };
  const c = colorMap[color];
  return (
    <div className={`${c.bg} border ${c.border} rounded-xl p-6 flex flex-col`}>
      <div className="mb-4">{icon}</div>
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-gray-600 mb-4 flex-1">{description}</p>
      <ul className="space-y-2 mb-6">
        {features.map((f) => (
          <li key={f} className="flex items-center gap-2 text-sm">
            <div className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
            {f}
          </li>
        ))}
      </ul>
      <Link to={link} className={`w-full py-2 ${c.btn} text-white rounded-lg transition-colors text-sm font-medium text-center`}>
        {buttonLabel}
      </Link>
    </div>
  );
}
