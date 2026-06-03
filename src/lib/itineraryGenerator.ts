/**
 * 智能行程生成器
 * 根据目的地、旅游日期、景点列表生成合理的 day-by-day 行程
 */

export interface ItineraryDay {
  day: number;
  date: string;
  items: ItineraryItem[];
  notes?: string;
}

export interface ItineraryItem {
  time: string;
  attractionId: string;
  duration: number;
  notes?: string;
}

export interface Attraction {
  id: string;
  nameEn: string;
  nameZh: string;
  description?: string;
  duration: string;
  price: number;
  category: string;
}

function parseDuration(duration: string): number {
  const hourMatch = duration.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*hours?/i);
  if (hourMatch) {
    const avg = (parseFloat(hourMatch[1]) + parseFloat(hourMatch[2])) / 2;
    return Math.round(avg * 60);
  }
  const singleHour = duration.match(/(\d+(?:\.\d+)?)\s*hours?/i);
  if (singleHour) {
    return Math.round(parseFloat(singleHour[1]) * 60);
  }
  if (/full\s*day/i.test(duration)) {
    return 480;
  }
  return 120;
}

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
    returnDate = "",
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

  const days: ItineraryDay[] = [];
  for (let day = 0; day < totalDays; day++) {
    const d = new Date(startDate.getTime() + day * 86400000);
    const dateStr = d.toISOString().split("T")[0];
    days.push({
      day: day + 1,
      date: dateStr,
      items: [],
      notes: day === 0 ? "Arrival day - rest and recover" : day === totalDays - 1 ? "Departure day" : undefined,
    });
  }

  if (selected.length === 0) {
    return days;
  }

  if (medicalAppointment) {
    const medDayIdx = days.findIndex(d => d.date === medicalAppointment.date);
    if (medDayIdx >= 0) {
      days[medDayIdx].items.push({
        time: medicalAppointment.time || "09:00",
        attractionId: "__medical__",
        duration: medicalAppointment.durationMinutes || 240,
        notes: "Medical appointment" + (medicalAppointment.hospitalName ? " at " + medicalAppointment.hospitalName : ""),
      });
      days[medDayIdx].notes = undefined;
    }
  }

  const attractionsPerDay = Math.max(1, Math.min(4, Math.ceil(selected.length / totalDays)));
  let dayIdx = 0;

  for (const attr of selected) {
    let attempts = 0;
    while (attempts < totalDays) {
      if (days[dayIdx].items.length < attractionsPerDay) {
        break;
      }
      dayIdx = (dayIdx + 1) % totalDays;
      attempts++;
    }

    const durationMin = parseDuration(attr.duration);
    const existingCount = days[dayIdx].items.length;
    const startHour = 9 + Math.floor((existingCount * (durationMin + 30)) / 60);
    const startMin = (existingCount * (durationMin + 30)) % 60;
    const timeStr = String(startHour).padStart(2, "0") + ":" + String(startMin).padStart(2, "0");

    days[dayIdx].items.push({
      time: timeStr,
      attractionId: attr.id,
      duration: durationMin,
      notes: durationMin + "min visit",
    });
    days[dayIdx].notes = undefined;

    dayIdx = (dayIdx + 1) % totalDays;
  }

  return days;
}
