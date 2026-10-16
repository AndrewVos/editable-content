// Plain React + CSS consumer examples. Copy and adapt these; the library does not ship them.
import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { isSafeUrl, useEditableField, useEditableList, useEditablePage, type BlockRenderers, type BlockRenderProps, type FieldPath, type Infer } from '../../src';
import { InlineText, InlineLink, InlineMedia } from '../editor/inline';
import { cardSchema, newCard, templates, type DemoBlock } from './templates';
type Props<K extends DemoBlock['type']> = BlockRenderProps<Extract<DemoBlock, { type: K }>>;
function NumberControl({ area, path }: { area: string; path: FieldPath }) {
  const page = useEditablePage();
  const { field, value, setValue } = useEditableField(area, path);
  if (field.type !== 'number') return null;
  return <label>{field.label}<input type="number" value={value as number} min={field.min} max={field.max} step="1" disabled={page.busy} onChange={e => {
    const number = e.target.valueAsNumber;
    if (Number.isInteger(number) && number >= (field.min ?? 0) && number <= (field.max ?? Infinity)) setValue(number);
  }}/></label>;
}
function Card({ area, path, index, count, onRemove, onMove }: { area: string; path: FieldPath; index: number; count: number; onRemove: () => void; onMove: (delta: -1 | 1) => void }) {
  const page = useEditablePage();
  const { value } = useEditableField(area, path);
  const card = value as Infer<typeof cardSchema>;
  return <article className="content-card">
    {page.canEdit ? <div className="card-admin"><span>ITEM {String(index + 1).padStart(2, '0')}</span><div><button aria-label={`Move item ${index + 1} earlier`} disabled={page.busy || index === 0} onClick={() => onMove(-1)}>←</button><button aria-label={`Move item ${index + 1} later`} disabled={page.busy || index === count - 1} onClick={() => onMove(1)}>→</button><button aria-label={`Remove item ${index + 1}`} disabled={page.busy || count <= 1} onClick={onRemove}>×</button></div></div> : null}
    {page.canEdit ? <InlineMedia area={area} path={[...path, 'image']}/> : <a href={isSafeUrl(card.href) ? card.href : '#'}><InlineMedia area={area} path={[...path, 'image']}/></a>}
    <div className="content-card-copy"><h3><InlineLink area={area} path={path}/></h3><InlineText area={area} path={[...path, 'description']} as="p"/></div>
  </article>;
}
function GridBlock({ block, area, path }: Props<'twoColumn' | 'grid'>) {
  const page = useEditablePage();
  const cards = useEditableList(area, [...path, 'cards']);
  const data = block.data;
  return <div className="grid-block">
    <header className="content-heading"><InlineText area={area} path={[...path, 'eyebrow']} as="p" className="eyebrow"/><InlineText area={area} path={[...path, 'title']} as="h2"/></header>
    {page.canEdit ? <div className="grid-settings" aria-label="Responsive grid settings"><span>GRID LAYOUT</span>{(['mobile', 'tablet', 'desktop', 'gap'] as const).map(key => <NumberControl key={key} area={area} path={[...path, key]}/>)}<small>&lt;640 / 640–1023 / ≥1024 px</small></div> : null}
    <div className="responsive-content-grid" style={{ '--cols-mobile': data.mobile, '--cols-tablet': data.tablet, '--cols-desktop': data.desktop, '--grid-gap': `${data.gap}px` } as CSSProperties}>
      {data.cards.map((_, i) => <Card key={i} area={area} path={[...path, 'cards', i]} index={i} count={cards.items.length} onRemove={() => cards.remove(i)} onMove={delta => cards.move(i, delta)}/>)}
    </div>
    {page.canEdit ? <button className="content-add" disabled={!cards.canAdd || page.busy} onClick={() => cards.add(newCard(cards.items.length))}>+ Add card <span>{cards.items.length} / 24</span></button> : null}
  </div>;
}
function CarouselBlock({ block, area, path }: Props<'carousel'>) {
  const page = useEditablePage();
  const cards = useEditableList(area, [...path, 'cards']);
  const track = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ index: 0, previous: false, next: false });
  const measure = useCallback(() => {
    const node = track.current;
    if (!node) return;
    const offset = Math.abs(node.scrollLeft);
    const step = (node.firstElementChild as HTMLElement | null)?.offsetWidth ?? 1;
    setPosition({ index: Math.min(cards.items.length - 1, Math.round(offset / (step + 24))), previous: offset > 2, next: offset + node.clientWidth < node.scrollWidth - 2 });
  }, [cards.items.length]);
  useEffect(() => { const node = track.current!; const observer = new ResizeObserver(measure); observer.observe(node); measure(); return () => observer.disconnect(); }, [measure]);
  const rtl = page.locales.find(l => l.code === page.locale)?.dir === 'rtl';
  useEffect(() => { track.current?.scrollTo({ left: 0 }); measure(); }, [page.locale, measure]);
  const scroll = (delta: number) => {
    const node = track.current;
    if (!node) return;
    const step = (node.firstElementChild as HTMLElement | null)?.offsetWidth ?? node.clientWidth;
    node.scrollBy({ left: delta * (step + 24) * (rtl ? -1 : 1), behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  };
  return <section className="carousel-block" aria-roledescription="carousel" aria-label={block.data.title}>
    <header className="content-heading carousel-heading"><div><p className="eyebrow">IN GOOD COMPANY</p><InlineText area={area} path={[...path, 'title']} as="h2"/></div><div className="carousel-buttons"><button aria-label="Previous slide" disabled={!position.previous} onClick={() => scroll(-1)}>{rtl ? '→' : '←'}</button><button aria-label="Next slide" disabled={!position.next} onClick={() => scroll(1)}>{rtl ? '←' : '→'}</button></div></header>
    <div ref={track} className="content-carousel" tabIndex={0} aria-label="Carousel slides" onScroll={measure} onKeyDown={e => { if (e.target !== e.currentTarget) return; if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); scroll((e.key === 'ArrowRight' ? 1 : -1) * (rtl ? -1 : 1)); } }}>
      {block.data.cards.map((_, i) => <div className="content-slide" role="group" aria-roledescription="slide" aria-label={`${i + 1} of ${cards.items.length}`} key={i}><Card area={area} path={[...path, 'cards', i]} index={i} count={cards.items.length} onRemove={() => cards.remove(i)} onMove={delta => cards.move(i, delta)}/></div>)}
    </div>
    <div className="carousel-bottom"><span aria-live="polite">{Math.min(position.index + 1, cards.items.length)} / {cards.items.length}</span>{page.canEdit ? <button className="content-add" disabled={!cards.canAdd || page.busy} onClick={() => cards.add(newCard(cards.items.length))}>+ Add slide</button> : <span>Scroll to explore →</span>}</div>
  </section>;
}
function StoryBlock({ area, path }: Props<'story'>) {
  return <div className="story-block"><InlineMedia area={area} path={[...path, 'image']}/><div><p className="eyebrow">OUR APPROACH</p><InlineText area={area} path={[...path, 'title']} as="h2"/><InlineText area={area} path={[...path, 'description']} as="p"/><InlineLink area={area} path={path} className="story-link"/></div></div>;
}
function QuoteBlock({ area, path }: Props<'quote'>) {
  return <blockquote className="quote-block"><span aria-hidden="true">“</span><InlineText area={area} path={[...path, 'quote']} as="p"/><InlineText area={area} path={[...path, 'attribution']} as="small"/></blockquote>;
}
export const renderers: BlockRenderers<typeof templates> = { twoColumn: GridBlock, grid: GridBlock, carousel: CarouselBlock, story: StoryBlock, quote: QuoteBlock };
