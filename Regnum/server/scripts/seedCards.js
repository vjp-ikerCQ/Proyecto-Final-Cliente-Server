const { MongoClient } = require('mongodb');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../database.env') });

const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME;

const generateCartas = () => {
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

            // Personalización por rango y palo según el documento
            switch(roleData.rank) {
                case 1: // AS
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
                case 2: // ASESINO
                    effect = `Daño a carta a elegir${suit === 'oros' ? ' + 1 de voluntad' : ''}.`;
                    break;
                case 3: // BESTIA / ANIMAL
                    if (suit === 'espadas') roleName = 'Perro';
                    if (suit === 'bastos') roleName = 'Jabalí';
                    if (suit === 'copas') roleName = 'Serpiente';
                    if (suit === 'oros') roleName = 'Toro';
                    effect = 'Hace daño sólo a la carta del rival que está en su misma columna.';
                    break;
                case 4: // TANQUE
                    attack = 2;
                    effect = `Mucha vida, poco daño elige objetivo${suit === 'oros' ? ' + 1 de voluntad por ataque recibido' : ''}.`;
                    break;
                case 5: // CLERIGO
                    attack = 1;
                    effect = 'Pasivo: da 1 de voluntad extra al usuario al final de cada ronda.';
                    break;
                case 6: // CURANDERO
                    attack = 0;
                    effect = `Cura a una carta compañera${suit === 'oros' ? ' + 1 de voluntad si cura por completo' : ''}.`;
                    break;
                case 7: // TIRADOR
                    effect = `Atraviesa una carta y al jugador haciendo daño a ambos${suit === 'oros' ? ' + 2 voluntad si elimina carta' : ''}.`;
                    break;
                case 8: // PICARO
                    effect = `Daño + ${suit === 'copas' ? 'robo de vida' : suit === 'espadas' ? 'aumento daño siguiente golpe' : suit === 'bastos' ? 'robo de defensa (-1 daño recibido)' : 'robo de voluntad'}.`;
                    break;
                case 9: // MAGO
                    effect = 'Daño a 2 objetivos a elegir.';
                    break;
                case 10: // SOTA
                    attack = '1/2';
                    effect = 'Quita la mitad de vida a la carta rival.';
                    break;
                case 11: // CABALLO
                    effect = 'Puede atacar al entrar o cambiar de columna gratis, daño de columna.';
                    break;
                case 12: // REY
                    effect = 'Daño directo al usuario rival.';
                    break;
            }

            // Calidad
            let calidad = 'Común';
            if (roleData.rank === 12) calidad = 'Legendaria';
            else if (roleData.rank === 11) calidad = 'Épica';
            else if (roleData.rank === 10 || roleData.rank === 9 || roleData.rank === 8) calidad = 'Rara';

            cards.push({
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

    // Jokers
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
};

const cartas = generateCartas();

async function seedDB() {
    const client = new MongoClient(uri);

    try {
        await client.connect();
        console.log('✅ Conectado a MongoDB para seed');
        const db = client.db(dbName);

        // Limpiar colección existente
        await db.collection('cartas').deleteMany({});
        console.log('🗑️ Colección de cartas limpiada');

        // Insertar cartas
        const result = await db.collection('cartas').insertMany(cartas);
        console.log(`✨ ${result.insertedCount} cartas insertadas correctamente`);

    } catch (error) {
        console.error('❌ Error en el seed:', error);
    } finally {
        await client.close();
        process.exit();
    }
}

seedDB();
