const express = require('express');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { admin, db } = require('../firebaseAdmin');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

async function getFamilyIdForUser(uid) {
  const patientSnapshot = await db.collection('patients').where('user_id', '==', uid).limit(1).get();
  return patientSnapshot.empty ? null : patientSnapshot.docs[0].data().family_id;
}

async function fetchRecordsForPatientIds(patientIds) {
  if (!patientIds.length) return {};

  const recordsByPatient = {};
  const chunkSize = 10;
  for (let i = 0; i < patientIds.length; i += chunkSize) {
    const chunk = patientIds.slice(i, i + chunkSize);
    const recordsSnapshot = await db.collection('medicalRecords').where('patient_id', 'in', chunk).get();
    recordsSnapshot.docs.forEach(doc => {
      const record = doc.data();
      if (!recordsByPatient[record.patient_id]) recordsByPatient[record.patient_id] = [];
      recordsByPatient[record.patient_id].push({ id: doc.id, ...record });
    });
  }
  return recordsByPatient;
}

// GET /api/families/me
router.get('/me', authMiddleware, requireRole('patient', 'admin'), async (req, res) => {
  try {
    const familyId = req.user.role === 'patient' ? await getFamilyIdForUser(req.user.uid) : null;
    if (req.user.role === 'patient' && !familyId) {
      return res.json({ family: null, members: [] });
    }

    const familySnapshot = req.user.role === 'patient' ? await db.collection('families').doc(familyId).get() : null;
    const family = familySnapshot?.exists ? { id: familySnapshot.id, ...familySnapshot.data() } : null;

    if (!family) return res.json({ family: null, members: [] });

    const membersSnapshot = await db.collection('patients').where('family_id', '==', familyId).get();
    const patientIds = membersSnapshot.docs.map(doc => doc.id);
    const recordsByPatient = await fetchRecordsForPatientIds(patientIds);

    const members = await Promise.all(membersSnapshot.docs.map(async doc => {
      const patient = doc.data();
      const userSnapshot = await db.collection('users').doc(patient.user_id).get();
      return {
        id: doc.id,
        user_id: patient.user_id,
        name: userSnapshot.exists ? userSnapshot.data().name : undefined,
        email: userSnapshot.exists ? userSnapshot.data().email : undefined,
        age: patient.age,
        gender: patient.gender,
        contact: patient.contact,
        medical_history: patient.medical_history || [],
        blood_group: patient.blood_group,
        emergency_contact: patient.emergency_contact,
        medical_records: recordsByPatient[doc.id] || [],
      };
    }));

    res.json({ family, members });
  } catch (error) {
    console.error('Fetch family failed', error);
    res.status(500).json({ error: 'Could not load family' });
  }
});

// POST /api/families
router.post('/', authMiddleware, requireRole('patient', 'admin'), async (req, res) => {
  const { family_name } = req.body;
  if (!family_name || typeof family_name !== 'string') {
    return res.status(400).json({ error: 'Family name is required' });
  }

  try {
    const familyId = uuidv4();
    await db.collection('families').doc(familyId).set({
      family_name: family_name.trim(),
      created_at: admin.firestore.FieldValue.serverTimestamp(),
    });

    if (req.user.role === 'patient') {
      const patientSnapshot = await db.collection('patients').where('user_id', '==', req.user.uid).limit(1).get();
      if (!patientSnapshot.empty) {
        await patientSnapshot.docs[0].ref.update({ family_id: familyId });
      }
    }

    res.status(201).json({ familyId, family_name: family_name.trim() });
  } catch (error) {
    console.error('Create family failed', error);
    res.status(500).json({ error: 'Could not create family' });
  }
});

// POST /api/families/:familyId/members
router.post('/:familyId/members', authMiddleware, requireRole('patient', 'admin'), async (req, res) => {
  const { familyId } = req.params;
  const { name, email, password, age, gender, contact, medical_history } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  try {
    const familySnapshot = await db.collection('families').doc(familyId).get();
    if (!familySnapshot.exists) return res.status(404).json({ error: 'Family not found' });

    if (req.user.role === 'patient') {
      const currentFamilyId = await getFamilyIdForUser(req.user.uid);
      if (currentFamilyId !== familyId) {
        return res.status(403).json({ error: 'You can only add members to your own family' });
      }
    }

    // Check if email already exists
    const existingUserSnapshot = await db.collection('users').where('email', '==', email).limit(1).get();
    if (!existingUserSnapshot.empty) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const userId = uuidv4();
    const patientId = uuidv4();
    const qrPayload = JSON.stringify({ familyId, type: 'healthcard_family' });

    await db.runTransaction(async tx => {
      tx.set(db.collection('users').doc(userId), {
        uid: userId,
        name: name.trim(),
        email: email.trim(),
        role: 'patient',
        created_at: admin.firestore.FieldValue.serverTimestamp(),
      });

      tx.set(db.collection('patients').doc(patientId), {
        id: patientId,
        user_id: userId,
        family_id: familyId,
        age: age ?? null,
        gender: gender || null,
        contact: contact ?? null,
        medical_history: Array.isArray(medical_history) ? medical_history : medical_history ? [medical_history] : [],
        blood_group: null,
        emergency_contact: null,
        allergies: [],
        chronic_diseases: [],
        qr_payload: qrPayload,
        created_at: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    res.status(201).json({ id: patientId, user_id: userId, name: name.trim(), email: email.trim(), family_id: familyId });
  } catch (error) {
    console.error('Add family member failed', error);
    res.status(500).json({ error: 'Could not add family member' });
  }
});

// GET /api/families/:familyId/members
router.get('/:familyId/members', authMiddleware, requireRole('patient', 'admin', 'doctor'), async (req, res) => {
  const { familyId } = req.params;

  try {
    const familySnapshot = await db.collection('families').doc(familyId).get();
    if (!familySnapshot.exists) return res.status(404).json({ error: 'Family not found' });

    if (req.user.role === 'patient') {
      const currentFamilyId = await getFamilyIdForUser(req.user.uid);
      if (currentFamilyId !== familyId) {
        return res.status(403).json({ error: 'You can only view your own family members' });
      }
    }

    const membersSnapshot = await db.collection('patients').where('family_id', '==', familyId).get();
    const members = await Promise.all(membersSnapshot.docs.map(async doc => {
      const patient = doc.data();
      const userSnapshot = await db.collection('users').doc(patient.user_id).get();
      return {
        id: doc.id,
        user_id: patient.user_id,
        name: userSnapshot.exists ? userSnapshot.data().name : undefined,
        email: userSnapshot.exists ? userSnapshot.data().email : undefined,
        age: patient.age,
        gender: patient.gender,
        contact: patient.contact,
        medical_history: patient.medical_history || [],
        blood_group: patient.blood_group,
        emergency_contact: patient.emergency_contact,
      };
    }));

    res.json({ family: { id: familySnapshot.id, ...familySnapshot.data() }, members });
  } catch (error) {
    console.error('Fetch family members failed', error);
    res.status(500).json({ error: 'Could not load family members' });
  }
});

// GET /api/families/:familyId/qr
router.get('/:familyId/qr', authMiddleware, requireRole('patient', 'admin'), async (req, res) => {
  const { familyId } = req.params;

  try {
    const familySnapshot = await db.collection('families').doc(familyId).get();
    if (!familySnapshot.exists) return res.status(404).json({ error: 'Family not found' });

    if (req.user.role === 'patient') {
      const currentFamilyId = await getFamilyIdForUser(req.user.uid);
      if (currentFamilyId !== familyId) {
        return res.status(403).json({ error: 'You can only access your own family QR code' });
      }
    }

    const qrPayload = JSON.stringify({ familyId, type: 'healthcard_family' });
    res.json({ familyId, qrPayload });
  } catch (error) {
    console.error('Generate family QR failed', error);
    res.status(500).json({ error: 'Could not generate family QR code' });
  }
});

module.exports = router;
