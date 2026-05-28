/**
 * 智能行程生成器
 * 根据目的地、旅游日期、景点列表生成合理的 day-by-day 行程
 */

export interface ItineraryDay {
  day: number;
  date: string; // YYYY-MM-DD
  items: ItineraryItem[];
  notes?: string; // 当天备注（如"休息日"）
}

export interface ItineraryItem {
  time: string; // HH:MM
  attractionId: string;
  duration: number; // 游览时间（分钟）
  notes?: string; // 备注（如"建议游玩2小时"）
}

export interface Attraction {
  id: string;
  nameEn: string;
  nameZh: string;
  description?: string;
  duration: string; // 如 "2-3 hours", "Full day"
  price: number;
  category: string;
}

/**
 * 解析 duration 字符串为分钟数
 */
function parseDuration(duration: string): number {
  // 匹配 "2-3 hours" -> 取平均值 2.5h = 150min
  const hourMatch = duration.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*hours?/i);
  if (hourMatch) {
    const avg = (parseFloat(hourMatch[1]) + parseFloat(hourMatch[2])) / 2;
    return Math.round(avg * 60);
  }
  // 匹配 "2 hours" -> 120min
  const singleHour = duration.match(/(\d+(?:\.\d+)?)\s*hours?/i);
  if (singleHour) {
    return Math.round(parseFloat(singleHour[1]) * 60);
  }
  // 匹配 "Full day" -> 480min
  if (/full\s*day/i.test(duration)) {
    return 480;
  }
  // 默认 2 小时
  return 120;
}

/**
 * 获取景点的区域（用于就近安排）
 */
function getAttractionZone(attractionId: string): string {
  const zoneMap: Record<string, string> = {};
  return zoneMap[attractionId] || 'other';
}

/**
 * 生成智能行程
 */
export function generateItinerary(params: {
  destinationCity: string;
  travelDate: string;
  returnDate?: string;
  selectedAttractions: string[];
  attractions: Attraction[];
  medicalAppointment?: {
    date: string;
    time: string;
    hospitalName?: string;
    durationMinutes?: number;
  };
}): ItineraryDay[] {
  const {
    travelDate,
    returnDate = '',
    selectedAttractions,
    attractions,
    medicalAppointment,
  } = params;

  const startDate = new Date(travelDate);
  let endDate: Date;
  if (returnDate) {
    endDate = new Date(returnDate);
  } else {
    endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 7);
  }
  const totalDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));

  const selected = attractions.filter(a => selectedAttractions.includes(a.id));
  if (selected.length === 0) {
    return Array.from({ length: totalDays }, (_, i) => ({
      day: i + 1,
      date: formatDate(addDays(startDate, i)),
      items: [],
      notes: i === 0 ? 'Arrival day' : i === totalDays - 1 ? 'Departure day' : 'Free day',
    }));
  }

  const zoneGroups: Record<string, typeof selected> = {};
  selected.forEach(attr => {
    const zone = getAttractionZone(attr.id);
    if (!zoneGroups[zone]) zoneGroups[zone] = [];
    zoneGroups[zone].push(attr);
  });

  const attractionsPerDay = Math.max(1, Math.min(4, Math.ceil(selected.length / totalDays)));
  const days: ItineraryDay[] = [];
  let attrIndex = 0;

  for (let day = 0; day < totalDays; day++) {
    const currentDate = addDays(startDate, day);
    const dateStr = formatDate(currentDate);
    const items: ItineraryItem[] = [];

    if (medicalAppointment && medicalAppointment.date === dateStr) {
      items.push({
        time: medicalAppointment.time || '09:00',
        attractionId: '__medical__',
        duration: medicalAppointment.durationMinutes || 240,
        notes: `Medical appointment${medicalAppointment.hospitalName ? ` at ${medicalAppointment.hospitalName}` : ''}`,
      });
    }

    const zones = Object.keys(zoneGroups);
    let addedCount = 0;
    while (addedCount < attractionsPerDay && attrIndex < selected.length) {
      for (const zone of zones) {
        if (attrIndex >= selected.length) break;
        const zoneAttrs = zoneGroups[zone];
        if (zoneAttrs.length > 0) {
          const attr = zoneAttrs.shift()!;
          const durationMin = parseDuration(attr.duration);
          const startHour = 9 + Math.floor((items.length * (durationMin + 30)) / 60);
          const startMin = (items.length * (durationMin + 30)) % 60;
          const timeStr = `${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}`;
          items.push({
            time: timeStr,
            attractionId: attr.id,
            duration: durationMin,
            notes: `${durationMin}min visit`,
          });
          addedCount++;
          attrIndex++;
          if (addedCount >= attractionsPerDay) break;
        }
      }
    }

    const notes = items.length === 0
      ? (day === 0 ? 'Arrival day - rest and recover' :
         day === totalDays - 1 ? 'Departure day' : 'Free day for rest or shopping')
      : undefined;

    days.push({ day: day + 1, date: dateStr, items, notes });
  }

  if (attrIndex < selected.length) {
    const remaining = selected.slice(attrIndex);
    remaining.forEach((attr, i) => {
      const dayIdx = i % days.length;
      const durationMin = parseDuration(attr.duration);
      const startHour = 9 + Math.floor((days[dayIdx].items.length * (durationMin + 30)) / 60);
      const startMin = (days[dayIdx].items.length * (durationMin + 30)) % 60;
      days[dayIdx].items.push({
        time: `${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}`,
        attractionId: attr.id,
        duration: durationMin,
        notes: `${durationMin}min visit`,
      });
    });
  }

  return days;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}
