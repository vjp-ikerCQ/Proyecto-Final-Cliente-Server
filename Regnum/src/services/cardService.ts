import { type CardData } from '../utils/cardData';

/**
 * Obtiene la lista completa de cartas desde el backend
 */
export const fetchAllCards = async (): Promise<CardData[]> => {
  try {
    const response = await fetch('http://localhost:5000/api/cards');
    const data = await response.json();

    if (data.success) {
      return data.cards;
    }
    
    throw new Error(data.message || 'Error al obtener cartas');
  } catch (error) {
    console.error('Error fetching cards:', error);
    // En caso de error, devolvemos un array vacío
    return [];
  }
};

/**
 * Obtiene un mazo barajado al azar desde el backend
 */
export const fetchShuffledDeck = async (): Promise<CardData[]> => {
  try {
    const response = await fetch('http://localhost:5000/api/cards/deck');
    const data = await response.json();

    if (data.success) {
      return data.deck;
    }
    
    throw new Error(data.message || 'Error al obtener el mazo barajado');
  } catch (error) {
    console.error('Error fetching shuffled deck:', error);
    return [];
  }
};

/**
 * Obtiene cartas filtradas por palo
 */
export const fetchCardsBySuit = async (suit: string): Promise<CardData[]> => {
    try {
      const response = await fetch(`http://localhost:5000/api/cards?palo=${suit}`);
      const data = await response.json();
  
      if (data.success) {
        return data.cards;
      }
      
      throw new Error(data.message || 'Error al obtener cartas por palo');
    } catch (error) {
      console.error(`Error fetching cards for suit ${suit}:`, error);
      return [];
    }
  };
