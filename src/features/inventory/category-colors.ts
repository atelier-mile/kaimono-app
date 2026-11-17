import type { ItemCategory } from './inventory-context';

export const categoryColors: Record<
  ItemCategory,
  { background: string; text: string; border: string; accent: string }
> = {
  食品: {
    background: '#FFF4D6',
    text: '#72510F',
    border: '#E8CF89',
    accent: '#A97813',
  },
  飲み物: {
    background: '#E3F3FA',
    text: '#235E78',
    border: '#A4D3E4',
    accent: '#3181A1',
  },
  日用品: {
    background: '#F0EAF8',
    text: '#60467D',
    border: '#CDBBDF',
    accent: '#8260A3',
  },
};
