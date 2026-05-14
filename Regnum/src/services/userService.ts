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
  try {
    const response = await fetch(`http://localhost:5000/api/stats/${username}`);
    const data = await response.json();

    if (data.success) {
      return data.stats;
    }
    
    throw new Error(data.message || 'Error al obtener estadísticas');
  } catch (error) {
    console.error('Error fetching stats:', error);
    // Fallback por defecto si el servidor falla
    return {
      gamesPlayed: 0,
      gamesWon: 0,
      gamesLost: 0,
      winRate: '0%',
      playTime: '0h 0m'
    };
  }
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
/**
 * Elimina la cuenta del usuario actual
 */
export const deleteAccount = async (username: string, password: string): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await fetch('http://localhost:5000/api/delete-account', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ nombre: username, password }),
    });

    return await response.json();
  } catch (error) {
    console.error('Error al eliminar cuenta:', error);
    return { success: false, message: 'No se pudo conectar con el servidor' };
  }
};
