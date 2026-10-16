export * from './path';
export * from './schema';
import { type Areas, type Schema, type ValidationIssue, validateField } from './schema';
export type Locale = { code: string; label: string; dir?: 'ltr' | 'rtl' };
export type PageDocument<S extends Schema = Schema> = {
  id: string;
  schemaVersion: number;
  locales: Record<string, Areas<S>>;
};
export type PageSnapshot<S extends Schema = Schema> = { document: PageDocument<S>; revision: string; publishedRevision?: string };
export type CommitRequest<S extends Schema = Schema> = { document: PageDocument<S>; expectedRevision: string };
/** Both operations must atomically commit the entire document, enforce authorization,
 * and reject stale expectedRevision values on the server. Publish includes unsaved edits. */
export type PageAdapter<S extends Schema = Schema> = {
  saveDraft(request: CommitRequest<S>): Promise<{ revision: string }>;
  publish(request: CommitRequest<S>): Promise<{ revision: string }>;
};
export function validateDocument<S extends Schema>(schema: S, document: PageDocument<S>): ValidationIssue[] {
  if (!document || typeof document !== 'object') return [{ path: 'document', message: 'Invalid document' }];
  const issues: ValidationIssue[] = [];
  if (typeof document.id !== 'string' || !document.id.trim()) issues.push({ path: 'id', message: 'Page ID is required' });
  if (!Number.isInteger(document.schemaVersion) || document.schemaVersion < 1) issues.push({ path: 'schemaVersion', message: 'Positive schema version required' });
  if (!document.locales || typeof document.locales !== 'object' || Array.isArray(document.locales) || !Object.keys(document.locales).length) return [...issues, { path: 'locales', message: 'At least one locale required' }];
  for (const [locale, areas] of Object.entries(document.locales)) {
    issues.push(...validateField({ type: 'object', label: 'Areas', fields: schema }, areas, locale));
  }
  return issues;
}
export class ContentValidationError extends Error {
  constructor(public issues: ValidationIssue[]) { super(issues.map(i => `${i.path}: ${i.message}`).join('\n')); this.name = 'ContentValidationError'; }
}
