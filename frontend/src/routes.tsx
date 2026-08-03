import { createBrowserRouter, Navigate } from 'react-router-dom';
import Landing from './Landing';
import UserLayout from './UserLayout';
import DoctorLayout from './DoctorLayout';
import AdminLayout from './AdminLayout';

// Auth pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import DoctorRegister from './pages/auth/DoctorRegister';

// Patient pages
import PatientDashboard from './pages/patient/PatientDashboard';
import MedicalRecords from './pages/patient/MedicalRecords';
import QRCodePage from './pages/patient/QRCodePage';
import AIPrediction from './pages/patient/AIPrediction';
import FindDoctors from './pages/patient/FindDoctors';
import PatientProfile from './pages/patient/PatientProfile';
import FamilyManagement from './pages/patient/FamilyManagement';
import FamilyMemberDetail from './pages/patient/FamilyMemberDetail';

// Doctor pages
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import ScanQR from './pages/doctor/ScanQR';
import DoctorPatients from './pages/doctor/DoctorPatients';
import PatientDetail from './pages/doctor/PatientDetail';
import FamilyDetail from './pages/doctor/FamilyDetail';
import DoctorProfilePage from './pages/doctor/DoctorProfilePage';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';

export const router = createBrowserRouter([
  { path: '/', Component: Landing },
  { path: '/login', Component: Login },
  { path: '/signup', Component: Register },
  { path: '/doctor/register', Component: DoctorRegister },

  // Patient routes
  {
    path: '/dashboard',
    Component: UserLayout,
    children: [
      { index: true, Component: PatientDashboard },
      { path: 'records', Component: MedicalRecords },
      { path: 'qr-code', Component: QRCodePage },
      { path: 'ai-prediction', Component: AIPrediction },
      { path: 'doctors', Component: FindDoctors },
      { path: 'family', Component: FamilyManagement },
      { path: 'family/:id', Component: FamilyMemberDetail },
      { path: 'profile', Component: PatientProfile },
    ],
  },

  // Doctor routes
  {
    path: '/doctor',
    Component: DoctorLayout,
    children: [
      { index: true, element: <Navigate to="/doctor/dashboard" replace /> },
      { path: 'dashboard', Component: DoctorDashboard },
      { path: 'scan-qr', Component: ScanQR },
      { path: 'patients', Component: DoctorPatients },
      { path: 'patient/:id', Component: PatientDetail },
      { path: 'family/:id', Component: FamilyDetail },
      { path: 'profile', Component: DoctorProfilePage },
    ],
  },

  // Admin routes
  {
    path: '/admin',
    Component: AdminLayout,
    children: [
      { index: true, element: <Navigate to="/admin/dashboard" replace /> },
      { path: 'dashboard', Component: AdminDashboard },
      { path: 'users', Component: AdminDashboard },
      { path: 'doctors', Component: AdminDashboard },
      { path: 'records', Component: AdminDashboard },
    ],
  },

  {
    path: '*',
    element: (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-8xl font-bold text-gray-200 mb-4">404</div>
          <h1 className="text-2xl mb-2">Page Not Found</h1>
          <a href="/" className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-block mt-4">
            Go Home
          </a>
        </div>
      </div>
    ),
  },
]);
