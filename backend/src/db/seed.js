const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('./database');

async function seed() {
  console.log('Seeding database...');

  // Create admin user
  const adminId = uuidv4();
  const adminHash = await bcrypt.hash('admin123', 10);
  
  const existingAdmin = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@healthcard.app');
  
  if (!existingAdmin) {
    db.prepare(`
      INSERT INTO users (id, name, email, password, role) 
      VALUES (?, ?, ?, ?, ?)
    `).run(adminId, 'System Admin', 'admin@healthcard.app', adminHash, 'admin');
    console.log('✅ Admin created: admin@healthcard.app / admin123');
  } else {
    console.log('ℹ️  Admin already exists');
  }

  // Create sample doctor
  const existingDoctor = db.prepare('SELECT id FROM users WHERE email = ?').get('doctor@healthcard.app');
  
  if (!existingDoctor) {
    const doctorUserId = uuidv4();
    const doctorId = uuidv4();
    const doctorHash = await bcrypt.hash('doctor123', 10);
    
    db.prepare(`
      INSERT INTO users (id, name, email, password, role) 
      VALUES (?, ?, ?, ?, ?)
    `).run(doctorUserId, 'Dr. Sarah Johnson', 'doctor@healthcard.app', doctorHash, 'doctor');
    
    db.prepare(`
      INSERT INTO doctors (id, user_id, specialization, qualification, experience, hospital, about, verified)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(doctorId, doctorUserId, 'Cardiology', 'MD, FACC', 15, 'City General Hospital', 
       'Experienced cardiologist specializing in hypertension and heart disease.', 1);
    
    console.log('✅ Sample doctor created: doctor@healthcard.app / doctor123');
  } else {
    console.log('ℹ️  Sample doctor already exists');
  }

  // Create sample patient with a family
  const existingPatient = db.prepare('SELECT id FROM users WHERE email = ?').get('patient@healthcard.app');
  
  if (!existingPatient) {
    const patientUserId = uuidv4();
    const patientId = uuidv4();
    const familyId = uuidv4();
    const patientHash = await bcrypt.hash('patient123', 10);
    
    db.prepare(`
      INSERT INTO users (id, name, email, password, role) 
      VALUES (?, ?, ?, ?, ?)
    `).run(patientUserId, 'John Doe', 'patient@healthcard.app', patientHash, 'patient');
    
    db.prepare(`
      INSERT INTO families (id, family_name) VALUES (?, ?)
    `).run(familyId, 'Doe Family');

    const QRCode = require('qrcode');
    const qrData = JSON.stringify({ patientId, type: 'healthcard_patient' });
    const qrCode = await QRCode.toDataURL(qrData);
    
    db.prepare(`
      INSERT INTO patients (id, user_id, family_id, age, gender, contact, medical_history, blood_group, emergency_contact, allergies, chronic_diseases, qr_code)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      patientId,
      patientUserId,
      familyId,
      45,
      'Male',
      '+1-234-567-8900',
      JSON.stringify(['Hypertension', 'Type 2 Diabetes']),
      'O+',
      '+1-234-567-8900',
      JSON.stringify(['Penicillin', 'Peanuts']),
      JSON.stringify(['Hypertension', 'Type 2 Diabetes']),
      qrCode
    );
    
    console.log('✅ Sample patient created: patient@healthcard.app / patient123');
  } else {
    console.log('ℹ️  Sample patient already exists');
  }

  console.log('\n🎉 Seeding complete!');
  console.log('\nDemo accounts:');
  console.log('  Admin:   admin@healthcard.app   / admin123');
  console.log('  Doctor:  doctor@healthcard.app  / doctor123');
  console.log('  Patient: patient@healthcard.app / patient123');
}

seed().catch(console.error);
