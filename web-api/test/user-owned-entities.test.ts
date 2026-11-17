import 'reflect-metadata';
import { readdirSync } from 'node:fs';
import path from 'node:path';
import { getMetadataArgsStorage } from 'typeorm';
import { beforeAll, describe, expect, it } from 'vitest';
import { USER_OWNED_ENTITIES } from '../src/account/user-owned-entities';

const SRC = path.resolve(__dirname, '../src');

function entityFiles(): string[] {
  return readdirSync(SRC, { recursive: true, encoding: 'utf8' })
    .filter((file) => file.endsWith('.entity.ts'))
    .map((file) => path.join(SRC, file));
}

describe('USER_OWNED_ENTITIES', () => {
  beforeAll(async () => {
    for (const file of entityFiles()) {
      await import(file);
    }
  });

  it('lists every entity with a user_id column', () => {
    const owned = new Set(
      getMetadataArgsStorage()
        .columns.filter((column) => column.options.name === 'user_id')
        .map((column) => column.target)
    );

    const missing = [...owned]
      .filter((target) => !USER_OWNED_ENTITIES.includes(target as never))
      .map((target) => (target as { name: string }).name);

    expect(missing).toEqual([]);
    expect(owned.size).toBe(USER_OWNED_ENTITIES.length);
  });

  it('deletes a row before the rows it points at', () => {
    const position = (target: unknown) =>
      USER_OWNED_ENTITIES.indexOf(target as never);

    const outOfOrder = getMetadataArgsStorage()
      .relations.filter((relation) => relation.relationType === 'many-to-one')
      .map((relation) => ({
        from: relation.target,
        to: (relation.type as () => unknown)()
      }))
      .filter(
        ({ from, to }) =>
          position(from) >= 0 &&
          position(to) >= 0 &&
          position(from) > position(to)
      )
      .map(
        ({ from, to }) =>
          `${(from as { name: string }).name} → ${(to as { name: string }).name}`
      );

    expect(outOfOrder).toEqual([]);
  });
});
