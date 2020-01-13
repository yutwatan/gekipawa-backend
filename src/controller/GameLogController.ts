import { FindManyOptions, getRepository } from 'typeorm';
import { NextFunction, Request, Response } from 'express';
import { GameLog } from '../entity/GameLog';
import { CurrentController } from './CurrentController';
import { Game } from '../model/Game';

export class GameLogController {

  private gameLogRepository = getRepository(GameLog);

  async all(request: Request, response: Response, next: NextFunction) {
    const options: FindManyOptions = {
      relations: ['topTeam', 'botTeam'],
      order: {
        playDate: 'DESC'
      }
    };

    if (request.query.hasOwnProperty('times')) {
      options.where = { times: request.query.times };
    }
    if (request.query.hasOwnProperty('limit')) {
      options.take = request.query.limit;
    }

    return await this.gameLogRepository.find(options);
  }

  async one(request: Request, response: Response, next: NextFunction) {
    return await this.gameLogRepository.findOne(request.params.id, {
      relations: ['topTeam', 'botTeam']
    });
  }

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

    // 試合の処理
    console.log('=========== start game ============');
    const game = new Game(times, topTeamId, botTeamId);
    await game.playBall();
    console.log('=========== finish game ============');

    const gameLog = new GameLog();
    gameLog.times = times;
    gameLog.topTeam = topTeamId;
    gameLog.botTeam = botTeamId;
    gameLog.topScore = game.score.top;
    gameLog.botScore = game.score.bottom;
    gameLog.playDate = new Date();
    const savedLog = await this.gameLogRepository.save(gameLog);

    return {
      gameLog: savedLog,
      scoreBoard: game.scoreBoard,
      hitBoard: game.hitBoard,
      outBoard: game.outBoard,
      inningRecords: game.inningRecords,
      score: game.score,
      wallOff: game.wallOff,
    };
  }

  /*
  async remove(request: Request, response: Response, next: NextFunction) {
    const userToRemove = await this.gameLogRepository.findOne(request.params.id);
    await this.gameLogRepository.remove(userToRemove);
  }
   */
}
