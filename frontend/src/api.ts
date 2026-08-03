import { auth } from './firebaseConfig';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

async function getToken(): Promise<string | null> {
  // Force-refresh the token when a Firebase user exists so we never send an expired ID token.
  if (auth.currentUser) {
    try {
      return await auth.currentUser.getIdToken(true);
    } catch (error) {
      console.warn('Failed to get fresh ID token:', error);
    }
  }
  
  // Fallback to stored token for cases where auth.currentUser is not available.
  return localStorage.getItem('hc_id_token');
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  requiresAuth = true
): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (requiresAuth) {
    const token = await getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data as T;
  } catch (err: any) {
    // Re-throw with better error message
    if (err instanceof SyntaxError) {
      throw new Error('Server returned invalid response');
    }
    if (err instanceof TypeError) {
      throw new Error('Failed to connect to server. Please ensure the backend is running on http://localhost:5000');
    }
    throw err;
  }
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export const api = {
  auth: {
    login: async (email: string, password: string) => {
      // Firebase Auth handles login, backend /auth/me will be called by AuthContext
      return { message: 'Login successful' };
    },
    register: async (data: RegisterData) => {
      // Firebase Auth handles registration, backend will create user document
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      await updateProfile(userCredential.user, { displayName: data.name });
      
      // Force-refresh the token and store it locally for protected requests
      const idToken = await userCredential.user.getIdToken(true);
      localStorage.setItem('hc_id_token', idToken);
      
      // Call backend to create user document with authorization header
      const response = await request<{ user: User }>('POST', '/auth/register', {
        ...data,
      }, true);
      
      return response;
    },
    registerDoctor: async (data: DoctorRegisterData) => {
      // Firebase Auth handles registration, backend will create doctor document
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      await updateProfile(userCredential.user, { displayName: data.name });
      
      const idToken = await userCredential.user.getIdToken(true);
      localStorage.setItem('hc_id_token', idToken);
      
      // Call backend to create doctor document with authorization header
      return request<{ message: string }>('POST', '/auth/register-doctor', {
        ...data,
      }, true);
    },
    me: () => request<User>('GET', '/auth/me'),
  },

  patient: {
    getProfile: () => request<PatientProfile>('GET', '/patients/me'),
    updateProfile: (data: Partial<PatientProfile>) =>
      request<PatientProfile>('PUT', '/patients/me', data),
    getRecords: () => request<MedicalRecord[]>('GET', '/patients/me/records'),
    getQR: () => request<{ patientId: string; qrPayload: string }>('GET', '/patients/me/qr'),
    getById: (id: string) => request<PatientProfile>('GET', `/patients/${id}`),
    getRecordsById: (id: string) => request<MedicalRecord[]>('GET', `/patients/${id}/records`),
  },

  doctor: {
    getProfile: () => request<DoctorProfile>('GET', '/doctors/me'),
    updateProfile: (data: Partial<DoctorProfile>) =>
      request<DoctorProfile>('PUT', '/doctors/me', data),
    getMyPatients: () => request<PatientProfile[]>('GET', '/doctors/me/patients'),
    addRecord: (data: NewRecord) => request<MedicalRecord>('POST', '/doctors/records', data),
    listAll: () => request<DoctorProfile[]>('GET', '/doctors'),
  },

  family: {
    getMyFamily: () => request<FamilyResponse>('GET', '/families/me'),
    createFamily: (family_name: string) => request<Family>('POST', '/families', { family_name }, true),
    addMember: (familyId: string, data: NewFamilyMember) =>
      request<FamilyMember>('POST', `/families/${familyId}/members`, data),
    getFamilyMembers: (familyId: string) => request<FamilyResponse>('GET', `/families/${familyId}/members`),
    getFamilyQRCode: (familyId: string) => request<{ familyId: string; qrPayload: string }>('GET', `/families/${familyId}/qr`),
  },

  admin: {
    getStats: () => request<AdminStats>('GET', '/admin/stats'),
    getPatients: () => request<PatientProfile[]>('GET', '/admin/patients'),
    updatePatient: (id: string, data: Partial<PatientProfile>) => request<PatientProfile>('PUT', `/admin/patients/${id}`, data),
    deletePatient: (id: string) => request<void>('DELETE', `/admin/patients/${id}`),
    getDoctors: () => request<DoctorProfile[]>('GET', '/admin/doctors'),
    updateDoctor: (id: string, data: Partial<DoctorProfile>) => request<DoctorProfile>('PUT', `/admin/doctors/${id}`, data),
    verifyDoctor: (id: string, verified: boolean) =>
      request<void>('PUT', `/admin/doctors/${id}/verify`, { verified }),
    verifyAllDoctors: () => request<void>('PUT', '/admin/doctors/verify-all', { verified: true }),
    deleteDoctor: (id: string) => request<void>('DELETE', `/admin/doctors/${id}`),
    getQRLogs: () => request<QRLog[]>('GET', '/admin/qr-logs'),
    getRecords: () => request<MedicalRecord[]>('GET', '/admin/records'),
  },
};

// ── Types ─────────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'patient' | 'doctor' | 'admin';
  patientId?: string;
  doctorId?: string;
  familyId?: string;
  familyName?: string;
  verified?: boolean;
}

export interface PatientProfile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  age: number | null;
  gender: string | null;
  contact?: string | null;
  medical_history: string[];
  family_id?: string;
  family_name?: string;
  blood_group: string | null;
  emergency_contact: string | null;
  allergies: string[];
  chronic_diseases: string[];
  qr_code?: string;
  created_at: string;
  record_count?: number;
}

export interface Family {
  familyId: string;
  family_name: string;
}

export interface FamilyMember {
  id: string;
  user_id: string;
  name: string;
  email: string;
  age: number | null;
  gender: string | null;
  contact: string | null;
  medical_history: string[];
  blood_group: string | null;
  emergency_contact: string | null;
  medical_records?: MedicalRecord[];
}

export interface FamilyResponse {
  family: {
    id: string;
    family_name: string;
  } | null;
  members: FamilyMember[];
}

export interface NewFamilyMember {
  name: string;
  email: string;
  password: string;
  age?: number;
  gender?: string;
  contact?: string;
  medical_history?: string | string[];
}

export interface DoctorProfile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  specialization: string;
  qualification: string;
  experience: number;
  hospital: string;
  about: string;
  verified: boolean;
  created_at: string;
  record_count?: number;
}

export interface MedicalRecord {
  id: string;
  patient_id: string;
  doctor_id: string;
  doctor_user_name: string;
  doctor_name?: string;
  specialization?: string;
  diagnosis: string;
  prescription: string;
  notes: string;
  visit_date: string;
  created_at: string;
}

export interface AdminStats {
  totalPatients: number;
  totalDoctors: number;
  verifiedDoctors: number;
  pendingDoctors: number;
  totalRecords: number;
  totalScans: number;
}

export interface QRLog {
  id: string;
  patient_id: string;
  patient_name: string;
  doctor_name: string;
  scanned_at: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  age?: number;
  gender?: string;
  blood_group?: string;
  emergency_contact?: string;
}

export interface DoctorRegisterData {
  name: string;
  email: string;
  password: string;
  specialization?: string;
  qualification?: string;
  experience?: number;
  hospital?: string;
  about?: string;
}

export interface AdminRegisterData {
  name: string;
  email: string;
  password: string;
  organization?: string;
  role_description?: string;
}

export interface NewRecord {
  patient_id: string;
  diagnosis: string;
  prescription?: string;
  notes?: string;
  visit_date?: string;
}
