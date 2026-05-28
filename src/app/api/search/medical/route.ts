import { NextRequest, NextResponse } from "next/server";
import { HospitalManager } from "@/storage/database/hospitalManager";
import { DoctorManager } from "@/storage/database/doctorManager";
import { DiseaseManager } from "@/storage/database/diseaseManager";
import { z } from "zod";

// Search schema
const searchSchema = z.object({
  type: z.enum(["hospital", "doctor", "disease", "all"]).default("all"),
  keyword: z.string().optional(),
  location: z.string().optional(),
  specialty: z.string().optional(),
  hospitalLevel: z.string().optional(),
  diseaseCategory: z.string().optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());

    // Parse and validate parameters
    const validated = searchSchema.parse({
      type: params.type,
      keyword: params.keyword,
      location: params.location,
      specialty: params.specialty,
      hospitalLevel: params.hospitalLevel,
      diseaseCategory: params.diseaseCategory,
      limit: parseInt(params.limit || "20"),
      offset: parseInt(params.offset || "0"),
    });

    const results: any = {};

    // Search based on type
    if (validated.type === "all" || validated.type === "hospital") {
      const hospitalResult = await HospitalManager.search({
        location: validated.location,
        level: validated.hospitalLevel,
        specialty: validated.specialty,
        keyword: validated.keyword,
        limit: validated.type === "all" ? 5 : validated.limit,
        offset: validated.offset,
      });
      // 去重：按 nameEn 去重
      const seenHospitals = new Set();
      hospitalResult.hospitals = hospitalResult.hospitals.filter(h => {
        if (seenHospitals.has(h.nameEn)) return false;
        seenHospitals.add(h.nameEn);
        return true;
      });
      results.hospitals = hospitalResult;
    }

    if (validated.type === "all" || validated.type === "doctor") {
      const doctorResult = await DoctorManager.search({
        keyword: validated.keyword,
        specialty: validated.specialty,
        location: validated.location,
        hospitalId: undefined,
        limit: validated.type === "all" ? 5 : validated.limit,
        offset: validated.offset,
      });
      // 去重：按 nameEn 去重
      const seenDocs = new Set();
      doctorResult.doctors = doctorResult.doctors.filter(d => {
        if (seenDocs.has(d.nameEn)) return false;
        seenDocs.add(d.nameEn);
        return true;
      });
      results.doctors = doctorResult;
    }

    if (validated.type === "all" || validated.type === "disease") {
      const diseaseResult = await DiseaseManager.search({
        keyword: validated.keyword,
        category: validated.diseaseCategory,
        limit: validated.type === "all" ? 5 : validated.limit,
        offset: validated.offset,
      });
      results.diseases = diseaseResult;
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error("Medical search error:", error);
    return NextResponse.json(
      { error: "Search failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 400 }
    );
  }
}
