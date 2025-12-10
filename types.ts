import * as THREE from 'three';

export enum Suit {
  MAJOR = 'MAJOR',
  WANDS = 'WANDS',
  CUPS = 'CUPS',
  SWORDS = 'SWORDS',
  PENTACLES = 'PENTACLES'
}

export enum Language {
  CN = 'zh-CN',
  VN = 'vi-VN'
}

export interface CardData {
  id: number;
  suit: Suit;
  number: number; // 0-21 for Major, 1-14 for Minor
  
  // Localized Data
  name_cn: string;
  name_vn: string;
  
  keywords_cn: string[];
  keywords_vn: string[];
  
  meaning_upright_cn: string;
  meaning_upright_vn: string;
  
  meaning_reversed_cn: string;
  meaning_reversed_vn: string;
}

export interface CardState {
  data: CardData;
  isReversed: boolean;
  isFlipped: boolean;
  position: [number, number, number];
  rotation: [number, number, number];
  uuid: string;
  customTexture?: string; // For AI generated art
}

export interface SpreadPosition {
  id: number;
  x: number;
  y: number;
  z: number;
  rotationZ: number; // For Celtic cross sideways card
  label: string;
}

export interface SpreadDef {
  name: string; // Internal key or default name
  name_cn: string;
  name_vn: string;
  description_cn: string;
  description_vn: string;
  positions: SpreadPosition[];
}

export enum AppState {
  INTRO,
  SHUFFLING,
  DEALING,
  READING
}