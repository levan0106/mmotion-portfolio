// SnapshotModule Unit Tests for CR-006 Asset Snapshot System

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SnapshotModule } from './snapshot.module';
import { SnapshotService } from './services/snapshot.service';
import { SnapshotController } from './controllers/snapshot.controller';
import { SnapshotRepository } from './repositories/snapshot.repository';
import { AssetAllocationSnapshot } from './entities/asset-allocation-snapshot.entity';

describe('SnapshotModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [SnapshotModule],
    }).compile();
  });

  afterEach(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should provide SnapshotService', () => {
    const service = module.get<SnapshotService>(SnapshotService);
    expect(service).toBeDefined();
  });

  it('should provide SnapshotController', () => {
    const controller = module.get<SnapshotController>(SnapshotController);
    expect(controller).toBeDefined();
  });

  it('should provide SnapshotRepository', () => {
    const repository = module.get<SnapshotRepository>(SnapshotRepository);
    expect(repository).toBeDefined();
  });

  it('should provide AssetAllocationSnapshot repository token', () => {
    const repository = module.get(getRepositoryToken(AssetAllocationSnapshot));
    expect(repository).toBeDefined();
  });

  it('should have all required providers', () => {
    const providers = module.get('providers');
    expect(providers).toBeDefined();
  });

  it('should have all required controllers', () => {
    const controllers = module.get('controllers');
    expect(controllers).toBeDefined();
  });

  it('should have all required imports', () => {
    const imports = module.get('imports');
    expect(imports).toBeDefined();
  });
});
