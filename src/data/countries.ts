export interface Country {
  id: string;
  nameEn: string;
  nameZh: string;
  code: string;
  callingCode: string;
  region: string;
}

export const COUNTRIES: Country[] = [
  // 亚洲
  { id: 'cn', nameEn: 'China', nameZh: '中国', code: 'CN', callingCode: '+86', region: 'asia' },
  { id: 'jp', nameEn: 'Japan', nameZh: '日本', code: 'JP', callingCode: '+81', region: 'asia' },
  { id: 'kr', nameEn: 'South Korea', nameZh: '韩国', code: 'KR', callingCode: '+82', region: 'asia' },
  { id: 'sg', nameEn: 'Singapore', nameZh: '新加坡', code: 'SG', callingCode: '+65', region: 'asia' },
  { id: 'my', nameEn: 'Malaysia', nameZh: '马来西亚', code: 'MY', callingCode: '+60', region: 'asia' },
  { id: 'th', nameEn: 'Thailand', nameZh: '泰国', code: 'TH', callingCode: '+66', region: 'asia' },
  { id: 'vn', nameEn: 'Vietnam', nameZh: '越南', code: 'VN', callingCode: '+84', region: 'asia' },
  { id: 'id', nameEn: 'Indonesia', nameZh: '印度尼西亚', code: 'ID', callingCode: '+62', region: 'asia' },
  { id: 'ph', nameEn: 'Philippines', nameZh: '菲律宾', code: 'PH', callingCode: '+63', region: 'asia' },
  { id: 'hk', nameEn: 'Hong Kong', nameZh: '香港', code: 'HK', callingCode: '+852', region: 'asia' },
  { id: 'tw', nameEn: 'Taiwan', nameZh: '台湾', code: 'TW', callingCode: '+886', region: 'asia' },
  { id: 'in', nameEn: 'India', nameZh: '印度', code: 'IN', callingCode: '+91', region: 'asia' },

  // 欧洲
  { id: 'gb', nameEn: 'United Kingdom', nameZh: '英国', code: 'GB', callingCode: '+44', region: 'europe' },
  { id: 'de', nameEn: 'Germany', nameZh: '德国', code: 'DE', callingCode: '+49', region: 'europe' },
  { id: 'fr', nameEn: 'France', nameZh: '法国', code: 'FR', callingCode: '+33', region: 'europe' },
  { id: 'it', nameEn: 'Italy', nameZh: '意大利', code: 'IT', callingCode: '+39', region: 'europe' },
  { id: 'es', nameEn: 'Spain', nameZh: '西班牙', code: 'ES', callingCode: '+34', region: 'europe' },
  { id: 'nl', nameEn: 'Netherlands', nameZh: '荷兰', code: 'NL', callingCode: '+31', region: 'europe' },
  { id: 'be', nameEn: 'Belgium', nameZh: '比利时', code: 'BE', callingCode: '+32', region: 'europe' },
  { id: 'ch', nameEn: 'Switzerland', nameZh: '瑞士', code: 'CH', callingCode: '+41', region: 'europe' },
  { id: 'at', nameEn: 'Austria', nameZh: '奥地利', code: 'AT', callingCode: '+43', region: 'europe' },
  { id: 'se', nameEn: 'Sweden', nameZh: '瑞典', code: 'SE', callingCode: '+46', region: 'europe' },
  { id: 'no', nameEn: 'Norway', nameZh: '挪威', code: 'NO', callingCode: '+47', region: 'europe' },
  { id: 'dk', nameEn: 'Denmark', nameZh: '丹麦', code: 'DK', callingCode: '+45', region: 'europe' },
  { id: 'fi', nameEn: 'Finland', nameZh: '芬兰', code: 'FI', callingCode: '+358', region: 'europe' },
  { id: 'pl', nameEn: 'Poland', nameZh: '波兰', code: 'PL', callingCode: '+48', region: 'europe' },
  { id: 'ru', nameEn: 'Russia', nameZh: '俄罗斯', code: 'RU', callingCode: '+7', region: 'europe' },
  { id: 'gr', nameEn: 'Greece', nameZh: '希腊', code: 'GR', callingCode: '+30', region: 'europe' },
  { id: 'pt', nameEn: 'Portugal', nameZh: '葡萄牙', code: 'PT', callingCode: '+351', region: 'europe' },
  { id: 'ie', nameEn: 'Ireland', nameZh: '爱尔兰', code: 'IE', callingCode: '+353', region: 'europe' },
  { id: 'cz', nameEn: 'Czech Republic', nameZh: '捷克', code: 'CZ', callingCode: '+420', region: 'europe' },
  { id: 'hu', nameEn: 'Hungary', nameZh: '匈牙利', code: 'HU', callingCode: '+36', region: 'europe' },

  // 美洲
  { id: 'us', nameEn: 'United States', nameZh: '美国', code: 'US', callingCode: '+1', region: 'americas' },
  { id: 'ca', nameEn: 'Canada', nameZh: '加拿大', code: 'CA', callingCode: '+1', region: 'americas' },
  { id: 'mx', nameEn: 'Mexico', nameZh: '墨西哥', code: 'MX', callingCode: '+52', region: 'americas' },
  { id: 'br', nameEn: 'Brazil', nameZh: '巴西', code: 'BR', callingCode: '+55', region: 'americas' },
  { id: 'ar', nameEn: 'Argentina', nameZh: '阿根廷', code: 'AR', callingCode: '+54', region: 'americas' },
  { id: 'cl', nameEn: 'Chile', nameZh: '智利', code: 'CL', callingCode: '+56', region: 'americas' },
  { id: 'co', nameEn: 'Colombia', nameZh: '哥伦比亚', code: 'CO', callingCode: '+57', region: 'americas' },
  { id: 'pe', nameEn: 'Peru', nameZh: '秘鲁', code: 'PE', callingCode: '+51', region: 'americas' },
  { id: 've', nameEn: 'Venezuela', nameZh: '委内瑞拉', code: 'VE', callingCode: '+58', region: 'americas' },

  // 大洋洲
  { id: 'au', nameEn: 'Australia', nameZh: '澳大利亚', code: 'AU', callingCode: '+61', region: 'oceania' },
  { id: 'nz', nameEn: 'New Zealand', nameZh: '新西兰', code: 'NZ', callingCode: '+64', region: 'oceania' },

  // 非洲
  { id: 'za', nameEn: 'South Africa', nameZh: '南非', code: 'ZA', callingCode: '+27', region: 'africa' },
  { id: 'eg', nameEn: 'Egypt', nameZh: '埃及', code: 'EG', callingCode: '+20', region: 'africa' },
  { id: 'ng', nameEn: 'Nigeria', nameZh: '尼日利亚', code: 'NG', callingCode: '+234', region: 'africa' },
  { id: 'ke', nameEn: 'Kenya', nameZh: '肯尼亚', code: 'KE', callingCode: '+254', region: 'africa' },
  { id: 'ma', nameEn: 'Morocco', nameZh: '摩洛哥', code: 'MA', callingCode: '+212', region: 'africa' },
];

// 按地区分组的国家
export const COUNTRIES_BY_REGION = {
  asia: COUNTRIES.filter(c => c.region === 'asia'),
  europe: COUNTRIES.filter(c => c.region === 'europe'),
  americas: COUNTRIES.filter(c => c.region === 'americas'),
  oceania: COUNTRIES.filter(c => c.region === 'oceania'),
  africa: COUNTRIES.filter(c => c.region === 'africa'),
};

// 地区名称映射
export const REGION_NAMES = {
  zh: {
    asia: '亚洲',
    europe: '欧洲',
    americas: '美洲',
    oceania: '大洋洲',
    africa: '非洲',
  },
  en: {
    asia: 'Asia',
    europe: 'Europe',
    americas: 'Americas',
    oceania: 'Oceania',
    africa: 'Africa',
  },
};
