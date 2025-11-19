import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { Note } from '../entities/note.entity';
import { Portfolio } from '../../portfolio/entities/portfolio.entity';
import { Asset } from '../../asset/entities/asset.entity';
import { CreateNoteDto } from '../dto/create-note.dto';
import { UpdateNoteDto } from '../dto/update-note.dto';
import { AccountValidationService } from '../../shared/services/account-validation.service';

/**
 * Service for managing notes.
 * Handles CRUD operations for notes associated with portfolios and assets.
 */
@Injectable()
export class NoteService {
  private readonly logger = new Logger(NoteService.name);

  constructor(
    @InjectRepository(Note)
    private readonly noteRepository: Repository<Note>,
    @InjectRepository(Portfolio)
    private readonly portfolioRepository: Repository<Portfolio>,
    @InjectRepository(Asset)
    private readonly assetRepository: Repository<Asset>,
    private readonly accountValidationService: AccountValidationService,
  ) {}

  /**
   * Create a new note.
   */
  async createNote(createNoteDto: CreateNoteDto, accountId: string): Promise<Note> {
    // Validate portfolio ownership
    await this.accountValidationService.validatePortfolioOwnership(
      createNoteDto.portfolioId,
      accountId,
    );

    // Validate asset if provided
    if (createNoteDto.assetId) {
      const asset = await this.assetRepository.findOne({
        where: { id: createNoteDto.assetId },
      });

      if (!asset) {
        throw new NotFoundException(`Asset with ID ${createNoteDto.assetId} not found`);
      }

      // Verify asset belongs to the same account (through portfolio or directly)
      // For now, we'll just check if asset exists
    }

    // Parse note date
    const noteDate = new Date(createNoteDto.noteDate);
    if (isNaN(noteDate.getTime())) {
      throw new BadRequestException('Invalid note date format');
    }

    // Create note
    const note = this.noteRepository.create({
      portfolioId: createNoteDto.portfolioId,
      assetId: createNoteDto.assetId,
      noteDate: noteDate,
      content: createNoteDto.content,
    });

    return await this.noteRepository.save(note);
  }

  /**
   * Get all notes for a portfolio, optionally filtered by asset.
   */
  async getNotesByPortfolio(
    portfolioId: string,
    accountId: string,
    assetId?: string,
  ): Promise<Note[]> {
    // Validate portfolio ownership
    await this.accountValidationService.validatePortfolioOwnership(portfolioId, accountId);

    const where: FindOptionsWhere<Note> = {
      portfolioId: portfolioId,
    };

    if (assetId) {
      where.assetId = assetId;
    }

    return await this.noteRepository.find({
      where,
      relations: ['asset'],
      order: {
        noteDate: 'DESC',
        createdAt: 'DESC',
      },
    });
  }

  /**
   * Get a single note by ID.
   */
  async getNoteById(noteId: string, accountId: string): Promise<Note> {
    const note = await this.noteRepository.findOne({
      where: { noteId },
      relations: ['portfolio', 'asset'],
    });

    if (!note) {
      throw new NotFoundException(`Note with ID ${noteId} not found`);
    }

    // Validate portfolio ownership
    await this.accountValidationService.validatePortfolioOwnership(
      note.portfolioId,
      accountId,
    );

    return note;
  }

  /**
   * Update a note.
   */
  async updateNote(noteId: string, updateNoteDto: UpdateNoteDto, accountId: string): Promise<Note> {
    const note = await this.getNoteById(noteId, accountId);

    // Update fields if provided
    if (updateNoteDto.noteDate !== undefined) {
      const noteDate = new Date(updateNoteDto.noteDate);
      if (isNaN(noteDate.getTime())) {
        throw new BadRequestException('Invalid note date format');
      }
      note.noteDate = noteDate;
    }

    if (updateNoteDto.content !== undefined) {
      note.content = updateNoteDto.content;
    }

    if (updateNoteDto.assetId !== undefined) {
      // If assetId is being changed, validate the new asset if provided
      if (updateNoteDto.assetId) {
        const asset = await this.assetRepository.findOne({
          where: { id: updateNoteDto.assetId },
        });

        if (!asset) {
          throw new NotFoundException(`Asset with ID ${updateNoteDto.assetId} not found`);
        }
      }
      note.assetId = updateNoteDto.assetId || null;
    }

    return await this.noteRepository.save(note);
  }

  /**
   * Delete a note.
   */
  async deleteNote(noteId: string, accountId: string): Promise<void> {
    const note = await this.getNoteById(noteId, accountId);
    await this.noteRepository.remove(note);
  }

  /**
   * Get notes by asset ID (across all portfolios).
   * Note: This might need account validation depending on requirements.
   */
  async getNotesByAsset(assetId: string, accountId: string): Promise<Note[]> {
    // First, verify asset exists
    const asset = await this.assetRepository.findOne({
      where: { id: assetId },
    });

    if (!asset) {
      throw new NotFoundException(`Asset with ID ${assetId} not found`);
    }

    // Get all notes for this asset
    const notes = await this.noteRepository.find({
      where: { assetId },
      relations: ['portfolio', 'asset'],
      order: {
        noteDate: 'DESC',
        createdAt: 'DESC',
      },
    });

    // Filter notes by portfolio ownership
    const accessibleNotes = [];
    for (const note of notes) {
      try {
        await this.accountValidationService.validatePortfolioOwnership(
          note.portfolioId,
          accountId,
        );
        accessibleNotes.push(note);
      } catch (error) {
        // Skip notes from portfolios the user doesn't have access to
        continue;
      }
    }

    return accessibleNotes;
  }
}

