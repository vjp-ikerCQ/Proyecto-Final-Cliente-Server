// Definiciones de tipos globales para el proyecto Regnum

/**
 * Estadísticas detalladas de un usuario
 */
export interface UserStats {
  gamesPlayed: number;
  gamesWon: number;
  gamesLost: number;
  winRate: string;
  playTime: string;
}

/**
 * Entrada para la tabla de clasificación (Rankings)
 */
export interface RankingEntry {
  id: string;
  name: string;
  wins: number;
  rank: number;
  avatar?: string;
}

/**
 * Información básica del usuario
 */
export interface UserProfile {
  name: string;
  isGuest: boolean;
  stats?: UserStats;
}
