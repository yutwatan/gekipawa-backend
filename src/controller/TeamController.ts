import { getRepository } from 'typeorm';
import { NextFunction, Request, Response } from 'express';
import { Team } from '../entity/Team';
import { User } from '../entity/User';
import { TeamData } from '../entity/TeamData';

export class TeamController {

  private teamRepository = getRepository(Team);
  private userRepository = getRepository(User);

  async all(request: Request, response: Response, next: NextFunction) {
    return this.teamRepository.find();
  }

  async one(request: Request, response: Response, next: NextFunction) {
    return this.teamRepository.findOne(request.params.id, {relations: ['teamData', 'userId']});
  }

  /**
   * Save team data (and user)
   * @param request
   * @param response
   * @param next
   */
  async save(request: Request, response: Response, next: NextFunction) {
    const team = this._getRequestedTeam(request);
    team.teamData = this._getRequestedTeamData(request);
    team.user = this._getRequestedUser(request);

    return await this.teamRepository.save(team);
  }

  /**
   * Remove team (and user)
   * @param request
   * @param response
   * @param next
   */
  async remove(request: Request, response: Response, next: NextFunction) {
    const removeTeam = await this.teamRepository.findOne(request.params.id);
    const removeUser = await this.userRepository.findOne(removeTeam.user);

    await this.userRepository.remove(removeUser);
    await this.teamRepository.remove(removeTeam);
  }

  _getRequestedTeam(request: Request) {
    const team = new Team();

    team.name = request.body.teamName;
    team.icon = request.body.icon;
    team.typeAttack = request.body.typeAttack;
    team.typeBunt = request.body.typeBunt;
    team.typeSteal = request.body.typeSteal;
    team.typeMind = request.body.typeMind;

    return team;
  }

  _getRequestedTeamData(request: Request) {
    const teamData = new TeamData();

    teamData.times = request.body.times || 1; // TODO: DB から取得するように修正する
    teamData.win = request.body.win || 0;
    teamData.lose = request.body.lose || 0;
    teamData.winContinue = request.body.winContinue || 0;
    teamData.score = request.body.score || 0;
    teamData.loseScore = request.body.loseScore || 0;
    teamData.hr = request.body.hr || 0;
    teamData.steal = request.body.steal || 0;
    teamData.strikeOut = request.body.strikeOut || 0;
    teamData.error = request.body.error || 0;

    return teamData;
  }

  _getRequestedUser(request: Request) {
    const user = new User();

    user.name = request.body.ownerName;
    user.password = request.body.password;

    return user;
  }
}
