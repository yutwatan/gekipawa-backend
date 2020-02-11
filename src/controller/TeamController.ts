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
import { GameResults } from './PlayBallController';
import { BattingResult } from '../model/IBatter';

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
  async getTeamData(teamId: number, times?: number): Promise<Team> {
    const options: FindOneOptions = {
      relations: [
        'teamData',
        'user',
        'players',
        'players.battingData',
        'pitchers',
        'pitchers.pitchingData',
        'pitchers.battingData',
        'topTeamLog',
        'botTeamLog',
      ],
    };

    if (times !== undefined) {
      options.where = { 'teamData.times': times };
    }

    const teamData = await this.teamRepository.findOne(teamId, options);
    return this.sortTeamData(teamData);
  }

  /**
   * Sort by order of player and pitcher
   * @param teamData
   */
  private sortTeamData(teamData: any): any {
    teamData.players.sort((a, b) => {
      return a.order > b.order ? 1 : -1;
    });

    teamData.pitchers.sort((a, b) => {
      return a.order > b.order ? 1 : -1;
    });

    return teamData;
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

  /**
   * Save team data (and user)
   * @param request
   * @param response
   * @param next
   */
  async save(request: Request, response: Response, next: NextFunction) {
    this.times = await this.getCurrentTimes(request, response, next);

    const team = this.getRequestedTeam(request);
    team.teamData = this.getRequestedTeamData(request);
    team.user = this.getRequestedUser(request);
    team.players = this.getRequestedPlayer(request);
    team.pitchers = this.getRequestedPitcher(request);

    return await this.teamRepository.save(team);
  }

  /**
   * Update team params
   * @param request
   * @param response
   * @param next
   */
  async modify(request: Request, response: Response, next: NextFunction) {
    const teamData = await this.getTeamData(request.params.id);
    teamData.typeAttack = request.body.typeAttack;
    teamData.typeBunt = request.body.typeBunt;
    teamData.typeSteal = request.body.typeSteal;
    teamData.typeMind = request.body.typeMind;

    return await this.teamRepository.save(teamData);
  }

  /**
   * Update team data by game results
   * @param ourTorB
   * @param team
   * @param gameResults
   */
  async update(ourTorB: string, team: Team, gameResults: GameResults) {

    // TODO: チームの4つのパラメータも更新する？
    team.teamData = this.getUpdatedTeamData(ourTorB, team, gameResults);
    team.players = this.getUpdatedPlayerData(team, gameResults.players[ourTorB]);
    team.pitchers = this.getUpdatedPitcherData(ourTorB, team, gameResults);

    return await this.teamRepository.save(team);
  }

  /**
   * Set the value by game results to update team data
   * @param ourTorB
   * @param team
   * @param gameResult
   */
  private getUpdatedTeamData(ourTorB: string, team: Team, gameResult: GameResults) {
    const game = gameResult.game;
    const players = gameResult.players;
    const pitcher = gameResult.pitcher;

    const myTeam = ourTorB;
    const otherTeam = ourTorB === 'top' ? 'bottom' : 'top';

    if (game[myTeam].score > game[otherTeam].score) {
      team.teamData[0].win++;
      team.teamData[0].winContinue++;
    }
    else {
      team.teamData[0].lose++;
      team.teamData[0].winContinue = 0;
    }

    team.teamData[0].score += game[myTeam].score;
    team.teamData[0].loseScore += game[otherTeam].score;
    team.teamData[0].atBat += this.getSum(players[myTeam], 'atBat');
    team.teamData[0].hit += this.getSum(players[myTeam], 'hit');
    team.teamData[0].hr += this.getSum(players[myTeam], 'hr');
    team.teamData[0].steal += this.getSum(players[myTeam], 'steal');
    team.teamData[0].error += this.getSum(players[myTeam], 'error');
    team.teamData[0].strikeOut += pitcher[myTeam].strikeOut;
    team.teamData[0].outCount += pitcher[myTeam].outCount;
    team.teamData[0].lossScore += pitcher[myTeam].selfLossScore;

    return team.teamData;
  }

  /**
   * Set the value by game results to update players data
   * @param team
   * @param playerResults
   */
  private getUpdatedPlayerData(team: Team, playerResults: BattingResult[]) {
    for (let i = 0; i < playerResults.length - 1; i++) {
      team.players[i].battingData[0].box += playerResults[i].box;
      team.players[i].battingData[0].atBat += playerResults[i].atBat;
      team.players[i].battingData[0].hit += playerResults[i].hit;
      team.players[i].battingData[0].double += playerResults[i].double;
      team.players[i].battingData[0].triple += playerResults[i].triple;
      team.players[i].battingData[0].hr += playerResults[i].hr;
      team.players[i].battingData[0].batScore += playerResults[i].batScore;
      team.players[i].battingData[0].fourBall += playerResults[i].fourBall;
      team.players[i].battingData[0].strikeOut += playerResults[i].strikeOut;
      team.players[i].battingData[0].sacrificeFly += playerResults[i].sacrificeFly;
      team.players[i].battingData[0].bunt += playerResults[i].bunt;
      team.players[i].battingData[0].steal += playerResults[i].steal;
      team.players[i].battingData[0].stealFailed += playerResults[i].stealFailed;
      team.players[i].battingData[0].error += playerResults[i].error;
    }

    return team.players;
  }

  /**
   * Set the value by game results to update pitchers data
   * @param ourTorB
   * @param team
   * @param gameResult
   */
  private getUpdatedPitcherData(ourTorB: string, team: Team, gameResult) {
    const game = gameResult.game;
    const player = gameResult.players[ourTorB][8];
    const pitcher = gameResult.pitcher[ourTorB];

    // Batting data
    team.pitchers[0].battingData[0].box += player.box;
    team.pitchers[0].battingData[0].atBat += player.atBat;
    team.pitchers[0].battingData[0].hit += player.hit;
    team.pitchers[0].battingData[0].double += player.double;
    team.pitchers[0].battingData[0].triple += player.triple;
    team.pitchers[0].battingData[0].hr += player.hr;
    team.pitchers[0].battingData[0].batScore += player.batScore;
    team.pitchers[0].battingData[0].fourBall += player.fourBall;
    team.pitchers[0].battingData[0].strikeOut += player.strikeOut;
    team.pitchers[0].battingData[0].sacrificeFly += player.sacrificeFly;
    team.pitchers[0].battingData[0].bunt += player.bunt;
    team.pitchers[0].battingData[0].steal += player.steal;
    team.pitchers[0].battingData[0].stealFailed += player.stealFailed;
    team.pitchers[0].battingData[0].error += player.error;

    // Pitching data
    const myTeam = ourTorB;
    const otherTeam = ourTorB === 'top' ? 'bottom' : 'top';

    if (game[myTeam].score > game[otherTeam].score) {
      team.pitchers[0].pitchingData[0].win++;
    }
    else {
      team.pitchers[0].pitchingData[0].lose++;
    }
    team.pitchers[0].pitchingData[0].strikeOut += pitcher.strikeOut;
    team.pitchers[0].pitchingData[0].fourBall += pitcher.fourBall;
    team.pitchers[0].pitchingData[0].hit += pitcher.hit;
    team.pitchers[0].pitchingData[0].hr += pitcher.hr;
    team.pitchers[0].pitchingData[0].wildPitch += pitcher.wildPitch;
    team.pitchers[0].pitchingData[0].outCount += pitcher.outCount;
    team.pitchers[0].pitchingData[0].lossScore += pitcher.lossScore;
    team.pitchers[0].pitchingData[0].selfLossScore += pitcher.selfLossScore;

    // Rotate
    for (let pitcher of team.pitchers) {
      if (pitcher.order === 13) {
        pitcher.order = 18;
      }
      else {
        pitcher.order--;
      }
    }

    return team.pitchers;
  }

  /**
   * Calculate sum value
   * @param results
   * @param item
   */
  private getSum(results: BattingResult[], item: string): number {
    let sum = 0;

    for (let result of results) {
      sum += result[item];
    }

    return sum;
  }

  private getRequestedTeam(request: Request): Team {
    const team = new Team();

    team.name = request.body.teamName;
    team.icon = request.body.icon;
    team.typeAttack = request.body.typeAttack;
    team.typeBunt = request.body.typeBunt;
    team.typeSteal = request.body.typeSteal;
    team.typeMind = request.body.typeMind;

    return team;
  }

  private getRequestedTeamData(request: Request): TeamData[] {
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

  private getRequestedUser(request: Request): User {
    const user = new User();

    user.name = request.body.ownerName;
    user.password = request.body.password;

    return user;
  }

  private getRequestedPlayer(request: Request): Player[] {
    let players: Player[] = [];

    for (let [i, playerData] of request.body.players.entries()) {
      players.push(this.getPlayerData(playerData, i + 1));
    }

    for (let [i, playerData] of request.body.farmPlayers.entries()) {
      players.push(this.getPlayerData(playerData, i + 9));
    }

    return players;
  }

  private getRequestedPitcher(request: Request): Pitcher[] {
    let pitchers: Pitcher[] = [];

    for (let [i, pitcherData] of request.body.pitchers.entries()) {
      const pitcher = new Pitcher();

      pitcher.name = pitcherData.playerName;
      pitcher.order = i + 13;
      pitcher.speed = pitcherData.speed;
      pitcher.change = pitcherData.change;
      pitcher.control = pitcherData.control;
      pitcher.defense = pitcherData.defense;
      pitcher.pitchingData = this.generatePitchingData();
      pitcher.battingData = this.generateBattingData();

      pitchers.push(pitcher);
    }

    return pitchers;
  }

  private generatePitchingData(): PitchingData[] {
    const pitchingData: PitchingData[] = [];

    const pitching = new PitchingData();
    pitching.times = this.times;
    pitchingData.push(pitching);

    return pitchingData;
  }

  private generateBattingData(): BattingData[] {
    const battingData: BattingData[] = [];

    const batting = new BattingData();
    batting.times = this.times;
    battingData.push(batting);

    return battingData;
  }

  private getPlayerData(playerData: any, index: number): Player {
    const player = new Player();

    player.name = playerData.playerName;
    player.order = index;
    player.position = index < 9 ? playerData.position : Position.BENCH;
    player.power = playerData.power;
    player.meet = playerData.meet;
    player.run = playerData.run;
    player.defense = playerData.defense;
    player.battingData = this.generateBattingData();

    return player;
  }

  /**
   * Get current times
   * @param request
   * @param response
   * @param next
   */
  private async getCurrentTimes(request: Request, response: Response, next: NextFunction): Promise<number> {
    const current = new CurrentController();
    const currentData = await current.get(request, response, next);
    return currentData[0].times;
  }
}
