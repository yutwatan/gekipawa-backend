import { TeamController } from '../controller/TeamController';
import { Inning } from './Inning';
import { Team } from './Team';
import { TopBottom } from './GameStatus';

export class Game {
  private topTeam: Team;
  private botTeam: Team;
  private wallOff: number;  // サヨナラゲーム
  private gameRec: TopBottom<any[]>;
  private scoreBoard: TopBottom<number[]>;
  private hitBoard: TopBottom<number[]>;
  private outBoard: TopBottom<number[]>;
  private inningRecords: TopBottom<any[]>;
  private score: TopBottom<number>;
  private mental: number[];

  constructor(
    private times: number,
    private topTeamId: number,
    private botTeamId: number
  ) {
    this.wallOff = 0;
    this.gameRec       = { top: [], bottom: [] };
    this.scoreBoard    = { top: [], bottom: [] };
    this.hitBoard      = { top: [], bottom: [] };
    this.outBoard      = { top: [], bottom: [] };
    this.inningRecords = { top: [], bottom: [] };
    this.score         = { top: 0, bottom: 0 };
  }

  async playBall() {
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
      this.inningRecords[offense].push(inning);

      // 次のループ用
      count++;
      currentInning = Math.floor(count / 2 + 1);
      order[offense] = inning.order;
      offense = Math.floor(count % 2) ? 'bottom' : 'top';
    }

    // TODO: Update Game Result process
  }
}
