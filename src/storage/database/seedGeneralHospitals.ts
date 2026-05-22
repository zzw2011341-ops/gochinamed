/**
 * Seed General Tier 3A Hospitals - 综合三甲医院数据填充
 * 在现有68家中医院基础上，为34个城市每城增加2家综合三甲医院（共68家）
 * 每家医院配备5名专科医生（共340名新医生）
 * 
 * Usage:
 * npx tsx src/storage/database/seedGeneralHospitals.ts
 */

import { getDb } from '@/lib/db';
import { hospitals, doctors, cities } from "./shared/schema";
import { v4 as uuidv4 } from "uuid";

// ==================== 综合三甲医院数据（每个城市2家） ====================
const GENERAL_HOSPITALS = [
  // 北京
  {
    nameEn: "Peking University First Hospital",
    nameZh: "北京大学第一医院",
    descriptionEn: "Premier comprehensive hospital affiliated with Peking University. National leader in nephrology, urology, and cardiovascular diseases.",
    descriptionZh: "北京大学附属医院，全国领先。肾内科、泌尿外科和心血管疾病治疗顶尖。",
    level: "Grade 3A",
    location: "Beijing",
    specialties: JSON.stringify(["nephrology", "urology", "cardiology", "general surgery", "internal medicine"]),
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "Beijing Union Medical College Hospital",
    nameZh: "北京协和医院",
    descriptionEn: "China's top-ranked hospital affiliated with Peking Union Medical College. Excellence in multiple specialties including endocrinology and rheumatology.",
    descriptionZh: "中国顶级医院，北京协和医学院附属医院。内分泌、风湿免疫等科室全国领先。",
    level: "Grade 3A",
    location: "Beijing",
    specialties: JSON.stringify(["endocrinology", "rheumatology", "internal medicine", "surgery", "critical care"]),
    isFeatured: true,
    isActive: true,
  },

  // 上海
  {
    nameEn: "Shanghai Jiao Tong University Affiliated Ruijin Hospital",
    nameZh: "上海交通大学医学院附属瑞金医院",
    descriptionEn: "Top-tier hospital famous for hematology, endocrinology, and cardiovascular surgery.",
    descriptionZh: "顶尖医院，血液科、内分泌科和心血管外科闻名全国。",
    level: "Grade 3A",
    location: "Shanghai",
    specialties: JSON.stringify(["hematology", "endocrinology", "cardiovascular surgery", "internal medicine", "oncology"]),
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "Fudan University Shanghai Cancer Center",
    nameZh: "复旦大学附属肿瘤医院",
    descriptionEn: "China's leading cancer hospital specializing in oncology, radiation therapy, and surgical oncology.",
    descriptionZh: "中国领先肿瘤医院，专长肿瘤学、放疗和肿瘤外科。",
    level: "Grade 3A",
    location: "Shanghai",
    specialties: JSON.stringify(["oncology", "radiation therapy", "surgical oncology", "chemotherapy", "immunotherapy"]),
    isFeatured: true,
    isActive: true,
  },

  // 广州
  {
    nameEn: "Sun Yat-sen University First Hospital",
    nameZh: "中山大学附属第一医院",
    descriptionEn: "Comprehensive hospital excellence in organ transplantation, general surgery, and internal medicine.",
    descriptionZh: "综合性医院，器官移植、普通外科和内科卓越。",
    level: "Grade 3A",
    location: "Guangzhou",
    specialties: JSON.stringify(["organ transplantation", "general surgery", "internal medicine", "nephrology", "hepatology"]),
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "Guangzhou General Hospital of Guangzhou Military Command",
    nameZh: "广州军区总医院",
    descriptionEn: "Military hospital with expertise in trauma surgery, orthopedics, and emergency medicine.",
    descriptionZh: "军区医院，创伤外科、骨科和急诊医学专长。",
    level: "Grade 3A",
    location: "Guangzhou",
    specialties: JSON.stringify(["trauma surgery", "orthopedics", "emergency medicine", "neurosurgery", "critical care"]),
    isFeatured: true,
    isActive: true,
  },

  // 成都
  {
    nameEn: "West China Hospital, Sichuan University",
    nameZh: "四川大学华西医院",
    descriptionEn: "China's largest hospital and a leading medical center. Excellence in all major medical specialties.",
    descriptionZh: "中国最大医院，领先医疗中心。所有主要医疗科室均卓越。",
    level: "Grade 3A",
    location: "Chengdu",
    specialties: JSON.stringify(["internal medicine", "surgery", "neurosurgery", "oncology", "transplantation"]),
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "Sichuan Provincial People's Hospital",
    nameZh: "四川省人民医院",
    descriptionEn: "Comprehensive hospital with strong departments in cardiology, neurology, and respiratory medicine.",
    descriptionZh: "综合性医院，心血管科、神经科和呼吸内科实力强劲。",
    level: "Grade 3A",
    location: "Chengdu",
    specialties: JSON.stringify(["cardiology", "neurology", "respiratory medicine", "internal medicine", "endocrinology"]),
    isFeatured: true,
    isActive: true,
  },

  // 南京
  {
    nameEn: "Jiangsu Province Hospital",
    nameZh: "江苏省人民医院",
    descriptionEn: "Top comprehensive hospital in Jiangsu with excellence in cardiology, neurology, and general surgery.",
    descriptionZh: "江苏顶尖综合性医院，心血管科、神经科和普通外科卓越。",
    level: "Grade 3A",
    location: "Nanjing",
    specialties: JSON.stringify(["cardiology", "neurology", "general surgery", "internal medicine", "oncology"]),
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "Nanjing Drum Tower Hospital",
    nameZh: "南京鼓楼医院",
    descriptionEn: "Historic hospital with modern facilities, specializing in orthopedics, nephrology, and infectious diseases.",
    descriptionZh: "历史悠久的现代化医院，骨科、肾内科和传染病专长。",
    level: "Grade 3A",
    location: "Nanjing",
    specialties: JSON.stringify(["orthopedics", "nephrology", "infectious diseases", "rheumatology", "internal medicine"]),
    isFeatured: true,
    isActive: true,
  },

  // 杭州
  {
    nameEn: "Zhejiang Provincial People's Hospital",
    nameZh: "浙江省人民医院",
    descriptionEn: "Leading comprehensive hospital in Zhejiang with excellence in cardiovascular medicine and neurology.",
    descriptionZh: "浙江领先综合性医院，心血管医学和神经内科卓越。",
    level: "Grade 3A",
    location: "Hangzhou",
    specialties: JSON.stringify(["cardiovascular medicine", "neurology", "internal medicine", "general surgery", "oncology"]),
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "First Affiliated Hospital of Zhejiang University School of Medicine",
    nameZh: "浙江大学医学院附属第一医院",
    descriptionEn: "Premier hospital famous for organ transplantation, infectious diseases, and hepatology.",
    descriptionZh: "顶尖医院，器官移植、传染病和肝病治疗闻名。",
    level: "Grade 3A",
    location: "Hangzhou",
    specialties: JSON.stringify(["organ transplantation", "infectious diseases", "hepatology", "nephrology", "general surgery"]),
    isFeatured: true,
    isActive: true,
  },

  // 武汉
  {
    nameEn: "Tongji Hospital, Tongji Medical College",
    nameZh: "华中科技大学同济医学院附属同济医院",
    descriptionEn: "Top-ranked hospital with national leadership in organ transplantation, neurology, and obstetrics.",
    descriptionZh: "顶级医院，器官移植、神经科和妇产科全国领先。",
    level: "Grade 3A",
    location: "Wuhan",
    specialties: JSON.stringify(["organ transplantation", "neurology", "obstetrics", "general surgery", "internal medicine"]),
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "Union Hospital, Tongji Medical College",
    nameZh: "华中科技大学同济医学院附属协和医院",
    descriptionEn: "Comprehensive hospital excellence in cardiovascular surgery, hematology, and urology.",
    descriptionZh: "综合性医院，心血管外科、血液科和泌尿外科卓越。",
    level: "Grade 3A",
    location: "Wuhan",
    specialties: JSON.stringify(["cardiovascular surgery", "hematology", "urology", "general surgery", "oncology"]),
    isFeatured: true,
    isActive: true,
  },

  // 西安
  {
    nameEn: "Xijing Hospital",
    nameZh: "西京医院",
    descriptionEn: "Top military hospital famous for organ transplantation, burn treatment, and digestive surgery.",
    descriptionZh: "顶级军区医院，器官移植、烧伤治疗和消化外科闻名。",
    level: "Grade 3A",
    location: "Xi'an",
    specialties: JSON.stringify(["organ transplantation", "burn treatment", "digestive surgery", "cardiovascular surgery", "orthopedics"]),
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "First Affiliated Hospital of Xi'an Jiaotong University",
    nameZh: "西安交通大学第一附属医院",
    descriptionEn: "Comprehensive hospital with excellence in cardiology, neurology, and general surgery.",
    descriptionZh: "综合性医院，心血管科、神经科和普通外科卓越。",
    level: "Grade 3A",
    location: "Xi'an",
    specialties: JSON.stringify(["cardiology", "neurology", "general surgery", "internal medicine", "endocrinology"]),
    isFeatured: true,
    isActive: true,
  },

  // 郑州
  {
    nameEn: "First Affiliated Hospital of Zhengzhou University",
    nameZh: "郑州大学第一附属医院",
    descriptionEn: "Largest hospital in Henan with excellence in neurology, cardiology, and general surgery.",
    descriptionZh: "河南最大医院，神经科、心血管科和普通外科卓越。",
    level: "Grade 3A",
    location: "Zhengzhou",
    specialties: JSON.stringify(["neurology", "cardiology", "general surgery", "internal medicine", "oncology"]),
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "Henan Provincial People's Hospital",
    nameZh: "河南省人民医院",
    descriptionEn: "Comprehensive hospital with strong departments in cardiology, respiratory medicine, and neurology.",
    descriptionZh: "综合性医院，心血管科、呼吸内科和神经科实力强劲。",
    level: "Grade 3A",
    location: "Zhengzhou",
    specialties: JSON.stringify(["cardiology", "respiratory medicine", "neurology", "internal medicine", "general surgery"]),
    isFeatured: true,
    isActive: true,
  },

  // 天津
  {
    nameEn: "Tianjin Medical University General Hospital",
    nameZh: "天津医科大学总医院",
    descriptionEn: "Top comprehensive hospital in Tianjin, famous for neurosurgery, cardiology, and endocrinology.",
    descriptionZh: "天津顶级综合性医院，神经外科、心血管科和内分泌科闻名。",
    level: "Grade 3A",
    location: "Tianjin",
    specialties: JSON.stringify(["neurosurgery", "cardiology", "endocrinology", "internal medicine", "general surgery"]),
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "Tianjin First Central Hospital",
    nameZh: "天津市第一中心医院",
    descriptionEn: "Premier hospital with excellence in organ transplantation, hepatology, and infectious diseases.",
    descriptionZh: "领先医院，器官移植、肝病和传染病治疗卓越。",
    level: "Grade 3A",
    location: "Tianjin",
    specialties: JSON.stringify(["organ transplantation", "hepatology", "infectious diseases", "general surgery", "internal medicine"]),
    isFeatured: true,
    isActive: true,
  },

  // 重庆
  {
    nameEn: "The First Affiliated Hospital of Chongqing Medical University",
    nameZh: "重庆医科大学附属第一医院",
    descriptionEn: "Top hospital in Chongqing with excellence in neurology, respiratory medicine, and cardiology.",
    descriptionZh: "重庆顶级医院，神经科、呼吸内科和心血管科卓越。",
    level: "Grade 3A",
    location: "Chongqing",
    specialties: JSON.stringify(["neurology", "respiratory medicine", "cardiology", "internal medicine", "general surgery"]),
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "Southwest Hospital",
    nameZh: "西南医院",
    descriptionEn: "Military hospital famous for burn treatment, orthopedics, and organ transplantation.",
    descriptionZh: "军区医院，烧伤治疗、骨科和器官移植闻名。",
    level: "Grade 3A",
    location: "Chongqing",
    specialties: JSON.stringify(["burn treatment", "orthopedics", "organ transplantation", "plastic surgery", "trauma surgery"]),
    isFeatured: true,
    isActive: true,
  },

  // 沈阳
  {
    nameEn: "Shengjing Hospital",
    nameZh: "盛京医院",
    descriptionEn: "Premier hospital in Northeast China, famous for pediatrics, obstetrics, and general surgery.",
    descriptionZh: "东北地区领先医院，儿科、妇产科和普通外科闻名。",
    level: "Grade 3A",
    location: "Shenyang",
    specialties: JSON.stringify(["pediatrics", "obstetrics", "general surgery", "internal medicine", "cardiology"]),
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "First Hospital of China Medical University",
    nameZh: "中国医科大学附属第一医院",
    descriptionEn: "Top comprehensive hospital with excellence in endocrinology, respiratory medicine, and neurology.",
    descriptionZh: "顶级综合性医院，内分泌科、呼吸内科和神经科卓越。",
    level: "Grade 3A",
    location: "Shenyang",
    specialties: JSON.stringify(["endocrinology", "respiratory medicine", "neurology", "internal medicine", "general surgery"]),
    isFeatured: true,
    isActive: true,
  },

  // 长春
  {
    nameEn: "First Hospital of Jilin University",
    nameZh: "吉林大学第一医院",
    descriptionEn: "Leading hospital in Jilin province with excellence in neurology, cardiology, and general surgery.",
    descriptionZh: "吉林省领先医院，神经科、心血管科和普通外科卓越。",
    level: "Grade 3A",
    location: "Changchun",
    specialties: JSON.stringify(["neurology", "cardiology", "general surgery", "internal medicine", "oncology"]),
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "Jilin Provincial People's Hospital",
    nameZh: "吉林省人民医院",
    descriptionEn: "Comprehensive hospital with strong departments in respiratory medicine, cardiology, and nephrology.",
    descriptionZh: "综合性医院，呼吸内科、心血管科和肾内科实力强劲。",
    level: "Grade 3A",
    location: "Changchun",
    specialties: JSON.stringify(["respiratory medicine", "cardiology", "nephrology", "internal medicine", "general surgery"]),
    isFeatured: true,
    isActive: true,
  },

  // 哈尔滨
  {
    nameEn: "First Affiliated Hospital of Harbin Medical University",
    nameZh: "哈尔滨医科大学附属第一医院",
    descriptionEn: "Top hospital in Heilongjiang, famous for neurosurgery, cardiology, and general surgery.",
    descriptionZh: "黑龙江顶级医院，神经外科、心血管科和普通外科闻名。",
    level: "Grade 3A",
    location: "Harbin",
    specialties: JSON.stringify(["neurosurgery", "cardiology", "general surgery", "internal medicine", "oncology"]),
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "Second Affiliated Hospital of Harbin Medical University",
    nameZh: "哈尔滨医科大学附属第二医院",
    descriptionEn: "Comprehensive hospital with excellence in cardiovascular surgery, organ transplantation, and endocrinology.",
    descriptionZh: "综合性医院，心血管外科、器官移植和内分泌科卓越。",
    level: "Grade 3A",
    location: "Harbin",
    specialties: JSON.stringify(["cardiovascular surgery", "organ transplantation", "endocrinology", "general surgery", "internal medicine"]),
    isFeatured: true,
    isActive: true,
  },

  // 合肥
  {
    nameEn: "First Affiliated Hospital of Anhui Medical University",
    nameZh: "安徽医科大学第一附属医院",
    descriptionEn: "Leading hospital in Anhui province with excellence in neurology, cardiology, and general surgery.",
    descriptionZh: "安徽省领先医院，神经科、心血管科和普通外科卓越。",
    level: "Grade 3A",
    location: "Hefei",
    specialties: JSON.stringify(["neurology", "cardiology", "general surgery", "internal medicine", "oncology"]),
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "Anhui Provincial Hospital",
    nameZh: "安徽省立医院",
    descriptionEn: "Comprehensive hospital with strong departments in respiratory medicine, nephrology, and endocrinology.",
    descriptionZh: "综合性医院，呼吸内科、肾内科和内分泌科实力强劲。",
    level: "Grade 3A",
    location: "Hefei",
    specialties: JSON.stringify(["respiratory medicine", "nephrology", "endocrinology", "internal medicine", "general surgery"]),
    isFeatured: true,
    isActive: true,
  },

  // 福州
  {
    nameEn: "First Affiliated Hospital of Fujian Medical University",
    nameZh: "福建医科大学附属第一医院",
    descriptionEn: "Top hospital in Fujian province, famous for neurology, cardiology, and general surgery.",
    descriptionZh: "福建省顶级医院，神经科、心血管科和普通外科闻名。",
    level: "Grade 3A",
    location: "Fuzhou",
    specialties: JSON.stringify(["neurology", "cardiology", "general surgery", "internal medicine", "oncology"]),
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "Fujian Provincial Hospital",
    nameZh: "福建省立医院",
    descriptionEn: "Comprehensive hospital with excellence in respiratory medicine, nephrology, and endocrinology.",
    descriptionZh: "综合性医院，呼吸内科、肾内科和内分泌科卓越。",
    level: "Grade 3A",
    location: "Fuzhou",
    specialties: JSON.stringify(["respiratory medicine", "nephrology", "endocrinology", "internal medicine", "general surgery"]),
    isFeatured: true,
    isActive: true,
  },

  // 南昌
  {
    nameEn: "First Affiliated Hospital of Nanchang University",
    nameZh: "南昌大学第一附属医院",
    descriptionEn: "Leading hospital in Jiangxi province with excellence in neurology, cardiology, and general surgery.",
    descriptionZh: "江西省领先医院，神经科、心血管科和普通外科卓越。",
    level: "Grade 3A",
    location: "Nanchang",
    specialties: JSON.stringify(["neurology", "cardiology", "general surgery", "internal medicine", "oncology"]),
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "Jiangxi Provincial People's Hospital",
    nameZh: "江西省人民医院",
    descriptionEn: "Comprehensive hospital with strong departments in respiratory medicine, nephrology, and endocrinology.",
    descriptionZh: "综合性医院，呼吸内科、肾内科和内分泌科实力强劲。",
    level: "Grade 3A",
    location: "Nanchang",
    specialties: JSON.stringify(["respiratory medicine", "nephrology", "endocrinology", "internal medicine", "general surgery"]),
    isFeatured: true,
    isActive: true,
  },

  // 济南
  {
    nameEn: "Qilu Hospital of Shandong University",
    nameZh: "山东大学齐鲁医院",
    descriptionEn: "Top hospital in Shandong province, famous for neurology, cardiology, and general surgery.",
    descriptionZh: "山东省顶级医院，神经科、心血管科和普通外科闻名。",
    level: "Grade 3A",
    location: "Jinan",
    specialties: JSON.stringify(["neurology", "cardiology", "general surgery", "internal medicine", "oncology"]),
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "Shandong Provincial Hospital",
    nameZh: "山东省立医院",
    descriptionEn: "Comprehensive hospital with excellence in respiratory medicine, nephrology, and endocrinology.",
    descriptionZh: "综合性医院，呼吸内科、肾内科和内分泌科卓越。",
    level: "Grade 3A",
    location: "Jinan",
    specialties: JSON.stringify(["respiratory medicine", "nephrology", "endocrinology", "internal medicine", "general surgery"]),
    isFeatured: true,
    isActive: true,
  },

  // 长沙
  {
    nameEn: "Xiangya Hospital of Central South University",
    nameZh: "中南大学湘雅医院",
    descriptionEn: "Premier hospital in Hunan province, famous for neurology, cardiology, and general surgery.",
    descriptionZh: "湖南省领先医院，神经科、心血管科和普通外科闻名。",
    level: "Grade 3A",
    location: "Changsha",
    specialties: JSON.stringify(["neurology", "cardiology", "general surgery", "internal medicine", "oncology"]),
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "Second Xiangya Hospital",
    nameZh: "中南大学湘雅二医院",
    descriptionEn: "Comprehensive hospital with excellence in cardiovascular surgery, psychiatry, and endocrinology.",
    descriptionZh: "综合性医院，心血管外科、精神科和内分泌科卓越。",
    level: "Grade 3A",
    location: "Changsha",
    specialties: JSON.stringify(["cardiovascular surgery", "psychiatry", "endocrinology", "general surgery", "internal medicine"]),
    isFeatured: true,
    isActive: true,
  },

  // 南宁
  {
    nameEn: "First Affiliated Hospital of Guangxi Medical University",
    nameZh: "广西医科大学第一附属医院",
    descriptionEn: "Leading hospital in Guangxi province with excellence in neurology, cardiology, and general surgery.",
    descriptionZh: "广西省领先医院，神经科、心血管科和普通外科卓越。",
    level: "Grade 3A",
    location: "Nanning",
    specialties: JSON.stringify(["neurology", "cardiology", "general surgery", "internal medicine", "oncology"]),
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "Guangxi Zhuang Autonomous Region People's Hospital",
    nameZh: "广西壮族自治区人民医院",
    descriptionEn: "Comprehensive hospital with strong departments in respiratory medicine, nephrology, and endocrinology.",
    descriptionZh: "综合性医院，呼吸内科、肾内科和内分泌科实力强劲。",
    level: "Grade 3A",
    location: "Nanning",
    specialties: JSON.stringify(["respiratory medicine", "nephrology", "endocrinology", "internal medicine", "general surgery"]),
    isFeatured: true,
    isActive: true,
  },

  // 海口
  {
    nameEn: "Hainan General Hospital",
    nameZh: "海南省人民医院",
    descriptionEn: "Top hospital in Hainan province with excellence in tropical medicine, neurology, and cardiology.",
    descriptionZh: "海南省顶级医院，热带医学、神经科和心血管科卓越。",
    level: "Grade 3A",
    location: "Haikou",
    specialties: JSON.stringify(["tropical medicine", "neurology", "cardiology", "internal medicine", "general surgery"]),
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "First Affiliated Hospital of Hainan Medical University",
    nameZh: "海南医学院第一附属医院",
    descriptionEn: "Comprehensive hospital with expertise in respiratory medicine, nephrology, and endocrinology.",
    descriptionZh: "综合性医院，呼吸内科、肾内科和内分泌科专长。",
    level: "Grade 3A",
    location: "Haikou",
    specialties: JSON.stringify(["respiratory medicine", "nephrology", "endocrinology", "internal medicine", "general surgery"]),
    isFeatured: true,
    isActive: true,
  },

  // 贵阳
  {
    nameEn: "Guizhou Provincial People's Hospital",
    nameZh: "贵州省人民医院",
    descriptionEn: "Leading hospital in Guizhou province with excellence in neurology, cardiology, and general surgery.",
    descriptionZh: "贵州省领先医院，神经科、心血管科和普通外科卓越。",
    level: "Grade 3A",
    location: "Guiyang",
    specialties: JSON.stringify(["neurology", "cardiology", "general surgery", "internal medicine", "oncology"]),
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "First Affiliated Hospital of Guizhou Medical University",
    nameZh: "贵州医科大学附属医院",
    descriptionEn: "Comprehensive hospital with strong departments in respiratory medicine, nephrology, and endocrinology.",
    descriptionZh: "综合性医院，呼吸内科、肾内科和内分泌科实力强劲。",
    level: "Grade 3A",
    location: "Guiyang",
    specialties: JSON.stringify(["respiratory medicine", "nephrology", "endocrinology", "internal medicine", "general surgery"]),
    isFeatured: true,
    isActive: true,
  },

  // 昆明
  {
    nameEn: "First Affiliated Hospital of Kunming Medical University",
    nameZh: "昆明医科大学第一附属医院",
    descriptionEn: "Top hospital in Yunnan province, famous for neurology, cardiology, and general surgery.",
    descriptionZh: "云南省顶级医院，神经科、心血管科和普通外科闻名。",
    level: "Grade 3A",
    location: "Kunming",
    specialties: JSON.stringify(["neurology", "cardiology", "general surgery", "internal medicine", "oncology"]),
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "Yunnan Provincial People's Hospital",
    nameZh: "云南省人民医院",
    descriptionEn: "Comprehensive hospital with excellence in respiratory medicine, nephrology, and endocrinology.",
    descriptionZh: "综合性医院，呼吸内科、肾内科和内分泌科卓越。",
    level: "Grade 3A",
    location: "Kunming",
    specialties: JSON.stringify(["respiratory medicine", "nephrology", "endocrinology", "internal medicine", "general surgery"]),
    isFeatured: true,
    isActive: true,
  },

  // 拉萨
  {
    nameEn: "Tibet Autonomous Region People's Hospital",
    nameZh: "西藏自治区人民医院",
    descriptionEn: "Premier hospital in Tibet with expertise in high-altitude medicine, neurology, and cardiology.",
    descriptionZh: "西藏领先医院，高原医学、神经科和心血管科专长。",
    level: "Grade 3A",
    location: "Lhasa",
    specialties: JSON.stringify(["high-altitude medicine", "neurology", "cardiology", "internal medicine", "respiratory medicine"]),
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "Second People's Hospital of Tibet Autonomous Region",
    nameZh: "西藏自治区第二人民医院",
    descriptionEn: "Comprehensive hospital specializing in respiratory medicine, nephrology, and internal medicine.",
    descriptionZh: "综合性医院，呼吸内科、肾内科和内科专长。",
    level: "Grade 3A",
    location: "Lhasa",
    specialties: JSON.stringify(["respiratory medicine", "nephrology", "internal medicine", "general medicine", "emergency medicine"]),
    isFeatured: true,
    isActive: true,
  },

  // 兰州
  {
    nameEn: "First Hospital of Lanzhou University",
    nameZh: "兰州大学第一医院",
    descriptionEn: "Leading hospital in Gansu province with excellence in neurology, cardiology, and general surgery.",
    descriptionZh: "甘肃省领先医院，神经科、心血管科和普通外科卓越。",
    level: "Grade 3A",
    location: "Lanzhou",
    specialties: JSON.stringify(["neurology", "cardiology", "general surgery", "internal medicine", "oncology"]),
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "Gansu Provincial Hospital",
    nameZh: "甘肃省人民医院",
    descriptionEn: "Comprehensive hospital with strong departments in respiratory medicine, nephrology, and endocrinology.",
    descriptionZh: "综合性医院，呼吸内科、肾内科和内分泌科实力强劲。",
    level: "Grade 3A",
    location: "Lanzhou",
    specialties: JSON.stringify(["respiratory medicine", "nephrology", "endocrinology", "internal medicine", "general surgery"]),
    isFeatured: true,
    isActive: true,
  },

  // 西宁
  {
    nameEn: "Qinghai Provincial People's Hospital",
    nameZh: "青海省人民医院",
    descriptionEn: "Top hospital in Qinghai province with expertise in high-altitude medicine, neurology, and cardiology.",
    descriptionZh: "青海省顶级医院，高原医学、神经科和心血管科专长。",
    level: "Grade 3A",
    location: "Xining",
    specialties: JSON.stringify(["high-altitude medicine", "neurology", "cardiology", "internal medicine", "respiratory medicine"]),
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "First Affiliated Hospital of Qinghai University",
    nameZh: "青海大学附属医院",
    descriptionEn: "Comprehensive hospital with excellence in general surgery, internal medicine, and obstetrics.",
    descriptionZh: "综合性医院，普通外科、内科和妇产科卓越。",
    level: "Grade 3A",
    location: "Xining",
    specialties: JSON.stringify(["general surgery", "internal medicine", "obstetrics", "pediatrics", "emergency medicine"]),
    isFeatured: true,
    isActive: true,
  },

  // 银川
  {
    nameEn: "General Hospital of Ningxia Medical University",
    nameZh: "宁夏医科大学总医院",
    descriptionEn: "Premier hospital in Ningxia with excellence in neurology, cardiology, and general surgery.",
    descriptionZh: "宁夏领先医院，神经科、心血管科和普通外科卓越。",
    level: "Grade 3A",
    location: "Yinchuan",
    specialties: JSON.stringify(["neurology", "cardiology", "general surgery", "internal medicine", "oncology"]),
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "Ningxia Hui Autonomous Region People's Hospital",
    nameZh: "宁夏回族自治区人民医院",
    descriptionEn: "Comprehensive hospital with strong departments in respiratory medicine, nephrology, and endocrinology.",
    descriptionZh: "综合性医院，呼吸内科、肾内科和内分泌科实力强劲。",
    level: "Grade 3A",
    location: "Yinchuan",
    specialties: JSON.stringify(["respiratory medicine", "nephrology", "endocrinology", "internal medicine", "general surgery"]),
    isFeatured: true,
    isActive: true,
  },

  // 乌鲁木齐
  {
    nameEn: "First Affiliated Hospital of Xinjiang Medical University",
    nameZh: "新疆医科大学第一附属医院",
    descriptionEn: "Leading hospital in Xinjiang with excellence in cardiology, neurology, and general surgery.",
    descriptionZh: "新疆领先医院，心血管科、神经科和普通外科卓越。",
    level: "Grade 3A",
    location: "Urumqi",
    specialties: JSON.stringify(["cardiology", "neurology", "general surgery", "internal medicine", "oncology"]),
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "Xinjiang Uygur Autonomous Region People's Hospital",
    nameZh: "新疆维吾尔自治区人民医院",
    descriptionEn: "Comprehensive hospital with strong departments in respiratory medicine, nephrology, and endocrinology.",
    descriptionZh: "综合性医院，呼吸内科、肾内科和内分泌科实力强劲。",
    level: "Grade 3A",
    location: "Urumqi",
    specialties: JSON.stringify(["respiratory medicine", "nephrology", "endocrinology", "internal medicine", "general surgery"]),
    isFeatured: true,
    isActive: true,
  },

  // 石家庄
  {
    nameEn: "Hebei General Hospital",
    nameZh: "河北省人民医院",
    descriptionEn: "Top hospital in Hebei province with excellence in neurology, cardiology, and general surgery.",
    descriptionZh: "河北省顶级医院，神经科、心血管科和普通外科卓越。",
    level: "Grade 3A",
    location: "Shijiazhuang",
    specialties: JSON.stringify(["neurology", "cardiology", "general surgery", "internal medicine", "oncology"]),
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "Second Hospital of Hebei Medical University",
    nameZh: "河北医科大学第二医院",
    descriptionEn: "Comprehensive hospital with strong departments in cardiovascular surgery, endocrinology, and nephrology.",
    descriptionZh: "综合性医院，心血管外科、内分泌科和肾内科实力强劲。",
    level: "Grade 3A",
    location: "Shijiazhuang",
    specialties: JSON.stringify(["cardiovascular surgery", "endocrinology", "nephrology", "internal medicine", "general surgery"]),
    isFeatured: true,
    isActive: true,
  },

  // 太原
  {
    nameEn: "Shanxi Provincial People's Hospital",
    nameZh: "山西省人民医院",
    descriptionEn: "Leading hospital in Shanxi province with excellence in neurology, cardiology, and general surgery.",
    descriptionZh: "山西省领先医院，神经科、心血管科和普通外科卓越。",
    level: "Grade 3A",
    location: "Taiyuan",
    specialties: JSON.stringify(["neurology", "cardiology", "general surgery", "internal medicine", "oncology"]),
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "First Hospital of Shanxi Medical University",
    nameZh: "山西医科大学第一医院",
    descriptionEn: "Comprehensive hospital with strong departments in respiratory medicine, nephrology, and endocrinology.",
    descriptionZh: "综合性医院，呼吸内科、肾内科和内分泌科实力强劲。",
    level: "Grade 3A",
    location: "Taiyuan",
    specialties: JSON.stringify(["respiratory medicine", "nephrology", "endocrinology", "internal medicine", "general surgery"]),
    isFeatured: true,
    isActive: true,
  },

  // 呼和浩特
  {
    nameEn: "Inner Mongolia People's Hospital",
    nameZh: "内蒙古自治区人民医院",
    descriptionEn: "Top hospital in Inner Mongolia with expertise in respiratory medicine, cardiology, and neurology.",
    descriptionZh: "内蒙古顶级医院，呼吸内科、心血管科和神经科专长。",
    level: "Grade 3A",
    location: "Hohhot",
    specialties: JSON.stringify(["respiratory medicine", "cardiology", "neurology", "internal medicine", "general surgery"]),
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "First Affiliated Hospital of Inner Mongolia Medical University",
    nameZh: "内蒙古医科大学附属医院",
    descriptionEn: "Comprehensive hospital with excellence in endocrinology, nephrology, and internal medicine.",
    descriptionZh: "综合性医院，内分泌科、肾内科和内科卓越。",
    level: "Grade 3A",
    location: "Hohhot",
    specialties: JSON.stringify(["endocrinology", "nephrology", "internal medicine", "general medicine", "emergency medicine"]),
    isFeatured: true,
    isActive: true,
  },

  // 台北
  {
    nameEn: "National Taiwan University Hospital",
    nameZh: "台湾大学医学院附设医院",
    descriptionEn: "Taiwan's premier hospital with excellence in all medical specialties, especially oncology and cardiology.",
    descriptionZh: "台湾顶级医院，所有医疗科室卓越，尤其是肿瘤科和心血管科。",
    level: "Grade 3A",
    location: "Taipei",
    specialties: JSON.stringify(["oncology", "cardiology", "neurology", "general surgery", "internal medicine"]),
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "Taipei Medical University Hospital",
    nameZh: "台北医学大学附设医院",
    descriptionEn: "Leading medical center with expertise in reproductive medicine, cardiology, and general surgery.",
    descriptionZh: "领先医疗中心，生殖医学、心血管科和普通外科专长。",
    level: "Grade 3A",
    location: "Taipei",
    specialties: JSON.stringify(["reproductive medicine", "cardiology", "general surgery", "internal medicine", "obstetrics"]),
    isFeatured: true,
    isActive: true,
  },

  // 香港
  {
    nameEn: "Queen Mary Hospital",
    nameZh: "玛丽医院",
    descriptionEn: "Hong Kong's flagship hospital with excellence in oncology, cardiology, and liver transplantation.",
    descriptionZh: "香港旗舰医院，肿瘤科、心血管科和肝移植卓越。",
    level: "Grade 3A",
    location: "Hong Kong",
    specialties: JSON.stringify(["oncology", "cardiology", "liver transplantation", "general surgery", "internal medicine"]),
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "Prince of Wales Hospital",
    nameZh: "威尔士亲王医院",
    descriptionEn: "Leading hospital in Hong Kong with expertise in neurology, respiratory medicine, and emergency care.",
    descriptionZh: "香港领先医院，神经科、呼吸内科和急诊护理专长。",
    level: "Grade 3A",
    location: "Hong Kong",
    specialties: JSON.stringify(["neurology", "respiratory medicine", "emergency care", "internal medicine", "general surgery"]),
    isFeatured: true,
    isActive: true,
  },

  // 澳门
  {
    nameEn: "Kiang Wu Hospital",
    nameZh: "镜湖医院",
    descriptionEn: "Premier private hospital in Macau with excellence in internal medicine, cardiology, and surgery.",
    descriptionZh: "澳门领先私立医院，内科、心血管科和外科卓越。",
    level: "Grade 3A",
    location: "Macau",
    specialties: JSON.stringify(["internal medicine", "cardiology", "general surgery", "oncology", "neurology"]),
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "Macau University of Science and Technology Hospital",
    nameZh: "澳门科大医院",
    descriptionEn: "Comprehensive hospital with expertise in reproductive medicine, pediatrics, and emergency medicine.",
    descriptionZh: "综合性医院，生殖医学、儿科和急诊医学专长。",
    level: "Grade 3A",
    location: "Macau",
    specialties: JSON.stringify(["reproductive medicine", "pediatrics", "emergency medicine", "internal medicine", "general surgery"]),
    isFeatured: true,
    isActive: true,
  },
];

// ==================== 综合医院医生模板（每家医院5名） ====================
function generateGeneralDoctors(hospitalId: string, hospitalName: string, specialties: string[] | string, hospitalCount: number) {
  const doctors: any[] = [];
  const parsedSpecialties = typeof specialties === 'string'
    ? JSON.parse(specialties)
    : specialties;
  
  // 根据医院专长生成对应专家
  const specializations = [
    {
      title: "Chief Physician",
      nameEn: "Dr. Wang",
      nameZh: "王医生",
      specialties: parsedSpecialties.slice(0, 2), // 取前两个专长
      descEn: "Chief physician with extensive experience in treating complex medical conditions.",
      descZh: "主任医师，擅长治疗复杂医疗疾病。",
    },
    {
      title: "Associate Chief Physician",
      nameEn: "Dr. Li",
      nameZh: "李医生",
      specialties: parsedSpecialties.slice(1, 3), // 取中间两个专长
      descEn: "Associate chief physician specializing in comprehensive medical care.",
      descZh: "副主任医师，专长综合医疗护理。",
    },
    {
      title: "Senior Specialist",
      nameEn: "Dr. Zhang",
      nameZh: "张医生",
      specialties: parsedSpecialties.slice(2, 4), // 取后两个专长
      descEn: "Senior specialist with expertise in advanced medical treatments.",
      descZh: "资深专家，擅长高级医疗治疗。",
    },
    {
      title: "Professor of Medicine",
      nameEn: "Dr. Liu",
      nameZh: "刘医生",
      specialties: [parsedSpecialties[0], "internal medicine"], // 第一个专长 + 内科
      descEn: "Professor of medicine with research focus on evidence-based treatments.",
      descZh: "医学教授，专注循证治疗研究。",
    },
    {
      title: "Specialist Physician",
      nameEn: "Dr. Chen",
      nameZh: "陈医生",
      specialties: [parsedSpecialties[parsedSpecialties.length - 1], "general surgery"], // 最后一个专长 + 外科
      descEn: "Specialist physician dedicated to patient-centered care.",
      descZh: "专科医生，专注以患者为中心的护理。",
    },
  ];

  specializations.forEach((spec, index) => {
    doctors.push({
      hospitalId,
      nameEn: `${spec.nameEn} ${hospitalCount}-${index + 1}`,
      nameZh: `${spec.nameZh} ${hospitalCount}-${index + 1}`,
      title: spec.title,
      gender: index % 2 === 0 ? "male" : "female",
      specialtiesEn: JSON.stringify(spec.specialties),
      specialtiesZh: JSON.stringify(spec.specialties.map((s: string) => {
        const translations: Record<string, string> = {
          "nephrology": "肾内科",
          "urology": "泌尿外科",
          "cardiology": "心血管科",
          "general surgery": "普通外科",
          "internal medicine": "内科",
          "endocrinology": "内分泌科",
          "rheumatology": "风湿免疫科",
          "hematology": "血液科",
          "cardiovascular surgery": "心血管外科",
          "oncology": "肿瘤科",
          "radiation therapy": "放疗",
          "surgical oncology": "肿瘤外科",
          "chemotherapy": "化疗",
          "immunotherapy": "免疫治疗",
          "organ transplantation": "器官移植",
          "hepatology": "肝病科",
          "trauma surgery": "创伤外科",
          "orthopedics": "骨科",
          "emergency medicine": "急诊科",
          "neurosurgery": "神经外科",
          "critical care": "重症医学科",
          "respiratory medicine": "呼吸内科",
          "neurology": "神经科",
          "obstetrics": "妇产科",
          "infectious diseases": "传染病科",
          "general medicine": "全科医学",
          "reproductive medicine": "生殖医学",
          "pediatrics": "儿科",
          "psychiatry": "精神科",
          "plastic surgery": "整形外科",
          "burn treatment": "烧伤科",
          "tropical medicine": "热带医学",
          "high-altitude medicine": "高原医学",
        };
        return translations[s] || s;
      })),
      descriptionEn: spec.descEn,
      descriptionZh: spec.descZh,
      experienceYears: 15 + Math.floor(Math.random() * 15),
      consultationFee: (400 + Math.floor(Math.random() * 200)).toString(),
      isFeatured: index < 3, // 前3个设为特色医生
      isActive: true,
    });
  });

  return doctors;
}

async function seedGeneralHospitals() {
  try {
    console.log("🏥 Connecting to database...");
    const db = await getDb();

    // 检查现有数据
    console.log("📋 Checking existing data...");
    const existingCities = await db.select().from(cities);
    const existingHospitals = await db.select().from(hospitals);
    const existingDoctors = await db.select().from(doctors);

    console.log(`📊 Current Database Status:`);
    console.log(`   Cities: ${existingCities.length}`);
    console.log(`   Hospitals: ${existingHospitals.length}`);
    console.log(`   Doctors: ${existingDoctors.length}`);

    // 创建城市 ID 到名称的映射
    const cityMap = new Map(existingCities.map(city => [city.nameEn, city.id]));

    console.log(`\n🏥 Adding ${GENERAL_HOSPITALS.length} general hospitals...`);
    const hospitalsWithCityId = GENERAL_HOSPITALS.map(hospital => {
      const cityId = cityMap.get(hospital.location);
      if (!cityId) {
        console.warn(`⚠️  No city found for location: ${hospital.location}`);
      }
      return {
        ...hospital,
        cityId: cityId || null,
      };
    });

    // 只插入有匹配城市的医院
    const validHospitals = hospitalsWithCityId.filter((h): h is typeof h & { cityId: string } => h.cityId !== null);
    const insertedHospitals = await db
      .insert(hospitals)
      .values(validHospitals)
      .returning();
    console.log(`✅ Created ${insertedHospitals.length} general hospitals`);

    console.log(`\n👨‍⚕️ Creating doctors for ${insertedHospitals.length} general hospitals...`);
    const allDoctors: any[] = [];
    insertedHospitals.forEach((hospital, index) => {
      // hospital.specialties is already parsed by Drizzle ORM (jsonb type)
      const specialties = typeof hospital.specialties === 'string'
        ? JSON.parse(hospital.specialties || "[]")
        : (hospital.specialties || []);

      const hospitalDoctors = generateGeneralDoctors(
        hospital.id,
        hospital.nameEn,
        specialties,
        index + 1
      );
      // 为每个医生添加 cityId
      const doctorsWithCityId = hospitalDoctors.map((doctor: any) => ({
        ...doctor,
        cityId: hospital.cityId,
      }));
      allDoctors.push(...doctorsWithCityId);
    });

    const insertedDoctors = await db
      .insert(doctors)
      .values(allDoctors)
      .returning();
    console.log(`✅ Created ${insertedDoctors.length} doctors (${insertedDoctors.length / insertedHospitals.length} doctors per hospital on average)`);

    // 统计结果
    const locationStats: Record<string, number> = {};
    insertedHospitals.forEach(h => {
      locationStats[h.location] = (locationStats[h.location] || 0) + 1;
    });

    // 检查最终数据库状态
    const finalHospitals = await db.select().from(hospitals);
    const finalDoctors = await db.select().from(doctors);

    console.log("\n📊 Summary:");
    console.log(`   General Hospitals Added: ${insertedHospitals.length}`);
    console.log(`   Doctors Added: ${insertedDoctors.length}`);
    console.log(`   Total Hospitals: ${finalHospitals.length}`);
    console.log(`   Total Doctors: ${finalDoctors.length}`);
    console.log(`   Average Doctors per Hospital: ${(finalDoctors.length / finalHospitals.length).toFixed(1)}`);

    console.log("\n🏥 General Hospitals by Location:");
    Object.entries(locationStats)
      .sort((a, b) => b[1] - a[1])
      .forEach(([location, count]) => {
        console.log(`     ${location}: ${count} hospitals`);
      });

    console.log("\n✨ General hospitals and doctors seeded successfully!");
    console.log("\n💡 Note: These are comprehensive Grade 3A hospitals (non-TCM).");
    console.log("💡 Each hospital has 5 specialized doctors covering different medical fields.");
    console.log("💡 All doctors are correctly linked to their respective cities.");
  } catch (error) {
    console.error("❌ Failed to seed general hospitals:", error);
    process.exit(1);
  }
}

seedGeneralHospitals()
  .then(() => {
    console.log("\n✅ Seed completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  });
