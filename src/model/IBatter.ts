import { Team } from './Team';
import { GameStatus } from './GameStatus';

/**
 * Batter と Pitcher のバッティング & 1stランナー時のパラメータ計算
 */
export interface IBatter {
  order: number;
  power: number;
  meet: number;
  run: number;
  mental: number;
  battingResult: BattingResult;

  /**
   * バッターの能力値＆メンタルを計算して更新
   *
   * @param gameStatus  試合のメタ情報
   * @param offenseTeam 攻撃チーム
   * @param motivation  モチベーション
   */
  updateBatterSkill(gameStatus: GameStatus, offenseTeam: Team, motivation: number): void;

  /**
   * ランナー時の走塁スキルの更新
   */
  updateRunningSkill(): void;

  /**
   * メンタル値の取得
   *
   * @param inning 現在のイニング
   * @param runner ランナー状況
   */
  getMental(inning: number, runner: number): number | Mental;
}

export interface BattingResult {
  box: number;
  atBat: number;
  hit: number;
  double: number;
  triple: number;
  hr: number;
  fourBall: number;
  strikeOut: number;
  batScore: number;
  sacrificeFly: number;
  bunt: number;
  steal: number;
  stealFailed: number;
  error: number;
}

export interface Mental {
  mental: number;
  stamina: number;
}
