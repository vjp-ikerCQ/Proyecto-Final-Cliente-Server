/**
 * Interfaz que define la estructura de una carta en el juego Regnum.
 */
export interface CardData {
  id: string;              // Identificador único (ej: "oros-1")
  name: string;            // Nombre completo de la carta
  suit: 'espadas' | 'copas' | 'oros' | 'bastos'; // Palo de la baraja
  rank: number;            // Número de la carta (1-12)
  role: string;            // Rol del personaje (AS, ASESINO, etc.)
  cost: number;            // Coste de Voluntad para jugar la carta
  attack: string | number; // Valor de ataque (puede ser fraccionario como '1/2' para la Sota)
  health: number;          // Puntos de vida (HP)
  attackType: string;      // Tipo de ataque (AREA, OBJETIVO, etc.)
  effect: string;          // Descripción del efecto base o habilidad
  image?: string;          // Ruta a la imagen de la ilustración
}

/**
 * Nombres legibles para los palos de la baraja española
 */
const suitNames = {
  espadas: 'Espadas',
  copas: 'Copas',
  oros: 'Oros',
  bastos: 'Bastos',
};

/**
 * Definición de los roles estándar para cada número de la baraja.
 * Contiene las estadísticas base compartidas por todos los palos.
 */
const roles = [
  { rank: 1, role: 'AS', cost: 9, hp: 10, atkType: 'AREA' },
  { rank: 2, role: 'ASESINO', cost: 2, hp: 2, atkType: 'OBJETIVO' },
  { rank: 3, role: 'BESTIA', cost: 3, hp: 4, atkType: 'COLUMNA' },
  { rank: 4, role: 'TANQUE', cost: 4, hp: 9, atkType: 'OBJETIVO' },
  { rank: 5, role: 'CLERIGO', cost: 0, hp: 4, atkType: 'OBJETIVO' },
  { rank: 6, role: 'CURANDERO', cost: 4, hp: 5, atkType: 'OBJETIVO' },
  { rank: 7, role: 'TIRADOR', cost: 5, hp: 3, atkType: 'PERFORAR' },
  { rank: 8, role: 'PICARO', cost: 4, hp: 3, atkType: 'OBJETIVO' },
  { rank: 9, role: 'MAGO', cost: 6, hp: 4, atkType: 'MULTIOBJETIVO' },
  { rank: 10, role: 'SOTA', cost: 5, hp: 4, atkType: 'OBJETIVO/TACTICO' },
  { rank: 11, role: 'CABALLO', cost: 7, hp: 6, atkType: 'CARGA' },
  { rank: 12, role: 'REY', cost: 8, hp: 7, atkType: 'DIRECTO' },
];

/**
 * Función que genera el mazo completo de 48 cartas.
 * Aplica variaciones específicas según el palo cuando es necesario.
 */
const generateCards = (): CardData[] => {
  const suits: ('espadas' | 'copas' | 'oros' | 'bastos')[] = ['espadas', 'copas', 'oros', 'bastos'];
  const cards: CardData[] = [];

  suits.forEach(suit => {
    roles.forEach(roleData => {
      let attack: string | number = 0;
      let effect = '';

      // Asignar ataque y efectos basados en el número y el palo
      switch(roleData.rank) {
        case 1: 
          attack = suit === 'oros' ? 6 : 8; 
          effect = 'Habilidad legendaria única según el palo'; 
          break;
        case 2: attack = 3; effect = 'Daño directo a carta elegida'; break;
        case 3: attack = 3; effect = 'Daño a la carta de enfrente / Columna'; break;
        case 4: attack = 2; effect = 'Alta vida y protección'; break;
        case 5: attack = 0; effect = 'Genera voluntad pasiva'; break;
        case 6: attack = 0; effect = 'Cura cartas aliadas'; break;
        case 7: attack = 5; effect = 'Atraviesa y daña jugador'; break;
        case 8: attack = 3; effect = 'Daño + robo especial'; break;
        case 9: attack = 5; effect = 'Daño a 2 objetivos'; break;
        case 10: attack = '1/2'; effect = 'Reduce la vida a la mitad o debilita'; break;
        case 11: attack = 5; effect = 'Ataca al entrar y movilidad'; break;
        case 12: attack = 7; effect = 'Gran daño directo al jugador'; break;
      }

      // Añadir la carta generada al mazo
      cards.push({
        id: `${suit}-${roleData.rank}`,
        name: `${roleData.role} de ${suitNames[suit]}`,
        suit: suit,
        rank: roleData.rank,
        role: roleData.role,
        cost: roleData.cost,
        attack: attack,
        health: roleData.hp,
        attackType: roleData.atkType,
        effect: effect,
        image: `/src/assets/images/cards/${suit}_${roleData.rank}.png`
      });
    });
  });

  return cards;
};

// Exportación del mazo completo de 48 cartas generado
export const allCards = generateCards();
