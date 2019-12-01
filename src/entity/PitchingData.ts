import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  Index,
  JoinColumn,
  ManyToOne
} from 'typeorm';
import { BaseColumn } from './BaseColumn';
import { Pitcher } from './Pitcher';

@Entity()
export class PitchingData extends BaseColumn {

  @PrimaryGeneratedColumn({type: 'bigint', unsigned: true})
  id: number;

  @Index('idx_times')
  @Column()
  times: number;

  @ManyToOne(type => Pitcher, pitcher => pitcher.pitchingData)
  @JoinColumn({name: 'pitcher_id'})
  pitcherId: Pitcher;

  @Column({type: 'smallint', default: 0})
  win: number;

  @Column({type: 'smallint', default: 0})
  lose: number;

  @Column({name: 'strike_out', type: 'smallint', default: 0})
  strikeOut: number;

  @Column({name: 'four_ball', type: 'smallint', default: 0})
  fourBall: number;

  @Column({type: 'smallint', default: 0})
  hit: number;

  @Column({type: 'smallint', default: 0})
  hr: number;

  @Column({type: 'smallint', default: 0})
  error: number;

  @Column({name: 'out_count', type: 'smallint', default: 0})
  outCount: number;

  @Column({name: 'loss_score', type: 'smallint', default: 0})
  lossScore: number;

}
