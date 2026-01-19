/**
 * Seed Medical Data (Doctors & Hospitals)
 * Run this script to populate the database with sample medical data
 *
 * Usage:
 * npx tsx src/storage/database/seedMedicalData.ts
 */

import { getDb } from "coze-coding-dev-sdk";
import { hospitals, doctors } from "./shared/schema";

const SAMPLE_HOSPITALS = [
  {
    nameEn: "Beijing Union Medical College Hospital",
    nameZh: "北京协和医院",
    descriptionEn: "One of the most prestigious hospitals in China, known for excellence in medical care and research.",
    descriptionZh: "中国最负盛名的医院之一，以卓越的医疗护理和科研闻名。",
    level: "Grade 3A",
    location: "Beijing",
    specialties: JSON.stringify([
      "cardiology", "oncology", "neurology", "surgery", "internal medicine"
    ]),
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "Peking University Third Hospital",
    nameZh: "北京大学第三医院",
    descriptionEn: "A leading hospital specializing in sports medicine, orthopedics, and reproductive medicine.",
    descriptionZh: "一家领先的医院，专长于运动医学、骨科和生殖医学。",
    level: "Grade 3A",
    location: "Beijing",
    specialties: JSON.stringify([
      "orthopedics", "sports medicine", "reproductive medicine", "neurology"
    ]),
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "Shanghai Jiao Tong University Ruijin Hospital",
    nameZh: "上海交通大学医学院附属瑞金医院",
    descriptionEn: "Top-tier hospital with world-class facilities for diagnosis and treatment.",
    descriptionZh: "顶级医院，拥有世界一流的诊疗设施。",
    level: "Grade 3A",
    location: "Shanghai",
    specialties: JSON.stringify([
      "cardiology", "oncology", "diabetes", "endocrinology"
    ]),
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "Guangzhou General Hospital of Guangzhou Military Command",
    nameZh: "广州军区总医院",
    descriptionEn: "Comprehensive medical center serving the southern region of China.",
    descriptionZh: "服务中国南部地区的综合医疗中心。",
    level: "Grade 3A",
    location: "Guangzhou",
    specialties: JSON.stringify([
      "trauma", "surgery", "internal medicine", "cardiology"
    ]),
    isFeatured: false,
    isActive: true,
  },
  {
    nameEn: "Chengdu West China Hospital",
    nameZh: "四川大学华西医院",
    descriptionEn: "Largest hospital in western China with advanced medical technology.",
    descriptionZh: "中国西部最大的医院，拥有先进的医疗技术。",
    level: "Grade 3A",
    location: "Chengdu",
    specialties: JSON.stringify([
      "neurology", "psychiatry", "pulmonology", "cardiology"
    ]),
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "Shenzhen Second People's Hospital",
    nameZh: "深圳市第二人民医院",
    descriptionEn: "Modern hospital providing high-quality healthcare services.",
    descriptionZh: "现代化医院，提供优质医疗服务。",
    level: "Grade 3B",
    location: "Shenzhen",
    specialties: JSON.stringify([
      "emergency medicine", "surgery", "pediatrics", "gynecology"
    ]),
    isFeatured: false,
    isActive: true,
  },
];

const SAMPLE_DOCTORS = [
  {
    nameEn: "Dr. Li Wei",
    nameZh: "李伟",
    title: "Chief Cardiologist",
    specialtiesEn: JSON.stringify(["cardiology", "interventional cardiology", "heart failure"]),
    specialtiesZh: JSON.stringify(["心血管内科", "介入心脏病学", "心力衰竭"]),
    descriptionEn: "Over 25 years of experience in cardiovascular medicine, specializes in complex cardiac interventions.",
    descriptionZh: "超过25年的心血管医学经验，专长于复杂的心脏介入手术。",
    experienceYears: 25,
    consultationFee: "500",
    hospitalId: null, // Will be set after hospital creation
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "Dr. Zhang Mei",
    nameZh: "张梅",
    title: "Senior Oncologist",
    specialtiesEn: JSON.stringify(["oncology", "cancer treatment", "immunotherapy"]),
    specialtiesZh: JSON.stringify(["肿瘤内科", "癌症治疗", "免疫治疗"]),
    descriptionEn: "Expert in targeted cancer therapies and personalized treatment plans.",
    descriptionZh: "靶向癌症治疗和个性化治疗方案专家。",
    experienceYears: 20,
    consultationFee: "450",
    hospitalId: null,
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "Dr. Wang Qiang",
    nameZh: "王强",
    title: "Neurosurgeon",
    specialtiesEn: JSON.stringify(["neurology surgery", "spinal surgery", "brain surgery"]),
    specialtiesZh: JSON.stringify(["神经外科", "脊柱手术", "脑外科"]),
    descriptionEn: "Pioneer in minimally invasive neurosurgery techniques.",
    descriptionZh: "微创神经外科技术先驱。",
    experienceYears: 18,
    consultationFee: "800",
    hospitalId: null,
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "Dr. Chen Yan",
    nameZh: "陈燕",
    title: "Orthopedic Surgeon",
    specialtiesEn: JSON.stringify(["orthopedics", "sports medicine", "joint replacement"]),
    specialtiesZh: JSON.stringify(["骨科", "运动医学", "关节置换"]),
    descriptionEn: "Specializes in sports injuries and joint replacement surgery.",
    descriptionZh: "专长于运动损伤和关节置换手术。",
    experienceYears: 15,
    consultationFee: "600",
    hospitalId: null,
    isFeatured: false,
    isActive: true,
  },
  {
    nameEn: "Dr. Liu Xiaoming",
    nameZh: "刘晓明",
    title: "Pediatrician",
    specialtiesEn: JSON.stringify(["pediatrics", "neonatology", "child development"]),
    specialtiesZh: JSON.stringify(["儿科", "新生儿科", "儿童发育"]),
    descriptionEn: "Dedicated to children's health and developmental care.",
    descriptionZh: "致力于儿童健康和发展护理。",
    experienceYears: 12,
    consultationFee: "300",
    hospitalId: null,
    isFeatured: false,
    isActive: true,
  },
  {
    nameEn: "Dr. Zhao Wei",
    nameZh: "赵薇",
    title: "Dermatologist",
    specialtiesEn: JSON.stringify(["dermatology", "cosmetic dermatology", "skin cancer"]),
    specialtiesZh: JSON.stringify(["皮肤科", "美容皮肤科", "皮肤癌"]),
    descriptionEn: "Expert in skin diseases and cosmetic procedures.",
    descriptionZh: "皮肤病和美容程序专家。",
    experienceYears: 10,
    consultationFee: "400",
    hospitalId: null,
    isFeatured: false,
    isActive: true,
  },
  {
    nameEn: "Dr. Sun Hong",
    nameZh: "孙红",
    title: "Gynecologist",
    specialtiesEn: JSON.stringify(["gynecology", "obstetrics", "reproductive medicine"]),
    specialtiesZh: JSON.stringify(["妇科", "产科", "生殖医学"]),
    descriptionEn: "Specializes in women's health and reproductive medicine.",
    descriptionZh: "专长于女性健康和生殖医学。",
    experienceYears: 16,
    consultationFee: "350",
    hospitalId: null,
    isFeatured: false,
    isActive: true,
  },
  {
    nameEn: "Dr. Zhou Jian",
    nameZh: "周健",
    title: "Cardiac Surgeon",
    specialtiesEn: JSON.stringify(["cardiac surgery", "heart transplant", "valve surgery"]),
    specialtiesZh: JSON.stringify(["心脏外科", "心脏移植", "瓣膜手术"]),
    descriptionEn: "Expert in complex cardiac surgeries and heart transplants.",
    descriptionZh: "复杂心脏手术和心脏移植专家。",
    experienceYears: 22,
    consultationFee: "900",
    hospitalId: null,
    isFeatured: true,
    isActive: true,
  },
];

async function seedMedicalData() {
  try {
    console.log("🏥 Connecting to database...");
    const db = await getDb();

    console.log("📋 Checking existing data...");
    const existingHospitals = await db.select().from(hospitals).limit(1);
    if (existingHospitals.length > 0) {
      console.log("⚠️  Hospitals already exist. Skipping hospital seeding.");
      const existingDoctors = await db.select().from(doctors).limit(1);
      if (existingDoctors.length > 0) {
        console.log("⚠️  Doctors already exist. Skipping doctor seeding.");
        return;
      }
    }

    console.log(`🏥 Creating ${SAMPLE_HOSPITALS.length} hospitals...`);
    const insertedHospitals = await db
      .insert(hospitals)
      .values(SAMPLE_HOSPITALS)
      .returning();
    console.log(`✅ Created ${insertedHospitals.length} hospitals`);

    console.log(`👨‍⚕️ Creating ${SAMPLE_DOCTORS.length} doctors...`);
    const doctorsWithHospitalIds = SAMPLE_DOCTORS.map((doctor, index) => {
      // Assign doctors to hospitals round-robin
      const hospitalIndex = index % insertedHospitals.length;
      return {
        ...doctor,
        hospitalId: insertedHospitals[hospitalIndex].id,
      };
    });

    const insertedDoctors = await db
      .insert(doctors)
      .values(doctorsWithHospitalIds)
      .returning();
    console.log(`✅ Created ${insertedDoctors.length} doctors`);

    console.log("\n📊 Summary:");
    console.log(`   Hospitals: ${insertedHospitals.length}`);
    console.log(`   Doctors: ${insertedDoctors.length}`);
    console.log("\n✨ Medical data seeded successfully!");
  } catch (error) {
    console.error("❌ Failed to seed medical data:", error);
    process.exit(1);
  }
}

seedMedicalData()
  .then(() => {
    console.log("\n✅ Seed completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  });
