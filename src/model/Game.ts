import { Team } from '../entity/Team';
import { PlayMeta } from './play-meta';
import { TeamController } from '../controller/TeamController';
import { Player } from '../entity/Player';

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
  private inningRecords: any;
  private score: any;
  private motivation: any;
  private mental: number[];

  constructor(times: number, topTeamId: number, botTeamId: number) {
    this.times = times;
    this.topTeamId = topTeamId;
    this.botTeamId = botTeamId;
    this.wallOff = 0;
    this.gameRec       = { top: [], bottom: [] };
    this.scoreBoard    = { top: [], bottom: [] };
    this.hitBoard      = { top: [], bottom: [] };
    this.inningRecords = { top: [], bottom: [] };
    this.score         = { top: 0, bottom: 0 };
    this.motivation    = { top: 0, bottom: 0 };
    this.mental = [0, 0, 0];
  }

  getScoreDiff() {
    return this.score.top - this.score.bottom;
  }

  async playBall() {
    let order = {top: 1, bottom: 1};
    let scoreDiff = {pre: 0, post: 0};
    let count = 0;
    let inning = 1;
    let offense = 'top';

    // データ取得
    const teamTop = new TeamController();
    const teamBot = new TeamController();
    this.topTeam = await teamTop.getTeamData(this.topTeamId, this.times);
    this.botTeam = await teamBot.getTeamData(this.topTeamId, this.times);

    // 試合開始（試合終了の条件になるまでループ）
    while (!(inning >= 9 && offense === 'bottom' && this.score.top < this.score.bottom)) {
      scoreDiff.pre = this.getScoreDiff();

      const gameStatus = {
        inning: inning,
        offense: offense,
        order: order[offense],
        runner: 0,      // 3bit で表現（例：一三塁→101）
      };
      let runPlay = 0;
      let outCount = 0;
      let inningHit = 0;
      let inningScore = 0;
      const inningRec = [];

      while (outCount < 3) {
        const playMeta: PlayMeta = await this.doBatting(gameStatus);

        // サヨナラ
        if (inning >= 9 && offense === 'bottom' && this.score.top < this.score.bottom) {
          this.wallOff = 1;
          break;
        }

        order[offense] %= 9;  // 次の打順をセット
        outCount += playMeta.outCount;

        inningHit += playMeta.battingData.hit;
        inningScore += playMeta.getScore;
        inningRec.push(playMeta);
      }

      // 試合のデータを追加していく
      this.scoreBoard[offense].push(inningScore);
      this.hitBoard[offense].push(inningHit);
      this.inningRecords[offense].push(inningRec);

      // 次のループ用
      count++;
      inning = Math.floor(count / 2 + 1);
      offense = Math.floor(count % 2) ? 'bottom' : 'top';
    }

    // TODO: Update Game Result process
  }

  private async doBatting(gameStatus: any): Promise<PlayMeta> {
    const offenseTeam = gameStatus.offense === 'top' ? this.topTeam : this.botTeam;
    const defenseTeam = gameStatus.offense === 'top' ? this.botTeam : this.topTeam;

    const batter = gameStatus.order === 9 ? offenseTeam.pitchers[0] : offenseTeam.players[gameStatus.order];
    const defender = defenseTeam.players;

    // 【仕様】点差が開くとモチベーション低下www
    const scoreDiff = this.getScoreDiff();
    if (Math.abs(scoreDiff) > 8) {
      this.motivation.top = -2;
      this.motivation.bottom = -1;
    }

    const batterParams = this.getBatterParams(offenseTeam, batter, gameStatus);
    return {
      steal: 0,
      stealPlayer: offenseTeam.players[0],
      getScore: 0,
      outCount: 1,
      error: 1,
      errorPlayer: defenseTeam.players[0],
      wildPitch: 1,
      wildPitcher: defenseTeam.pitchers[0],
      battingData: {
        player: offenseTeam.players[0],
        result: '',
        hit: 1,
        hr: 0,
        batScore: 1,
        strikeOut: 1,
        fourBall: 0,
        bunt: 0,
      },
    }
  }

  private getBatterParams(teamData: Team, batter: any, gameStatus: any) {

    // 投手
    if (batter.hasOwnProperty('pitchingData')) {
      return {
        name: batter.name,
        order: 9,
        power: -5,
        meet: -5,
        run: -5,
        mental: 0,
      };
    }

    // 野手
    else {
      const mental = this.getPlayerMental(batter.condition, gameStatus);
      this.mental[0] = Math.random() * mental * 0.05 + 1;
      this.mental[1] = Math.random() * mental * 0.1  + 1;

      const battingParams = this.getPowerMeetRun(teamData, batter, gameStatus.offense);

      return {
        name: batter.name,
        order: batter.order,
        condition: batter.condition,
        power: batter.power,
        meet: batter.meet,
        run: batter.run,
        defense: batter.defense,
        mental: mental,
      };
    }
  }

  private getPowerMeetRun(teamData: Team, batter: any, offense: string): number[] {
    const tMind = teamData.typeMind;
    const tAttach = teamData.typeAttack;

    const mind = (Math.random() * (10 - tMind) - (10 - tMind) * 0.5) * 0.4;

    // TODO: mental の配列順序の意味を調べる。また、クラスメンバにする必要性についても調査
    const power = batter.power * this.mental[0] + mind + this.motivation[offense];
    const meet  = batter.meet  * this.mental[1] + mind + this.motivation[offense];


    // TODO: このあと実装続く

    return [power, meet, 0];
  }
  /**
   * 野手のメンタル値の取得
   * 【仕様】条件によってメンタルが変わる
   * @param condition
   * @param gameStatus
   */
  private getPlayerMental(condition: number, gameStatus: any): number {
    // TODO: condition が低いとマイナスになってしまうが、それでいいのか？
    //   絶対値を掛けて、プラスにしたほうがいいのでは？ → 直してみた（ドキドキ）
    let mental = condition - 5;

    if (gameStatus.runner >= 10) {
      //mental *= 1.7;
      mental += Math.abs(mental) * 1.7;
    }

    if (gameStatus.inning >= 9) {
      //mental *= 1.5;
      mental += Math.abs(mental) * 1.5;
    }
    else if (gameStatus.inning >= 7) {
      //mental *= 1.2;
      mental += Math.abs(mental) * 1.2;
    }

    return mental;
  }
}
