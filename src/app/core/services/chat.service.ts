import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
}

export interface ChatResponse {
  success: boolean;
  conversation_id: string;
  answer: string;
  user_message: any;
  assistant_message: any;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  constructor(private supabase: SupabaseService) {}

  async getLatestDocumentConversation(documentId: string) {
    const { data, error } = await this.supabase.client
      .from('ai_conversations')
      .select('*')
      .eq('document_id', documentId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    return data;
  }

  async getLatestGeneralConversation() {
    const { data, error } = await this.supabase.client
      .from('ai_conversations')
      .select('*')
      .is('document_id', null)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    return data;
  }

  async getConversationMessages(conversationId: string) {
    const { data, error } = await this.supabase.client
      .from('ai_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return data ?? [];
  }

  async sendMessageToDocument(documentId: string, message: string, conversationId?: string | null): Promise<ChatResponse> {
    const { data, error } = await this.supabase.client.functions.invoke<ChatResponse>('chat-with-document', {
      body: {
        document_id: documentId,
        message: message,
        conversation_id: conversationId
      }
    });

    if (error) {
      throw error;
    }
    
    if (!data) {
      throw new Error('Sin respuesta del servidor.');
    }
    
    if (data.error) {
      throw new Error(data.error);
    }

    return data;
  }

  async sendMessageToGeneral(message: string, conversationId?: string | null): Promise<ChatResponse> {
    const { data, error } = await this.supabase.client.functions.invoke<ChatResponse>('general-chat', {
      body: {
        message: message,
        conversation_id: conversationId
      }
    });

    if (error) {
      throw error;
    }
    
    if (!data) {
      throw new Error('Sin respuesta del servidor.');
    }
    
    if (data.error) {
      throw new Error(data.error);
    }

    return data;
  }
}
