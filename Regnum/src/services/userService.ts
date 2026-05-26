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
  try {
    const response = await fetch('http://localhost:5000/api/leaderboard');
    const data = await response.json();

    if (data.success) {
      // Mapeamos los datos del backend al formato que espera el frontend
      return data.leaderboard.map((user: any, index: number) => ({
        id: user.nombre, // Usamos el nombre como ID si no hay uno único expuesto
        name: user.nombre,
        wins: user.estadisticas?.partidasGanadas || 0,
        rank: index + 1
      }));
    }
    
    throw new Error(data.message || 'Error al obtener ranking');
  } catch (error) {
    console.error('Error fetching rankings:', error);
    return [];
  }
};
/**
 * Actualiza las estadísticas al final de una partida
 */
export const updateMatchStats = async (username: string, result: 'win' | 'lose'): Promise<void> => {
  try {
    await fetch('http://localhost:5000/api/stats/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, result }),
    });
  } catch (error) {
    console.error('Error al actualizar estadísticas:', error);
  }
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
