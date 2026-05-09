import axios, { AxiosInstance } from 'axios';
import { aiRateLimiter } from '../utils/rateLimiter';
import { SecurityUtils } from '../utils/security';

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
      timeout: 30000
    };

    if (!this.config.apiKey) {
      console.error('❌ NVIDIA_API_KEY tidak ditemukan di environment variables!');
    }

    this.axiosInstance = axios.create({
      baseURL: this.config.baseURL,
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
      try {
        // Coba primary model
        const response = await this.axiosInstance.post('', payload);
        return response.data.choices[0].message.content;
      } catch (error: any) {
        console.warn(`⚠️ ${this.config.primaryModel} gagal:`, error.message);
        
        // Fallback ke secondary model
        payload.model = this.config.fallbackModel;
        const fallbackResponse = await this.axiosInstance.post('', payload);
        return fallbackResponse.data.choices[0].message.content;
      }
    });
  }

  async chatJSON<T>(
    messages: Array<{ role: 'system' | 'user'; content: string }>,
    options?: { temperature?: number; maxTokens?: number }
  ): Promise<T> {
    // Tambah instruksi JSON
    const systemMsg = messages.find(m => m.role === 'system');
    if (systemMsg) {
      systemMsg.content += '\n\nPENTING: Output HARUS JSON valid tanpa markdown codeblock. Jangan ada teks lain.';
    }

    const text = await this.chat(messages, options);
    
    // Bersihin output
    const cleanText = text
      .replace(/```json\s*/gi, '')
      .replace(/```\s*$/gm, '')
      .replace(/^```[a-z]*\s*/im, '')
      .trim();

    try {
      return JSON.parse(cleanText) as T;
    } catch (error) {
      console.error('❌ Gagal parse JSON:', cleanText.substring(0, 200));
      throw new Error('AI response bukan JSON valid');
    }
  }
}

export const nvidiaClient = new NvidiaClient();
