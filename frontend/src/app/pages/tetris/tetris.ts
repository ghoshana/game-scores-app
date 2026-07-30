import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-tetris',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tetris.html',
  styleUrl: './tetris.css',
})
export class Tetris implements AfterViewInit, OnDestroy {
  @ViewChild('board') board!: ElementRef<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D;

  private cols = 10;
  private rows = 20;
  private cell = 25;
  private grid: number[][] = [];
  private current: any;
  private loop: any;
  score = 0;
  gameOver = false;

  private colors = ['#000', '#e33', '#3c3', '#39f', '#fc3', '#c3f', '#3cc', '#f93'];
  private shapes = [
    [[1, 1, 1, 1]],
    [[1, 1], [1, 1]],
    [[0, 1, 0], [1, 1, 1]],
    [[1, 0, 0], [1, 1, 1]],
    [[0, 0, 1], [1, 1, 1]],
    [[1, 1, 0], [0, 1, 1]],
    [[0, 1, 1], [1, 1, 0]],
  ];

  constructor(private cdr: ChangeDetectorRef) {}

  ngAfterViewInit() {
    this.ctx = this.board.nativeElement.getContext('2d')!;
    document.addEventListener('keydown', this.handleKey);
    this.start();
  }

  ngOnDestroy() {
    clearInterval(this.loop);
    document.removeEventListener('keydown', this.handleKey);
  }

  start() {
    this.grid = Array.from({ length: this.rows }, () => Array(this.cols).fill(0));
    this.score = 0;
    this.gameOver = false;
    this.spawn();
    clearInterval(this.loop);
    this.loop = setInterval(() => this.tick(), 500);
    this.cdr.detectChanges();
  }

  restart() { this.start(); }

  private spawn() {
    const id = Math.floor(Math.random() * this.shapes.length);
    this.current = {
      shape: this.shapes[id],
      color: id + 1,
      x: Math.floor(this.cols / 2) - 1,
      y: 0,
    };
    if (this.collides(this.current.shape, this.current.x, this.current.y)) {
      this.gameOver = true;
      clearInterval(this.loop);
      this.cdr.detectChanges();
    }
  }

  private collides(shape: number[][], x: number, y: number): boolean {
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c]) {
          const nx = x + c, ny = y + r;
          if (nx < 0 || nx >= this.cols || ny >= this.rows) return true;
          if (ny >= 0 && this.grid[ny][nx]) return true;
        }
      }
    }
    return false;
  }

  private merge() {
    const { shape, x, y, color } = this.current;
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c]) this.grid[y + r][x + c] = color;
      }
    }
  }

  private clearLines() {
    for (let r = this.rows - 1; r >= 0; r--) {
      if (this.grid[r].every(v => v !== 0)) {
        this.grid.splice(r, 1);
        this.grid.unshift(Array(this.cols).fill(0));
        this.score += 100;
        r++;
      }
    }
  }

  private tick() {
    if (!this.collides(this.current.shape, this.current.x, this.current.y + 1)) {
      this.current.y++;
    } else {
      this.merge();
      this.clearLines();
      this.spawn();
      this.cdr.detectChanges();
    }
    this.draw();
  }

  private rotate(shape: number[][]): number[][] {
    return shape[0].map((_, i) => shape.map(row => row[i]).reverse());
  }

  handleKey = (e: KeyboardEvent) => {
    if (this.gameOver) return;
    if (['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp'].includes(e.key)) e.preventDefault();
    if (e.key === 'ArrowLeft' && !this.collides(this.current.shape, this.current.x - 1, this.current.y)) this.current.x--;
    else if (e.key === 'ArrowRight' && !this.collides(this.current.shape, this.current.x + 1, this.current.y)) this.current.x++;
    else if (e.key === 'ArrowDown' && !this.collides(this.current.shape, this.current.x, this.current.y + 1)) this.current.y++;
    else if (e.key === 'ArrowUp') {
      const r = this.rotate(this.current.shape);
      if (!this.collides(r, this.current.x, this.current.y)) this.current.shape = r;
    }
    this.draw();
  };

  private draw() {
    this.ctx.fillStyle = '#111';
    this.ctx.fillRect(0, 0, this.cols * this.cell, this.rows * this.cell);
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.grid[r][c]) this.drawCell(c, r, this.colors[this.grid[r][c]]);
      }
    }
    if (this.current) {
      const { shape, x, y, color } = this.current;
      for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
          if (shape[r][c]) this.drawCell(x + c, y + r, this.colors[color]);
        }
      }
    }
  }

  private drawCell(x: number, y: number, color: string) {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x * this.cell, y * this.cell, this.cell - 1, this.cell - 1);
  }
}