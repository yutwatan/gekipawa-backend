import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToOne,
  JoinColumn,
  OneToMany
} from 'typeorm';
import { User } from './User';
import { TeamData } from './TeamData';
import { Player } from './Player';
import { Pitcher } from './Pitcher';

@Entity()
export class Team {

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

  @Column({name: 'camp_times', type: 'tinyint', default: 5})
  campTimes: number;

  @Column({default: true})
  active: boolean;

  @CreateDateColumn()
  created: Date;

  @UpdateDateColumn()
  updated: Date;

  @OneToOne(type => TeamData, teamData => teamData.team, { cascade: true })
  teamData: TeamData;

  @OneToMany(type => Player, player => player.team, { cascade: true })
  players: Player[];

  @OneToMany(type => Pitcher, pitcher => pitcher.team, { cascade: true })
  pitchers: Pitcher[];
}
