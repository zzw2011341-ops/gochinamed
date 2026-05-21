import { NextRequest, NextResponse } from "next/server";
import { LLMClient, Config } from "coze-coding-dev-sdk";
import { HospitalManager } from "@/storage/database/hospitalManager";
import { DoctorManager } from "@/storage/database/doctorManager";
import { DiseaseManager } from "@/storage/database/diseaseManager";
import { HotelManager } from "@/storage/database/hotelManager";
import { FlightManager } from "@/storage/database/flightManager";
import { AttractionManager } from "@/storage/database/attractionsManager";
import { z } from "zod";

const config = new Config();
const llmClient = new LLMClient(config);

// Plan generation schema
const generatePlanSchema = z.object({
  userId: z.string().optional(),
  disease: z.string().optional(),
  symptoms: z.string().optional(),
  preferredLocation: z.string().optional(),
  budget: z.string().optional(),
  travelDates: z.string().optional(),
  language: z.enum(["en", "de", "fr", "zh"]).default("en"),
  specialRequirements: z.string().optional(),
});

const SYSTEM_PROMPT = `You are an expert medical tourism consultant for GoChinaMed. Your task is to create personalized, comprehensive medical travel plans for international patients seeking healthcare in China.

Your plan MUST be organized into the following THREE MAIN SECTIONS:

---

## 🏥 MEDICAL TREATMENT PLAN (医疗方案)

1. **Medical Assessment & Diagnosis**
   - Analyze the patient's condition based on symptoms
   - Provide preliminary diagnosis and recommended medical tests
   - Identify severity level and urgency

2. **Surgical Treatment Details**
   - **Surgery Type**: Specific surgical procedure(s) recommended
   - **Surgery Duration**: Estimated time for the surgery (e.g., 2-4 hours)
   - **Anesthesia Type**: General/Local anesthesia options
   - **Surgical Method**: Minimally invasive vs. traditional open surgery
   - **Success Rate**: Expected success percentage
   - **Potential Risks**: Possible complications and their likelihood

3. **Hospital & Doctor Recommendations**
   - **Recommended Hospitals**: Top 3 hospitals specializing in the patient's condition
     - Hospital name, location, grade (3A, 3B, etc.)
     - Key specialties and facilities
     - Medical equipment and technology
   - **Recommended Doctors**: Top 2-3 specialist doctors
     - Doctor name, title (Professor/Associate Professor)
     - Years of experience in this specific treatment
     - Success rate and patient reviews

4. **Recovery Timeline**
   - **Immediate Recovery**: First 24-48 hours post-surgery
   - **Hospital Stay**: Required days in hospital (e.g., 3-7 days)
   - **Full Recovery**: Total recovery time (e.g., 2-6 weeks)
   - **Follow-up Schedule**: Required check-up dates
   - **Rehabilitation**: Physical therapy or rehabilitation requirements

5. **Post-Surgery Care**
   - Wound care instructions
   - Medication requirements
   - Dietary restrictions and recommendations
   - Activity limitations
   - Signs of complications to watch for

6. **Medical Cost Breakdown**
   - **Consultation Fees**: Initial and follow-up consultations
   - **Surgery Costs**: Operating room, surgeon, anesthesia fees
   - **Hospital Stay**: Room charges (ward vs. private room)
   - **Medication Costs**: Pre-surgery and post-surgery medications
   - **Rehabilitation Costs**: Physical therapy sessions
   - **Total Estimated Medical Cost**: Sum of all medical expenses

---

## ✈️ TRAVEL & ACCOMMODATION PLAN (出行方案)

1. **Flight Arrangements**
   - **Recommended Airlines**: Direct flights or connecting flights
   - **Flight Routes**: From patient's origin to destination city
   - **Travel Time**: Total flight duration including layovers
   - **Flight Class Options**: Economy vs. Business class recommendations for patient comfort
   - **Estimated Flight Cost**: Round-trip price estimate
   - **Best Travel Time**: Recommended travel dates considering treatment schedule

2. **Alternative Transport Options**
   - **High-Speed Rail (高铁)**: If applicable, train routes and schedules
   - **Car/Taxi**: Estimated costs for local transportation
   - **Airport Transfer**: Transfer options from airport to hotel/hospital

3. **Accommodation Recommendations**
   - **Medical-Friendly Hotels**: Top 3 hotels near the hospital
     - Hotel name, star rating, distance to hospital
     - Special amenities for medical patients (e.g., accessible rooms, medical assistance)
     - Room types and daily rates
     - Check-in/check-out recommendations aligned with treatment schedule
   - **Long-Term Stay Options**: If extended stay required (recovery period)
   - **Accommodation Cost**: Estimated total cost for entire stay duration

4. **Visa & Documentation**
   - **Visa Type Required**: Medical visa requirements
   - **Required Documents**: Passport, medical records, invitation letters
   - **Processing Time**: How long visa application takes
   - **Tips**: Smooth visa application process

5. **Travel Insurance**
   - Recommended medical travel insurance coverage
   - Policy requirements and exclusions

---

## 🏞️ SIGHTSEEING & RECREATION PLAN (景点方案)

1. **Recommended Attractions**
   - **Patient-Friendly Sites**: Attractions suitable for recovering patients
     - Attraction name, category (Cultural/Historical/Natural)
     - Distance from hospital/hotel
     - Accessibility features (wheelchair accessible, elevator access)
     - Average visit duration
     - Best time to visit (considering recovery stage)
   - **Cultural Experiences**: Local cultural activities and experiences
   - **Relaxation Spots**: Parks, gardens, or quiet places for rest

2. **Attraction Details**
   - **Opening Hours**: Operating times and best visiting hours
   - **Ticket Prices**: Entry fees for each attraction
   - **Accessibility**: Wheelchair ramps, elevators, rest areas
   - **Medical Support**: Nearby hospitals or clinics at attraction sites
   - **Visitor Tips**: Special considerations for patients

3. **Recreation Activities**
   - **Low-Impact Activities**: Gentle exercises, tai chi, meditation sessions
   - **Social Activities**: Patient support groups, community events
   - **Shopping**: Medical supplies, souvenirs, local products

4. **Local Cuisine Recommendations**
   - **Healthy Food Options**: Restaurants suitable for post-surgery patients
   - **Dietary Considerations**: Foods to avoid, recommended nutrition
   - **Special Dietary Requirements**: Halal, vegetarian, allergen-free options

5. **Attraction Cost Estimate**
   - Total estimated cost for sightseeing activities
   - Budget-friendly vs. premium options

---

## 📋 COMPREHENSIVE ITINERARY (行程总览)

Create a day-by-day schedule combining medical appointments, recovery time, and leisure activities:

- **Day 1**: Arrival, hotel check-in, rest
- **Day 2**: Hospital registration, initial consultation
- **Day 3-4**: Medical tests, diagnosis confirmation
- **Day 5**: Surgery day (or surgery preparation)
- **Day 6-10**: Hospital stay, monitoring
- **Day 11-15**: Transfer to hotel, recovery monitoring
- **Day 16-20**: Follow-up appointments, light sightseeing
- **Day 21-25**: Continue recovery, cultural experiences
- **Day 26-28**: Final check-up, discharge planning
- **Day 29-30**: Departure preparations

*(Adjust timeline based on actual treatment requirements)*

---

## 💰 TOTAL COST ESTIMATION (费用总览)

Provide a detailed breakdown:

1. **Medical Expenses**: $____ (Treatment, surgery, medications)
2. **Travel Expenses**: $____ (Flights, local transport)
3. **Accommodation**: $____ (Hotels for X days)
4. **Attractions & Activities**: $____ (Sightseeing, tours)
5. **Food & Dining**: $____ (Estimated daily meals)
6. **Insurance & Miscellaneous**: $____ (Travel insurance, visa fees)
7. **Contingency Fund**: $____ (10-15% buffer)

**TOTAL ESTIMATED COST**: $____

---

## ⚠️ IMPORTANT CONSIDERATIONS (重要提醒)

1. **Language Support**: Translation services, hospital interpreters
2. **Cultural Tips**: Local customs, etiquette, cultural sensitivities
3. **Emergency Contacts**: Hospital emergency numbers, embassy contacts
4. **Follow-up Care**: Post-departure follow-up plan, communication with doctors
5. **Weather & Climate**: Best season to visit, packing recommendations
6. **Medical Records**: How to access and transfer medical records back home
7. **Communication**: WhatsApp/WeChat groups for patient support

---

**IMPORTANT**: Format your response using clear Markdown sections with appropriate emojis. Be detailed, specific, and actionable. Use a professional, caring, and reassuring tone. Include specific numbers, timeframes, and cost estimates whenever possible. Tailor all recommendations based on the patient's specific condition, budget, and preferences.

Ensure all THREE main sections (Medical Plan, Travel Plan, Attraction Plan) are covered comprehensively with specific details.`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = generatePlanSchema.parse(body);

    // Gather relevant data from database
    let contextInfo = "";
    try {
      // Search for related diseases if specified
      if (validated.disease) {
        const diseaseResults = await DiseaseManager.search({
          keyword: validated.disease,
          limit: 3,
          offset: 0,
        });
        if (diseaseResults.diseases.length > 0) {
          contextInfo += `\n\n### Relevant Medical Information:\n`;
          diseaseResults.diseases.forEach((d) => {
            contextInfo += `- ${d.nameEn}: ${d.descriptionEn || d.descriptionZh || ""}\n`;
          });
        }
      }

      // Search hospitals by location or specialty
      if (validated.preferredLocation || validated.disease) {
        const hospitalResults = await HospitalManager.search({
          location: validated.preferredLocation,
          specialty: validated.disease,
          limit: 5,
        });
        if (hospitalResults.hospitals.length > 0) {
          contextInfo += `\n\n### Recommended Hospitals:\n`;
          hospitalResults.hospitals.forEach((h: any) => {
            contextInfo += `- ${h.nameEn || h.nameZh}: ${h.level || "General Hospital"} in ${h.location}\n`;
            if (h.specialties) {
              contextInfo += `  Specialties: ${JSON.parse(JSON.stringify(h.specialties || [])).join(", ")}\n`;
            }
          });
        }
      }

      // Search doctors if disease specified
      if (validated.disease) {
        const doctorResults = await DoctorManager.search({
          specialty: validated.disease,
          limit: 5,
          offset: 0,
        });
        if (doctorResults.doctors.length > 0) {
          contextInfo += `\n\n### Recommended Doctors:\n`;
          doctorResults.doctors.forEach((d: any) => {
            contextInfo += `- Dr. ${d.nameEn}: ${d.title || "Physician"}, ${d.experienceYears || "N/A"} years experience\n`;
            if (d.specialtiesEn) {
              contextInfo += `  Specialties: ${d.specialtiesEn}\n`;
            }
          });
        }
      }

      // Search hotels if location specified
      if (validated.preferredLocation) {
        const hotelResults = await HotelManager.search({
          city: validated.preferredLocation,
          limit: 5,
          offset: 0,
        });
        if (hotelResults.hotels.length > 0) {
          contextInfo += `\n\n### Recommended Accommodations:\n`;
          hotelResults.hotels.forEach((h) => {
            contextInfo += `- ${h.nameEn || h.nameZh}: ${h.starRating}★, $${h.basePricePerNight}/night\n`;
            if (h.distanceToHospital) {
              contextInfo += `  Distance to hospital: ${h.distanceToHospital} km\n`;
            }
          });
        }
      }

      // Search attractions in the location
      if (validated.preferredLocation) {
        const attractionResults = await AttractionManager.search({
          city: validated.preferredLocation,
          isRecommendedForPatients: true,
          limit: 8,
          offset: 0,
        });
        if (attractionResults.attractions.length > 0) {
          contextInfo += `\n\n### Patient-Friendly Attractions:\n`;
          attractionResults.attractions.forEach((a) => {
            contextInfo += `- ${a.nameEn} (${a.category || "Attraction"}): ${a.averageDuration || "1-2 hours"} visit\n`;
            if (a.rating) {
              contextInfo += `  Rating: ${a.rating}/5.0\n`;
            }
            if (a.ticketPrice) {
              contextInfo += `  Ticket Price: $${a.ticketPrice}\n`;
            }
            if (a.isRecommendedForPatients) {
              contextInfo += `  ✅ Recommended for patients\n`;
            }
          });
        }
      }

      // Search for sample flights (placeholder data)
      contextInfo += `\n\n### Available Transport Options:\n`;
      contextInfo += `- International Flights: Major airlines operate direct flights to major Chinese cities (Beijing, Shanghai, Guangzhou)\n`;
      contextInfo += `- High-Speed Rail: Extensive network connecting major cities (300-350 km/h)\n`;
      contextInfo += `- Local Transport: Taxis, ride-sharing, metro systems available in all major cities\n`;

    } catch (dbError) {
      console.error("Error gathering context data:", dbError);
      // Continue without context data
    }

    // Build user prompt
    const userPrompt = `Please create a comprehensive personalized medical travel plan based on the following patient information:

## Patient Profile:
${validated.disease ? `- Disease/Condition: ${validated.disease}` : "- Disease/Condition: [Not specified - Provide general guidance]"}
${validated.symptoms ? `- Symptoms: ${validated.symptoms}` : "- Symptoms: [Not specified]"}
${validated.preferredLocation ? `- Preferred Location: ${validated.preferredLocation}` : "- Preferred Location: [Will recommend best locations]"}
${validated.budget ? `- Budget: ${validated.budget}` : "- Budget: [Flexible]"}
${validated.travelDates ? `- Travel Dates: ${validated.travelDates}` : "- Travel Dates: [To be scheduled based on treatment needs]"}
${validated.specialRequirements ? `- Special Requirements: ${validated.specialRequirements}` : "- Special Requirements: [None specified]"}

${contextInfo ? `\n## Available Resources:\n${contextInfo}` : ""}

Please provide a DETAILED and COMPREHENSIVE plan covering ALL THREE main sections (Medical Plan, Travel & Accommodation Plan, Attraction Plan) with specific details, numbers, timeframes, and cost estimates.

Output language: ${validated.language === "en" ? "English" : validated.language === "zh" ? "Chinese" : validated.language === "de" ? "German" : "French"}`;



    // Call LLM with streaming
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const messages = [
            { role: "system" as const, content: SYSTEM_PROMPT },
            { role: "user" as const, content: userPrompt },
          ];

          for await (const chunk of llmClient.stream(messages, {
            model: "doubao-seed-1-6-251015",
            temperature: 0.7,
            thinking: "disabled",
          })) {
            if (chunk.content) {
              const content = chunk.content.toString();
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
              );
            }
          }

          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        } catch (error) {
          console.error("LLM streaming error:", error);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: "Failed to generate plan" })}\n\n`
            )
          );
        } finally {
          controller.close();
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    console.error("Plan generation error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate plan",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 400 }
    );
  }
}
