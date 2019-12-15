import { FindOneOptions, getRepository } from 'typeorm';
import { NextFunction, Request, Response } from 'express';
import { Team } from '../entity/Team';
import { User } from '../entity/User';
import { TeamData } from '../entity/TeamData';
import { Player } from '../entity/Player';
import { Pitcher } from '../entity/Pitcher';
import { BattingData } from '../entity/BattingData';
import { PitchingData } from '../entity/PitchingData';
import { CurrentController } from './CurrentController';
import { Position } from '../entity/Enum';

export class TeamController {
  private teamRepository = getRepository(Team);
  private userRepository = getRepository(User);
  private times: number;

  /**
   * Get all team data
   * @param request
   * @param response
   * @param next
   */
  async all(request: Request, response: Response, next: NextFunction) {
    return await this.teamRepository.find({
      relations: ['user', 'teamData'],
    });
  }

  /**
   * Get a team data
   * @param request
   * @param response
   * @param next
   */
  async one(request: Request, response: Response, next: NextFunction) {
    let times: number;

    if (request.query.hasOwnProperty('times')) {
      times = request.query.times;
    }

    return await this.getTeamData(request.params.id, times);
  }

  /**
   * Get a team data for model code
   * @param teamId
   * @param times
   */
  async getTeamData(teamId: number, times?: number) {
    const options: FindOneOptions = {
      relations: [
        'teamData',
        'user',
        'players',
        'players.battingData',
        'pitchers',
        'pitchers.pitchingData',
        'pitchers.battingData',
        'topTeam',
        'botTeam',
      ],
    };

    if (times !== undefined) {
      options.where = { 'teamData.times': times };
    }

    return await this.teamRepository.findOne(teamId, options);
  }

  /**
   * Save team data (and user)
   * @param request
   * @param response
   * @param next
   */
  async save(request: Request, response: Response, next: NextFunction) {
    this.times = await this._getCurrentTimes(request, response, next);

    const team = this._getRequestedTeam(request);
    team.teamData = this._getRequestedTeamData(request);
    team.user = this._getRequestedUser(request);
    team.players = this._getRequestedPlayer(request);
    team.pitchers = this._getRequestedPitcher(request);

    return await this.teamRepository.save(team);
  }

  /**
   * Remove team (and user)
   * @param request
   * @param response
   * @param next
   */
  // TODO: 物理削除はしない。active フラグを落とすだけにする。
  async remove(request: Request, response: Response, next: NextFunction) {
    const removeTeam = await this.teamRepository.findOne(request.params.id);
    const removeUser = await this.userRepository.findOne(removeTeam.user);

    await this.userRepository.remove(removeUser);
    await this.teamRepository.remove(removeTeam);
  }

  _getRequestedTeam(request: Request): Team {
    const team = new Team();

    team.name = request.body.teamName;
    team.icon = request.body.icon;
    team.typeAttack = request.body.typeAttack;
    team.typeBunt = request.body.typeBunt;
    team.typeSteal = request.body.typeSteal;
    team.typeMind = request.body.typeMind;

    return team;
  }

  _getRequestedTeamData(request: Request): TeamData[] {
    let teamDataList: TeamData[] = [];
    const teamData = new TeamData();

    teamData.times = this.times;
    teamData.win = request.body.win || 0;
    teamData.lose = request.body.lose || 0;
    teamData.winContinue = request.body.winContinue || 0;
    teamData.score = request.body.score || 0;
    teamData.loseScore = request.body.loseScore || 0;
    teamData.hr = request.body.hr || 0;
    teamData.steal = request.body.steal || 0;
    teamData.strikeOut = request.body.strikeOut || 0;
    teamData.error = request.body.error || 0;

    teamDataList.push(teamData);

    return teamDataList;
  }

  _getRequestedUser(request: Request): User {
    const user = new User();

    user.name = request.body.ownerName;
    user.password = request.body.password;

    return user;
  }

  _getRequestedPlayer(request: Request): Player[] {
    let players: Player[] = [];

    for (let [i, playerData] of request.body.players.entries()) {
      players.push(this._getPlayerData(playerData, i + 1));
    }

    for (let [i, playerData] of request.body.farmPlayers.entries()) {
      players.push(this._getPlayerData(playerData, i + 9));
    }

    return players;
  }

  _getRequestedPitcher(request: Request): Pitcher[] {
    let pitchers: Pitcher[] = [];

    for (let [i, pitcherData] of request.body.pitchers.entries()) {
      const pitcher = new Pitcher();

      pitcher.name = pitcherData.playerName;
      pitcher.order = i + 13;
      pitcher.speed = pitcherData.speed;
      pitcher.change = pitcherData.change;
      pitcher.control = pitcherData.control;
      pitcher.defense = pitcherData.defense;
      pitcher.pitchingData = this._generatePitchingData();
      pitcher.battingData = this._generateBattingData();

      pitchers.push(pitcher);
    }

    return pitchers;
  }

  _generatePitchingData(): PitchingData[] {
    const pitchingData: PitchingData[] = [];

    const pitching = new PitchingData();
    pitching.times = this.times;
    pitchingData.push(pitching);

    return pitchingData;
  }

  _generateBattingData(): BattingData[] {
    const battingData: BattingData[] = [];

    const batting = new BattingData();
    batting.times = this.times;
    battingData.push(batting);

    return battingData;
  }

  _getPlayerData(playerData: any, index: number): Player {
    const player = new Player();

    player.name = playerData.playerName;
    player.order = index;
    player.position = index < 9 ? playerData.position : Position.BENCH;
    player.power = playerData.power;
    player.meet = playerData.meet;
    player.run = playerData.run;
    player.defense = playerData.defense;
    player.battingData = this._generateBattingData();

    return player;
  }

  async _getCurrentTimes(request: Request, response: Response, next: NextFunction) {
    const current = new CurrentController();
    const currentData = await current.get(request, response, next);
    return currentData[0].times;
  }
}
