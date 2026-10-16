export type Media = { id: string; url: string; alt: string };
type Base = { label: string };
export type TextField = Base & { type: 'text'; default?: string; required?: boolean; maxLength?: number; multiline?: boolean };
export type UrlField = Base & { type: 'url'; default?: string; required?: boolean };
export type MediaField = Base & { type: 'media'; default?: Media | null; required?: boolean; accept?: string };
export type ObjectField = Base & { type: 'object'; fields: Record<string, Field> };
export type ListField = Base & { type: 'list'; item: Field; min?: number; max?: number };
export type NumberField = Base & { type: 'number'; default?: number; min?: number; max?: number; integer?: boolean };
export type BlockTemplate = { label: string; description?: string; schema: ObjectField; initial?: Record<string, Value> };
export type BlockTemplates = Record<string, BlockTemplate>;
export type BlocksField = Base & { type: 'blocks'; templates: BlockTemplates; min?: number; max?: number };
export type ContentBlock<T extends BlockTemplates = BlockTemplates> = { [K in keyof T & string]: { id: string; type: K; data: Infer<T[K]['schema']> } }[keyof T & string];
export const defineBlocks = <const T extends BlockTemplates>(templates: T): T => templates;
export type Field = TextField | UrlField | MediaField | ObjectField | ListField | NumberField | BlocksField;
export type Schema = Record<string, ObjectField>;
export type Value = number | string | Media | null | { [key: string]: Value } | Value[];
export type Infer<F extends Field> = F extends NumberField ? number : F extends { type: 'blocks'; templates: infer T extends BlockTemplates } ? ContentBlock<T>[] : F extends TextField | UrlField ? string : F extends MediaField ? Media | null : F extends { type: 'object'; fields: infer P extends Record<string, Field> } ? { -readonly [K in keyof P]: Infer<P[K]> } : F extends { type: 'list'; item: infer I extends Field } ? Infer<I>[] : never;
export type Areas<S extends Schema> = { -readonly [K in keyof S]: Infer<S[K]> };
export const defineSchema = <const S extends Schema>(schema: S): S => schema;
export const field = {
  number: (label: string, options: Omit<NumberField, 'type' | 'label'> = {}): NumberField => ({ type: 'number', label, ...options }),
  blocks: <const T extends BlockTemplates>(label: string, templates: T, options: { min?: number; max?: number } = {}) => ({ type: 'blocks' as const, label, templates, ...options }),
  text: (label: string, options: Omit<TextField, 'type' | 'label'> = {}): TextField => ({ type: 'text', label, ...options }),
  url: (label: string, options: Omit<UrlField, 'type' | 'label'> = {}): UrlField => ({ type: 'url', label, ...options }),
  media: (label: string, options: Omit<MediaField, 'type' | 'label'> = {}): MediaField => ({ type: 'media', label, ...options }),
  object: <const P extends Record<string, Field>>(label: string, fields: P) => ({ type: 'object' as const, label, fields }),
  list: <const F extends Field>(label: string, item: F, options: { min?: number; max?: number } = {}) => ({ type: 'list' as const, label, item, ...options }),
};
export function defaultValue(f: Field): Value {
  switch (f.type) {
    case 'number': return f.default ?? f.min ?? 0;
    case 'blocks': return Array.from({ length: f.min ?? 0 }, () => createBlock(f.templates, Object.keys(f.templates)[0]));
    case 'object': return Object.fromEntries(Object.entries(f.fields).map(([key, child]) => [key, defaultValue(child)]));
    case 'list': return Array.from({ length: f.min ?? 0 }, () => defaultValue(f.item));
    case 'media': return f.default ? { ...f.default } : null;
    default: return f.default ?? '';
  }
}
/** Make an independent block instance. Templates and React renderers are separate. */
export function createBlock<T extends BlockTemplates, K extends keyof T & string>(templates: T, type: K): Extract<ContentBlock<T>, { type: K }> {
  if (!Object.hasOwn(templates, type)) throw new Error(`Unknown block type: ${type}`);
  const template = templates[type];
  const data = structuredClone(template.initial ?? defaultValue(template.schema));
  const issues = validateField(template.schema, data);
  if (issues.length) throw new Error(`Invalid block defaults: ${issues.map(i => i.message).join(', ')}`);
  return { id: crypto.randomUUID(), type, data } as Extract<ContentBlock<T>, { type: K }>;
}
export function createAreas<S extends Schema>(schema: S): Areas<S> {
  return Object.fromEntries(Object.entries(schema).map(([id, f]) => [id, defaultValue(f)])) as Areas<S>;
}
export function isSafeUrl(value: string, media = false): boolean {
  if (!value || /[\u0000-\u0020\u007f\\]/.test(value)) return false;
  if (/^\/(?!\/)|^#|^\?/.test(value)) return true;
  try { return (media ? ['https:', 'http:'] : ['https:', 'http:', 'mailto:', 'tel:']).includes(new URL(value).protocol); } catch { return false; }
}
export type ValidationIssue = { path: string; message: string };
export function validateField(f: Field, value: unknown, path = f.label): ValidationIssue[] {
  const error = (message: string) => [{ path, message }];
  switch (f.type) {
    case 'number':
      if (typeof value !== 'number' || !Number.isFinite(value)) return error('Must be a finite number');
      if (f.integer && !Number.isInteger(value)) return error('Must be a whole number');
      if (f.min !== undefined && value < f.min) return error(`Must be at least ${f.min}`);
      if (f.max !== undefined && value > f.max) return error(`Must be at most ${f.max}`);
      return [];
    case 'blocks': {
      if (!Array.isArray(value)) return error('Must be a block list');
      const issues: ValidationIssue[] = [];
      if (value.length < (f.min ?? 0)) issues.push(...error(`Add at least ${f.min} blocks`));
      if (f.max !== undefined && value.length > f.max) issues.push(...error(`Use at most ${f.max} blocks`));
      const ids = new Set<string>();
      value.forEach((block, index) => {
        const itemPath = `${path}[${index}]`;
        if (!block || typeof block !== 'object' || Array.isArray(block)) { issues.push({ path: itemPath, message: 'Invalid block' }); return; }
        if (typeof block.id !== 'string' || !block.id.trim() || ids.has(block.id)) issues.push({ path: `${itemPath}.id`, message: 'Unique block ID required' });
        ids.add(block.id);
        if (typeof block.type !== 'string' || !Object.hasOwn(f.templates, block.type)) { issues.push({ path: `${itemPath}.type`, message: 'Unknown block type' }); return; }
        issues.push(...validateField(f.templates[block.type].schema, block.data, `${itemPath}.data`));
        for (const key of Object.keys(block)) if (!['id', 'type', 'data'].includes(key)) issues.push({ path: `${itemPath}.${key}`, message: 'Unknown block field' });
      });
      return issues;
    }
    case 'text':
    case 'url':
      if (typeof value !== 'string') return error('Must be text');
      if (f.required && !value.trim()) return error('Required');
      if (f.type === 'text' && f.maxLength !== undefined && value.length > f.maxLength) return error(`Use at most ${f.maxLength} characters`);
      if (f.type === 'url' && value && !isSafeUrl(value)) return error('Use an http(s), mailto, tel, or site-relative URL');
      return [];
    case 'media': {
      if (value === null) return f.required ? error('Choose an image') : [];
      if (!value || typeof value !== 'object') return error('Invalid media');
      const m = value as Media;
      return typeof m.id === 'string' && typeof m.alt === 'string' && typeof m.url === 'string' && isSafeUrl(m.url, true) ? [] : error('Media needs an id, alt text and a safe URL');
    }
    case 'object':
      if (!value || typeof value !== 'object' || Array.isArray(value)) return error('Must be an object');
      return [
        ...Object.entries(f.fields).flatMap(([key, child]) => validateField(child, (value as Record<string, unknown>)[key], `${path}.${key}`)),
        ...Object.keys(value).filter(key => !Object.hasOwn(f.fields, key)).flatMap(key => [{ path: `${path}.${key}`, message: 'Unknown field' }]),
      ];
    case 'list':
      if (!Array.isArray(value)) return error('Must be a list');
      return [
        ...(value.length < (f.min ?? 0) ? error(`Add at least ${f.min} items`) : []),
        ...(f.max !== undefined && value.length > f.max ? error(`Use at most ${f.max} items`) : []),
        ...value.flatMap((item, index) => validateField(f.item, item, `${path}[${index}]`)),
      ];
  }
}
