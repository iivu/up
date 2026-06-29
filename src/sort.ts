import path from 'node:path';
import { minimatch } from 'minimatch';

import * as t from './types.js';

/**
 * Sort files so that files matching `priority` patterns are uploaded first,
 * files matching `priorityLast` patterns are uploaded last, and all other
 * files keep their original order in between.
 */
export function sortFilesByPriority(files: string[], config: t.Config): string[] {
  const priority = config.priority ?? [];
  const priorityLast = config.priorityLast ?? [];

  const getPatternIndex = (file: string, patterns: string[]): number => {
    const relativePath = path.relative(config.localPath, file);
    const posixRelativePath = relativePath.split(path.sep).join(path.posix.sep);
    for (let i = 0; i < patterns.length; i++) {
      if (minimatch(posixRelativePath, patterns[i])) return i;
    }
    return -1;
  };

  const indexedFiles = files.map((file, index) => ({
    file,
    index,
    priorityIndex: getPatternIndex(file, priority),
    priorityLastIndex: getPatternIndex(file, priorityLast),
  }));

  indexedFiles.sort((a, b) => {
    // Both files match a priority pattern: preserve the configured order.
    if (a.priorityIndex !== -1 && b.priorityIndex !== -1) {
      return a.priorityIndex - b.priorityIndex;
    }
    // Only one matches a priority pattern: it goes first.
    if (a.priorityIndex !== -1) return -1;
    if (b.priorityIndex !== -1) return 1;

    // Both files match a priorityLast pattern: preserve the configured order.
    if (a.priorityLastIndex !== -1 && b.priorityLastIndex !== -1) {
      return a.priorityLastIndex - b.priorityLastIndex;
    }
    // Only one matches a priorityLast pattern: it goes last.
    if (a.priorityLastIndex !== -1) return 1;
    if (b.priorityLastIndex !== -1) return -1;

    // Neither matches: keep the original traversal order.
    return a.index - b.index;
  });

  return indexedFiles.map((item) => item.file);
}
