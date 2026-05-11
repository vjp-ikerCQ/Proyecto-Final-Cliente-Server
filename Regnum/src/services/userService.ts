import type { UserStats } from '../types/index';
import type { RankingEntry } from '../types/index';

/**
 * Servicio para gestionar los datos del usuario y rankings.
 * Actualmente devuelve datos simulados (mock), pero está preparado para ser 
 * reemplazado por llamadas reales a la base de datos (fetch/axios).
 */

/**
 * Obtiene las estadísticas de un usuario específico por su nombre
 */
export const getUserStats = async (username: string): Promise<UserStats> => {
  // Simulación de retraso de red
  await new Promise(resolve => setTimeout(resolve, 500));

  // En el futuro, esto será: return fetch(`/api/stats/${username}`).then(res => res.json());
  return {
    gamesPlayed: 42,
    gamesWon: 28,
    gamesLost: 14,
    winRate: '66%',
    playTime: '12h 45m'
  };
};

/**
 * Obtiene la lista de los mejores jugadores para el ranking
 */
export const getRankings = async (): Promise<RankingEntry[]> => {
  await new Promise(resolve => setTimeout(resolve, 800));

  return [
    { id: '1', name: 'Rey Arturo', wins: 150, rank: 1 },
    { id: '2', name: 'Lancelot', wins: 135, rank: 2 },
    { id: '3', name: 'Morgana', wins: 120, rank: 3 },
    { id: '4', name: 'Ginebra', wins: 95, rank: 4 },
    { id: '5', name: 'Merlín', wins: 88, rank: 5 },
    { id: '6', name: 'Gawain', wins: 72, rank: 6 },
    { id: '7', name: 'Perceval', wins: 65, rank: 7 },
    { id: '8', name: 'Mordred', wins: 50, rank: 8 },
  ];
};
