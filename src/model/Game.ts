import { TeamController } from '../controller/TeamController';
import { Inning } from './Inning';
import { Team } from './Team';

export class Game {
  private readonly times: number;
  private readonly topTeamId: number;
  private readonly botTeamId: number;
  private topTeam: Team;
  private botTeam: Team;
  private wallOff: number;  // サヨナラゲーム
  private gameRec: any;
  private scoreBoard: any;
  private hitBoard: any;
  private outBoard: any;
  private inningRecords: any;
  private score: any;
  private mental: number[];

  constructor(times: number, topTeamId: number, botTeamId: number) {
    this.times = times;
    this.topTeamId = topTeamId;
    this.botTeamId = botTeamId;
    this.wallOff = 0;
    this.gameRec       = { top: [], bottom: [] };
    this.scoreBoard    = { top: [], bottom: [] };
    this.hitBoard      = { top: [], bottom: [] };
    this.outBoard      = { top: [], bottom: [] };
    this.inningRecords = { top: [], bottom: [] };
    this.score         = { top: 0, bottom: 0 };
  }

  async playBall() {
    let order = {top: 1, bottom: 1};
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
        topOrBottom: offense,
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
