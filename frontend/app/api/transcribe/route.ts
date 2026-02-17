import { NextRequest, NextResponse } from 'next/server';

const apiKey = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-2.0-flash';

/**
 * Transcribe audio using the Gemini REST API directly.
 * Avoids SDK issues with audio multipart content.
 */
export async function POST(req: NextRequest) {
  console.log('[TRANSCRIBE] Received request');

  if (!apiKey) {
    console.error('[TRANSCRIBE] GEMINI_API_KEY not configured');
    return NextResponse.json(
      { error: 'Servicio de transcripción no configurado' },
      { status: 500 }
    );
  }

  try {
    const formData = await req.formData();
    const audioFile = formData.get('audio') as File | null;

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No se envió archivo de audio' },
        { status: 400 }
      );
    }

    // Clean MIME type — Gemini doesn't accept codec params like "audio/webm;codecs=opus"
    let mimeType = (audioFile.type || 'audio/webm').split(';')[0].trim();
    // Map to supported types
    if (!['audio/wav', 'audio/mp3', 'audio/aiff', 'audio/aac', 'audio/ogg', 'audio/flac', 'audio/webm', 'audio/mpeg'].includes(mimeType)) {
      mimeType = 'audio/webm'; // fallback
    }

    console.log('[TRANSCRIBE] Audio file:', {
      name: audioFile.name,
      originalType: audioFile.type,
      cleanType: mimeType,
      size: audioFile.size,
    });

    // Convert to base64
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Audio = buffer.toString('base64');

    console.log('[TRANSCRIBE] Base64 length:', base64Audio.length);

    // Call Gemini REST API directly
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

    const body = {
      contents: [
        {
          parts: [
            {
              inline_data: {
                mime_type: mimeType,
                data: base64Audio,
              },
            },
            {
              text: 'Transcribe este audio al español exactamente como se dice. Solo devuelve el texto hablado, sin explicaciones, sin comillas, sin notas. Si no se entiende nada o está vacío, devuelve exactamente: [vacío]',
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 500,
      },
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[TRANSCRIBE] Gemini API error:', response.status, JSON.stringify(data));
      return NextResponse.json(
        { error: `Gemini API error: ${data?.error?.message || response.statusText}` },
        { status: 502 }
      );
    }

    const transcription = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

    console.log('[TRANSCRIBE] Raw result:', transcription);

    // Clean up — if Gemini returned [vacío] or similar markers, treat as empty
    const cleaned = transcription === '[vacío]' || transcription === '[vacio]' || transcription === '' ? '' : transcription;

    console.log('[TRANSCRIBE] Final:', cleaned);

    return NextResponse.json({ text: cleaned });
  } catch (err: any) {
    console.error('[TRANSCRIBE] Error:', err?.message || err);
    return NextResponse.json(
      { error: 'Error al transcribir el audio' },
      { status: 500 }
    );
  }
}
