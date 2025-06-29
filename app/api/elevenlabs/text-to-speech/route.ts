import { NextRequest, NextResponse } from 'next/server';

interface TextToSpeechRequest {
  text: string;
  voice_id: string;
  model_id: string;
  voice_settings: {
    stability: number;
    similarity_boost: number;
    style: number;
    use_speaker_boost: boolean;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: TextToSpeechRequest = await request.json();
    const { text, voice_id, model_id, voice_settings } = body;

    // Validate required fields
    if (!text || !voice_id) {
      return NextResponse.json(
        { error: 'Text and voice_id are required' },
        { status: 400 }
      );
    }

    // Check for ElevenLabs API key
    const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;
    if (!elevenLabsApiKey) {
      return NextResponse.json(
        { error: 'ElevenLabs API key not configured' },
        { status: 500 }
      );
    }

    // Construct the ElevenLabs API URL
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voice_id}`;

    // Prepare the request payload
    const payload = {
      text,
      model_id: model_id || 'eleven_turbo_v2',
      voice_settings: {
        stability: voice_settings.stability ?? 0.5,
        similarity_boost: voice_settings.similarity_boost ?? 0.5,
        style: voice_settings.style ?? 0.5,
        use_speaker_boost: voice_settings.use_speaker_boost ?? true,
      },
    };

    // Make the request to ElevenLabs API
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': elevenLabsApiKey,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API error:', errorText);

      return NextResponse.json(
        {
          error: 'Failed to generate speech',
          details: `ElevenLabs API returned ${response.status}: ${errorText}`,
        },
        { status: response.status }
      );
    }

    // Get the audio data
    const audioBuffer = await response.arrayBuffer();

    // Return the audio data with appropriate headers
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Text-to-speech API error:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      message: 'ElevenLabs Text-to-Speech API',
      description:
        'POST /api/elevenlabs/text-to-speech - Convert text to speech using ElevenLabs',
      required_fields: ['text', 'voice_id'],
      optional_fields: ['model_id', 'voice_settings'],
      supported_voices: [
        'Rachel',
        'Drew',
        'Clyde',
        'Paul',
        'Domi',
        'Dave',
        'Fin',
        'Sarah',
        'Antoni',
        'Thomas',
      ],
    },
    { status: 200 }
  );
}
