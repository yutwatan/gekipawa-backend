import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  OneToMany
} from 'typeorm';
import { Team } from './Team';
import { PitchingData } from './PitchingData';
import { BattingData } from './BattingData';
import { Condition } from './Player';

@Entity()
@Index('idx_team_id_order', ['team', 'order'])
export class Pitcher {

  @PrimaryGeneratedColumn({unsigned: true})
  id: number;

  @Column({length: 8})
  name: string;

  @Index('idx_team_id')
  @ManyToOne(type => Team, team => team.pitchers)
  @JoinColumn({name: 'team_id'})
  team: Team;

  @Column('tinyint')
  order: number;

  @Column('enum', {enum: Condition, default: Condition.NORMAL})
  condition: number;

  @Column({type: 'tinyint', default: 5})
  speed: number;

  @Column({type: 'tinyint', default: 5})
  change: number;

  @Column({type: 'tinyint', default: 5})
  control: number;

  @Column({type: 'tinyint', default: 5})
  defense: number;

  @Column({default: true})
  active: boolean;

  @CreateDateColumn()
  created: Date;

  @UpdateDateColumn()
  updated: Date;

  @OneToMany(type => PitchingData, pitchingData => pitchingData.pitcherId, {cascade: true})
  pitchingData: PitchingData[];

  @OneToMany(type => BattingData, battingData => battingData.batterId, {cascade: true})
  battingData: BattingData[];
}

