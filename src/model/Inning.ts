import { Play } from './Play';
import { Player } from './Player';
import { Team } from './Team';

export class Inning {
  private readonly offenseTeam: Team;   // 攻撃側のチーム
  private readonly defenseTeam: Team;   // 守備側のチーム
  private readonly inning: number;      // 何イニング目か
  private readonly offense: string;     // 'top' or 'bottom'
  private readonly defense: string;     // 'top' or 'bottom'
  private runner: number;               // 3bit 表現（例：一三塁 → 101）
  private firstRunner: Player;          // 一塁ランナーのみ盗塁の対象となる（仕様）
  private wallOff: number;              // サヨナラ試合フラグ
  private beforeScore: any;             // イニング前の得点 { top: 0, bottom: 0 }
  order: number;                        // 打順
  score: number;                        // イニング中の得点
  hit: number;                          // イニング中でのヒット数
  outCount: number;                     // アウトカウント
  commentary: any;                      // 実況セリフ用データ

  constructor(topTeam: Team, botTeam: Team, gameMeta: any) {
    this.inning = gameMeta.inning;
    this.offense = gameMeta.topOrBottom;
    this.defense = gameMeta.topOrBottom === 'top' ? 'bottom' : 'top';
    this.order = gameMeta.order;
    this.beforeScore = gameMeta.score;
    this.runner = 0;
    this.wallOff = 0;
    this.score = 0;
    this.hit = 0;
    this.outCount = 0;
    this.commentary = '';
    this.offenseTeam = this.offense === 'top' ? topTeam : botTeam;
    this.defenseTeam = this.offense === 'top' ? botTeam : topTeam;
  }

  /**
   * イニング全体処理
   */
  doInning() {
    this.playInning();
    this.setCommentary();
    this.finalize();
  }

  /**
   * イニング処理 (core)
   */
  private playInning() {

    while (this.outCount < 3) {
      const gameStatus = {
        inning: this.inning,
        offense: this.offense,
        defense: this.defense,
        score: this.getCurrentScore(),
        order: this.order,
        runner: this.runner,            // 3bit で表現（例：一三塁→101）
        firstRunner: this.firstRunner,  // 一塁ランナーのみ盗塁の対象（仕様）
      };

      const play = new Play(this.offenseTeam, this.defenseTeam);
      const playMeta = play.doBatting(gameStatus);  // TODO: 返り値を使うか、インスタンス変数使うか悩み中
      this.score += play.getScore;
      this.hit = play.hit ? ++this.hit : this.hit;

      if (play.steal) {
        // TODO: 盗塁時のイニング処理を書く（＝アウトカウントなし）
      }
      else if (play.wildPitch) {
        // TODO: 暴投時のイニング処理を書く（＝JS ではなにもない？？）
      }
      else {
        // TODO: 通常のイニング処理を書く

        // イニング精算
        this.outCount = play.out ? ++this.outCount : this.outCount;
        this.order = ++this.order % 9;
      }

      if (!play.error) {
        // TODO: 自責点の処理を書く
      }

      // サヨナラ
      if (
        this.inning >= 9 &&
        this.offense === 'bottom' &&
        this.beforeScore.top < this.getCurrentScore()
      ) {
        this.wallOff = 1;
        return;
      }

      this.runner = play.runner;
      this.firstRunner = play.firstRunner;
    }
  }

  /**
   * イニング毎の実況セリフ作成用のデータをセット
   */
  private setCommentary() {
    if (this.wallOff) {
      this.commentary.wallOff = true; // サヨナラ
    }
  }

  /**
   * イニング終了処理
   */
  private finalize() {

  }

  /**
   * 現在の攻撃チームの得点を返す
   */
  private getCurrentScore() {
    return this.beforeScore[this.offense] + this.score;
  }
}
