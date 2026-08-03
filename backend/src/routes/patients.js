const express = require('express');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { admin, db } = require('../firebaseAdmin');

const router = express.Router();

async function buildPatientResponse(patientSnapshot) {
  const patient = patientSnapshot.data();
  if (!patient) return null;
  const userSnapshot = await db.collection('users').doc(patient.user_id).get();
  const familySnapshot = patient.family_id ? await db.collection('families').doc(patient.family_id).get() : null;
  return {
    ...patient,
    name: userSnapshot.exists ? userSnapshot.data().name : undefined,
    email: userSnapshot.exists ? userSnapshot.data().email : undefined,
    familyName: familySnapshot?.exists ? familySnapshot.data().family_name : undefined,
  };
}

// GET /api/patients/me � get own profile
router.get('/me', authMiddleware, requireRole('patient'), async (req, res) => {
  try {
    const patientQuery = await db.collection('patients').where('user_id', '==', req.user.uid).limit(1).get();
    if (patientQuery.empty) return res.status(404).json({ error: 'Patient profile not found' });
    const patient = await buildPatientResponse(patientQuery.docs[0]);
    if (!patient) return res.status(404).json({ error: 'Patient profile not found' });
    res.json(patient);
  } catch (error) {
    console.error('Fetch patient profile failed', error);
    res.status(500).json({ error: 'Could not load profile' });
  }
});

// PUT /api/patients/me � update own profile
router.put('/me', authMiddleware, requireRole('patient'), async (req, res) => {
  const { age, gender, blood_group, emergency_contact, allergies, chronic_diseases, contact, medical_history } = req.body;

  try {
    const patientQuery = await db.collection('patients').where('user_id', '==', req.user.uid).limit(1).get();
    if (patientQuery.empty) return res.status(404).json({ error: 'Patient profile not found' });

    const patientRef = patientQuery.docs[0].ref;
    const updates = {};
    if (age !== undefined) updates.age = age;
    if (gender !== undefined) updates.gender = gender;
    if (blood_group !== undefined) updates.blood_group = blood_group;
    if (emergency_contact !== undefined) updates.emergency_contact = emergency_contact;
    if (contact !== undefined) updates.contact = contact;
    if (medical_history !== undefined) updates.medical_history = Array.isArray(medical_history) ? medical_history : updates.medical_history;
    if (allergies !== undefined) updates.allergies = Array.isArray(allergies) ? allergies : updates.allergies;
    if (chronic_diseases !== undefined) updates.chronic_diseases = Array.isArray(chronic_diseases) ? chronic_diseases : updates.chronic_diseases;
    updates.updated_at = admin.firestore.FieldValue.serverTimestamp();

    await patientRef.update(updates);
    const updatedPatient = await db.collection('patients').doc(patientRef.id).get();
    const response = await buildPatientResponse(updatedPatient);
    res.json(response);
  } catch (error) {
    console.error('Update patient profile failed', error);
    res.status(500).json({ error: 'Could not update profile' });
  }
});

// GET /api/patients/me/records � own medical records
router.get('/me/records', authMiddleware, requireRole('patient'), async (req, res) => {
  try {
    const patientQuery = await db.collection('patients').where('user_id', '==', req.user.uid).limit(1).get();
    if (patientQuery.empty) return res.status(404).json({ error: 'Patient not found' });
    const patientId = patientQuery.docs[0].id;
    const recordsSnapshot = await db.collection('medicalRecords')
      .where('patient_id', '==', patientId)
      .get();

    const records = await Promise.all(recordsSnapshot.docs.map(async doc => {
      const record = doc.data();
      const doctorSnapshot = await db.collection('doctors').doc(record.doctor_id).get();
      const doctorUserSnapshot = doctorSnapshot.exists ? await db.collection('users').doc(doctorSnapshot.data().user_id).get() : null;
      return {
        id: doc.id,
        ...record,
        doctor_user_name: doctorUserSnapshot?.exists ? doctorUserSnapshot.data().name : undefined,
      };
    }));

    records.sort((a, b) => {
      const aTime = a.timestamp?.toDate?.() ?? new Date(a.created_at || 0);
      const bTime = b.timestamp?.toDate?.() ?? new Date(b.created_at || 0);
      return bTime.getTime() - aTime.getTime();
    });

    res.json(records);
  } catch (error) {
    console.error('Fetch patient records failed', error);
    res.status(500).json({ error: 'Could not load records' });
  }
});

// GET /api/patients/me/qr — own QR code
router.get('/me/qr', authMiddleware, requireRole('patient'), async (req, res) => {
  try {
    const patientQuery = await db.collection('patients').where('user_id', '==', req.user.uid).limit(1).get();
    if (patientQuery.empty) return res.status(404).json({ error: 'Patient not found' });

    const patient = patientQuery.docs[0].data();
    if (patient.family_id) {
      const qrPayload = JSON.stringify({ familyId: patient.family_id, type: 'healthcard_family' });
      return res.json({ patientId: patient.id, familyId: patient.family_id, qrPayload });
    }

    res.json({ patientId: patient.id, qrPayload: patient.qr_payload });
  } catch (error) {
    console.error('Fetch patient QR failed', error);
    res.status(500).json({ error: 'Could not load QR data' });
  }
});

// GET /api/patients/:id � get patient by ID (doctor access)
router.get('/:id', authMiddleware, requireRole('doctor', 'admin'), async (req, res) => {
  try {
    const patientSnapshot = await db.collection('patients').doc(req.params.id).get();
    if (!patientSnapshot.exists) return res.status(404).json({ error: 'Patient not found' });
    const patient = await buildPatientResponse(patientSnapshot);
    if (req.user.role === 'doctor') {
      await db.collection('qr_scan_logs').add({
        patient_id: patient.id,
        scanned_by: req.user.uid,
        scanned_at: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
    res.json(patient);
  } catch (error) {
    console.error('Fetch patient by id failed', error);
    res.status(500).json({ error: 'Could not load patient' });
  }
});

// GET /api/patients/:id/records � get patient records (doctor/admin)
router.get('/:id/records', authMiddleware, requireRole('doctor', 'admin'), async (req, res) => {
  try {
    const recordsSnapshot = await db.collection('medicalRecords')
      .where('patient_id', '==', req.params.id)
      .get();

    const records = await Promise.all(recordsSnapshot.docs.map(async doc => {
      const record = doc.data();
      const doctorSnapshot = await db.collection('doctors').doc(record.doctor_id).get();
      const doctorUserSnapshot = doctorSnapshot.exists ? await db.collection('users').doc(doctorSnapshot.data().user_id).get() : null;
      return {
        id: doc.id,
        ...record,
        doctor_user_name: doctorUserSnapshot?.exists ? doctorUserSnapshot.data().name : undefined,
      };
    }));

    records.sort((a, b) => {
      const aTime = a.timestamp?.toDate?.() ?? new Date(a.created_at || 0);
      const bTime = b.timestamp?.toDate?.() ?? new Date(b.created_at || 0);
      return bTime.getTime() - aTime.getTime();
    });

    res.json(records);
  } catch (error) {
    console.error('Fetch patient records by id failed', error);
    res.status(500).json({ error: 'Could not load records' });
  }
});

module.exports = router;
