import { basePath } from './urls';
import { createStarterContent } from './blocks/templates';
import { validateDocument, type PageAdapter, type PageSnapshot } from '../src/core';
import { initial, schema, introductionImage } from './content';
const KEY = 'editable-content-demo-v1' + (basePath === '/' ? '' : ':' + basePath);
type Stored = { draft: PageSnapshot<typeof schema>; published: PageSnapshot<typeof schema> };
export function load(): Stored {
  const raw = localStorage.getItem(KEY);
  if (!raw) return { draft: structuredClone(initial), published: structuredClone(initial) };
  const stored = JSON.parse(raw) as Stored;
  for (const snapshot of [stored.draft, stored.published]) {
    // Add the new media field without discarding any saved translations or edits.
    if (snapshot?.document?.schemaVersion === 1 && snapshot.document.locales) {
      for (const areas of Object.values(snapshot.document.locales)) {
        if (areas?.hero && !Object.hasOwn(areas.hero, 'image')) areas.hero.image = { ...introductionImage };
      }
      snapshot.document.schemaVersion = 2;
    }
    if (snapshot?.document?.schemaVersion === 2 && snapshot.document.locales) {
      for (const [locale, areas] of Object.entries(snapshot.document.locales)) {
        if (areas && !Object.hasOwn(areas, 'content')) areas.content = createStarterContent(locale);
      }
      snapshot.document.schemaVersion = 3;
    }
    if (!snapshot || snapshot.document?.id !== initial.document.id || snapshot.document.schemaVersion !== 3 || typeof snapshot.revision !== 'string' || validateDocument(schema, snapshot.document).length) throw new Error('Stored demo content is invalid. Clear the demo’s local storage to reset.');
  }
  return stored;
}
// Demo only: browser persistence, no server or authentication. A real CMS adapter
// must enforce authorization and perform revision checks in a database transaction.
export const adapter: PageAdapter<typeof schema> = Object.fromEntries(['saveDraft', 'publish'].map(action => [action, async ({ document, expectedRevision }: Parameters<PageAdapter<typeof schema>['publish']>[0]) => {
  const stored = load();
  if (stored.draft.revision !== expectedRevision) throw new Error('This page changed in another tab. Reload to get the latest draft.');
  const revision = crypto.randomUUID();
  const snapshot = { document, revision, publishedRevision: action === 'publish' ? revision : stored.draft.publishedRevision };
  stored.draft = snapshot;
  if (action === 'publish') stored.published = structuredClone(snapshot);
  localStorage.setItem(KEY, JSON.stringify(stored));
  return { revision };
}])) as PageAdapter<typeof schema>;
