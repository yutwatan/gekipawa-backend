import { IBatter } from './IBatter';

export interface GameStatus {
  inning: number;
  offense: string;
  defense: string;
  motivation: TopBottom<number>;
  score: TopBottom<number>;
  outCount: number;
  order: number;
  runner: number;
  firstRunner: IBatter;
}

export interface TopBottom<T> {
  top: T;
  bottom: T;
}
