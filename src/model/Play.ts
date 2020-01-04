import { PlayerPosition, Team } from './Team';
import { Pitcher } from './Pitcher';
import { Player } from './Player';
import { Batter } from './Batter';
import { IBatter } from './IBatter';
import { GameStatus, TopBottom } from './GameStatus';
import { Position } from '../entity/Enum';

export class Play {
  private motivation: TopBottom<number>;
  offense: string;          // 'top' or 'bottom'
  defense: string;          // 'top' or 'bottom'
  runner: number;           // 塁上のランナー： 3bit 表記（1がランナーを意味する）
  currentOutCount: number;  // 現在のアウトカウント
  order: number;            // 打順
  scoreDiff: number;        // 得点差
  firstRunner: Player;      // 一塁ランナー（盗塁の対象）
  pitcher: Pitcher;         // 対戦投手
  getScore: number;         // この打席が完了するまでにおける得点
  out: number;              // この打席の結果におけるアウト数
  error: boolean;           // エラー Flag
  defensePlayer: Player[];  // 打球を処理した選手
  wildPitch: boolean;       // 暴投 Flag
  wildPitcher: Pitcher;     // 暴投した投手
  bunt: string;             // バント結果： 'succeed' or 'fail'
  steal: string;            // 盗塁結果： 'succeed' or 'fail'
  stealPlayer: Player;      // 盗塁選手
  batter: IBatter;          // バッター（野手 or 投手）
  batting: string;          // バッティング内容
  batScore: number;         // 打点
  hit: number;              // ヒット (1: 一塁打、 2: 二塁打、 3: 三塁打、 4: 本塁打）
  hr: boolean;              // ホームラン Flag
  strikeOut: boolean;       // 三振 Flag
  fourBall: boolean;        // 四球 Flag
  sacrificeFly: boolean;    // 犠牲フライ Flag （サクリファイス）
  outField: boolean;        // 外野への打球 Flag（true: 外野、 false: 内野）

  constructor(
    private offenseTeam: Team,
    private defenseTeam: Team,
    private gameStatus: GameStatus
  ) {
    this.offense = gameStatus.offense;
    this.defense = gameStatus.defense;
    this.runner = gameStatus.runner;
    this.currentOutCount = gameStatus.outCount;
    this.order = gameStatus.order;
    this.firstRunner = gameStatus.firstRunner;
    this.scoreDiff = Math.abs(gameStatus.score.top - gameStatus.score.bottom);
    this.motivation = { top: 0, bottom: 0 };
    this.steal = '';
    this.getScore = 0;
    this.out = 0;
    this.error = false;
    this.wildPitch = false;
    this.batting = '';
    this.hit = 0;
    this.hr = false;
    this.batScore = 0;
    this.strikeOut = false;
    this.fourBall = false;
    this.sacrificeFly = false;
    this.bunt = '';
    this.outField = false;
  }

  /**
   * バッティング（対戦）処理
   */
  doBatting(): void {
    if (this.order === 9) {
      this.batter = new Pitcher(this.offenseTeam.pitchers[0]);
    }
    else {
      this.batter = new Batter(this.offenseTeam.players[this.order]);
    }
    this.pitcher = this.defenseTeam.pitchers[0];

    // モチベーション設定
    this.setMotivation();

    // バッターの能力値＆メンタル更新
    this.batter.updateBatterSkill(this.gameStatus, this.offenseTeam, this.motivation[this.offense]);

    // ランナーの能力値更新（投手のときは run = -5）
    this.firstRunner.updateSkill();

    // 守備チーム野手の守備力更新
    this.defenseTeam.updatePlayersDefenseSkill(this.motivation[this.defense]);
    const defensePosition = this.defenseTeam.getPlayersByPosition();

    // 守備チームの投手の能力値更新
    this.pitcher.updatePitcherSkill(this.gameStatus, this.defenseTeam, this.motivation[this.defense]);

    // バッティング内容を決めるため各種パラメータ計算
    const battingParams = {
      pSteal: this.getStealParams(defensePosition),        // 盗塁
      pWildPitch: this.getWildPitchParam(defensePosition), // 暴投
      pStrikeOut: this.getStrikeOutParam(),                // 三振
      pFourBall: this.getFourBallParam(),                  // 四球
      pHit: this.getHitParam(),                            // 安打
    };

    // バッティング実行
    this.setBattingResult(battingParams, defensePosition);

    // ランナー処理
    this.updateRunner();

    // 追加点があるとモチベーション変動
    if (this.getScore > 0) {
      this.motivation[this.offense] += this.getScore * 0.2;
      this.motivation[this.defense] -= this.getScore * 0.2;
    }

    // TODO: ランナーの表示設定をここに実装すべきか？
    //   → クライアント側で実装すべきなので、一旦省略する
  }

  /**
   * バッティング実行し結果を返す
   * TODO: 毎回乱数を取得する必要があるのか？要シミュレーション
   */
  private setBattingResult(battingParams: any, defensePosition: any) {

    // 盗塁
    if (Math.random() * 100 < battingParams.pSteal.start &&
      (this.runner === 1 || this.runner === 101) &&
      this.firstRunner.order !== 9
    ) {
      this.doSteal(battingParams.pSteal.success);
    }

    // 暴投
    else if (Math.random() * 100 < battingParams.pWildPitch && this.runner) {
      this.doWildPitch();
    }

    // バント
    else if (this.checkBunt()) {
      this.doBunt();
    }

    // 三振
    else if (Math.random() * 100 < battingParams.pStrikeOut) {
      this.doStrikeOut();
    }

    // 四球
    else if (Math.random() * 100 < battingParams.pFourBall) {
      this.doFourBall();
    }

    // 安打
    else if (Math.random() * 100 < battingParams.pHit) {
      this.doHitting(defensePosition);
    }

    // アウト
    else {
      this.outField = false;
      this.setHittingDirection(defensePosition);
      this.doOut();
    }
  }

  /**
   * 盗塁
   * @param paramSuccess 成否判断パラメータ
   */
  private doSteal(paramSuccess: number): void {
    if (Math.random() * 100 < paramSuccess) {
      if (this.runner === 1) {
        this.runner = 10;
      }
      else if (this.runner === 101) {
        this.runner = 110;
      }

      this.steal = 'succeed';
      this.stealPlayer = this.firstRunner;
      this.motivation[this.offense] += 0.1;
    }
    else {
      this.steal = 'fail';
      this.runner--;
      this.out++;
    }
  }

  /**
   * 暴投
   */
  private doWildPitch(): void {
    this.runner *= 10;
    this.motivation[this.defense] -= 0.1;
    this.wildPitch = true;
    this.wildPitcher = this.pitcher;
  }

  /**
   * バントするかどうか
   */
  private checkBunt(): boolean {

    // バント采配する条件
    const buntSituation = this.scoreDiff < 5 &&
      (this.runner === 1 || this.runner === 11) &&
      (this.currentOutCount === 0 || (this.currentOutCount === 1 && this.order !== 8));

    if (buntSituation) {

      // 選手の能力でバント判断（クリーンアップはバントしない）
      const bSkill = this.batter.power + this.batter.meet;
      const teamBuntParam1 = (this.offenseTeam.typeBunt - 5) * 0.5 + 7;
      const teamBuntParam2 = (this.offenseTeam.typeBunt - 5) * 0.4 + 5;
      const teamBuntParam3 = (this.offenseTeam.typeBunt - 5) * 0.4 + 7;

      const goodBunter = bSkill < teamBuntParam1 ||
        (this.order < 3 || this.order > 5) &&
        this.batter.power < teamBuntParam2 &&
        this.batter.meet  < teamBuntParam2 &&
        Math.random() * 10 < teamBuntParam3;

      if (goodBunter) {
        return true;
      }
    }

    return false;
  }

  /**
   * バント
   */
  private doBunt(): void {
    const batter = this.batter;

    const bSkill = (10 - batter.power) + (10 - batter.meet) + batter.run + 80;

    if (Math.random() * 100 < bSkill || this.order === 9) {
      this.runner *= 10;
      this.bunt = 'succeed';
      // TODO: 打席数をカウントしない処理が必要（Inning.js でやる？）
    }
    else {
      this.bunt = 'fail';
    }

    this.out++;
  }

  /**
   * 三振
   */
  private doStrikeOut(): void {
    this.strikeOut = true;
    this.out++;
  }

  /**
   * 四球
   */
  private doFourBall(): void {
    if (this.runner === 111) {
      this.batScore++;  // 押し出しは打点がつく
    }

    if (this.runner === 101) {
      this.runner += 10;
    }
    else if (this.runner % 10) {  // 1 or 11 or 111
      this.runner = this.runner * 10 + 1;
    }
    else {
      this.runner += 1;
    }

    this.fourBall = true;
    // TODO: 打席数をカウントしない処理が必要（Inning.js でやる？）
  }

  /**
   * ヒッティング（バットに当てた = ヒットとは限らない）
   *
   * @param defensePosition 各ポジションの野手
   */
  private doHitting(defensePosition: any): void {
    this.hit = 0; // 念の為、再初期化

    // 強いバッティング
    this.doHardHitting(defensePosition);

    // 野手への打球（シングルヒット、内野安打、エラー、アウト、併殺、犠飛）
    if (this.hit === 0) {
      this.doNormalHitting(defensePosition);
    }
  }

  /**
   * 通常の打球
   *
   * @param defensePosition 各ポジションの野手
   */
  private doNormalHitting(defensePosition: any): void {

    // 打球方向を決める
    this.outField = false;   // 基本は内野への打球とする（ただし外野の可能性もあり）
    this.setHittingDirection(defensePosition);

    // 外野への打球
    if (
      this.defensePlayer[0].position === Position.LEFT ||
      this.defensePlayer[0].position === Position.CENTER ||
      this.defensePlayer[0].position === Position.RIGHT
    ) {
      this.outField = true;
      this.doOutfield();
    }

    // 内野への打球
    else {
      this.doInfield();
    }
  }

  /**
   * 外野への打球（通常の打球）
   * NOTE: 強い打球は別の関数
   */
  private doOutfield(): void {
    let fielder = this.defensePlayer[0];
    let dSkill = (20 - (fielder.defense * 0.7 + fielder.run * 1.3)) * 1.5 + 25;
    let errorParam = Math.pow(10 - fielder.defense, 1.5) * 0.3;

    if (this.defensePlayer.length === 2) {
      fielder = this.defensePlayer[1];
      dSkill = (dSkill + (20 - (fielder.defense * 0.7 + fielder.run * 1.3))) * 0.5;
      errorParam *= 1.5;
    }

    // ヒット
    if (Math.random() * 100 < dSkill) {
      this.doHit();

      // エラー（ヒットと同時発生： ワンベース進塁）
      if (Math.random() * 100 < errorParam) {
        this.doError(this.runner * 10);
      }
    }

    // エラー
    else if (Math.random() * 100 < errorParam) {
      this.doError(this.runner * 100 + 10);
    }

    // 犠飛
    else if (this.runner >= 100 && this.currentOutCount < 2) {
      this.doSacrificeFly();
    }

    // アウト
    else {
      this.doOut();
    }
  }

  /**
   * 内野への打球
   */
  private doInfield(): void {
    const batter = this.batter;
    const fielder = this.defensePlayer[0];

    const bSkill = batter.power * 0.3 + batter.meet * 0.5 + batter.run * 0.2;
    let dSkill = fielder.defense * 0.8 + fielder.run * 0.2;
    let infieldHit = (batter.run * 1.3 - batter.power * 0.3 - fielder.defense) * 1.5 + 10;
    let errorParam = Math.pow(10 - fielder.defense, 1.5) * 0.6;

    if (this.defensePlayer.length === 2) {
      const fielder2 = this.defensePlayer[1];
      dSkill = (dSkill + fielder2.defense * 0.8 + fielder2.run * 0.2) * 0.5;
      infieldHit += 10;
      errorParam *= 1.5;
    }

    const hit = (bSkill - dSkill) + 25;

    // ヒット
    if (
      Math.random() * 100 < hit &&
      this.defensePlayer[0].position !== Position.PITCHER &&
      this.defensePlayer[0].position !== Position.CATCHER
    ) {
      this.doHit();
    }

    // エラー
    else if (Math.random() * 100 < errorParam) {
      if (Math.random() * 5 < 2) {
        this.doError(this.runner * 100 + 10);
      }
      else {
        this.doError(this.runner * 10 + 1);
      }
    }

    // 内野安打
    else if (Math.random() * 100 < infieldHit) {
      this.doInfieldHit();
    }

    // アウト
    else {
      const doublePlay = (fielder.defense + fielder.run * 0.3) -
        (batter.run * 1.5 - batter.power * 0.5) + 80;

      // ダブルプレイ
      if (
        Math.random() * 100 < doublePlay &&
        this.runner % 10 === 1 &&
        this.currentOutCount < 2
      ) {
        this.doDoublePlay();
      }
      else {
        this.doOut();
      }
    }
  }

  /**
   * エラー（ランナー進塁）
   *
   * @param runner 進塁後のランナー
   */
  private doError(runner: number) {
    this.runner = runner;
    this.error = true;
    this.motivation[this.defense] -= 0.2;
  }

  /**
   * 犠牲フライ
   */
  private doSacrificeFly(): void {
    this.runner += 900;
    this.sacrificeFly = true;
    // TODO: 打席数をカウントしない処理が必要（Inning.js でやる？）
  }

  /**
   * アウト
   */
  private doOut(): void {
    this.out++;
  }

  /**
   * ダブルプレイ
   */
  private doDoublePlay(): void {
    if (this.runner === 1) {
      this.runner = 0;
    }
    else if (this.runner === 11) {
      this.runner = 100;
    }
    else if (this.runner === 111) {
      this.runner = 110;  // ホームゲッツー
    }
    else if (this.runner === 101) {
      if (this.currentOutCount === 0) {
        // TODO: 得点差が4点以上開いているときのみにしたい
        this.runner = 1000;
      }
      else {
        this.runner = 100;
      }
    }
    this.doOut();
    this.doOut();
  }

  /**
   * 強い打球
   *
   * @param defensePosition 各ポジションの野手
   */
  private doHardHitting(defensePosition: any): void {

    // ヒット種別判定用パラメータ計算
    const hr = this.getHomeRunParam();            // ホームラン
    const longHit = this.getMultiBaseHitParam();  // 長打コース
    const singleHit = this.getSingleHitParam();   // シングルヒット（外野への打球）

    // 打球方向を決める
    this.outField = true;
    this.setHittingDirection(defensePosition);

    // ホームラン
    if (Math.random() * 100 < hr) {
      this.doHomeRun();
    }

    // 長打コース
    else if (Math.random() * 100 < longHit) {
      this.doLongHit();
    }

    // シングルヒット（外野への打球）
    else if (Math.random() * 100 < singleHit) {
      this.doSingleHit();
    }
  }

  /**
   * ホームラン
   */
  private doHomeRun(): void {
    this.runner = this.runner * 1000 + 1000;
    this.hit = 4;
    this.hr = true;
    this.motivation[this.offense] += 0.3;
  }

  /**
   * 長打コース
   */
  private doLongHit(): void {
    const batter = this.batter;
    const fielder1 = this.defensePlayer[0];

    const bSkill = batter.run * 2 - batter.power;
    let dSkill = fielder1.defense + fielder1.run;

    if (this.defensePlayer.length === 2) {
      const fielder2 = this.defensePlayer[1];
      dSkill = (dSkill + fielder2.defense + fielder2.run) * 0.5;
    }

    const hitParam = bSkill - dSkill;

    // 三塁打
    if (Math.random() * 100 < hitParam + 10) {
      this.runner = this.runner * 1000 + 100;
      this.motivation[this.offense] += 0.2;
      this.hit = 3;
    }

    // 二塁打
    else if (Math.random() * 100 < hitParam + 60) {
      if (this.runner >= 1 && Math.random() * fielder1.defense < 3) {
        this.runner = this.runner * 1000 + 10;
      }
      else {
        this.runner = this.runner * 100 + 10;
      }
      this.motivation[this.offense] += 0.1;
      this.hit = 2;
    }

    // 一塁打（シングルヒット）
    else {
      if (this.runner >= 1 && Math.random() * fielder1.defense < 4) {
        this.runner = this.runner * 100 + 1;
      }
      else {
        this.runner = this.runner * 10 + 1;
      }
      this.hit = 1;
    }
  }

  /**
   * シングルヒット（外野への打球）
   */
  private doSingleHit(): void {
    if (this.runner >= 10 && Math.random() * this.defensePlayer[0].defense < 3.5) {
      this.runner = this.runner * 100 + 1;
    }
    else {
      this.runner = this.runner * 10 + 1;
    }

    this.hit = 1;
  }

  /**
   * ヒット（平凡な打球）
   */
  private doHit(): void {
    let hit = Math.random() * this.defensePlayer[0].defense < 2.5;
    if (!this.outField) {
      hit = this.runner >= 10 && Math.random() * this.defensePlayer[0].defense < 2;
    }

    if (hit) {
      if (this.runner % 10 === 1) {
        this.runner = (this.runner - 1) * 100 + 11;
      }
      else {
        this.runner = this.runner * 100 + 1;
      }
    }
    else {
      this.runner = this.runner * 10 + 1;
    }

    this.hit = 1;
  }

  /**
   * 内野安打
   */
  private doInfieldHit(): void {
    this.runner = this.runner * 10 + 1;
    this.hit = 1;
  }

  /**
   * 打球方向を決める
   *
   * @param defensePosition ポジション毎の選手
   */
  private setHittingDirection(defensePosition: PlayerPosition): void {
    const batter = this.batter;
    const pitcher = this.pitcher;

    const hitParam1 = Math.random() * (batter.power * 0.7 + batter.meet * 0.3);
    const hitParam2 = Math.random() * (batter.power * 0.3 + batter.meet * 0.7);

    const pSkill1 = pitcher.speed * 0.3 + pitcher.change * 0.6 + pitcher.control * 0.1;
    const pSkill2 = pitcher.speed * 0.3 + pitcher.change * 0.5 + pitcher.control * 0.2;

    let directions;

    // 内野への打球
    if (
      !this.outField &&
      Math.random() * pitcher.speed  - hitParam1 > 3 &&
      Math.random() * pitcher.change - hitParam2 > 3
    ) {
      directions = [0, 1];
    }
    else if (!this.outField && Math.random() * pSkill1 > hitParam1) {
      if (Math.random() * pSkill2 > hitParam2) {
        directions = [2, 3, 4, 5];
      }
      else {
        directions = [6, 7, 8];
      }
    }

    // 外野への打球
    else {
      const pSkill = pitcher.speed * 0.5 + pitcher.change * 0.3 + pitcher.control * 0.2;

      if (Math.random() * pSkill > hitParam2) {
        directions = [9, 10, 11];
      }
      else {
        directions = [12, 13];
      }
    }

    // 方向確定
    const direction = directions[Math.floor(Math.random() * directions.length)];

    switch (direction) {
      case 0:
        this.defensePlayer.push(defensePosition.pitcher);
        break;
      case 1:
        this.defensePlayer.push(defensePosition.catcher);
        break;
      case 2:
        this.defensePlayer.push(defensePosition.first);
        break;
      case 3:
        this.defensePlayer.push(defensePosition.second);
        break;
      case 4:
        this.defensePlayer.push(defensePosition.third);
        break;
      case 5:
        this.defensePlayer.push(defensePosition.shortstop);
        break;
      case 6:
        this.defensePlayer.push(defensePosition.second);
        this.defensePlayer.push(defensePosition.first);
        break;
      case 7:
        if (Math.random() * 2 < 1) {
          this.defensePlayer.push(defensePosition.second);
          this.defensePlayer.push(defensePosition.shortstop);
        }
        else {
          this.defensePlayer.push(defensePosition.shortstop);
          this.defensePlayer.push(defensePosition.second);
        }
        break;
      case 8:
        this.defensePlayer.push(defensePosition.shortstop);
        this.defensePlayer.push(defensePosition.third);
        break;
      case 9:
        this.defensePlayer.push(defensePosition.left);
        break;
      case 10:
        this.defensePlayer.push(defensePosition.center);
        break;
      case 11:
        this.defensePlayer.push(defensePosition.right);
        break;
      case 12:
        if (Math.random() * 2 < 1) {
          this.defensePlayer.push(defensePosition.center);
          this.defensePlayer.push(defensePosition.left);
        }
        else {
          this.defensePlayer.push(defensePosition.left);
          this.defensePlayer.push(defensePosition.center);
        }
        break;
      case 13:
        if (Math.random() * 2 < 1) {
          this.defensePlayer.push(defensePosition.center);
          this.defensePlayer.push(defensePosition.right);
        }
        else {
          this.defensePlayer.push(defensePosition.right);
          this.defensePlayer.push(defensePosition.center);
        }
        break;
    }
  }

  /**
   * ホームラン判定用パラメータの計算
   */
  private getHomeRunParam(): number {
    const batter = this.batter;
    const pitcher = this.pitcher;

    const bSkill = batter.power * 1.5 - batter.meet * 0.5 - batter.run * 0.5;
    const pSkill = pitcher.change * 0.5 - pitcher.speed * 0.5 + pitcher.control;

    return (bSkill - pSkill) * 1.5 + 9;
  }

  /**
   * 長打（2塁打・3塁打）判定用パラメータの計算
   */
  private getMultiBaseHitParam(): number {
    const batter = this.batter;
    const pitcher = this.pitcher;

    const bSkill = batter.meet * 0.3 + batter.power * 0.5 + batter.run * 0.2;
    const pSkill = pitcher.change * 0.5 - pitcher.speed * 0.2 + pitcher.control * 0.7;

    return bSkill - pSkill + 17;
  }

  /**
   * シングルヒット判定用パラメータの計算
   */
  private getSingleHitParam(): number {
    const batter = this.batter;
    const pitcher = this.pitcher;

    const bSkill = batter.power * 0.6 + batter.meet * 0.4;
    const pSkill = pitcher.speed * 0.2 + pitcher.change * 0.5 + pitcher.control * 0.3;

    return(bSkill - pSkill) * 0.5 + 10;
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
  private getStrikeOutParam(): number {
    const batter  = this.batter;
    const pitcher = this.pitcher;

    const pSkill = pitcher.speed * 1.5 - pitcher.change * 0.5 - pitcher.control * 0.1;
    const bSkill = batter.meet * 1.5 - batter.power * 0.5;

    return (pSkill - bSkill) * 1.5 + 11 - (batter.mental - pitcher.mental);
  }

  /**
   * 四球を判定するパラメータの計算
   */
  private getFourBallParam(): number {
    const batter = this.batter;
    const pitcher = this.pitcher;

    const bSkill = batter.power + batter.meet * 0.5 - batter.run;
    const pSkill = pitcher.control + pitcher.change * 0.5 - pitcher.speed;

    return (bSkill - pSkill) * 0.8 + 10 - pitcher.mental * 0.5;
  }

  /**
   * ヒットを判定するパラメータの計算
   */
  private getHitParam(): number {
    const batter = this.batter;
    const pitcher = this.pitcher;

    const bSkill = batter.meet * 1.5 - batter.power + batter.run * 0.5;
    const pSkill = pitcher.speed - pitcher.change + pitcher.control;

    return (bSkill - pSkill) * 1.5 + 9;
  }

  /**
   * ランナー処理
   */
  private updateRunner() {
    let homeIn = this.runner / 1000;

    for (let i = 1000; i >= 1; i % 10) {
      if (homeIn >= i) {
        this.getScore += (i === 1) ? homeIn : 1;
        homeIn -= i;
        /*
        三項演算子で問題ないならココ消す
        if (i === 1) {
          this.getScore += homeIn;
        }
        else {
          this.getScore++;
        }
         */
      }
    }

    if (this.getScore > 0) {
      this.runner %= 1000;
    }
  }

  /**
   * 【仕様】点差が開くとモチベーション低下www
   */
  private setMotivation(): void {
    if (this.scoreDiff > 8) {
      if (this.offense === 'top') {
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
