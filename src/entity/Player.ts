import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne, OneToMany, JoinColumn
} from 'typeorm';
import { Team } from './Team';
import { BattingData } from './BattingData';

export enum Position {
  CATCHER   = '捕',
  FIRST     = '一',
  SECOND    = '二',
  THIRD     = '三',
  SHORTSTOP = '遊',
  LEFT      = '左',
  CENTER    = '中',
  RIGHT     = '右',
}

export enum Condition {
  AWFUL     = 1,
  BAD       = 2,
  NORMAL    = 3,
  GOOD      = 4,
  EXCELLENT = 5,
}

@Entity()
@Index('idx_team_id_order', ['team', 'order'])
export class Player {

  @PrimaryGeneratedColumn({unsigned: true})
  id: number;

  @Column({length: 10})
  name: string;

  @Index('idx_team_id')
  @ManyToOne(type => Team, team => team.players)
  @JoinColumn({name: 'team_id'})
  team: Team;

  @Column('tinyint')
  order: number;

  @Column('enum', {enum: Position, default: Position.CATCHER})
  position: Position;

  @Column('enum', {enum: Condition, default: Condition.NORMAL})
  condition: number;

  @Column({type: 'tinyint', default: 5})
  power: number;

  @Column({type: 'tinyint', default: 5})
  meet: number;

  @Column({type: 'tinyint', default: 5})
  run: number;

  @Column({type: 'tinyint', default: 5})
  defense: number;

  @Column({default: true})
  active: boolean;

  @CreateDateColumn()
  created: Date;

  @UpdateDateColumn()
  updated: Date;

  @OneToMany(type => BattingData, battingData => battingData.batterId, {cascade: true})
  battingData: BattingData[];
}
