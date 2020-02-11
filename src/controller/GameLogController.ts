import { NextFunction, Request, Response } from 'express';
import { FindManyOptions, getRepository } from 'typeorm';
import { GameLog } from '../entity/GameLog';
import { Team } from '../entity/Team';
import { TopBottom } from '../model/GameStatus';
import { GameRecord } from '../model/Game';

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
   * Save the game log
   * @param times
   * @param topTeamId
   * @param botTeamId
   * @param gameRecord
   */
  async save(times: number, topTeamId: Team, botTeamId: Team, gameRecord: TopBottom<GameRecord>) {
    const gameLog = new GameLog();

    gameLog.times = times;
    gameLog.topTeam = topTeamId;
    gameLog.botTeam = botTeamId;
    gameLog.topScore = gameRecord.top.score;
    gameLog.botScore = gameRecord.bottom.score;
    gameLog.playDate = new Date();

    return await this.gameLogRepository.save(gameLog);
  }

  /*
  async remove(request: Request, response: Response, next: NextFunction) {
    const userToRemove = await this.gameLogRepository.findOne(request.params.id);
    await this.gameLogRepository.remove(userToRemove);
  }
   */
}
