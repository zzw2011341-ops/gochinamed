import { NextRequest, NextResponse } from 'next/server';
import { LLMClient, Config } from 'coze-coding-dev-sdk';

const config = new Config();
const llmClient = new LLMClient(config);

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
}

export async function POST(request: NextRequest) {
  try {
    const body: AnalysisRequest = await request.json();

    if (!body.fileUrls || body.fileUrls.length === 0) {
      return NextResponse.json(
        { error: 'No files provided for analysis' },
        { status: 400 }
      );
    }

    // Prepare the prompt for health record analysis
    const prompt = `You are an AI medical assistant specializing in analyzing health records and providing preliminary recommendations. 

Please analyze the health records from the following URLs:
${body.fileUrls.map(url => `- ${url}`).join('\n')}

Please provide a comprehensive analysis including:

1. **Medical Condition Assessment**: 
   - Identify the primary health condition(s)
   - Assess the severity level (low/medium/high)
   - Note any critical findings that require immediate attention

2. **Consultation Direction**:
   - Recommend the appropriate medical specialty for consultation (e.g., cardiology, neurology, orthopedics, etc.)
   - Provide a brief rationale for this recommendation

3. **Suggested Specialties**: List relevant medical specialties that should be involved

4. **Recommended Tests/Examinations**:
   - List specific diagnostic tests that would be beneficial
   - Include both urgent tests and follow-up examinations

5. **Priority Assessment**:
   - Indicate whether this requires immediate/emergency consultation (true/false)
   - Suggest an appropriate timeline for consultation

6. **Additional Notes**:
   - Any medication considerations
   - Lifestyle recommendations
   - Red flags to watch for

Please format your response as JSON with the following structure:
{
  "analysis": "detailed text analysis",
  "recommendations": {
    "consultationDirection": "primary specialty",
    "suggestedSpecialties": ["specialty1", "specialty2", ...],
    "recommendedTests": ["test1", "test2", ...],
    "severity": "low/medium/high",
    "priorityConsultation": true/false,
    "suggestedDoctors": ["doctor_id1", "doctor_id2", ...]
  }
}

Important:
- This is a preliminary analysis and NOT a medical diagnosis
- Always recommend professional medical consultation
- If any critical findings are detected, emphasize immediate medical attention
- Be conservative and cautious in recommendations
- If unable to analyze files, indicate that clearly in the response`;

    // Call the LLM API
    const response = await llmClient.stream([
      {
        role: 'system',
        content: 'You are an AI medical assistant. Always provide preliminary analysis with strong disclaimers that this is not a medical diagnosis and professional consultation is required.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ], {
      model: 'doubao-seed-1-6-251015',
      temperature: 0.3,
      thinking: 'disabled',
    });

    let fullContent = '';
    for await (const chunk of response) {
      if (chunk.content) {
        fullContent += chunk.content.toString();
      }
    }

    // Parse the AI response
    let aiResponse: AnalysisResponse;
    try {
      // Try to extract JSON from the response
      const content = fullContent;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        aiResponse = JSON.parse(jsonMatch[0]);
      } else {
        // If no JSON found, create a basic response
        aiResponse = {
          analysis: content,
          recommendations: {
            consultationDirection: 'general',
            suggestedSpecialties: ['internal_medicine'],
            recommendedTests: ['blood_test', 'physical_exam'],
            severity: 'medium',
            priorityConsultation: false,
          },
        };
      }
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      aiResponse = {
        analysis: fullContent || 'Analysis completed',
        recommendations: {
          consultationDirection: 'general',
          suggestedSpecialties: ['internal_medicine'],
          recommendedTests: ['blood_test', 'physical_exam'],
          severity: 'medium',
          priorityConsultation: false,
        },
      };
    }

    return NextResponse.json(aiResponse);
  } catch (error) {
    console.error('Health record analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze health records' },
      { status: 500 }
    );
  }
}
