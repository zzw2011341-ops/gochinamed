/**
 * 中国主要医院国际医疗部价格参考表
 * 数据来源：各医院官网公开信息、医疗旅游平台
 * 最后更新：2026-05-21
 */

export interface HospitalPrice {
  hospitalId: string;
  hospitalNameEn: string;
  hospitalNameZh: string;
  city: string;
  department: string;
  treatment: string;
  treatmentEn: string;
  priceRangeUSD: [number, number]; // [min, max]
  priceRangeCNY: [number, number];
  currency: string;
  includes: string[];
  excludes: string[];
  insuranceCoverage: string;
  notes?: string;
}

export const hospitalPrices: HospitalPrice[] = [
  // === 北京 ===
  {
    hospitalId: "puh-ic",
    hospitalNameEn: "Peking Union Medical College Hospital (PUMCH)",
    hospitalNameZh: "北京协和医院",
    city: "Beijing",
    department: "International Medical Department",
    treatment: "普通门诊",
    treatmentEn: "General Outpatient",
    priceRangeUSD: [50, 100],
    priceRangeCNY: [350, 700],
    currency: "CNY",
    includes: ["Consultation", "Basic examination"],
    excludes: ["Laboratory tests", "Imaging", "Medication"],
    insuranceCoverage: "Most international insurance accepted",
    notes: "需提前预约，国际部独立挂号"
  },
  {
    hospitalId: "puh-ic",
    hospitalNameEn: "Peking Union Medical College Hospital (PUMCH)",
    hospitalNameZh: "北京协和医院",
    city: "Beijing",
    department: "International Medical Department",
    treatment: "专家门诊",
    treatmentEn: "Specialist Outpatient",
    priceRangeUSD: [150, 300],
    priceRangeCNY: [1000, 2200],
    currency: "CNY",
    includes: ["Senior specialist consultation", "Detailed diagnosis"],
    excludes: ["Tests", "Treatment procedures"],
    insuranceCoverage: "Most international insurance accepted",
    notes: "知名专家号源紧张"
  },
  {
    hospitalId: "puh-ic",
    hospitalNameEn: "Peking Union Medical College Hospital (PUMCH)",
    hospitalNameZh: "北京协和医院",
    city: "Beijing",
    department: "International Medical Department",
    treatment: "心脏搭桥手术",
    treatmentEn: "Heart Bypass Surgery (CABG)",
    priceRangeUSD: [25000, 45000],
    priceRangeCNY: [180000, 320000],
    currency: "CNY",
    includes: ["Surgery", "Anesthesia", "5-7 days hospital stay", "Post-op care"],
    excludes: ["ICU if required", "Special medications", "Rehabilitation"],
    insuranceCoverage: "Partial coverage - deductibles apply",
    notes: "全国顶尖心血管外科"
  },
  {
    hospitalId: "puh-ic",
    hospitalNameEn: "Peking Union Medical College Hospital (PUMCH)",
    hospitalNameZh: "北京协和医院",
    city: "Beijing",
    department: "International Medical Department",
    treatment: "膝关节置换术",
    treatmentEn: "Knee Replacement Surgery",
    priceRangeUSD: [12000, 20000],
    priceRangeCNY: [85000, 145000],
    currency: "CNY",
    includes: ["Surgery", "Implant (foreign brand)", "7-10 days stay", "Physiotherapy"],
    excludes: ["Blood transfusion", "Special tests", "Long-term rehab"],
    insuranceCoverage: "Partial coverage",
    notes: "可选择进口/国产假体"
  },
  // === 上海 ===
  {
    hospitalId: "sh-sph",
    hospitalNameEn: "Shanghai Ruijin Hospital",
    hospitalNameZh: "上海瑞金医院",
    city: "Shanghai",
    department: "International Medical Center",
    treatment: "普通门诊",
    treatmentEn: "General Outpatient",
    priceRangeUSD: [40, 80],
    priceRangeCNY: [280, 560],
    currency: "CNY",
    includes: ["Consultation", "Basic checkup"],
    excludes: ["Lab tests", "Prescription"],
    insuranceCoverage: "Most international insurance accepted",
    notes: "预约电话：+86-21-64370045"
  },
  {
    hospitalId: "sh-sph",
    hospitalNameEn: "Shanghai Ruijin Hospital",
    hospitalNameZh: "上海瑞金医院",
    city: "Shanghai",
    department: "International Medical Center",
    treatment: "肿瘤化疗（一个疗程）",
    treatmentEn: "Chemotherapy (per course)",
    priceRangeUSD: [3000, 6000],
    priceRangeCNY: [21000, 43000],
    currency: "CNY",
    includes: ["Chemotherapy drugs", "Nursing", "Monitoring"],
    excludes: ["Blood tests", "Imaging", "Supportive meds"],
    insuranceCoverage: "Partial - check with provider",
    notes: "根据药物方案不同价格差异较大"
  },
  // === 广州 ===
  {
    hospitalId: "gz-1st",
    hospitalNameEn: "The First Affiliated Hospital of Sun Yat-sen University",
    hospitalNameZh: "中山大学附属第一医院",
    city: "Guangzhou",
    department: "International Medical Department",
    treatment: "试管婴儿（一个周期）",
    treatmentEn: "IVF Treatment (per cycle)",
    priceRangeUSD: [4000, 8000],
    priceRangeCNY: [29000, 58000],
    currency: "CNY",
    includes: ["Ovarian stimulation", "Egg retrieval", "Embryo transfer", "Medications"],
    excludes: ["Pre-implantation genetic testing", "Freezing", "Multiple cycles"],
    insuranceCoverage: "Usually not covered by insurance",
    notes: "成功率约40-50%/周期"
  },
  // === 成都 ===
  {
    hospitalId: "cd-west-china",
    hospitalNameEn: "West China Hospital of Sichuan University",
    hospitalNameZh: "四川大学华西医院",
    city: "Chengdu",
    department: "International Medical Center",
    treatment: "普通门诊",
    treatmentEn: "General Outpatient",
    priceRangeUSD: [30, 60],
    priceRangeCNY: [200, 420],
    currency: "CNY",
    includes: ["Consultation", "Basic examination"],
    excludes: ["Lab tests", "Imaging", "Medication"],
    insuranceCoverage: "Most international insurance accepted",
    notes: "西南地区顶级综合医院"
  },
  {
    hospitalId: "cd-west-china",
    hospitalNameEn: "West China Hospital of Sichuan University",
    hospitalNameZh: "四川大学华西医院",
    city: "Chengdu",
    department: "International Medical Center",
    treatment: "肝移植手术",
    treatmentEn: "Liver Transplantation",
    priceRangeUSD: [35000, 60000],
    priceRangeCNY: [250000, 430000],
    currency: "CNY",
    includes: ["Surgery", "Donor organ (cadaveric)", "ICU 2-3 days", "Hospital stay 14-21 days"],
    excludes: ["Post-transplant meds (lifelong)", "Complications management"],
    insuranceCoverage: "Very limited coverage",
    notes: "全国肝移植手术量前三"
  },
  // === 深圳 ===
  {
    hospitalId: "sz-gm",
    hospitalNameEn: "Shenzhen Guangming Hospital",
    hospitalNameZh: "深圳光明医院",
    city: "Shenzhen",
    department: "International Medical Center",
    treatment: "健康体检（基础套餐）",
    treatmentEn: "Health Checkup (Basic Package)",
    priceRangeUSD: [150, 300],
    priceRangeCNY: [1000, 2200],
    currency: "CNY",
    includes: ["Blood tests", "Urine tests", "ECG", "Chest X-ray", "Abdominal ultrasound"],
    excludes: ["Advanced imaging (CT/MRI)", "Specialized tests"],
    insuranceCoverage: "Not covered by insurance",
    notes: "可升级至高端套餐（含CT/MRI）"
  },
  // === 杭州 ===
  {
    hospitalId: "hz-sir",
    hospitalNameEn: "Sir Run Run Shaw Hospital",
    hospitalNameZh: "浙江大学医学院附属邵逸夫医院",
    city: "Hangzhou",
    department: "International Medical Department",
    treatment: "腹腔镜胆囊切除",
    treatmentEn: "Laparoscopic Cholecystectomy",
    priceRangeUSD: [3000, 5000],
    priceRangeCNY: [21000, 36000],
    currency: "CNY",
    includes: ["Surgery", "Anesthesia", "3-5 days stay", "Post-op care"],
    excludes: ["Pathology", "Complications", "Extended stay"],
    insuranceCoverage: "Partial coverage",
    notes: "浙江省微创手术领先"
  }
];

// 获取某医院的治疗价格
export function getHospitalPrices(hospitalId: string): HospitalPrice[] {
  return hospitalPrices.filter(p => p.hospitalId === hospitalId);
}

// 获取某城市的治疗价格
export function getCityTreatmentPrices(city: string, treatment?: string): HospitalPrice[] {
  let results = hospitalPrices.filter(p => p.city.toLowerCase() === city.toLowerCase());
  if (treatment) {
    results = results.filter(p => 
      p.treatment.includes(treatment) || p.treatmentEn.toLowerCase().includes(treatment.toLowerCase())
    );
  }
  return results;
}

// 获取所有可用治疗项目
export function getAvailableTreatments(): string[] {
  return [...new Set(hospitalPrices.map(p => p.treatmentEn))];
}
