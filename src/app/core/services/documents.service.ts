import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

import * as pdfjsLib from 'pdfjs-dist';

export interface DocumentDB {
  id: string;
  user_id: string;
  workspace_id: string;
  subject_id: string;
  title: string;
  description: string;
  document_type: 'pdf' | 'image' | 'text' | 'link' | 'other';
  file_name: string;
  file_path: string;
  file_mime: string;
  file_size_bytes: number;
  source_url: string;
  status: 'uploaded' | 'processing' | 'ready' | 'failed';
  error_message: string;
  created_at: string;
  updated_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class DocumentsService {
  constructor(private supabase: SupabaseService) {}

  async getDocumentsBySubject(subjectId: string): Promise<DocumentDB[]> {
    const user = this.supabase.currentUser;
    if (!user) throw new Error('Usuario no autenticado');

    const { data, error } = await this.supabase.client
      .from('documents')
      .select('*')
      .eq('user_id', user.id)
      .eq('subject_id', subjectId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getDocumentsByWorkspace(workspaceId: string): Promise<DocumentDB[]> {
    const user = this.supabase.currentUser;
    if (!user) throw new Error('Usuario no autenticado');

    const { data, error } = await this.supabase.client
      .from('documents')
      .select('*')
      .eq('user_id', user.id)
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getDocumentById(id: string): Promise<DocumentDB> {
    const user = this.supabase.currentUser;
    if (!user) throw new Error('Usuario no autenticado');

    const { data, error } = await this.supabase.client
      .from('documents')
      .select('*')
      .eq('user_id', user.id)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async createDocument(workspaceId: string, subjectId: string, title: string, description: string, documentType: string): Promise<DocumentDB> {
    const user = this.supabase.currentUser;
    if (!user) throw new Error('Usuario no autenticado');

    const newDocument = {
      user_id: user.id,
      workspace_id: workspaceId,
      subject_id: subjectId,
      title,
      description: description || '',
      document_type: documentType,
      status: 'uploaded'
    };

    const { data, error } = await this.supabase.client
      .from('documents')
      .insert(newDocument)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateDocument(id: string, changes: Partial<DocumentDB>): Promise<DocumentDB> {
    const { data, error } = await this.supabase.client
      .from('documents')
      .update(changes)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteDocument(id: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('documents')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async uploadDocumentFile(
    workspaceId: string,
    subjectId: string,
    title: string,
    description: string,
    _uiDocumentType: string,
    file: File
  ): Promise<DocumentDB> {
    const user = this.supabase.currentUser;
    if (!user) throw new Error('Usuario no autenticado');

    const calculatedType = this.getDocumentTypeFromFile(file);

    // 1. Crear el registro inicial
    const document = await this.createDocument(workspaceId, subjectId, title, description, calculatedType);

    const filePath = `${user.id}/${document.id}/${file.name}`;

    // 2. Subir a Storage
    const { data: uploadData, error: uploadError } = await this.supabase.client.storage
      .from('nexus-documents')
      .upload(filePath, file, {
        upsert: true
      });

    if (uploadError) {
      await this.updateDocument(document.id, {
        status: 'failed',
        error_message: uploadError.message
      });
      throw new Error(`Error al subir el archivo: ${uploadError.message}`);
    }

    // 3. Actualizar registro como subido
    let updatedDocument = await this.updateDocument(document.id, {
      file_name: file.name,
      file_path: filePath,
      file_mime: file.type,
      file_size_bytes: file.size,
      status: 'uploaded'
    });

    // 4. Procesar según el tipo de archivo
    if (file.type === 'application/pdf' || file.type === 'text/plain') {
      try {
        await this.updateDocument(document.id, { status: 'processing' });
        
        let extractedText = '';

        if (file.type === 'application/pdf') {
          extractedText = await this.extractPdfText(file);
        } else if (file.type === 'text/plain') {
          extractedText = await file.text();
        }

        if (!extractedText || extractedText.trim() === '') {
          throw new Error('El documento no contiene texto extraíble o está vacío.');
        }

        const chunks = this.splitTextIntoChunks(extractedText, 1000);
        
        // Borrar chunks anteriores (por seguridad)
        await this.supabase.client
          .from('document_chunks')
          .delete()
          .eq('document_id', document.id);
          
        // Insertar nuevos chunks
        const chunksToInsert = chunks.map((content, index) => ({
          user_id: user.id,
          document_id: document.id,
          chunk_index: index,
          content: content,
          token_count: Math.round(content.length / 4) // Estimación rápida
        }));

        const { error: chunkError } = await this.supabase.client
          .from('document_chunks')
          .insert(chunksToInsert);

        if (chunkError) throw chunkError;

        updatedDocument = await this.updateDocument(document.id, { status: 'ready', error_message: '' });
      } catch (procError: any) {
        console.error('Error processing document:', procError);
        updatedDocument = await this.updateDocument(document.id, { 
          status: 'failed', 
          error_message: procError.message || 'Error procesando el documento' 
        });
      }
    } else {
      // Si no es un formato procesable, lo dejamos como ready directamente (ej. imágenes)
      updatedDocument = await this.updateDocument(document.id, { status: 'ready' });
    }

    return updatedDocument;
  }

  private async extractPdfText(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    
    // Configurar worker. Fallback a unpkg si falla la red o versión
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
    
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n';
    }
    
    return fullText;
  }

  private splitTextIntoChunks(text: string, chunkSize = 1000): string[] {
    const words = text.split(/\s+/);
    const chunks: string[] = [];
    let currentChunk: string[] = [];
    let currentLength = 0;

    for (const word of words) {
      if (currentLength + word.length > chunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk.join(' '));
        currentChunk = [];
        currentLength = 0;
      }
      currentChunk.push(word);
      currentLength += word.length + 1;
    }
    if (currentChunk.length > 0) {
      chunks.push(currentChunk.join(' '));
    }
    return chunks;
  }

  private getDocumentTypeFromFile(file: File): DocumentDB['document_type'] {
    if (file.type === 'application/pdf') return 'pdf';
    if (file.type.startsWith('image/')) return 'image';
    if (file.type === 'text/plain') return 'text';
    return 'other';
  }
}
