export type Style = 'natural' | 'formal' | 'literal'

export interface Lang {
  code: string
  name: string
  native: string
  family: string
  script: string
  rtl: boolean
  writing_system: string
  characters: string
  group: string
  glyphs: string
  unspaced: boolean
  translatable?: boolean
}

export interface Capabilities {
  languages: number
  max_chars: number
  llm: boolean
  styles: Record<Style, boolean>
  style_notes: Record<string, string | null>
  context: 'claude' | 'machine'
}

export interface Detection {
  language: Lang
  confidence: number
  band: 'high' | 'medium' | 'low'
  alternatives: { language: Lang; confidence: number }[]
  method: string
  script: { name: string; purity: number; system: string; characters: string; glyphs: string }
  stats: { characters: number; letters: number; words: number }
}

export interface Context {
  kind: 'claude' | 'machine'
  meaning?: string | null
  usage?: string | null
  register?: string | null
  cultural_note?: string | null
  alternatives?: string[]
  back_translation?: string | null
  glosses?: { source: string; gloss: string | null }[]
}

export interface TranslationResult {
  id: string
  created_at: string
  source: Lang & { detected: boolean; confidence: number | null; band: string | null }
  target: Lang
  style: Style
  source_text: string
  translation: string
  provider: string
  context: Context
  profile: {
    family: string
    script: string
    writing_system: string
    characters: string
    direction: string
    stats: { characters: number; letters: number; words: number }
    alternatives: { language: Lang; confidence: number }[]
    method: string | null
  }
  saved: boolean
}

export interface HistoryItem {
  id: string
  created_at: string
  style: Style
  source_text: string
  translation: string
  source: Lang
  target: Lang
}

export interface User {
  id: number
  name: string
  email: string
}

export interface Settings {
  sourceLang: string // 'auto' or code
  targetLang: string
  style: Style
  liveDetect: boolean
  saveHistory: boolean
}
