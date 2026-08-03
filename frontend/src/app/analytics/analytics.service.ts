import { Injectable } from '@angular/core';
import posthog from 'posthog-js';
import { AnalyticsEvent } from './analytics-events';

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private initialized = false;

  init(): void {
    if (this.initialized) {
      return;
    }

    posthog.init('phc_oV3tLiUX9yqGizm2rySzkL2ScEjDoFAksDD8BD2YnGRC', {
      api_host: 'https://us.i.posthog.com',

      // We send only our own typed events — no autocaptured
      // clicks/pageviews. This keeps the event stream clean
      // and intentional, which is the whole point.
      autocapture: false,
      capture_pageview: false,
      capture_pageleave: false,
    });

    this.initialized = true;
  }

  // The single typed entry point. `event` must match one of the
  // shapes in AnalyticsEvent, so a malformed event won't compile.
  track(event: AnalyticsEvent): void {
    if (!this.initialized) {
      return;
    }

    const { type, ...properties } = event;
    posthog.capture(type, properties);
  }

  // Ties subsequent events to a known user (call on login).
  identify(userId: string): void {
    if (!this.initialized) {
      return;
    }
    posthog.identify(userId);
  }

  // Clears identity (call on logout).
  reset(): void {
    if (!this.initialized) {
      return;
    }
    posthog.reset();
  }
}