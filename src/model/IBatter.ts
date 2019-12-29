import { Team } from './Team';

/**
 * モチベーション
 */
export interface Motivation {
  top: number,
  bottom: number,
}

/**
 * Batter と Pitcher のバッティング時のパラメータ計算
 */
export interface IBatter {
  power: number;
  meet: number;
  run: number;
  mental: number;

  updateBatterSkill(gameStatus: any, offenseTeam: Team, motivation: Motivation): void;
}
