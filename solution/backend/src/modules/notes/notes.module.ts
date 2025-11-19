import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Note } from './entities/note.entity';
import { Portfolio } from '../portfolio/entities/portfolio.entity';
import { Asset } from '../asset/entities/asset.entity';
import { NoteController } from './controllers/note.controller';
import { NoteService } from './services/note.service';
import { SharedModule } from '../shared/shared.module';

/**
 * Notes module for managing notes associated with portfolios and assets.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Note, Portfolio, Asset]),
    SharedModule,
  ],
  controllers: [NoteController],
  providers: [NoteService],
  exports: [NoteService, TypeOrmModule],
})
export class NotesModule {}

