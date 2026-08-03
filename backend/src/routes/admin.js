const express = require('express');
const { admin, db } = require('../firebaseAdmin');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();

async function getUser(uid) {
  const userSnapshot = await db.collection('users').doc(uid).get();
  return userSnapshot.exists ? userSnapshot.data() : null;
}

// GET /api/admin/stats
router.get('/stats', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const [patientSnapshot, doctorSnapshot, verifiedDoctorSnapshot, pendingDoctorSnapshot, recordSnapshot, qrLogSnapshot] = await Promise.all([
      db.collection('users').where('role', '==', 'patient').get(),
      db.collection('users').where('role', '==', 'doctor').get(),
      db.collection('doctors').where('verified', '==', true).get(),
      db.collection('doctors').where('verified', '==', false).get(),
      db.collection('medicalRecords').get(),
      db.collection('qr_scan_logs').get(),
    ]);

    res.json({
      totalPatients: patientSnapshot.size,
      totalDoctors: doctorSnapshot.size,
      verifiedDoctors: verifiedDoctorSnapshot.size,
      pendingDoctors: pendingDoctorSnapshot.size,
      totalRecords: recordSnapshot.size,
      totalScans: qrLogSnapshot.size,
    });
  } catch (error) {
    console.error('Fetch admin stats failed', error);
    res.status(500).json({ error: 'Could not load stats' });
  }
});

// GET /api/admin/patients
router.get('/patients', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const snapshot = await db.collection('patients').orderBy('created_at', 'desc').get();
    const patients = await Promise.all(snapshot.docs.map(async doc => {
      const patient = doc.data();
      const user = await getUser(patient.user_id);
      const recordSnapshot = await db.collection('medicalRecords').where('patient_id', '==', patient.id).get();
      return {
        id: patient.id,
        age: patient.age,
        gender: patient.gender,
        blood_group: patient.blood_group,
        created_at: patient.created_at,
        name: user?.name,
        email: user?.email,
        user_id: patient.user_id,
        record_count: recordSnapshot.size,
      };
    }));

    res.json(patients);
  } catch (error) {
    console.error('Fetch admin patients failed', error);
    res.status(500).json({ error: 'Could not load patients' });
  }
});

// DELETE /api/admin/patients/:id
router.delete('/patients/:id', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const patientSnapshot = await db.collection('patients').doc(req.params.id).get();
    if (!patientSnapshot.exists) return res.status(404).json({ error: 'Patient not found' });

    const patient = patientSnapshot.data();
    await db.collection('users').doc(patient.user_id).delete();
    await db.collection('patients').doc(req.params.id).delete();

    res.json({ message: 'Patient deleted' });
  } catch (error) {
    console.error('Delete patient failed', error);
    res.status(500).json({ error: 'Could not delete patient' });
  }
});

// PUT /api/admin/patients/:id
router.put('/patients/:id', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const patientSnapshot = await db.collection('patients').doc(req.params.id).get();
    if (!patientSnapshot.exists) return res.status(404).json({ error: 'Patient not found' });

    const patient = patientSnapshot.data();
    const updates = {};
    const userUpdates = {};

    const allowedPatientFields = ['age', 'gender', 'contact', 'blood_group', 'emergency_contact', 'allergies', 'chronic_diseases', 'medical_history'];
    allowedPatientFields.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    if (req.body.name !== undefined) userUpdates.name = req.body.name;
    if (req.body.email !== undefined) userUpdates.email = req.body.email;

    if (Object.keys(updates).length > 0) {
      updates.updated_at = admin.firestore.FieldValue.serverTimestamp();
      await db.collection('patients').doc(req.params.id).update(updates);
    }

    if (Object.keys(userUpdates).length > 0) {
      userUpdates.updated_at = admin.firestore.FieldValue.serverTimestamp();
      await db.collection('users').doc(patient.user_id).update(userUpdates);
    }

    const updatedPatientSnapshot = await db.collection('patients').doc(req.params.id).get();
    const patientUserSnapshot = await db.collection('users').doc(patient.user_id).get();
    const updatedPatient = updatedPatientSnapshot.data();

    res.json({
      ...updatedPatient,
      name: patientUserSnapshot.exists ? patientUserSnapshot.data().name : undefined,
      email: patientUserSnapshot.exists ? patientUserSnapshot.data().email : undefined,
      user_id: patient.user_id,
    });
  } catch (error) {
    console.error('Update patient failed', error);
    res.status(500).json({ error: 'Could not update patient' });
  }
});

// GET /api/admin/doctors
router.get('/doctors', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const snapshot = await db.collection('doctors').orderBy('created_at', 'desc').get();
    const doctors = await Promise.all(snapshot.docs.map(async doc => {
      const doctor = doc.data();
      const user = await getUser(doctor.user_id);
      const recordSnapshot = await db.collection('medicalRecords').where('doctor_id', '==', doctor.id).get();
      return {
        id: doctor.id,
        specialization: doctor.specialization,
        qualification: doctor.qualification,
        experience: doctor.experience,
        hospital: doctor.hospital,
        about: doctor.about,
        verified: doctor.verified,
        created_at: doctor.created_at,
        name: user?.name,
        email: user?.email,
        user_id: doctor.user_id,
        record_count: recordSnapshot.size,
      };
    }));

    res.json(doctors);
  } catch (error) {
    console.error('Fetch admin doctors failed', error);
    res.status(500).json({ error: 'Could not load doctors' });
  }
});

// PUT /api/admin/doctors/:id
router.put('/doctors/:id', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const doctorRef = db.collection('doctors').doc(req.params.id);
    const doctorSnapshot = await doctorRef.get();
    if (!doctorSnapshot.exists) return res.status(404).json({ error: 'Doctor not found' });

    const doctor = doctorSnapshot.data();
    const updates = {};
    const userUpdates = {};

    const allowedDoctorFields = ['specialization', 'qualification', 'experience', 'hospital', 'about', 'verified'];
    allowedDoctorFields.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    if (req.body.name !== undefined) userUpdates.name = req.body.name;
    if (req.body.email !== undefined) userUpdates.email = req.body.email;

    if (Object.keys(updates).length > 0) {
      updates.updated_at = admin.firestore.FieldValue.serverTimestamp();
      await doctorRef.update(updates);
    }

    if (Object.keys(userUpdates).length > 0) {
      userUpdates.updated_at = admin.firestore.FieldValue.serverTimestamp();
      await db.collection('users').doc(doctor.user_id).update(userUpdates);
    }

    const updatedDoctorSnapshot = await doctorRef.get();
    const updatedDoctor = updatedDoctorSnapshot.data();
    const user = await getUser(doctor.user_id);

    res.json({
      ...updatedDoctor,
      name: user?.name,
      email: user?.email,
      user_id: doctor.user_id,
    });
  } catch (error) {
    console.error('Update doctor failed', error);
    res.status(500).json({ error: 'Could not update doctor' });
  }
});

// PUT /api/admin/doctors/verify-all
router.put('/doctors/verify-all', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const verified = req.body.verified !== undefined ? Boolean(req.body.verified) : true;
    const snapshot = await db.collection('doctors').where('verified', '==', false).get();

    const updates = snapshot.docs.map(doc => doc.ref.update({ verified, updated_at: admin.firestore.FieldValue.serverTimestamp() }));
    await Promise.all(updates);

    res.json({ message: `Verified ${snapshot.size} doctor(s)` });
  } catch (error) {
    console.error('Verify all doctors failed', error);
    res.status(500).json({ error: 'Could not verify doctors' });
  }
});

// PUT /api/admin/doctors/:id/verify
router.put('/doctors/:id/verify', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const { verified } = req.body;
    const doctorRef = db.collection('doctors').doc(req.params.id);
    const doctorSnapshot = await doctorRef.get();
    if (!doctorSnapshot.exists) return res.status(404).json({ error: 'Doctor not found' });

    await doctorRef.update({ verified: Boolean(verified), updated_at: admin.firestore.FieldValue.serverTimestamp() });
    res.json({ message: `Doctor ${verified ? 'verified' : 'unverified'}` });
  } catch (error) {
    console.error('Verify doctor failed', error);
    res.status(500).json({ error: 'Could not update doctor verification' });
  }
});

// DELETE /api/admin/doctors/:id
router.delete('/doctors/:id', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const doctorSnapshot = await db.collection('doctors').doc(req.params.id).get();
    if (!doctorSnapshot.exists) return res.status(404).json({ error: 'Doctor not found' });

    const doctor = doctorSnapshot.data();
    await db.collection('users').doc(doctor.user_id).delete();
    await db.collection('doctors').doc(req.params.id).delete();

    res.json({ message: 'Doctor deleted' });
  } catch (error) {
    console.error('Delete doctor failed', error);
    res.status(500).json({ error: 'Could not delete doctor' });
  }
});

// GET /api/admin/qr-logs
router.get('/qr-logs', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const snapshot = await db.collection('qr_scan_logs').orderBy('scanned_at', 'desc').limit(100).get();
    const logs = await Promise.all(snapshot.docs.map(async doc => {
      const log = doc.data();
      const patient = await db.collection('patients').doc(log.patient_id).get();
      const patientUser = patient.exists ? await getUser(patient.data().user_id) : null;
      const doctorUser = log.scanned_by ? await getUser(log.scanned_by) : null;
      return {
        id: doc.id,
        ...log,
        patient_name: patientUser?.name,
        doctor_name: doctorUser?.name,
      };
    }));

    res.json(logs);
  } catch (error) {
    console.error('Fetch admin qr logs failed', error);
    res.status(500).json({ error: 'Could not load QR logs' });
  }
});

// GET /api/admin/records
router.get('/records', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const snapshot = await db.collection('medicalRecords').orderBy('created_at', 'desc').limit(100).get();
    const records = await Promise.all(snapshot.docs.map(async doc => {
      const record = doc.data();
      const patientSnapshot = await db.collection('patients').doc(record.patient_id).get();
      const patientUser = patientSnapshot.exists ? await getUser(patientSnapshot.data().user_id) : null;
      const doctorSnapshot = await db.collection('doctors').doc(record.doctor_id).get();
      const doctorUser = doctorSnapshot.exists ? await getUser(doctorSnapshot.data().user_id) : null;
      return {
        id: doc.id,
        ...record,
        patient_name: patientUser?.name,
        doctor_user_name: doctorUser?.name,
      };
    }));

    res.json(records);
  } catch (error) {
    console.error('Fetch admin records failed', error);
    res.status(500).json({ error: 'Could not load records' });
  }
});

module.exports = router;
