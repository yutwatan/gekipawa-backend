import { NextFunction, Request, Response } from 'express';
import { FindManyOptions, getRepository } from 'typeorm';
import { GameLog } from '../entity/GameLog';
import { Team } from '../entity/Team';

export class GameLogController {
  private gameLogRepository = getRepository(GameLog);
  private times: number;
  private topTeamId: Team;
  private botTeamId: Team;

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
   * @param game
   */
  async save(game) {
    const gameLog = new GameLog();

    gameLog.times = this.times;
    gameLog.topTeam = this.topTeamId;
    gameLog.botTeam = this.botTeamId;
    gameLog.topScore = game.gameRec.top.score;
    gameLog.botScore = game.gameRec.bottom.score;
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
