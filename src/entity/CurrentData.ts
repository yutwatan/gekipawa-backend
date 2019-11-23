import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToOne,
  JoinColumn
} from 'typeorm';
import { Team } from './Team';

@Entity()
export class CurrentData {

  @PrimaryGeneratedColumn({unsigned: true})
  id: number;

  @Index('idx_times', {unique: true})
  @Column({type: 'tinyint', unsigned: true})
  times: number;

  @Column({name: 'start_time'})
  startTime: Date;

  @Column({name: 'end_time'})
  endTime: Date;

  @OneToOne(type => Team, team => team.champion)
  @JoinColumn({name: 'champion_team_id'})
  team: Team;

  @Column({name: 'continue_win'})
  continueWin: number;

  @Column({default: true})
  active: boolean;

  @CreateDateColumn()
  created: Date;

  @UpdateDateColumn()
  updated: Date;
}
