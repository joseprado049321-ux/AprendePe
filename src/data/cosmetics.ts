export interface AvatarItem {
  id: string;
  name: string;
  emoji: string;
  priceGold: number;
  category: 'Básico' | 'Épico';
}

export interface FrameItem {
  id: string;
  name: string;
  cssClass: string;
  priceEmeralds: number;
  category: 'Básico' | 'Legendario';
}

export const AVATARS: AvatarItem[] = [
  { id: 'av_fox', name: 'Zorro Astuto', emoji: '🦊', priceGold: 500, category: 'Básico' },
  { id: 'av_panda', name: 'Panda Sabio', emoji: '🐼', priceGold: 500, category: 'Básico' },
  { id: 'av_frog', name: 'Rana Saltarina', emoji: '🐸', priceGold: 500, category: 'Básico' },
  { id: 'av_koala', name: 'Koala Relajado', emoji: '🐨', priceGold: 500, category: 'Básico' },
  { id: 'av_unicorn', name: 'Unicornio Mágico', emoji: '🦄', priceGold: 1000, category: 'Épico' },
  { id: 'av_dragon', name: 'Dragón Milenario', emoji: '🐉', priceGold: 1000, category: 'Épico' },
  { id: 'av_trex', name: 'T-Rex Feroz', emoji: '🦖', priceGold: 1000, category: 'Épico' },
  { id: 'av_alien', name: 'Alien Explorador', emoji: '👽', priceGold: 1000, category: 'Épico' },
];

export const FRAMES: FrameItem[] = [
  { id: 'fr_silver', name: 'Borde de Plata', cssClass: 'ring-4 ring-slate-300 shadow-lg shadow-slate-300/50', priceEmeralds: 10, category: 'Básico' },
  { id: 'fr_bronze', name: 'Borde de Bronce', cssClass: 'ring-4 ring-amber-700 shadow-lg shadow-amber-700/50', priceEmeralds: 10, category: 'Básico' },
  { id: 'fr_emerald', name: 'Borde Esmeralda', cssClass: 'ring-4 ring-emerald-400 shadow-lg shadow-emerald-400/50', priceEmeralds: 10, category: 'Básico' },
  { id: 'fr_neon', name: 'Fuego de Neón', cssClass: 'ring-4 ring-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.8)] animate-pulse', priceEmeralds: 25, category: 'Legendario' },
  { id: 'fr_cosmic', name: 'Aura Cósmica', cssClass: 'ring-4 ring-fuchsia-500 shadow-[0_0_20px_rgba(217,70,239,0.8)]', priceEmeralds: 25, category: 'Legendario' },
  { id: 'fr_gold', name: 'Dorado Brillante', cssClass: 'ring-4 ring-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.8)]', priceEmeralds: 25, category: 'Legendario' },
];
