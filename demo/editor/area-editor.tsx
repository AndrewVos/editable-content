'use client';
import { useEffect, useId, useRef, useState } from 'react';
import { defaultValue, isSafeUrl, type Field, type Media, type Value } from '../../src';
import { useDemoEditor } from './messages';
function FieldEditor({ field, value, onChange, path, areaId, setPicking }: { field: Field; value: Value; onChange: (value: Value) => void; path: string; areaId: string; setPicking: (busy: boolean) => void }) {
  const page = useDemoEditor();
  const id = useId();
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  if (field.type === 'number') return <label className="ec-field" htmlFor={id}>{field.label}<input id={id} type="number" value={value as number} min={field.min} max={field.max} step={field.integer ? 1 : 'any'} onChange={e => onChange(e.target.valueAsNumber)} /></label>;
  if (field.type === 'blocks') return <p>{field.label}: edit these blocks directly on the page.</p>;
  if (field.type === 'object') {
    const object = value as Record<string, Value>;
    return <div className="ec-object">{Object.entries(field.fields).map(([key, child]) => <FieldEditor key={key} field={child} value={object[key]} path={`${path}.${key}`} areaId={areaId} setPicking={setPicking} onChange={next => onChange({ ...object, [key]: next })} />)}</div>;
  }
  if (field.type === 'list') {
    const items = value as Value[];
    const move = (index: number, delta: number) => { const next = [...items]; [next[index], next[index + delta]] = [next[index + delta], next[index]]; onChange(next); };
    return <fieldset className="ec-list"><legend>{field.label} <span>({items.length}{field.max !== undefined ? ` / ${field.max}` : ''})</span></legend>
      {items.map((item, index) => <div className="ec-list-item" key={index}>
        <div className="ec-list-actions"><span>{field.item.label} {index + 1}</span><div>
          <button type="button" aria-label={`${page.messages.moveUp} ${field.item.label} ${index + 1}`} disabled={index === 0} onClick={() => move(index, -1)}>↑</button>
          <button type="button" aria-label={`${page.messages.moveDown} ${field.item.label} ${index + 1}`} disabled={index === items.length - 1} onClick={() => move(index, 1)}>↓</button>
          <button type="button" disabled={items.length <= (field.min ?? 0)} onClick={() => onChange(items.filter((_, i) => i !== index))}>{page.messages.remove}</button>
        </div></div>
        <FieldEditor field={field.item} value={item} path={`${path}[${index}]`} areaId={areaId} setPicking={setPicking} onChange={next => onChange(items.map((old, i) => i === index ? next : old))} />
      </div>)}
      <button className="ec-add" type="button" disabled={field.max !== undefined && items.length >= field.max} onClick={() => onChange([...items, defaultValue(field.item)])}>+ {page.messages.add}</button>
    </fieldset>;
  }
  if (field.type === 'media') {
    const media = value as Media | null;
    const choose = async () => {
      if (!page.pickMedia) return;
      setPicking(true); setError(null);
      try {
        const picked = await page.pickMedia({ current: media, accept: field.accept, pageId: page.document.id, locale: page.locale, areaId, path });
        if (mounted.current && picked) {
          if (!isSafeUrl(picked.url, true)) throw new Error('The media picker returned an unsafe URL');
          onChange(picked);
        }
      } catch (cause) { if (mounted.current) setError(cause instanceof Error ? cause.message : String(cause)); }
      finally { if (mounted.current) setPicking(false); }
    };
    return <div className="ec-field"><span className="ec-label">{field.label}</span><div className="ec-media">
      {media && isSafeUrl(media.url, true) ? <img src={media.url} alt={media.alt} /> : null}
      <button type="button" onClick={choose} disabled={!page.pickMedia}>{page.messages.chooseMedia}</button>
      {media ? <button type="button" onClick={() => onChange(null)}>{page.messages.clearMedia}</button> : null}
    </div>{!page.pickMedia ? <small>{page.messages.noMediaPicker}</small> : null}
      {media ? <label htmlFor={id}>{page.messages.altText}<input id={id} value={media.alt} onChange={e => onChange({ ...media, alt: e.target.value })} /></label> : null}
      {error ? <p role="alert">{error}</p> : null}
    </div>;
  }
  return <label className="ec-field" htmlFor={id}><span>{field.label}{field.required ? ' *' : ''}</span>
    {field.type === 'text' && field.multiline ? <textarea id={id} value={value as string} maxLength={field.maxLength} required={field.required} onChange={e => onChange(e.target.value)} rows={3} /> :
      <input id={id} type="text" inputMode={field.type === 'url' ? 'url' : 'text'} value={value as string} maxLength={field.type === 'text' ? field.maxLength : undefined} required={field.required} onChange={e => onChange(e.target.value)} />}
  </label>;
}
function AreaDialog({ areaId }: { areaId: string }) {
  const page = useDemoEditor();
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [picking, setPicking] = useState(false);
  useEffect(() => { const node = dialog.current!; node.showModal(); return () => node.close(); }, []);
  return <dialog ref={dialog} className="ec-dialog" aria-labelledby={titleId} dir={page.locales.find(l => l.code === page.locale)?.dir ?? 'ltr'} onCancel={e => { e.preventDefault(); if (!picking) page.selectArea(null); }}>
    <header><div><small>{page.locale.toUpperCase()}</small><h2 id={titleId}>{page.schema[areaId].label}</h2></div><button type="button" disabled={picking} onClick={() => page.selectArea(null)}>{page.messages.close} ✓</button></header>
    <fieldset className="ec-form" disabled={page.busy || picking}>
      <FieldEditor field={page.schema[areaId]} value={page.document.locales[page.locale][areaId] as Value} path={areaId} areaId={areaId} setPicking={setPicking} onChange={value => page.setArea(areaId, value)} />
    </fieldset>
  </dialog>;
}
/** Optional schema-driven editor. Replace with your own UI using useEditablePage. */
export function AreaEditor() {
  const { selectedArea, locale } = useDemoEditor();
  return selectedArea ? <AreaDialog key={`${selectedArea}:${locale}`} areaId={selectedArea} /> : null;
}

export function EditAreaButton({ area, className }: { area: string; className?: string }) {
  const page = useDemoEditor();
  if (!page.canEdit) return null;
  return <button type="button" className={className} onClick={() => page.selectArea(area)} disabled={page.busy}>{page.messages.edit} {page.schema[area]?.label ?? area}</button>;
}
