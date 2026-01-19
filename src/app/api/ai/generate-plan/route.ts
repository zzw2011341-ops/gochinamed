import { NextRequest, NextResponse } from "next/server";
import { LLMClient, Config } from "coze-coding-dev-sdk";
import { HospitalManager } from "@/storage/database/hospitalManager";
import { DoctorManager } from "@/storage/database/doctorManager";
import { DiseaseManager } from "@/storage/database/diseaseManager";
import { HotelManager } from "@/storage/database/hotelManager";
import { FlightManager } from "@/storage/database/flightManager";
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

const SYSTEM_PROMPT = `You are an expert medical tourism consultant for GoChinaMed. Your task is to create personalized medical travel plans for international patients seeking healthcare in China.

Your plan should include:

1. **Medical Assessment**
   - Analyze the patient's condition based on symptoms
   - Recommend suitable medical specialists and treatments
   - Provide estimated treatment duration and recovery time

2. **Hospital & Doctor Recommendations**
   - Suggest top hospitals specializing in the patient's condition
   - Recommend experienced doctors with relevant expertise
   - Provide hospital details (location, facilities, specialties)

3. **Travel Arrangements**
   - Suggest flight options and travel routes
   - Consider the patient's country of origin
   - Provide visa and travel document requirements

4. **Accommodation**
   - Recommend hotels near recommended hospitals
   - Consider patient comfort, budget, and proximity to medical facilities
   - Suggest facilities that support medical tourists (medical-friendly amenities)

5. **Itinerary Planning**
   - Create a day-by-day schedule
   - Include consultation dates, treatment schedule, recovery time
   - Allow for follow-up appointments

6. **Cost Estimation**
   - Break down estimated costs (medical, accommodation, travel)
   - Provide currency conversions if needed
   - Include potential additional expenses

7. **Important Considerations**
   - Language support options
   - Cultural tips and local customs
   - Emergency contact information
   - Follow-up care options after returning home

Format your response using clear sections with headings. Be detailed but concise. Use a professional, caring tone.`;

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
          contextInfo += `\n\nRelevant Medical Information:\n`;
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
          contextInfo += `\n\nRecommended Hospitals:\n`;
          hospitalResults.hospitals.forEach((h: any) => {
            contextInfo += `- ${h.nameEn || h.nameZh}: ${h.level || "General Hospital"} in ${h.location}\n`;
            if (h.specialties) {
              contextInfo += `  Specialties: ${JSON.parse(JSON.stringify(h.specialties || [])).join(", ")}\n`;
            }
          });
        }
      }

      // Search hotels if location specified
      if (validated.preferredLocation) {
        const hotelResults = await HotelManager.search({
          city: validated.preferredLocation,
          limit: 3,
          offset: 0,
        });
        if (hotelResults.hotels.length > 0) {
          contextInfo += `\n\nNearby Accommodations:\n`;
          hotelResults.hotels.forEach((h) => {
            contextInfo += `- ${h.nameEn || h.nameZh}: ${h.starRating}★, $${h.basePricePerNight}/night\n`;
          });
        }
      }
    } catch (dbError) {
      console.error("Error gathering context data:", dbError);
      // Continue without context data
    }

    // Build user prompt
    const userPrompt = `Please create a personalized medical travel plan with the following information:

Patient Details:
${validated.disease ? `- Disease/Condition: ${validated.disease}` : ""}
${validated.symptoms ? `- Symptoms: ${validated.symptoms}` : ""}
${validated.preferredLocation ? `- Preferred Location: ${validated.preferredLocation}` : ""}
${validated.budget ? `- Budget: ${validated.budget}` : ""}
${validated.travelDates ? `- Travel Dates: ${validated.travelDates}` : ""}
${validated.specialRequirements ? `- Special Requirements: ${validated.specialRequirements}` : ""}

${contextInfo ? `\n${contextInfo}` : ""}

Please provide a comprehensive plan in ${validated.language === "en" ? "English" : validated.language === "zh" ? "Chinese" : validated.language === "de" ? "German" : "French"}.`;

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
