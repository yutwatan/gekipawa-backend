import { PlayerPosition, Team } from './Team';
import { Pitcher } from './Pitcher';
import { Player } from './Player';
import { IBatter } from './IBatter';
import { GameStatus, TopBottom } from './GameStatus';
import { Position } from '../entity/Enum';

export class Play {
  private motivation: TopBottom<number>;
  offense: string;          // 'top' or 'bottom'
  defense: string;          // 'top' or 'bottom'
  currentOutCount: number;  // 現在のアウトカウント
  scoreDiff: number;        // 得点差
  runner: number;           // 塁上のランナー： 3bit 表記（1がランナーを意味する）
  firstRunner: IBatter;     // 一塁ランナー（盗塁の対象）
  order: number;            // 打順
  batter: IBatter;          // バッター（野手 or 投手）
  pitcher: Pitcher;         // 対戦投手
  getScore: number;         // この打席が完了するまでにおける得点
  out: number;              // この打席の結果におけるアウト数
  error: boolean;           // エラー Flag
  errorScore: number;       // エラーに伴う得点（自責点の計算時用）
  defender: Player[];       // 打球を処理した選手
  wildPitch: boolean;       // 暴投 Flag
  wildPitcher: Pitcher;     // 暴投した投手 TODO: コレ要らない疑惑
  bunt: string;             // バント結果： 'succeed' or 'fail'
  steal: string;            // 盗塁結果： 'succeed' or 'fail'
  stealPlayer: IBatter;     // 盗塁選手
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
    //this.firstRunner = Object.assign({}, gameStatus.firstRunner);
    this.firstRunner = gameStatus.firstRunner;
    this.scoreDiff = Math.abs(gameStatus.score.top - gameStatus.score.bottom);
    this.motivation = { top: 0, bottom: 0 };
    this.steal = '';
    this.getScore = 0;
    this.out = 0;
    this.error = false;
    this.errorScore = 0;
    this.wildPitch = false;
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
    if (this.order === 0) {
      this.batter = this.offenseTeam.pitchers[0];
    }
    else {
      this.batter = this.offenseTeam.players[this.order - 1];
    }
    this.pitcher = this.defenseTeam.pitchers[0];

    // モチベーション設定
    this.setMotivation();

    // バッターの能力値＆メンタル更新
    this.batter.updateBatterSkill(this.gameStatus, this.offenseTeam, this.motivation[this.offense]);

    // ランナーの能力値更新（投手のときは run = -5）
    // TODO: インタフェースにより、Batter または Pitcher のオブジェクトになるので更新不要のはず
    //this.firstRunner.updateRunningSkill();

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

    // ランナー処理 & ホームインした数のカウント（＝得点計算）
    this.updateRunner();

    // 得点を打点に加算
    this.batScore += this.getScore;

    // 選手の成績登録
    this.updatePlayerResult();

    // 追加点があるとモチベーション変動
    if (this.getScore > 0) {
      this.motivation[this.offense] += this.getScore * 0.2;
      this.motivation[this.defense] -= this.getScore * 0.2;
    }

    // TODO: ランナーの表示設定をここに実装すべきか？
    //   → クライアント側で実装すべきなので、一旦省略する
  }

  /**
   * 選手の成績登録
   */
  private updatePlayerResult() {
    const battingResult  = this.batter.battingResult;
    const pitchingResult = this.pitcher.pitchingResult;
    const runnerResult   = this.firstRunner.battingResult;

    // 盗塁
    if (this.steal !== '') {
      if (this.steal === 'succeed') {
        runnerResult.steal++;
      }
      else {
        runnerResult.stealFailed++;
      }
    }

    // 暴投
    else if (this.wildPitch) {
      pitchingResult.wildPitch++;
    }

    // バッティング
    else {
      // 打席
      battingResult.box++;

      // 投手の対戦打数
      pitchingResult.atBat++;

      // 打点
      battingResult.batScore += this.batScore;

      // バント
      if (this.bunt !== '') {
        if (this.bunt === 'succeed') {
          battingResult.bunt++;
        }
        else {
          battingResult.atBat++;  // バント失敗時は打数カウントされる
        }
      }

      // 犠飛
      else if (this.sacrificeFly) {
        battingResult.sacrificeFly++;
      }

      // 四球
      else if (this.fourBall) {
        battingResult.fourBall++;
        pitchingResult.fourBall++;
      }
      // ↑打数カウントなし

      // ↓打数カウントあり
      else {
        battingResult.atBat++;

        // 三振
        if (this.strikeOut) {
          battingResult.strikeOut++;
          pitchingResult.strikeOut++;
        }

        // ヒット
        else if (this.hit > 0) {
          battingResult.hit++;
          pitchingResult.hit++;

          // ホームラン
          if (this.hr) {
            battingResult.hr++;
            pitchingResult.hr++;
          }

          // 三塁打
          else if (this.hit === 3) {
            battingResult.triple++;
          }

          // 二塁打
          else if (this.hit === 2) {
            battingResult.double++;
          }
        }
      }
    }

    // 投手の失点・自責点を更新
    pitchingResult.lossScore += this.getScore;
    pitchingResult.selfLossScore += this.getScore - this.errorScore;

    // アウトカウント
    pitchingResult.outCount += this.out;

    // エラー
    if (this.error) {
      for (let player of this.defender) {
        player.battingResult.error++;
      }
    }
  }

  /**
   * バッティング実行し結果を返す
   * TODO: 毎回乱数を取得する必要があるのか？要シミュレーション
   */
  private setBattingResult(battingParams: any, defensePosition: any) {

    // 盗塁
    if (
      (this.runner === 1 || this.runner === 101) &&
      Math.random() * 100 < battingParams.pSteal.start &&
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

    // ヒッティング
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
   *
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
      this.stealPlayer = Object.assign({}, this.firstRunner);
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
    this.wildPitcher = Object.assign({}, this.pitcher);
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
      this.defender[0].position === Position.LEFT ||
      this.defender[0].position === Position.CENTER ||
      this.defender[0].position === Position.RIGHT
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
    let fielder = Object.assign({}, this.defender[0]);
    let dSkill = (20 - (fielder.defense * 0.7 + fielder.run * 1.3)) * 1.5 + 25;
    let errorParam = Math.pow(10 - fielder.defense, 1.5) * 0.3;

    if (this.defender.length === 2) {
      fielder = Object.assign({}, this.defender[1]);
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

    // エラー（ツーベース進塁）
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
    const fielder = Object.assign({}, this.defender[0]);

    const bSkill = batter.power * 0.3 + batter.meet * 0.5 + batter.run * 0.2;
    let dSkill = fielder.defense * 0.8 + fielder.run * 0.2;
    let infieldHit = (batter.run * 1.3 - batter.power * 0.3 - fielder.defense) * 1.5 + 10;
    let errorParam = Math.pow(10 - fielder.defense, 1.5) * 0.6;

    if (this.defender.length === 2) {
      const fielder2 = Object.assign({}, this.defender[1]);
      dSkill = (dSkill + fielder2.defense * 0.8 + fielder2.run * 0.2) * 0.5;
      infieldHit += 10;
      errorParam *= 1.5;
    }

    const hit = (bSkill - dSkill) + 25;

    // ヒット
    if (
      Math.random() * 100 < hit &&
      this.defender[0].position !== Position.PITCHER &&
      this.defender[0].position !== Position.CATCHER
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
        this.currentOutCount < 2 &&
        this.runner % 10 === 1 &&
        Math.random() * 100 < doublePlay
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
    const preRunner = this.runner;
    this.runner = runner;
    this.error = true;
    this.motivation[this.defense] -= 0.2;

    // 2アウトの場面でエラーによるホームインがあっても打点はつかない
    if (runner > 111 && this.currentOutCount === 2) {
      this.batScore--;
    }

    // エラーによる得点を計測（自責点の計算時に使う）
    const preScore  = this.getHomeInCount(preRunner);
    const postScore = this.getHomeInCount(runner);
    if (preScore < postScore) {
      this.errorScore = postScore - preScore;
    }
  }

  /**
   * 犠牲フライ
   */
  private doSacrificeFly(): void {
    this.runner += 900;
    this.sacrificeFly = true;
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

    else {
      // 特にロジックなし
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
    const fielder1 = this.defender[0];

    const bSkill = batter.run * 2 - batter.power;
    let dSkill = fielder1.defense + fielder1.run;

    if (this.defender.length === 2) {
      const fielder2 = this.defender[1];
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
    if (this.runner >= 10 && Math.random() * this.defender[0].defense < 3.5) {
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
    let hit = Math.random() * this.defender[0].defense < 2.5;
    if (!this.outField) {
      hit = this.runner >= 10 && Math.random() * this.defender[0].defense < 2;
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
    this.defender = [];

    switch (direction) {
      case 0:
        this.defender.push(defensePosition.pitcher);
        break;
      case 1:
        this.defender.push(defensePosition.catcher);
        break;
      case 2:
        this.defender.push(defensePosition.first);
        break;
      case 3:
        this.defender.push(defensePosition.second);
        break;
      case 4:
        this.defender.push(defensePosition.third);
        break;
      case 5:
        this.defender.push(defensePosition.shortstop);
        break;
      case 6:
        this.defender.push(defensePosition.second);
        this.defender.push(defensePosition.first);
        break;
      case 7:
        if (Math.random() * 2 < 1) {
          this.defender.push(defensePosition.second);
          this.defender.push(defensePosition.shortstop);
        }
        else {
          this.defender.push(defensePosition.shortstop);
          this.defender.push(defensePosition.second);
        }
        break;
      case 8:
        this.defender.push(defensePosition.shortstop);
        this.defender.push(defensePosition.third);
        break;
      case 9:
        this.defender.push(defensePosition.left);
        break;
      case 10:
        this.defender.push(defensePosition.center);
        break;
      case 11:
        this.defender.push(defensePosition.right);
        break;
      case 12:
        if (Math.random() * 2 < 1) {
          this.defender.push(defensePosition.center);
          this.defender.push(defensePosition.left);
        }
        else {
          this.defender.push(defensePosition.left);
          this.defender.push(defensePosition.center);
        }
        break;
      case 13:
        if (Math.random() * 2 < 1) {
          this.defender.push(defensePosition.center);
          this.defender.push(defensePosition.right);
        }
        else {
          this.defender.push(defensePosition.right);
          this.defender.push(defensePosition.center);
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

    // 盗塁の発生するシチュエーションじゃないなら計算しない
    if (this.runner !== 1 && this.runner !== 101) {
      return { start: 0, success: 0 };
    }

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
   * ホームインしたランナーを得点に変換 & ホームインしたランナーを this.runner から除外
   */
  private updateRunner() {
    this.getScore = this.getHomeInCount(this.runner);

    if (this.getScore > 0) {
      this.runner %= 1000;
    }
  }

  /**
   * ホームインした人数を算出
   *
   * @param runner ランナー状況
   */
  private getHomeInCount(runner: number): number {
    let homeIn = Math.floor(runner / 1000);
    let count = 0;

    for (let i = 1000; i >= 1; i /= 10) {
      if (homeIn >= i) {
        count += (i === 1) ? homeIn : 1;
        homeIn -= i;
      }
    }

    return count;
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
