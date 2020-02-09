import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  Index,
  OneToOne,
  JoinColumn,
  OneToMany
} from 'typeorm';
import { BaseColumn } from './BaseColumn';
import { User } from './User';
import { TeamData } from './TeamData';
import { Player } from './Player';
import { Pitcher } from './Pitcher';
import { CurrentData } from './CurrentData';
import { GameLog } from './GameLog';

@Entity()
export class Team extends BaseColumn {

  @PrimaryGeneratedColumn({unsigned: true})
  id: number;

  @Index('u_idx_name', {unique: true})
  @Column({length: 10})
  name: string;

  @Column({length: 16})
  icon: string;

  @Index('idx_user_id')
  @OneToOne(type => User, user => user.team, { cascade: true })
  @JoinColumn({name: 'user_id'})
  user: User;

  @Column({name: 'type_attack', type: 'tinyint', default: 5})
  typeAttack: number;

  @Column({name: 'type_bunt', type: 'tinyint', default: 5})
  typeBunt: number;

  @Column({name: 'type_steal', type: 'tinyint', default: 5})
  typeSteal: number;

  @Column({name: 'type_mind', type: 'tinyint', default: 5})
  typeMind: number;

  @Column({name: 'camp_times', type: 'tinyint', default: 0})
  campTimes: number;

  @OneToMany(type => TeamData, teamData => teamData.team, { cascade: true })
  teamData: TeamData[];

  @OneToOne(type => CurrentData, currentData => currentData.team)
  champion: CurrentData;

  @OneToMany(type => Player, player => player.team, { cascade: true })
  players: Player[];

  @OneToMany(type => Pitcher, pitcher => pitcher.team, { cascade: true })
  pitchers: Pitcher[];

  @OneToMany(type => GameLog, gameLog => gameLog.topTeam, { cascade: true })
  topTeamLog: GameLog[];

  @OneToMany(type => GameLog, gameLog => gameLog.botTeam)
  botTeamLog: GameLog[];
}
