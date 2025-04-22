
import React, { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";

// Define types
type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";
type Position = { x: number; y: number };

interface GameBoardProps {
  gridSize?: number;
  initialSpeed?: number;
  className?: string;
}

const GameBoard: React.FC<GameBoardProps> = ({
  gridSize = 20,
  initialSpeed = 150,
  className,
}) => {
  // Game state
  const [snake, setSnake] = useState<Position[]>([{ x: 10, y: 10 }]);
  const [food, setFood] = useState<Position>({ x: 5, y: 5 });
  const [direction, setDirection] = useState<Direction>("RIGHT");
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(0);
  const [gameSpeed, setGameSpeed] = useState<number>(initialSpeed);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  
  // Use refs for values needed in event listeners and intervals
  const directionRef = useRef<Direction>(direction);
  const snakeRef = useRef<Position[]>(snake);
  const pausedRef = useRef<boolean>(isPaused);
  const gameOverRef = useRef<boolean>(isGameOver);

  // Update refs when states change
  useEffect(() => {
    directionRef.current = direction;
    snakeRef.current = snake;
    pausedRef.current = isPaused;
    gameOverRef.current = isGameOver;
  }, [direction, snake, isPaused, isGameOver]);

  // Generate random food position
  const generateFood = useCallback((): Position => {
    const newFood = {
      x: Math.floor(Math.random() * gridSize),
      y: Math.floor(Math.random() * gridSize),
    };
    
    // Ensure food doesn't appear on snake
    if (snakeRef.current.some(segment => segment.x === newFood.x && segment.y === newFood.y)) {
      return generateFood();
    }
    
    return newFood;
  }, [gridSize]);

  // Initialize high score from localStorage
  useEffect(() => {
    const savedHighScore = localStorage.getItem("snakeHighScore");
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore));
    }
  }, []);

  // Updating high score in localStorage when it changes
  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem("snakeHighScore", score.toString());
    }
  }, [score, highScore]);

  // Handle keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (gameOverRef.current) return;
      
      // Handle pause
      if (e.key === " " || e.key === "p" || e.key === "P") {
        setIsPaused(prev => !prev);
        return;
      }
      
      // Don't change direction if paused
      if (pausedRef.current) return;
      
      // Prevent 180° turns
      switch (e.key) {
        case "ArrowUp":
        case "w":
        case "W":
          if (directionRef.current !== "DOWN") setDirection("UP");
          break;
        case "ArrowDown":
        case "s":
        case "S":
          if (directionRef.current !== "UP") setDirection("DOWN");
          break;
        case "ArrowLeft":
        case "a":
        case "A":
          if (directionRef.current !== "RIGHT") setDirection("LEFT");
          break;
        case "ArrowRight":
        case "d":
        case "D":
          if (directionRef.current !== "LEFT") setDirection("RIGHT");
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, []);

  // Game loop
  useEffect(() => {
    if (isGameOver) return;
    
    const moveSnake = () => {
      if (pausedRef.current || gameOverRef.current) return;
      
      setSnake(prevSnake => {
        // Create copy of snake
        const newSnake = [...prevSnake];
        
        // Calculating new head position
        const head = { ...newSnake[0] };
        
        // Move head based on direction
        switch (directionRef.current) {
          case "UP":
            head.y -= 1;
            break;
          case "DOWN":
            head.y += 1;
            break;
          case "LEFT":
            head.x -= 1;
            break;
          case "RIGHT":
            head.x += 1;
            break;
        }
        
        // Checking for wall collision
        if (
          head.x < 0 ||
          head.x >= gridSize ||
          head.y < 0 ||
          head.y >= gridSize
        ) {
          setIsGameOver(true);
          gameOverRef.current = true;
          return prevSnake;
        }
        
        // Checking for self collision
        if (newSnake.some(segment => segment.x === head.x && segment.y === head.y)) {
          setIsGameOver(true);
          gameOverRef.current = true;
          return prevSnake;
        }
        
        // Add new head
        newSnake.unshift(head);
        
        // Checking if snake ate food
        if (head.x === food.x && head.y === food.y) {
          // Increase score
          setScore(prev => prev + 1);
          
          // Generate new food
          setFood(generateFood());
          
          // Increasing speed slightly
          setGameSpeed(prev => Math.max(prev * 0.95, 50));
        } else {
          // Remove tail if snake didn't eat
          newSnake.pop();
        }
        
        return newSnake;
      });
    };
    
    // Set up game interval
    const gameInterval = setInterval(moveSnake, gameSpeed);
    
    // Clear interval on cleanup
    return () => clearInterval(gameInterval);
  }, [food, generateFood, gridSize, isGameOver, gameSpeed]);

  // Reset game function
  const resetGame = () => {
    setSnake([{ x: Math.floor(gridSize / 2), y: Math.floor(gridSize / 2) }]);
    setDirection("RIGHT");
    setFood(generateFood());
    setScore(0);
    setGameSpeed(initialSpeed);
    setIsGameOver(false);
    setIsPaused(false);
  };

  return (
    <div className="flex flex-col items-center w-full gap-4">
      {/* Score board */}
      <div className="score-board">
        <div className="score">Score: {score}</div>
        <div className="high-score">High: {highScore}</div>
      </div>
      
      {/* Game container */}
      <div
        className={cn("game-board", className)}
        style={{ 
          width: `${Math.min(gridSize * 16, 480)}px`,
          height: `${Math.min(gridSize * 16, 480)}px`,
          '--grid-size': gridSize,
        } as React.CSSProperties}
      >
        <div className="game-grid h-full w-full">
          {/* Render snake */}
          {snake.map((segment, index) => (
            <div
              key={`snake-${index}`}
              className={index === 0 ? "snake-head" : "snake-segment"}
              style={{
                gridColumn: segment.x + 1,
                gridRow: segment.y + 1,
              }}
            />
          ))}
          
          {/* Render food */}
          <div
            className="food"
            style={{
              gridColumn: food.x + 1,
              gridRow: food.y + 1,
            }}
          />
        </div>
        
        {/* Game over overlay */}
        {isGameOver && (
          <div className="game-over">
            <div className="game-over-text">GAME OVER</div>
            <div className="text-xl mb-4">Score: {score}</div>
            <button className="restart-button" onClick={resetGame}>
              PLAY AGAIN
            </button>
          </div>
        )}
        
        {/* Pause overlay */}
        {isPaused && !isGameOver && (
          <div className="game-over">
            <div className="text-2xl font-bold text-primary mb-4 pulse-animation">PAUSED</div>
            <div className="text-sm mb-4">Press P or Space to continue</div>
          </div>
        )}
      </div>
      
      {/* Game Controls guide */}
      <div className="controls">
        <span className="key">↑</span>
        <span className="key">W</span>
        <span className="mx-1">Up</span>
        <span className="key">↓</span>
        <span className="key">S</span>
        <span className="mx-1">Down</span>
        <span className="key">←</span>
        <span className="key">A</span>
        <span className="mx-1">Left</span>
        <span className="key">→</span>
        <span className="key">D</span>
        <span className="mx-1">Right</span>
        <span className="key">P</span>
        <span className="key">Space</span>
        <span className="mx-1">Pause</span>
      </div>
    </div>
  );
};

export default GameBoard;
