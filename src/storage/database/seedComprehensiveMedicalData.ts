/**
 * Seed Comprehensive Medical Data - 扩充医院和医生数据
 * 包含：34个城市 x 每个城市2家三甲医院 + 中医院 + 中医名家
 * 
 * Usage:
 * npx tsx src/storage/database/seedComprehensiveMedicalData.ts
 */

import { getDb } from "coze-coding-dev-sdk";
import { hospitals, doctors } from "./shared/schema";
import { v4 as uuidv4 } from "uuid";

// ==================== 城市列表 ====================
const CITIES = [
  { id: 'beijing', nameEn: 'Beijing', nameZh: '北京' },
  { id: 'tianjin', nameEn: 'Tianjin', nameZh: '天津' },
  { id: 'shanghai', nameEn: 'Shanghai', nameZh: '上海' },
  { id: 'chongqing', nameEn: 'Chongqing', nameZh: '重庆' },
  { id: 'shijiazhuang', nameEn: 'Shijiazhuang', nameZh: '石家庄' },
  { id: 'taiyuan', nameEn: 'Taiyuan', nameZh: '太原' },
  { id: 'hohhot', nameEn: 'Hohhot', nameZh: '呼和浩特' },
  { id: 'shenyang', nameEn: 'Shenyang', nameZh: '沈阳' },
  { id: 'changchun', nameEn: 'Changchun', nameZh: '长春' },
  { id: 'harbin', nameEn: 'Harbin', nameZh: '哈尔滨' },
  { id: 'nanjing', nameEn: 'Nanjing', nameZh: '南京' },
  { id: 'hangzhou', nameEn: 'Hangzhou', nameZh: '杭州' },
  { id: 'hefei', nameEn: 'Hefei', nameZh: '合肥' },
  { id: 'fuzhou', nameEn: 'Fuzhou', nameZh: '福州' },
  { id: 'nanchang', nameEn: 'Nanchang', nameZh: '南昌' },
  { id: 'jinan', nameEn: 'Jinan', nameZh: '济南' },
  { id: 'zhengzhou', nameEn: 'Zhengzhou', nameZh: '郑州' },
  { id: 'wuhan', nameEn: 'Wuhan', nameZh: '武汉' },
  { id: 'changsha', nameEn: 'Changsha', nameZh: '长沙' },
  { id: 'guangzhou', nameEn: 'Guangzhou', nameZh: '广州' },
  { id: 'nanning', nameEn: 'Nanning', nameZh: '南宁' },
  { id: 'haikou', nameEn: 'Haikou', nameZh: '海口' },
  { id: 'chengdu', nameEn: 'Chengdu', nameZh: '成都' },
  { id: 'guiyang', nameEn: 'Guiyang', nameZh: '贵阳' },
  { id: 'kunming', nameEn: 'Kunming', nameZh: '昆明' },
  { id: 'lhasa', nameEn: 'Lhasa', nameZh: '拉萨' },
  { id: 'xian', nameEn: 'Xi\'an', nameZh: '西安' },
  { id: 'lanzhou', nameEn: 'Lanzhou', nameZh: '兰州' },
  { id: 'xining', nameEn: 'Xining', nameZh: '西宁' },
  { id: 'yinchuan', nameEn: 'Yinchuan', nameZh: '银川' },
  { id: 'urumqi', nameEn: 'Urumqi', nameZh: '乌鲁木齐' },
  { id: 'taipei', nameEn: 'Taipei', nameZh: '台北' },
  { id: 'hongkong', nameEn: 'Hong Kong', nameZh: '香港' },
  { id: 'macau', nameEn: 'Macau', nameZh: '澳门' },
];

// ==================== 三甲医院数据（每个城市2家） ====================
const TOP_TIER_HOSPITALS = [
  // 北京
  {
    nameEn: "Beijing Hospital of Traditional Chinese Medicine",
    nameZh: "北京中医医院",
    descriptionEn: "Grade 3A TCM hospital with renowned experts in acupuncture, herbal medicine, and TCM therapies. Specialized in treating chronic diseases with integrated traditional and modern approaches.",
    descriptionZh: "三甲中医院，针灸、中药和中医疗法专家云集。擅长中西医结合治疗慢性疾病。",
    level: "Grade 3A",
    location: "Beijing",
    specialties: JSON.stringify(["acupuncture", "herbal medicine", "moxibustion", "cupping", "tuina", "traditional medicine"]),
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "Guang'anmen Hospital",
    nameZh: "广安门医院（中国中医科学院广安门医院）",
    descriptionEn: "China's premier TCM hospital affiliated with China Academy of Chinese Medical Sciences. World-famous for oncology, cardiovascular diseases, and diabetes treatment using TCM.",
    descriptionZh: "中国中医科学院附属医院，全国领先。肿瘤科、心血管科和糖尿病中医治疗世界闻名。",
    level: "Grade 3A",
    location: "Beijing",
    specialties: JSON.stringify(["tcm oncology", "cardiovascular tcm", "diabetes tcm", "acupuncture", "herbal medicine"]),
    isFeatured: true,
    isActive: true,
  },

  // 上海
  {
    nameEn: "Shanghai Hospital of Traditional Chinese Medicine",
    nameZh: "上海中医药大学附属曙光医院",
    descriptionEn: "Grade 3A hospital combining TCM with modern medicine. Famous for liver diseases, nephrology, and TCM oncology treatments.",
    descriptionZh: "中西医结合三甲医院。肝病、肾病和中医肿瘤治疗闻名全国。",
    level: "Grade 3A",
    location: "Shanghai",
    specialties: JSON.stringify(["hepatology tcm", "nephrology tcm", "tcm oncology", "acupuncture", "herbal medicine"]),
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "Shanghai Longhua Hospital",
    nameZh: "上海中医药大学附属龙华医院",
    descriptionEn: "Top-tier TCM hospital specializing in cancer treatment, digestive diseases, and acupuncture. National leader in TCM oncology research.",
    descriptionZh: "顶尖中医院，专长癌症治疗、消化疾病和针灸。中医肿瘤研究全国领先。",
    level: "Grade 3A",
    location: "Shanghai",
    specialties: JSON.stringify(["tcm oncology", "digestive tcm", "acupuncture", "moxibustion", "herbal medicine"]),
    isFeatured: true,
    isActive: true,
  },

  // 广州
  {
    nameEn: "Guangdong Provincial Hospital of Traditional Chinese Medicine",
    nameZh: "广东省中医院",
    descriptionEn: "Largest TCM hospital in Guangdong, famous for acupuncture, moxibustion, and herbal treatments. Specialized in rheumatology, orthopedics, and respiratory diseases.",
    descriptionZh: "广东最大中医院，针灸、艾灸、草药治疗闻名。风湿科、骨科和呼吸疾病专长。",
    level: "Grade 3A",
    location: "Guangzhou",
    specialties: JSON.stringify(["acupuncture", "moxibustion", "herbal medicine", "rheumatology tcm", "orthopedics tcm"]),
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "Guangzhou University of Chinese Medicine First Hospital",
    nameZh: "广州中医药大学第一附属医院",
    descriptionEn: "Leading TCM teaching hospital with excellence in orthopedics, oncology, and acupuncture anesthesia.",
    descriptionZh: "领先中医教学医院，骨科、肿瘤科和针灸麻醉卓越。",
    level: "Grade 3A",
    location: "Guangzhou",
    specialties: JSON.stringify(["orthopedics tcm", "tcm oncology", "acupuncture anesthesia", "tuina", "bone setting"]),
    isFeatured: true,
    isActive: true,
  },

  // 成都
  {
    nameEn: "Chengdu University of Traditional Chinese Medicine Hospital",
    nameZh: "成都中医药大学附属医院",
    descriptionEn: "Sichuan's premier TCM hospital, famous for acupuncture, herbal medicine, and respiratory disease treatment.",
    descriptionZh: "四川领先中医院，针灸、草药和呼吸疾病治疗闻名。",
    level: "Grade 3A",
    location: "Chengdu",
    specialties: JSON.stringify(["acupuncture", "herbal medicine", "respiratory tcm", "digestive tcm", "tuina"]),
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "Sichuan Provincial Hospital of Traditional Chinese Medicine",
    nameZh: "四川省中医院",
    descriptionEn: "Grade 3A hospital specializing in TCM internal medicine, acupuncture, and rehabilitation therapy.",
    descriptionZh: "三甲医院，专长中医内科、针灸和康复治疗。",
    level: "Grade 3A",
    location: "Chengdu",
    specialties: JSON.stringify(["internal medicine tcm", "acupuncture", "rehabilitation tcm", "moxibustion", "cupping"]),
    isFeatured: true,
    isActive: true,
  },

  // 南京
  {
    nameEn: "Jiangsu Province Hospital of Traditional Chinese Medicine",
    nameZh: "江苏省中医院",
    descriptionEn: "Top TCM hospital in Jiangsu, renowned for acupuncture, herbal medicine, and gynecology treatments.",
    descriptionZh: "江苏顶尖中医院，针灸、草药和妇科治疗闻名。",
    level: "Grade 3A",
    location: "Nanjing",
    specialties: JSON.stringify(["acupuncture", "herbal medicine", "gynecology tcm", "infertility tcm", "tuina"]),
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "Nanjing University of Chinese Medicine Hospital",
    nameZh: "南京中医药大学附属医院",
    descriptionEn: "Premier TCM teaching hospital specializing in internal medicine, acupuncture, and TCM oncology.",
    descriptionZh: "顶尖中医教学医院，专长中医内科、针灸和中医肿瘤。",
    level: "Grade 3A",
    location: "Nanjing",
    specialties: JSON.stringify(["internal medicine tcm", "acupuncture", "tcm oncology", "moxibustion", "herbal medicine"]),
    isFeatured: true,
    isActive: true,
  },

  // 杭州
  {
    nameEn: "Zhejiang Provincial Hospital of Traditional Chinese Medicine",
    nameZh: "浙江省中医院",
    descriptionEn: "Leading TCM hospital in Zhejiang, famous for acupuncture, herbal medicine, and internal medicine treatments.",
    descriptionZh: "浙江领先中医院，针灸、草药和内科治疗闻名。",
    level: "Grade 3A",
    location: "Hangzhou",
    specialties: JSON.stringify(["acupuncture", "herbal medicine", "internal medicine tcm", "tuina", "cupping"]),
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "Zhejiang TCM Hospital",
    nameZh: "浙江省中山医院",
    descriptionEn: "Comprehensive TCM hospital with expertise in acupuncture, moxibustion, and rehabilitation therapy.",
    descriptionZh: "综合性中医院，针灸、艾灸和康复治疗专长。",
    level: "Grade 3A",
    location: "Hangzhou",
    specialties: JSON.stringify(["acupuncture", "moxibustion", "rehabilitation tcm", "tuina", "internal medicine tcm"]),
    isFeatured: true,
    isActive: true,
  },

  // 武汉
  {
    nameEn: "Hubei Provincial Hospital of Traditional Chinese Medicine",
    nameZh: "湖北省中医院",
    descriptionEn: "Grade 3A hospital specializing in TCM internal medicine, acupuncture, and gynecology.",
    descriptionZh: "三甲医院，专长中医内科、针灸和妇科。",
    level: "Grade 3A",
    location: "Wuhan",
    specialties: JSON.stringify(["internal medicine tcm", "acupuncture", "gynecology tcm", "herbal medicine", "tuina"]),
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "Hubei University of Chinese Medicine Hospital",
    nameZh: "湖北中医药大学附属医院",
    descriptionEn: "Premier TCM teaching hospital with excellence in acupuncture, herbal medicine, and respiratory diseases.",
    descriptionZh: "领先中医教学医院，针灸、草药和呼吸疾病治疗卓越。",
    level: "Grade 3A",
    location: "Wuhan",
    specialties: JSON.stringify(["acupuncture", "herbal medicine", "respiratory tcm", "tuina", "moxibustion"]),
    isFeatured: true,
    isActive: true,
  },

  // 西安
  {
    nameEn: "Shaanxi Provincial Hospital of Traditional Chinese Medicine",
    nameZh: "陕西省中医院",
    descriptionEn: "Top TCM hospital in Shaanxi, famous for acupuncture, herbal medicine, and rheumatology treatments.",
    descriptionZh: "陕西顶尖中医院，针灸、草药和风湿科治疗闻名。",
    level: "Grade 3A",
    location: "Xi'an",
    specialties: JSON.stringify(["acupuncture", "herbal medicine", "rheumatology tcm", "tuina", "internal medicine tcm"]),
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "Xi'an Hospital of Traditional Chinese Medicine",
    nameZh: "西安市中医医院",
    descriptionEn: "Comprehensive TCM hospital with expertise in acupuncture, moxibustion, and rehabilitation therapy.",
    descriptionZh: "综合性中医院，针灸、艾灸和康复治疗专长。",
    level: "Grade 3A",
    location: "Xi'an",
    specialties: JSON.stringify(["acupuncture", "moxibustion", "rehabilitation tcm", "cupping", "tuina"]),
    isFeatured: true,
    isActive: true,
  },

  // 郑州
  {
    nameEn: "Henan Provincial Hospital of Traditional Chinese Medicine",
    nameZh: "河南省中医院",
    descriptionEn: "Grade 3A hospital specializing in TCM internal medicine, acupuncture, and orthopedics.",
    descriptionZh: "三甲医院，专长中医内科、针灸和骨科。",
    level: "Grade 3A",
    location: "Zhengzhou",
    specialties: JSON.stringify(["internal medicine tcm", "acupuncture", "orthopedics tcm", "bone setting", "tuina"]),
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "Henan University of Chinese Medicine First Hospital",
    nameZh: "河南中医药大学第一附属医院",
    descriptionEn: "Premier TCM teaching hospital with excellence in acupuncture, herbal medicine, and cardiovascular diseases.",
    descriptionZh: "领先中医教学医院，针灸、草药和心血管疾病治疗卓越。",
    level: "Grade 3A",
    location: "Zhengzhou",
    specialties: JSON.stringify(["acupuncture", "herbal medicine", "cardiovascular tcm", "tuina", "moxibustion"]),
    isFeatured: true,
    isActive: true,
  },

  // 天津
  {
    nameEn: "Tianjin University of Traditional Chinese Medicine First Hospital",
    nameZh: "天津中医药大学第一附属医院",
    descriptionEn: "Top-tier TCM hospital famous for acupuncture, moxibustion, and stroke rehabilitation.",
    descriptionZh: "顶尖中医院，针灸、艾灸和脑卒中康复闻名。",
    level: "Grade 3A",
    location: "Tianjin",
    specialties: JSON.stringify(["acupuncture", "moxibustion", "stroke rehabilitation", "tuina", "neurology tcm"]),
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "Tianjin Hospital of Traditional Chinese Medicine",
    nameZh: "天津市中医医院",
    descriptionEn: "Comprehensive TCM hospital with expertise in internal medicine, acupuncture, and gynecology.",
    descriptionZh: "综合性中医院，内科、针灸和妇科专长。",
    level: "Grade 3A",
    location: "Tianjin",
    specialties: JSON.stringify(["internal medicine tcm", "acupuncture", "gynecology tcm", "herbal medicine", "cupping"]),
    isFeatured: true,
    isActive: true,
  },

  // 重庆
  {
    nameEn: "Chongqing Hospital of Traditional Chinese Medicine",
    nameZh: "重庆市中医院",
    descriptionEn: "Grade 3A hospital specializing in TCM internal medicine, acupuncture, and orthopedics.",
    descriptionZh: "三甲医院，专长中医内科、针灸和骨科。",
    level: "Grade 3A",
    location: "Chongqing",
    specialties: JSON.stringify(["internal medicine tcm", "acupuncture", "orthopedics tcm", "tuina", "herbal medicine"]),
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "Chongqing University of Chinese Medicine Hospital",
    nameZh: "重庆中医药大学附属医院",
    descriptionEn: "Premier TCM teaching hospital with excellence in acupuncture, herbal medicine, and respiratory diseases.",
    descriptionZh: "领先中医教学医院，针灸、草药和呼吸疾病治疗卓越。",
    level: "Grade 3A",
    location: "Chongqing",
    specialties: JSON.stringify(["acupuncture", "herbal medicine", "respiratory tcm", "tuina", "moxibustion"]),
    isFeatured: true,
    isActive: true,
  },

  // 其他城市（简化版，每城市2家）
  // 沈阳
  {
    nameEn: "Liaoning Provincial Hospital of Traditional Chinese Medicine",
    nameZh: "辽宁省中医院",
    descriptionEn: "Grade 3A hospital specializing in TCM internal medicine, acupuncture, and rheumatology.",
    descriptionZh: "三甲医院，专长中医内科、针灸和风湿科。",
    level: "Grade 3A",
    location: "Shenyang",
    specialties: JSON.stringify(["internal medicine tcm", "acupuncture", "rheumatology tcm", "tuina", "herbal medicine"]),
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "Shenyang Hospital of Traditional Chinese Medicine",
    nameZh: "沈阳市中医医院",
    descriptionEn: "Comprehensive TCM hospital with expertise in acupuncture, moxibustion, and rehabilitation therapy.",
    descriptionZh: "综合性中医院，针灸、艾灸和康复治疗专长。",
    level: "Grade 3A",
    location: "Shenyang",
    specialties: JSON.stringify(["acupuncture", "moxibustion", "rehabilitation tcm", "cupping", "tuina"]),
    isFeatured: true,
    isActive: true,
  },

  // 长春
  {
    nameEn: "Changchun University of Chinese Medicine Hospital",
    nameZh: "长春中医药大学附属医院",
    descriptionEn: "Top-tier TCM hospital famous for acupuncture, herbal medicine, and internal medicine treatments.",
    descriptionZh: "顶尖中医院，针灸、草药和内科治疗闻名。",
    level: "Grade 3A",
    location: "Changchun",
    specialties: JSON.stringify(["acupuncture", "herbal medicine", "internal medicine tcm", "tuina", "moxibustion"]),
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "Jilin Provincial Hospital of Traditional Chinese Medicine",
    nameZh: "吉林省中医院",
    descriptionEn: "Grade 3A hospital specializing in TCM internal medicine, acupuncture, and gynecology.",
    descriptionZh: "三甲医院，专长中医内科、针灸和妇科。",
    level: "Grade 3A",
    location: "Changchun",
    specialties: JSON.stringify(["internal medicine tcm", "acupuncture", "gynecology tcm", "herbal medicine", "tuina"]),
    isFeatured: true,
    isActive: true,
  },

  // 哈尔滨
  {
    nameEn: "Heilongjiang Provincial Hospital of Traditional Chinese Medicine",
    nameZh: "黑龙江省中医院",
    descriptionEn: "Grade 3A hospital specializing in TCM internal medicine, acupuncture, and orthopedics.",
    descriptionZh: "三甲医院，专长中医内科、针灸和骨科。",
    level: "Grade 3A",
    location: "Harbin",
    specialties: JSON.stringify(["internal medicine tcm", "acupuncture", "orthopedics tcm", "bone setting", "tuina"]),
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "Harbin Hospital of Traditional Chinese Medicine",
    nameZh: "哈尔滨市中医医院",
    descriptionEn: "Comprehensive TCM hospital with expertise in acupuncture, moxibustion, and rehabilitation therapy.",
    descriptionZh: "综合性中医院，针灸、艾灸和康复治疗专长。",
    level: "Grade 3A",
    location: "Harbin",
    specialties: JSON.stringify(["acupuncture", "moxibustion", "rehabilitation tcm", "cupping", "tuina"]),
    isFeatured: true,
    isActive: true,
  },

  // 合肥
  {
    nameEn: "Anhui Provincial Hospital of Traditional Chinese Medicine",
    nameZh: "安徽省中医院",
    descriptionEn: "Grade 3A hospital specializing in TCM internal medicine, acupuncture, and neurology.",
    descriptionZh: "三甲医院，专长中医内科、针灸和神经内科。",
    level: "Grade 3A",
    location: "Hefei",
    specialties: JSON.stringify(["internal medicine tcm", "acupuncture", "neurology tcm", "tuina", "herbal medicine"]),
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "Hefei Hospital of Traditional Chinese Medicine",
    nameZh: "合肥市中医医院",
    descriptionEn: "Comprehensive TCM hospital with expertise in acupuncture, herbal medicine, and gynecology.",
    descriptionZh: "综合性中医院，针灸、草药和妇科专长。",
    level: "Grade 3A",
    location: "Hefei",
    specialties: JSON.stringify(["acupuncture", "herbal medicine", "gynecology tcm", "tuina", "moxibustion"]),
    isFeatured: true,
    isActive: true,
  },

  // 福州
  {
    nameEn: "Fujian Provincial Hospital of Traditional Chinese Medicine",
    nameZh: "福建省中医院",
    descriptionEn: "Grade 3A hospital specializing in TCM internal medicine, acupuncture, and rheumatology.",
    descriptionZh: "三甲医院，专长中医内科、针灸和风湿科。",
    level: "Grade 3A",
    location: "Fuzhou",
    specialties: JSON.stringify(["internal medicine tcm", "acupuncture", "rheumatology tcm", "tuina", "herbal medicine"]),
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "Fuzhou Hospital of Traditional Chinese Medicine",
    nameZh: "福州市中医医院",
    descriptionEn: "Comprehensive TCM hospital with expertise in acupuncture, moxibustion, and rehabilitation therapy.",
    descriptionZh: "综合性中医院，针灸、艾灸和康复治疗专长。",
    level: "Grade 3A",
    location: "Fuzhou",
    specialties: JSON.stringify(["acupuncture", "moxibustion", "rehabilitation tcm", "cupping", "tuina"]),
    isFeatured: true,
    isActive: true,
  },

  // 南昌
  {
    nameEn: "Jiangxi Provincial Hospital of Traditional Chinese Medicine",
    nameZh: "江西省中医院",
    descriptionEn: "Grade 3A hospital specializing in TCM internal medicine, acupuncture, and respiratory diseases.",
    descriptionZh: "三甲医院，专长中医内科、针灸和呼吸疾病。",
    level: "Grade 3A",
    location: "Nanchang",
    specialties: JSON.stringify(["internal medicine tcm", "acupuncture", "respiratory tcm", "tuina", "herbal medicine"]),
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "Nanchang Hospital of Traditional Chinese Medicine",
    nameZh: "南昌市中医医院",
    descriptionEn: "Comprehensive TCM hospital with expertise in acupuncture, herbal medicine, and gynecology.",
    descriptionZh: "综合性中医院，针灸、草药和妇科专长。",
    level: "Grade 3A",
    location: "Nanchang",
    specialties: JSON.stringify(["acupuncture", "herbal medicine", "gynecology tcm", "tuina", "moxibustion"]),
    isFeatured: true,
    isActive: true,
  },

  // 济南
  {
    nameEn: "Shandong Provincial Hospital of Traditional Chinese Medicine",
    nameZh: "山东省中医院",
    descriptionEn: "Grade 3A hospital specializing in TCM internal medicine, acupuncture, and orthopedics.",
    descriptionZh: "三甲医院，专长中医内科、针灸和骨科。",
    level: "Grade 3A",
    location: "Jinan",
    specialties: JSON.stringify(["internal medicine tcm", "acupuncture", "orthopedics tcm", "bone setting", "tuina"]),
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "Jinan Hospital of Traditional Chinese Medicine",
    nameZh: "济南市中医医院",
    descriptionEn: "Comprehensive TCM hospital with expertise in acupuncture, moxibustion, and rehabilitation therapy.",
    descriptionZh: "综合性中医院，针灸、艾灸和康复治疗专长。",
    level: "Grade 3A",
    location: "Jinan",
    specialties: JSON.stringify(["acupuncture", "moxibustion", "rehabilitation tcm", "cupping", "tuina"]),
    isFeatured: true,
    isActive: true,
  },

  // 长沙
  {
    nameEn: "Hunan Provincial Hospital of Traditional Chinese Medicine",
    nameZh: "湖南省中医院",
    descriptionEn: "Grade 3A hospital specializing in TCM internal medicine, acupuncture, and rheumatology.",
    descriptionZh: "三甲医院，专长中医内科、针灸和风湿科。",
    level: "Grade 3A",
    location: "Changsha",
    specialties: JSON.stringify(["internal medicine tcm", "acupuncture", "rheumatology tcm", "tuina", "herbal medicine"]),
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "Changsha Hospital of Traditional Chinese Medicine",
    nameZh: "长沙市中医医院",
    descriptionEn: "Comprehensive TCM hospital with expertise in acupuncture, herbal medicine, and gynecology.",
    descriptionZh: "综合性中医院，针灸、草药和妇科专长。",
    level: "Grade 3A",
    location: "Changsha",
    specialties: JSON.stringify(["acupuncture", "herbal medicine", "gynecology tcm", "tuina", "moxibustion"]),
    isFeatured: true,
    isActive: true,
  },

  // 南宁
  {
    nameEn: "Guangxi Zhuang Autonomous Region Hospital of Traditional Chinese Medicine",
    nameZh: "广西壮族自治区中医医院",
    descriptionEn: "Grade 3A hospital specializing in TCM internal medicine, acupuncture, and respiratory diseases.",
    descriptionZh: "三甲医院，专长中医内科、针灸和呼吸疾病。",
    level: "Grade 3A",
    location: "Nanning",
    specialties: JSON.stringify(["internal medicine tcm", "acupuncture", "respiratory tcm", "tuina", "herbal medicine"]),
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "Nanning Hospital of Traditional Chinese Medicine",
    nameZh: "南宁市中医医院",
    descriptionEn: "Comprehensive TCM hospital with expertise in acupuncture, herbal medicine, and rehabilitation therapy.",
    descriptionZh: "综合性中医院，针灸、草药和康复治疗专长。",
    level: "Grade 3A",
    location: "Nanning",
    specialties: JSON.stringify(["acupuncture", "herbal medicine", "rehabilitation tcm", "tuina", "cupping"]),
    isFeatured: true,
    isActive: true,
  },

  // 海口
  {
    nameEn: "Hainan Provincial Hospital of Traditional Chinese Medicine",
    nameZh: "海南省中医院",
    descriptionEn: "Grade 3A hospital specializing in TCM internal medicine, acupuncture, and tropical medicine.",
    descriptionZh: "三甲医院，专长中医内科、针灸和热带医学。",
    level: "Grade 3A",
    location: "Haikou",
    specialties: JSON.stringify(["internal medicine tcm", "acupuncture", "tropical medicine tcm", "tuina", "herbal medicine"]),
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "Haikou Hospital of Traditional Chinese Medicine",
    nameZh: "海口市中医医院",
    descriptionEn: "Comprehensive TCM hospital with expertise in acupuncture, moxibustion, and gynecology.",
    descriptionZh: "综合性中医院，针灸、艾灸和妇科专长。",
    level: "Grade 3A",
    location: "Haikou",
    specialties: JSON.stringify(["acupuncture", "moxibustion", "gynecology tcm", "tuina", "herbal medicine"]),
    isFeatured: true,
    isActive: true,
  },

  // 贵阳
  {
    nameEn: "Guizhou Provincial Hospital of Traditional Chinese Medicine",
    nameZh: "贵州省中医院",
    descriptionEn: "Grade 3A hospital specializing in TCM internal medicine, acupuncture, and rheumatology.",
    descriptionZh: "三甲医院，专长中医内科、针灸和风湿科。",
    level: "Grade 3A",
    location: "Guiyang",
    specialties: JSON.stringify(["internal medicine tcm", "acupuncture", "rheumatology tcm", "tuina", "herbal medicine"]),
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "Guiyang Hospital of Traditional Chinese Medicine",
    nameZh: "贵阳市中医医院",
    descriptionEn: "Comprehensive TCM hospital with expertise in acupuncture, herbal medicine, and rehabilitation therapy.",
    descriptionZh: "综合性中医院，针灸、草药和康复治疗专长。",
    level: "Grade 3A",
    location: "Guiyang",
    specialties: JSON.stringify(["acupuncture", "herbal medicine", "rehabilitation tcm", "tuina", "cupping"]),
    isFeatured: true,
    isActive: true,
  },

  // 昆明
  {
    nameEn: "Yunnan Provincial Hospital of Traditional Chinese Medicine",
    nameZh: "云南省中医院",
    descriptionEn: "Grade 3A hospital specializing in TCM internal medicine, acupuncture, and ethnic medicine.",
    descriptionZh: "三甲医院，专长中医内科、针灸和民族医药。",
    level: "Grade 3A",
    location: "Kunming",
    specialties: JSON.stringify(["internal medicine tcm", "acupuncture", "ethnic medicine", "tuina", "herbal medicine"]),
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "Kunming Hospital of Traditional Chinese Medicine",
    nameZh: "昆明市中医医院",
    descriptionEn: "Comprehensive TCM hospital with expertise in acupuncture, moxibustion, and gynecology.",
    descriptionZh: "综合性中医院，针灸、艾灸和妇科专长。",
    level: "Grade 3A",
    location: "Kunming",
    specialties: JSON.stringify(["acupuncture", "moxibustion", "gynecology tcm", "tuina", "herbal medicine"]),
    isFeatured: true,
    isActive: true,
  },

  // 拉萨
  {
    nameEn: "Tibet Autonomous Region Hospital of Traditional Chinese Medicine",
    nameZh: "西藏自治区藏医医院",
    descriptionEn: "Grade 3A hospital specializing in Tibetan medicine, acupuncture, and herbal treatments.",
    descriptionZh: "三甲医院，专长藏医、针灸和草药治疗。",
    level: "Grade 3A",
    location: "Lhasa",
    specialties: JSON.stringify(["tibetan medicine", "acupuncture", "herbal medicine", "tuina", "internal medicine tcm"]),
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "Lhasa Hospital of Traditional Chinese Medicine",
    nameZh: "拉萨市中医医院",
    descriptionEn: "Comprehensive TCM hospital with expertise in acupuncture, moxibustion, and rehabilitation therapy.",
    descriptionZh: "综合性中医院，针灸、艾灸和康复治疗专长。",
    level: "Grade 3A",
    location: "Lhasa",
    specialties: JSON.stringify(["acupuncture", "moxibustion", "rehabilitation tcm", "tuina", "herbal medicine"]),
    isFeatured: true,
    isActive: true,
  },

  // 兰州
  {
    nameEn: "Gansu Provincial Hospital of Traditional Chinese Medicine",
    nameZh: "甘肃省中医院",
    descriptionEn: "Grade 3A hospital specializing in TCM internal medicine, acupuncture, and rheumatology.",
    descriptionZh: "三甲医院，专长中医内科、针灸和风湿科。",
    level: "Grade 3A",
    location: "Lanzhou",
    specialties: JSON.stringify(["internal medicine tcm", "acupuncture", "rheumatology tcm", "tuina", "herbal medicine"]),
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "Lanzhou Hospital of Traditional Chinese Medicine",
    nameZh: "兰州市中医医院",
    descriptionEn: "Comprehensive TCM hospital with expertise in acupuncture, herbal medicine, and gynecology.",
    descriptionZh: "综合性中医院，针灸、草药和妇科专长。",
    level: "Grade 3A",
    location: "Lanzhou",
    specialties: JSON.stringify(["acupuncture", "herbal medicine", "gynecology tcm", "tuina", "moxibustion"]),
    isFeatured: true,
    isActive: true,
  },

  // 西宁
  {
    nameEn: "Qinghai Provincial Hospital of Traditional Chinese Medicine",
    nameZh: "青海省中医院",
    descriptionEn: "Grade 3A hospital specializing in TCM internal medicine, acupuncture, and respiratory diseases.",
    descriptionZh: "三甲医院，专长中医内科、针灸和呼吸疾病。",
    level: "Grade 3A",
    location: "Xining",
    specialties: JSON.stringify(["internal medicine tcm", "acupuncture", "respiratory tcm", "tuina", "herbal medicine"]),
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "Xining Hospital of Traditional Chinese Medicine",
    nameZh: "西宁市中医医院",
    descriptionEn: "Comprehensive TCM hospital with expertise in acupuncture, moxibustion, and rehabilitation therapy.",
    descriptionZh: "综合性中医院，针灸、艾灸和康复治疗专长。",
    level: "Grade 3A",
    location: "Xining",
    specialties: JSON.stringify(["acupuncture", "moxibustion", "rehabilitation tcm", "cupping", "tuina"]),
    isFeatured: true,
    isActive: true,
  },

  // 银川
  {
    nameEn: "Ningxia Hui Autonomous Region Hospital of Traditional Chinese Medicine",
    nameZh: "宁夏回族自治区中医医院",
    descriptionEn: "Grade 3A hospital specializing in TCM internal medicine, acupuncture, and rheumatology.",
    descriptionZh: "三甲医院，专长中医内科、针灸和风湿科。",
    level: "Grade 3A",
    location: "Yinchuan",
    specialties: JSON.stringify(["internal medicine tcm", "acupuncture", "rheumatology tcm", "tuina", "herbal medicine"]),
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "Yinchuan Hospital of Traditional Chinese Medicine",
    nameZh: "银川市中医医院",
    descriptionEn: "Comprehensive TCM hospital with expertise in acupuncture, herbal medicine, and gynecology.",
    descriptionZh: "综合性中医院，针灸、草药和妇科专长。",
    level: "Grade 3A",
    location: "Yinchuan",
    specialties: JSON.stringify(["acupuncture", "herbal medicine", "gynecology tcm", "tuina", "moxibustion"]),
    isFeatured: true,
    isActive: true,
  },

  // 乌鲁木齐
  {
    nameEn: "Xinjiang Uygur Autonomous Region Hospital of Traditional Chinese Medicine",
    nameZh: "新疆维吾尔自治区中医医院",
    descriptionEn: "Grade 3A hospital specializing in TCM internal medicine, acupuncture, and ethnic medicine.",
    descriptionZh: "三甲医院，专长中医内科、针灸和民族医药。",
    level: "Grade 3A",
    location: "Urumqi",
    specialties: JSON.stringify(["internal medicine tcm", "acupuncture", "uyghur medicine", "tuina", "herbal medicine"]),
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "Urumqi Hospital of Traditional Chinese Medicine",
    nameZh: "乌鲁木齐市中医医院",
    descriptionEn: "Comprehensive TCM hospital with expertise in acupuncture, moxibustion, and rehabilitation therapy.",
    descriptionZh: "综合性中医院，针灸、艾灸和康复治疗专长。",
    level: "Grade 3A",
    location: "Urumqi",
    specialties: JSON.stringify(["acupuncture", "moxibustion", "rehabilitation tcm", "tuina", "cupping"]),
    isFeatured: true,
    isActive: true,
  },

  // 石家庄
  {
    nameEn: "Hebei Provincial Hospital of Traditional Chinese Medicine",
    nameZh: "河北省中医院",
    descriptionEn: "Grade 3A hospital specializing in TCM internal medicine, acupuncture, and rheumatology.",
    descriptionZh: "三甲医院，专长中医内科、针灸和风湿科。",
    level: "Grade 3A",
    location: "Shijiazhuang",
    specialties: JSON.stringify(["internal medicine tcm", "acupuncture", "rheumatology tcm", "tuina", "herbal medicine"]),
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "Shijiazhuang Hospital of Traditional Chinese Medicine",
    nameZh: "石家庄市中医医院",
    descriptionEn: "Comprehensive TCM hospital with expertise in acupuncture, herbal medicine, and gynecology.",
    descriptionZh: "综合性中医院，针灸、草药和妇科专长。",
    level: "Grade 3A",
    location: "Shijiazhuang",
    specialties: JSON.stringify(["acupuncture", "herbal medicine", "gynecology tcm", "tuina", "moxibustion"]),
    isFeatured: true,
    isActive: true,
  },

  // 太原
  {
    nameEn: "Shanxi Provincial Hospital of Traditional Chinese Medicine",
    nameZh: "山西省中医院",
    descriptionEn: "Grade 3A hospital specializing in TCM internal medicine, acupuncture, and rheumatology.",
    descriptionZh: "三甲医院，专长中医内科、针灸和风湿科。",
    level: "Grade 3A",
    location: "Taiyuan",
    specialties: JSON.stringify(["internal medicine tcm", "acupuncture", "rheumatology tcm", "tuina", "herbal medicine"]),
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "Taiyuan Hospital of Traditional Chinese Medicine",
    nameZh: "太原市中医医院",
    descriptionEn: "Comprehensive TCM hospital with expertise in acupuncture, herbal medicine, and rehabilitation therapy.",
    descriptionZh: "综合性中医院，针灸、草药和康复治疗专长。",
    level: "Grade 3A",
    location: "Taiyuan",
    specialties: JSON.stringify(["acupuncture", "herbal medicine", "rehabilitation tcm", "tuina", "cupping"]),
    isFeatured: true,
    isActive: true,
  },

  // 呼和浩特
  {
    nameEn: "Inner Mongolia Hospital of Traditional Chinese Medicine",
    nameZh: "内蒙古中医医院",
    descriptionEn: "Grade 3A hospital specializing in TCM internal medicine, acupuncture, and respiratory diseases.",
    descriptionZh: "三甲医院，专长中医内科、针灸和呼吸疾病。",
    level: "Grade 3A",
    location: "Hohhot",
    specialties: JSON.stringify(["internal medicine tcm", "acupuncture", "respiratory tcm", "tuina", "herbal medicine"]),
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "Hohhot Hospital of Traditional Chinese Medicine",
    nameZh: "呼和浩特市中医医院",
    descriptionEn: "Comprehensive TCM hospital with expertise in acupuncture, moxibustion, and gynecology.",
    descriptionZh: "综合性中医院，针灸、艾灸和妇科专长。",
    level: "Grade 3A",
    location: "Hohhot",
    specialties: JSON.stringify(["acupuncture", "moxibustion", "gynecology tcm", "tuina", "herbal medicine"]),
    isFeatured: true,
    isActive: true,
  },

  // 台北
  {
    nameEn: "Taipei Veterans General Hospital - TCM Department",
    nameZh: "台北荣民总医院中医部",
    descriptionEn: "Top medical center with renowned TCM department offering acupuncture, herbal medicine, and integrated treatments.",
    descriptionZh: "顶尖医疗中心，中医部声誉卓著，提供针灸、草药和综合治疗。",
    level: "Grade 3A",
    location: "Taipei",
    specialties: JSON.stringify(["acupuncture", "herbal medicine", "integrated medicine", "tuina", "rehabilitation tcm"]),
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "Taipei City Hospital - Zhongxing Branch",
    nameZh: "台北市立联合医院中兴院区",
    descriptionEn: "Grade 3A hospital with strong TCM department specializing in acupuncture, herbal medicine, and rehabilitation.",
    descriptionZh: "三甲医院，中医科实力强劲，专长针灸、草药和康复。",
    level: "Grade 3A",
    location: "Taipei",
    specialties: JSON.stringify(["acupuncture", "herbal medicine", "rehabilitation tcm", "tuina", "internal medicine tcm"]),
    isFeatured: true,
    isActive: true,
  },

  // 香港
  {
    nameEn: "Hong Kong Hospital Authority - TCM Services",
    nameZh: "香港医院管理局 - 中医药服务",
    descriptionEn: "Public TCM services across Hong Kong hospitals, specializing in acupuncture, herbal medicine, and TCM rehabilitation.",
    descriptionZh: "香港公立医院中医药服务，专长针灸、草药和中医康复。",
    level: "Grade 3A",
    location: "Hong Kong",
    specialties: JSON.stringify(["acupuncture", "herbal medicine", "rehabilitation tcm", "tuina", "internal medicine tcm"]),
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "Chinese University of Hong Kong - School of Chinese Medicine",
    nameZh: "香港中文大学 - 中医学院",
    descriptionEn: "Premier TCM education and clinical center with expertise in acupuncture, herbal medicine, and TCM research.",
    descriptionZh: "领先中医教育和临床中心，针灸、草药和中医研究专长。",
    level: "Grade 3A",
    location: "Hong Kong",
    specialties: JSON.stringify(["acupuncture", "herbal medicine", "tcm research", "tuina", "internal medicine tcm"]),
    isFeatured: true,
    isActive: true,
  },

  // 澳门
  {
    nameEn: "Macau University of Science and Technology - Hospital",
    nameZh: "澳门科技大学医院 - 中医科",
    descriptionEn: "Grade 3A hospital with comprehensive TCM department offering acupuncture, herbal medicine, and traditional therapies.",
    descriptionZh: "三甲医院，中医科全面，提供针灸、草药和传统疗法。",
    level: "Grade 3A",
    location: "Macau",
    specialties: JSON.stringify(["acupuncture", "herbal medicine", "traditional therapies", "tuina", "internal medicine tcm"]),
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "Macau Hospital Conde S. Januario - TCM Department",
    nameZh: "澳门仁伯爵综合医院 - 中医科",
    descriptionEn: "Public hospital with TCM department specializing in acupuncture, herbal medicine, and chronic disease treatment.",
    descriptionZh: "公立医院中医科，专长针灸、草药和慢性疾病治疗。",
    level: "Grade 3A",
    location: "Macau",
    specialties: JSON.stringify(["acupuncture", "herbal medicine", "chronic diseases tcm", "tuina", "rehabilitation tcm"]),
    isFeatured: true,
    isActive: true,
  },
];

// ==================== 中医医生模板（每家医院5名） ====================
function generateTCMDoctors(hospitalId: string, hospitalLocation: string, hospitalCount: number) {
  const doctors = [];
  
  // 针灸专家
  doctors.push({
    hospitalId,
    nameEn: `Dr. Zhang Wei ${hospitalCount}`,
    nameZh: `张伟 ${hospitalCount}`,
    title: "Professor of Acupuncture",
    gender: "male",
    specialtiesEn: JSON.stringify(["acupuncture", "moxibustion", "chronic pain", "headache", "insomnia"]),
    specialtiesZh: JSON.stringify(["针灸", "艾灸", "慢性疼痛", "头痛", "失眠"]),
    descriptionEn: "Expert in acupuncture for pain management, neurological disorders, and chronic conditions.",
    descriptionZh: "针灸疼痛管理、神经系统疾病和慢性病专家。",
    experienceYears: 20 + Math.floor(Math.random() * 15),
    consultationFee: (300 + Math.floor(Math.random() * 200)).toString(),
    isFeatured: true,
    isActive: true,
  });

  // 中医内科专家
  doctors.push({
    hospitalId,
    nameEn: `Dr. Li Na ${hospitalCount}`,
    nameZh: `李娜 ${hospitalCount}`,
    title: "Professor of TCM Internal Medicine",
    gender: "female",
    specialtiesEn: JSON.stringify(["internal medicine tcm", "herbal medicine", "digestive disorders", "respiratory diseases"]),
    specialtiesZh: JSON.stringify(["中医内科", "草药治疗", "消化疾病", "呼吸疾病"]),
    descriptionEn: "Specializes in treating chronic internal diseases using traditional Chinese herbal medicine.",
    descriptionZh: "专长使用传统中草药治疗慢性内科疾病。",
    experienceYears: 18 + Math.floor(Math.random() * 12),
    consultationFee: (350 + Math.floor(Math.random() * 150)).toString(),
    isFeatured: true,
    isActive: true,
  });

  // 推拿专家
  doctors.push({
    hospitalId,
    nameEn: `Dr. Wang Ming ${hospitalCount}`,
    nameZh: `王明 ${hospitalCount}`,
    title: "Tuina Specialist",
    gender: "male",
    specialtiesEn: JSON.stringify(["tuina", "orthopedics tcm", "sports injuries", "neck pain", "back pain"]),
    specialtiesZh: JSON.stringify(["推拿", "骨科中医", "运动损伤", "颈痛", "背痛"]),
    descriptionEn: "Expert in traditional Chinese massage therapy for musculoskeletal conditions and sports injuries.",
    descriptionZh: "传统中医推拿按摩治疗肌肉骨骼疾病和运动损伤专家。",
    experienceYears: 15 + Math.floor(Math.random() * 10),
    consultationFee: (280 + Math.floor(Math.random() * 120)).toString(),
    isFeatured: false,
    isActive: true,
  });

  // 正骨专家
  doctors.push({
    hospitalId,
    nameEn: `Dr. Chen Gang ${hospitalCount}`,
    nameZh: `陈刚 ${hospitalCount}`,
    title: "Bone Setting Specialist",
    gender: "male",
    specialtiesEn: JSON.stringify(["bone setting", "orthopedics tcm", "fracture treatment", "joint dislocation"]),
    specialtiesZh: JSON.stringify(["正骨", "骨科中医", "骨折治疗", "关节脱位"]),
    descriptionEn: "Traditional Chinese bone setting expert for fractures, dislocations, and orthopedic conditions.",
    descriptionZh: "传统中医正骨专家，治疗骨折、脱位和骨科疾病。",
    experienceYears: 22 + Math.floor(Math.random() * 13),
    consultationFee: (320 + Math.floor(Math.random() * 180)).toString(),
    isFeatured: true,
    isActive: true,
  });

  // 中医妇科专家
  doctors.push({
    hospitalId,
    nameEn: `Dr. Liu Fang ${hospitalCount}`,
    nameZh: `刘芳 ${hospitalCount}`,
    title: "Professor of TCM Gynecology",
    gender: "female",
    specialtiesEn: JSON.stringify(["gynecology tcm", "infertility tcm", "menstrual disorders", "menopause", "herbal medicine"]),
    specialtiesZh: JSON.stringify(["中医妇科", "不孕不育", "月经失调", "更年期", "草药治疗"]),
    descriptionEn: "Expert in treating women's health issues, infertility, and gynecological disorders with TCM.",
    descriptionZh: "中医治疗女性健康、不孕不育和妇科疾病专家。",
    experienceYears: 16 + Math.floor(Math.random() * 14),
    consultationFee: (380 + Math.floor(Math.random() * 170)).toString(),
    isFeatured: true,
    isActive: true,
  });

  return doctors;
}

async function seedComprehensiveMedicalData() {
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

    console.log(`🏥 Creating ${TOP_TIER_HOSPITALS.length} hospitals...`);
    const insertedHospitals = await db
      .insert(hospitals)
      .values(TOP_TIER_HOSPITALS)
      .returning();
    console.log(`✅ Created ${insertedHospitals.length} hospitals`);

    console.log(`👨‍⚕️ Creating doctors for ${insertedHospitals.length} hospitals...`);
    const allDoctors: any[] = [];
    insertedHospitals.forEach((hospital, index) => {
      const hospitalDoctors = generateTCMDoctors(hospital.id, hospital.location, index + 1);
      allDoctors.push(...hospitalDoctors);
    });

    const insertedDoctors = await db
      .insert(doctors)
      .values(allDoctors)
      .returning();
    console.log(`✅ Created ${insertedDoctors.length} doctors (${insertedDoctors.length / insertedHospitals.length} doctors per hospital on average)`);

    // Calculate statistics
    const locationStats: Record<string, number> = {};
    insertedHospitals.forEach(h => {
      locationStats[h.location] = (locationStats[h.location] || 0) + 1;
    });

    console.log("\n📊 Summary:");
    console.log(`   Total Hospitals: ${insertedHospitals.length}`);
    console.log(`   Total Doctors: ${insertedDoctors.length}`);
    console.log(`   Average Doctors per Hospital: ${(insertedDoctors.length / insertedHospitals.length).toFixed(1)}`);
    console.log("\n🏥 Hospitals by Location:");
    Object.entries(locationStats)
      .sort((a, b) => b[1] - a[1])
      .forEach(([location, count]) => {
        console.log(`     ${location}: ${count} hospitals`);
      });

    console.log("\n✨ Comprehensive medical data seeded successfully!");
    console.log("\n💡 Note: All hospitals are Grade 3A Traditional Chinese Medicine hospitals.");
    console.log("💡 Each hospital has 5+ specialized TCM doctors covering:");
    console.log("   - Acupuncture & Moxibustion");
    console.log("   - TCM Internal Medicine");
    console.log("   - Tuina (Chinese Massage)");
    console.log("   - Bone Setting");
    console.log("   - TCM Gynecology");
  } catch (error) {
    console.error("❌ Failed to seed comprehensive medical data:", error);
    process.exit(1);
  }
}

seedComprehensiveMedicalData()
  .then(() => {
    console.log("\n✅ Seed completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  });
