import { FindManyOptions, getRepository } from 'typeorm';
import { NextFunction, Request, Response } from 'express';
import { CommentNews } from '../entity/CommentNews';

export class CommentNewsController {

  private commentNewsRepository = getRepository(CommentNews);

  async all(request: Request, response: Response, next: NextFunction) {
    const options: FindManyOptions = {
      relations: ['user', 'gameLog', 'gameLog.topTeam', 'gameLog.botTeam'],
      order: {
        commentDate: 'DESC'
      }
    };

    if (request.query.hasOwnProperty('limit')) {
      options.take = request.query.limit;
    }

    return await this.commentNewsRepository.find(options);
  }

  async one(request: Request, response: Response, next: NextFunction) {
    return await this.commentNewsRepository.findOne(request.params.id, {
      relations: ['user', 'gameLog', 'gameLog.topTeam', 'gameLog.botTeam']
    });
  }

  /**
   * Add comment or news
   * @param request
   * @param response
   * @param next
   */
  async save(request: Request, response: Response, next: NextFunction) {
    const commentNews = new CommentNews();

    commentNews.kind = request.body.kind;
    commentNews.user = request.body.userId;
    commentNews.comment = request.body.comment;
    commentNews.commentDate = new Date();
    commentNews.gameLog = request.body.gameLogId;

    return this.commentNewsRepository.save(commentNews);
  }

  // TODO: 物理削除はしない。active フラグを落とすだけにする。
  async remove(request: Request, response: Response, next: NextFunction) {
    const userToRemove = await this.commentNewsRepository.findOne(request.params.id);
    await this.commentNewsRepository.remove(userToRemove);
  }
}
