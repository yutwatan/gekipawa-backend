import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  Index,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { BaseColumn } from './BaseColumn';
import { Player } from './Player';
import { Pitcher } from './Pitcher';

@Entity()
export class BattingData extends BaseColumn {

  @PrimaryGeneratedColumn({type: 'bigint', unsigned: true})
  id: number;

  @Index('idx_times')
  @Column()
  times: number;

  @Index('idx_player_id')
  @ManyToOne(type => Player, player => player.battingData, { nullable: true })
  @JoinColumn({name: 'player_id'})
  playerId: number;

  @Index('idx_pitcher_id')
  @ManyToOne(type => Pitcher, pitcher => pitcher.battingData, { nullable: true })
  @JoinColumn({name: 'pitcher_id'})
  pitcherId: number;

  @Column({type: 'smallint', default: 0, comment: '打席数'})
  box: number;

  @Column({type: 'smallint', default: 0, comment: '打数'})
  atBat: number;

  @Column({type: 'smallint', default: 0})
  hit: number;

  @Column({type: 'smallint', default: 0, comment: '二塁打'})
  double: number;

  @Column({type: 'smallint', default: 0, comment: '三塁打'})
  triple: number;

  @Column({type: 'smallint', default: 0})
  hr: number;

  @Column({name: 'bat_score', type: 'smallint', default: 0, comment: '打点'})
  batScore: number;

  @Column({name: 'four_ball', type: 'smallint', default: 0})
  fourBall: number;

  @Column({name: 'strike_out', type: 'smallint', default: 0})
  strikeOut: number;

  @Column({type: 'smallint', default: 0, comment: '犠飛'})
  sacrificeFly: number;

  @Column({type: 'smallint', default: 0})
  bunt: number;

  @Column({type: 'smallint', default: 0})
  steal: number;

  @Column({type: 'smallint', default: 0, comment: '盗塁死'})
  stealFailed: number;

  @Column({type: 'smallint', default: 0})
  error: number;

}
