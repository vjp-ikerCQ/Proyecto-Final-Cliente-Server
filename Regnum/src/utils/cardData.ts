export interface CardData {
  id: string;
  name: string;
  suit: 'espadas' | 'copas' | 'oros' | 'bastos';
  rank: number;
  role: string;
  cost: number;
  attack: string | number;
  health: number;
  attackType: string;
  effect: string;
  image?: string;
}

const suitNames = {
  espadas: 'Espadas',
  copas: 'Copas',
  oros: 'Oros',
  bastos: 'Bastos',
};

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

const generateCards = (): CardData[] => {
  const suits: ('espadas' | 'copas' | 'oros' | 'bastos')[] = ['espadas', 'copas', 'oros', 'bastos'];
  const cards: CardData[] = [];

  suits.forEach(suit => {
    roles.forEach(roleData => {
      let attack: string | number = 0;
      let effect = '';

      // Set attack based on role and suit
      switch(roleData.rank) {
        case 1: attack = suit === 'oros' ? 6 : 8; effect = 'Habilidad legendaria única según el palo'; break;
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

export const allCards = generateCards();
