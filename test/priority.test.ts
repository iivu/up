import path from 'node:path';
import { describe, it, expect } from 'vitest';

import { sortFilesByPriority } from '../src/sort.js';
import type { Config } from '../src/types.js';

const localPath = path.resolve('/project/dist');

function makeConfig(partial: Pick<Config, 'priority' | 'priorityLast'>): Config {
  return {
    host: 'test',
    username: 'test',
    password: 'test',
    remotePath: '/remote',
    localPath,
    ...partial,
  } as Config;
}

function toAbsolute(files: string[]): string[] {
  return files.map((file) => path.join(localPath, file));
}

function toRelative(files: string[]): string[] {
  return files.map((file) => path.relative(localPath, file));
}

describe('sortFilesByPriority', () => {
  it('puts html files last by default', () => {
    const files = toAbsolute(['index.html', 'app.js', 'style.css']);
    const sorted = sortFilesByPriority(files, makeConfig({ priorityLast: ['**/*.html'] }));
    expect(toRelative(sorted)).toEqual(['app.js', 'style.css', 'index.html']);
  });

  it('uploads priority files first', () => {
    const files = toAbsolute(['index.html', 'app.js', 'style.css', 'logo.png']);
    const sorted = sortFilesByPriority(
      files,
      makeConfig({ priority: ['**/*.js', '**/*.css'], priorityLast: ['**/*.html'] }),
    );
    expect(toRelative(sorted)).toEqual(['app.js', 'style.css', 'logo.png', 'index.html']);
  });

  it('keeps original order for files with the same priority', () => {
    const files = toAbsolute(['z.txt', 'a.txt', 'b.txt']);
    const sorted = sortFilesByPriority(files, makeConfig({}));
    expect(toRelative(sorted)).toEqual(['z.txt', 'a.txt', 'b.txt']);
  });

  it('supports nested paths', () => {
    const files = toAbsolute(['a/b/c.html', 'a/b/c.js', 'a/b/c.css']);
    const sorted = sortFilesByPriority(files, makeConfig({ priorityLast: ['**/*.html'] }));
    expect(toRelative(sorted)).toEqual(['a/b/c.js', 'a/b/c.css', 'a/b/c.html']);
  });

  it('respects the order of priorityLast patterns', () => {
    const files = toAbsolute(['a.json', 'b.html', 'c.js']);
    const sorted = sortFilesByPriority(files, makeConfig({ priorityLast: ['**/*.html', '**/*.json'] }));
    expect(toRelative(sorted)).toEqual(['c.js', 'b.html', 'a.json']);
  });

  it('makes priority take precedence over priorityLast', () => {
    const files = toAbsolute(['a.html', 'a.js']);
    const sorted = sortFilesByPriority(
      files,
      makeConfig({ priority: ['**/*.html'], priorityLast: ['**/*.html'] }),
    );
    expect(toRelative(sorted)).toEqual(['a.html', 'a.js']);
  });

  it('allows disabling priorityLast with an empty array', () => {
    const files = toAbsolute(['index.html', 'app.js']);
    const sorted = sortFilesByPriority(files, makeConfig({ priorityLast: [] }));
    expect(toRelative(sorted)).toEqual(['index.html', 'app.js']);
  });

  it('handles files outside priority and priorityLast', () => {
    const files = toAbsolute(['index.html', 'app.js', 'style.css', 'logo.png']);
    const sorted = sortFilesByPriority(
      files,
      makeConfig({ priority: ['**/*.js'], priorityLast: ['**/*.html'] }),
    );
    expect(toRelative(sorted)).toEqual(['app.js', 'style.css', 'logo.png', 'index.html']);
  });
});
