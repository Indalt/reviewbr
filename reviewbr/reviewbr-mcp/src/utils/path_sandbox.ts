/**
 * Path sandboxing utility.
 * Ensures file operations stay within an authorized base directory.
 * Prevents path traversal attacks and accidental writes outside of project dirs.
 */

import * as path from "node:path";

/**
 * Resolves a user-supplied path relative to a base directory,
 * and throws if the resolved path escapes the base.
 * 
 * @param base   The authorized root directory (absolute path)
 * @param input  User-supplied relative path or filename
 * @returns      The resolved, canonical absolute path
 * @throws       Error if the resolved path is outside the base directory
 */
export function sandboxedPath(base: string, input: string): string {
    const resolvedBase = path.resolve(base);
    const resolvedFull = path.resolve(resolvedBase, input);

    // Normalize both to ensure consistent separators
    const normalizedBase = resolvedBase.toLowerCase() + path.sep;
    const normalizedFull = resolvedFull.toLowerCase();

    if (!normalizedFull.startsWith(normalizedBase) && normalizedFull !== resolvedBase.toLowerCase()) {
        throw new Error(
            `🔒 PATH TRAVERSAL BLOQUEADO: O caminho "${input}" resolve para "${resolvedFull}", ` +
            `que está fora do diretório autorizado "${resolvedBase}".`
        );
    }

    return resolvedFull;
}
