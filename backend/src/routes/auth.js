const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { admin, db } = require('../firebaseAdmin');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/register (patient registration)
router.post('/register', authMiddleware, async (req, res) => {
  const { name, age, gender, blood_group, emergency_contact } = req.body;
  const uid = req.user?.uid;

  if (!uid) return res.status(401).json({ error: 'Unauthorized' });
  if (!name) return res.status(400).json({ error: 'Name is required' });

  try {
    const userDocRef = db.collection('users').doc(uid);
    const patientId = uuidv4();
    const familyId = uuidv4();
    const qrPayload = JSON.stringify({ familyId, type: 'healthcard_family' });

    await db.runTransaction(async tx => {
      tx.set(userDocRef, {
        name,
        role: 'patient',
        email: req.user.email,
        uid,
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });

      tx.set(db.collection('families').doc(familyId), {
        family_name: `${name}'s Family`,
        created_at: admin.firestore.FieldValue.serverTimestamp(),
      });

      tx.set(db.collection('patients').doc(patientId), {
        id: patientId,
        user_id: uid,
        age: age ?? null,
        gender: gender || null,
        contact: null,
        family_id: familyId,
        medical_history: [],
        blood_group: blood_group || null,
        emergency_contact: emergency_contact || null,
        allergies: [],
        chronic_diseases: [],
        qr_payload: qrPayload,
        created_at: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    res.status(201).json({ message: 'Patient profile created', patientId, familyId });
  } catch (error) {
    console.error('Patient registration failed', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/register-doctor
router.post('/register-doctor', authMiddleware, async (req, res) => {
  const { name, specialization, qualification, experience, hospital, about } = req.body;
  const uid = req.user?.uid;

  if (!uid) return res.status(401).json({ error: 'Unauthorized' });
  if (!name) return res.status(400).json({ error: 'Name is required' });

  const doctorId = uuidv4();

  try {
    const userDocRef = db.collection('users').doc(uid);
    await userDocRef.set({
      name,
      email: req.user.email,
      role: 'doctor',
      uid,
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    await db.collection('doctors').doc(doctorId).set({
      id: doctorId,
      user_id: uid,
      specialization: specialization || '',
      qualification: qualification || '',
      experience: experience ?? 0,
      hospital: hospital || '',
      about: about || '',
      verified: false,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(201).json({ message: 'Doctor registered. Awaiting admin verification.' });
  } catch (error) {
    console.error('Doctor registration failed', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req, res) => {
  const uid = req.user?.uid;
  if (!uid) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();
    const result = {
      uid,
      name: userData.name,
      email: userData.email,
      role: userData.role,
    };

    if (userData.role === 'patient') {
      const patientSnapshot = await db.collection('patients').where('user_id', '==', uid).limit(1).get();
      if (!patientSnapshot.empty) {
        const patient = patientSnapshot.docs[0].data();
        result.patientId = patient.id;
        result.familyId = patient.family_id;
      }
    }

    if (userData.role === 'doctor') {
      const doctorSnapshot = await db.collection('doctors').where('user_id', '==', uid).limit(1).get();
      if (!doctorSnapshot.empty) {
        const doctor = doctorSnapshot.docs[0].data();
        result.doctorId = doctor.id;
        result.verified = doctor.verified;
      }
    }

    res.json(result);
  } catch (error) {
    console.error('Fetch auth/me failed', error);
    res.status(500).json({ error: 'Unable to load profile' });
  }
});

module.exports = router;
