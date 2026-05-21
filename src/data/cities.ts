// 统一的城市数据源
// 用于医生/医院页面和预订流程，确保城市列表一致性

export interface City {
  id: string;
  nameEn: string;
  nameZh: string;
  region?: 'china' | 'americas' | 'europe' | 'asia' | 'oceania';
  airport?: string;
}

// 中国所有省会城市（34个）- 与数据库 cities 表保持一致
export const CHINA_CITIES: City[] = [
  { id: 'beijing', nameEn: 'Beijing', nameZh: '北京', region: 'china', airport: 'PEK' },
  { id: 'tianjin', nameEn: 'Tianjin', nameZh: '天津', region: 'china', airport: 'TSN' },
  { id: 'shanghai', nameEn: 'Shanghai', nameZh: '上海', region: 'china', airport: 'PVG' },
  { id: 'chongqing', nameEn: 'Chongqing', nameZh: '重庆', region: 'china', airport: 'CKG' },
  { id: 'shijiazhuang', nameEn: 'Shijiazhuang', nameZh: '石家庄', region: 'china', airport: 'SJW' },
  { id: 'taiyuan', nameEn: 'Taiyuan', nameZh: '太原', region: 'china', airport: 'TYN' },
  { id: 'hohhot', nameEn: 'Hohhot', nameZh: '呼和浩特', region: 'china', airport: 'HET' },
  { id: 'shenyang', nameEn: 'Shenyang', nameZh: '沈阳', region: 'china', airport: 'SHE' },
  { id: 'changchun', nameEn: 'Changchun', nameZh: '长春', region: 'china', airport: 'CGQ' },
  { id: 'harbin', nameEn: 'Harbin', nameZh: '哈尔滨', region: 'china', airport: 'HRB' },
  { id: 'nanjing', nameEn: 'Nanjing', nameZh: '南京', region: 'china', airport: 'NKG' },
  { id: 'hangzhou', nameEn: 'Hangzhou', nameZh: '杭州', region: 'china', airport: 'HGH' },
  { id: 'hefei', nameEn: 'Hefei', nameZh: '合肥', region: 'china', airport: 'HFE' },
  { id: 'fuzhou', nameEn: 'Fuzhou', nameZh: '福州', region: 'china', airport: 'FOC' },
  { id: 'nanchang', nameEn: 'Nanchang', nameZh: '南昌', region: 'china', airport: 'KHN' },
  { id: 'jinan', nameEn: 'Jinan', nameZh: '济南', region: 'china', airport: 'TNA' },
  { id: 'zhengzhou', nameEn: 'Zhengzhou', nameZh: '郑州', region: 'china', airport: 'CGO' },
  { id: 'wuhan', nameEn: 'Wuhan', nameZh: '武汉', region: 'china', airport: 'WUH' },
  { id: 'changsha', nameEn: 'Changsha', nameZh: '长沙', region: 'china', airport: 'CSX' },
  { id: 'guangzhou', nameEn: 'Guangzhou', nameZh: '广州', region: 'china', airport: 'CAN' },
  { id: 'nanning', nameEn: 'Nanning', nameZh: '南宁', region: 'china', airport: 'NNG' },
  { id: 'haikou', nameEn: 'Haikou', nameZh: '海口', region: 'china', airport: 'HAK' },
  { id: 'chengdu', nameEn: 'Chengdu', nameZh: '成都', region: 'china', airport: 'CTU' },
  { id: 'guiyang', nameEn: 'Guiyang', nameZh: '贵阳', region: 'china', airport: 'KWE' },
  { id: 'kunming', nameEn: 'Kunming', nameZh: '昆明', region: 'china', airport: 'KMG' },
  { id: 'lhasa', nameEn: 'Lhasa', nameZh: '拉萨', region: 'china', airport: 'LXA' },
  { id: 'xian', nameEn: "Xi'an", nameZh: '西安', region: 'china', airport: 'XIY' },
  { id: 'lanzhou', nameEn: 'Lanzhou', nameZh: '兰州', region: 'china', airport: 'ZHW' },
  { id: 'xining', nameEn: 'Xining', nameZh: '西宁', region: 'china', airport: 'XNN' },
  { id: 'yinchuan', nameEn: 'Yinchuan', nameZh: '银川', region: 'china', airport: 'INC' },
  { id: 'urumqi', nameEn: 'Urumqi', nameZh: '乌鲁木齐', region: 'china', airport: 'URC' },
  { id: 'taipei', nameEn: 'Taipei', nameZh: '台北', region: 'china', airport: 'TPE' },
  { id: 'hongkong', nameEn: 'Hong Kong', nameZh: '香港', region: 'china', airport: 'HKG' },
  { id: 'macau', nameEn: 'Macau', nameZh: '澳门', region: 'china', airport: 'MFM' },

  // 重要非省会城市
  { id: 'shenzhen', nameEn: 'Shenzhen', nameZh: '深圳', region: 'china', airport: 'SZX' },
  { id: 'qingdao', nameEn: 'Qingdao', nameZh: '青岛', region: 'china', airport: 'TAO' },
  { id: 'dalian', nameEn: 'Dalian', nameZh: '大连', region: 'china', airport: 'DLC' },
  { id: 'xiamen', nameEn: 'Xiamen', nameZh: '厦门', region: 'china', airport: 'XMN' },
  { id: 'ningbo', nameEn: 'Ningbo', nameZh: '宁波', region: 'china', airport: 'NGB' },
  { id: 'suzhou', nameEn: 'Suzhou', nameZh: '苏州', region: 'china', airport: 'SZV' },
  { id: 'dongguan', nameEn: 'Dongguan', nameZh: '东莞', region: 'china', airport: 'SZX' },
  { id: 'wuxi', nameEn: 'Wuxi', nameZh: '无锡', region: 'china', airport: 'WUX' },
  { id: 'foshan', nameEn: 'Foshan', nameZh: '佛山', region: 'china', airport: 'FUO' },
  { id: 'zhuhai', nameEn: 'Zhuhai', nameZh: '珠海', region: 'china', airport: 'ZUH' },
];

// 国际城市 - 用于预订页面的出发城市选择
export const INTERNATIONAL_CITIES: City[] = [
  // 美洲
  { id: 'newyork', nameEn: 'New York', nameZh: '纽约', region: 'americas', airport: 'JFK' },
  { id: 'losangeles', nameEn: 'Los Angeles', nameZh: '洛杉矶', region: 'americas', airport: 'LAX' },
  { id: 'sanfrancisco', nameEn: 'San Francisco', nameZh: '旧金山', region: 'americas', airport: 'SFO' },
  { id: 'chicago', nameEn: 'Chicago', nameZh: '芝加哥', region: 'americas', airport: 'ORD' },
  { id: 'miami', nameEn: 'Miami', nameZh: '迈阿密', region: 'americas', airport: 'MIA' },
  { id: 'toronto', nameEn: 'Toronto', nameZh: '多伦多', region: 'americas', airport: 'YYZ' },
  { id: 'vancouver', nameEn: 'Vancouver', nameZh: '温哥华', region: 'americas', airport: 'YVR' },
  { id: 'saopaulo', nameEn: 'São Paulo', nameZh: '圣保罗', region: 'americas', airport: 'GRU' },

  // 欧洲
  { id: 'london', nameEn: 'London', nameZh: '伦敦', region: 'europe', airport: 'LHR' },
  { id: 'paris', nameEn: 'Paris', nameZh: '巴黎', region: 'europe', airport: 'CDG' },
  { id: 'berlin', nameEn: 'Berlin', nameZh: '柏林', region: 'europe', airport: 'BER' },
  { id: 'munich', nameEn: 'Munich', nameZh: '慕尼黑', region: 'europe', airport: 'MUC' },
  { id: 'frankfurt', nameEn: 'Frankfurt', nameZh: '法兰克福', region: 'europe', airport: 'FRA' },
  { id: 'rome', nameEn: 'Rome', nameZh: '罗马', region: 'europe', airport: 'FCO' },
  { id: 'madrid', nameEn: 'Madrid', nameZh: '马德里', region: 'europe', airport: 'MAD' },
  { id: 'amsterdam', nameEn: 'Amsterdam', nameZh: '阿姆斯特丹', region: 'europe', airport: 'AMS' },
  { id: 'vienna', nameEn: 'Vienna', nameZh: '维也纳', region: 'europe', airport: 'VIE' },
  { id: 'zurich', nameEn: 'Zurich', nameZh: '苏黎世', region: 'europe', airport: 'ZRH' },
  { id: 'athens', nameEn: 'Athens', nameZh: '雅典', region: 'europe', airport: 'ATH' },
  { id: 'brussels', nameEn: 'Brussels', nameZh: '布鲁塞尔', region: 'europe', airport: 'BRU' },
  { id: 'budapest', nameEn: 'Budapest', nameZh: '布达佩斯', region: 'europe', airport: 'BUD' },
  { id: 'copenhagen', nameEn: 'Copenhagen', nameZh: '哥本哈根', region: 'europe', airport: 'CPH' },
  { id: 'dublin', nameEn: 'Dublin', nameZh: '都柏林', region: 'europe', airport: 'DUB' },
  { id: 'helsinki', nameEn: 'Helsinki', nameZh: '赫尔辛基', region: 'europe', airport: 'HEL' },
  { id: 'lisbon', nameEn: 'Lisbon', nameZh: '里斯本', region: 'europe', airport: 'LIS' },
  { id: 'oslo', nameEn: 'Oslo', nameZh: '奥斯陆', region: 'europe', airport: 'OSL' },
  { id: 'prague', nameEn: 'Prague', nameZh: '布拉格', region: 'europe', airport: 'PRG' },
  { id: 'stockholm', nameEn: 'Stockholm', nameZh: '斯德哥尔摩', region: 'europe', airport: 'ARN' },
  { id: 'warsaw', nameEn: 'Warsaw', nameZh: '华沙', region: 'europe', airport: 'WAW' },
  { id: 'reykjavik', nameEn: 'Reykjavik', nameZh: '雷克雅未克', region: 'europe', airport: 'KEF' },
  { id: 'sofia', nameEn: 'Sofia', nameZh: '索菲亚', region: 'europe', airport: 'SOF' },
  { id: 'bucharest', nameEn: 'Bucharest', nameZh: '布加勒斯特', region: 'europe', airport: 'OTP' },
  { id: 'zagreb', nameEn: 'Zagreb', nameZh: '萨格勒布', region: 'europe', airport: 'ZAG' },
  { id: 'tallinn', nameEn: 'Tallinn', nameZh: '塔林', region: 'europe', airport: 'TLL' },
  { id: 'vilnius', nameEn: 'Vilnius', nameZh: '维尔纽斯', region: 'europe', airport: 'VNO' },
  { id: 'riga', nameEn: 'Riga', nameZh: '里加', region: 'europe', airport: 'RIX' },
  { id: 'minsk', nameEn: 'Minsk', nameZh: '明斯克', region: 'europe', airport: 'MSQ' },
  { id: 'kiev', nameEn: 'Kyiv', nameZh: '基辅', region: 'europe', airport: 'KBP' },
  { id: 'chisinau', nameEn: 'Chisinau', nameZh: '基希讷乌', region: 'europe', airport: 'KIV' },
  { id: 'tbilisi', nameEn: 'Tbilisi', nameZh: '第比利斯', region: 'europe', airport: 'TBS' },
  { id: 'yerevan', nameEn: 'Yerevan', nameZh: '埃里温', region: 'europe', airport: 'EVN' },
  { id: 'bakou', nameEn: 'Baku', nameZh: '巴库', region: 'europe', airport: 'GYD' },
  { id: 'skopje', nameEn: 'Skopje', nameZh: '斯科普里', region: 'europe', airport: 'SKP' },
  { id: 'podgorica', nameEn: 'Podgorica', nameZh: '波德戈里察', region: 'europe', airport: 'TGD' },
  { id: 'sarajevo', nameEn: 'Sarajevo', nameZh: '萨拉热窝', region: 'europe', airport: 'SJJ' },
  { id: 'tirana', nameEn: 'Tirana', nameZh: '地拉那', region: 'europe', airport: 'TIA' },
  { id: 'valletta', nameEn: 'Valletta', nameZh: '瓦莱塔', region: 'europe', airport: 'MLA' },
  { id: 'nicosia', nameEn: 'Nicosia', nameZh: '尼科西亚', region: 'europe', airport: 'ECN' },
  { id: 'andorra', nameEn: 'Andorra la Vella', nameZh: '安道尔城', region: 'europe', airport: 'ALV' },
  { id: 'monaco', nameEn: 'Monaco', nameZh: '摩纳哥', region: 'europe', airport: 'MCM' },
  { id: 'sanmarino', nameEn: 'San Marino', nameZh: '圣马力诺', region: 'europe', airport: 'RMI' },
  { id: 'vatican', nameEn: 'Vatican City', nameZh: '梵蒂冈', region: 'europe', airport: 'VAT' },
  { id: 'luxembourg', nameEn: 'Luxembourg', nameZh: '卢森堡', region: 'europe', airport: 'LUX' },
  { id: 'bern', nameEn: 'Bern', nameZh: '伯尔尼', region: 'europe', airport: 'BRN' },
  { id: 'ljubljana', nameEn: 'Ljubljana', nameZh: '卢布尔雅那', region: 'europe', airport: 'LJU' },
  { id: 'bratislava', nameEn: 'Bratislava', nameZh: '布拉迪斯拉发', region: 'europe', airport: 'BTS' },

  // 亚洲（除中国）
  { id: 'tokyo', nameEn: 'Tokyo', nameZh: '东京', region: 'asia', airport: 'HND' },
  { id: 'seoul', nameEn: 'Seoul', nameZh: '首尔', region: 'asia', airport: 'ICN' },
  { id: 'bangkok', nameEn: 'Bangkok', nameZh: '曼谷', region: 'asia', airport: 'BKK' },
  { id: 'singapore', nameEn: 'Singapore', nameZh: '新加坡', region: 'asia', airport: 'SIN' },
  { id: 'jakarta', nameEn: 'Jakarta', nameZh: '雅加达', region: 'asia', airport: 'CGK' },
  { id: 'manila', nameEn: 'Manila', nameZh: '马尼拉', region: 'asia', airport: 'MNL' },
  { id: 'kualalumpur', nameEn: 'Kuala Lumpur', nameZh: '吉隆坡', region: 'asia', airport: 'KUL' },
  { id: 'delhi', nameEn: 'Delhi', nameZh: '德里', region: 'asia', airport: 'DEL' },
  { id: 'mumbai', nameEn: 'Mumbai', nameZh: '孟买', region: 'asia', airport: 'BOM' },
  { id: 'dubai', nameEn: 'Dubai', nameZh: '迪拜', region: 'asia', airport: 'DXB' },

  // 大洋洲
  { id: 'sydney', nameEn: 'Sydney', nameZh: '悉尼', region: 'oceania', airport: 'SYD' },
  { id: 'melbourne', nameEn: 'Melbourne', nameZh: '墨尔本', region: 'oceania', airport: 'MEL' },
  { id: 'auckland', nameEn: 'Auckland', nameZh: '奥克兰', region: 'oceania', airport: 'AKL' },
];

// 预订页面的出发城市选项（包含国际城市 + 中国城市）
export const DEPARTURE_CITIES: City[] = [
  ...INTERNATIONAL_CITIES,
  ...CHINA_CITIES,
];

// 目的城市选项（仅中国城市，因为医院都在中国）
export const DESTINATION_CITIES: City[] = CHINA_CITIES;

// 医生/医院页面的城市选项（仅中国城市）
export const MEDICAL_CITIES: City[] = CHINA_CITIES;
