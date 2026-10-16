import { EditAreaButton } from '../demo/editor/area-editor';
import { afterEach, describe, expect, test } from 'bun:test';
import { act, cleanup, render } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { EditablePage, useEditablePage, useEditableArea, ContentValidationError, createAreas, defaultValue, defineSchema, field, isSafeUrl, validateDocument, validateField, type PageAdapter, type PageSnapshot } from '../src';
afterEach(cleanup);
const schema = defineSchema({
  hero: field.object('Hero', { title: field.text('Title', { required: true, default: 'Hello' }) }),
  footer: field.object('Footer', { links: field.list('Links', field.object('Link', { label: field.text('Label', { required: true, default: 'Home' }), href: field.url('URL', { required: true, default: '/' }), icon: field.media('Icon') }), { min: 1, max: 2 }) }),
});
const initial = (): PageSnapshot<typeof schema> => ({ revision: 'r1', publishedRevision: 'r1', document: { id: 'cms-id', schemaVersion: 1, locales: { en: createAreas(schema), fr: createAreas(schema) } } });
let page: ReturnType<typeof useEditablePage>;
function Probe() { page = useEditablePage(); const hero = useEditableArea<typeof schema, 'hero'>('hero'); return <h1>{hero.value.title}</h1>; }
function mount(options: { adapter?: PageAdapter<typeof schema>; edit?: boolean; publish?: boolean } = {}) {
  return render(<EditablePage schema={schema} initial={initial()} locale="en" locales={[{ code: 'en', label: 'English' }, { code: 'fr', label: 'French' }]} permissions={{ edit: options.edit ?? true, publish: options.publish ?? true }} adapter={options.adapter}><Probe/></EditablePage>);
}
describe('schema boundaries', () => {
  test('nested defaults are independent and match the schema', () => {
    const content = initial();
    content.document.locales.en.footer.links[0].label = 'Changed';
    expect(content.document.locales.fr.footer.links[0].label).toBe('Home');
    expect(validateDocument(schema, content.document)).toEqual([]);
  });
  test('rejects unknown layout fields and invalid nested values', () => {
    const document = initial().document;
    Object.assign(document.locales.fr.footer, { className: 'hidden' });
    document.locales.fr.footer.links[0].href = 'javascript:alert(1)';
    expect(validateDocument(schema, document).map(i => i.path)).toEqual(['fr.footer.links[0].href', 'fr.footer.className']);
  });
  test('enforces list limits, text requirements, media and document shape', () => {
    expect(validateField(schema.footer.fields.links, []).length).toBe(1);
    expect(validateField(schema.hero, { title: '' }).length).toBe(1);
    expect(validateField(field.media('Icon'), { id: 'x', url: 'data:image/svg+xml,x', alt: '' }).length).toBe(1);
    expect(validateDocument(schema, { ...initial().document, locales: {} }).length).toBe(1);
    expect(defaultValue(field.media('Optional'))).toBeNull();
  });
  test('blocks script URLs, protocol-relative URLs and obfuscated schemes', () => {
    for (const url of ['javascript:alert(1)', '//evil.test', '/\\evil.test', 'java\nscript:x', 'data:text/html,x', 'file:///tmp/x']) expect(isSafeUrl(url)).toBe(false);
    for (const url of ['/about', '#footer', '?page=2', 'https://example.com', 'mailto:hi@example.com', 'tel:+123']) expect(isSafeUrl(url)).toBe(true);
    expect(isSafeUrl('mailto:x@example.com', true)).toBe(false);
  });
});
describe('page lifecycle', () => {
  test('publishes all areas and locales in one snapshot using the stable CMS id', async () => {
    let received: Parameters<PageAdapter<typeof schema>['publish']>[0] | undefined;
    mount({ adapter: { saveDraft: async () => ({ revision: 'r2' }), publish: async request => { received = request; return { revision: 'r2' }; } } });
    act(() => page.setArea('hero', { title: 'Updated' }));
    expect(page.dirty).toBe(true);
    await act(async () => { expect(await page.publish()).toBe(true); });
    expect(received?.document.id).toBe('cms-id');
    expect(received?.expectedRevision).toBe('r1');
    expect(received?.document.locales.en.hero.title).toBe('Updated');
    expect(received?.document.locales.fr.hero.title).toBe('Hello');
    expect(received?.document.locales.en.footer.links.length).toBe(1);
    expect(page.status).toBe('published'); expect(page.dirty).toBe(false);
  });
  test('drafts advance revision without changing publication state', async () => {
    const revisions: string[] = [];
    mount({ adapter: { saveDraft: async ({ expectedRevision }) => { revisions.push(expectedRevision); return { revision: 'r2' }; }, publish: async ({ expectedRevision }) => { revisions.push(expectedRevision); return { revision: 'r3' }; } } });
    act(() => page.setArea('hero', { title: 'Draft' }));
    await act(async () => { await page.saveDraft(); });
    expect(page.status).toBe('draft'); expect(page.dirty).toBe(false);
    await act(async () => { await page.publish(); });
    expect(revisions).toEqual(['r1', 'r2']); expect(page.status).toBe('published');
  });
  test('rejects invalid whole-page commits without calling the CMS', async () => {
    let called = false;
    mount({ adapter: { saveDraft: async () => { called = true; return { revision: 'r2' }; }, publish: async () => { called = true; return { revision: 'r2' }; } } });
    act(() => page.setArea('hero', { title: '' }));
    await act(async () => { expect(await page.publish()).toBe(false); });
    expect(called).toBe(false); expect(page.error).toContain('en.hero.title'); expect(page.dirty).toBe(true);
  });
  test('preserves edits on conflicts and permits retry', async () => {
    let reject = true;
    mount({ adapter: { saveDraft: async () => { if (reject) throw new Error('Revision conflict'); return { revision: 'r2' }; }, publish: async () => ({ revision: 'r3' }) } });
    act(() => page.setArea('hero', { title: 'Keep me' }));
    await act(async () => { expect(await page.saveDraft()).toBe(false); });
    expect(page.error).toBe('Revision conflict'); expect(page.busy).toBe(false); expect(page.dirty).toBe(true);
    reject = false;
    await act(async () => { expect(await page.saveDraft()).toBe(true); });
    expect(page.error).toBeNull();
  });
  test('locks duplicate commits and changes during in-flight saves', async () => {
    let resolve!: (value: { revision: string }) => void;
    let calls = 0;
    mount({ adapter: { saveDraft: () => { calls++; return new Promise(r => { resolve = r; }); }, publish: async () => ({ revision: 'r3' }) } });
    act(() => page.setArea('hero', { title: 'Snapshot' }));
    let pending!: Promise<boolean>;
    act(() => { pending = page.saveDraft(); });
    act(() => page.setArea('hero', { title: 'Race' }));
    await act(async () => { expect(await page.saveDraft()).toBe(false); resolve({ revision: 'r2' }); await pending; });
    expect(calls).toBe(1); expect(page.document.locales.en.hero).toEqual({ title: 'Snapshot' });
  });
  test('read-only and editor-only permissions are separate', async () => {
    mount({ edit: false });
    act(() => page.setArea('hero', { title: 'No' }));
    expect(page.document.locales.en.hero).toEqual({ title: 'Hello' });
    expect(await page.publish()).toBe(false);
    cleanup(); mount({ publish: false });
    expect(await page.publish()).toBe(false);
  });
  test('controlled locale switching retains edits in each locale', () => {
    const props = { schema, initial: initial(), locales: [{ code: 'en', label: 'English' }, { code: 'fr', label: 'French' }], permissions: { edit: true, publish: true } };
    const view = render(<EditablePage {...props} locale="en"><Probe/></EditablePage>);
    act(() => page.setArea('hero', { title: 'English draft' }));
    view.rerender(<EditablePage {...props} locale="fr"><Probe/></EditablePage>);
    expect(view.getByRole('heading').textContent).toBe('Hello');
    act(() => page.setArea('hero', { title: 'Bonjour' }));
    view.rerender(<EditablePage {...props} locale="en"><Probe/></EditablePage>);
    expect(view.getByRole('heading').textContent).toBe('English draft');
    expect(page.document.locales.fr.hero).toEqual({ title: 'Bonjour' });
  });
  test('read-only content renders on the server without editing buttons', () => {
    const html = renderToString(<EditablePage schema={schema} initial={initial()} locale="en" locales={[{ code: 'en', label: 'English' }]}><Probe/><EditAreaButton area="hero"/></EditablePage>);
    expect(html).toContain('<h1>Hello</h1>'); expect(html).not.toContain('<button');
    expect(new ContentValidationError([{ path: 'x', message: 'Required' }]).message).toBe('x: Required');
  });
});

describe('schema editor', () => {
  test('adds, reorders, and removes links without changing layout fields', async () => {
    const { AreaEditor } = await import('../demo/editor/area-editor');
    const { fireEvent } = await import('@testing-library/react');
    const view = render(<EditablePage schema={schema} initial={initial()} locale="en" locales={[{ code: 'en', label: 'English' }]} permissions={{ edit: true, publish: true }}><Probe/><AreaEditor/></EditablePage>);
    act(() => page.selectArea('footer'));
    fireEvent.click(view.getByRole('button', { name: '+ Add item' }));
    expect((page.document.locales.en.footer as { links: unknown[] }).links.length).toBe(2);
    expect(view.getByRole('button', { name: '+ Add item' }).hasAttribute('disabled')).toBe(true);
    fireEvent.change(view.getAllByRole('textbox', { name: 'Label *' })[1], { target: { value: 'Second' } });
    fireEvent.click(view.getByRole('button', { name: 'Move up Link 2' }));
    expect((page.document.locales.en.footer as { links: { label: string }[] }).links[0].label).toBe('Second');
    fireEvent.click(view.getAllByRole('button', { name: 'Remove' })[0]);
    expect((page.document.locales.en.footer as { links: { label: string }[] }).links[0].label).toBe('Home');
    expect(view.getByRole('button', { name: 'Remove' }).hasAttribute('disabled')).toBe(true);
  });
  test('passes CMS context to the media picker and preserves content on cancellation', async () => {
    const { AreaEditor } = await import('../demo/editor/area-editor');
    const { fireEvent } = await import('@testing-library/react');
    let request: unknown;
    let cancel = false;
    const view = render(<EditablePage schema={schema} initial={initial()} locale="en" locales={[{ code: 'en', label: 'English' }]} permissions={{ edit: true, publish: true }} pickMedia={async value => { request = value; return cancel ? null : { id: 'asset-1', url: '/icon.svg', alt: 'Leaf' }; }}><Probe/><AreaEditor/></EditablePage>);
    act(() => page.selectArea('footer'));
    await act(async () => { fireEvent.click(view.getByRole('button', { name: 'Choose image' })); });
    expect(request).toMatchObject({ pageId: 'cms-id', locale: 'en', areaId: 'footer', path: 'footer.links[0].icon', current: null });
    expect((view.getByRole('textbox', { name: 'Alternative text' }) as HTMLInputElement).value).toBe('Leaf');
    cancel = true;
    await act(async () => { fireEvent.click(view.getByRole('button', { name: 'Choose image' })); });
    expect((view.getByRole('textbox', { name: 'Alternative text' }) as HTMLInputElement).value).toBe('Leaf');
    fireEvent.click(view.getByRole('button', { name: 'Clear image' }));
    expect(view.queryByRole('textbox', { name: 'Alternative text' })).toBeNull();
  });
});
