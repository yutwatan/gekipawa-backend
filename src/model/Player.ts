import { BattingResult } from './IBatter';

export class Player {
  name: string;         // 選手名
  order: number;        // 打順
  condition: number;    // 状態
  position: string;     // 守備ポジション
  power: number;        // 選手パラメータ：パワー
  meet: number;         // 選手パラメータ：ミート
  run: number;          // 選手パラメータ：走力
  defense: number;      // 選手能力パラメータ：守備
  box: number;          // 打席数
  atBat: number;        // 打数
  hit: number;          // ヒット数
  double: number;       // 二塁打数
  triple: number;       // 三塁打数
  hr: number;           // ホームラン数
  batScore: number;     // 打点
  fourBall: number;     // 四球数
  strikeOut: number;    // 三振数
  sacrificeFly: number; // 犠飛数
  bunt: number;         // 犠打数
  steal: number;        // 盗塁数
  stealFailed: number;  // 盗塁死数
  error: number;        // エラー数
  mental: number;       // メンタル（試合中に計算される）
  battingResult: BattingResult; // 試合中の成績を一時的に記録

  constructor(player) {
    this.name = player.name;
    this.order = player.order;
    this.condition = player.condition;
    this.power = player.power;
    this.meet = player.meet;
    this.run = player.run;
    if (player.hasOwnProperty('battingData')) {
      this.defense = player.defense;
      this.box = player.battingData[0].box;
      this.atBat = player.battingData[0].atBat;
      this.hit = player.battingData[0].hit;
      this.double = player.battingData[0].double;
      this.triple = player.battingData[0].triple;
      this.hr = player.battingData[0].hr;
      this.batScore = player.battingData[0].batScore;
      this.fourBall = player.battingData[0].fourBall;
      this.strikeOut = player.battingData[0].strikeOut;
      this.sacrificeFly = player.battingData[0].sacrificeFly;
      this.bunt = player.battingData[0].bunt;
      this.steal = player.battingData[0].steal;
      this.stealFailed = player.battingData[0].stealFailed;
      this.error = player.battingData[0].error;
    }
    this.mental = 0;
    this.battingResult = {
      box: 0,
      atBat: 0,
      hit: 0,
      double: 0,
      triple: 0,
      hr: 0,
      fourBall: 0,
      strikeOut: 0,
      batScore: 0,
      sacrificeFly: 0,
      bunt: 0,
      steal: 0,
      stealFailed: 0,
      error: 0,
    };
  }
}
