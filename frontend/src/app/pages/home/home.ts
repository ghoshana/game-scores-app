import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-home',
  imports: [CommonModule, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  username = '';
  scores: any = {};

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.username = localStorage.getItem('username') || '';
    const token = localStorage.getItem('token');
    if (token) {
      this.http.get('https://game-scores-app.onrender.com/api/scores/mine',
        { headers: { Authorization: `Bearer ${token}` } }
      ).subscribe((res: any) => {
        this.scores = res;
        this.cdr.detectChanges();
      });
    }
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    this.username = '';
    this.scores = {};
    this.cdr.detectChanges();
  }
}