import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  OneToOne,
  JoinColumn
} from 'typeorm';
import { BaseColumn } from './BaseColumn';
import { Team } from './Team';

@Entity()
export class CurrentData extends BaseColumn {

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

}
