import { Routes } from '@angular/router';
import { Register } from './pages/register/register';
import { Login } from './pages/login/login';
import { Home } from './pages/home/home';
import { Snake } from './pages/snake/snake';
import { Tetris } from './pages/tetris/tetris';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'register', component: Register },
  { path: 'login', component: Login },
  { path: 'snake', component: Snake },
  { path: 'tetris', component: Tetris },
];