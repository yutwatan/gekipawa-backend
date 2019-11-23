import { getRepository } from 'typeorm';
import { NextFunction, Request, Response } from 'express';
import { Player } from '../entity/Player';

export class PlayerController {

  private playerRepository = getRepository(Player);

  async all(request: Request, response: Response, next: NextFunction) {
    return await this.playerRepository.find();
  }

  async one(request: Request, response: Response, next: NextFunction) {
    return await this.playerRepository.findOne(request.params.id);
  }

  async save(request: Request, response: Response, next: NextFunction) {
    return await this.playerRepository.save(request.body);
  }

  async remove(request: Request, response: Response, next: NextFunction) {
    const removePlayer = await this.playerRepository.findOne(request.params.id);
    await this.playerRepository.remove(removePlayer);
  }

}
