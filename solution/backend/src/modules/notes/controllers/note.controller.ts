import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpCode,
  ParseUUIDPipe,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { NoteService } from '../services/note.service';
import { CreateNoteDto } from '../dto/create-note.dto';
import { UpdateNoteDto } from '../dto/update-note.dto';
import { Note } from '../entities/note.entity';
import { AccountValidationService } from '../../shared/services/account-validation.service';

/**
 * Controller for Notes CRUD operations.
 */
@ApiTags('Notes')
@Controller('api/v1/notes')
export class NoteController {
  constructor(
    private readonly noteService: NoteService,
    private readonly accountValidationService: AccountValidationService,
  ) {}

  /**
   * Create a new note.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new note',
    description: 'Creates a new note for a portfolio, optionally associated with an asset.',
  })
  @ApiBody({ type: CreateNoteDto })
  @ApiQuery({ name: 'accountId', required: true, description: 'Account ID for ownership validation' })
  @ApiResponse({
    status: 201,
    description: 'Note created successfully',
    type: Note,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - portfolio does not belong to account',
  })
  @ApiResponse({
    status: 404,
    description: 'Portfolio or asset not found',
  })
  async createNote(
    @Body() createNoteDto: CreateNoteDto,
    @Query('accountId') accountId: string,
  ): Promise<Note> {
    if (!accountId) {
      throw new BadRequestException('accountId query parameter is required');
    }

    return this.noteService.createNote(createNoteDto, accountId);
  }

  /**
   * Get all notes for a portfolio, optionally filtered by asset.
   */
  @Get('portfolio/:portfolioId')
  @ApiOperation({
    summary: 'Get notes for a portfolio',
    description: 'Retrieves all notes for a portfolio, optionally filtered by asset ID.',
  })
  @ApiParam({ name: 'portfolioId', description: 'Portfolio ID' })
  @ApiQuery({ name: 'accountId', required: true, description: 'Account ID for ownership validation' })
  @ApiQuery({ name: 'assetId', required: false, description: 'Optional asset ID to filter notes' })
  @ApiResponse({
    status: 200,
    description: 'Notes retrieved successfully',
    type: [Note],
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - portfolio does not belong to account',
  })
  @ApiResponse({
    status: 404,
    description: 'Portfolio not found',
  })
  async getNotesByPortfolio(
    @Param('portfolioId', ParseUUIDPipe) portfolioId: string,
    @Query('accountId') accountId: string,
    @Query('assetId') assetId?: string,
  ): Promise<Note[]> {
    if (!accountId) {
      throw new BadRequestException('accountId query parameter is required');
    }

    return this.noteService.getNotesByPortfolio(portfolioId, accountId, assetId);
  }

  /**
   * Get all notes for an asset (across all portfolios).
   */
  @Get('asset/:assetId')
  @ApiOperation({
    summary: 'Get notes for an asset',
    description: 'Retrieves all notes associated with an asset across all accessible portfolios.',
  })
  @ApiParam({ name: 'assetId', description: 'Asset ID' })
  @ApiQuery({ name: 'accountId', required: true, description: 'Account ID for ownership validation' })
  @ApiResponse({
    status: 200,
    description: 'Notes retrieved successfully',
    type: [Note],
  })
  @ApiResponse({
    status: 404,
    description: 'Asset not found',
  })
  async getNotesByAsset(
    @Param('assetId', ParseUUIDPipe) assetId: string,
    @Query('accountId') accountId: string,
  ): Promise<Note[]> {
    if (!accountId) {
      throw new BadRequestException('accountId query parameter is required');
    }

    return this.noteService.getNotesByAsset(assetId, accountId);
  }

  /**
   * Get a single note by ID.
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get note by ID',
    description: 'Retrieves a single note by its ID.',
  })
  @ApiParam({ name: 'id', description: 'Note ID' })
  @ApiQuery({ name: 'accountId', required: true, description: 'Account ID for ownership validation' })
  @ApiResponse({
    status: 200,
    description: 'Note retrieved successfully',
    type: Note,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - portfolio does not belong to account',
  })
  @ApiResponse({
    status: 404,
    description: 'Note not found',
  })
  async getNoteById(
    @Param('id', ParseUUIDPipe) noteId: string,
    @Query('accountId') accountId: string,
  ): Promise<Note> {
    if (!accountId) {
      throw new BadRequestException('accountId query parameter is required');
    }

    return this.noteService.getNoteById(noteId, accountId);
  }

  /**
   * Update a note.
   */
  @Put(':id')
  @ApiOperation({
    summary: 'Update a note',
    description: 'Updates an existing note.',
  })
  @ApiParam({ name: 'id', description: 'Note ID' })
  @ApiQuery({ name: 'accountId', required: true, description: 'Account ID for ownership validation' })
  @ApiBody({ type: UpdateNoteDto })
  @ApiResponse({
    status: 200,
    description: 'Note updated successfully',
    type: Note,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - portfolio does not belong to account',
  })
  @ApiResponse({
    status: 404,
    description: 'Note not found',
  })
  async updateNote(
    @Param('id', ParseUUIDPipe) noteId: string,
    @Query('accountId') accountId: string,
    @Body() updateNoteDto: UpdateNoteDto,
  ): Promise<Note> {
    if (!accountId) {
      throw new BadRequestException('accountId query parameter is required');
    }

    return this.noteService.updateNote(noteId, updateNoteDto, accountId);
  }

  /**
   * Delete a note.
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a note',
    description: 'Deletes a note.',
  })
  @ApiParam({ name: 'id', description: 'Note ID' })
  @ApiQuery({ name: 'accountId', required: true, description: 'Account ID for ownership validation' })
  @ApiResponse({
    status: 204,
    description: 'Note deleted successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - portfolio does not belong to account',
  })
  @ApiResponse({
    status: 404,
    description: 'Note not found',
  })
  async deleteNote(
    @Param('id', ParseUUIDPipe) noteId: string,
    @Query('accountId') accountId: string,
  ): Promise<void> {
    if (!accountId) {
      throw new BadRequestException('accountId query parameter is required');
    }

    return this.noteService.deleteNote(noteId, accountId);
  }
}

