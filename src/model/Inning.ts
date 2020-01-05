import { GameStatus, TopBottom } from './GameStatus';
import { Play } from './Play';
import { Team } from './Team';
import { Player } from './Player';
import { Batter } from './Batter';
import { Pitcher } from './Pitcher';
import { IBatter } from './IBatter';

export class Inning {
  private readonly beforeScore: TopBottom<number>; // イニング前の得点 { top: 0, bottom: 0 }
  private readonly offenseTeam: Team;     // 攻撃側のチーム
  private readonly defenseTeam: Team;     // 守備側のチーム
  private readonly inning: number;        // 何イニング目か
  private readonly offense: string;       // 'top' or 'bottom'
  private readonly defense: string;       // 'top' or 'bottom'
  private runner: number;                 // 3bit 表現（例：一三塁 → 101）
  private firstRunner: IBatter;           // 一塁ランナーのみ盗塁の対象となる（仕様）
  private wallOff: number;                // サヨナラ試合フラグ
  order: number;                          // 打順
  score: number;                          // イニング中の得点
  hit: number;                            // イニング中でのヒット数
  outCount: number;                       // アウトカウント
  inningResults: InningResult[];          // イニング中のバッティング結果

  constructor(topTeam: Team, botTeam: Team, gameMeta: any) {
    this.beforeScore = gameMeta.score;
    this.inning = gameMeta.inning;
    this.offense = gameMeta.offense;
    this.defense = gameMeta.offense === 'top' ? 'bottom' : 'top';
    this.order = gameMeta.order;
    this.firstRunner = new Batter({});
    this.runner = 0;
    this.wallOff = 0;
    this.score = 0;
    this.hit = 0;
    this.outCount = 0;
    this.offenseTeam = this.offense === 'top' ? topTeam : botTeam;
    this.defenseTeam = this.offense === 'top' ? botTeam : topTeam;
    this.inningResults = [];
  }

  /**
   * イニング処理 (core)
   */
  doInning() {
    while (this.outCount < 3) {
      const inningResult = this.getDefaultInningResult();

      const gameStatus: GameStatus = {
        inning: this.inning,
        offense: this.offense,
        defense: this.defense,
        score: this.getCurrentScore(),
        outCount: this.outCount,
        order: this.order,
        runner: this.runner,            // 3bit で表現（例：一三塁→101）
        firstRunner: this.firstRunner,  // 一塁ランナーのみ盗塁の対象（仕様）
      };

      // バッティング
      const play = new Play(this.offenseTeam, this.defenseTeam, gameStatus);
      play.doBatting();

      // バッティング記録をイニング記録に追加
      this.updateForNextPlay(play);
      this.updateInningResult(play, inningResult);
      this.inningResults.push(inningResult);

      // サヨナラ
      if (
        this.inning >= 9 &&
        this.offense === 'bottom' &&
        this.beforeScore.top < this.getCurrentScore().bottom
      ) {
        this.wallOff = 1;
        return;
      }
    }
  }

  /**
   * 現在の両チームの得点を返す
   */
  private getCurrentScore(): TopBottom<number> {
    const currentScore = Object.assign({}, this.beforeScore);
    currentScore[this.offense] += this.score;

    return currentScore;
  }

  /**
   * 次のバッターの処理に向けたデータの更新
   *
   * イニング中の記録（3アウトになるまでのもの）を更新
   * この関数内では、1回分のアクション（打席、盗塁、暴投）を記録する
   *
   * @param play バッティングオブジェクト
   */
  private updateForNextPlay(play: Play) {

    // 得点
    this.score += play.getScore;

    // ヒット
    if (play.hit > 0) {
      this.hit++;
    }

    // アウトカウント
    this.outCount += play.out;

    // ランナー
    this.runner = play.runner;
    this.setFirstRunner(play);

    // 打順
    if (!play.wildPitch && play.steal === '') {
      this.order = ++this.order % 9;
    }
  }

  /**
   * 1st ランナー更新
   *
   * @param play
   */
  private setFirstRunner(play: Play): void {
    if ((play.hit || play.error || play.fourBall) && play.runner % 10 === 1) {
      this.firstRunner = Object.assign({}, play.batter);
    }
    else if (play.runner % 10 === 0){
      this.firstRunner = new Batter({});
    }
    else {
      this.firstRunner = play.firstRunner;
    }
  }

  /**
   * 対戦結果データで更新
   *
   * @param play 対戦Object
   * @param inningResult 対戦結果記録用の変数
   */
  private updateInningResult(play: Play, inningResult: InningResult) {
    if (play.steal !== '') {
      inningResult.player = play.firstRunner;
    }
    else {
      inningResult.player = play.batter;
    }

    inningResult.pitcher = play.pitcher;
    inningResult.defender = play.defender;
    inningResult.runner = play.runner;
    inningResult.hit = play.hit > 0 ? 1 : 0;
    inningResult.hitKind = this.getHitKind(play.hit);
    inningResult.hr = play.hr ? 1 : 0;
    inningResult.fourBall = play.fourBall ? 1 : 0;
    inningResult.strikeOut = play.strikeOut ? 1 : 0;
    inningResult.batScore = play.batScore;
    inningResult.bunt = play.bunt;
    inningResult.outCount = play.out;
    inningResult.error = play.error;
    inningResult.steal = play.steal;
    inningResult.wildPitch = play.wildPitch;

    // 打数
    if (
      !play.fourBall &&
      !play.wildPitch &&
      !play.sacrificeFly && // 犠飛
      play.bunt === '' &&
      play.steal === ''
    ) {
      inningResult.atBat = 1;
    }

    // 自責点
    if (!play.error) {
      inningResult.selfLossScore = play.getScore;
    }
  }

  /**
   * ヒット種別 (Single, Double or Triple) の判定
   * @param hitKind
   */
  private getHitKind(hitKind: number): string {
    if (hitKind === 3) {
      return 'triple';
    }
    else if (hitKind === 2) {
      return 'double';
    }
    else {
      return 'single';
    }
  }

  /**
   * 対戦後に、必要な項目のみ更新するための初期化データ
   */
  private getDefaultInningResult(): InningResult {
    return <InningResult> {
      player: {},
      pitcher: {},
      defender: {},
      runner: 0,
      atBat: 0,
      hit: 0,
      hitKind: '',
      hr: 0,
      fourBall: 0,
      strikeOut: 0,
      batScore: 0,
      bunt: '',
      outCount: 0,
      error: false,
      steal: '',
      wildPitch: false,
      selfLossScore: 0,
    }
  }
}

/**
 * イニング記録のインタフェース
 * （1打席毎または、暴投・盗塁のように、打者の結果の前に発生するアクション）
 */
export interface InningResult {
  player: IBatter;        // 打者 or ランナー（steal = true の場合は 1st ランナー）
  pitcher: Pitcher;       // 対戦投手
  defender: Player[];     // 打球を処理した人
  runner: number;         // このタイミングでのランナー（3bit 表記）
  atBat: number;          // 打数（打数カウントしない場合は 0）
  hit: number;            // ここは投手と打者、両方の記録に使う
  hitKind: string;        // 1塁打(single)、2塁打(double)、3塁打(triple)、のいずれか
  hr: number;             // ここは投手と打者、両方の記録に使う
  fourBall: number;       // ここは投手と打者、両方の記録に使う
  strikeOut: number;      // ここは投手と打者、両方の記録に使う
  batScore: number;       // 打点
  bunt: string;
  outCount: number;       // 通常は 0 or 1 だが、併殺の場合は 2 になる
  error: boolean;         // defender のエラー
  steal: string;          // 注意） バッターの盗塁ではなく、1塁ランナーの盗塁
  wildPitch: boolean;
  selfLossScore: number;  // 自責点
}
