import re

with open('src/app/api/bookings/create/route.ts', 'r') as f:
    content = f.read()

# ===== Step 1: 在解构里加 aiPlanText =====
old1 = """    const {
      originCity,
      destinationCity,
      travelDate,
      returnDate,
      treatmentType = 'consultation',
      numberOfPeople = '1',
      budget = '3000',
    } = body;"""

new1 = """    const {
      originCity,
      destinationCity,
      travelDate,
      returnDate,
      treatmentType = 'consultation',
      numberOfPeople = '1',
      budget = '3000',
      aiPlanText = '',
    } = body;"""

if old1 in content:
    content = content.replace(old1, new1)
    print('Step 1 OK: added aiPlanText to destructure')
else:
    print('Step 1 FAIL: pattern not found')

# ===== Step 2: 在 planConfigs 前加解析逻辑 =====
parse_block = """
    let aiParsed = null;
    if (aiPlanText) {
      try {
        const lowerText = aiPlanText.toLowerCase();
        let flightInfo = originCity + ' -> ' + destinationCity + ' (AI推荐)';
        let hotelName = 'Recommended Hotel';
        let hotelPrice = 700;

        const flightIdx = lowerText.indexOf('flight');
        if (flightIdx > -1) {
          const line = aiPlanText.substring(flightIdx, flightIdx + 100);
          flightInfo = line.replace(/[\\n\\r]/g, ' ').trim();
        }

        const hotelIdx = lowerText.indexOf('hotel');
        if (hotelIdx > -1) {
          const line = aiPlanText.substring(hotelIdx, hotelIdx + 80);
          const m = line.match(/([A-Za-z\\s]+?)(?:\\s*\\d+\\s*\\u2606)?/);
          if (m) hotelName = m[1].trim();
        }

        const totalIdx = lowerText.lastIndexOf('total');
        if (totalIdx > -1) {
          const line = aiPlanText.substring(totalIdx, totalIdx + 50);
          const numM = line.match(/\\$?([\\d,]+)/);
          if (numM) hotelPrice = parseInt(numM[1].replace(/,/g, '')) / 7;
        }

        aiParsed = {
          flightInfo: flightInfo,
          hotelName: hotelName,
          hotelPrice: Math.max(hotelPrice, 300),
          medicalPlan: aiPlanText.substring(0, 500),
          itineraryText: aiPlanText,
        };
        console.log('AI plan parsed:', aiParsed.hotelName);
      } catch (e) {
        console.error('Failed to parse AI plan:', e);
      }
    }
"""

marker = "    const planConfigs = ["
if marker in content and 'aiParsed' not in content:
    content = content.replace(marker, parse_block + marker)
    print('Step 2 OK: added AI parse logic')
else:
    print('Step 2 SKIP: marker not found or already added')

# ===== Step 3: planConfigs =====
old3 = """      { id: 'budget', stars: 3, cabin: 'economy', cabinLabel: '经济舱',
        hotelPrice: 700, hMult: 1, carCost: 50, reserv: 50, med: 200,
        medPlan: 'Basic medical consultation', consultDir: 'general' },
      { id: 'standard', stars: 4, cabin: 'business', cabinLabel: '商务舱',
        hotelPrice: 1050, hMult: 1.1, carCost: 80, reserv: 100, med: 700,
        medPlan: 'Standard medical services', consultDir: treatmentType },
      { id: 'premium', stars: 5, cabin: 'first', cabinLabel: '头等舱',
        hotelPrice: 1500, hMult: 1.2, carCost: 100, reserv: 200, med: 1600,
        medPlan: 'Comprehensive medical services', consultDir: treatmentType },"""

new3 = """      { id: 'budget', stars: 3, cabin: 'economy', cabinLabel: '经济舱',
        hotelPrice: aiParsed ? Math.round(aiParsed.hotelPrice * 0.7) : 700, hMult: 1, carCost: 50, reserv: 50, med: 200,
        medPlan: aiParsed ? aiParsed.medicalPlan : 'Basic medical consultation', consultDir: 'general' },
      { id: 'standard', stars: 4, cabin: 'business', cabinLabel: '商务舱',
        hotelPrice: aiParsed ? Math.round(aiParsed.hotelPrice * 1.0) : 1050, hMult: 1.1, carCost: 80, reserv: 100, med: 700,
        medPlan: aiParsed ? aiParsed.medicalPlan : 'Standard medical services', consultDir: treatmentType },
      { id: 'premium', stars: 5, cabin: 'first', cabinLabel: '头等舱',
        hotelPrice: aiParsed ? Math.round(aiParsed.hotelPrice * 1.3) : 1500, hMult: 1.2, carCost: 100, reserv: 200, med: 1600,
        medPlan: aiParsed ? aiParsed.medicalPlan : 'Comprehensive medical services', consultDir: treatmentType },"""

if old3 in content:
    content = content.replace(old3, new3)
    print('Step 3 OK: planConfigs now uses aiParsed')
else:
    print('Step 3 FAIL: planConfigs pattern not found')

# ===== Step 4: hotelName =====
old4 = """        hotelName: cfg.id === 'budget' ? 'Budget Hotel' : cfg.id === 'standard' ? 'Standard Hotel' : 'Luxury Hotel',"""
new4 = """        hotelName: aiParsed ? aiParsed.hotelName + (cfg.id === 'budget' ? ' (Budget)' : cfg.id === 'standard' ? ' (Standard)' : ' (Premium)') : (cfg.id === 'budget' ? 'Budget Hotel' : cfg.id === 'standard' ? 'Standard Hotel' : 'Luxury Hotel'),"""
if old4 in content:
    content = content.replace(old4, new4)
    print('Step 4 OK: hotelName uses aiParsed')
else:
    print('Step 4 FAIL: hotelName pattern not found')

# ===== Step 5: itinerary =====
old5 = """        // Bug 2: 按天分时的行程文本
        itinerary: buildItinerary("""
new5 = """        // 使用豆包方案作为基准
        itinerary: aiParsed?.itineraryText || buildItinerary("""
if old5 in content:
    content = content.replace(old5, new5)
    print('Step 5 OK: itinerary uses aiParsed')
else:
    print('Step 5 FAIL: itinerary pattern not found')

with open('src/app/api/bookings/create/route.ts', 'w') as f:
    f.write(content)

print('\nDone! All patches applied.')
