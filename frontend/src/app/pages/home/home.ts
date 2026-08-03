import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AnalyticsService } from '../../analytics/analytics.service';

@Component({
  selector: 'app-home',
  imports: [CommonModule, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  username = '';
  scores: any = {};

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private analytics: AnalyticsService
  ) {}

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

    // Clear the analytics identity so later events aren't
    // attributed to the user who just logged out.
    this.analytics.reset();

    this.cdr.detectChanges();
  }
}