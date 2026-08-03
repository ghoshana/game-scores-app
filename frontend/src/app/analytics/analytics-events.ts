// The typed event schema — every analytics event the app can emit.
// A discriminated union keyed on `type`, so the compiler enforces
// that each event carries exactly the right payload.

export type GameName = 'snake' | 'tetris';

export interface PageViewProps {
  type: 'page_view';
  path: string;
}

export interface LoginProps {
  type: 'login';
  method: 'password';
}

export interface GameStartedProps {
  type: 'game_started';
  game: GameName;
}

export interface GameEndedProps {
  type: 'game_ended';
  game: GameName;
  score: number;
  durationMs: number;
  cause: 'wall' | 'self' | 'stack_full';
}

export interface ScoreSavedProps {
  type: 'score_saved';
  game: GameName;
  score: number;
}

// The union of every valid event. Add a new event by adding an
// interface above and a member here — the compiler guides the rest.
export type AnalyticsEvent =
  | PageViewProps
  | LoginProps
  | GameStartedProps
  | GameEndedProps
  | ScoreSavedProps;