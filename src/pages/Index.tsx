import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';

interface Character {
  id: number;
  name: string;
  emoji: string;
  hp: number;
  speed: number;
  jump: number;
}

const characters: Character[] = [
  { id: 1, name: 'Cookie Runner', emoji: '🍪', hp: 129, speed: 31, jump: 99 },
  { id: 2, name: 'Choco Knight', emoji: '🍫', hp: 156, speed: 25, jump: 78 },
  { id: 3, name: 'Vanilla Queen', emoji: '🧁', hp: 110, speed: 40, jump: 85 },
  { id: 4, name: 'Mint Master', emoji: '🍬', hp: 142, speed: 35, jump: 92 }
];

interface GameObject {
  x: number;
  y: number;
  type: 'cookie' | 'coin';
  collected: boolean;
}

interface Enemy {
  x: number;
  y: number;
  direction: number;
  emoji: string;
}

const Index = () => {
  const [selectedCharacter, setSelectedCharacter] = useState<Character>(characters[0]);
  const [gameStarted, setGameStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [playerX, setPlayerX] = useState(100);
  const [playerY, setPlayerY] = useState(300);
  const [velocityY, setVelocityY] = useState(0);
  const [isJumping, setIsJumping] = useState(false);
  const [gameObjects, setGameObjects] = useState<GameObject[]>([]);
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [keys, setKeys] = useState<Set<string>>(new Set());
  const [lives, setLives] = useState(3);
  const [isInvulnerable, setIsInvulnerable] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  const GRAVITY = 0.5;
  const JUMP_FORCE = -12;
  const MOVE_SPEED = 5;
  const GROUND_Y = 300;

  useEffect(() => {
    const initialObjects: GameObject[] = [];
    for (let i = 0; i < 20; i++) {
      initialObjects.push({
        x: 200 + i * 150,
        y: Math.random() > 0.5 ? 200 : 280,
        type: Math.random() > 0.5 ? 'cookie' : 'coin',
        collected: false
      });
    }
    setGameObjects(initialObjects);

    const initialEnemies: Enemy[] = [];
    const enemyEmojis = ['👻', '🦇', '🎃', '💀'];
    for (let i = 0; i < 8; i++) {
      initialEnemies.push({
        x: 300 + i * 200,
        y: GROUND_Y,
        direction: Math.random() > 0.5 ? 1 : -1,
        emoji: enemyEmojis[Math.floor(Math.random() * enemyEmojis.length)]
      });
    }
    setEnemies(initialEnemies);
  }, [gameStarted]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    setKeys(prev => new Set(prev).add(e.key));
    
    if ((e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') && !isJumping) {
      setVelocityY(JUMP_FORCE);
      setIsJumping(true);
    }
  }, [isJumping]);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    setKeys(prev => {
      const newKeys = new Set(prev);
      newKeys.delete(e.key);
      return newKeys;
    });
  }, []);

  useEffect(() => {
    if (!gameStarted) return;

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameStarted, handleKeyDown, handleKeyUp]);

  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const gameLoop = setInterval(() => {
      setPlayerY(prevY => {
        const newY = prevY + velocityY;
        if (newY >= GROUND_Y) {
          setIsJumping(false);
          return GROUND_Y;
        }
        return newY;
      });

      setVelocityY(prev => {
        if (playerY >= GROUND_Y) return 0;
        return prev + GRAVITY;
      });

      setPlayerX(prevX => {
        let newX = prevX;
        if (keys.has('ArrowRight') || keys.has('d')) newX += MOVE_SPEED;
        if (keys.has('ArrowLeft') || keys.has('a')) newX -= MOVE_SPEED;
        return Math.max(0, Math.min(700, newX));
      });

      setGameObjects(prevObjects => 
        prevObjects.map(obj => {
          if (obj.collected) return obj;
          
          const distance = Math.sqrt(
            Math.pow(obj.x - playerX, 2) + Math.pow(obj.y - playerY, 2)
          );
          
          if (distance < 40) {
            setScore(prev => prev + (obj.type === 'coin' ? 10 : 5));
            return { ...obj, collected: true };
          }
          
          return obj;
        })
      );

      setEnemies(prevEnemies =>
        prevEnemies.map(enemy => {
          let newX = enemy.x + enemy.direction * 2;
          let newDirection = enemy.direction;
          
          if (newX < 50 || newX > 750) {
            newDirection = -enemy.direction;
            newX = enemy.x + newDirection * 2;
          }
          
          if (!isInvulnerable) {
            const distance = Math.sqrt(
              Math.pow(enemy.x - playerX, 2) + Math.pow(enemy.y - playerY, 2)
            );
            
            if (distance < 45) {
              setLives(prev => {
                const newLives = prev - 1;
                if (newLives <= 0) {
                  setGameOver(true);
                }
                return newLives;
              });
              setIsInvulnerable(true);
              setTimeout(() => setIsInvulnerable(false), 2000);
            }
          }
          
          return { ...enemy, x: newX, direction: newDirection };
        })
      );
    }, 1000 / 60);

    return () => clearInterval(gameLoop);
  }, [gameStarted, gameOver, velocityY, playerY, keys, playerX, isInvulnerable]);

  const startGame = () => {
    setGameStarted(true);
    setGameOver(false);
    setScore(0);
    setLives(3);
    setPlayerX(100);
    setPlayerY(GROUND_Y);
    setVelocityY(0);
    setIsJumping(false);
    setIsInvulnerable(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FF6B9D] to-[#FFD93D] p-8">
      <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Rubik:wght@400;500;700&display=swap" rel="stylesheet" />
      
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8 animate-bounce">
          <h1 className="font-pixel text-4xl md:text-6xl text-[#8B4513] mb-2 drop-shadow-[4px_4px_0px_rgba(0,0,0,0.3)]" style={{
            textShadow: '-3px -3px 0 #fff, 3px -3px 0 #fff, -3px 3px 0 #fff, 3px 3px 0 #fff'
          }}>
            COOKIE RUN
          </h1>
          <h2 className="font-pixel text-2xl text-[#1A1A2E] drop-shadow-lg">KINGDOM</h2>
        </div>

        <Tabs defaultValue="game" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8 bg-white/90 border-4 border-[#8B4513] p-2">
            <TabsTrigger 
              value="game" 
              className="font-pixel text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#FF6B9D] data-[state=active]:to-[#FFD93D] data-[state=active]:text-white border-2 border-[#8B4513]"
            >
              <Icon name="Gamepad2" className="mr-2" size={16} />
              GAME
            </TabsTrigger>
            <TabsTrigger 
              value="characters" 
              className="font-pixel text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#FF6B9D] data-[state=active]:to-[#FFD93D] data-[state=active]:text-white border-2 border-[#8B4513]"
            >
              <Icon name="Users" className="mr-2" size={16} />
              CHARACTERS
            </TabsTrigger>
          </TabsList>

          <TabsContent value="game">
            <Card className="border-4 border-[#8B4513] bg-white/95 shadow-2xl">
              <CardHeader className="bg-gradient-to-r from-[#FF6B9D] to-[#FFD93D] border-b-4 border-[#8B4513]">
                <CardTitle className="font-pixel text-white text-center flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="text-3xl">{selectedCharacter.emoji}</span>
                    <span className="text-sm">{selectedCharacter.name}</span>
                  </span>
                  <span className="flex items-center gap-4">
                    <span className="flex items-center gap-2">
                      <Icon name="Heart" size={20} className="text-red-300" />
                      <span className="text-xl">{lives}</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <Icon name="Trophy" size={20} />
                      <span className="text-xl">{score}</span>
                    </span>
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div 
                  className="relative bg-gradient-to-b from-sky-300 to-sky-100 border-4 border-[#8B4513] overflow-hidden"
                  style={{ height: '400px', width: '100%' }}
                >
                  <div className="absolute bottom-0 w-full h-24 bg-[#8B4513]" />
                  <div className="absolute bottom-24 w-full h-1 bg-[#FFD93D]" />

                  {gameStarted && (
                    <>
                      <div
                        className={`absolute text-5xl transition-all duration-75 ${isInvulnerable ? 'animate-pulse opacity-50' : ''}`}
                        style={{
                          left: `${playerX}px`,
                          top: `${playerY}px`,
                          transform: 'translate(-50%, -50%)'
                        }}
                      >
                        {selectedCharacter.emoji}
                      </div>

                      {gameObjects.map((obj, index) => (
                        !obj.collected && (
                          <div
                            key={index}
                            className="absolute text-3xl animate-float"
                            style={{
                              left: `${obj.x}px`,
                              top: `${obj.y}px`,
                              transform: 'translate(-50%, -50%)'
                            }}
                          >
                            {obj.type === 'cookie' ? '🍪' : '🪙'}
                          </div>
                        )
                      ))}

                      {enemies.map((enemy, index) => (
                        <div
                          key={`enemy-${index}`}
                          className="absolute text-4xl"
                          style={{
                            left: `${enemy.x}px`,
                            top: `${enemy.y}px`,
                            transform: `translate(-50%, -50%) scaleX(${enemy.direction})`
                          }}
                        >
                          {enemy.emoji}
                        </div>
                      ))}
                    </>
                  )}

                  {!gameStarted && !gameOver && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30">
                      <Button
                        onClick={startGame}
                        className="font-pixel text-white text-xl px-8 py-6 bg-gradient-to-r from-[#FF6B9D] to-[#FFD93D] border-4 border-[#8B4513] hover:scale-105 transition-transform shadow-lg"
                      >
                        <Icon name="Play" className="mr-2" />
                        START
                      </Button>
                    </div>
                  )}

                  {gameOver && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80">
                      <div className="text-center">
                        <div className="font-pixel text-6xl text-red-500 mb-4 animate-pulse">GAME OVER</div>
                        <div className="font-pixel text-2xl text-white mb-6">SCORE: {score}</div>
                        <Button
                          onClick={startGame}
                          className="font-pixel text-white text-xl px-8 py-6 bg-gradient-to-r from-[#FF6B9D] to-[#FFD93D] border-4 border-[#8B4513] hover:scale-105 transition-transform shadow-lg"
                        >
                          <Icon name="RotateCcw" className="mr-2" />
                          RESTART
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 font-pixel text-xs">
                  <div className="bg-white border-4 border-[#8B4513] p-3 text-center">
                    <div className="text-[#FF6B9D] mb-1">MOVE</div>
                    <div className="text-[#8B4513]">← → / A D</div>
                  </div>
                  <div className="bg-white border-4 border-[#8B4513] p-3 text-center">
                    <div className="text-[#FF6B9D] mb-1">JUMP</div>
                    <div className="text-[#8B4513]">SPACE / ↑ / W</div>
                  </div>
                  <div className="bg-white border-4 border-[#8B4513] p-3 text-center">
                    <div className="text-[#FFD93D] mb-1">COOKIE</div>
                    <div className="text-[#8B4513]">+5 🍪</div>
                  </div>
                  <div className="bg-white border-4 border-[#8B4513] p-3 text-center">
                    <div className="text-[#FFD93D] mb-1">COIN</div>
                    <div className="text-[#8B4513]">+10 🪙</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="characters">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {characters.map((character) => (
                <Card
                  key={character.id}
                  className={`border-4 border-[#8B4513] cursor-pointer transition-all hover:scale-105 ${
                    selectedCharacter.id === character.id ? 'ring-4 ring-[#FFD93D] shadow-2xl' : 'bg-white/95'
                  }`}
                  onClick={() => setSelectedCharacter(character)}
                >
                  <CardHeader className="bg-gradient-to-br from-[#FF6B9D] to-[#FFD93D] border-b-4 border-[#8B4513]">
                    <CardTitle className="font-pixel text-white flex items-center justify-between text-sm">
                      <span>{character.name}</span>
                      {selectedCharacter.id === character.id && (
                        <Icon name="Crown" className="text-[#FFD93D]" size={20} />
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="text-center mb-4">
                      <div className="text-8xl mb-4 animate-bounce">{character.emoji}</div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 font-pixel text-xs">
                      <div className="bg-gradient-to-b from-red-100 to-red-200 border-4 border-[#8B4513] p-3 text-center">
                        <Icon name="Heart" className="mx-auto mb-2 text-red-500" size={20} />
                        <div className="text-[#8B4513] text-lg">{character.hp}</div>
                        <div className="text-gray-600 text-[8px] mt-1">HP</div>
                      </div>
                      <div className="bg-gradient-to-b from-blue-100 to-blue-200 border-4 border-[#8B4513] p-3 text-center">
                        <Icon name="Zap" className="mx-auto mb-2 text-blue-500" size={20} />
                        <div className="text-[#8B4513] text-lg">{character.speed}</div>
                        <div className="text-gray-600 text-[8px] mt-1">SPEED</div>
                      </div>
                      <div className="bg-gradient-to-b from-yellow-100 to-yellow-200 border-4 border-[#8B4513] p-3 text-center">
                        <Icon name="ArrowUp" className="mx-auto mb-2 text-yellow-600" size={20} />
                        <div className="text-[#8B4513] text-lg">{character.jump}</div>
                        <div className="text-gray-600 text-[8px] mt-1">JUMP</div>
                      </div>
                    </div>
                    <Button
                      onClick={() => {
                        setSelectedCharacter(character);
                        document.querySelector('[value="game"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
                      }}
                      className="w-full mt-4 font-pixel bg-gradient-to-r from-[#FF6B9D] to-[#FFD93D] text-white border-4 border-[#8B4513] hover:scale-105 transition-transform"
                    >
                      <Icon name="Play" className="mr-2" size={16} />
                      PLAY
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;