import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { FormLayout } from '@job-tracker/shared';
import { FormLayoutEntity } from './form-layout.entity';

@Injectable()
export class FormLayoutService {
  constructor(
    @InjectRepository(FormLayoutEntity)
    private readonly repository: Repository<FormLayoutEntity>
  ) {}

  /** An empty layout means "never customised" — the frontend falls back to its defaults. */
  async get(userId: string): Promise<FormLayout> {
    const row = await this.repository.findOne({ where: { userId } });
    return row?.layout ?? {};
  }

  async save(userId: string, layout: FormLayout): Promise<FormLayout> {
    await this.repository.save(
      this.repository.create({ userId, layout, updatedAt: new Date() })
    );

    return layout;
  }
}
