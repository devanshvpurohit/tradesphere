import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const baseUrl = searchParams.get('baseUrl') || 'http://localhost:11434';

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(`${baseUrl}/api/tags`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      return NextResponse.json(
        { connected: false, error: `Ollama returned status ${res.status}` },
        { status: 200 }
      );
    }

    const data = await res.json();
    const models = Array.isArray(data.models)
      ? data.models.map((m: any) => ({
          name: m.name,
          model: m.model,
          sizeMb: m.size ? (m.size / (1024 * 1024)).toFixed(1) : undefined,
          parameterSize: m.details?.parameter_size,
          quantization: m.details?.quantization_level,
        }))
      : [];

    return NextResponse.json({
      connected: true,
      baseUrl,
      models,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        connected: false,
        baseUrl,
        error: err.name === 'AbortError' ? 'Connection timed out' : err.message || 'Could not connect to Ollama',
      },
      { status: 200 }
    );
  }
}
