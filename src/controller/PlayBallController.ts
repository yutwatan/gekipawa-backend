import { NextFunction, Request, Response } from 'express';
import { CurrentController } from './CurrentController';
import { TeamController } from './TeamController';
import { Game, GameRecord } from '../model/Game';
import { TopBottom } from '../model/GameStatus';
import { BattingResult } from '../model/IBatter';
import { PitchingResult } from '../model/Pitcher';
import { GameLogController } from './GameLogController';

export class PlayBallController {

  /**
   * 試合の実施 & ゲーム結果と履歴の保存
   * @param request
   * @param response
   * @param next
   */
  async playBall(request: Request, response: Response, next: NextFunction) {
    const current = new CurrentController();
    const currentData = await current.get(request, response, next);

    const times = currentData[0].times;
    const topTeamId = request.body.topTeamId;
    const botTeamId = request.body.bottomTeamId;

    // チームデータ取得
    const teamTop = new TeamController();
    const teamBot = new TeamController();
    const topTeam = await teamTop.getTeamData(topTeamId, times);
    const botTeam = await teamBot.getTeamData(botTeamId, times);

    // 試合の処理
    console.log('=========== start game ============');
    const game = new Game(topTeam, botTeam);
    await game.playBall();
    console.log('=========== finish game ============');

    // チームデータの更新
    const gameResults = {
      game: game.gameRec,
      players: game.playerResults,
      pitcher: game.pitcherResult,
    };
    await teamTop.update('top', topTeam, gameResults);
    await teamBot.update('bottom', botTeam, gameResults);

    // Current テーブルの更新
    if (game.gameRec.top.score > game.gameRec.bottom.score) {
      currentData[0].team = topTeam;
      currentData[0].continueWin = 1;
    }
    else {
      currentData[0].team = botTeam;
      currentData[0].continueWin++;
    }
    await current.update(currentData[0]);

    // ゲームログの保存
    const gameLog = new GameLogController();
    const saveLog = await gameLog.save(times, topTeamId, botTeamId,  game.gameRec);

    return {
      gameLog: saveLog,
      gameRecord: game.gameRec,
      scoreBoard: game.scoreBoard,
      hitBoard: game.hitBoard,
      outBoard: game.outBoard,
      inningRecords: game.inningRecords,
      playerResults: game.playerResults,
      pitcherResult: game.pitcherResult,
      wallOff: game.wallOff,
    };
  }
}

export interface GameResults {
  game: TopBottom<GameRecord>,
  players: TopBottom<BattingResult[]>,
  pitcher: TopBottom<PitchingResult>,
}
