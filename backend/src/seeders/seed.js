import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import {
  sequelize,
  User,
  Representative,
  Project,
  ProjectTimeline,
  Complaint,
  ComplaintTimeline,
  Update,
  EmergencyContact,
} from '../models/index.js';

dotenv.config();

async function seed() {
  await sequelize.sync({ alter: true });

  let rep = await Representative.findOne();
  if (!rep) {
    rep = await Representative.create({
      name: 'Narayan Pawar',
      title: 'नगरसेवक — वॉर्ड ४२',
      ward_no: '42',
      city: 'Mumbai',
      bio: 'मी नारायण पवार, वॉर्ड ४२ चे नगरसेवक. नागरिकांच्या दैनदिन समस्यांसाठी तत्पर उपस्थिती आणि पारदर्शक विकास कामे ही माझी प्राथमिकता आहे.',
      vision:
        'स्वच्छ शहर, सुरक्षित रस्ते, समृद्ध सामाजिक जीवन आणि प्रत्येक नागरिकाचा सन्मान — ही वॉर्ड ४२ साठी माझी दृष्टी आहे.',
      development_highlights:
        'मुख्य रस्त्यांचे डांबरीकरण, ग्रीन कॉरिडॉर, स्मार्ट स्ट्रीट लाईटिंग व सार्वजनिक सुविधांचा विस्तार.',
      years_experience: 12,
      completed_projects: 48,
      photo_url: null,
      email: 'narayan.pawar@example.com',
      phone: '+91 98765 43210',
      office_address: 'वॉर्ड कार्यालय, वॉर्ड ४२, मुंबई',
      social_whatsapp: '919876543210',
    });
  }

  const adminMobile = process.env.SEED_ADMIN_MOBILE || '9999999999';
  const adminPass = process.env.SEED_ADMIN_PASSWORD || 'admin123';
  const hash = await bcrypt.hash(adminPass, 10);
  const [admin] = await User.findOrCreate({
    where: { mobile: adminMobile },
    defaults: {
      full_name: 'Ward Admin',
      email: 'admin@example.com',
      password_hash: hash,
      ward_no: '42',
      city: 'Mumbai',
      role: 'admin',
      is_mobile_verified: true,
    },
  });
  admin.role = 'admin';
  admin.password_hash = hash;
  admin.is_mobile_verified = true;
  if (!admin.full_name) admin.full_name = 'Ward Admin';
  if (!admin.email) admin.email = 'admin@example.com';
  await admin.save();

  const demoMobile = process.env.SEED_USER_MOBILE || '9876543210';
  const demoPass = process.env.SEED_USER_PASSWORD || 'demo1234';
  const demoHash = await bcrypt.hash(demoPass, 10);
  const [demoUser] = await User.findOrCreate({
    where: { mobile: demoMobile },
    defaults: {
      full_name: 'नागरिक परीक्षक',
      email: 'citizen@example.com',
      password_hash: demoHash,
      ward_no: '42',
      city: 'Mumbai',
      role: 'citizen',
      is_mobile_verified: true,
      address: 'वॉर्ड ४२, मुंबई',
    },
  });
  if (!demoUser.password_hash) {
    demoUser.password_hash = demoHash;
    await demoUser.save();
  }

  const projectsData = [
    {
      project_code: 'PRJ-ROAD-02',
      title: 'मुख्य रस्त्याचे डांबरीकरण Phase 2',
      description: 'मुख्य रस्त्यावर दुसऱ्या टप्प्यातील डांबरीकरण व नालीसफाई.',
      location_text: 'वॉर्ड ४२ — मुख्य मार्ग',
      status: 'in_progress',
      progress_percent: 65,
      budget: '₹ 2.4 कोटी',
      contractor: 'ABC Infra Ltd.',
      start_date: '2025-01-10',
      expected_completion_date: '2026-06-30',
      image_url: null,
    },
    {
      project_code: 'PRJ-GREEN-01',
      title: 'ग्रीन कॉरिडॉर उपक्रम',
      description: 'झाडे लागवड, फूलबाग व पर्यावरणपूरक रस्ता सुशोभीकरण.',
      location_text: 'वॉर्ड ४२ — उद्यान परिसर',
      status: 'in_progress',
      progress_percent: 40,
      budget: '₹ 85 लाख',
      contractor: 'GreenRoots NGO',
      start_date: '2025-03-01',
      expected_completion_date: '2026-03-15',
      image_url: null,
    },
    {
      project_code: 'PRJ-LIGHT-03',
      title: 'स्मार्ट स्ट्रीट लाईटिंगची स्थापना',
      description: 'LED व स्मार्ट नियंत्रणासह स्ट्रीट लाईटिंग.',
      location_text: 'वॉर्ड ४२ — आंतरिक रस्ते',
      status: 'not_started',
      progress_percent: 10,
      budget: '₹ 1.1 कोटी',
      contractor: 'BrightCity Systems',
      start_date: '2026-02-01',
      expected_completion_date: '2026-12-01',
      image_url: null,
    },
  ];

  for (const p of projectsData) {
    const [proj] = await Project.findOrCreate({
      where: { project_code: p.project_code },
      defaults: p,
    });
    if (proj.title !== p.title) {
      await proj.update(p);
    }
    const count = await ProjectTimeline.count({ where: { project_id: proj.id } });
    if (count === 0) {
      await ProjectTimeline.bulkCreate([
        {
          project_id: proj.id,
          title: 'नियोजन पूर्ण',
          description: 'सर्वेक्षण व निविदा मंजूर.',
          status: 'completed',
        },
        {
          project_id: proj.id,
          title: 'काम सुरू',
          description: 'स्थळावर काम सुरू आहे.',
          status: 'in_progress',
        },
      ]);
    }
  }

  const complaintsSeed = [
    {
      complaint_no: 'NS-98241',
      title: 'पथदिवे बंद असणे',
      description: 'मुख्य चौकाजवळील पथदिवे काही दिवसांपासून बंद आहेत.',
      status: 'in_progress',
      category: 'वीज',
      location_text: 'मुख्य चौक, वॉर्ड ४२',
    },
    {
      complaint_no: 'NS-44102',
      title: 'कचरा समस्या',
      description: 'घरोघरी कचरा गोळा करण्यात विलंब होत आहे.',
      status: 'assigned',
      category: 'स्वच्छता',
      location_text: 'सेक्टर ३, वॉर्ड ४२',
      assigned_officer_name: 'श्री. पाटील',
    },
    {
      complaint_no: 'NS-77321',
      title: 'नळाला पाणी न येणे',
      description: 'सकाळी पाणी दाब खूप कमी आहे.',
      status: 'registered',
      category: 'पाणीपुरवठा',
      location_text: 'लाईन ५, वॉर्ड ४२',
    },
  ];

  for (const c of complaintsSeed) {
    const existing = await Complaint.findOne({ where: { complaint_no: c.complaint_no } });
    if (!existing) {
      const comp = await Complaint.create({
        ...c,
        user_id: demoUser.id,
      });
      await ComplaintTimeline.bulkCreate([
        {
          complaint_id: comp.id,
          status: 'registered',
          title: 'Complaint Registered',
          description: 'तक्रार नोंदवली.',
        },
        ...(c.status !== 'registered'
          ? [
              {
                complaint_id: comp.id,
                status: c.status,
                title:
                  c.status === 'assigned'
                    ? 'Officer Assigned'
                    : 'Work In Progress',
                description: 'अधिकाऱ्यांकडे तपास सुरू.',
                officer_name: c.assigned_officer_name || null,
              },
            ]
          : []),
      ]);
    }
  }

  const updatesSeed = [
    {
      title: 'वॉर्ड ४२ — पाणीपुरवठा दुरुस्ती',
      description: 'मुख्य पाईपलाईन दुरुस्ती २४ तासांत पूर्ण होईल.',
      type: 'ward_update',
    },
    {
      title: 'साप्ताहिक स्वच्छता मोहीम',
      description: 'शनिवारी सकाळी ७ वाजता सामूहिक स्वच्छता.',
      type: 'event',
    },
  ];
  for (const u of updatesSeed) {
    const found = await Update.findOne({ where: { title: u.title } });
    if (!found) await Update.create(u);
  }

  const emergencySeed = [
    {
      department_name: 'नगरसेवक कार्यालय — हॉटलाईन',
      phone: '+91 98765 43210',
      description: 'तातडीच्या तक्रारी व सूचना',
      icon: 'building',
      priority: 100,
    },
    {
      department_name: 'पोलीस',
      phone: '100',
      description: 'आपत्कालीन',
      icon: 'shield',
      priority: 90,
    },
    {
      department_name: 'आरोग्य / रुग्णालय',
      phone: '108',
      description: 'रुग्णवाहिका',
      icon: 'heart-pulse',
      priority: 80,
    },
    {
      department_name: 'अग्निशमन दल',
      phone: '101',
      description: 'आग',
      icon: 'flame',
      priority: 80,
    },
    {
      department_name: 'पाणीपुरवठा विभाग',
      phone: '1916',
      description: 'पाणी टंचाई / लिकेज',
      icon: 'droplets',
      priority: 50,
    },
    {
      department_name: 'वीज मंडळ',
      phone: '1912',
      description: 'वीज खंडित / धोका',
      icon: 'zap',
      priority: 50,
    },
  ];
  for (const e of emergencySeed) {
    const found = await EmergencyContact.findOne({
      where: { department_name: e.department_name },
    });
    if (!found) await EmergencyContact.create(e);
  }

  console.log('Seed completed.');
  console.log(`Admin login: ${adminMobile} / ${adminPass}`);
  console.log(`Demo user login: ${demoMobile} / ${demoPass}`);
  await sequelize.close();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
