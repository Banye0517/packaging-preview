import type { PedestalColor } from '../app/types'

export const PEDESTAL_COLORS: Record<PedestalColor, string> = {
  morandi: '#c8bee0',
  oatmeal: '#dfd3c3',
  glacier: '#cbe0f2',
  'warm-white': '#eee9df',
  'light-gray': '#dcdde2',
  white: '#f7f8fa',
  'light-yellow': '#f2e5b9',
  'light-pink': '#f3dedf',
}

export interface StagePalette {
  plinth: string
  risers: readonly string[]
}

/**
 * Curated commercial photography palettes:
 * - morandi: Exact match to ref 图1 (crisp white diagonal plinth + Morandi lavender, two-tone sage green, dusty peach)
 * - oatmeal: Warm editorial beige & sand tones
 * - glacier: Clean mother-and-baby sky blue, cloud, and soft mint
 */
export const STAGE_PALETTES: Record<PedestalColor, StagePalette> = {
  morandi: {
    plinth: '#f4f5f8',
    risers: ['#c8bee0', '#a3be9b', '#8eab86', '#ebc6bc', '#c5d6e8'],
  },
  oatmeal: {
    plinth: '#f6f3ed',
    risers: ['#dfd2c0', '#ece4d7', '#d4c3ae', '#edd9cb', '#e5ded4'],
  },
  glacier: {
    plinth: '#f7fafc',
    risers: ['#c9dff2', '#d2ebe3', '#dceaf7', '#e6dff2', '#cfe6ea'],
  },
  'warm-white': {
    plinth: '#f4f1ea',
    risers: ['#eee9df', '#e7e1d5', '#f2ede4', '#eae4d9'],
  },
  'light-gray': {
    plinth: '#f1f2f5',
    risers: ['#dcdde2', '#cfd2d9', '#e4e5e9', '#d5d7de'],
  },
  white: {
    plinth: '#f7f8fa',
    risers: ['#f5f6f8', '#eef0f4', '#f8f9fb', '#f1f3f7'],
  },
  'light-yellow': {
    plinth: '#f8f5ec',
    risers: ['#f2e5b9', '#ebd9a3', '#f6eccb', '#efe0b0'],
  },
  'light-pink': {
    plinth: '#f9f3f4',
    risers: ['#f3dedf', '#ebcfd1', '#f7e6e7', '#efd5d7'],
  },
}
