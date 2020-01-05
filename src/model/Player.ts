export class Player {
  name: string;         // 選手名
  order: number;        // 打順
  condition: number;    // 状態
  position: string;     // 守備ポジション
  power: number;        // 選手パラメータ：パワー
  meet: number;         // 選手パラメータ：ミート
  run: number;          // 選手パラメータ：走力
  defense: number;      // 選手能力パラメータ：守備
  atBat: number;        // 打数
  hit: number;          // ヒット数
  hr: number;           // ホームラン数
  batScore: number;     // 打点
  fourBall: number;     // 四球数
  strikeOut: number;    // 三振数
  bunt: number;         // 犠打数
  steal: number;        // 盗塁数
  error: number;        // エラー数
  mental: number;       // メンタル（試合中に計算される）

  constructor(player) {
    this.name = player.name;
    this.order = player.order;
    this.condition = player.condition;
    this.defense = player.defense;
    this.atBat = player.battingData.atBat;
    this.hit = player.battingData.hit;
    this.hr = player.battingData.hr;
    this.batScore = player.battingData.batScore;
    this.fourBall = player.battingData.fourBall;
    this.strikeOut = player.battingData.strikeOut;
    this.bunt = player.battingData.bunt;
    this.steal = player.battingData.steal;
    this.error = player.battingData.error;
    this.mental = 0;
  }
}
