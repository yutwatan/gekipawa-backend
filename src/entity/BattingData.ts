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

  @Column({type: 'smallint', default: 0, comment: '打数'})
  atBat: number;

  @Column({type: 'smallint', default: 0})
  hit: number;

  @Column({type: 'smallint', default: 0})
  hr: number;

  @Column({name: 'bat_score', type: 'smallint', default: 0})
  batScore: number;

  @Column({name: 'four_ball', type: 'smallint', default: 0})
  fourBall: number;

  @Column({name: 'strike_out', type: 'smallint', default: 0})
  strikeOut: number;

  @Column({type: 'smallint', default: 0})
  bunt: number;

  @Column({type: 'smallint', default: 0})
  steal: number;

  @Column({type: 'smallint', default: 0})
  error: number;

}
