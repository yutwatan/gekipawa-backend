import { TeamController } from '../controller/TeamController';
import { Inning, InningResult } from './Inning';
import { Team } from './Team';
import { TopBottom } from './GameStatus';
import { BattingResult } from './IBatter';
import { PitchingResult } from './Pitcher';

export class Game {
  private topTeam: Team;
  private botTeam: Team;
  private nextMotivation: boolean; // 満塁のピンチを無失点で切り抜けると次の回モチベーションUP
  gameRec: TopBottom<GameRecord>;
  scoreBoard: TopBottom<number[]>;
  hitBoard: TopBottom<number[]>;
  outBoard: TopBottom<number[]>;
  inningRecords: TopBottom<any[]>;
  playerResults: TopBottom<BattingResult[]>;
  pitcherResult: TopBottom<PitchingResult>;
  wallOff: boolean;  // サヨナラゲーム

  constructor(
    private times: number,
    private topTeamId: number,
    private botTeamId: number
  ) {
    this.gameRec       = { top: this.initGameRec(), bottom: this.initGameRec() };
    this.scoreBoard    = { top: [], bottom: [] };
    this.hitBoard      = { top: [], bottom: [] };
    this.outBoard      = { top: [], bottom: [] };
    this.inningRecords = { top: [], bottom: [] };
    this.playerResults = { top: [], bottom: [] };
    this.pitcherResult = { top: this.initPitcherResult(), bottom: this.initPitcherResult() };
    this.wallOff = false;
    this.nextMotivation = false;
  }

  /**
   * 試合開始（進行処理）
   */
  async playBall(): Promise<void> {
    let order: TopBottom<number> = {top: 1, bottom: 1};
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
      !(currentInning === 9 && offense === 'bottom' && this.gameRec.top.score < this.gameRec.bottom.score) &&
      !(currentInning > 9 && offense === 'top' && this.gameRec.top.score > this.gameRec.bottom.score)
    ) {

      // イニング処理
      const gameMeta = {
        inning: currentInning,
        offense: offense,
        order: order[offense],
        score: {
          top: this.gameRec.top.score,
          bottom: this.gameRec.bottom.score,
        },
        offenseMotivation: this.nextMotivation,
      };
      console.log('inning = ' + currentInning + '_' + offense);
      const inning = new Inning(this.topTeam, this.botTeam, gameMeta);
      inning.doInning();

      // イニング毎のデータを追加していく
      this.gameRec[offense].score += inning.score;
      this.gameRec[offense].hit += inning.hit;
      this.gameRec[offense].hr += inning.hr;
      this.scoreBoard[offense].push(inning.score);
      this.hitBoard[offense].push(inning.hit);
      this.outBoard[offense].push(inning.outCount);
      this.inningRecords[offense].push(inning.inningResults);
      this.wallOff = inning.inningResults[inning.inningResults.length - 1].wallOff;

      // 満塁のピンチを無失点で切り抜けたら、次の攻撃のモチベーションUP
      this.nextMotivation = inning.runner === 111 && inning.score === 0;

      // 選手の成績を変数にセット
      this.setPlayerResults(inning.inningResults, offense);

      // サヨナラ
      if (this.wallOff) {
        break;
      }

      // 次のループ用
      count++;
      currentInning = Math.floor(count / 2 + 1);
      order[offense] = inning.order;
      offense = Math.floor(count % 2) ? 'bottom' : 'top';
    }

    // 試合の結果を保存
    await this.updateGameResult();
  }

  /**
   * 選手の記録をセット
   *
   * @param inningResults イニングの結果
   * @param offense 表裏 ('top' or 'bottom')
   */
  private setPlayerResults(inningResults: InningResult[], offense: string) {
    for (const inningResult of inningResults) {

      // バッティング結果
      this.playerResults[offense][inningResult.player.order - 1] = inningResult.player.battingResult;

      // ピッチング結果
      const reverseOffense = offense === 'top' ? 'bottom' : 'top';
      this.pitcherResult[reverseOffense] = inningResult.pitcher.pitchingResult;
    }
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

  /**
   * 初期化
   */
  private initGameRec(): GameRecord {
    return {
      score: 0,
      hit: 0,
      hr: 0,
    };
  }

  /**
   * 初期化
   */
  private initPitcherResult(): PitchingResult {
    return {
      atBat: 0,
      hit: 0,
      hr: 0,
      fourBall: 0,
      strikeOut: 0,
      wildPitch: 0,
      outCount: 0,
      lossScore: 0,
      selfLossScore: 0,
    };
  }
}

export interface GameRecord {
  score: number;
  hit: number;
  hr: number;
}
