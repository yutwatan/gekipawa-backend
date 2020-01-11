import { TeamController } from '../controller/TeamController';
import { Inning } from './Inning';
import { Team } from './Team';
import { TopBottom } from './GameStatus';

export class Game {
  private topTeam: Team;
  private botTeam: Team;
  gameRec: TopBottom<any[]>;  // TODO: コレなんだっけ？
  scoreBoard: TopBottom<number[]>;
  hitBoard: TopBottom<number[]>;
  outBoard: TopBottom<number[]>;
  inningRecords: TopBottom<any[]>;
  score: TopBottom<number>;
  wallOff: boolean;  // サヨナラゲーム

  constructor(
    private times: number,
    private topTeamId: number,
    private botTeamId: number
  ) {
    this.gameRec       = { top: [], bottom: [] };
    this.scoreBoard    = { top: [], bottom: [] };
    this.hitBoard      = { top: [], bottom: [] };
    this.outBoard      = { top: [], bottom: [] };
    this.inningRecords = { top: [], bottom: [] };
    this.score         = { top: 0, bottom: 0 };
    this.wallOff = false;
  }

  /**
   * 試合開始（進行処理）
   */
  async playBall(): Promise<void> {
    let order: TopBottom<number> = {top: 1, bottom: 1};
    let scoreDiff = {pre: 0, post: 0};  // これの必要性？
    let count = 0;
    let currentInning = 1;
    let offense = 'top';

    // データ取得
    const teamTop = new TeamController();
    const teamBot = new TeamController();
    this.topTeam = new Team(await teamTop.getTeamData(this.topTeamId, this.times));
    this.botTeam = new Team(await teamBot.getTeamData(this.botTeamId, this.times));

    // 試合開始（試合終了の条件になるまでループ）
    while (
      currentInning < 9 ||
      offense === 'top' ||
      this.score.top >= this.score.bottom
    ) {
      scoreDiff.pre = this.score.top - this.score.bottom;   // TODO: これナンデいるの？

      // イニング処理
      const gameMeta = {
        inning: currentInning,
        offense: offense,
        order: order[offense],
        score: this.score,
      };
      const inning = new Inning(this.topTeam, this.botTeam, gameMeta);
      inning.doInning();

      // イニング毎のデータを追加していく
      this.scoreBoard[offense].push(inning.score);
      this.hitBoard[offense].push(inning.hit);
      this.outBoard[offense].push(inning.outCount);
      this.inningRecords[offense].push(inning.inningResults);
      this.wallOff = inning.inningResults[inning.inningResults.length - 1].wallOff;

      // 次のループ用
      count++;
      currentInning = Math.floor(count / 2 + 1);
      order[offense] = inning.order;
      offense = Math.floor(count % 2) ? 'bottom' : 'top';
      this.score[offense] = inning.score;
    }

    // 試合の結果を保存
    await this.updateGameResult();
  }

  /**
   * 試合の結果を保存
   */
  private async updateGameResult(): Promise<void> {

    // チームデータ & 選手データの更新
    await this.updateTeamAndPlayer();

    // ステータステーブルの更新
    await this.updateCurrentData();

    // News or Comment の更新
    await this.updateCommentNews();

    // 履歴の更新
    await this.updateRecord();
  }

  /**
   * チームデータ & 選手データの更新
   */
  private async updateTeamAndPlayer(): Promise<void> {

  }

  /**
   * ステータステーブルの更新
   */
  private async updateCurrentData(): Promise<void> {

  }

  /**
   * News or Comment の更新
   */
  private async updateCommentNews(): Promise<void> {

  }

  /**
   * 履歴の更新
   */
  private async updateRecord(): Promise<void> {

  }
}
