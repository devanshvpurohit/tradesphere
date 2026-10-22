import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export interface ModelOption {
  id: string;
  label: string;
  description?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { provider, apiKey, ollamaBaseUrl = 'http://localhost:11434' } = body;

    if (!provider) {
      return NextResponse.json({ error: 'Provider is required' }, { status: 400 });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    let models: ModelOption[] = [];

    switch (provider) {
      case 'ollama': {
        const res = await fetch(`${ollamaBaseUrl}/api/tags`, {
          method: 'GET',
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (!res.ok) {
          throw new Error(`Ollama returned status ${res.status}`);
        }

        const data = await res.json();
        if (Array.isArray(data.models)) {
          models = data.models.map((m: any) => ({
            id: m.name,
            label: `${m.name} ${m.size ? `(${(m.size / (1024 * 1024)).toFixed(0)}MB)` : ''}`,
            description: m.details?.parameter_size ? `${m.details.parameter_size} parameters` : 'Local Model',
          }));
        }
        break;
      }

      case 'openai': {
        if (!apiKey) {
          throw new Error('OpenAI API Key is required');
        }

        const res = await fetch('https://api.openai.com/v1/models', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error?.message || `OpenAI returned status ${res.status}`);
        }

        const data = await res.json();
        if (Array.isArray(data.data)) {
          // Filter relevant chat/gpt models
          const filtered = data.data
            .filter((m: any) => {
              const id = m.id.toLowerCase();
              return (
                (id.includes('gpt') || id.includes('o1') || id.includes('chat')) &&
                !id.includes('instruct') &&
                !id.includes('realtime') &&
                !id.includes('audio') &&
                !id.includes('embedding')
              );
            })
            .sort((a: any, b: any) => b.created - a.created);

          models = filtered.map((m: any) => ({
            id: m.id,
            label: m.id,
            description: `Owner: ${m.owned_by}`,
          }));
        }
        break;
      }

      case 'gemini': {
        if (!apiKey) {
          throw new Error('Google Gemini API Key is required');
        }

        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
          {
            method: 'GET',
            signal: controller.signal,
          }
        );
        clearTimeout(timeoutId);

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error?.message || `Gemini returned status ${res.status}`);
        }

        const data = await res.json();
        if (Array.isArray(data.models)) {
          // Filter models supporting generateContent
          const filtered = data.models.filter((m: any) => {
            const methods = m.supportedGenerationMethods || [];
            return methods.includes('generateContent') && m.name.includes('gemini');
          });

          models = filtered.map((m: any) => {
            const rawId = m.name.replace('models/', '');
            return {
              id: rawId,
              label: m.displayName || rawId,
              description: m.description ? m.description.slice(0, 60) + '...' : undefined,
            };
          });
        }
        break;
      }

      case 'groq': {
        if (!apiKey) {
          throw new Error('Groq API Key is required');
        }

        const res = await fetch('https://api.groq.com/openai/v1/models', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error?.message || `Groq returned status ${res.status}`);
        }

        const data = await res.json();
        if (Array.isArray(data.data)) {
          models = data.data
            .filter((m: any) => m.active !== false)
            .map((m: any) => ({
              id: m.id,
              label: m.id,
              description: `Context: ${m.context_window || 'standard'} tokens`,
            }));
        }
        break;
      }

      case 'openrouter': {
        if (!apiKey) {
          throw new Error('OpenRouter API Key is required');
        }

        const res = await fetch('https://openrouter.ai/api/v1/models', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error?.message || `OpenRouter returned status ${res.status}`);
        }

        const data = await res.json();
        if (Array.isArray(data.data)) {
          // Grab popular or top models
          models = data.data.slice(0, 50).map((m: any) => ({
            id: m.id,
            label: m.name || m.id,
            description: m.pricing?.prompt ? `Prompt: $${m.pricing.prompt}/1M` : undefined,
          }));
        }
        break;
      }

      case 'anthropic': {
        if (!apiKey) {
          throw new Error('Anthropic API Key is required');
        }

        // Validate Anthropic key with a test call or official models endpoint
        try {
          const testRes = await fetch('https://api.anthropic.com/v1/models', {
            method: 'GET',
            headers: {
              'x-api-key': apiKey,
              'anthropic-version': '2023-06-01',
            },
            signal: controller.signal,
          });

          if (testRes.ok) {
            const data = await testRes.json();
            if (Array.isArray(data.data)) {
              models = data.data.map((m: any) => ({
                id: m.id,
                label: m.display_name || m.id,
              }));
            }
          }
        } catch {
          // fallback to standard models if models endpoint is restricted on tier
        }

        if (models.length === 0) {
          models = [
            { id: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet (Latest Flagship)' },
            { id: 'claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku (Ultra-Fast)' },
            { id: 'claude-3-opus-20240229', label: 'Claude 3 Opus (Deep Reasoning)' },
            { id: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku' },
          ];
        }
        break;
      }

      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }

    return NextResponse.json({
      success: true,
      provider,
      count: models.length,
      models,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err.name === 'AbortError' ? 'Request timed out' : err.message || 'Failed to fetch models',
      },
      { status: 400 }
    );
  }
}
