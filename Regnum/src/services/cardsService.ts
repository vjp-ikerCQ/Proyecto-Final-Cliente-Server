import type { CardData } from '../utils/cardData';

export async function fetchCards(): Promise<CardData[]> {
  const response = await fetch('http://localhost:5000/api/cards');
  const data = await response.json();
  if (!data.success) throw new Error(data.message || 'Error al obtener cartas');
  return data.cards;
}
