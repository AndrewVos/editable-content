import { siteUrl } from './urls';
import { templates, createStarterContent } from './blocks/templates';
import { defineSchema, field, type Areas, type PageSnapshot } from '../src/core';
export const introductionImage = { id: 'asset_terracotta', url: siteUrl('icons/terracotta.svg'), alt: 'Ceramic vessels and an olive branch in warm sunlight' };
export const schema = defineSchema({
  content: field.object('Page content', { blocks: field.blocks('Sections', templates, { max: 12 }) }),
  hero: field.object('Introduction', {
    image: field.media('Introduction image', { required: true, accept: 'image/*', default: introductionImage }),
    eyebrow: field.text('Eyebrow', { required: true, maxLength: 60 }),
    title: field.text('Headline', { required: true, multiline: true, maxLength: 120 }),
    description: field.text('Description', { required: true, multiline: true, maxLength: 400 }),
    action: field.text('Button label', { required: true }),
    href: field.url('Button destination', { required: true }),
  }),
  footer: field.object('Footer', {
    statement: field.text('Brand statement', { required: true, multiline: true, maxLength: 180 }),
    columns: field.list('Link columns', field.object('Column', {
      title: field.text('Column title', { required: true }),
      links: field.list('Links', field.object('Link', {
        label: field.text('Link label', { required: true }),
        href: field.url('Destination', { required: true }),
        icon: field.media('Link icon', { accept: 'image/*' }),
      }), { min: 1, max: 6 }),
    }), { min: 1, max: 4 }),
    legal: field.text('Copyright', { required: true }),
  }),
});
const link = (label: string, href = '#collection') => ({ label, href, icon: null });
const en: Areas<typeof schema> = {
  content: createStarterContent('en'),
  hero: { image: { ...introductionImage }, eyebrow: 'OBJECTS FOR EVERYDAY LIVING', title: 'A little less.\nA little better.', description: 'Thoughtfully made essentials for the spaces we call home. Natural materials, considered details, and nothing more than you need.', action: 'Explore the collection', href: '#collection' },
  footer: { statement: 'Good things.\nMade to stay.', columns: [
    { title: 'Explore', links: [link('Our collection'), link('Our approach', '#approach'), link('The journal', '#journal')] },
    { title: 'A little help', links: [link('Get in touch', 'mailto:hello@example.com'), link('Shipping & returns', '#shipping'), link('Care guide', '#care')] },
    { title: 'Find us', links: [link('Instagram', 'https://instagram.com'), link('Pinterest', 'https://pinterest.com')] },
  ], legal: '© 2026 Form & Field. Made with intention.' },
};
const fr: Areas<typeof schema> = {
  content: createStarterContent('fr'),
  hero: { image: { ...introductionImage }, eyebrow: 'DES OBJETS POUR LE QUOTIDIEN', title: 'Un peu moins.\nUn peu mieux.', description: 'Des essentiels pensés pour les espaces que nous appelons chez nous. Des matières naturelles, des détails soignés, et juste ce qu’il faut.', action: 'Découvrir la collection', href: '#collection' },
  footer: { statement: 'De belles choses.\nPour longtemps.', columns: [
    { title: 'Explorer', links: [link('La collection'), link('Notre démarche', '#approach'), link('Le journal', '#journal')] },
    { title: 'Besoin d’aide ?', links: [link('Nous contacter', 'mailto:hello@example.com'), link('Livraison et retours', '#shipping'), link('Conseils d’entretien', '#care')] },
    { title: 'Nous suivre', links: [link('Instagram', 'https://instagram.com'), link('Pinterest', 'https://pinterest.com')] },
  ], legal: '© 2026 Form & Field. Créé avec soin.' },
};
const ar: Areas<typeof schema> = {
  content: createStarterContent('ar'),
  hero: { image: { ...introductionImage }, eyebrow: 'أشياء للحياة اليومية', title: 'أقل قليلاً.\nأفضل قليلاً.', description: 'أساسيات مصنوعة بعناية للمساحات التي نسميها منزلاً. مواد طبيعية وتفاصيل مدروسة وكل ما تحتاج إليه.', action: 'اكتشف المجموعة', href: '#collection' },
  footer: { statement: 'أشياء جميلة.\nصُنعت لتبقى.', columns: [
    { title: 'اكتشف', links: [link('المجموعة'), link('نهجنا', '#approach'), link('المجلة', '#journal')] },
    { title: 'المساعدة', links: [link('تواصل معنا', 'mailto:hello@example.com'), link('الشحن والإرجاع', '#shipping'), link('دليل العناية', '#care')] },
    { title: 'تابعنا', links: [link('Instagram', 'https://instagram.com'), link('Pinterest', 'https://pinterest.com')] },
  ], legal: '© 2026 Form & Field. صُنع بعناية.' },
};
export const initial: PageSnapshot<typeof schema> = { revision: 'seed', publishedRevision: 'seed', document: { id: 'page_home_01', schemaVersion: 3, locales: { en, fr, ar } } };
export const locales = [{ code: 'en', label: 'English', dir: 'ltr' as const }, { code: 'fr', label: 'Français', dir: 'ltr' as const }, { code: 'ar', label: 'العربية', dir: 'rtl' as const }];
