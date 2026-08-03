const express = require('express');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { admin, db } = require('../firebaseAdmin');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

async function buildDoctorResponse(doctorSnapshot) {
  const doctor = doctorSnapshot.data();
  if (!doctor) return null;
  const userSnapshot = await db.collection('users').doc(doctor.user_id).get();
  return {
    ...doctor,
    name: userSnapshot.exists ? userSnapshot.data().name : undefined,
    email: userSnapshot.exists ? userSnapshot.data().email : undefined,
  };
}

// GET /api/doctors/me — own profile
router.get('/me', authMiddleware, requireRole('doctor'), async (req, res) => {
  try {
    const snapshot = await db.collection('doctors').where('user_id', '==', req.user.uid).limit(1).get();
    if (snapshot.empty) return res.status(404).json({ error: 'Doctor profile not found' });
    const doctor = await buildDoctorResponse(snapshot.docs[0]);
    res.json(doctor);
  } catch (error) {
    console.error('Fetch doctor profile failed', error);
    res.status(500).json({ error: 'Could not load profile' });
  }
});

// PUT /api/doctors/me — update own profile
router.put('/me', authMiddleware, requireRole('doctor'), async (req, res) => {
  const { specialization, qualification, experience, hospital, about } = req.body;

  try {
    const snapshot = await db.collection('doctors').where('user_id', '==', req.user.uid).limit(1).get();
    if (snapshot.empty) return res.status(404).json({ error: 'Doctor profile not found' });

    const doctorRef = snapshot.docs[0].ref;
    await doctorRef.update({
      specialization: specialization ?? admin.firestore.FieldValue.delete(),
      qualification: qualification ?? admin.firestore.FieldValue.delete(),
      experience: experience ?? admin.firestore.FieldValue.delete(),
      hospital: hospital ?? admin.firestore.FieldValue.delete(),
      about: about ?? admin.firestore.FieldValue.delete(),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    });

    const updated = await buildDoctorResponse(await doctorRef.get());
    res.json(updated);
  } catch (error) {
    console.error('Update doctor profile failed', error);
    res.status(500).json({ error: 'Could not update profile' });
  }
});

// GET /api/doctors/me/patients — patients this doctor has seen
router.get('/me/patients', authMiddleware, requireRole('doctor'), async (req, res) => {
  try {
    const doctorQuery = await db.collection('doctors').where('user_id', '==', req.user.uid).limit(1).get();
    if (doctorQuery.empty) return res.status(404).json({ error: 'Doctor not found' });
    const doctorId = doctorQuery.docs[0].id;

    const recordSnapshots = await db.collection('medicalRecords').where('doctor_id', '==', doctorId).get();
    const patientIds = [...new Set(recordSnapshots.docs.map(doc => doc.data().patient_id))];

    const patients = await Promise.all(patientIds.map(async patientId => {
      const patientSnapshot = await db.collection('patients').doc(patientId).get();
      if (!patientSnapshot.exists) return null;
      const patient = patientSnapshot.data();
      const userSnapshot = await db.collection('users').doc(patient.user_id).get();
      const lastVisit = recordSnapshots.docs
        .filter(doc => doc.data().patient_id === patientId)
        .map(doc => doc.data().timestamp?.toDate())
        .sort((a, b) => (b?.getTime() || 0) - (a?.getTime() || 0))[0];
      return {
        id: patient.id,
        age: patient.age,
        gender: patient.gender,
        blood_group: patient.blood_group,
        allergies: patient.allergies || [],
        chronic_diseases: patient.chronic_diseases || [],
        name: userSnapshot.exists ? userSnapshot.data().name : undefined,
        email: userSnapshot.exists ? userSnapshot.data().email : undefined,
        last_visit: lastVisit ? lastVisit.toISOString().split('T')[0] : undefined,
      };
    }));

    res.json(patients.filter(Boolean));
  } catch (error) {
    console.error('Fetch doctor patients failed', error);
    res.status(500).json({ error: 'Could not load patients' });
  }
});

// POST /api/doctors/records — add medical record for a patient
router.post('/records', authMiddleware, requireRole('doctor'), async (req, res) => {
  const { patient_id, diagnosis, prescription, notes, visit_date } = req.body;
  if (!patient_id || !diagnosis) {
    return res.status(400).json({ error: 'Patient ID and diagnosis are required' });
  }

  try {
    const doctorSnapshot = await db.collection('doctors').where('user_id', '==', req.user.uid).limit(1).get();
    if (doctorSnapshot.empty) return res.status(404).json({ error: 'Doctor not found' });
    const doctor = doctorSnapshot.docs[0].data();
    if (!doctor.verified) return res.status(403).json({ error: 'Your account is pending admin verification' });

    const patientSnapshot = await db.collection('patients').doc(patient_id).get();
    if (!patientSnapshot.exists) return res.status(404).json({ error: 'Patient not found' });

    const doctorUserSnapshot = await db.collection('users').doc(req.user.uid).get();
    const doctorUserName = doctorUserSnapshot.exists ? doctorUserSnapshot.data().name : undefined;
    const recordRef = db.collection('medicalRecords').doc();
    const recordData = {
      patient_id,
      doctor_id: doctorSnapshot.docs[0].id,
      doctor_name: doctorUserName || '',
      diagnosis,
      prescription: prescription || '',
      notes: notes || '',
      visit_date: visit_date || new Date().toISOString().split('T')[0],
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      created_at: admin.firestore.FieldValue.serverTimestamp(),
    };

    await recordRef.set(recordData);
    res.status(201).json({ id: recordRef.id, ...recordData });
  } catch (error) {
    console.error('Add medical record failed', error);
    res.status(500).json({ error: 'Could not create record' });
  }
});

// GET /api/doctors — list all verified doctors (public for patients)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const snapshot = await db.collection('doctors').where('verified', '==', true).get();
    const doctors = await Promise.all(snapshot.docs.map(async doc => {
      const doctor = doc.data();
      const userSnapshot = await db.collection('users').doc(doctor.user_id).get();
      return {
        id: doc.id,
        specialization: doctor.specialization,
        qualification: doctor.qualification,
        experience: doctor.experience,
        hospital: doctor.hospital,
        about: doctor.about,
        verified: doctor.verified,
        name: userSnapshot.exists ? userSnapshot.data().name : undefined,
        email: userSnapshot.exists ? userSnapshot.data().email : undefined,
      };
    }));
    res.json(doctors);
  } catch (error) {
    console.error('List doctors failed', error);
    res.status(500).json({ error: 'Could not load doctors' });
  }
});

module.exports = router;
