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
    const storage = getMetadataArgsStorage();
    // Per table, with inherited columns: the taxonomies get `user_id` from a base class.
    type Target = (typeof storage.tables)[number]['target'];
    const lineage = (target: Target): Target[] => {
      const chain: Target[] = [];
      for (
        let current: unknown = target;
        typeof current === 'function' && current !== Function.prototype;
        current = Object.getPrototypeOf(current)
      ) {
        chain.push(current as Target);
      }
      return chain;
    };
    const owned = new Set(
      storage.tables
        .map((table) => table.target)
        .filter((target) =>
          storage
            .filterColumns(lineage(target))
            .some((column) => column.options.name === 'user_id')
        )
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
