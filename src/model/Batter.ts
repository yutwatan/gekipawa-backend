import { Player } from './Player';
import { IBatter } from './IBatter';
import { Team } from './Team';
import { GameStatus } from './GameStatus';

export class Batter extends Player implements IBatter {
  constructor(batter) {
    super(batter);
    this.position = batter.position;
    /*
    this.power = batter.power;
    this.meet = batter.meet;
    this.run = batter.run;
     */
  }

  /**
   * バッターの能力値＆メンタルを計算して更新
   *
   * @param gameStatus 試合のメタ情報
   * @param offenseTeam 攻撃チーム
   * @param motivation モチベーション
   */
  updateBatterSkill(gameStatus: GameStatus, offenseTeam: Team, motivation: number): void {
    this.mental = this.getMental(gameStatus.inning, gameStatus.runner);

    const teamMind   = offenseTeam.typeMind;
    const teamAttach = offenseTeam.typeAttack;

    const powerMental = Math.random() * this.mental * 0.05 + 1;
    const meetMental  = Math.random() * this.mental * 0.1  + 1;
    const mind = (Math.random() * (10 - teamMind) - (10 - teamMind) * 0.5) * 0.4;

    let power = this.power * powerMental + mind + motivation;
    let meet  = this.meet  * meetMental  + mind + motivation;
    let run   = this.run;

    // 【仕様】チームパラメータが攻撃的（5以上）の場合は Power OR Meet が Up（逆は Down）
    if (power > meet) {
      this.power = power + (teamAttach - 5) * 0.2;
    }
    else {
      this.meet = meet + (teamAttach - 5) * 0.15;
    }

    // 【仕様】Run が 5 以上でチームが攻撃的の場合は Up
    if (run > 4) {
      this.run = run + (teamAttach - 5) * 0.1 + motivation;
    }
  }

  /**
   * ランナー時の走塁スキルの更新（野手の場合は今の所変化なし）
   */
  updateRunningSkill() {
  }

  /**
   * 野手のメンタル値の取得
   * 【仕様】条件によってメンタルが変わる
   *
   * @param inning イニング
   * @param runner ランナー状況
   */
  getMental(inning: number, runner: number): number {
    // TODO: condition が低いとマイナスになってしまうが、それでいいのか？
    //   絶対値を掛けて、プラスにしたほうがいいのでは？ → 直してみた（ドキドキ）
    let mental = this.condition - 5;

    if (runner >= 10) {
      //mental *= 1.7;
      mental += Math.abs(mental) * 1.7;
    }

    if (inning >= 9) {
      //mental *= 1.5;
      mental += Math.abs(mental) * 1.5;
    }
    else if (inning >= 7) {
      //mental *= 1.2;
      mental += Math.abs(mental) * 1.2;
    }

    return mental;
  }
}
