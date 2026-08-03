import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';

import { AnalyticsService } from '../../analytics/analytics.service';
interface Tetromino {
  shape: number[][];
  color: number;
  x: number;
  y: number;
}

@Component({
  selector: 'app-tetris',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './tetris.html',
  styleUrl: './tetris.css',
})
export class Tetris implements AfterViewInit, OnDestroy {
  @ViewChild('board')
  board!: ElementRef<HTMLCanvasElement>;

  private ctx!: CanvasRenderingContext2D;

  private readonly cols = 10;
  private readonly rows = 20;
  private readonly cellSize = 25;
  private readonly fallSpeed = 500;

  private grid: number[][] = [];
  private current!: Tetromino;

  private gameLoop?: ReturnType<typeof setInterval>;
  private loop: any;

  score = 0;
  gameOver = false;

  private gameStartTime = 0;

  private readonly colors = [
    '#000000',
    '#ef5350',
    '#66bb6a',
    '#42a5f5',
    '#ffee58',
    '#ab47bc',
    '#26c6da',
    '#ffa726',
  ];

  private readonly shapes: number[][][] = [
    // I
    [[1, 1, 1, 1]],

    // O
    [
      [1, 1],
      [1, 1],
    ],

    // T
    [
      [0, 1, 0],
      [1, 1, 1],
    ],

    // J
    [
      [1, 0, 0],
      [1, 1, 1],
    ],

    // L
    [
      [0, 0, 1],
      [1, 1, 1],
    ],

    // Z
    [
      [1, 1, 0],
      [0, 1, 1],
    ],

    // S
    [
      [0, 1, 1],
      [1, 1, 0],
    ],
  ];

 
 constructor(
    private cdr: ChangeDetectorRef,
    private http: HttpClient,
    private analytics: AnalyticsService
  ) {}

  ngAfterViewInit(): void {
    this.analytics.track({ type: 'page_view', path: '/tetris' });

    const context = this.board.nativeElement.getContext('2d');

    if (!context) {
      throw new Error('Canvas context could not be created.');
    }

    this.ctx = context;

    document.addEventListener('keydown', this.handleKey);

    this.start();
  }

  ngOnDestroy(): void {
    this.stopGame();
    document.removeEventListener('keydown', this.handleKey);
  }

  start(): void {
    this.stopGame();

    this.grid = Array.from(
      { length: this.rows },
      () => Array(this.cols).fill(0)
    );

    this.score = 0;
    this.gameOver = false;
  
    this.gameStartTime = Date.now();
    this.analytics.track({ type: 'game_started', game: 'tetris' });

    this.spawnPiece();

    this.draw();

    this.cdr.detectChanges();

    this.gameLoop = setInterval(() => {
      this.tick();
    }, this.fallSpeed);
  }

  restart(): void {
    this.start();
  }

  private stopGame(): void {
    if (this.gameLoop !== undefined) {
      clearInterval(this.gameLoop);
      this.gameLoop = undefined;
    }
  }

  private spawnPiece(): void {
    const id = Math.floor(Math.random() * this.shapes.length);

    const shape = this.shapes[id].map(row => [...row]);

    this.current = {
      shape,
      color: id + 1,
      x: Math.floor((this.cols - shape[0].length) / 2),
      y: 0,
    };

    if (
          this.collides(
            this.current.shape,
            this.current.x,
            this.current.y
          )
        ) {
          this.gameOver = true;

          this.analytics.track({
            type: 'game_ended',
            game: 'tetris',
            score: this.score,
            durationMs: Date.now() - this.gameStartTime,
            cause: 'stack_full',
          });

          this.saveScore();
          clearInterval(this.loop);
          this.cdr.detectChanges();
        }
    
  }

  private tick(): void {
    if (this.gameOver) {
      return;
    }

    if (
      !this.collides(
        this.current.shape,
        this.current.x,
        this.current.y + 1
      )
    ) {
      this.current.y++;
    } else {
      this.lockCurrentPiece();
    }

    this.draw();
  }

  private lockCurrentPiece(): void {
    this.mergePiece();

    const clearedLines = this.clearLines();

    if (clearedLines > 0) {
      this.updateScore(clearedLines);
    }

    this.spawnPiece();
    this.cdr.detectChanges();
  }

  private collides(
    shape: number[][],
    x: number,
    y: number
  ): boolean {
    for (let row = 0; row < shape.length; row++) {
      for (let col = 0; col < shape[row].length; col++) {
        if (shape[row][col] === 0) {
          continue;
        }

        const boardX = x + col;
        const boardY = y + row;

        if (
          boardX < 0 ||
          boardX >= this.cols ||
          boardY >= this.rows
        ) {
          return true;
        }

        if (
          boardY >= 0 &&
          this.grid[boardY][boardX] !== 0
        ) {
          return true;
        }
      }
    }

    return false;
  }

  private mergePiece(): void {
    const { shape, x, y, color } = this.current;

    for (let row = 0; row < shape.length; row++) {
      for (let col = 0; col < shape[row].length; col++) {
        if (shape[row][col] === 0) {
          continue;
        }

        const boardX = x + col;
        const boardY = y + row;

        if (
          boardY >= 0 &&
          boardY < this.rows &&
          boardX >= 0 &&
          boardX < this.cols
        ) {
          this.grid[boardY][boardX] = color;
        }
      }
    }
  }

  private clearLines(): number {
    let clearedLines = 0;

    for (let row = this.rows - 1; row >= 0; row--) {
      const lineIsFull = this.grid[row].every(
        value => value !== 0
      );

      if (lineIsFull) {
        this.grid.splice(row, 1);
        this.grid.unshift(Array(this.cols).fill(0));

        clearedLines++;
        row++;
      }
    }

    return clearedLines;
  }

  private updateScore(clearedLines: number): void {
    switch (clearedLines) {
      case 1:
        this.score += 100;
        break;

      case 2:
        this.score += 300;
        break;

      case 3:
        this.score += 500;
        break;

      case 4:
        this.score += 800;
        break;
    }

    this.cdr.detectChanges();
  }

  private rotate(shape: number[][]): number[][] {
    return shape[0].map((_, columnIndex) =>
      shape
        .map(row => row[columnIndex])
        .reverse()
    );
  }

  private moveDown(): void {
    if (
      !this.collides(
        this.current.shape,
        this.current.x,
        this.current.y + 1
      )
    ) {
      this.current.y++;
    } else {
      this.lockCurrentPiece();
    }
  }

  private hardDrop(): void {
    while (
      !this.collides(
        this.current.shape,
        this.current.x,
        this.current.y + 1
      )
    ) {
      this.current.y++;
    }

    this.lockCurrentPiece();
  }

  handleKey = (event: KeyboardEvent): void => {
    if (this.gameOver) {
      return;
    }

    const controlledKeys = [
      'ArrowLeft',
      'ArrowRight',
      'ArrowDown',
      'ArrowUp',
      ' ',
    ];

    if (controlledKeys.includes(event.key)) {
      event.preventDefault();
    }

    switch (event.key) {
      case 'ArrowLeft':
        if (
          !this.collides(
            this.current.shape,
            this.current.x - 1,
            this.current.y
          )
        ) {
          this.current.x--;
        }
        break;

      case 'ArrowRight':
        if (
          !this.collides(
            this.current.shape,
            this.current.x + 1,
            this.current.y
          )
        ) {
          this.current.x++;
        }
        break;

      case 'ArrowDown':
        this.moveDown();
        break;

      case 'ArrowUp': {
        const rotatedShape = this.rotate(this.current.shape);

        if (
          !this.collides(
            rotatedShape,
            this.current.x,
            this.current.y
          )
        ) {
          this.current.shape = rotatedShape;
        }
        break;
      }

      case ' ':
        this.hardDrop();
        break;
    }

    this.draw();
  };
  control(action: string): void {
    if (this.gameOver) return;

    if (action === 'left') {
      if (!this.collides(this.current.shape, this.current.x - 1, this.current.y)) {
        this.current.x--;
      }
    } else if (action === 'right') {
      if (!this.collides(this.current.shape, this.current.x + 1, this.current.y)) {
        this.current.x++;
      }
    } else if (action === 'down') {
      this.moveDown();
    } else if (action === 'rotate') {
      const rotatedShape = this.rotate(this.current.shape);
      if (!this.collides(rotatedShape, this.current.x, this.current.y)) {
        this.current.shape = rotatedShape;
      }
    } else if (action === 'drop') {
      this.hardDrop();
    }

    this.draw();
  }

  private draw(): void {
    this.drawBackground();
    this.drawGrid();
    this.drawFixedPieces();
    this.drawCurrentPiece();
  }

  private drawBackground(): void {
    this.ctx.fillStyle = '#111111';

    this.ctx.fillRect(
      0,
      0,
      this.cols * this.cellSize,
      this.rows * this.cellSize
    );
  }

  private drawGrid(): void {
    this.ctx.strokeStyle = '#222222';
    this.ctx.lineWidth = 1;

    for (let col = 0; col <= this.cols; col++) {
      this.ctx.beginPath();
      this.ctx.moveTo(col * this.cellSize, 0);
      this.ctx.lineTo(
        col * this.cellSize,
        this.rows * this.cellSize
      );
      this.ctx.stroke();
    }

    for (let row = 0; row <= this.rows; row++) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, row * this.cellSize);
      this.ctx.lineTo(
        this.cols * this.cellSize,
        row * this.cellSize
      );
      this.ctx.stroke();
    }
  }

  private drawFixedPieces(): void {
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const colorId = this.grid[row][col];

        if (colorId !== 0) {
          this.drawCell(
            col,
            row,
            this.colors[colorId]
          );
        }
      }
    }
  }

  private drawCurrentPiece(): void {
    if (!this.current) {
      return;
    }

    const { shape, x, y, color } = this.current;

    for (let row = 0; row < shape.length; row++) {
      for (let col = 0; col < shape[row].length; col++) {
        if (shape[row][col] !== 0) {
          this.drawCell(
            x + col,
            y + row,
            this.colors[color]
          );
        }
      }
    }
  }

  private drawCell(
    x: number,
    y: number,
    color: string
  ): void {
    this.ctx.fillStyle = color;

    this.ctx.fillRect(
      x * this.cellSize + 1,
      y * this.cellSize + 1,  
      this.cellSize - 2,
      this.cellSize - 2
    );

    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    this.ctx.strokeRect(
      x * this.cellSize + 2,
      y * this.cellSize + 2,
      this.cellSize - 4,
      this.cellSize - 4
    );
  }
  private saveScore(): void {
    const token = localStorage.getItem('token');
    if (!token) return;
    this.http.post('https://game-scores-app.onrender.com/api/scores',
      { game: 'tetris', score: this.score },
      { headers: { Authorization: `Bearer ${token}` } }
    ).subscribe({
      next: () => {
        this.analytics.track({
          type: 'score_saved',
          game: 'tetris',
          score: this.score,
        });
        console.log('Tetris score saved successfully.');
      },
      error: (err) => console.error('Error saving Tetris score:', err),
    });
  }
}