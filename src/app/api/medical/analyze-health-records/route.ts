import { NextRequest, NextResponse } from 'next/server';
import { callHunyuan } from '@/lib/hunyuan-client';

interface AnalysisRequest {
  fileUrls: string[];
  userId?: string;
}

interface AnalysisResponse {
  analysis: string;
  recommendations: {
    consultationDirection?: string;
    suggestedSpecialties: string[];
    recommendedTests: string[];
    severity?: 'low' | 'medium' | 'high';
    priorityConsultation: boolean;
    suggestedDoctors?: string[];
  };
  aiDiagnosis?: {
    description: string;
    possibleConditions: string[];
    confidence: number;
  };
  disclaimers: string[];
}

export async function POST(request: NextRequest) {
  try {
    const body: AnalysisRequest = await request.json();
    const { fileUrls, userId } = body;

    if (!fileUrls || fileUrls.length === 0) {
      return NextResponse.json(
        { error: 'At least one file URL is required' },
        { status: 400 }
      );
    }

    // Build the analysis prompt
    const fileDescriptions = fileUrls.map((url, index) => `File ${index + 1}: ${url}`).join('\n');

    const prompt = `You are analyzing medical records for a patient on GoChinaMed, a medical tourism platform.

Files to analyze:
${fileDescriptions}

Please provide:
1. A comprehensive analysis of the medical records
2. Recommended medical specialties for consultation
3. Suggested medical tests
4. Severity assessment (low/medium/high)
5. Whether urgent consultation is needed
6. Possible diagnoses (with confidence levels)

Return your response as a JSON object with this structure:
{
  "analysis": "detailed analysis text",
  "recommendations": {
    "consultationDirection": "suggested direction for medical consultation",
    "suggestedSpecialties": ["specialty1", "specialty2"],
    "recommendedTests": ["test1", "test2"],
    "severity": "low|medium|high",
    "priorityConsultation": boolean,
    "suggestedDoctors": ["doctor1", "doctor2"]
  },
  "aiDiagnosis": {
    "description": "description",
    "possibleConditions": ["condition1", "condition2"],
    "confidence": 0.0-1.0
  },
  "disclaimers": ["disclaimer1", "disclaimer2"]
}

Important:
- This is a preliminary analysis and NOT a medical diagnosis
- Always recommend professional medical consultation
- If any critical findings are detected, emphasize immediate medical attention
- Be conservative and cautious in recommendations`;

    // Call the Hunyuan API
    const fullContent = await callHunyuan([
      { Role: 'assistant', Content: 'You are an AI medical assistant. Always provide preliminary analysis with strong disclaimers that this is not a medical diagnosis and professional consultation is required.' },
      { Role: 'user', Content: prompt }
    ], {
      model: 'hunyuan-lite',
      temperature: 0.3,
    });

    // Parse the AI response
    let aiResponse: AnalysisResponse;
    try {
      const jsonMatch = fullContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        aiResponse = JSON.parse(jsonMatch[0]);
      } else {
        aiResponse = {
          analysis: fullContent,
          recommendations: {
            suggestedSpecialties: [],
            recommendedTests: [],
            priorityConsultation: false,
          },
          disclaimers: [
            'This is an AI-generated preliminary analysis.',
            'Please consult with a qualified healthcare professional for medical advice.',
            'This analysis is based on limited information and may not be complete.',
          ],
        };
      }
    } catch (parseError) {
      aiResponse = {
        analysis: fullContent,
        recommendations: {
          suggestedSpecialties: [],
          recommendedTests: [],
          priorityConsultation: false,
        },
        disclaimers: [
          'This is an AI-generated preliminary analysis.',
          'Please consult with a qualified healthcare professional for medical advice.',
        ],
      };
    }

    // Always add basic disclaimers
    aiResponse.disclaimers = [
      ...(aiResponse.disclaimers || []),
      'This analysis is for reference only and does not constitute a medical diagnosis.',
      'Please seek professional medical consultation for accurate diagnosis and treatment.',
    ];

    return NextResponse.json({
      success: true,
      analysis: aiResponse,
      source: 'hunyuan-ai',
      timestamp: Date.now(),
    });

  } catch (error: any) {
    console.error('Health records analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze health records', details: error.message },
      { status: 500 }
    );
  }
}
