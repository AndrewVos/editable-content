import { afterEach, expect, test } from 'bun:test';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { EditablePage, useEditablePage, useEditableList, defineSchema, field, resolveField, type PageSnapshot } from '../src';
import { InlineText, InlineLink } from '../demo/editor/inline';
afterEach(cleanup);
const schema = defineSchema({ footer: field.object('Footer', { title: field.text('Title'), links: field.list('Links', field.object('Link', { label: field.text('Label'), href: field.url('URL'), icon: field.media('Icon') }), { min: 1, max: 2 }) }) });
const initial = (): PageSnapshot<typeof schema> => ({ revision: 'r1', document: { id: 'page-1', schemaVersion: 1, locales: { en: { footer: { title: 'Hello', links: [{ label: 'Home', href: '/home', icon: null }] } }, fr: { footer: { title: 'Bonjour', links: [{ label: 'Accueil', href: '/fr', icon: null }] } } } } });
let page: ReturnType<typeof useEditablePage>;
function Content() { page = useEditablePage(); const links = useEditableList('footer', ['links']); return <><InlineText area="footer" path={['title']} as="h2"/>{links.items.map((_, i) => <InlineLink key={i} area="footer" path={['links', i]} canRemove={links.canRemove} onRemove={() => links.remove(i)}/>)}<button onClick={() => links.add({ label: 'Extra', href: '/', icon: null })}>Add</button></>; }
const locales = [{ code: 'en', label: 'English' }, { code: 'fr', label: 'Français' }];
test('inline text updates immediately, Escape restores the starting value', () => {
  const view = render(<EditablePage schema={schema} initial={initial()} locale="en" locales={locales} permissions={{ edit: true, publish: true }}><Content/></EditablePage>);
  fireEvent.click(view.getByRole('button', { name: 'Edit Title' }));
  fireEvent.change(view.getByRole('textbox', { name: 'Title' }), { target: { value: 'Typed live' } });
  expect(page.document.locales.en.footer).toMatchObject({ title: 'Typed live' }); expect(page.dirty).toBe(true);
  fireEvent.keyDown(view.getByRole('textbox', { name: 'Title' }), { key: 'Escape' });
  expect(page.document.locales.en.footer).toMatchObject({ title: 'Hello' });
  expect(view.queryByRole('textbox')).toBeNull();
});
test('link click prevents navigation and exposes adjacent editable fields', () => {
  const view = render(<EditablePage schema={schema} initial={initial()} locale="en" locales={locales} permissions={{ edit: true, publish: true }}><Content/></EditablePage>);
  expect(fireEvent.click(view.getByRole('link', { name: 'Edit Home' }))).toBe(false);
  fireEvent.change(view.getByRole('textbox', { name: 'Label' }), { target: { value: 'About' } });
  fireEvent.change(view.getByRole('textbox', { name: 'Destination' }), { target: { value: '/about' } });
  expect(page.document.locales.en.footer).toMatchObject({ links: [{ label: 'About', href: '/about' }] });
  expect(view.getByRole('button', { name: 'Remove' }).hasAttribute('disabled')).toBe(true);
  fireEvent.click(view.getByRole('button', { name: 'Done ✓' }));
  expect(view.getByRole('link', { name: 'Edit About' }).getAttribute('href')).toBe('/about');
});
test('field patches use latest content and cannot address undeclared layout fields', () => {
  render(<EditablePage schema={schema} initial={initial()} locale="en" locales={locales} permissions={{ edit: true, publish: true }}><Content/></EditablePage>);
  act(() => { page.setField('footer', ['title'], 'A'); page.setField('footer', ['links', 0, 'label'], 'B'); });
  expect(page.document.locales.en.footer).toMatchObject({ title: 'A', links: [{ label: 'B' }] });
  expect(() => page.setField('footer', ['className'], 'hidden')).toThrow('Invalid content path');
  expect(() => resolveField(schema.footer, initial().document.locales.en.footer, ['links', -1])).toThrow();
});
test('changing locales closes inline editors without losing edits', () => {
  const props = { schema, initial: initial(), locales, permissions: { edit: true, publish: true } };
  const view = render(<EditablePage {...props} locale="en"><Content/></EditablePage>);
  fireEvent.click(view.getByRole('button', { name: 'Edit Title' }));
  fireEvent.change(view.getByRole('textbox', { name: 'Title' }), { target: { value: 'English draft' } });
  view.rerender(<EditablePage {...props} locale="fr"><Content/></EditablePage>);
  expect(view.queryByRole('textbox')).toBeNull();
  expect(view.getByRole('button', { name: 'Edit Title' }).textContent).toBe('Bonjour');
  expect(page.document.locales.en.footer).toMatchObject({ title: 'English draft' });
});
test('read-only links retain navigation and text has no edit controls', () => {
  const view = render(<EditablePage schema={schema} initial={initial()} locale="en" locales={locales}><Content/></EditablePage>);
  expect(view.getByRole('link', { name: 'Home' }).getAttribute('href')).toBe('/home');
  expect(view.queryByRole('button', { name: 'Edit Title' })).toBeNull();
  expect(view.queryByRole('textbox')).toBeNull();
});
test('media hook receives the exact inline path and inserts the icon', async () => {
  let request: unknown;
  const view = render(<EditablePage schema={schema} initial={initial()} locale="en" locales={locales} permissions={{ edit: true, publish: true }} pickMedia={async value => { request = value; return { id: 'leaf', url: '/leaf.svg', alt: 'Leaf' }; }}><Content/></EditablePage>);
  fireEvent.click(view.getByRole('link', { name: 'Edit Home' }));
  await act(async () => { fireEvent.click(view.getByRole('button', { name: 'Choose image' })); });
  expect(request).toMatchObject({ pageId: 'page-1', locale: 'en', areaId: 'footer', path: 'footer.links[0].icon' });
  expect(view.getByRole('img', { name: 'Leaf' }).getAttribute('src')).toBe('/leaf.svg');
});
test('a delayed media result cannot overwrite a list changed while the picker was open', async () => {
  let resolve!: (media: { id: string; url: string; alt: string }) => void;
  const view = render(<EditablePage schema={schema} initial={initial()} locale="en" locales={locales} permissions={{ edit: true, publish: true }} pickMedia={() => new Promise(r => { resolve = r; })}><Content/></EditablePage>);
  fireEvent.click(view.getByRole('link', { name: 'Edit Home' }));
  fireEvent.click(view.getByRole('button', { name: 'Choose image' }));
  act(() => page.setField('footer', ['links', 0, 'label'], 'Changed elsewhere'));
  await act(async () => { resolve({ id: 'leaf', url: '/leaf.svg', alt: 'Leaf' }); });
  expect(view.getByRole('alert').textContent).toContain('Content changed');
  expect(page.document.locales.en.footer).toMatchObject({ links: [{ icon: null, label: 'Changed elsewhere' }] });
});

test('inline media replaces the image through the CMS picker and is read-only in preview', async () => {
  const { InlineMedia } = await import('../demo/editor/inline');
  const mediaSchema = defineSchema({ hero: field.object('Hero', { image: field.media('Introduction image') }) });
  const snapshot: PageSnapshot<typeof mediaSchema> = { revision: 'r1', document: { id: 'image-page', schemaVersion: 1, locales: { en: { hero: { image: { id: 'old', url: '/old.svg', alt: 'Original' } } } } } };
  let request: unknown;
  const props = { schema: mediaSchema, initial: snapshot, locale: 'en', locales, pickMedia: async (value: unknown) => { request = value; return { id: 'new', url: '/new.svg', alt: 'Replacement' }; } };
  const view = render(<EditablePage {...props} permissions={{ edit: true, publish: true }}><InlineMedia area="hero" path={['image']}/></EditablePage>);
  await act(async () => { fireEvent.click(view.getByRole('button', { name: 'Choose image: Introduction image' })); });
  expect(request).toMatchObject({ pageId: 'image-page', locale: 'en', areaId: 'hero', path: 'hero.image', current: { id: 'old' } });
  expect(view.getByRole('img', { name: 'Replacement' }).getAttribute('src')).toBe('/new.svg');
  fireEvent.change(view.getByRole('textbox', { name: 'Alternative text' }), { target: { value: 'Localized alt' } });
  view.rerender(<EditablePage {...props}><InlineMedia area="hero" path={['image']}/></EditablePage>);
  expect(view.queryByRole('button')).toBeNull();
  expect(view.getByRole('img', { name: 'Localized alt' }).getAttribute('src')).toBe('/new.svg');
});
