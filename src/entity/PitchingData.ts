import { Entity, Column, PrimaryGeneratedColumn, OneToOne, Index, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { Pitcher } from './Pitcher';

@Entity('pitching_data')
export class PitchingData {

  @PrimaryGeneratedColumn({type: 'bigint', unsigned: true})
  id: number;

  @Index()
  @Column()
  times: number;

  @OneToOne(type => Pitcher)
  @JoinColumn({name: 'pitcher_id'})
  pitcherId: number;

  @Column('smallint')
  win: number;

  @Column('smallint')
  lose: number;

  @Column({name: 'strike_out', type: 'smallint'})
  strikeOut: number;

  @Column({name: 'four_ball', type: 'smallint'})
  fourBall: number;

  @Column('smallint')
  hit: number;

  @Column('smallint')
  hr: number;

  @Column('smallint')
  error: number;

  @Column({name: 'loss_score', type: 'smallint'})
  lossScore: number;

  @Column({default: true})
  active: boolean;

  @CreateDateColumn('datetime')
  created: any;

  @UpdateDateColumn('datetime')
  updated: any;
}
