'use client';
import type { ComponentType } from 'react';
import { createBlock, type BlockTemplates, type ContentBlock, type Value } from './schema';
import type { FieldPath } from './path';
import { useEditableField } from './fields';
import { useEditablePage } from './react';
/** A headless, schema-constrained ordered block area. Operations address stable IDs. */
export function useEditableBlocks<T extends BlockTemplates = BlockTemplates>(area: string, path: FieldPath) {
  const page = useEditablePage();
  const { field, value, setValue } = useEditableField(area, path);
  if (field.type !== 'blocks') throw new Error('useEditableBlocks requires a blocks field');
  const items = value as ContentBlock<T>[];
  const writable = page.canEdit && !page.busy;
  const hasRoom = (list: Value[]) => field.max === undefined || list.length < field.max;
  return {
    items, templates: field.templates as T,
    canInsert: writable && hasRoom(items as Value[]),
    canRemove: writable && items.length > (field.min ?? 0),
    insert(type: keyof T & string, at = items.length) {
      if (!writable) return;
      const block = createBlock(field.templates, type);
      setValue(current => { const list = [...current as Value[]]; if (!hasRoom(list)) return current; list.splice(Math.max(0, Math.min(at, list.length)), 0, block as Value); return list; });
      return block.id;
    },
    remove(id: string) { setValue(current => { const list = current as ContentBlock[]; return list.length <= (field.min ?? 0) ? current : list.filter(item => item.id !== id) as Value; }); },
    move(id: string, delta: -1 | 1) { setValue(current => { const list = [...current as ContentBlock[]]; const i = list.findIndex(item => item.id === id); if (i < 0 || i + delta < 0 || i + delta >= list.length) return current; [list[i], list[i + delta]] = [list[i + delta], list[i]]; return list as Value; }); },
    duplicate(id: string) { setValue(current => { const list = [...current as ContentBlock[]]; const i = list.findIndex(item => item.id === id); if (i < 0 || !hasRoom(list as Value[])) return current; list.splice(i + 1, 0, { ...structuredClone(list[i]), id: crypto.randomUUID() }); return list as Value; }); },
  };
}
export type BlockRenderProps<B = ContentBlock> = { block: B; area: string; path: FieldPath };
export type BlockRenderers<T extends BlockTemplates> = { [K in keyof T & string]: ComponentType<BlockRenderProps<Extract<ContentBlock<T>, { type: K }>>> };
/** Renderers are supplied by the consumer; no templates or design system are bundled. */
export function RenderBlock<T extends BlockTemplates>({ block, renderers, area, path }: BlockRenderProps<ContentBlock<T>> & { renderers: BlockRenderers<T> }) {
  const Component = renderers[block.type] as ComponentType<BlockRenderProps<ContentBlock<T>>>;
  if (!Component) throw new Error(`Missing renderer for block: ${block.type}`);
  return <Component block={block} area={area} path={path}/>;
}
