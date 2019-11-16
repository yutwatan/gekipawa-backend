import { getRepository } from 'typeorm';
import { NextFunction, Request, Response } from 'express';
import { Pitcher } from '../entity/Pitcher';

export class PitcherController {

  private pitcherRepository = getRepository(Pitcher);

  async all(request: Request, response: Response, next: NextFunction) {
    return this.pitcherRepository.find();
  }

  async one(request: Request, response: Response, next: NextFunction) {
    return this.pitcherRepository.findOne(request.params.id);
  }

  async save(request: Request, response: Response, next: NextFunction) {
    return this.pitcherRepository.save(request.body);
  }

  async remove(request: Request, response: Response, next: NextFunction) {
    const removePitcher = await this.pitcherRepository.findOne(request.params.id);
    await this.pitcherRepository.remove(removePitcher);
  }

}
