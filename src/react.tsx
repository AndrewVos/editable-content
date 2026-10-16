'use client';
import { createContext, useContext, useRef, useState, type ReactNode } from 'react';
import { ContentValidationError, validateDocument, type Locale, type PageAdapter, type PageDocument, type PageSnapshot } from './core';
import { type Areas, type Media, type Schema, type ValidationIssue, type Value } from './schema';
import { resolveField, replaceAt, type FieldPath } from './path';
export type MediaPickerRequest = { current: Media | null; accept?: string; pageId: string; locale: string; areaId: string; path: string };
export type EditablePageProps<S extends Schema> = {
  schema: S; initial: PageSnapshot<S>; locale: string; locales: Locale[];
  onLocaleChange?: (locale: string) => void;
  permissions?: { edit: boolean; publish: boolean };
  adapter?: PageAdapter<S>;
  pickMedia?: (request: MediaPickerRequest) => Promise<Media | null>;
  formatValidationIssue?: (issue: ValidationIssue) => string;
  children: ReactNode;
};
type EditorContext = {
  schema: Schema; document: PageDocument; locale: string; locales: Locale[];
  canEdit: boolean; canPublish: boolean; dirty: boolean; status: 'draft' | 'published';
  busy: boolean; error: string | null;
  selectedArea: string | null; selectArea: (area: string | null) => void;
  setLocale: (locale: string) => void; setArea: (id: string, value: unknown) => void;
  setField: (id: string, path: FieldPath, update: Value | ((current: Value) => Value)) => void;
  saveDraft: () => Promise<boolean>; publish: () => Promise<boolean>;
  pickMedia?: EditablePageProps<Schema>['pickMedia'];
};
const Context = createContext<EditorContext | null>(null);
/** Remount with key={pageId} when loading a different page or server snapshot. */
export function EditablePage<S extends Schema>(props: EditablePageProps<S>) {
  // Schema values may temporarily be invalid while typing; commits validate the whole page.
  const [document, setDocument] = useState(props.initial.document);
  const documentRef = useRef(document);
  const [saved, setSaved] = useState(() => JSON.stringify(props.initial.document));
  const revision = useRef(props.initial.revision);
  const [publishedRevision, setPublishedRevision] = useState(props.initial.publishedRevision);
  const [busy, setBusy] = useState(false);
  const locked = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedArea, selectArea] = useState<string | null>(null);
  const canEdit = !!props.permissions?.edit;
  const dirty = JSON.stringify(document) !== saved;
  if (!Object.hasOwn(document.locales, props.locale)) throw new Error(`Missing locale "${props.locale}". Initialize it in the CMS before editing.`);
  const setArea = (id: string, value: unknown) => {
    if (!canEdit || locked.current) return;
    if (!Object.hasOwn(props.schema, id)) throw new Error(`Unknown area: ${id}`);
    const next = { ...documentRef.current, locales: { ...documentRef.current.locales, [props.locale]: { ...documentRef.current.locales[props.locale], [id]: value } } } as PageDocument<S>;
    documentRef.current = next;
    setDocument(next);
    setError(null);
  };
  const setField: EditorContext['setField'] = (id, path, update) => {
    if (!canEdit || locked.current) return;
    if (!Object.hasOwn(props.schema, id)) throw new Error(`Unknown area: ${id}`);
    const area = documentRef.current.locales[props.locale][id] as Value;
    const current = resolveField(props.schema[id], area, path).value;
    setArea(id, replaceAt(area, path, typeof update === 'function' ? update(current) : update));
  };
  const commit = async (action: 'saveDraft' | 'publish'): Promise<boolean> => {
    if (!canEdit || (action === 'publish' && !props.permissions?.publish) || locked.current) return false;
    locked.current = true;
    setBusy(true); setError(null);
    try {
      if (!props.adapter) throw new Error('No page adapter configured');
      const snapshot = structuredClone(documentRef.current);
      const issues = validateDocument(props.schema, snapshot);
      if (issues.length) {
        if (props.formatValidationIssue) throw new Error(issues.map(props.formatValidationIssue).join('\n'));
        throw new ContentValidationError(issues);
      }
      const result = await props.adapter[action]({ document: snapshot, expectedRevision: revision.current });
      if (!result.revision || result.revision === revision.current) throw new Error('Adapter must return a new revision');
      revision.current = result.revision;
      setSaved(JSON.stringify(snapshot));
      if (action === 'publish') setPublishedRevision(result.revision);
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
      return false;
    } finally { locked.current = false; setBusy(false); }
  };
  const value: EditorContext = {
    schema: props.schema, document: document as PageDocument, locale: props.locale, locales: props.locales,
    canEdit, canPublish: canEdit && !!props.permissions?.publish, dirty,
    status: !dirty && revision.current === publishedRevision ? 'published' : 'draft', busy, error,
    selectedArea: canEdit ? selectedArea : null, selectArea,
    setLocale: code => { if (props.locales.some(l => l.code === code) && Object.hasOwn(document.locales, code)) { selectArea(null); props.onLocaleChange?.(code); } },
    setArea, setField, saveDraft: () => commit('saveDraft'), publish: () => commit('publish'), pickMedia: props.pickMedia,
  };
  return <Context.Provider value={value}>{props.children}</Context.Provider>;
}
export function useEditablePage() {
  const context = useContext(Context);
  if (!context) throw new Error('Use within <EditablePage>');
  return context;
}
export function useEditableArea<S extends Schema, K extends keyof S & string>(id: K) {
  const page = useEditablePage();
  if (!Object.hasOwn(page.schema, id)) throw new Error(`Unknown editable area: ${id}`);
  return { value: page.document.locales[page.locale][id] as Areas<S>[K], setValue: (value: Areas<S>[K]) => page.setArea(id, value), edit: () => page.selectArea(id) };
}
/** Render prop keeps every HTML element, class and layout under the site's control. */
export function EditableArea<S extends Schema, K extends keyof S & string>({ id, children }: { id: K; children: (area: ReturnType<typeof useEditableArea<S, K>>) => ReactNode }) {
  return children(useEditableArea<S, K>(id));
}
