import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum BatterKind {
  PLAYER  = '野手',
  PITCHER = '投手',
}

@Entity('batting_data')
@Index(['batter_kind', 'batter_id'])
export class BattingData {
  @PrimaryGeneratedColumn({type: 'bigint', unsigned: true})
  id: number;

  @Index()
  @Column()
  times: number;

  @Column({name: 'batter_kind', type: 'enum', enum: BatterKind, default: BatterKind.PLAYER})
  batterKind: BatterKind;

  @Column({name: 'batter_id'})
  batterId: number;

  @Column('smallint')
  hit: number;

  @Column('smallint')
  hr: number;

  @Column({name: 'bat_score', type: 'smallint'})
  batScore: number;

  @Column({name: 'four_ball', type: 'smallint'})
  fourBall: number;

  @Column({name: 'strike_out', type: 'smallint'})
  strikeOut: number;

  @Column('smallint')
  bunt: number;

  @Column('smallint')
  steal: number;

  @Column('smallint')
  error: number;

  @Column({default: true})
  active: boolean;

  @CreateDateColumn('datetime')
  created: any;

  @UpdateDateColumn('datetime')
  updated: any;
}
