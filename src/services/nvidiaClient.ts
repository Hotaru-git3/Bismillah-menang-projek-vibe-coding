import axios, { type AxiosInstance } from 'axios';
import { SecurityUtils } from '../utils/security';
import { aiRateLimiter } from '../utils/rateLimiter';

interface NvidiaConfig {
  primaryModel: string;
  fallbackModel: string;
  apiKey: string;
  baseURL: string;
  timeout: number;
}

export class NvidiaClient {
  private config: NvidiaConfig;
  private axiosInstance: AxiosInstance;

  constructor() {
    this.config = {
      primaryModel: process.env.NVIDIA_PRIMARY_MODEL || 'meta/llama-4-maverick-17b-128e-instruct',
      fallbackModel: process.env.NVIDIA_FALLBACK_MODEL || 'mistralai/mistral-large-3-675b-instruct-2512',
      apiKey: process.env.NVIDIA_API_KEY || '',
      baseURL: 'https://integrate.api.nvidia.com/v1/chat/completions',
      timeout: 25000 // 25 seconds, to accommodate serverless environments like Vercel
    };

    if (!this.config.apiKey) {
      console.error('❌ NVIDIA_API_KEY tidak ditemukan di environment variables!');
    } else {
      console.log(`✅ NVIDIA Client ready. Key: ${SecurityUtils.maskAPIKey(this.config.apiKey)}`);
    }

    this.axiosInstance = axios.create({
      timeout: this.config.timeout,
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  }

  async chat(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    options?: { temperature?: number; maxTokens?: number; stream?: boolean }
  ): Promise<string> {
    const payload = {
      model: this.config.primaryModel,
      messages,
      max_tokens: options?.maxTokens || 2048,
      temperature: options?.temperature ?? 0.15,
      top_p: 1.0,
      frequency_penalty: 0.0,
      presence_penalty: 0.0,
      stream: options?.stream || false
    };

    return aiRateLimiter.enqueue(async () => {
      // Try primary model with retry
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const response = await this.axiosInstance.post(this.config.baseURL, payload);
          return response.data.choices[0].message.content;
        } catch (error: any) {
          const status = error?.response?.status;
          const isTimeout = error?.code === 'ECONNABORTED' || error?.code === 'ETIMEDOUT';
          
          console.warn(`⚠️ Attempt ${attempt}/3 gagal:`, {
            status,
            isTimeout,
            message: error.message?.substring(0, 100)
          });

          // Retry logic
          if ((isTimeout || status >= 500 || status === 429) && attempt < 3) {
            await this.sleep(attempt * 1000); 
            continue;
          }

          // Fallback logic
          if (this.config.fallbackModel !== this.config.primaryModel) {
            console.warn(`🔄 Fallback ke ${this.config.fallbackModel}`);
            payload.model = this.config.fallbackModel;
            
            try {
              const fallbackResponse = await this.axiosInstance.post(this.config.baseURL, payload);
              return fallbackResponse.data.choices[0].message.content;
            } catch (fallbackError: any) {
              console.error('❌ Fallback juga gagal');
              throw new Error('VERCEL_AI_DOWN');
            }
          }

          throw error;
        }
      }

      throw new Error('VERCEL_MAX_RETRIES');
    });
  }

  async chatJSON<T>(
    messages: Array<{ role: 'system' | 'user'; content: string }>,
    options?: { temperature?: number; maxTokens?: number }
  ): Promise<T> {
    const systemMsg = messages.find(m => m.role === 'system');
    if (systemMsg) {
      systemMsg.content += '\n\nPENTING: Output HARUS JSON valid tanpa markdown codeblock. Jangan ada teks lain.';
    }

    const text = await this.chat(messages, options);
    
    // Validate response type to avoid HTML
    if (text.startsWith('<') || text.startsWith('<!DOCTYPE') || text.includes('<html')) {
      console.error('❌ Dapat HTML, bukan JSON:', text.substring(0, 200));
      throw new Error('VERCEL_HTML_RESPONSE');
    }

    if (text.startsWith('A server e') || text.startsWith('An error') || text.startsWith('Error:')) {
      console.error('❌ Dapat error text:', text.substring(0, 200));
      throw new Error('VERCEL_ERROR_RESPONSE');
    }

    const cleanText = text
      .replace(/```json\s*/gi, '')
      .replace(/```\s*$/gm, '')
      .replace(/^```[a-z]*\s*/im, '')
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove controls
      .trim();

    if (!cleanText.startsWith('{') && !cleanText.startsWith('[')) {
      console.error('❌ Response bukan JSON:', cleanText.substring(0, 200));
      throw new Error('VERCEL_NOT_JSON');
    }

    try {
      return JSON.parse(cleanText) as T;
    } catch (error) {
      console.error('❌ Gagal parse JSON:', cleanText.substring(0, 200));
      throw new Error('VERCEL_JSON_PARSE_ERROR');
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const nvidiaClient = new NvidiaClient();
