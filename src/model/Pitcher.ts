import { Player } from './Player';
import { Team } from './Team';
import { IBatter, Mental } from './IBatter';
import { GameStatus } from './GameStatus';
import { Position } from '../entity/Enum';

export class Pitcher extends Player implements IBatter {
  position: string;
  speed: number;          // 選手能力パラメータ：速球
  change: number;         // 選手能力パラメータ：変化球
  control: number;        // 選手能力パラメータ：コントロール
  playSpeed: number;      // 試合中のパラメータ：速球
  playChange: number;     // 試合中のパラメータ：変化球
  playControl: number;    // 試合中のパラメータ：コントロール
  win: number;            // 勝利数
  lose: number;           // 敗戦数
  strikeOut: number;      // 奪三振
  fourBall: number;       // 与四球
  hit: number;            // 被安打
  hr: number;             // 被本塁打
  wildPitch: number;      // 暴投数
  outCount: number;       // アウト数
  lossScore: number;      // 失点
  selfLossScore: number;  // 自責点
  pitchingResult: PitchingResult; // ピッチング結果の一時期録用

  constructor(pitcher) {
    super(pitcher);
    this.order = 9;
    this.position = Position.PITCHER;
    this.speed = pitcher.speed;
    this.change = pitcher.change;
    this.control = pitcher.control;
    this.playSpeed = this.speed;
    this.playChange = this.change;
    this.playControl = this.control;
    this.win = pitcher.pitchingData[0].win;
    this.lose = pitcher.pitchingData[0].lose;
    this.strikeOut = pitcher.pitchingData[0].strikeOut;
    this.fourBall = pitcher.pitchingData[0].fourBall;
    this.hit = pitcher.pitchingData[0].hit;
    this.hr = pitcher.pitchingData[0].hr;
    this.wildPitch = pitcher.pitchingData[0].wildPitch;
    this.outCount = pitcher.pitchingData[0].outCount;
    this.lossScore = pitcher.pitchingData[0].lossScore;
    this.selfLossScore = pitcher.pitchingData[0].selfLossScore;
    this.pitchingResult = {
      atBat: 0,
      hit: 0,
      hr: 0,
      fourBall: 0,
      strikeOut: 0,
      wildPitch: 0,
      outCount: 0,
      lossScore: 0,
      selfLossScore: 0,
    }
  }

  /**
   * バッティング時の能力値を更新
   * （投手のときは以下の引数は不要だが、呼び出し側で実態を意識させないために必要）
   *
   * @param gameStatus 試合のメタ情報
   * @param offenseTeam 攻撃チーム
   * @param motivation モチベーション
   */
  updateBatterSkill(gameStatus: GameStatus, offenseTeam: Team, motivation: number): void {
    this.playPower  = -5;
    this.playMeet   = -5;
    this.playRun    = -5;
    this.mental = 0;
  }

  /**
   * 投手の能力パラメータを計算＆更新
   *
   * @param gameStatus 試合のメタ情報
   * @param team 投手の所属チーム
   * @param motivation モチベーション
   */
  updatePitcherSkill(gameStatus: GameStatus, team: Team, motivation: number): void {
    const attr = this.getMental(gameStatus.inning, gameStatus.runner);
    this.mental = attr.mental;

    const speedMental   = Math.random() * attr.mental * 0.05 + attr.stamina;
    const changeMental  = Math.random() * attr.mental * 0.07 + attr.stamina;
    const controlMental = Math.random() * attr.mental * 0.1  + attr.stamina;
    const mind = (Math.random() * (10 - team.typeMind) - (10 - team.typeMind) * 0.5) * 0.4;

    let speed   = this.speed   * speedMental   + mind + motivation;
    let change  = this.change  * changeMental  + mind + motivation;
    let control = this.control * controlMental + mind + motivation;

    // 【仕様】チームパラメータが攻撃的（5以上）の場合は投手の能力値 Up
    if (speed > change) {
      this.playSpeed = speed + (5 - team.typeAttack) * 0.15;
    }
    else {
      this.playChange = change + (5 - team.typeAttack) * 0.1;
    }
    this.playControl = control + (5 - team.typeAttack) * 0.2;
  }

  /**
   * ランナー時の走塁スキルの更新
   */
  updateRunningSkill(): void {
    this.playRun = -5;
  }

  /**
   * 投手のメンタル値の取得
   *
   * @param inning イニング
   * @param runner ランナー状況
   */
  getMental(inning: number, runner: number): Mental {
    let mental = this.condition - 5;
    let stamina = 0;

    if (runner >= 10) {
      mental *= 1.5;
      stamina = 1.0;
    }

    if (inning >= 9) {
      mental *= 1.4;
      stamina = 0.8;
    } else if (inning >= 6) {
      mental *= 1.2;
      stamina = 0.9;
    }

    return {
      mental: mental,
      stamina: stamina,
    };
  }
}

export interface PitchingResult {
  atBat: number;          // 対戦打数の合計
  hit: number;            // 被安打
  hr: number;             // 被本塁打
  fourBall: number;       // 与四球
  strikeOut: number;      // 奪三振
  wildPitch: number;
  outCount: number;       // 打ち取ったアウト数（イニング数の代わり）
  lossScore: number;      // 失点
  selfLossScore: number;  // 自責点
}
