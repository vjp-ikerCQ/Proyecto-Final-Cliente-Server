const { getDB } = require('../config/db');

const getCards = async (req, res) => {
    try {
        const db = getDB();
        
        if (!db) {
            console.error('Database not connected');
            return res.status(503).json({
                success: false,
                message: 'El servidor no está conectado a la base de datos'
            });
        }

        // 1. Construir filtros opcionales basados en lo que pida el frontend
        // Ej: GET /api/cards?palo=oros&numero=4
        const query = {};
        
        if (req.query.palo) {
            query.palo = req.query.palo.toLowerCase();
        }
        
        if (req.query.numero) {
            // Aseguramos que sea número entero ya que en mongo es un integer
            query.numero = parseInt(req.query.numero, 10); 
        }

        // 2. Buscar en la colección 'cartas', clasificado (ordenado) por palo y numero
        const cartas = await db.collection('cartas')
            .find(query)
            .sort({ palo: 1, numero: 1 })
            .toArray();

        // 3. Procesar las cartas para agregarles el campo de imagen faltante
        // Y mapear los campos al formato que espera el frontend (CardData)
        const cartasFormateadas = cartas.map(carta => {
            const paloFormateado = carta.palo ? carta.palo.toLowerCase() : 'desconocido';
            let imageUrl = '';
            
            // Lógica para deducir la ruta de la imagen
            const CLOUDINARY_BASE = 'https://res.cloudinary.com/drvgncidb/image/upload/v1778854628/Assets/Folders/Home/regnumhollow/Cards';
            if (paloFormateado === 'jokers' || paloFormateado === 'joker') {
                imageUrl = `${CLOUDINARY_BASE}/joker_${carta.numero}.png`;
            } else {
                imageUrl = `${CLOUDINARY_BASE}/${paloFormateado}_${carta.numero}.png`;
            }

            // Adaptamos las propiedades de la BD (español) a las que usa el frontend (inglés)
            return {
                ...carta, // Mantenemos los datos originales por si acaso
                id: carta._id.toString(),
                name: carta.nombre,
                suit: paloFormateado === 'joker' ? 'jokers' : paloFormateado, // El frontend usa 'jokers' en plural
                role: carta.calidad,
                rank: carta.numero,
                cost: carta.habilidad?.voluntad || 0,
                attack: carta.habilidad?.cantidad || 0,
                health: carta.vida || 0,
                effect: carta.habilidad?.efecto || '',
                image: carta.imagen_url || imageUrl
            };
        });

        // 4. Clasificar/Agrupar las cartas por palo para facilitar su uso si es necesario
        const cartasClasificadas = cartasFormateadas.reduce((acc, carta) => {
            const palo = carta.suit;
            if (!acc[palo]) acc[palo] = [];
            acc[palo].push(carta);
            return acc;
        }, {});

        return res.json({
            success: true,
            count: cartasFormateadas.length,
            cards: cartasFormateadas,        // Array plano pero ordenado
            classified: cartasClasificadas   // Objeto clasificado/agrupado por palo
        });

    } catch (error) {
        console.error("💥 ERROR EN GET CARDS:", error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

const getShuffledDeck = async (req, res) => {
    try {
        const db = getDB();
        
        if (!db) {
            console.error('Database not connected');
            return res.status(503).json({
                success: false,
                message: 'El servidor no está conectado a la base de datos'
            });
        }

        // Obtener las cartas ordenadas aleatoriamente usando $sample directamente desde MongoDB
        // Tomamos hasta 100 cartas para asegurarnos de que vienen todas las del mazo
        const cartas = await db.collection('cartas')
            .aggregate([{ $sample: { size: 100 } }])
            .toArray();

        const cartasFormateadas = cartas.map(carta => {
            const paloFormateado = carta.palo ? carta.palo.toLowerCase() : 'desconocido';
            let imageUrl = '';
            
            if (carta.image && (carta.image.startsWith('http') || carta.image.startsWith('https'))) {
                imageUrl = carta.image;
            } else if (paloFormateado === 'jokers' || paloFormateado === 'joker') {
                imageUrl = `https://res.cloudinary.com/drvgncidb/image/upload/v1/Assets/Folders/Home/regnumhollow/Cards/joker_${carta.numero}.png`;
            } else {
                imageUrl = `https://res.cloudinary.com/drvgncidb/image/upload/v1/Assets/Folders/Home/regnumhollow/Cards/${paloFormateado}_${carta.numero}.png`;
            }

            return {
                ...carta,
                id: carta._id.toString(),
                name: carta.nombre,
                suit: paloFormateado === 'joker' ? 'jokers' : paloFormateado,
                role: carta.calidad,
                rank: carta.numero,
                cost: carta.habilidad?.voluntad || 0,
                attack: carta.habilidad?.cantidad || 0,
                health: carta.vida || 0,
                effect: carta.habilidad?.efecto || '',
                image: imageUrl
            };
        });

        return res.json({
            success: true,
            count: cartasFormateadas.length,
            deck: cartasFormateadas
        });

    } catch (error) {
        console.error("💥 ERROR EN GET SHUFFLED DECK:", error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

module.exports = {
    getCards,
    getShuffledDeck
};
