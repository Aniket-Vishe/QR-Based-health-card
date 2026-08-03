# HealthCard — Full-Stack Healthcare Application

A production-ready healthcare platform with three role-based portals:
**Patient**, **Doctor**, and **Admin** — all fully connected to a real backend with SQLite database.

---

## 🗂️ Project Structure

```
healthcard/
├── backend/                  # Node.js + Express + SQLite API
│   ├── src/
│   │   ├── index.js          # Express server entry point
│   │   ├── db/
│   │   │   ├── database.js   # SQLite schema & connection
│   │   │   └── seed.js       # Seeds demo accounts
│   │   ├── middleware/
│   │   │   └── auth.js       # JWT auth + RBAC middleware
│   │   └── routes/
│   │       ├── auth.js       # Login, register endpoints
│   │       ├── patients.js   # Patient CRUD + QR
│   │       ├── doctors.js    # Doctor CRUD + records
│   │       └── admin.js      # Admin management endpoints
│   └── package.json
│
└── frontend/                 # React + TypeScript + Tailwind
    └── src/
        ├── api.ts            # Central API client (all fetch calls)
        ├── context/
        │   └── AuthContext.tsx   # Global auth state (JWT)
        ├── pages/
        │   ├── auth/
        │   │   ├── Login.tsx
        │   │   ├── Register.tsx         # Patient registration
        │   │   └── DoctorRegister.tsx   # Doctor application
        │   ├── patient/
        │   │   ├── PatientDashboard.tsx
        │   │   ├── MedicalRecords.tsx
        │   │   ├── QRCodePage.tsx
        │   │   ├── AIPrediction.tsx
        │   │   ├── FindDoctors.tsx
        │   │   └── PatientProfile.tsx
        │   ├── doctor/
        │   │   ├── DoctorDashboard.tsx
        │   │   ├── ScanQR.tsx           # Camera QR scanner + ID lookup
        │   │   ├── DoctorPatients.tsx
        │   │   ├── PatientDetail.tsx    # View + add records
        │   │   └── DoctorProfilePage.tsx
        │   └── admin/
        │       └── AdminDashboard.tsx   # Manage patients, doctors, QR logs
        ├── UserLayout.tsx    # Patient sidebar layout
        ├── DoctorLayout.tsx  # Doctor sidebar layout
        ├── AdminLayout.tsx   # Admin sidebar layout
        ├── Landing.tsx       # Public landing page
        ├── routes.tsx        # React Router config
        └── App.tsx           # Root with AuthProvider
```

---

## 🗄️ Database Schema

SQLite database at `backend/data/healthcard.db`

```sql
users           (id, name, email, password, role, created_at)
patients        (id, user_id, age, gender, blood_group, emergency_contact,
                 allergies JSON, chronic_diseases JSON, qr_code, created_at)
doctors         (id, user_id, specialization, qualification, experience,
                 hospital, about, verified, created_at)
medical_records (id, patient_id, doctor_id, doctor_name, diagnosis,
                 prescription, notes, visit_date, created_at)
qr_scan_logs    (id, patient_id, scanned_by, scanned_at)
```

---

## ⚡ Quick Start

### Prerequisites
- **Node.js** v18+ 
- **npm** or **pnpm**

---

### 1. Backend Setup

```bash
cd healthcard/backend
npm install

# Seed the database with demo accounts
npm run seed

# Start the API server (port 5000)
npm run dev
```

API will be running at: `http://localhost:5000`

---

### 2. Frontend Setup

```bash
cd healthcard/frontend
npm install

# Start the dev server (port 5173)
npm run dev
```

Frontend will be running at: `http://localhost:5173`

---

## 🔑 Demo Accounts

After running `npm run seed` in the backend:

| Role    | Email                     | Password     |
|---------|---------------------------|--------------|
| Patient | patient@healthcard.app    | patient123   |
| Doctor  | doctor@healthcard.app     | doctor123    |
| Admin   | admin@healthcard.app      | admin123     |

> The login page also has quick-fill buttons for these accounts.

---

## 🚀 API Endpoints

### Auth (`/api/auth`)
| Method | Path                  | Description              | Auth     |
|--------|-----------------------|--------------------------|----------|
| POST   | `/login`              | Login (all roles)        | Public   |
| POST   | `/register`           | Patient registration     | Public   |
| POST   | `/register-doctor`    | Doctor application       | Public   |
| GET    | `/me`                 | Get current user         | Bearer   |

### Patient (`/api/patients`)
| Method | Path            | Description                  | Role     |
|--------|-----------------|------------------------------|----------|
| GET    | `/me`           | Own profile                  | Patient  |
| PUT    | `/me`           | Update profile               | Patient  |
| GET    | `/me/records`   | Own medical records          | Patient  |
| GET    | `/me/qr`        | Own QR code (base64)         | Patient  |
| GET    | `/:id`          | Get patient by ID (logs scan)| Doctor/Admin |
| GET    | `/:id/records`  | Get patient records          | Doctor/Admin |

### Doctor (`/api/doctors`)
| Method | Path              | Description              | Role     |
|--------|-------------------|--------------------------|----------|
| GET    | `/`               | List verified doctors    | Any auth |
| GET    | `/me`             | Own doctor profile       | Doctor   |
| PUT    | `/me`             | Update profile           | Doctor   |
| GET    | `/me/patients`    | Patients I've treated    | Doctor   |
| POST   | `/records`        | Add medical record       | Doctor (verified) |

### Admin (`/api/admin`)
| Method | Path                        | Description           | Role  |
|--------|-----------------------------|-----------------------|-------|
| GET    | `/stats`                    | Platform statistics   | Admin |
| GET    | `/patients`                 | All patients          | Admin |
| DELETE | `/patients/:id`             | Delete patient        | Admin |
| GET    | `/doctors`                  | All doctors           | Admin |
| PUT    | `/doctors/:id/verify`       | Verify/unverify       | Admin |
| DELETE | `/doctors/:id`              | Delete doctor         | Admin |
| GET    | `/qr-logs`                  | QR scan history       | Admin |
| GET    | `/records`                  | All medical records   | Admin |

---

## 🔐 Security

- **Passwords**: bcrypt hashed (10 salt rounds)
- **JWT tokens**: 7-day expiry, stored in localStorage
- **RBAC**: Every protected route checks role via middleware
- **QR codes**: Contain only `patientId` — no personal data exposed
- **Doctor verification**: Doctors cannot add records until admin verifies them
- **Data isolation**: Patients can only see their own data

---

## 📱 QR Code System

1. **Generation**: On patient registration, a QR code is generated containing:
   ```json
   { "patientId": "<uuid>", "type": "healthcard_patient" }
   ```
2. **Patient**: Views and downloads their QR from `/dashboard/qr-code`
3. **Doctor**: Scans with camera (html5-qrcode) or enters Patient ID manually at `/doctor/scan-qr`
4. **On scan**: Doctor is redirected to `/doctor/patient/:id` — full profile + records
5. **Logging**: Every QR access is logged in `qr_scan_logs` table

---

## ✅ Modified / New Files vs Original

### Backend (all new)
- `backend/package.json`
- `backend/src/index.js`
- `backend/src/db/database.js`
- `backend/src/db/seed.js`
- `backend/src/middleware/auth.js`
- `backend/src/routes/auth.js`
- `backend/src/routes/patients.js`
- `backend/src/routes/doctors.js`
- `backend/src/routes/admin.js`

### Frontend (new pages)
- `src/api.ts` — replaces all mockData imports
- `src/context/AuthContext.tsx` — replaces `setCurrentUser` / `getCurrentUser`
- `src/pages/auth/Login.tsx`
- `src/pages/auth/Register.tsx`
- `src/pages/auth/DoctorRegister.tsx`
- `src/pages/patient/PatientDashboard.tsx` — replaces `Dashboard.tsx`
- `src/pages/patient/MedicalRecords.tsx`
- `src/pages/patient/QRCodePage.tsx`
- `src/pages/patient/AIPrediction.tsx`
- `src/pages/patient/FindDoctors.tsx`
- `src/pages/patient/PatientProfile.tsx`
- `src/pages/doctor/DoctorDashboard.tsx` — replaces `DoctorDashboard.tsx`
- `src/pages/doctor/ScanQR.tsx`
- `src/pages/doctor/DoctorPatients.tsx`
- `src/pages/doctor/PatientDetail.tsx`
- `src/pages/doctor/DoctorProfilePage.tsx`
- `src/pages/admin/AdminDashboard.tsx` — replaces `AdminDashboard.tsx`

### Frontend (updated)
- `src/App.tsx` — wraps with `<AuthProvider>`
- `src/routes.tsx` — all real routes, no `ComingSoon`
- `src/Landing.tsx` — demo buttons removed, real nav links
- `src/UserLayout.tsx` — uses `useAuth()` instead of `getCurrentUser()`
- `src/DoctorLayout.tsx` — same
- `src/AdminLayout.tsx` — same

### Deleted (no longer needed)
- `mockData.ts` — entirely replaced by backend API + `api.ts`
