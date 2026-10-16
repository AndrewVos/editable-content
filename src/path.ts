import type { Field, Value, ContentBlock } from './schema';
export type FieldPath = readonly (string | number)[];
/** Resolve only paths declared in the schema, including existing list positions. */
export function resolveField(field: Field, value: Value, path: FieldPath): { field: Field; value: Value } {
  for (const part of path) {
    if (field.type === 'object' && typeof part === 'string' && Object.hasOwn(field.fields, part)) {
      field = field.fields[part]; value = (value as Record<string, Value>)[part];
    } else if (field.type === 'blocks' && typeof part === 'number' && Number.isInteger(part) && Array.isArray(value) && part >= 0 && part < value.length) {
      const block = value[part] as ContentBlock;
      if (!Object.hasOwn(field.templates, block.type)) throw new Error(`Unknown block type: ${block.type}`);
      field = { type: 'object', label: field.templates[block.type].label, fields: { data: field.templates[block.type].schema } };
      value = block as Value;
    } else if (field.type === 'list' && typeof part === 'number' && Number.isInteger(part) && Array.isArray(value) && part >= 0 && part < value.length) {
      field = field.item; value = value[part];
    } else throw new Error(`Invalid content path: ${path.join('.')}`);
  }
  return { field, value };
}
export function replaceAt(value: Value, path: FieldPath, next: Value): Value {
  if (!path.length) return next;
  const [key, ...rest] = path;
  if (Array.isArray(value)) return value.map((item, i) => i === key ? replaceAt(item, rest, next) : item);
  return { ...(value as Record<string, Value>), [key]: replaceAt((value as Record<string, Value>)[key], rest, next) };
}
