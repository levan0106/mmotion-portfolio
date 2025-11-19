import { Note, CreateNoteDto, UpdateNoteDto } from '../types';
import { apiService } from './api';

class NoteService {
  /**
   * Get all notes for a portfolio, optionally filtered by asset.
   */
  async getNotesByPortfolio(
    portfolioId: string,
    accountId: string,
    assetId?: string
  ): Promise<Note[]> {
    const params: Record<string, string> = {
      accountId,
    };

    if (assetId) {
      params.assetId = assetId;
    }

    return await apiService.get(`/api/v1/notes/portfolio/${portfolioId}`, { params });
  }

  /**
   * Get all notes for an asset (across all portfolios).
   */
  async getNotesByAsset(assetId: string, accountId: string): Promise<Note[]> {
    return await apiService.get(`/api/v1/notes/asset/${assetId}`, {
      params: { accountId },
    });
  }

  /**
   * Get a single note by ID.
   */
  async getNoteById(noteId: string, accountId: string): Promise<Note> {
    return await apiService.get(`/api/v1/notes/${noteId}`, {
      params: { accountId },
    });
  }

  /**
   * Create a new note.
   */
  async createNote(data: CreateNoteDto, accountId: string): Promise<Note> {
    return await apiService.post('/api/v1/notes', data, {
      params: { accountId },
    });
  }

  /**
   * Update a note.
   */
  async updateNote(
    noteId: string,
    data: UpdateNoteDto,
    accountId: string
  ): Promise<Note> {
    return await apiService.put(`/api/v1/notes/${noteId}`, data, {
      params: { accountId },
    });
  }

  /**
   * Delete a note.
   */
  async deleteNote(noteId: string, accountId: string): Promise<void> {
    return await apiService.delete(`/api/v1/notes/${noteId}`, {
      params: { accountId },
    });
  }
}

export const noteService = new NoteService();

