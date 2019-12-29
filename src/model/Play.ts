import { Team } from './Team';
import { Pitcher } from './Pitcher';
import { Player } from './Player';
import { Batter } from './Batter';
import { IBatter, Motivation } from './IBatter';

export class Play {
  private offenseTeam: Team;
  private defenseTeam: Team;
  private motivation: Motivation;
  runner: number;
  firstRunner: Player;
  pitcher: Pitcher;
  steal: boolean;
  stealPlayer: Player;
  getScore: number;
  out: boolean;
  error: boolean;
  errorPlayer: Player;
  wildPitch: boolean;
  wildPitcher: Pitcher;
  batter: IBatter;
  batting: string;
  hit: boolean;
  hr: boolean;
  batScore: number;
  strikeOut: boolean;
  fourBall: boolean;
  bunt: boolean;

  constructor(offenseTeam: Team, defenseTeam: Team) {
    this.offenseTeam = offenseTeam;
    this.defenseTeam = defenseTeam;
    this.motivation = { top: 0, bottom: 0 };
    this.steal = false;
    this.getScore = 0;
    this.out = false;
    this.error = false;
    this.wildPitch = false;
    this.batting = '';
    this.hit = false;
    this.hr = false;
    this.batScore = 0;
    this.strikeOut = false;
    this.fourBall = false;
    this.bunt = false;
  }

  /**
   * バッティング（対戦）処理
   *
   * @param gameStatus 試合のメタ情報
   */
  doBatting(gameStatus: any): PlayMeta {
    const offense = gameStatus.offense;
    const defense = gameStatus.defense;

    if (gameStatus.order === 9) {
      this.batter = new Pitcher(this.offenseTeam.pitchers[0]);
    }
    else {
      this.batter = new Batter(this.offenseTeam.players[gameStatus.order]);
    }
    this.runner = gameStatus.runner;
    this.firstRunner = gameStatus.firstRunner;
    this.pitcher = this.defenseTeam.pitchers[0];
    const defender = this.defenseTeam.players;

    // モチベーション設定
    this.setMotivation(gameStatus.score, offense);

    // バッターの能力値＆メンタル更新
    this.batter.updateBatterSkill(gameStatus, this.offenseTeam, this.motivation);

    // ランナーの能力値更新（投手のときは run = -5）
    this.firstRunner.updateSkill();

    // 守備チームの能力値 TODO: ここも更新でいけるハズ・・・
    const defenseTeamParams = this.defenseTeam.getDefenseParams(this.motivation[defense]);
    const defensePosition = this.defenseTeam.getPlayersByPosition();

    // 守備チームの投手の能力値更新
    this.pitcher.updatePitcherSkill(this.defenseTeam, gameStatus, this.motivation[defense]);

    // バッティング内容を決めるため各種パラメータ計算
    const pSteal = this.getStealParams(defensePosition);        // 盗塁
    const pWildPitch = this.getWildPitchParam(defensePosition); // 暴投
    const pStrikeOut = this.getStrikeOutParam();                // 三振
    const pFourBall = this.getFourBallParam();                  // 四球
    // TODO: ここから再開

    return {
      steal: 0,
      stealPlayer: this.offenseTeam.players[0],
      getScore: 0,
      outCount: 1,
      error: 1,
      errorPlayer: this.defenseTeam.players[0],
      wildPitch: 1,
      wildPitcher: this.defenseTeam.pitchers[0],
      battingData: {
        player: this.offenseTeam.players[0],
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

  /**
   * 盗塁に関する2つのパラメータの計算
   *
   * @param defensePosition 守備毎の選手データ
   */
  private getStealParams(defensePosition: any): any {
    const runner  = this.firstRunner;
    const pitcher = this.pitcher;

    // 盗塁を試みるパラメータ
    let runSkill = Math.pow(runner.run, 1.6) - runner.power;
    let defenseSkill = pitcher.speed * 0.5 - pitcher.change * 0.5 +
      pitcher.defense * 0.5 + defensePosition.catcher.defense * 0.5;
    const param1 = runSkill - defenseSkill + this.offenseTeam.typeSteal * 1.5;

    // 盗塁の成否を判定するパラメータ
    runSkill = runner.run * 1.5 - runner.power * 0.5;
    defenseSkill = pitcher.speed * 0.2 - pitcher.change * 0.2 +
      pitcher.defense * 0.3 + defensePosition.catcher.defense * 0.7;
    const param2 = runSkill - defenseSkill + 55;

    return {
      start: param1,
      success: param2,
    };
  }

  /**
   * 暴投を判定するパラメータの計算
   *
   * @param defensePosition 守備毎の選手データ
   */
  private getWildPitchParam(defensePosition: any): number {
    return this.pitcher.speed * 0.5 + this.pitcher.change * 1.5 -
      this.pitcher.control - defensePosition.catcher.defense;
  }

  /**
   * 三振を判定するパラメータの計算
   */
  private getStrikeOutParam() {
    const batter  = this.batter;
    const pitcher = this.pitcher;

    const pSkill = pitcher.speed * 1.5 - pitcher.change * 0.5 - pitcher.control * 0.1;
    const bSkill = batter.meet * 1.5 - batter.power * 0.5;

    return (pSkill - bSkill) * 1.5 + 11 - (batter.mental - pitcher.mental);
  }

  /**
   * 四球を判定するパラメータの計算
   */
  private getFourBallParam() {
    const batter = this.batter;
    const pitcher = this.pitcher;

    const bSkill = batter.power + batter.meet * 0.5 - batter.run;
    const pSkill = pitcher.control + pitcher.change * 0.5 - pitcher.speed;

    return (bSkill - pSkill) * 0.8 + 10 - pitcher.mental * 0.5;
  }

  /**
   * 【仕様】点差が開くとモチベーション低下www
   *
   * @param score 両チームのスコア
   * @param offense topかbottomか
   */
  private setMotivation(score, offense) {
    const scoreDiff = score.top - score.bottom;
    if (Math.abs(scoreDiff) > 8) {
      if (offense === 'top') {
        this.motivation.top = -2;
        this.motivation.bottom = -1;
      }
      else {
        this.motivation.top = -1;
        this.motivation.bottom = -2;
      }
    }
  }
}

interface PlayMeta {
  steal: number;
  stealPlayer: Player;
  getScore: number;
  outCount: number;
  error: number;
  errorPlayer: Player;
  wildPitch: number;
  wildPitcher: Pitcher;
  battingData: {
    player: Player,
    result: string,
    hit: number,
    hr: number,
    batScore: number,
    strikeOut: number,
    fourBall: number,
    bunt: number,
  };
}
