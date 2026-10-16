import { siteUrl, isDemoPath } from './urls';
import { StrictMode, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { EditablePage, useEditableList, useEditableArea, useEditablePage, type Media, type MediaPickerRequest } from '../src';
import { InlineText, InlineLink, InlineMedia } from './editor/inline';
import { schema, locales } from './content';
import { adapter, load } from './storage';
import './editor/styles.css';
import './styles.css';
import { ContentArea } from './blocks/ContentArea';
import { Landing } from './landing';
const copy = {
  en: { collection: 'Collection', approach: 'Our approach', journal: 'Journal', bag: 'Bag (0)', caption: 'THE EVERYDAY COLLECTION', detail: 'Quiet forms. Lasting company.', about: 'Less, but considered.', aboutText: 'We believe the things you live with should earn their place. Made slowly, chosen carefully, and designed to become part of your everyday.', material: 'Natural materials', made: 'Made with care', timeless: 'Here for the long run' },
  fr: { collection: 'Collection', approach: 'Notre démarche', journal: 'Journal', bag: 'Panier (0)', caption: 'LA COLLECTION DU QUOTIDIEN', detail: 'Des formes simples. Pour longtemps.', about: 'Moins, mais mieux.', aboutText: 'Les objets qui vous entourent méritent leur place. Fabriqués avec soin, choisis avec attention, pour faire partie de votre quotidien.', material: 'Matières naturelles', made: 'Fabriqué avec soin', timeless: 'Pour longtemps' },
  ar: { collection: 'المجموعة', approach: 'نهجنا', journal: 'المجلة', bag: 'الحقيبة (٠)', caption: 'مجموعة الحياة اليومية', detail: 'أشكال هادئة. رفقة دائمة.', about: 'أقل، بعناية أكبر.', aboutText: 'نؤمن بأن الأشياء التي تعيش معها تستحق مكانها. صُنعت ببطء واختيرت بعناية لتصبح جزءاً من حياتك اليومية.', material: 'مواد طبيعية', made: 'مصنوع بعناية', timeless: 'للمدى الطويل' },
};
function FooterColumn({ index }: { index: number }) {
  const page = useEditablePage();
  const { value: footer } = useEditableArea<typeof schema, 'footer'>('footer');
  const links = useEditableList('footer', ['columns', index, 'links']);
  const columns = useEditableList('footer', ['columns']);
  return <div className="footer-column">
    <div className="column-heading"><InlineText area="footer" path={['columns', index, 'title']} as="h2"/>
      {page.canEdit ? <span className="column-tools"><button aria-label={`Move column ${index + 1} left`} disabled={page.busy || index === 0} onClick={() => columns.move(index, -1)}>←</button><button aria-label={`Move column ${index + 1} right`} disabled={page.busy || index === columns.items.length - 1} onClick={() => columns.move(index, 1)}>→</button><button aria-label={`Remove column ${index + 1}`} disabled={page.busy || !columns.canRemove} onClick={() => columns.remove(index)}>×</button></span> : null}
    </div>
    <ul>{footer.columns[index].links.map((_, j) => <li key={j} className="footer-link-row"><InlineLink area="footer" path={['columns', index, 'links', j]} canRemove={links.canRemove} onRemove={() => links.remove(j)}/>{page.canEdit ? <span className="link-order"><button aria-label={`Move link ${j + 1} up in column ${index + 1}`} disabled={page.busy || j === 0} onClick={() => links.move(j, -1)}>↑</button><button aria-label={`Move link ${j + 1} down in column ${index + 1}`} disabled={page.busy || j === links.items.length - 1} onClick={() => links.move(j, 1)}>↓</button></span> : null}</li>)}</ul>
    {page.canEdit ? <button className="inline-add" disabled={page.busy || !links.canAdd} onClick={() => links.add({ label: 'New link', href: '#', icon: null })}>+ Add link</button> : null}
  </div>;
}
function Website() {
  const columns = useEditableList('footer', ['columns']);
  const { value: footer } = useEditableArea<typeof schema, 'footer'>('footer');
  const page = useEditablePage();
  const text = copy[page.locale as keyof typeof copy];
  const editable = page.canEdit ? ' editable-region' : '';
  return <div className="website" lang={page.locale} dir={locales.find(l => l.code === page.locale)?.dir}>
    <nav className="site-nav"><a className="wordmark" href="#">form <span>&</span> field<span className="brand-dot">®</span></a><div className="nav-links"><a href="#collection">{text.collection}</a><a href="#approach">{text.approach}</a><a href="#journal">{text.journal}</a></div><span className="bag">{text.bag}</span></nav>
    <main>
      <section id="collection" className={`hero${editable}`}><span className="region-label">{page.canEdit ? "INTRODUCTION · CLICK TEXT TO EDIT" : ""}</span>
        <div className="hero-copy"><InlineText area="hero" path={["eyebrow"]} as="p" className="eyebrow"/><InlineText area="hero" path={["title"]} as="h1"/><InlineText area="hero" path={["description"]} as="p" className="hero-description"/><InlineLink area="hero" path={[]} labelKey="action" className="collection-link"><span aria-hidden="true">↗</span></InlineLink><div className="edition"><span className="tiny-line" />THE CONSIDERED LIFE · VOL. 01</div></div>
        <figure><InlineMedia area="hero" path={["image"]} className="still-life"/><figcaption><span>{text.caption}</span><span>01 — 03</span></figcaption></figure>
      </section>
      <section id="approach" className="approach"><p className="eyebrow">{text.about}</p><p>{text.aboutText}</p><div className="values"><span>↟ &nbsp; {text.material}</span><span>◇ &nbsp; {text.made}</span><span>∞ &nbsp; {text.timeless}</span></div></section>
      <ContentArea key={page.locale}/>
    </main>
    <footer className={`site-footer${editable}`}><span className="region-label">{page.canEdit ? "FOOTER · CLICK A LINK TO EDIT" : ""}</span><div className="footer-grid"><div className="footer-brand"><a className="wordmark" href="#">form <span>&</span> field</a><InlineText area="footer" path={["statement"]} as="p"/><span className="brand-flower" aria-hidden="true">✳</span></div>
      <div className="footer-columns">{footer.columns.map((_, i) => <FooterColumn key={i} index={i}/>)}</div>
      {page.canEdit ? <button className="add-column" disabled={page.busy || !columns.canAdd} onClick={() => columns.add({ title: 'New column', links: [{ label: 'New link', href: '#', icon: null }] })}>+ Add column <span>{columns.items.length} / 4</span></button> : null}
    </div><div className="footer-bottom"><InlineText area="footer" path={["legal"]} as="small"/><span>Thoughtfully simple. Always.</span></div></footer>
  </div>;
}
function Toolbar({ view, setView }: { view: string; setView: (view: 'edit' | 'preview' | 'published') => void }) {
  const page = useEditablePage();
  return <><header className="toolbar"><a href={siteUrl('')} className="tool-brand"><span className="tool-logo">e<span>c</span></span><div><strong>editable content</strong><span>REACT PLAYGROUND</span></div></a><div className="page-meta"><span className="meta-divider"/><span>Pages <span className="crumb">/</span> Homepage</span><span className={`status ${page.dirty ? 'changed' : ''}`}><i/>{page.dirty ? 'Unsaved changes' : page.status === 'published' ? 'Published' : 'Draft saved'}</span></div><div className="toolbar-actions"><label className="locale-select"><span aria-hidden="true">◎</span><span className="sr-only">Language</span><select aria-label="Language" value={page.locale} onChange={e => page.setLocale(e.target.value)}>{locales.map(locale => <option key={locale.code} value={locale.code}>{locale.label}</option>)}</select></label><button className="secondary" onClick={() => setView(view === 'edit' ? 'preview' : 'edit')}>{view === 'edit' ? 'Preview' : 'Back to editor'}</button>{view === 'edit' ? <><button className="secondary save" disabled={page.busy || !page.dirty} onClick={() => void page.saveDraft()}>Save draft</button><button className="primary" disabled={page.busy || (page.status === 'published' && !page.dirty)} onClick={() => void page.publish()}>{page.busy ? 'Working…' : 'Publish page'} <span aria-hidden="true">↗</span></button></> : null}</div></header>
    <div className="demo-strip"><div><span className="live-dot"/><strong>{view === 'edit' ? 'You’re in editing mode' : view === 'published' ? 'Published version' : 'Draft preview'}</strong><span className="strip-description">{view === 'edit' ? 'Click any text to edit. Click a link for its URL and icon.' : 'See the page without editing controls.'}</span></div><button onClick={() => setView(view === 'published' ? 'edit' : 'published')}>{view === 'published' ? 'Return to draft' : 'View published'} <span aria-hidden="true">→</span></button></div>
    {page.error ? <div className="error-banner" role="alert">{page.error}</div> : null}
  </>;
}
function MediaLibrary({ request, onChoose }: { request: MediaPickerRequest; onChoose: (media: Media | null) => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const node = ref.current!; node.showModal(); return () => node.close(); }, []);
  return <dialog ref={ref} className="media-dialog" aria-labelledby="media-title" onCancel={e => { e.preventDefault(); onChoose(null); }}><div className="media-heading"><div><p className="eyebrow">YOUR CMS · ASSET LIBRARY</p><h2 id="media-title">Choose a little detail.</h2></div><button aria-label="Close media library" onClick={() => onChoose(null)}>×</button></div><p>This picker belongs to the demo CMS. Yours can open any media library.</p><div className="media-grid">{(!request.path.endsWith('.icon') ? ['terracotta', 'sage', 'clay'] : ['leaf', 'globe', 'arrow', 'mail']).map(name => <button key={name} onClick={() => onChoose({ id: `asset_${name}`, url: siteUrl(`icons/${name}.svg`), alt: !request.path.endsWith('.icon') ? `${name} ceramic vessels and an olive branch` : '' })}><img src={siteUrl(`icons/${name}.svg`)} alt=""/><span>{name}</span></button>)}</div></dialog>;
}
function Demo() {
  const [stored] = useState(load);
  const [locale, setLocale] = useState('en');
  const [view, setView] = useState<'edit' | 'preview' | 'published'>('edit');
  const [published, setPublished] = useState(stored.published);
  const [picker, setPicker] = useState<{ request: MediaPickerRequest; resolve: (media: Media | null) => void } | null>(null);
  const pickMedia = (request: MediaPickerRequest) => new Promise<Media | null>(resolve => setPicker({ request, resolve }));
  const changeView = (next: typeof view) => { if (next === 'published') setPublished(load().published); setView(next); };
  return <EditablePage schema={schema} initial={stored.draft} locale={locale} locales={locales} onLocaleChange={setLocale} permissions={{ edit: view === 'edit', publish: true }} adapter={adapter} pickMedia={pickMedia}>
    <Toolbar view={view} setView={changeView}/>
    {view === 'published' ? <EditablePage key={published.revision} schema={schema} initial={published} locale={locale} locales={locales}><Website/></EditablePage> : <Website/>}
    {picker ? <MediaLibrary request={picker.request} onChoose={media => { picker.resolve(media); setPicker(null); }}/> : null}
  </EditablePage>;
}
try { createRoot(document.getElementById('root')!).render(<StrictMode>{isDemoPath(window.location.pathname) ? <Demo/> : <Landing/>}</StrictMode>); } catch (error) { document.getElementById('root')!.textContent = String(error); }
