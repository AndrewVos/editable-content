'use client';
import { defaultValue, type Value } from './schema';
import { resolveField, type FieldPath } from './path';
import { useEditablePage } from './react';
export function useEditableField(area: string, path: FieldPath) {
  const page = useEditablePage();
  if (!Object.hasOwn(page.schema, area)) throw new Error(`Unknown area: ${area}`);
  const resolved = resolveField(page.schema[area], page.document.locales[page.locale][area] as Value, path);
  return { ...resolved, setValue: (update: Value | ((current: Value) => Value)) => page.setField(area, path, update) };
}
export function useEditableList(area: string, path: FieldPath) {
  const { field, value, setValue } = useEditableField(area, path);
  if (field.type !== 'list') throw new Error('useEditableList requires a list field');
  const items = value as Value[];
  return { items, canAdd: field.max === undefined || items.length < field.max, canRemove: items.length > (field.min ?? 0),
    add: (item: Value = defaultValue(field.item)) => setValue(current => {
      const list = current as Value[];
      return field.max !== undefined && list.length >= field.max ? list : [...list, item];
    }),
    remove: (index: number) => setValue(current => { const list = current as Value[]; return list.length <= (field.min ?? 0) ? list : list.filter((_, i) => i !== index); }),
    move: (index: number, delta: -1 | 1) => setValue(current => {
      const list = [...current as Value[]];
      if (index < 0 || index >= list.length || index + delta < 0 || index + delta >= list.length) return current;
      [list[index], list[index + delta]] = [list[index + delta], list[index]]; return list;
    }),
  };
}
