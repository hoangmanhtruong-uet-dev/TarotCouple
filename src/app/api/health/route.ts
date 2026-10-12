import { NextResponse } from 'next/server';
import { GEMINI_MODEL_CHAIN, getValidGeminiApiKeys } from '@/lib/ai-provider';
import { checkSupabaseHealth } from '@/lib/supabase-hybrid';

export const dynamic = 'force-dynamic';

export interface HealthResponse {
  status: 'ok';
  timestamp: string;
  ai: {
    configuredKeysCount: number;
    primaryModel: string;
    modelChain: readonly string[];
  };
  supabase: {
    mode: 'hybrid' | 'memory-only';
    connected: boolean;
    tablesReady: boolean;
    missingTables: string[];
  };
}

export async function GET() {
  const keys = getValidGeminiApiKeys();
  const supabaseHealth = await checkSupabaseHealth();

  const responseBody: HealthResponse = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    ai: {
      configuredKeysCount: keys.length,
      primaryModel: GEMINI_MODEL_CHAIN[0],
      modelChain: GEMINI_MODEL_CHAIN,
    },
    supabase: {
      mode: supabaseHealth.mode,
      connected: supabaseHealth.connected,
      tablesReady: supabaseHealth.tablesReady,
      missingTables: supabaseHealth.missingTables,
    },
  };

  return NextResponse.json(responseBody, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}
