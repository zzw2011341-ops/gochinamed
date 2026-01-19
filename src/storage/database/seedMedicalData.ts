/**
 * Seed Medical Data (Doctors & Hospitals)
 * Run this script to populate the database with comprehensive medical data
 *
 * Usage:
 * npx tsx src/storage/database/seedMedicalData.ts
 */

import { getDb } from "coze-coding-dev-sdk";
import { hospitals, doctors } from "./shared/schema";

const SAMPLE_HOSPITALS = [
  // 北京
  {
    nameEn: "Beijing Union Medical College Hospital",
    nameZh: "北京协和医院",
    descriptionEn: "The most prestigious hospital in China, comprehensive medical center with world-class facilities.",
    descriptionZh: "中国最负盛名的医院，综合性医疗中心，拥有世界一流设施。",
    level: "Grade 3A",
    location: "Beijing",
    specialties: JSON.stringify([
      "cardiology", "oncology", "neurology", "endocrinology", "rheumatology", "respiratory medicine"
    ]),
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "Peking University First Hospital",
    nameZh: "北京大学第一医院",
    descriptionEn: "Leading university hospital with expertise in nephrology and urology.",
    descriptionZh: "领先的大学医院，在肾脏病学和泌尿外科方面有专长。",
    level: "Grade 3A",
    location: "Beijing",
    specialties: JSON.stringify([
      "nephrology", "urology", "dermatology", "cardiology", "gastroenterology"
    ]),
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "Peking University Third Hospital",
    nameZh: "北京大学第三医院",
    descriptionEn: "Excellence in sports medicine, orthopedics, and reproductive medicine.",
    descriptionZh: "在运动医学、骨科和生殖医学方面表现卓越。",
    level: "Grade 3A",
    location: "Beijing",
    specialties: JSON.stringify([
      "orthopedics", "sports medicine", "reproductive medicine", "ophthalmology", "plastic surgery"
    ]),
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "Peking University People's Hospital",
    nameZh: "北京大学人民医院",
    descriptionEn: "Comprehensive medical center with strong hematology and transplant programs.",
    descriptionZh: "综合性医疗中心，血液学和移植项目实力强劲。",
    level: "Grade 3A",
    location: "Beijing",
    specialties: JSON.stringify([
      "hematology", "transplant surgery", "cardiology", "pulmonology", "oncology"
    ]),
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "China-Japan Friendship Hospital",
    nameZh: "中日友好医院",
    descriptionEn: "Leading hospital in respiratory diseases and traditional Chinese medicine integration.",
    descriptionZh: "在呼吸系统疾病和中西医结合方面领先的医院。",
    level: "Grade 3A",
    location: "Beijing",
    specialties: JSON.stringify([
      "respiratory medicine", "pneumology", "cardiology", "neurology", "traditional medicine"
    ]),
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "Beijing Anzhen Hospital",
    nameZh: "北京安贞医院",
    descriptionEn: "Specialized in cardiovascular medicine and cardiac surgery.",
    descriptionZh: "专长于心血管医学和心脏外科。",
    level: "Grade 3A",
    location: "Beijing",
    specialties: JSON.stringify([
      "cardiology", "cardiac surgery", "cardiovascular surgery", "vascular surgery"
    ]),
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "Beijing Tiantan Hospital",
    nameZh: "北京天坛医院",
    descriptionEn: "World-renowned center for neurology and neurosurgery.",
    descriptionZh: "世界知名的神经内科和神经外科中心。",
    level: "Grade 3A",
    location: "Beijing",
    specialties: JSON.stringify([
      "neurology", "neurosurgery", "neurology surgery", "brain surgery", "stroke care"
    ]),
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "Beijing Cancer Hospital",
    nameZh: "北京大学肿瘤医院",
    descriptionEn: "Top cancer treatment and research center in China.",
    descriptionZh: "中国顶尖的癌症治疗和研究中心。",
    level: "Grade 3A",
    location: "Beijing",
    specialties: JSON.stringify([
      "oncology", "cancer treatment", "radiation oncology", "surgical oncology", "chemotherapy"
    ]),
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "Beijing 301 Hospital",
    nameZh: "中国人民解放军总医院",
    descriptionEn: "Largest comprehensive hospital in the PLA, providing top-tier medical services.",
    descriptionZh: "解放军最大的综合性医院，提供顶级医疗服务。",
    level: "Grade 3A",
    location: "Beijing",
    specialties: JSON.stringify([
      "cardiology", "neurology", "oncology", "surgery", "transplant surgery", "orthopedics"
    ]),
    isFeatured: true,
    isActive: true,
  },

  // 上海
  {
    nameEn: "Shanghai Jiao Tong University Ruijin Hospital",
    nameZh: "上海交通大学医学院附属瑞金医院",
    descriptionEn: "Historic hospital with excellence in endocrinology and hematology.",
    descriptionZh: "历史悠久医院，在内分泌和血液学方面卓越。",
    level: "Grade 3A",
    location: "Shanghai",
    specialties: JSON.stringify([
      "endocrinology", "hematology", "cardiology", "oncology", "diabetes treatment"
    ]),
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "Shanghai Jiao Tong University Xinhua Hospital",
    nameZh: "上海交通大学医学院附属新华医院",
    descriptionEn: "Leader in pediatrics and cardiac surgery.",
    descriptionZh: "儿科和心脏外科领域的领导者。",
    level: "Grade 3A",
    location: "Shanghai",
    specialties: JSON.stringify([
      "pediatrics", "cardiac surgery", "pediatric cardiology", "pediatric surgery"
    ]),
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "Fudan University Zhongshan Hospital",
    nameZh: "复旦大学附属中山医院",
    descriptionEn: "Excellence in liver diseases, cardiology, and organ transplantation.",
    descriptionZh: "在肝脏疾病、心脏病学和器官移植方面卓越。",
    level: "Grade 3A",
    location: "Shanghai",
    specialties: JSON.stringify([
      "hepatology", "cardiology", "liver transplant", "organ transplant", "vascular surgery"
    ]),
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "Fudan University Huashan Hospital",
    nameZh: "复旦大学附属华山医院",
    descriptionEn: "Top-ranked in neurology, infectious diseases, and dermatology.",
    descriptionZh: "在神经内科、感染病学和皮肤科方面排名领先。",
    level: "Grade 3A",
    location: "Shanghai",
    specialties: JSON.stringify([
      "neurology", "infectious diseases", "dermatology", "neurosurgery", "hand surgery"
    ]),
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "Shanghai Renji Hospital",
    nameZh: "上海交通大学医学院附属仁济医院",
    descriptionEn: "Leader in organ transplantation and liver diseases.",
    descriptionZh: "器官移植和肝脏疾病领域的领导者。",
    level: "Grade 3A",
    location: "Shanghai",
    specialties: JSON.stringify([
      "organ transplant", "hepatology", "liver transplant", "kidney transplant", "urology"
    ]),
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "Shanghai Pulmonary Hospital",
    nameZh: "上海市肺科医院",
    descriptionEn: "Specialized in respiratory diseases and thoracic surgery.",
    descriptionZh: "专长于呼吸系统疾病和胸外科。",
    level: "Grade 3A",
    location: "Shanghai",
    specialties: JSON.stringify([
      "pulmonology", "respiratory medicine", "thoracic surgery", "lung cancer", "tuberculosis"
    ]),
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "Shanghai Cancer Hospital",
    nameZh: "复旦大学附属肿瘤医院",
    descriptionEn: "Leading cancer treatment center in East China.",
    descriptionZh: "华东地区领先的癌症治疗中心。",
    level: "Grade 3A",
    location: "Shanghai",
    specialties: JSON.stringify([
      "oncology", "cancer treatment", "surgical oncology", "radiation oncology", "chemotherapy"
    ]),
    isFeatured: true,
    isActive: true,
  },

  // 广东
  {
    nameEn: "Guangdong General Hospital",
    nameZh: "广东省人民医院",
    descriptionEn: "Top general hospital in Guangdong with comprehensive medical services.",
    descriptionZh: "广东省顶级综合医院，提供全面的医疗服务。",
    level: "Grade 3A",
    location: "Guangzhou",
    specialties: JSON.stringify([
      "cardiology", "neurology", "oncology", "surgery", "emergency medicine", "cardiac surgery"
    ]),
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "The First Affiliated Hospital of Sun Yat-sen University",
    nameZh: "中山大学附属第一医院",
    descriptionEn: "Leading hospital in South China with excellence in multiple specialties.",
    descriptionZh: "华南地区领先医院，多个专科表现卓越。",
    level: "Grade 3A",
    location: "Guangzhou",
    specialties: JSON.stringify([
      "transplant surgery", "nephrology", "urology", "surgery", "cardiology", "neurology"
    ]),
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "The Second Affiliated Hospital of Sun Yat-sen University",
    nameZh: "中山大学附属第二医院",
    descriptionEn: "Excellence in hepatobiliary surgery and oncology.",
    descriptionZh: "在肝胆外科和肿瘤学方面卓越。",
    level: "Grade 3A",
    location: "Guangzhou",
    specialties: JSON.stringify([
      "hepatobiliary surgery", "oncology", "general surgery", "liver transplant", "pancreatic surgery"
    ]),
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "The Third Affiliated Hospital of Sun Yat-sen University",
    nameZh: "中山大学附属第三医院",
    descriptionEn: "Leader in infectious diseases, liver diseases, and neurology.",
    descriptionZh: "感染性疾病、肝脏疾病和神经学领域的领导者。",
    level: "Grade 3A",
    location: "Guangzhou",
    specialties: JSON.stringify([
      "infectious diseases", "hepatology", "neurology", "liver transplant", "endocrinology"
    ]),
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "Guangzhou General Hospital of PLA",
    nameZh: "广州军区总医院",
    descriptionEn: "Major military hospital with comprehensive trauma and emergency care.",
    descriptionZh: "主要军队医院，提供全面的创伤和急诊护理。",
    level: "Grade 3A",
    location: "Guangzhou",
    specialties: JSON.stringify([
      "trauma", "surgery", "emergency medicine", "orthopedics", "neurosurgery"
    ]),
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "Shenzhen People's Hospital",
    nameZh: "深圳市人民医院",
    descriptionEn: "Largest comprehensive hospital in Shenzhen.",
    descriptionZh: "深圳最大的综合性医院。",
    level: "Grade 3A",
    location: "Shenzhen",
    specialties: JSON.stringify([
      "cardiology", "neurology", "oncology", "surgery", "emergency medicine", "pediatrics"
    ]),
    isFeatured: true,
    isActive: true,
  },

  // 四川
  {
    nameEn: "West China Hospital, Sichuan University",
    nameZh: "四川大学华西医院",
    descriptionEn: "Largest hospital in western China with world-class medical facilities.",
    descriptionZh: "中国西部最大的医院，拥有世界一流的医疗设施。",
    level: "Grade 3A",
    location: "Chengdu",
    specialties: JSON.stringify([
      "neurology", "neurosurgery", "cardiology", "oncology", "psychiatry", "pulmonology", "radiology"
    ]),
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "West China Second Hospital, Sichuan University",
    nameZh: "四川大学华西第二医院",
    descriptionEn: "Leading women and children's hospital in western China.",
    descriptionZh: "中国西部领先的妇幼医院。",
    level: "Grade 3A",
    location: "Chengdu",
    specialties: JSON.stringify([
      "obstetrics", "gynecology", "pediatrics", "pediatric surgery", "reproductive medicine"
    ]),
    isFeatured: true,
    isActive: true,
  },

  // 陕西
  {
    nameEn: "The First Affiliated Hospital of Xi'an Jiaotong University",
    nameZh: "西安交通大学第一附属医院",
    descriptionEn: "Top hospital in Northwest China with comprehensive specialties.",
    descriptionZh: "西北地区顶级医院，专科全面。",
    level: "Grade 3A",
    location: "Xi'an",
    specialties: JSON.stringify([
      "cardiology", "neurology", "oncology", "transplant surgery", "urology", "gastroenterology"
    ]),
    isFeatured: true,
    isActive: true,
  },

  // 浙江
  {
    nameEn: "The First Affiliated Hospital of Zhejiang University",
    nameZh: "浙江大学医学院附属第一医院",
    descriptionEn: "Leader in organ transplantation and infectious diseases in East China.",
    descriptionZh: "华东地区器官移植和感染性疾病领域的领导者。",
    level: "Grade 3A",
    location: "Hangzhou",
    specialties: JSON.stringify([
      "organ transplant", "infectious diseases", "nephrology", "liver transplant", "kidney transplant"
    ]),
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "The Second Affiliated Hospital of Zhejiang University",
    nameZh: "浙江大学医学院附属第二医院",
    descriptionEn: "Excellence in cardiology, neurology, and ophthalmology.",
    descriptionZh: "在心脏病学、神经学和眼科学方面卓越。",
    level: "Grade 3A",
    location: "Hangzhou",
    specialties: JSON.stringify([
      "cardiology", "neurology", "ophthalmology", "surgery", "emergency medicine"
    ]),
    isFeatured: true,
    isActive: true,
  },

  // 江苏
  {
    nameEn: "The First Affiliated Hospital with Nanjing Medical University",
    nameZh: "南京医科大学第一附属医院",
    descriptionEn: "Leading general hospital in Jiangsu province.",
    descriptionZh: "江苏省领先的综合性医院。",
    level: "Grade 3A",
    location: "Nanjing",
    specialties: JSON.stringify([
      "cardiology", "neurology", "oncology", "surgery", "rehabilitation medicine"
    ]),
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "Jiangsu Province Hospital",
    nameZh: "江苏省人民医院",
    descriptionEn: "Top-tier medical center with advanced treatment capabilities.",
    descriptionZh: "顶级医疗中心，具有先进的治疗能力。",
    level: "Grade 3A",
    location: "Nanjing",
    specialties: JSON.stringify([
      "cardiology", "oncology", "neurology", "endocrinology", "gastroenterology"
    ]),
    isFeatured: true,
    isActive: true,
  },

  // 湖北
  {
    nameEn: "Tongji Hospital, Tongji Medical College of Huazhong University of Science and Technology",
    nameZh: "华中科技大学同济医学院附属同济医院",
    descriptionEn: "One of the most prestigious hospitals in Central China.",
    descriptionZh: "中国中部最负盛名的医院之一。",
    level: "Grade 3A",
    location: "Wuhan",
    specialties: JSON.stringify([
      "transplant surgery", "cardiology", "neurology", "oncology", "orthopedics", "urology"
    ]),
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "Union Hospital, Tongji Medical College of Huazhong University of Science and Technology",
    nameZh: "华中科技大学同济医学院附属协和医院",
    descriptionEn: "Excellence in multiple medical specialties and research.",
    descriptionZh: "在多个医学专科和科研方面表现卓越。",
    level: "Grade 3A",
    location: "Wuhan",
    specialties: JSON.stringify([
      "cardiology", "neurology", "oncology", "surgery", "radiation oncology", "hematology"
    ]),
    isFeatured: true,
    isActive: true,
  },

  // 天津
  {
    nameEn: "Tianjin Medical University General Hospital",
    nameZh: "天津医科大学总医院",
    descriptionEn: "Largest general hospital in Tianjin with comprehensive services.",
    descriptionZh: "天津最大的综合性医院，提供全面服务。",
    level: "Grade 3A",
    location: "Tianjin",
    specialties: JSON.stringify([
      "neurology", "cardiology", "oncology", "surgery", "endocrinology", "respiratory medicine"
    ]),
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "Tianjin Chest Hospital",
    nameZh: "天津市胸科医院",
    descriptionEn: "Specialized hospital for chest diseases and cardiac surgery.",
    descriptionZh: "专门从事胸科疾病和心脏外科的医院。",
    level: "Grade 3A",
    location: "Tianjin",
    specialties: JSON.stringify([
      "cardiac surgery", "thoracic surgery", "cardiology", "lung cancer", "respiratory medicine"
    ]),
    isFeatured: true,
    isActive: true,
  },

  // 湖南
  {
    nameEn: "Xiangya Hospital of Central South University",
    nameZh: "中南大学湘雅医院",
    descriptionEn: "Top hospital in Hunan with century-long history.",
    descriptionZh: "湖南顶级医院，拥有百年历史。",
    level: "Grade 3A",
    location: "Changsha",
    specialties: JSON.stringify([
      "neurology", "cardiology", "oncology", "transplant surgery", "psychiatry"
    ]),
    isFeatured: true,
    isActive: true,
  },

  // 山东
  {
    nameEn: "Qilu Hospital of Shandong University",
    nameZh: "山东大学齐鲁医院",
    descriptionEn: "Leading hospital in Shandong province with comprehensive specialties.",
    descriptionZh: "山东省领先医院，专科全面。",
    level: "Grade 3A",
    location: "Jinan",
    specialties: JSON.stringify([
      "cardiology", "neurology", "oncology", "surgery", "hematology", "gynecology"
    ]),
    isFeatured: true,
    isActive: true,
  },

  // 辽宁
  {
    nameEn: "The First Affiliated Hospital of China Medical University",
    nameZh: "中国医科大学附属第一医院",
    descriptionEn: "Top hospital in Northeast China with strong research capabilities.",
    descriptionZh: "中国东北顶级医院，科研实力强劲。",
    level: "Grade 3A",
    location: "Shenyang",
    specialties: JSON.stringify([
      "respiratory medicine", "endocrinology", "nephrology", "urology", "cardiology"
    ]),
    isFeatured: true,
    isActive: true,
  },
];

const SAMPLE_DOCTORS = [
  // 心血管内科
  {
    nameEn: "Dr. Chen Xiaoping",
    nameZh: "陈晓平",
    title: "Professor of Cardiology",
    specialtiesEn: JSON.stringify(["cardiology", "interventional cardiology", "heart failure", "coronary artery disease"]),
    specialtiesZh: JSON.stringify(["心血管内科", "介入心脏病学", "心力衰竭", "冠心病"]),
    descriptionEn: "Leading expert in interventional cardiology with over 30 years of experience.",
    descriptionZh: "介入心脏病学领先专家，拥有超过30年经验。",
    experienceYears: 30,
    consultationFee: "600",
    hospitalId: null,
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "Dr. Wang Jun",
    nameZh: "王俊",
    title: "Chief Cardiologist",
    specialtiesEn: JSON.stringify(["cardiology", "arrhythmia", "electrophysiology"]),
    specialtiesZh: JSON.stringify(["心血管内科", "心律失常", "电生理"]),
    descriptionEn: "Expert in cardiac arrhythmia treatment and catheter ablation.",
    descriptionZh: "心律失常治疗和导管消融专家。",
    experienceYears: 25,
    consultationFee: "550",
    hospitalId: null,
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "Dr. Liu Wei",
    nameZh: "刘伟",
    title: "Cardiologist",
    specialtiesEn: JSON.stringify(["cardiology", "hypertension", "preventive cardiology"]),
    specialtiesZh: JSON.stringify(["心血管内科", "高血压", "预防心脏病学"]),
    descriptionEn: "Specializes in hypertension management and cardiovascular prevention.",
    descriptionZh: "专长于高血压管理和心血管预防。",
    experienceYears: 18,
    consultationFee: "400",
    hospitalId: null,
    isFeatured: false,
    isActive: true,
  },

  // 肿瘤内科
  {
    nameEn: "Dr. Zhang Mei",
    nameZh: "张梅",
    title: "Professor of Oncology",
    specialtiesEn: JSON.stringify(["oncology", "cancer treatment", "targeted therapy", "immunotherapy"]),
    specialtiesZh: JSON.stringify(["肿瘤内科", "癌症治疗", "靶向治疗", "免疫治疗"]),
    descriptionEn: "Expert in targeted cancer therapies and personalized treatment plans.",
    descriptionZh: "靶向癌症治疗和个性化治疗方案专家。",
    experienceYears: 28,
    consultationFee: "700",
    hospitalId: null,
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "Dr. Li Yang",
    nameZh: "李阳",
    title: "Oncologist",
    specialtiesEn: JSON.stringify(["oncology", "lung cancer", "thoracic oncology"]),
    specialtiesZh: JSON.stringify(["肿瘤内科", "肺癌", "胸部肿瘤"]),
    descriptionEn: "Specializes in lung cancer diagnosis and treatment.",
    descriptionZh: "专长于肺癌诊断和治疗。",
    experienceYears: 20,
    consultationFee: "500",
    hospitalId: null,
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "Dr. Zhao Jing",
    nameZh: "赵静",
    title: "Oncologist",
    specialtiesEn: JSON.stringify(["oncology", "breast cancer", "gynecologic oncology"]),
    specialtiesZh: JSON.stringify(["肿瘤内科", "乳腺癌", "妇科肿瘤"]),
    descriptionEn: "Expert in breast cancer and gynecologic oncology.",
    descriptionZh: "乳腺癌和妇科肿瘤专家。",
    experienceYears: 22,
    consultationFee: "550",
    hospitalId: null,
    isFeatured: true,
    isActive: true,
  },

  // 神经内科
  {
    nameEn: "Dr. Wang Qiang",
    nameZh: "王强",
    title: "Professor of Neurology",
    specialtiesEn: JSON.stringify(["neurology", "stroke", "cerebrovascular disease"]),
    specialtiesZh: JSON.stringify(["神经内科", "脑卒中", "脑血管病"]),
    descriptionEn: "Leading expert in stroke treatment and cerebrovascular diseases.",
    descriptionZh: "脑卒中和脑血管病治疗领先专家。",
    experienceYears: 32,
    consultationFee: "650",
    hospitalId: null,
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "Dr. Liu Hao",
    nameZh: "刘浩",
    title: "Neurologist",
    specialtiesEn: JSON.stringify(["neurology", "epilepsy", "neurodegenerative diseases"]),
    specialtiesZh: JSON.stringify(["神经内科", "癫痫", "神经退行性疾病"]),
    descriptionEn: "Specializes in epilepsy and neurodegenerative disease treatment.",
    descriptionZh: "专长于癫痫和神经退行性疾病治疗。",
    experienceYears: 18,
    consultationFee: "450",
    hospitalId: null,
    isFeatured: false,
    isActive: true,
  },

  // 神经外科
  {
    nameEn: "Dr. Zhou Jian",
    nameZh: "周健",
    title: "Professor of Neurosurgery",
    specialtiesEn: JSON.stringify(["neurosurgery", "brain surgery", "spinal surgery", "minimally invasive neurosurgery"]),
    specialtiesZh: JSON.stringify(["神经外科", "脑外科", "脊柱手术", "微创神经外科"]),
    descriptionEn: "Pioneer in minimally invasive neurosurgery techniques.",
    descriptionZh: "微创神经外科技术先驱。",
    experienceYears: 28,
    consultationFee: "900",
    hospitalId: null,
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "Dr. Sun Kai",
    nameZh: "孙凯",
    title: "Neurosurgeon",
    specialtiesEn: JSON.stringify(["neurosurgery", "brain tumor", "vascular neurosurgery"]),
    specialtiesZh: JSON.stringify(["神经外科", "脑肿瘤", "血管神经外科"]),
    descriptionEn: "Expert in brain tumor and cerebrovascular surgery.",
    descriptionZh: "脑肿瘤和脑血管外科专家。",
    experienceYears: 20,
    consultationFee: "750",
    hospitalId: null,
    isFeatured: true,
    isActive: true,
  },

  // 心脏外科
  {
    nameEn: "Dr. Yang Guo",
    nameZh: "杨国",
    title: "Professor of Cardiac Surgery",
    specialtiesEn: JSON.stringify(["cardiac surgery", "heart transplant", "valve surgery", "coronary bypass"]),
    specialtiesZh: JSON.stringify(["心脏外科", "心脏移植", "瓣膜手术", "冠状动脉搭桥"]),
    descriptionEn: "Expert in complex cardiac surgeries and heart transplants.",
    descriptionZh: "复杂心脏手术和心脏移植专家。",
    experienceYears: 35,
    consultationFee: "1000",
    hospitalId: null,
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "Dr. Wu Ming",
    nameZh: "吴明",
    title: "Cardiac Surgeon",
    specialtiesEn: JSON.stringify(["cardiac surgery", "congenital heart disease", "pediatric cardiac surgery"]),
    specialtiesZh: JSON.stringify(["心脏外科", "先天性心脏病", "小儿心脏外科"]),
    descriptionEn: "Specializes in congenital heart disease and pediatric cardiac surgery.",
    descriptionZh: "专长于先天性心脏病和小儿心脏外科。",
    experienceYears: 22,
    consultationFee: "800",
    hospitalId: null,
    isFeatured: true,
    isActive: true,
  },

  // 骨科
  {
    nameEn: "Dr. Chen Yan",
    nameZh: "陈燕",
    title: "Professor of Orthopedics",
    specialtiesEn: JSON.stringify(["orthopedics", "sports medicine", "joint replacement", "spine surgery"]),
    specialtiesZh: JSON.stringify(["骨科", "运动医学", "关节置换", "脊柱手术"]),
    descriptionEn: "Specializes in sports injuries, joint replacement, and spine surgery.",
    descriptionZh: "专长于运动损伤、关节置换和脊柱手术。",
    experienceYears: 26,
    consultationFee: "700",
    hospitalId: null,
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "Dr. Zhang Peng",
    nameZh: "张鹏",
    title: "Orthopedic Surgeon",
    specialtiesEn: JSON.stringify(["orthopedics", "arthroscopy", "knee surgery", "shoulder surgery"]),
    specialtiesZh: JSON.stringify(["骨科", "关节镜", "膝关节手术", "肩关节手术"]),
    descriptionEn: "Expert in arthroscopic surgery and sports medicine.",
    descriptionZh: "关节镜手术和运动医学专家。",
    experienceYears: 16,
    consultationFee: "550",
    hospitalId: null,
    isFeatured: false,
    isActive: true,
  },

  // 肾内科
  {
    nameEn: "Dr. Liu Feng",
    nameZh: "刘峰",
    title: "Professor of Nephrology",
    specialtiesEn: JSON.stringify(["nephrology", "kidney disease", "dialysis", "kidney transplant"]),
    specialtiesZh: JSON.stringify(["肾内科", "肾脏病", "透析", "肾脏移植"]),
    descriptionEn: "Leading expert in kidney disease and transplantation.",
    descriptionZh: "肾脏病和移植领域领先专家。",
    experienceYears: 30,
    consultationFee: "600",
    hospitalId: null,
    isFeatured: true,
    isActive: true,
  },

  // 消化内科
  {
    nameEn: "Dr. Zhao Wei",
    nameZh: "赵伟",
    title: "Professor of Gastroenterology",
    specialtiesEn: JSON.stringify(["gastroenterology", "endoscopy", "liver disease", "digestive cancer"]),
    specialtiesZh: JSON.stringify(["消化内科", "内镜", "肝病", "消化道肿瘤"]),
    descriptionEn: "Expert in digestive diseases and endoscopic procedures.",
    descriptionZh: "消化疾病和内镜程序专家。",
    experienceYears: 27,
    consultationFee: "550",
    hospitalId: null,
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "Dr. Yang Xia",
    nameZh: "杨霞",
    title: "Gastroenterologist",
    specialtiesEn: JSON.stringify(["gastroenterology", "inflammatory bowel disease", "liver transplant"]),
    specialtiesZh: JSON.stringify(["消化内科", "炎症性肠病", "肝脏移植"]),
    descriptionEn: "Specializes in inflammatory bowel disease and liver transplant.",
    descriptionZh: "专长于炎症性肠病和肝脏移植。",
    experienceYears: 15,
    consultationFee: "450",
    hospitalId: null,
    isFeatured: false,
    isActive: true,
  },

  // 呼吸内科
  {
    nameEn: "Dr. Li Min",
    nameZh: "李敏",
    title: "Professor of Respiratory Medicine",
    specialtiesEn: JSON.stringify(["respiratory medicine", "pulmonology", "lung cancer", "COPD", "asthma"]),
    specialtiesZh: JSON.stringify(["呼吸内科", "肺科", "肺癌", "慢阻肺", "哮喘"]),
    descriptionEn: "Expert in respiratory diseases and lung cancer treatment.",
    descriptionZh: "呼吸疾病和肺癌治疗专家。",
    experienceYears: 29,
    consultationFee: "550",
    hospitalId: null,
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "Dr. Wang Qian",
    nameZh: "王倩",
    title: "Respiratory Medicine Specialist",
    specialtiesEn: JSON.stringify(["respiratory medicine", "pulmonary fibrosis", "sleep apnea"]),
    specialtiesZh: JSON.stringify(["呼吸内科", "肺纤维化", "睡眠呼吸暂停"]),
    descriptionEn: "Specializes in interstitial lung diseases and sleep medicine.",
    descriptionZh: "专长于间质性肺疾病和睡眠医学。",
    experienceYears: 14,
    consultationFee: "400",
    hospitalId: null,
    isFeatured: false,
    isActive: true,
  },

  // 内分泌科
  {
    nameEn: "Dr. Chen Lihua",
    nameZh: "陈丽华",
    title: "Professor of Endocrinology",
    specialtiesEn: JSON.stringify(["endocrinology", "diabetes", "thyroid disease", "metabolic disorders"]),
    specialtiesZh: JSON.stringify(["内分泌科", "糖尿病", "甲状腺疾病", "代谢性疾病"]),
    descriptionEn: "Leading expert in diabetes and metabolic diseases.",
    descriptionZh: "糖尿病和代谢性疾病领先专家。",
    experienceYears: 31,
    consultationFee: "500",
    hospitalId: null,
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "Dr. Zhang Jun",
    nameZh: "张军",
    title: "Endocrinologist",
    specialtiesEn: JSON.stringify(["endocrinology", "diabetes", "obesity", "osteoporosis"]),
    specialtiesZh: JSON.stringify(["内分泌科", "糖尿病", "肥胖症", "骨质疏松"]),
    descriptionEn: "Specializes in diabetes management and endocrine disorders.",
    descriptionZh: "专长于糖尿病管理和内分泌疾病。",
    experienceYears: 17,
    consultationFee: "400",
    hospitalId: null,
    isFeatured: false,
    isActive: true,
  },

  // 血液内科
  {
    nameEn: "Dr. Liu Xia",
    nameZh: "刘霞",
    title: "Professor of Hematology",
    specialtiesEn: JSON.stringify(["hematology", "leukemia", "lymphoma", "stem cell transplant"]),
    specialtiesZh: JSON.stringify(["血液内科", "白血病", "淋巴瘤", "干细胞移植"]),
    descriptionEn: "Expert in hematologic malignancies and stem cell transplantation.",
    descriptionZh: "血液恶性肿瘤和干细胞移植专家。",
    experienceYears: 28,
    consultationFee: "650",
    hospitalId: null,
    isFeatured: true,
    isActive: true,
  },

  // 普外科
  {
    nameEn: "Dr. Sun Tian",
    nameZh: "孙天",
    title: "Professor of Surgery",
    specialtiesEn: JSON.stringify(["surgery", "general surgery", "laparoscopic surgery", "abdominal surgery"]),
    specialtiesZh: JSON.stringify(["外科", "普外科", "腹腔镜手术", "腹部手术"]),
    descriptionEn: "Expert in minimally invasive surgery and general surgery.",
    descriptionZh: "微创手术和普外科专家。",
    experienceYears: 33,
    consultationFee: "600",
    hospitalId: null,
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "Dr. Zhou Hao",
    nameZh: "周浩",
    title: "Surgeon",
    specialtiesEn: JSON.stringify(["surgery", "breast surgery", "thyroid surgery", "endocrine surgery"]),
    specialtiesZh: JSON.stringify(["外科", "乳腺外科", "甲状腺外科", "内分泌外科"]),
    descriptionEn: "Specializes in breast, thyroid, and endocrine surgery.",
    descriptionZh: "专长于乳腺、甲状腺和内分泌外科。",
    experienceYears: 19,
    consultationFee: "500",
    hospitalId: null,
    isFeatured: false,
    isActive: true,
  },

  // 泌尿外科
  {
    nameEn: "Dr. Yang Feng",
    nameZh: "杨峰",
    title: "Professor of Urology",
    specialtiesEn: JSON.stringify(["urology", "kidney transplant", "prostate disease", "urologic oncology"]),
    specialtiesZh: JSON.stringify(["泌尿外科", "肾脏移植", "前列腺疾病", "泌尿肿瘤"]),
    descriptionEn: "Expert in urologic diseases and kidney transplantation.",
    descriptionZh: "泌尿疾病和肾脏移植专家。",
    experienceYears: 30,
    consultationFee: "600",
    hospitalId: null,
    isFeatured: true,
    isActive: true,
  },

  // 妇产科
  {
    nameEn: "Dr. Zhao Hong",
    nameZh: "赵红",
    title: "Professor of Gynecology and Obstetrics",
    specialtiesEn: JSON.stringify(["gynecology", "obstetrics", "reproductive medicine", "high-risk pregnancy"]),
    specialtiesZh: JSON.stringify(["妇科", "产科", "生殖医学", "高危妊娠"]),
    descriptionEn: "Expert in high-risk pregnancy and reproductive medicine.",
    descriptionZh: "高危妊娠和生殖医学专家。",
    experienceYears: 29,
    consultationFee: "450",
    hospitalId: null,
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "Dr. Liu Yan",
    nameZh: "刘艳",
    title: "Gynecologist",
    specialtiesEn: JSON.stringify(["gynecology", "gynecologic oncology", "endometriosis", "minimally invasive gynecologic surgery"]),
    specialtiesZh: JSON.stringify(["妇科", "妇科肿瘤", "子宫内膜异位症", "微创妇科手术"]),
    descriptionEn: "Specializes in gynecologic oncology and minimally invasive surgery.",
    descriptionZh: "专长于妇科肿瘤和微创手术。",
    experienceYears: 18,
    consultationFee: "500",
    hospitalId: null,
    isFeatured: true,
    isActive: true,
  },

  // 儿科
  {
    nameEn: "Dr. Wang Jing",
    nameZh: "王静",
    title: "Professor of Pediatrics",
    specialtiesEn: JSON.stringify(["pediatrics", "neonatology", "pediatric respiratory", "pediatric cardiology"]),
    specialtiesZh: JSON.stringify(["儿科", "新生儿科", "小儿呼吸", "小儿心脏"]),
    descriptionEn: "Leading expert in pediatric respiratory and cardiac diseases.",
    descriptionZh: "小儿呼吸和心脏疾病领先专家。",
    experienceYears: 27,
    consultationFee: "350",
    hospitalId: null,
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "Dr. Chen Yu",
    nameZh: "陈宇",
    title: "Pediatrician",
    specialtiesEn: JSON.stringify(["pediatrics", "pediatric neurology", "child development", "ADHD"]),
    specialtiesZh: JSON.stringify(["儿科", "小儿神经", "儿童发育", "多动症"]),
    descriptionEn: "Specializes in pediatric neurology and child development.",
    descriptionZh: "专长于小儿神经和儿童发育。",
    experienceYears: 15,
    consultationFee: "300",
    hospitalId: null,
    isFeatured: false,
    isActive: true,
  },
  {
    nameEn: "Dr. Liu Xiaoming",
    nameZh: "刘晓明",
    title: "Pediatric Surgeon",
    specialtiesEn: JSON.stringify(["pediatrics", "pediatric surgery", "neonatal surgery", "congenital anomalies"]),
    specialtiesZh: JSON.stringify(["儿科", "小儿外科", "新生儿外科", "先天畸形"]),
    descriptionEn: "Expert in pediatric surgery and neonatal care.",
    descriptionZh: "小儿外科和新生儿护理专家。",
    experienceYears: 20,
    consultationFee: "450",
    hospitalId: null,
    isFeatured: false,
    isActive: true,
  },

  // 眼科
  {
    nameEn: "Dr. Zhang Wei",
    nameZh: "张伟",
    title: "Professor of Ophthalmology",
    specialtiesEn: JSON.stringify(["ophthalmology", "cataract", "glaucoma", "retinal surgery", "LASIK"]),
    specialtiesZh: JSON.stringify(["眼科", "白内障", "青光眼", "视网膜手术", "激光近视手术"]),
    descriptionEn: "Expert in cataract, glaucoma, and refractive surgery.",
    descriptionZh: "白内障、青光眼和屈光手术专家。",
    experienceYears: 26,
    consultationFee: "400",
    hospitalId: null,
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "Dr. Li Na",
    nameZh: "李娜",
    title: "Ophthalmologist",
    specialtiesEn: JSON.stringify(["ophthalmology", "corneal disease", "dry eye", "contact lens"]),
    specialtiesZh: JSON.stringify(["眼科", "角膜病", "干眼症", "隐形眼镜"]),
    descriptionEn: "Specializes in corneal diseases and refractive surgery.",
    descriptionZh: "专长于角膜疾病和屈光手术。",
    experienceYears: 14,
    consultationFee: "300",
    hospitalId: null,
    isFeatured: false,
    isActive: true,
  },

  // 耳鼻喉科
  {
    nameEn: "Dr. Yang Jie",
    nameZh: "杨杰",
    title: "Professor of Otolaryngology",
    specialtiesEn: JSON.stringify(["otolaryngology", "ENT", "hearing loss", "sinus surgery", "sleep apnea"]),
    specialtiesZh: JSON.stringify(["耳鼻喉科", "听力损失", "鼻窦手术", "睡眠呼吸暂停"]),
    descriptionEn: "Expert in ENT surgery and hearing restoration.",
    descriptionZh: "耳鼻喉外科和听力恢复专家。",
    experienceYears: 24,
    consultationFee: "400",
    hospitalId: null,
    isFeatured: true,
    isActive: true,
  },

  // 皮肤科
  {
    nameEn: "Dr. Zhao Wei",
    nameZh: "赵薇",
    title: "Professor of Dermatology",
    specialtiesEn: JSON.stringify(["dermatology", "cosmetic dermatology", "skin cancer", "laser treatment", "acne"]),
    specialtiesZh: JSON.stringify(["皮肤科", "美容皮肤科", "皮肤癌", "激光治疗", "痤疮"]),
    descriptionEn: "Expert in skin diseases, cosmetic procedures, and skin cancer.",
    descriptionZh: "皮肤病、美容程序和皮肤癌专家。",
    experienceYears: 22,
    consultationFee: "350",
    hospitalId: null,
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "Dr. Chen Xi",
    nameZh: "陈曦",
    title: "Dermatologist",
    specialtiesEn: JSON.stringify(["dermatology", "psoriasis", "eczema", "allergic dermatology"]),
    specialtiesZh: JSON.stringify(["皮肤科", "银屑病", "湿疹", "过敏性疾病"]),
    descriptionEn: "Specializes in inflammatory skin diseases and allergies.",
    descriptionZh: "专长于炎症性皮肤病和过敏性疾病。",
    experienceYears: 12,
    consultationFee: "300",
    hospitalId: null,
    isFeatured: false,
    isActive: true,
  },

  // 精神科
  {
    nameEn: "Dr. Liu Peng",
    nameZh: "刘鹏",
    title: "Professor of Psychiatry",
    specialtiesEn: JSON.stringify(["psychiatry", "depression", "anxiety", "sleep disorders", "bipolar disorder"]),
    specialtiesZh: JSON.stringify(["精神科", "抑郁症", "焦虑症", "睡眠障碍", "双相情感障碍"]),
    descriptionEn: "Expert in mood disorders and psychotherapy.",
    descriptionZh: "情感障碍和心理治疗专家。",
    experienceYears: 25,
    consultationFee: "400",
    hospitalId: null,
    isFeatured: true,
    isActive: true,
  },

  // 传染科
  {
    nameEn: "Dr. Wang Hui",
    nameZh: "王慧",
    title: "Professor of Infectious Diseases",
    specialtiesEn: JSON.stringify(["infectious diseases", "hepatitis", "HIV/AIDS", "COVID-19", "tropical medicine"]),
    specialtiesZh: JSON.stringify(["传染科", "肝炎", "艾滋病", "新冠肺炎", "热带医学"]),
    descriptionEn: "Leading expert in viral hepatitis and infectious diseases.",
    descriptionZh: "病毒性肝炎和传染病领先专家。",
    experienceYears: 28,
    consultationFee: "450",
    hospitalId: null,
    isFeatured: true,
    isActive: true,
  },

  // 急诊医学
  {
    nameEn: "Dr. Zhang Li",
    nameZh: "张力",
    title: "Professor of Emergency Medicine",
    specialtiesEn: JSON.stringify(["emergency medicine", "trauma care", "critical care", "CPR"]),
    specialtiesZh: JSON.stringify(["急诊医学", "创伤护理", "重症监护", "心肺复苏"]),
    descriptionEn: "Expert in emergency and critical care medicine.",
    descriptionZh: "急诊和重症监护医学专家。",
    experienceYears: 23,
    consultationFee: "400",
    hospitalId: null,
    isFeatured: false,
    isActive: true,
  },

  // 疼痛科
  {
    nameEn: "Dr. Yang Kai",
    nameZh: "杨凯",
    title: "Pain Management Specialist",
    specialtiesEn: JSON.stringify(["pain management", "chronic pain", "cancer pain", "interventional pain"]),
    specialtiesZh: JSON.stringify(["疼痛科", "慢性疼痛", "癌痛", "介入疼痛治疗"]),
    descriptionEn: "Specializes in chronic pain management and interventional procedures.",
    descriptionZh: "专长于慢性疼痛管理和介入程序。",
    experienceYears: 16,
    consultationFee: "450",
    hospitalId: null,
    isFeatured: false,
    isActive: true,
  },

  // 康复医学
  {
    nameEn: "Dr. Chen Qiang",
    nameZh: "陈强",
    title: "Professor of Rehabilitation Medicine",
    specialtiesEn: JSON.stringify(["rehabilitation medicine", "physical therapy", "stroke rehabilitation", "sports rehabilitation"]),
    specialtiesZh: JSON.stringify(["康复医学", "物理治疗", "脑卒中康复", "运动康复"]),
    descriptionEn: "Expert in neurologic rehabilitation and sports injury recovery.",
    descriptionZh: "神经康复和运动损伤恢复专家。",
    experienceYears: 21,
    consultationFee: "350",
    hospitalId: null,
    isFeatured: false,
    isActive: true,
  },

  // 影像科
  {
    nameEn: "Dr. Zhao Ming",
    nameZh: "赵明",
    title: "Professor of Radiology",
    specialtiesEn: JSON.stringify(["radiology", "diagnostic radiology", "interventional radiology", "MRI", "CT"]),
    specialtiesZh: JSON.stringify(["影像科", "诊断放射学", "介入放射学", "磁共振", "CT"]),
    descriptionEn: "Expert in diagnostic and interventional radiology.",
    descriptionZh: "诊断和介入放射学专家。",
    experienceYears: 26,
    consultationFee: "400",
    hospitalId: null,
    isFeatured: false,
    isActive: true,
  },

  // 麻醉科
  {
    nameEn: "Dr. Liu Yang",
    nameZh: "刘洋",
    title: "Professor of Anesthesiology",
    specialtiesEn: JSON.stringify(["anesthesiology", "pain management", "critical care", "regional anesthesia"]),
    specialtiesZh: JSON.stringify(["麻醉科", "疼痛管理", "重症监护", "区域麻醉"]),
    descriptionEn: "Expert in anesthesia and perioperative care.",
    descriptionZh: "麻醉和围手术期护理专家。",
    experienceYears: 24,
    consultationFee: "400",
    hospitalId: null,
    isFeatured: false,
    isActive: true,
  },

  // 病理科
  {
    nameEn: "Dr. Sun Jing",
    nameZh: "孙静",
    title: "Professor of Pathology",
    specialtiesEn: JSON.stringify(["pathology", "surgical pathology", "cytopathology", "molecular pathology"]),
    specialtiesZh: JSON.stringify(["病理科", "外科病理", "细胞病理", "分子病理"]),
    descriptionEn: "Expert in diagnostic pathology and molecular diagnosis.",
    descriptionZh: "诊断病理和分子诊断专家。",
    experienceYears: 23,
    consultationFee: "350",
    hospitalId: null,
    isFeatured: false,
    isActive: true,
  },

  // 核医学科
  {
    nameEn: "Dr. Wang Feng",
    nameZh: "王峰",
    title: "Professor of Nuclear Medicine",
    specialtiesEn: JSON.stringify(["nuclear medicine", "PET-CT", "radioiodine therapy", "thyroid cancer"]),
    specialtiesZh: JSON.stringify(["核医学科", "PET-CT", "放射性碘治疗", "甲状腺癌"]),
    descriptionEn: "Expert in nuclear imaging and radionuclide therapy.",
    descriptionZh: "核影像和放射性核素治疗专家。",
    experienceYears: 20,
    consultationFee: "450",
    hospitalId: null,
    isFeatured: false,
    isActive: true,
  },

  // 营养科
  {
    nameEn: "Dr. Zhang Yu",
    nameZh: "张雨",
    title: "Nutritionist",
    specialtiesEn: JSON.stringify(["nutrition", "clinical nutrition", "dietary therapy", "weight management"]),
    specialtiesZh: JSON.stringify(["营养科", "临床营养", "饮食疗法", "体重管理"]),
    descriptionEn: "Expert in clinical nutrition and dietary management.",
    descriptionZh: "临床营养和饮食管理专家。",
    experienceYears: 12,
    consultationFee: "250",
    hospitalId: null,
    isFeatured: false,
    isActive: true,
  },

  // 中医科
  {
    nameEn: "Dr. Li Hong",
    nameZh: "李红",
    title: "Professor of Traditional Chinese Medicine",
    specialtiesEn: JSON.stringify(["traditional medicine", "acupuncture", "herbal medicine", "TCM diagnosis"]),
    specialtiesZh: JSON.stringify(["中医科", "针灸", "中草药", "中医诊断"]),
    descriptionEn: "Expert in traditional Chinese medicine and acupuncture.",
    descriptionZh: "中医和针灸专家。",
    experienceYears: 30,
    consultationFee: "350",
    hospitalId: null,
    isFeatured: false,
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
      console.log("⚠️  Hospitals already exist. Clearing and reseeding...");
      await db.delete(doctors);
      await db.delete(hospitals);
      console.log("✅ Cleared existing data");
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

    // Calculate statistics
    const locationStats: Record<string, number> = {};
    insertedHospitals.forEach(h => {
      locationStats[h.location] = (locationStats[h.location] || 0) + 1;
    });

    const specialtyStats: Record<string, number> = {};
    insertedDoctors.forEach(d => {
      const specialties = JSON.parse(d.specialtiesEn) as string[];
      specialties.forEach(s => {
        specialtyStats[s] = (specialtyStats[s] || 0) + 1;
      });
    });

    console.log("\n📊 Summary:");
    console.log(`   Total Hospitals: ${insertedHospitals.length}`);
    console.log(`   Total Doctors: ${insertedDoctors.length}`);
    console.log("\n🏥 Hospitals by Location:");
    Object.entries(locationStats)
      .sort((a, b) => b[1] - a[1])
      .forEach(([location, count]) => {
        console.log(`     ${location}: ${count} hospitals`);
      });
    console.log("\n👨‍⚕️ Top Medical Specialties:");
    Object.entries(specialtyStats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([specialty, count]) => {
        console.log(`     ${specialty}: ${count} doctors`);
      });

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
