import { NextRequest, NextResponse } from 'next/server';
import { ASRClient, Config, S3Storage } from 'coze-coding-dev-sdk';

const storage = new S3Storage({
  endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
  accessKey: '',
  secretKey: '',
  bucketName: process.env.COZE_BUCKET_NAME,
  region: 'cn-beijing',
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('audio') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    // Validate file type (only audio files)
    const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/webm', 'audio/x-m4a'];
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|ogg|m4a|webm)$/i)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only audio files are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB as per ASR limits)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit.' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to S3
    const fileName = `voice-input/${Date.now()}-${file.name}`;
    const fileKey = await storage.uploadFile({
      fileContent: buffer,
      fileName: fileName,
      contentType: file.type,
    });

    // Generate presigned URL for ASR
    const audioUrl = await storage.generatePresignedUrl({
      key: fileKey,
      expireTime: 3600, // 1 hour
    });

    // Initialize ASR client
    const config = new Config();
    const asrClient = new ASRClient(config);

    // Recognize speech
    const result = await asrClient.recognize({
      uid: 'guest', // Could be replaced with actual user ID
      url: audioUrl
    });

    return NextResponse.json({
      success: true,
      text: result.text,
      duration: result.duration,
    });
  } catch (error) {
    console.error('Voice transcription error:', error);
    return NextResponse.json(
      { error: 'Failed to transcribe audio' },
      { status: 500 }
    );
  }
}
