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
import {
  HttpClient,
  HttpHeaders,
} from '@angular/common/http';

interface Position {
  x: number;
  y: number;
}

interface Particle {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  size: number;
  life: number;
}

@Component({
  selector: 'app-snake',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './snake.html',
  styleUrl: './snake.css',
})
export class Snake implements AfterViewInit, OnDestroy {
  @ViewChild('board')
  board!: ElementRef<HTMLCanvasElement>;

  private ctx!: CanvasRenderingContext2D;

  private readonly gridSize = 20;
  private readonly cellCount = 20;
  private readonly gameSpeed = 220;
  private readonly swipeThreshold = 20;

  private readonly scoreApiUrl =
    'https://game-scores-app.onrender.com/api/scores';

  private snake: Position[] = [];
  private food: Position = {
    x: 15,
    y: 10,
  };

  private direction: Position = {
    x: 1,
    y: 0,
  };

  private nextDirection: Position = {
    x: 1,
    y: 0,
  };

  private gameLoop?: ReturnType<typeof setInterval>;
  private animationFrame?: number;

  private touchStartX = 0;
  private touchStartY = 0;

  score = 0;
  gameOver = false;
  isExploding = false;

  savingScore = false;
  scoreSaved = false;
  scoreSaveError = '';

  constructor(
    private changeDetector: ChangeDetectorRef,
    private http: HttpClient
  ) {}

  ngAfterViewInit(): void {
    const context =
      this.board.nativeElement.getContext('2d');

    if (!context) {
      throw new Error(
        'Unable to create the Snake canvas context.'
      );
    }

    this.ctx = context;

    document.addEventListener(
      'keydown',
      this.handleKey
    );

    const canvas =
      this.board.nativeElement;

    canvas.addEventListener(
      'touchstart',
      this.handleTouchStart,
      {
        passive: true,
      }
    );

    canvas.addEventListener(
      'touchend',
      this.handleTouchEnd,
      {
        passive: false,
      }
    );

    this.start();
  }

  ngOnDestroy(): void {
    this.stopGame();

    if (this.animationFrame !== undefined) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = undefined;
    }

    document.removeEventListener(
      'keydown',
      this.handleKey
    );

    const canvas =
      this.board.nativeElement;

    canvas.removeEventListener(
      'touchstart',
      this.handleTouchStart
    );

    canvas.removeEventListener(
      'touchend',
      this.handleTouchEnd
    );
  }

  start(): void {
    this.stopGame();

    if (this.animationFrame !== undefined) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = undefined;
    }

    this.snake = [
      {
        x: 10,
        y: 10,
      },
    ];

    this.direction = {
      x: 1,
      y: 0,
    };

    this.nextDirection = {
      x: 1,
      y: 0,
    };

    this.score = 0;
    this.gameOver = false;
    this.isExploding = false;

    this.savingScore = false;
    this.scoreSaved = false;
    this.scoreSaveError = '';

    this.generateFood();
    this.draw();

    this.changeDetector.detectChanges();

    this.gameLoop = setInterval(() => {
      this.tick();
    }, this.gameSpeed);
  }

  restart(): void {
    this.start();
  }

  move(
    x: number,
    y: number
  ): void {
    if (
      this.gameOver ||
      this.isExploding
    ) {
      return;
    }

    this.setDirectionIfValid(x, y);
  }

  private handleKey = (
    event: KeyboardEvent
  ): void => {
    const arrowKeys = [
      'ArrowUp',
      'ArrowDown',
      'ArrowLeft',
      'ArrowRight',
    ];

    if (!arrowKeys.includes(event.key)) {
      return;
    }

    event.preventDefault();

    if (
      this.gameOver ||
      this.isExploding
    ) {
      return;
    }

    switch (event.key) {
      case 'ArrowUp':
        this.setDirectionIfValid(0, -1);
        break;

      case 'ArrowDown':
        this.setDirectionIfValid(0, 1);
        break;

      case 'ArrowLeft':
        this.setDirectionIfValid(-1, 0);
        break;

      case 'ArrowRight':
        this.setDirectionIfValid(1, 0);
        break;
    }
  };

  private handleTouchStart = (
    event: TouchEvent
  ): void => {
    const touch =
      event.touches[0];

    if (!touch) {
      return;
    }

    this.touchStartX =
      touch.clientX;

    this.touchStartY =
      touch.clientY;
  };

  private handleTouchEnd = (
    event: TouchEvent
  ): void => {
    if (
      this.gameOver ||
      this.isExploding
    ) {
      return;
    }

    const touch =
      event.changedTouches[0];

    if (!touch) {
      return;
    }

    const deltaX =
      touch.clientX -
      this.touchStartX;

    const deltaY =
      touch.clientY -
      this.touchStartY;

    const absDeltaX =
      Math.abs(deltaX);

    const absDeltaY =
      Math.abs(deltaY);

    if (
      Math.max(
        absDeltaX,
        absDeltaY
      ) < this.swipeThreshold
    ) {
      return;
    }

    event.preventDefault();

    if (absDeltaX > absDeltaY) {
      this.setDirectionIfValid(
        deltaX > 0 ? 1 : -1,
        0
      );
    } else {
      this.setDirectionIfValid(
        0,
        deltaY > 0 ? 1 : -1
      );
    }
  };

  private setDirectionIfValid(
    x: number,
    y: number
  ): void {
    if (
      x !== 0 &&
      this.direction.x === 0
    ) {
      this.nextDirection = {
        x,
        y: 0,
      };

      return;
    }

    if (
      y !== 0 &&
      this.direction.y === 0
    ) {
      this.nextDirection = {
        x: 0,
        y,
      };
    }
  }

  private tick(): void {
    this.direction = {
      ...this.nextDirection,
    };

    const currentHead =
      this.snake[0];

    const newHead: Position = {
      x:
        currentHead.x +
        this.direction.x,

      y:
        currentHead.y +
        this.direction.y,
    };

    if (
      this.hasHitWall(newHead) ||
      this.hasHitSnake(newHead)
    ) {
      this.stopGame();
      this.playExplosion(currentHead);
      return;
    }

    this.snake.unshift(newHead);

    if (this.isEatingFood(newHead)) {
      this.score += 10;
      this.generateFood();
      this.changeDetector.detectChanges();
    } else {
      this.snake.pop();
    }

    this.draw();
  }

  private hasHitWall(
    head: Position
  ): boolean {
    return (
      head.x < 0 ||
      head.x >= this.cellCount ||
      head.y < 0 ||
      head.y >= this.cellCount
    );
  }

  private hasHitSnake(
    head: Position
  ): boolean {
    return this.snake
      .slice(0, -1)
      .some(
        segment =>
          segment.x === head.x &&
          segment.y === head.y
      );
  }

  private isEatingFood(
    head: Position
  ): boolean {
    return (
      head.x === this.food.x &&
      head.y === this.food.y
    );
  }

  private generateFood(): void {
    let newFood: Position;

    do {
      newFood = {
        x: Math.floor(
          Math.random() *
          this.cellCount
        ),

        y: Math.floor(
          Math.random() *
          this.cellCount
        ),
      };
    } while (
      this.snake.some(
        segment =>
          segment.x === newFood.x &&
          segment.y === newFood.y
      )
    );

    this.food = newFood;
  }

  private stopGame(): void {
    if (this.gameLoop !== undefined) {
      clearInterval(this.gameLoop);
      this.gameLoop = undefined;
    }
  }

  private draw(): void {
    this.drawBackground();
    this.drawFood();
    this.drawSnake();
  }

  private drawBackground(): void {
    const canvasSize =
      this.cellCount *
      this.gridSize;

    this.ctx.fillStyle =
      '#020617';

    this.ctx.fillRect(
      0,
      0,
      canvasSize,
      canvasSize
    );
  }

  private drawFood(): void {
    const centerX =
      this.food.x *
        this.gridSize +
      this.gridSize / 2;

    const centerY =
      this.food.y *
        this.gridSize +
      this.gridSize / 2;

    this.ctx.beginPath();

    this.ctx.arc(
      centerX,
      centerY,
      this.gridSize / 2.5,
      0,
      Math.PI * 2
    );

    this.ctx.fillStyle =
      '#ef3939';

    this.ctx.fill();
    this.ctx.closePath();
  }

  private drawSnake(): void {
    this.snake.forEach(
      (segment, index) => {
        this.ctx.fillStyle =
          index === 0
            ? '#8bd18f'
            : '#42a94f';

        this.ctx.fillRect(
          segment.x *
            this.gridSize,

          segment.y *
            this.gridSize,

          this.gridSize - 1,
          this.gridSize - 1
        );
      }
    );
  }

  private playExplosion(
    head: Position
  ): void {
    this.isExploding = true;
    this.changeDetector.detectChanges();

    const explosionX =
      head.x *
        this.gridSize +
      this.gridSize / 2;

    const explosionY =
      head.y *
        this.gridSize +
      this.gridSize / 2;

    const particles: Particle[] =
      Array.from(
        {
          length: 35,
        },
        () => {
          const angle =
            Math.random() *
            Math.PI *
            2;

          const speed =
            1 +
            Math.random() *
              5;

          return {
            x: explosionX,
            y: explosionY,

            velocityX:
              Math.cos(angle) *
              speed,

            velocityY:
              Math.sin(angle) *
              speed,

            size:
              2 +
              Math.random() *
                6,

            life: 1,
          };
        }
      );

    const animate = (): void => {
      this.draw();

      let particlesAlive = false;

      for (
        const particle of particles
      ) {
        if (particle.life <= 0) {
          continue;
        }

        particlesAlive = true;

        particle.x +=
          particle.velocityX;

        particle.y +=
          particle.velocityY;

        particle.velocityX *=
          0.97;

        particle.velocityY *=
          0.97;

        particle.life -=
          0.035;

        this.ctx.save();

        this.ctx.globalAlpha =
          Math.max(
            particle.life,
            0
          );

        this.ctx.fillStyle =
          particle.life > 0.5
            ? '#ffdc55'
            : '#ff5733';

        this.ctx.beginPath();

        this.ctx.arc(
          particle.x,
          particle.y,
          particle.size,
          0,
          Math.PI * 2
        );

        this.ctx.fill();
        this.ctx.restore();
      }

      if (particlesAlive) {
        this.animationFrame =
          requestAnimationFrame(
            animate
          );

        return;
      }

      this.animationFrame =
        undefined;

      this.isExploding =
        false;

      this.gameOver =
        true;

      this.saveScore();
      this.draw();

      this.changeDetector.detectChanges();
    };

    animate();
  }

  private saveScore(): void {
    if (
      this.scoreSaved ||
      this.savingScore
    ) {
      return;
    }

    const token =
      localStorage.getItem('token');

    if (!token) {
      this.scoreSaveError =
        'You must be logged in to save the score.';

      this.changeDetector.detectChanges();
      return;
    }

    this.savingScore = true;
    this.scoreSaveError = '';

    const headers =
      new HttpHeaders({
        Authorization:
          `Bearer ${token}`,
      });

    const body = {
      game: 'snake',
      score: this.score,
    };

    this.http
      .post(
        this.scoreApiUrl,
        body,
        {
          headers,
        }
      )
      .subscribe({
        next: () => {
          this.scoreSaved =
            true;

          this.savingScore =
            false;

          console.log(
            'Snake score saved successfully.'
          );

          this.changeDetector.detectChanges();
        },

        error: error => {
          this.savingScore =
            false;

          this.scoreSaveError =
            error?.error?.message ||
            'The score could not be saved.';

          console.error(
            'Error saving Snake score:',
            error
          );

          this.changeDetector.detectChanges();
        },
      });
  }
}