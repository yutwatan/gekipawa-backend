import { Batter } from './Batter';
import { Pitcher } from './Pitcher';
import { User } from './User';

export class Team {
  name: string;
  user: User;
  typeAttack: number;
  typeBunt: number;
  typeSteal: number;
  typeMind: number;
  teamData: any;
  players: Batter[];
  pitchers: Pitcher[];

  constructor(team: any) {
    this.name = team.name;
    this.user = new User(team.user);
    this.typeAttack = team.typeAttack;
    this.typeBunt = team.typeBunt;
    this.typeSteal = team.typeSteal;
    this.typeMind = team.typeMind;
    this.teamData = team.teamData[0];
    this.players = this.getBatters(team.players);
    this.pitchers = this.getPitchers(team.pitchers);
  }

  getPlayersByPosition(): PlayerPosition {
    const playersPosition = {
      catcher: undefined,
      center: undefined,
      first: undefined,
      left: undefined,
      pitcher: undefined,
      right: undefined,
      second: undefined,
      shortstop: undefined,
      third: undefined
    };

    for (let player of this.players) {
      switch (player.position) {
        case '捕':
          playersPosition.catcher = player;
          break;
        case '一':
          playersPosition.first = player;
          break;
        case '二':
          playersPosition.second = player;
          break;
        case '三':
          playersPosition.third = player;
          break;
        case '遊':
          playersPosition.shortstop = player;
          break;
        case '左':
          playersPosition.left = player;
          break;
        case '中':
          playersPosition.center = player;
          break;
        case '右':
          playersPosition.right = player;
          break;
        default:
          // 補欠は無視
          break;
      }
    }

    playersPosition.pitcher = this.pitchers[0];

    return playersPosition;
  }

  /**
   * チームの野手の守備力更新（モチベーションを反映）
   */
  updatePlayersDefenseSkill(motivation: number) {
    for (let player of this.players) {
      if (player.order > 8) {
        break;
      }

      player.playDefense = player.defense + motivation + (5 - this.typeAttack) * 0.3;
    }
  }

  /**
   * Entity -> Model 変換（野手編）
   * @param players 野手データ
   */
  private getBatters(players: any): Batter[] {
    const batters: Batter[] = [];

    for (let player of players) {
      batters.push(new Batter(player));
    }

    return batters;
  }

  /**
   * Entity -> Model 変換（投手編）
   * @param players 投手データ
   */
  private getPitchers(players: any): Pitcher[] {
    const pitchers: Pitcher[] = [];

    for (let player of players) {
      pitchers.push(new Pitcher(player));
    }

    return pitchers;
  }
}

export interface PlayerPosition {
  catcher: Batter;
  first: Batter;
  second: Batter;
  third: Batter;
  shortstop: Batter;
  left: Batter;
  center: Batter;
  right: Batter;
  pitcher: Pitcher;
}
