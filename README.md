# react-editable-content

**Let editors change content directly on your React website, within boundaries you define.**

Make a footer editable, let someone replace a hero image through your CMS media picker, or offer a library of approved page sections. Your components keep control of the layout; schemas define which content can change.

The package is headless: it provides schemas, React hooks, page state, validation, and save/publish operations. You bring the markup, styling, editing controls, and CMS integration. There is no bundled CSS or UI framework.

- **Edit in place.** Connect your own text inputs, link controls, and image pickers to content fields.
- **Constrain content.** Define nested fields, list limits, and allowed block templates.
- **Publish a whole page.** Save every area and locale together under a stable CMS page ID, independent of its URL.
- **Keep your CMS.** Supply permissions, persistence, revisions, media selection, and language switching.

[Try the demo](#try-the-demo) · [React quickstart](#react-quickstart) · [Connect a CMS](#connect-a-cms) · [Page sections](#insertable-page-sections) · [API reference](#api-reference)

## Try the demo

From this repository, with Bun installed:

```sh
bun install
bun dev
```

- [Product page](http://localhost:3000) — interactive example and React snippets.
- [Playground](http://localhost:3000/demo) — inline text, links, images, responsive grids, a carousel, language switching, drafts, and publishing.

The demo uses React, Tailwind, and plain CSS. It stores content in your browser. Its templates and editing controls are examples you can copy and adapt; they are not shipped in the library.

This package is under development and is not published to npm yet. To use it in another local project, run `bun run build` and `bun pm pack`, then install the resulting tarball in that project. React 18+ is required. Bun runs this repository's tooling; consumers use the built ESM package with their own React setup.

## Deploy to GitHub Pages

Two workflows are included:

- [CI](.github/workflows/ci.yml) typechecks, tests, builds the library, and checks the static demo on pushes and pull requests.
- [GitHub Pages](.github/workflows/pages.yml) validates and deploys the demo on pushes to the repository's default branch. You can also run it manually from the Actions tab on that branch.

To enable deployment:

1. Push this repository to GitHub.
2. Open **Settings → Pages → Build and deployment**, and choose **GitHub Actions** as the source.
3. Run the **GitHub Pages** workflow, or push another commit to the default branch.

The workflow uses GitHub's configured base path, supporting project sites such as `https://username.github.io/editable-content/` and root/custom-domain sites. The playground is at `demo/` beneath that address. Images are served as static files; no Bun server runs on Pages.

Build the same output locally:

```sh
bun run build:demo
bun scripts/check-demo.ts

# Build for a repository subpath:
BASE_PATH=/editable-content/ bun run build:demo
BASE_PATH=/editable-content/ bun scripts/check-demo.ts
```

Serve `site-dist/` with any static HTTP server, mounted at the chosen base path. Both `index.html` and `demo/index.html` are generated, so direct playground links work without SPA fallback routing. This output is separate from the library's `dist/`.

Demo drafts and publishing remain local to each visitor's browser. Connect an external CMS backend for shared persistence.

## How content is organized

| Concept | Purpose | Example |
| --- | --- | --- |
| Page | One CMS document and commit boundary | `page-123` |
| Locale | A complete set of areas for one language | `en`, `fr` |
| Area | A named, schema-defined part of the page | `hero`, `footer` |
| Field path | A location inside an area | `['links', 0, 'label']` |
| Block | An instance of an approved section template | A grid with its own ID and data |

A document contains `{ id, schemaVersion, locales }`. A loaded snapshot adds `revision` and optionally `publishedRevision`. The CMS decides how these map to page names, routes, storage, and publication.

## React quickstart

This complete example makes a footer heading editable. Click it to type; blur or press Enter to finish. It needs no stylesheet or backend to try the editing interaction.

```tsx
import { useState } from 'react';
import {
  EditablePage,
  createAreas,
  defineSchema,
  field,
  useEditableField,
  useEditablePage,
  type PageSnapshot,
} from 'react-editable-content';

const schema = defineSchema({
  footer: field.object('Footer', {
    title: field.text('Title', {
      default: 'Stay in touch',
      required: true,
      maxLength: 80,
    }),
  }),
});

const initial: PageSnapshot<typeof schema> = {
  document: {
    id: 'page-123',
    schemaVersion: 1,
    locales: { en: createAreas(schema) },
  },
  revision: 'revision-1',
};

function FooterTitle() {
  const [editing, setEditing] = useState(false);
  const page = useEditablePage();
  const { value, setValue } = useEditableField('footer', ['title']);

  return (
    <h2>
      {page.canEdit && editing ? (
        <input
          autoFocus
          aria-label="Footer title"
          value={String(value)}
          disabled={page.busy}
          onChange={event => setValue(event.target.value)}
          onBlur={() => setEditing(false)}
          onKeyDown={event => {
            if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
              setEditing(false);
            }
          }}
        />
      ) : page.canEdit ? (
        <button disabled={page.busy} onClick={() => setEditing(true)}>
          {String(value)}
        </button>
      ) : String(value)}
    </h2>
  );
}

export default function App() {
  return (
    <EditablePage
      schema={schema}
      initial={initial}
      locale="en"
      locales={[{ code: 'en', label: 'English' }]}
      permissions={{ edit: true, publish: false }}
    >
      <footer><FooterTitle /></footer>
    </EditablePage>
  );
}
```

`EditablePage` adds no DOM. The button and input above belong to your app: replace them with your design system or use the [demo's inline controls](demo/editor/inline.tsx) as a starting point.

Changes enter page state immediately. Fields may be temporarily invalid while someone types; saving or publishing validates the entire document. Without an adapter, edits remain in memory and are lost on reload.

## Connect a CMS

Provide a `PageAdapter` to persist content. Both methods receive the entire document and its expected revision, and return a new revision after a successful commit.

```ts
import type { PageAdapter } from 'react-editable-content';

// `cms` is your application's persistence client.
const adapter: PageAdapter<typeof schema> = {
  async saveDraft({ document, expectedRevision }) {
    return cms.saveDraft(document.id, { document, expectedRevision });
  },
  async publish({ document, expectedRevision }) {
    return cms.publish(document.id, { document, expectedRevision });
  },
};
```

Pass `adapter={adapter}` to `EditablePage`, and render your toolbar inside the provider:

```tsx
function Toolbar() {
  const page = useEditablePage();

  return (
    <div aria-label="Page editing controls">
      <span>{page.dirty ? 'Unsaved changes' : page.status}</span>
      <button disabled={!page.canEdit || page.busy || !page.dirty}
        onClick={() => void page.saveDraft()}>
        Save draft
      </button>
      <button disabled={!page.canPublish || page.busy}
        onClick={() => void page.publish()}>
        Publish page
      </button>
      {page.error && <p role="alert">{page.error}</p>}
    </div>
  );
}
```

### Commit behavior

- **Save draft** commits all areas and locales, advancing the revision without publishing.
- **Publish** commits all areas and locales, including unsaved edits, and records the returned revision as published.
- Both operations validate first, lock mutations while in flight, and resolve to `true` on success or `false` on failure. Failures populate `page.error` and preserve local edits.
- The adapter must return a nonempty revision different from the previous one. Throw an error when the CMS rejects a commit, including a revision conflict.

Your backend must enforce permissions, validate the document, check `expectedRevision`, and commit atomically. Client permissions default to read-only and control editing behavior; they do not replace server authorization. Public visitors should receive the CMS's published snapshot.

The provider reads `initial` on mount. When loading another page or replacing the server snapshot, remount it using a key identifying that load. Changing the `initial` prop alone does not reset local edits.

## Define fields and editable lists

Import schema utilities from `react-editable-content/core` when React is unnecessary, including server-side validation.

| Field | Supported constraints and configuration |
| --- | --- |
| `field.text(label, options)` | `default`, `required`, `maxLength`, `multiline` |
| `field.url(label, options)` | `default`, `required`; validates supported URL formats |
| `field.media(label, options)` | `default`, `required`, `accept`; stores `{ id, url, alt }` or `null` |
| `field.number(label, options)` | `default`, `min`, `max`, `integer` |
| `field.object(label, fields)` | Declared child fields; rejects unknown keys |
| `field.list(label, item, options)` | Repeated items with `min` and `max` |
| `field.blocks(label, templates, options)` | Registered section types with `min` and `max` |

For example, add this field to your footer schema:

```ts
links: field.list('Links', field.object('Link', {
  label: field.text('Label', { default: 'New link', required: true }),
  href: field.url('Destination', { default: '/', required: true }),
  icon: field.media('Icon', { accept: 'image/*' }),
}), { max: 6 }),
```

Use `useEditableList('footer', ['links'])` to read `items` and call `add()`, `remove(index)`, or `move(index, -1 | 1)`. `add()` creates an item from schema defaults; you can also pass an explicit value. `canAdd` and `canRemove` reflect list limits, so combine them with `page.canEdit` and `!page.busy` for control states.

Edit a nested value with `useEditableField('footer', ['links', index, 'label'])`. Its `setValue` accepts either a value or an updater function. See the [demo footer](demo/app.tsx) for in-place labels, destinations, icons, and nearby list controls.

## Use your media picker

Set the provider's `pickMedia` callback to open your CMS modal. Your editing component calls `page.pickMedia(request)` and writes the selected asset to its field.

```ts
import type { Media, MediaPickerRequest } from 'react-editable-content';

async function pickMedia(request: MediaPickerRequest): Promise<Media | null> {
  const asset = await cms.openMediaPicker({
    selectedId: request.current?.id,
    accept: request.accept,
  });
  return asset ? { id: asset.id, url: asset.url, alt: asset.alt } : null;
}
```

The request includes `current`, optional `accept`, `pageId`, `locale`, `areaId`, and a string `path` such as `footer.links[0].icon`. Returning `null` means cancellation. The callback does not write content automatically.

The [demo image and link controls](demo/editor/inline.tsx) show the full interaction: invoke the picker, validate the returned asset, handle cancellation and errors, and ignore stale results after content or locale changes. Media uploads and asset storage remain with the CMS. The `accept` value is a picker hint, not file-content validation.

## Support multiple languages

Store each language under `document.locales`, then control the provider's `locale` and `onLocaleChange` props from your CMS UI. Initialize a locale's content before selecting it; the library does not create translations automatically.

Inside the provider, a language selector can use:

```tsx
function LanguageSelector() {
  const page = useEditablePage();
  return (
    <select aria-label="Language" value={page.locale}
      onChange={event => page.setLocale(event.target.value)}>
      {page.locales.map(locale => (
        <option key={locale.code} value={locale.code}>{locale.label}</option>
      ))}
    </select>
  );
}
```

Switching languages retains local edits. Saving and publishing include every locale, even those not currently visible.

Your app owns translated control labels and the HTML `lang` and `dir` attributes. Locale metadata supports `dir: 'ltr' | 'rtl'`. Use `formatValidationIssue(issue)` on the provider to translate validation errors. The demo includes English, French, and Arabic content, plus an optional [editor label provider](demo/editor/messages.tsx).

## Insertable page sections

Register the section schemas editors may insert, then supply a React renderer for each type. Templates describe data; renderers decide layout and interaction.

```tsx
import {
  defineBlocks, defineSchema, field, RenderBlock,
  useEditableBlocks, useEditableField, useEditablePage,
  type BlockRenderers,
} from 'react-editable-content';

const templates = defineBlocks({
  heading: {
    label: 'Heading',
    schema: field.object('Heading', {
      title: field.text('Title', { default: 'New heading' }),
    }),
  },
});

const schema = defineSchema({
  content: field.object('Content', {
    blocks: field.blocks('Sections', templates, { max: 12 }),
  }),
});

const renderers: BlockRenderers<typeof templates> = {
  heading: function Heading({ area, path }) {
    const page = useEditablePage();
    const { value, setValue } = useEditableField(area, [...path, 'title']);
    return page.canEdit
      ? <input aria-label="Heading" value={String(value)} disabled={page.busy}
          onChange={event => setValue(event.target.value)} />
      : <h2>{String(value)}</h2>;
  },
};

function Content() {
  const page = useEditablePage();
  const blocks = useEditableBlocks<typeof templates>('content', ['blocks']);
  return (
    <>
      {blocks.items.map((block, index) => (
        <RenderBlock key={block.id} block={block} area="content"
          path={['blocks', index, 'data']} renderers={renderers} />
      ))}
      {page.canEdit && (
        <button disabled={!blocks.canInsert} onClick={() => blocks.insert('heading')}>
          Add heading
        </button>
      )}
    </>
  );
}
```

Mount `Content` inside an `EditablePage` initialized with this schema. `RenderBlock` adds no wrapper markup. Each instance has an independent `id`, `type`, and `data`; use its stable ID as the React key and its current index in field paths.

The block hook provides `insert(type, index?)`, `remove(id)`, `move(id, -1 | 1)`, and `duplicate(id)`. Its capability flags include permissions, busy state, and limits. Duplicating creates independent data and a new ID. Field paths cannot edit a block's identity or type.

For complete consumer examples, explore the demo's [template schemas](demo/blocks/templates.ts), [responsive grid and carousel renderers](demo/blocks/renderers.tsx), and [template picker and section controls](demo/blocks/ContentArea.tsx). These use plain React and CSS.

## API reference

| API | Use it to… |
| --- | --- |
| `EditablePage` | Provide one page's content, CMS callbacks, locale, and permissions |
| `useEditablePage()` | Read page state; switch locale; save, publish, select areas, or update content |
| `useEditableArea(id)` | Read and replace an area, or select it with `edit()` |
| `EditableArea` | Access the area API through a render prop, without markup |
| `useEditableField(area, path)` | Read a field's schema and value; update its value |
| `useEditableList(area, path)` | Add, remove, and reorder list items |
| `useEditableBlocks(area, path)` | Insert, duplicate, remove, and reorder registered blocks |
| `RenderBlock` | Render a block using your component registry |
| `defineSchema`, `defineBlocks`, `field` | Define content boundaries and templates |
| `createAreas`, `defaultValue`, `createBlock` | Create independent initial content from defaults |
| `validateDocument`, `validateField` | Return validation issues for a document or field |
| `isSafeUrl` | Check a URL before rendering user-editable links or images |

`useEditablePage()` exposes `document`, `schema`, `locale`, `locales`, `canEdit`, `canPublish`, `dirty`, `status`, `busy`, and `error`; plus `setLocale`, `setArea`, `setField`, `saveDraft`, `publish`, `selectedArea`, `selectArea`, and optional `pickMedia`.

Core utilities and types are available from both the root entry and `/core`. React APIs are available from the root entry. TypeScript declarations are included.

## Example source and development

| Location | Contents |
| --- | --- |
| [src/](src/) | Distributed headless library |
| [demo/editor/](demo/editor/) | Inline controls, optional area editor, labels, and styles |
| [demo/blocks/](demo/blocks/) | Consumer-owned templates, renderers, and insertion UI |
| [demo/storage.ts](demo/storage.ts) | Browser storage adapter and demo migrations |
| [tests/](tests/) | Core behavior, demo interactions, and package-boundary tests |

```sh
bun run typecheck
bun test
bun run build
```

Builds clean `dist/` and generate ESM and TypeScript declarations. The package contains the built library, README, and package metadata; no demo components or styles are distributed.

If you used an earlier local version, `InlineText`, `InlineLink`, `InlineMedia`, `AreaEditor`, and `EditAreaButton` now live in `demo/editor/`. The `styles.css` export and provider `messages` prop were removed; demo labels use `EditorMessagesProvider` instead.
