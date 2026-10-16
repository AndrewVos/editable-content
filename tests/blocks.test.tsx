import { afterEach, expect, test } from 'bun:test';
import { act, cleanup, render } from '@testing-library/react';
import { createBlock, defineBlocks, defineSchema, field, validateField, validateDocument, EditablePage, RenderBlock, useEditableBlocks, useEditablePage, type BlockRenderers, type PageSnapshot } from '../src';
import { InlineText } from '../demo/editor/inline';
import { templates as demoTemplates, createStarterContent } from '../demo/blocks/templates';
afterEach(cleanup);
const templates = defineBlocks({
  text: { label: 'Text', schema: field.object('Text', { title: field.text('Title', { default: 'New text', required: true }) }) },
  grid: { label: 'Grid', schema: field.object('Grid', { columns: field.number('Columns', { default: 2, min: 1, max: 12, integer: true }), href: field.url('URL', { default: '/' }) }) },
});
const blockField = field.blocks('Blocks', templates, { min: 1, max: 3 });
const schema = defineSchema({ content: field.object('Content', { blocks: blockField }) });
function initial(): PageSnapshot<typeof schema> { return { revision: 'r1', document: { id: 'cms-page', schemaVersion: 1, locales: { en: { content: { blocks: [createBlock(templates, 'text')] } }, fr: { content: { blocks: [createBlock(templates, 'text')] } } } } }; }
let blocks: ReturnType<typeof useEditableBlocks<typeof templates>>;
let page: ReturnType<typeof useEditablePage>;
const renderers: BlockRenderers<typeof templates> = {
  text: ({ area, path }) => <InlineText area={area} path={[...path, 'title']} as="h2"/>,
  grid: ({ block }) => <div>{block.data.columns} columns</div>,
};
function Probe() { page = useEditablePage(); blocks = useEditableBlocks<typeof templates>('content', ['blocks']); return <>{blocks.items.map((block, index) => <RenderBlock key={block.id} renderers={renderers} block={block} area="content" path={['blocks', index, 'data']}/>)}</>; }
function mount(edit = true) { return render(<EditablePage schema={schema} initial={initial()} locale="en" locales={[{ code: 'en', label: 'English' }]} permissions={{ edit, publish: edit }}><Probe/></EditablePage>); }
test('creates independently editable defaults and rejects unknown templates', () => {
  const a = createBlock(templates, 'text'), b = createBlock(templates, 'text');
  expect(a.id).not.toBe(b.id); a.data.title = 'Changed'; expect(b.data.title).toBe('New text');
  expect(() => createBlock(templates, 'unknown' as 'text')).toThrow('Unknown block type');
  expect(validateField(blockField, [b])).toEqual([]);
});
test('validates allowed types, unique IDs, nested URLs and grid limits', () => {
  const grid = createBlock(templates, 'grid'); grid.data.columns = 13; grid.data.href = 'javascript:alert(1)';
  expect(validateField(blockField, [grid]).map(i => i.path)).toEqual(['Blocks[0].data.columns', 'Blocks[0].data.href']);
  expect(validateField(blockField, [{ ...grid, type: 'script' }])[0].message).toBe('Unknown block type');
  const text = createBlock(templates, 'text');
  expect(validateField(blockField, [text, text]).some(i => i.message === 'Unique block ID required')).toBe(true);
  expect(validateField(blockField, [{ ...text, layout: 'freeform' }]).some(i => i.message === 'Unknown block field')).toBe(true);
  expect(validateField(field.number('Columns', { integer: true }), 2.5)).toHaveLength(1);
});
test('inserts at a position, edits nested content, reorders and duplicates by ID', () => {
  const view = mount(); const firstId = blocks.items[0].id;
  act(() => { blocks.insert('grid', 0); });
  expect(blocks.items.map(b => b.type)).toEqual(['grid', 'text']);
  const gridId = blocks.items[0].id;
  act(() => { page.setField('content', ['blocks', 1, 'data', 'title'], 'Edited'); blocks.move(firstId, -1); });
  expect(blocks.items[0].id).toBe(firstId); expect(view.getByRole('button', { name: 'Edit Title' }).textContent).toBe('Edited');
  act(() => blocks.duplicate(firstId));
  expect(blocks.items).toHaveLength(3); expect(blocks.items[0].id).not.toBe(blocks.items[1].id);
  expect(blocks.items[1].data).toEqual({ title: 'Edited' });
  act(() => blocks.insert('grid')); expect(blocks.items).toHaveLength(3);
  act(() => blocks.remove(gridId)); expect(blocks.items).toHaveLength(2);
  expect(validateDocument(schema, page.document as PageSnapshot<typeof schema>['document'])).toEqual([]);
  expect(page.document.locales.fr.content).toMatchObject({ blocks: [{ data: { title: 'New text' } }] });
});
test('enforces minimum and reader permissions and protects block identity paths', () => {
  mount(); const id = blocks.items[0].id;
  act(() => blocks.remove(id)); expect(blocks.items).toHaveLength(1);
  expect(() => page.setField('content', ['blocks', 0, 'type'], 'grid')).toThrow('Invalid content path');
  cleanup(); mount(false);
  expect(blocks.canInsert).toBe(false);
  act(() => { blocks.insert('grid'); blocks.duplicate(blocks.items[0].id); blocks.remove(blocks.items[0].id); });
  expect(blocks.items).toHaveLength(1);
});
test('all demo templates have valid, independent defaults in each locale', () => {
  for (const type of Object.keys(demoTemplates) as (keyof typeof demoTemplates)[]) {
    const block = createBlock(demoTemplates, type);
    expect(validateField(field.blocks('Content', demoTemplates), [block])).toEqual([]);
  }
  for (const locale of ['en', 'fr', 'ar']) expect(validateField(field.blocks('Content', demoTemplates), createStarterContent(locale).blocks)).toEqual([]);
});
