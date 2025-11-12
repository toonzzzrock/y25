"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/app/components/Header";
import "./game-fallback.css";

interface GameState {
  gameStarted: boolean;
  gameOver: boolean;
  score: number;
  isJumping: boolean;
  obstacles: Array<{ id: number; x: number; type: 'cactus' | 'bird' }>;
  dinoY: number;
  gameSpeed: number;
}

const INITIAL_STATE: GameState = {
  gameStarted: false,
  gameOver: false,
  score: 0,
  isJumping: false,
  obstacles: [],
  dinoY: 0,
  gameSpeed: 2,
};

export default function GameFallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const gameId = searchParams?.get('gameId');
  const gameName = searchParams?.get('gameName') || 'Unknown Game';
  
  const [gameState, setGameState] = useState<GameState>(INITIAL_STATE);
  const [keys, setKeys] = useState<Set<string>>(new Set());
  
  const gameLoopRef = useRef<number | null>(null);
  const lastObstacleRef = useRef<number>(0);
  const obstacleIdRef = useRef<number>(0);

  const jump = useCallback(() => {
    if (!gameState.isJumping && !gameState.gameOver && gameState.gameStarted) {
      setGameState(prev => ({ ...prev, isJumping: true }));
    }
  }, [gameState.isJumping, gameState.gameOver, gameState.gameStarted]);

  const startGame = useCallback(() => {
    setGameState(prev => ({ 
      ...INITIAL_STATE, 
      gameStarted: true 
    }));
  }, []);

  const resetGame = useCallback(() => {
    setGameState(INITIAL_STATE);
  }, []);

  const goBack = useCallback(() => {
    if (gameId) {
      router.push(`/games/${gameId}`);
    } else {
      router.push('/home');
    }
  }, [router, gameId]);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      setKeys(prev => new Set([...prev, event.code]));
      
      if (event.code === 'Space' || event.code === 'ArrowUp') {
        event.preventDefault();
        if (!gameState.gameStarted) {
          startGame();
        } else {
          jump();
        }
      }
      
      if (event.code === 'Enter' && gameState.gameOver) {
        event.preventDefault();
        resetGame();
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      setKeys(prev => {
        const newKeys = new Set(prev);
        newKeys.delete(event.code);
        return newKeys;
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState.gameStarted, gameState.gameOver, jump, startGame, resetGame]);

  // Game loop
  useEffect(() => {
    if (!gameState.gameStarted || gameState.gameOver) {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
      return;
    }

    const gameLoop = () => {
      setGameState(prev => {
        let newState = { ...prev };

        // Handle jumping physics
        if (newState.isJumping) {
          if (newState.dinoY < 100) {
            newState.dinoY += 6;
          } else {
            newState.dinoY = 100;
            newState.isJumping = false;
          }
        } else if (newState.dinoY > 0) {
          newState.dinoY = Math.max(0, newState.dinoY - 8);
        }

        // Spawn obstacles
        if (Date.now() - lastObstacleRef.current > 3000 + Math.random() * 2500) {
          const obstacleType = Math.random() > 0.6 ? 'bird' : 'cactus';
          newState.obstacles.push({
            id: ++obstacleIdRef.current,
            x: 800,
            type: obstacleType
          });
          lastObstacleRef.current = Date.now();
        }

        // Move obstacles
        newState.obstacles = newState.obstacles
          .map(obstacle => ({ ...obstacle, x: obstacle.x - newState.gameSpeed }))
          .filter(obstacle => obstacle.x > -50);

        // Check collisions
        const dinoRect = { x: 50, y: 160 - newState.dinoY, width: 35, height: 35 };
        
        for (const obstacle of newState.obstacles) {
          const obstacleRect = {
            x: obstacle.x,
            y: obstacle.type === 'bird' ? 120 : 160,
            width: 25,
            height: obstacle.type === 'bird' ? 25 : 35
          };

          if (
            dinoRect.x < obstacleRect.x + obstacleRect.width &&
            dinoRect.x + dinoRect.width > obstacleRect.x &&
            dinoRect.y < obstacleRect.y + obstacleRect.height &&
            dinoRect.y + dinoRect.height > obstacleRect.y
          ) {
            newState.gameOver = true;
            break;
          }
        }

        // Increase score and speed
        if (!newState.gameOver) {
          newState.score += 1;
          newState.gameSpeed = Math.min(4, 2 + newState.score / 2000);
        }

        return newState;
      });

      if (!gameState.gameOver) {
        gameLoopRef.current = requestAnimationFrame(gameLoop);
      }
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState.gameStarted, gameState.gameOver]);

  return (
    <div className="game-fallback-page">
      <Header showSearch={false} />
      
      <main className="fallback-main">
        <div className="fallback-header">
          <h1>Game Not Available</h1>
          <p>Sorry, "{gameName}" is currently unavailable or the game files are missing.</p>
          <p>But don't worry! Here's a fun mini-game while you wait:</p>
        </div>

        <div className="dino-game-container">
          <div className="game-canvas">
            <div 
              className="dino" 
              style={{ 
                bottom: `${gameState.dinoY}px`,
                transform: gameState.isJumping ? 'scaleY(0.8)' : 'scaleY(1)'
              }}
            >
              🦕
            </div>

            {gameState.obstacles.map(obstacle => (
              <div
                key={obstacle.id}
                className={`obstacle ${obstacle.type}`}
                style={{ 
                  left: `${obstacle.x}px`,
                  bottom: obstacle.type === 'bird' ? '80px' : '40px'
                }}
              >
                {obstacle.type === 'cactus' ? '🌵' : '🦅'}
              </div>
            ))}

            <div className="ground"></div>
          </div>

          <div className="game-ui">
            <div className="score">Score: {gameState.score}</div>
            
            {!gameState.gameStarted && (
              <div className="start-screen">
                <h2>Dino Runner</h2>
                <p>Press SPACE or ↑ to jump and start!</p>
                <button onClick={startGame} className="start-button">
                  Start Game
                </button>
              </div>
            )}

            {gameState.gameOver && (
              <div className="game-over-screen">
                <h2>Game Over!</h2>
                <p>Final Score: {gameState.score}</p>
                <p>Press ENTER or click to play again</p>
                <button onClick={resetGame} className="restart-button">
                  Play Again
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="fallback-actions">
          <button onClick={goBack} className="back-button">
            ← Go Back
          </button>
          <button 
            onClick={() => router.push('/home')} 
            className="home-button"
          >
            🏠 Browse Games
          </button>
        </div>

        <div className="fallback-info">
          <h3>Why am I seeing this?</h3>
          <ul>
            <li>The game files may be missing or corrupted</li>
            <li>The game might be undergoing maintenance</li>
            <li>There could be a temporary server issue</li>
          </ul>
          <p>Try refreshing the page or contact support if the problem persists.</p>
        </div>
      </main>
    </div>
  );
}