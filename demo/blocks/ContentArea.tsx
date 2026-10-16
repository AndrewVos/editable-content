import { useEffect, useId, useRef, useState } from 'react';
import { RenderBlock, useEditableBlocks, useEditablePage } from '../../src';
import { templates } from './templates';
import { renderers } from './renderers';
import './content.css';
function TemplateLibrary({ onChoose, onClose }: { onChoose: (type: keyof typeof templates) => void; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const id = useId();
  const [query, setQuery] = useState('');
  useEffect(() => { const node = dialog.current!; node.showModal(); return () => node.close(); }, []);
  const entries = Object.entries(templates).filter(([, t]) => `${t.label} ${t.description}`.toLowerCase().includes(query.toLowerCase()));
  return <dialog ref={dialog} className="template-library" aria-labelledby={id} onCancel={onClose}><header><div><p className="eyebrow">YOUR COMPONENTS, READY TO INSERT</p><h2 id={id}>Add a section</h2></div><button aria-label="Close template library" onClick={onClose}>×</button></header><p>Choose a starting point. Edit the content right on the page.</p><input className="template-search" aria-label="Search templates" placeholder="Search templates…" value={query} onChange={e => setQuery(e.target.value)}/><div className="template-options">{entries.map(([type, template]) => <button key={type} onClick={() => onChoose(type as keyof typeof templates)}><div className={`template-preview preview-${type}`} aria-hidden="true">{type === 'quote' ? <span>“</span> : Array.from({ length: type === 'grid' ? 6 : type === 'carousel' ? 3 : 2 }, (_, i) => <i key={i}/>)}</div><strong>{template.label}<span>＋</span></strong><p>{template.description}</p></button>)}</div>{!entries.length ? <p role="status">No matching templates.</p> : null}<footer>These templates live in the demo. Register your own schemas and React components.</footer></dialog>;
}
export function ContentArea() {
  const page = useEditablePage();
  const blocks = useEditableBlocks<typeof templates>('content', ['blocks']);
  const [insertion, setInsertion] = useState<number | null>(null);
  const insertButton = (at: number) => page.canEdit ? <div className="insert-section"><span/><button disabled={!blocks.canInsert} onClick={() => setInsertion(at)}>+ Add section</button><span/></div> : null;
  return <section className="page-content" aria-label="Page content">
    {page.canEdit ? <header className="content-area-bar"><div><span className="content-area-dot"/><strong>PAGE CONTENT</strong><span>{blocks.items.length} sections</span></div></header> : null}
    {insertButton(0)}
    {blocks.items.map((block, index) => <div key={block.id}>
      <div className={`content-section ${page.canEdit ? 'content-section-editing' : ''}`}>
        {page.canEdit ? <div className="block-toolbar"><span><b>{String(index + 1).padStart(2, '0')}</b> {templates[block.type].label}</span><div><button aria-label={`Move section ${index + 1} up`} disabled={page.busy || index === 0} onClick={() => blocks.move(block.id, -1)}>↑</button><button aria-label={`Move section ${index + 1} down`} disabled={page.busy || index === blocks.items.length - 1} onClick={() => blocks.move(block.id, 1)}>↓</button><button disabled={!blocks.canInsert} onClick={() => blocks.duplicate(block.id)}>Duplicate</button><button disabled={!blocks.canRemove} onClick={() => blocks.remove(block.id)}>Remove section</button></div></div> : null}
        <RenderBlock block={block} renderers={renderers} area="content" path={['blocks', index, 'data']}/>
      </div>{insertButton(index + 1)}
    </div>)}
    {page.canEdit && !blocks.items.length ? <div className="empty-content"><h2>A little room for your ideas.</h2><p>Add a section to start building this page.</p></div> : null}
    {page.canEdit && insertion !== null ? <TemplateLibrary onClose={() => setInsertion(null)} onChoose={type => { blocks.insert(type, insertion); setInsertion(null); }}/> : null}
  </section>;
}
