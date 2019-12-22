import { Player } from '../entity/Player';
import { Play } from './Play';
import { Team } from '../entity/Team';

export class Inning {
  private offenseTeam: Team;        // 攻撃側のチーム
  private defenseTeam: Team;        // 守備側のチーム
  private readonly inning: number;  // 何イニング目か
  private readonly offense: string; // 'top' or 'bottom'
  private runner: number;           // 3bit 表現（例：一三塁 → 101）
  private firstRunner: Player;      // 一塁ランナーのみ盗塁の対象となる（仕様）
  private outCount: number;         // アウトカウント
  private wallOff: number;          // サヨナラ試合フラグ
  private currentScore: any;        // 試合の得点
  order: number;                    // 打順
  score: number;                    // イニング中での得点
  hit: number;                      // イニング中でのヒット数

  constructor(topTeam: Team, botTeam: Team, gameMeta: any) {
    this.inning = gameMeta.inning;
    this.offense = gameMeta.topOrBottom;
    this.order = gameMeta.order;
    this.currentScore = gameMeta.score;
    this.runner = 0;
    this.outCount = 0;
    this.wallOff = 0;
    this.score = 0;
    this.hit = 0;
    this.offenseTeam = this.offense === 'top' ? topTeam : botTeam;
    this.defenseTeam = this.offense === 'top' ? botTeam : topTeam;
  }

  /**
   * イニング全体処理
   */
  doInning() {
    this.playInning();
    this.finalize();
  }

  /**
   * イニング処理 (core)
   */
  private playInning() {

    while (this.outCount < 3) {
      const gameStatus = {
        //inning: inning,
        //offense: offense,
        order: this.order,
        runner: this.runner,            // 3bit で表現（例：一三塁→101）
        firstRunner: this.firstRunner,  // 一塁ランナーのみ盗塁の対象（仕様）
      };

      const play = new Play();
      const playMeta = play.doBatting(this.offenseTeam, this.defenseTeam, gameStatus);

      // サヨナラ
      if (
        this.inning >= 9 &&
        this.offense === 'bottom' &&
        this.currentScore.top < this.currentScore.bottom
      ) {
        this.wallOff = 1;
        return;
      }

      // バッティング結果をイニング結果に合算
      this.order = ++this.order % 9;
      this.score += play.getScore;
      this.outCount = play.outFlg ? this.outCount++ : this.outCount;
      this.hit = play.hit ? this.hit++ : this.hit;
    }
  }

  /**
   * イニング終了処理
   */
  private finalize() {

  }
}
