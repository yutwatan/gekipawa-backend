import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToOne, Index } from 'typeorm';
import { Team } from './Team';

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

@Entity('player')
export class Player {

  @PrimaryGeneratedColumn()
  id: number;

  @Column({length: 10})
  name: string;

  @Index()
  @OneToOne(type => Team)
  @Column({name: 'team_id'})
  teamId: number;

  @Column('tinyint')
  order: number;

  @Column('enum', {enum: Position, default: Position.CATCHER})
  position: Position;

  @Column('tinyint')
  power: number;

  @Column('tinyint')
  meet: number;

  @Column('tinyint')
  run: number;

  @Column('tinyint')
  defense: number;

  @Column({default: true})
  active: boolean;

  @CreateDateColumn('datetime')
  created: any;

  @UpdateDateColumn('datetime')
  updated: any;
}
