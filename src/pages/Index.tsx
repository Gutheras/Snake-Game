
import React from "react";
import GameBoard from "@/components/GameBoard";

const Index = () => {
  return (
    <div className="arcade-container">
      <h1 className="game-title animate-pulse">SNAKE</h1>
      <GameBoard gridSize={20} initialSpeed={150} />
      <footer className="mt-6 text-xs text-muted-foreground">
        <p>Use arrow keys or <b>WASD</b> to control the snake.</p>
        <p>Press P or Space to pause the game.</p> 
        <p>Designed by Gutheras</p>
      </footer>
    </div>
  );
};

export default Index;
