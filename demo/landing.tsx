import { useState } from 'react';
import { EditablePage, defineSchema, field, useEditableList, type PageSnapshot } from '../src';
import { InlineText, InlineLink } from './editor/inline';
import './landing.css';
const sampleSchema = defineSchema({ footer: field.object('Footer', {
  title: field.text('Column title', { default: 'Stay curious.' }),
  links: field.list('Links', field.object('Link', { label: field.text('Label'), href: field.url('URL') }), { min: 1, max: 4 }),
}) });
const sample: PageSnapshot<typeof sampleSchema> = { revision: 'landing', document: { id: 'interactive-example', schemaVersion: 1, locales: { en: { footer: { title: 'Stay curious.', links: [{ label: 'Our story', href: '#story' }, { label: 'Get in touch', href: 'mailto:hello@example.com' }] } } } } };
function LiveExample() {
  const links = useEditableList('footer', ['links']);
  return <div className="landing-live"><div className="live-example-top"><span>YOUR WEBSITE</span><span className="live-edit-indicator">● Editing</span></div><div className="mini-site"><div className="mini-brand">ordinary<span>®</span><p>Small things.<br/>A little more human.</p><span className="mini-asterisk">✳</span></div><div className="mini-editable"><span className="mini-region-label">FOOTER / LINKS</span><InlineText area="footer" path={['title']} as="h3"/>{links.items.map((_, i) => <InlineLink key={i} area="footer" path={['links', i]} canRemove={links.canRemove} onRemove={() => links.remove(i)}/>)}<button className="mini-add" disabled={!links.canAdd} onClick={() => links.add({ label: 'New link', href: '#' })}>+ Add link</button></div></div><div className="live-example-bottom"><span>↳ Go on. Click the text.</span><span>Real React. Really editable.</span></div></div>;
}
const snippets = {
  'Define a schema': `import { defineSchema, field } from 'react-editable-content/core';

export const schema = defineSchema({
  footer: field.object('Footer', {
    title: field.text('Title', { required: true }),
    links: field.list('Links', field.object('Link', {
      label: field.text('Label', { required: true }),
      href: field.url('Destination', { required: true }),
      icon: field.media('Icon', { accept: 'image/*' }),
    }), { min: 1, max: 6 }),
  }),
});`,
  'Make it editable': `import { useState } from 'react';
import {
  useEditableField, useEditablePage,
} from 'react-editable-content';

// Your markup, interaction, and styles.
export function Footer() {
  const [editing, setEditing] = useState(false);
  const page = useEditablePage();
  const { value, setValue } =
    useEditableField('footer', ['title']);

  return (
    <footer className="your-layout">
      {page.canEdit && editing ? (
        <input aria-label="Footer title"
          value={String(value)} disabled={page.busy}
          onChange={e => setValue(e.target.value)}
          onBlur={() => setEditing(false)} />
      ) : (
        <h2>{page.canEdit ? (
          <button onClick={() => setEditing(true)}>
            {String(value)}
          </button>
        ) : String(value)}</h2>
      )}
    </footer>
  );
}`,
  'Connect your CMS': `import { EditablePage } from 'react-editable-content';

// These values come from your CMS integration.
<EditablePage
  key={cmsPage.id}
  schema={schema}
  initial={cmsSnapshot}
  locale={locale}
  locales={locales}
  onLocaleChange={setLocale}
  permissions={{ edit: canEdit, publish: canPublish }}
  adapter={{ saveDraft: cms.saveDraft, publish: cms.publish }}
  pickMedia={request => cms.openMediaPicker(request)}
>
  <YourCmsToolbar />
  <Footer />
</EditablePage>`,
};
type Tab = keyof typeof snippets;
function Code({ source }: { source: string }) {
  return <code>{source.split(/('[^'\n]*'|"[^"\n]*"|\/\/[^\n]*|\b(?:import|from|export|const|function|return|true|false)\b)/g).map((part, i) => <span key={i} className={part.startsWith('//') ? 'syntax-comment' : /^["']/.test(part) ? 'syntax-string' : /^(import|from|export|const|function|return|true|false)$/.test(part) ? 'syntax-keyword' : undefined}>{part}</span>)}</code>;
}
export function Landing() {
  const [tab, setTab] = useState<Tab>('Define a schema');
  const [copied, setCopied] = useState('');
  async function copy() { try { await navigator.clipboard.writeText(snippets[tab]); setCopied('Copied ✓'); } catch { setCopied('Select the code to copy'); } }
  return <div className="product-page">
    <nav className="product-nav"><a href="/" className="product-logo"><span className="product-symbol">e<span>c</span></span>editable content<span className="product-version">0.1</span></a><div><a href="#how-it-works">How it works</a><a href="#react">React API</a><a href="/demo" className="nav-demo">Open playground <span>↗</span></a></div></nav>
    <main>
      <section className="product-hero"><div className="hero-intro"><p className="product-kicker"><span/> A LITTLE LIBRARY FOR REACT</p><h1>Your website.<br/>Now <em>editable.</em><span className="text-caret"/></h1><p className="product-lede">Let people edit content where it lives.<br/>Keep the components, the layout, and the CMS<br className="desktop-break"/> you already love.</p><div className="product-hero-actions"><a href="/demo" className="product-cta">Try the live demo <span>↗</span></a><a href="#react" className="code-cta">See the React code <span>↓</span></a></div><p className="product-meta">SCHEMA-DRIVEN <b>·</b> CMS-AGNOSTIC <b>·</b> REACT 18+</p></div><div className="hero-example"><div className="example-note">Content editing, without the detour.<span>↙</span></div><EditablePage schema={sampleSchema} initial={sample} locale="en" locales={[{ code: 'en', label: 'English' }]} permissions={{ edit: true, publish: false }}><LiveExample/></EditablePage><div className="example-caption"><span className="bracket">{ '{ }' }</span><p>You set the boundaries.<br/><strong>Your editors make it their own.</strong></p><span className="example-number">01 / IN PLACE</span></div></div></section>
      <div className="product-capabilities"><span>Built for the way you build.</span><div><span>⌘ &nbsp; Your React components</span><span>▦ &nbsp; Your content schemas</span><span>◎ &nbsp; Your CMS</span></div></div>
      <section id="how-it-works" className="product-explanation"><div><p className="product-kicker">LESS INTERFACE. MORE CONTEXT.</p><h2>Edit the content.<br/>Keep the design.</h2></div><p>A footer is still your footer. Your grid, your spacing, your carefully chosen type. Make the text editable, allow a few more links, and give editors just the controls they need.</p></section>
      <section className="product-principles"><article><span className="principle-number">01 — DEFINE</span><h3>A schema sets the limits.</h3><p>Text, links, images, and nested lists. Set required fields and item limits. Content changes; your layout stays yours.</p><div className="schema-visual"><span>footer.links</span><span>list <b>1…6</b></span><div><i/> label <em>text</em></div><div><i/> href <em>url</em></div><div><i/> icon <em>media</em></div></div></article><article><span className="principle-number">02 — EDIT</span><h3>Right where it belongs.</h3><p>Click a headline and type. Select a link to edit its URL or icon. Add another item with a button beside the list.</p><div className="inline-visual"><span>Good things, made to stay.<i/></span><small>✎ &nbsp; Edit in place</small></div></article><article><span className="principle-number">03 — CONNECT</span><h3>Your CMS stays in charge.</h3><p>Bring your media picker, permissions, and language switcher. Save and publish every area as one page document.</p><div className="connection-visual"><span>Introduction</span><span>Footer</span><div>↓</div><strong>One page. One publish.</strong></div></article></section>
      <section id="react" className="product-code-section"><div className="code-intro"><p className="product-kicker">SMALL API. FAMILIAR REACT.</p><h2>Your UI.<br/>Our editing hooks.</h2><p>Define what can change, wrap your page, and connect your own controls with headless hooks. Every element and style belongs to you.</p><a href="/demo">See it working in the playground <span>↗</span></a><div className="source-note"><span>EARLY RELEASE / LOCAL DEVELOPMENT</span><p>This package is not on npm yet. From this repository:</p><code>bun install<br/>bun dev</code><small>Landing page at / · Playground at /demo</small></div></div><div className="product-code"><div className="code-tabs" role="tablist" aria-label="React integration steps">{(Object.keys(snippets) as Tab[]).map((name, i) => <button key={name} role="tab" id={`code-tab-${i}`} tabIndex={tab === name ? 0 : -1} onKeyDown={e => { const keys = ["ArrowLeft", "ArrowRight", "Home", "End"]; if (!keys.includes(e.key)) return; e.preventDefault(); const names = Object.keys(snippets) as Tab[]; const next = e.key === "Home" ? 0 : e.key === "End" ? 2 : (i + (e.key === "ArrowRight" ? 1 : -1) + 3) % 3; setTab(names[next]); setCopied(""); (e.currentTarget.parentElement?.children[next] as HTMLButtonElement)?.focus(); }} aria-selected={tab === name} aria-controls="react-code-panel" onClick={() => { setTab(name); setCopied(''); }}><span>0{i + 1}</span> {name}</button>)}</div><div className="code-file"><span>{tab === 'Define a schema' ? 'schema.ts' : tab === 'Make it editable' ? 'Footer.tsx' : 'Page.tsx'}</span><button onClick={() => void copy()}>{copied || 'Copy code ⧉'}</button></div><pre id="react-code-panel" role="tabpanel" aria-labelledby={`code-tab-${Object.keys(snippets).indexOf(tab)}`} tabIndex={0}><Code source={snippets[tab]}/></pre><div className="code-footnote"><span>TypeScript included</span><span>Layout not included. That’s yours.</span></div></div></section>
      <section className="product-details"><div><p className="product-kicker">THE DETAILS MATTER</p><h2>Made to fit<br/>the bigger picture.</h2></div><dl><div><dt>Many areas. One page.</dt><dd>A stable CMS page ID ties everything together. Save drafts or publish a complete snapshot, across all areas and locales.</dd></div><div><dt>Every language has a place.</dt><dd>Controlled locale switching, Unicode content, RTL layouts, and customizable editor labels. Your CMS owns the language bar.</dd></div><div><dt>Your media library, included.</dt><dd>Connect an async picker to return an asset. Keep your uploads, image selection, and permissions in the CMS you already use.</dd></div><div><dt>Editing is a permission.</dt><dd>Give editors access to changes and publishers access to publishing. Your server enforces access and checks revision conflicts.</dd></div></dl></section>
      <section className="product-final"><span className="final-star">✳</span><p className="product-kicker">LESS BACK AND FORTH. MORE DONE.</p><h2>Give your content<br/>a little freedom.</h2><a href="/demo" className="product-cta">Make yourself at home <span>↗</span></a><p>Try editing a real React page. No account needed.</p></section>
    </main><footer className="product-footer"><a href="/" className="product-logo"><span className="product-symbol">e<span>c</span></span>editable content</a><span>Small library. Your possibilities.</span><div><a href="#react">React examples</a><a href="/demo">Playground ↗</a></div></footer>
  </div>;
}
