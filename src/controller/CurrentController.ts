import { getRepository } from 'typeorm';
import { NextFunction, Request, Response } from 'express';
import { CurrentData } from '../entity/CurrentData';

export class CurrentController {

  private currentRepository = getRepository(CurrentData);

  /**
   * Get a latest record
   * @param request
   * @param response
   * @param next
   */
  async get(request: Request, response: Response, next: NextFunction) {
    return await this.currentRepository.find({
      order: {
        times: 'DESC'
      },
      take: 1
    });
  }

  async save(request: Request, response: Response, next: NextFunction) {
    const currentData = new CurrentData();

    currentData.times = request.body.times;
    if (request.body.startTime) {
      currentData.startTime = request.body.startTime;
    }
    if (request.body.endTime) {
      currentData.endTime = request.body.endTime;
    }

    return await this.currentRepository.save(request.body);
  }
}
