'use client';
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { isSafeUrl, validateField, type Media, type Value } from '../../src';
import { type FieldPath } from '../../src';
import { useEditableField } from '../../src';
import { useDemoEditor } from './messages';
export type InlineFieldProps = { area: string; path: FieldPath; className?: string };
/** Text is synchronized on every keystroke, so Save/Publish always sees the latest value. */
export function InlineText({ area, path, as: Tag = 'span', className }: InlineFieldProps & { as?: 'span' | 'p' | 'h1' | 'h2' | 'h3' | 'small' }) {
  const page = useDemoEditor();
  const { field, value, setValue } = useEditableField(area, path);
  if (field.type !== 'text') throw new Error('InlineText requires a text field');
  return <Tag className={className}><TextSurface key={`${page.locale}:${JSON.stringify(path)}:${page.canEdit}`} value={value as string} label={field.label} multiline={field.multiline} maxLength={field.maxLength} onChange={setValue} /></Tag>;
}
function TextSurface({ value, label, multiline, maxLength, onChange }: { value: string; label: string; multiline?: boolean; maxLength?: number; onChange: (value: string) => void }) {
  const page = useDemoEditor();
  const [active, setActive] = useState(false);
  const original = useRef(value);
  const input = useRef<HTMLInputElement & HTMLTextAreaElement>(null);
  useEffect(() => { if (active) { input.current?.focus(); input.current?.select(); } }, [active]);
  useLayoutEffect(() => { if (active && multiline && input.current) { input.current.style.height = '0'; input.current.style.height = `${input.current.scrollHeight}px`; } }, [active, multiline, value]);
  if (!page.canEdit) return <>{value}</>;
  if (!active) return <span className="ec-text-target" role="button" tabIndex={page.busy ? -1 : 0} aria-label={`${page.messages.edit} ${label}`} aria-disabled={page.busy} onClick={() => { if (!page.busy) { original.current = value; setActive(true); } }} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (!page.busy) { original.current = value; setActive(true); } } }}>{value || label}</span>;
  const Input = multiline ? 'textarea' : 'input';
  return <Input ref={input} className="ec-text-input" aria-label={label} value={value} maxLength={maxLength} disabled={page.busy} rows={multiline ? 1 : undefined} style={multiline ? undefined : { width: `${Math.max(3, value.length + 1)}ch`, maxWidth: '100%' }} onChange={e => onChange(e.target.value)} onBlur={() => setActive(false)} onKeyDown={e => {
    if (e.nativeEvent.isComposing) return;
    if (e.key === 'Escape') { e.preventDefault(); onChange(original.current); setActive(false); }
    if (e.key === 'Enter' && (!multiline || e.ctrlKey || e.metaKey)) { e.preventDefault(); setActive(false); }
  }} />;
}
/** An anchor for readers; an in-place label editor and adjacent controls for editors. */
export function InlineLink(props: InlineFieldProps & { labelKey?: string; hrefKey?: string; iconKey?: string; children?: ReactNode; onRemove?: () => void; canRemove?: boolean }) {
  const page = useDemoEditor();
  return <LinkSurface key={`${page.locale}:${JSON.stringify(props.path)}:${page.canEdit}`} {...props} />;
}
function LinkSurface({ area, path, className, labelKey = 'label', hrefKey = 'href', iconKey = 'icon', children, onRemove, canRemove = true }: Parameters<typeof InlineLink>[0]) {
  const page = useDemoEditor();
  const { field, value } = useEditableField(area, path);
  if (field.type !== 'object' || field.fields[labelKey]?.type !== 'text' || field.fields[hrefKey]?.type !== 'url') throw new Error('InlineLink requires an object with text and URL fields');
  const link = value as Record<string, Value>;
  const label = link[labelKey] as string;
  const href = link[hrefKey] as string;
  const icon = field.fields[iconKey]?.type === 'media' ? link[iconKey] as Media | null : null;
  const hasIcon = field.fields[iconKey]?.type === 'media';
  const [active, setActive] = useState(false);
  const [picking, setPicking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const mounted = useRef(true);
  const latest = useRef(page); latest.current = page;
  const originalLabel = useRef(label);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => { if (active) { input.current?.focus(); input.current?.select(); } }, [active]);
  const update = (key: string, next: Value) => page.setField(area, [...path, key], next);
  const choose = async () => {
    if (!page.pickMedia || picking) return;
    const before = page.document.locales[page.locale][area];
    setPicking(true); setError(null);
    try {
      const mediaField = field.fields[iconKey];
      const picked = await page.pickMedia({ current: icon, accept: mediaField.type === 'media' ? mediaField.accept : undefined, pageId: page.document.id, locale: page.locale, areaId: area, path: area + [...path, iconKey].map(p => typeof p === 'number' ? `[${p}]` : `.${p}`).join('') });
      if (!mounted.current || !picked) return;
      if (!latest.current.canEdit || latest.current.busy || latest.current.locale !== page.locale || latest.current.document.locales[page.locale][area] !== before) throw new Error('Content changed while choosing media. Please choose again.');
      if (validateField(mediaField, picked).length) throw new Error('The media picker returned invalid media');
      latest.current.setField(area, [...path, iconKey], picked);
    } catch (cause) { if (mounted.current) setError(cause instanceof Error ? cause.message : String(cause)); }
    finally { if (mounted.current) setPicking(false); }
  };
  const image = icon && isSafeUrl(icon.url, true) ? <img src={icon.url} alt={icon.alt} /> : null;
  if (!page.canEdit) return <a className={className} href={isSafeUrl(href) ? href : '#'}>{image}{label}{children}</a>;
  return <span className={`ec-inline-link ${active ? 'ec-link-active' : ''}`} onBlur={e => { if (!picking && !e.currentTarget.contains(e.relatedTarget as Node)) setActive(false); }} onKeyDown={e => { if (e.key === 'Escape' && !picking) { e.preventDefault(); setActive(false); } }}>
    {active ? <span className={`ec-link-label ${className ?? ''}`}>{image}<input ref={input} aria-label={field.fields[labelKey].label} value={label} disabled={page.busy || picking} onChange={e => update(labelKey, e.target.value)} onKeyDown={e => { if (e.nativeEvent.isComposing) return; if (e.key === 'Escape') { update(labelKey, originalLabel.current); setActive(false); } if (e.key === 'Enter') setActive(false); }} />{children}</span> : <a className={`ec-link-target ${className ?? ''}`} href={isSafeUrl(href) ? href : '#'} aria-label={`${page.messages.edit} ${label}`} onClick={e => { e.preventDefault(); if (!page.busy) { originalLabel.current = label; setActive(true); } }}>{image}{label || field.fields[labelKey].label}{children}</a>}
    {active ? <span className="ec-link-tools" role="group" aria-label={`${page.messages.edit} ${label}`}>
      <label>{page.messages.destination}<input aria-label={page.messages.destination} value={href} disabled={page.busy || picking} onChange={e => update(hrefKey, e.target.value)} /></label>
      <span className="ec-link-buttons">{hasIcon ? <><button type="button" disabled={!page.pickMedia || page.busy || picking} onClick={() => void choose()}>{page.messages.chooseMedia}</button>{icon ? <button type="button" disabled={page.busy || picking} onClick={() => update(iconKey, null)}>{page.messages.clearMedia}</button> : null}</> : null}
        {onRemove ? <button type="button" disabled={!canRemove || page.busy || picking} onClick={onRemove}>{page.messages.remove}</button> : null}
        <button type="button" disabled={picking} onClick={() => setActive(false)}>{page.messages.close} ✓</button>
      </span>
      {icon ? <label>{page.messages.altText}<input value={icon.alt} disabled={page.busy || picking} onChange={e => update(iconKey, { ...icon, alt: e.target.value })} /></label> : null}
      {error ? <span role="alert">{error}</span> : null}
    </span> : null}
  </span>;
}

/** Click-to-replace media using the host CMS picker. */
export function InlineMedia(props: InlineFieldProps) {
  const page = useDemoEditor();
  return <MediaSurface key={`${page.locale}:${JSON.stringify(props.path)}:${page.canEdit}`} {...props} />;
}
function MediaSurface({ area, path, className }: InlineFieldProps) {
  const page = useDemoEditor();
  const { field, value, setValue } = useEditableField(area, path);
  if (field.type !== 'media') throw new Error('InlineMedia requires a media field');
  const media = value as Media | null;
  const [picking, setPicking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);
  const latest = useRef(page); latest.current = page;
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const choose = async () => {
    if (!page.pickMedia || picking || page.busy) return;
    const before = page.document.locales[page.locale][area];
    setPicking(true); setError(null);
    try {
      const picked = await page.pickMedia({ current: media, accept: field.accept, pageId: page.document.id, locale: page.locale, areaId: area, path: area + path.map(p => typeof p === 'number' ? `[${p}]` : `.${p}`).join('') });
      if (!mounted.current || !picked) return;
      if (!latest.current.canEdit || latest.current.busy || latest.current.locale !== page.locale || latest.current.document.locales[page.locale][area] !== before) throw new Error('Content changed while choosing media. Please choose again.');
      if (validateField(field, picked).length) throw new Error('The media picker returned invalid media');
      latest.current.setField(area, path, picked);
    } catch (cause) { if (mounted.current) setError(cause instanceof Error ? cause.message : String(cause)); }
    finally { if (mounted.current) setPicking(false); }
  };
  const image = media && isSafeUrl(media.url, true) ? <img className={className} src={media.url} alt={media.alt}/> : null;
  if (!page.canEdit) return image;
  return <div className="ec-inline-media">
    <button className="ec-media-target" type="button" aria-label={`${page.messages.chooseMedia}: ${field.label}`} disabled={!page.pickMedia || page.busy || picking} onClick={() => void choose()}>{image}<span className="ec-media-badge">{page.messages.chooseMedia} ↗</span></button>
    {media ? <label className="ec-media-alt">{page.messages.altText}<input value={media.alt} disabled={page.busy || picking} onChange={e => setValue({ ...media, alt: e.target.value })}/></label> : null}
    {!page.pickMedia ? <small>{page.messages.noMediaPicker}</small> : null}
    {error ? <p role="alert">{error}</p> : null}
  </div>;
}
