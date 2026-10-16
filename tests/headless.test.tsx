import { expect, test } from 'bun:test';
import { renderToString } from 'react-dom/server';
import * as api from '../src';
import manifest from '../package.json';

test('public entry points expose no demo UI or stylesheet', () => {
  for (const name of ['InlineText', 'InlineLink', 'InlineMedia', 'AreaEditor', 'EditAreaButton', 'EditorMessagesProvider']) {
    expect(name in api).toBe(false);
  }
  expect(Object.keys(manifest.exports)).toEqual(['.', './core']);
  expect(manifest.sideEffects).toBe(false);
});

test('headless field hooks render only consumer markup in edit mode', () => {
  const schema = api.defineSchema({ hero: api.field.object('Hero', { title: api.field.text('Title', { default: 'Hello' }) }) });
  function Consumer() {
    const { value } = api.useEditableField('hero', ['title']);
    return <h1 className="consumer-title">{String(value)}</h1>;
  }
  const html = renderToString(
    <api.EditablePage schema={schema}
      initial={{ document: { id: 'page', schemaVersion: 1, locales: { en: api.createAreas(schema) } }, revision: '1' }}
      locale="en" locales={[{ code: 'en', label: 'English' }]}
      permissions={{ edit: true, publish: true }}>
      <Consumer />
    </api.EditablePage>,
  );
  expect(html).toBe('<h1 class="consumer-title">Hello</h1>');
});
