import { siteUrl } from '../urls';
// Consumer-owned templates. This file and its renderers are NOT in the npm build.
import { createBlock, defineBlocks, field, type ContentBlock, type Infer } from '../../src/core';
const image = (name: string) => ({ id: `asset_${name}`, url: siteUrl(`icons/${name}.svg`), alt: `${name} ceramic vessels and an olive branch` });
export const cardSchema = field.object('Card', {
  label: field.text('Card title', { required: true, default: 'Everyday essentials', maxLength: 100 }),
  description: field.text('Card description', { default: 'Thoughtful objects for the spaces you call home.', multiline: true, maxLength: 300 }),
  href: field.url('Card destination', { required: true, default: '#collection' }),
  image: field.media('Card image', { required: true, accept: 'image/*', default: image('terracotta') }),
});
export function newCard(index = 0): Infer<typeof cardSchema> {
  const names = ['terracotta', 'sage', 'clay'];
  return { label: ['Objects with intention', 'A quieter kind of living', 'Made to be kept'][index % 3], description: 'Natural materials. Considered details. A little room for the everyday.', href: '#collection', image: image(names[index % 3]) };
}
const gridSchema = field.object('Grid', {
  eyebrow: field.text('Section eyebrow', { default: 'THE COLLECTION', maxLength: 80 }),
  title: field.text('Section title', { required: true, default: 'Good things, together.', maxLength: 120 }),
  mobile: field.number('Mobile columns', { default: 1, min: 1, max: 4, integer: true }),
  tablet: field.number('Tablet columns', { default: 2, min: 1, max: 8, integer: true }),
  desktop: field.number('Desktop columns', { default: 3, min: 1, max: 12, integer: true }),
  gap: field.number('Gap (px)', { default: 24, min: 0, max: 64, integer: true }),
  cards: field.list('Cards', cardSchema, { min: 1, max: 24 }),
});
export const templates = defineBlocks({
  twoColumn: {
    label: 'Two-column feature', description: 'Two linked images with titles and a little room to tell their stories.',
    schema: gridSchema,
    initial: { eyebrow: 'A FEW FAVOURITES', title: 'Made for everyday rituals.', mobile: 1, tablet: 2, desktop: 2, gap: 24, cards: [newCard(0), newCard(1)] },
  },
  grid: {
    label: 'Responsive grid', description: 'Choose the columns at each breakpoint. Add up to 24 linked image cards.',
    schema: gridSchema,
    initial: { eyebrow: 'EXPLORE THE COLLECTION', title: 'Find your everyday favourites.', mobile: 1, tablet: 2, desktop: 3, gap: 24, cards: Array.from({ length: 6 }, (_, i) => newCard(i)) },
  },
  carousel: {
    label: 'Image carousel', description: 'A simple, scrollable collection of linked images. No UI framework needed.',
    schema: field.object('Carousel', {
      title: field.text('Section title', { required: true, default: 'A closer look.', maxLength: 120 }),
      cards: field.list('Slides', cardSchema, { min: 1, max: 12 }),
    }),
    initial: { title: 'A closer look.', cards: Array.from({ length: 4 }, (_, i) => newCard(i)) },
  },
  story: {
    label: 'Image & story', description: 'An image alongside a headline, paragraph, and link.',
    schema: field.object('Story', {
      title: field.text('Story title', { required: true, default: 'Fewer things. Better stories.', multiline: true, maxLength: 120 }),
      description: field.text('Story text', { default: 'We believe that the objects around us should feel as good as they look. Made slowly, chosen carefully, and designed to stay.', multiline: true, maxLength: 1200 }),
      label: field.text('Link label', { required: true, default: 'Discover our approach' }),
      href: field.url('Destination', { required: true, default: '#approach' }),
      image: field.media('Story image', { required: true, accept: 'image/*', default: image('clay') }),
    }),
  },
  quote: {
    label: 'Quote', description: 'A simple statement with an attribution. Text only.',
    schema: field.object('Quote', {
      quote: field.text('Quote', { required: true, default: 'The things we choose to keep are the things that make a home.', multiline: true, maxLength: 500 }),
      attribution: field.text('Attribution', { default: 'THE FORM & FIELD PHILOSOPHY', maxLength: 120 }),
    }),
  },
});
export type DemoBlock = ContentBlock<typeof templates>;
export function createStarterContent(locale: string) {
  const grid = createBlock(templates, 'twoColumn');
  const carousel = createBlock(templates, 'carousel');
  if (locale === 'fr') { grid.data.title = 'Pour les rituels du quotidien.'; grid.data.eyebrow = 'NOS FAVORIS'; carousel.data.title = 'Un regard de plus près.'; }
  if (locale === 'ar') { grid.data.title = 'مصنوع للحظاتك اليومية.'; grid.data.eyebrow = 'بعض المفضلات'; carousel.data.title = 'نظرة عن قرب.'; }
  for (const block of [grid, carousel]) block.data.cards.forEach((card, i) => {
    if (locale === 'fr') { card.label = ['Des objets choisis', 'Une vie plus douce', 'Pour longtemps'][i % 3]; card.description = 'Des matières naturelles et des détails soignés pour le quotidien.'; card.image!.alt = 'Vases en céramique et branche d’olivier'; }
    if (locale === 'ar') { card.label = ['أشياء مختارة بعناية', 'حياة أكثر هدوءاً', 'صُنعت لتبقى'][i % 3]; card.description = 'مواد طبيعية وتفاصيل مدروسة للحياة اليومية.'; card.image!.alt = 'أوانٍ خزفية وغصن زيتون'; }
  });
  return { blocks: [grid, carousel] as DemoBlock[] };
}
