import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { Player } from './Player';

export enum BatterKind {
  PLAYER  = '野手',
  PITCHER = '投手',
}

@Entity()
@Index('idx_batter_kind_batter_id', ['batterKind', 'batterId'])
export class BattingData {
  @PrimaryGeneratedColumn({type: 'bigint', unsigned: true})
  id: number;

  @Index('idx_times')
  @Column()
  times: number;

  @Column({name: 'batter_kind', type: 'enum', enum: BatterKind, default: BatterKind.PLAYER})
  batterKind: BatterKind;

  @ManyToOne(type => Player, player => player.battingData)
  @JoinColumn({name: 'batter_id'})
  batterId: number;

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

  @Column({default: true})
  active: boolean;

  @CreateDateColumn()
  created: Date;

  @UpdateDateColumn()
  updated: Date;
}
