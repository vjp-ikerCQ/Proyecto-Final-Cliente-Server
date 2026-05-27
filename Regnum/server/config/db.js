const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME;

let db;
let isMock = false;

// Generar cartas mock del servidor (equivalente a las de seedCards.js pero formateadas tal como lo haría el de la DB)
function generateMockCards() {
  const suitNames = {
    espadas: 'Espadas',
    copas: 'Copas',
    oros: 'Oros',
    bastos: 'Bastos',
  };

  const roles = [
    { rank: 1, role: 'AS', cost: 5, hp: 10, atkType: 'ESPECIAL' },
    { rank: 2, role: 'ASESINO', cost: 2, hp: 3, atkType: 'OBJETIVO' },
    { rank: 3, role: 'BESTIA', cost: 3, hp: 5, atkType: 'COLUMNA' },
    { rank: 4, role: 'TANQUE', cost: 4, hp: 12, atkType: 'OBJETIVO' },
    { rank: 5, role: 'CLERIGO', cost: 1, hp: 4, atkType: 'SOPORTE' },
    { rank: 6, role: 'CURANDERO', cost: 2, hp: 5, atkType: 'SOPORTE' },
    { rank: 7, role: 'TIRADOR', cost: 4, hp: 4, atkType: 'PERFORAR' },
    { rank: 8, role: 'PICARO', cost: 3, hp: 4, atkType: 'OBJETIVO' },
    { rank: 9, role: 'MAGO', cost: 5, hp: 5, atkType: 'MULTIOBJETIVO' },
    { rank: 10, role: 'SOTA', cost: 5, hp: 6, atkType: 'TACTICO' },
    { rank: 11, role: 'CABALLO', cost: 6, hp: 8, atkType: 'MOVILIDAD' },
    { rank: 12, role: 'REY', cost: 7, hp: 9, atkType: 'DIRECTO' },
  ];

  const suits = ['espadas', 'copas', 'oros', 'bastos'];
  const cards = [];

  suits.forEach(suit => {
    roles.forEach(roleData => {
      let attack = 3 + Math.floor(roleData.rank / 2);
      let effect = '';
      let roleName = roleData.role;

      switch(roleData.rank) {
        case 1:
          if (suit === 'oros') {
            roleName = 'Dragón Rojo';
            attack = 8;
            effect = 'Daño de fuego a las 3 cartas y roba voluntad al usuario rival.';
          } else if (suit === 'copas') {
            roleName = 'Mujer de la Copa';
            attack = 6;
            effect = 'Ataque con veneno al rival y curación a aliados (Carta + Usuario).';
          } else if (suit === 'espadas') {
            roleName = 'Gran Espadachín';
            attack = 9;
            effect = 'Daño en cruz haciendo gran daño a múltiples objetivos.';
          } else if (suit === 'bastos') {
            roleName = 'Troll de Maza';
            attack = 7;
            effect = 'Daño en área a las 3 cartas (no afecta al usuario).';
          }
          break;
        case 2:
          effect = `Daño a carta a elegir${suit === 'oros' ? ' + 1 de voluntad' : ''}.`;
          break;
        case 3:
          if (suit === 'espadas') roleName = 'Perro';
          if (suit === 'bastos') roleName = 'Jabalí';
          if (suit === 'copas') roleName = 'Serpiente';
          if (suit === 'oros') roleName = 'Toro';
          effect = 'Hace daño sólo a la carta del rival que está en su misma columna.';
          break;
        case 4:
          attack = 2;
          effect = `Mucha vida, poco daño elige objetivo${suit === 'oros' ? ' + 1 de voluntad por ataque recibido' : ''}.`;
          break;
        case 5:
          attack = 1;
          effect = 'Pasivo: da 1 de voluntad extra al usuario al final de cada ronda.';
          break;
        case 6:
          attack = 0;
          effect = `Cura a una carta compañera${suit === 'oros' ? ' + 1 de voluntad si cura por completo' : ''}.`;
          break;
        case 7:
          effect = `Atraviesa una carta y al jugador haciendo daño a ambos${suit === 'oros' ? ' + 2 voluntad si elimina carta' : ''}.`;
          break;
        case 8:
          effect = `Daño + ${suit === 'copas' ? 'robo de vida' : suit === 'espadas' ? 'aumento daño siguiente golpe' : suit === 'bastos' ? 'robo de defensa (-1 daño recibido)' : 'robo de voluntad'}.`;
          break;
        case 9:
          effect = 'Daño a 2 objetivos a elegir.';
          break;
        case 10:
          attack = '1/2';
          effect = 'Quita la mitad de vida a la carta rival.';
          break;
        case 11:
          effect = 'Puede atacar al entrar o cambiar de columna gratis, daño de columna.';
          break;
        case 12:
          effect = 'Daño directo al usuario rival.';
          break;
      }

      let calidad = 'Común';
      if (roleData.rank === 12) calidad = 'Legendaria';
      else if (roleData.rank === 11) calidad = 'Épica';
      else if (roleData.rank === 10 || roleData.rank === 9 || roleData.rank === 8) calidad = 'Rara';

      cards.push({
        _id: `${suit}-${roleData.rank}`,
        nombre: `${roleName} de ${suitNames[suit]}`,
        palo: suit,
        numero: roleData.rank,
        calidad: calidad,
        vida: roleData.hp,
        rol: roleName,
        tipo_ataque: roleData.atkType,
        habilidad: {
          voluntad: roleData.cost,
          cantidad: attack,
          efecto: effect
        }
      });
    });
  });

  for (let i = 1; i <= 3; i++) {
    let effect = '';
    let name = '';
    switch(i) {
      case 1: 
        name = 'Joker de Intercambio';
        effect = 'Intercambia 2 cartas de tu mano por 2 aleatorias del rival.';
        break;
      case 2:
        name = 'Joker de Retorno';
        effect = 'Recupera una carta de la mesa para devolverla a la mano.';
        break;
      case 3:
        name = 'Joker de Resurrección';
        effect = 'Recupera una carta aleatoria de la pila de descartes.';
        break;
    }

    cards.push({
      _id: `joker-${i}`,
      nombre: name,
      palo: 'jokers',
      numero: i,
      calidad: 'Mítica',
      vida: 0,
      rol: 'JOKER',
      tipo_ataque: 'ESPECIAL',
      habilidad: {
        voluntad: 1,
        cantidad: 0,
        efecto: effect
      }
    });
  }

  return cards;
}

const mockCardsData = generateMockCards();
const mockUsersData = [
  {
    _id: "admin",
    nombre: "admin",
    contrasena: "admin",
    createdAt: new Date(),
    status: "Activo",
    role: "Admin",
    estadisticas: {
      partidasJugadas: 10,
      partidasGanadas: 7,
      partidasPerdidas: 3,
      tiempoJugado: 120
    }
  }
];
const mockTicketsData = [];

class MockCollection {
  constructor(name, data) {
    this.name = name;
    this.data = data;
  }
  
  find(query = {}, options = {}) {
    let results = [...this.data];
    if (query.palo) {
      results = results.filter(c => c.palo === query.palo.toLowerCase());
    }
    if (query.numero) {
      results = results.filter(c => c.numero === query.numero);
    }
    if (query.estadisticas) {
      results = results.filter(u => u.estadisticas !== undefined);
    }
    
    return {
      sort: (sortObj) => {
        if (sortObj.palo) {
          results.sort((a, b) => {
            if (a.palo !== b.palo) return a.palo.localeCompare(b.palo);
            return a.numero - b.numero;
          });
        } else if (sortObj["estadisticas.partidasGanadas"]) {
          results.sort((a, b) => (b.estadisticas?.partidasGanadas || 0) - (a.estadisticas?.partidasGanadas || 0));
        }
        return {
          limit: (n) => {
            let limitedResults = results.slice(0, n);
            return {
              toArray: async () => limitedResults
            };
          },
          toArray: async () => results
        };
      },
      toArray: async () => results
    };
  }
  
  async findOne(query) {
    if (query.nombre) {
      return this.data.find(u => u.nombre === query.nombre) || null;
    }
    if (query._id) {
      return this.data.find(u => String(u._id) === String(query._id)) || null;
    }
    return null;
  }
  
  async insertOne(doc) {
    doc._id = String(Date.now() + Math.random());
    this.data.push(doc);
    return { insertedId: doc._id };
  }
  
  async updateOne(filter, update) {
    const doc = await this.findOne(filter);
    if (!doc) return { matchedCount: 0, modifiedCount: 0 };
    
    if (update.$set) {
      Object.assign(doc, update.$set);
    }
    if (update.$inc) {
      for (let k in update.$inc) {
        if (k.startsWith('estadisticas.')) {
          const field = k.split('.')[1];
          if (!doc.estadisticas) doc.estadisticas = { partidasJugadas: 0, partidasGanadas: 0, partidasPerdidas: 0, tiempoJugado: 0 };
          doc.estadisticas[field] = (doc.estadisticas[field] || 0) + update.$inc[k];
        } else {
          doc[k] = (doc[k] || 0) + update.$inc[k];
        }
      }
    }
    return { matchedCount: 1, modifiedCount: 1 };
  }
  
  async deleteOne(filter) {
    let index = -1;
    if (filter._id) {
      index = this.data.findIndex(u => String(u._id) === String(filter._id));
    } else if (filter.nombre) {
      index = this.data.findIndex(u => u.nombre === filter.nombre);
    }
    if (index !== -1) {
      this.data.splice(index, 1);
      return { deletedCount: 1 };
    }
    return { deletedCount: 0 };
  }
  
  async aggregate(pipeline) {
    let results = [...this.data];
    const sampleStage = pipeline.find(p => p.$sample);
    if (sampleStage) {
      const size = sampleStage.$sample.size;
      results.sort(() => Math.random() - 0.5);
      results = results.slice(0, size);
    }
    return {
      toArray: async () => results
    };
  }
}

const mockDB = {
  collection: (name) => {
    if (name === 'cartas') return new MockCollection('cartas', mockCardsData);
    if (name === 'usuarios') return new MockCollection('usuarios', mockUsersData);
    if (name === 'tickets') return new MockCollection('tickets', mockTicketsData);
    return new MockCollection(name, []);
  }
};

async function connectDB() {
  if (!uri || uri === 'tu_uri_de_mongodb') {
    console.log('⚠️ MONGODB_URI no está definida o usa la plantilla. Iniciando servidor en MODO DE PRUEBAS SIN BASE DE DATOS (en memoria).');
    db = mockDB;
    isMock = true;
    return;
  }

  try {
    console.log('Intentando conectar a:', uri ? uri.replace(/:.+@/, ':****@') : 'URI NO DEFINIDA');
    const client = new MongoClient(uri);
    await client.connect();
    db = client.db(dbName);
    console.log('✅ Conectado a MongoDB Atlas');
  } catch (error) {
    console.error('❌ Error conectando MongoDB:', error);
    console.log('⚠️ Cambiando a MODO DE PRUEBAS SIN BASE DE DATOS (en memoria) debido al fallo de conexión.');
    db = mockDB;
    isMock = true;
  }
}

function getDB() {
  return db;
}

module.exports = {
  connectDB,
  getDB
};