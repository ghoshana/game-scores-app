import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Tetris } from './tetris';

describe('Tetris', () => {
  let component: Tetris;
  let fixture: ComponentFixture<Tetris>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Tetris],
    }).compileComponents();

    fixture = TestBed.createComponent(Tetris);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
