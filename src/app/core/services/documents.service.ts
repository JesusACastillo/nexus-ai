import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

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
    documentType: string,
    file: File
  ): Promise<DocumentDB> {
    const user = this.supabase.currentUser;
    if (!user) throw new Error('Usuario no autenticado');

    // 1. Crear el registro inicial en la base de datos
    const document = await this.createDocument(workspaceId, subjectId, title, description, documentType);

    const filePath = `${user.id}/${document.id}/${file.name}`;

    // 2. Subir el archivo al bucket
    const { data: uploadData, error: uploadError } = await this.supabase.client.storage
      .from('nexus-documents')
      .upload(filePath, file, {
        upsert: true
      });

    // 3. Manejar error de subida
    if (uploadError) {
      await this.updateDocument(document.id, {
        status: 'failed',
        error_message: uploadError.message
      });
      throw new Error(`Error al subir el archivo: ${uploadError.message}`);
    }

    // 4. Actualizar registro con la metadata del archivo si todo fue bien
    const updatedDocument = await this.updateDocument(document.id, {
      file_name: file.name,
      file_path: filePath,
      file_mime: file.type,
      file_size_bytes: file.size,
      status: 'uploaded'
    });

    return updatedDocument;
  }
}
