import { useEffect } from 'react';
import { type CardData } from '../../../utils/cardData';
import { type BoardSlot } from './useGameState';

interface BotAIOptions {
  isPlayerTurn: boolean;
  isLoading: boolean;
  opponentVoluntad: number;
  opponentHand: CardData[];
  opponentBoard: BoardSlot[];
  deck: CardData[];
  setOpponentHand: React.Dispatch<React.SetStateAction<CardData[]>>;
  setDeck: React.Dispatch<React.SetStateAction<CardData[]>>;
  setOpponentVoluntad: React.Dispatch<React.SetStateAction<number>>;
  setOpponentBoard: React.Dispatch<React.SetStateAction<BoardSlot[]>>;
  endTurn: (isPlayer: boolean) => void;
}

export const useBotAI = ({
  isPlayerTurn,
  isLoading,
  opponentVoluntad,
  opponentHand,
  opponentBoard,
  deck,
  setOpponentHand,
  setDeck,
  setOpponentVoluntad,
  setOpponentBoard,
  endTurn
}: BotAIOptions) => {

  useEffect(() => {
    if (isPlayerTurn || isLoading) return;

    const playBotTurn = async () => {
      // 1. Pausa inicial para que se note que es el turno del bot
      await new Promise(r => setTimeout(r, 1000));

      let currentVoluntad = opponentVoluntad;
      let currentDeck = [...deck];
      let currentOpponentHand = [...opponentHand];
      let currentOpponentBoard = [...opponentBoard];

      // 2. El bot roba cartas siempre que pueda
      while (currentVoluntad >= 1 && currentOpponentHand.length < 5 && currentDeck.length > 0) {
        await new Promise(r => setTimeout(r, 800)); // Pausa entre cada carta que roba
        
        const nextCard = currentDeck[0];
        currentOpponentHand.push(nextCard);
        currentDeck = currentDeck.slice(1);
        currentVoluntad -= 1;

        // Actualizamos estado visualmente paso a paso
        setOpponentHand([...currentOpponentHand]);
        setDeck([...currentDeck]);
        setOpponentVoluntad(currentVoluntad);
      }

      // 3. El bot baja cartas a la mesa en los huecos vacíos
      for (let i = 0; i < 3; i++) {
        // Si el hueco está libre, intenta jugar una carta no-joker de su mano
        if (!currentOpponentBoard[i].card) {
          const playableCardIndex = currentOpponentHand.findIndex(card => card.suit !== 'jokers');
          
          if (playableCardIndex !== -1) {
            await new Promise(r => setTimeout(r, 800)); // Retraso visual para ver la colocación
            
            const cardToPlay = currentOpponentHand[playableCardIndex];
            
            // Jugar la carta
            currentOpponentBoard[i] = { card: cardToPlay, stack: [cardToPlay] };
            currentOpponentHand = currentOpponentHand.filter((_, idx) => idx !== playableCardIndex);
            
            // Actualizar estados
            setOpponentBoard([...currentOpponentBoard]);
            setOpponentHand([...currentOpponentHand]);
          }
        }
      }

      // 4. Pequeña pausa antes de terminar turno
      await new Promise(r => setTimeout(r, 1000));

      // 5. Terminar turno del bot
      endTurn(false);
    };

    playBotTurn();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlayerTurn, isLoading]); // Solo dependemos de estos para que no se re-ejecute en bucle
};
