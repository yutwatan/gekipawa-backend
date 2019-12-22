import { PlayMeta } from './play-meta';
import { Team } from '../entity/Team';

export class Play {
  private motivation: any;
  outFlg: boolean;
  hit: boolean;
  getScore: number;

  constructor() {
    this.motivation = { top: 0, bottom: 0 };
    this.outFlg = false;
    this.hit = false;
    this.getScore = 0;
  }

  doBatting(offenseTeam: Team, defenseTeam: Team, gameStatus: any): PlayMeta {
    const batter = gameStatus.order === 9 ? offenseTeam.pitchers[0] : offenseTeam.players[gameStatus.order];
    const runner = gameStatus.firstRunner;
    const defender = defenseTeam.players;

    // 【仕様】点差が開くとモチベーション低下www
    const scoreDiff = this.getScoreDiff();
    if (Math.abs(scoreDiff) > 8) {
      this.motivation.top = -2;
      this.motivation.bottom = -1;
    }

    // バッターの能力値＆メンタル計算
    const batterParams = this.getBatterParams(offenseTeam, batter, gameStatus);

    // ランナーの能力値（投手のときは -5）
    const runnerParam = runner.order < 9 ? runner.run : -5;

    // TODO: ここから再開

    // 守備チームの能力値

    // 守備チームの投手の能力値

    // バッティング内容を決めるため各種パラメータ計算

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

  private getScoreDiff() {
    return this.score.top - this.score.bottom;
  }

  /**
   * バッターの能力値＆メンタルの計算
   * @param teamData チームデータ
   * @param batter バッター
   * @param gameStatus ゲームのメタ情報
   */
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

      const battingParams = this.getPowerMeetRun(teamData, batter, gameStatus.offense, mental);

      return {
        name: batter.name,
        order: batter.order,
        condition: batter.condition,
        power: battingParams.power,
        meet: battingParams.meet,
        run: battingParams.run,
        defense: batter.defense,
        mental: mental,
      };
    }
  }

  private getPowerMeetRun(teamData: Team, batter: any, offense: string, mental: number): any {
    const teamMind   = teamData.typeMind;
    const teamAttach = teamData.typeAttack;

    const powerMental = Math.random() * mental * 0.05 + 1;
    const meetMental  = Math.random() * mental * 0.1  + 1;
    const mind = (Math.random() * (10 - teamMind) - (10 - teamMind) * 0.5) * 0.4;

    let power = batter.power * powerMental + mind + this.motivation[offense];
    let meet  = batter.meet  * meetMental  + mind + this.motivation[offense];
    let run   = batter.run;

    // 【仕様】チームパラメータが攻撃的（5以上の場合は Power OR Meet が Up（逆は Down）
    if (power > meet) {
      power += (teamAttach - 5) * 0.2;
    }
    else {
      meet += (teamAttach - 5) * 0.15;
    }

    // 【仕様】Run が 5 以上でチームが攻撃的の場合は Up
    if (run > 4) {
      run += (teamAttach - 5) * 0.1 + this.motivation[offense];
    }

    return {
      power: power,
      meet: meet,
      run: run,
    };
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
