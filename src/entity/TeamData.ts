import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index, OneToOne, JoinColumn } from 'typeorm';
import { Team } from './Team';

@Entity()
@Index('idx_times_team', ['times', 'team'], {unique: true})
export class TeamData {

  @PrimaryGeneratedColumn({type: 'bigint', unsigned: true})
  id: number;

  @Index('idx_times')
  @Column({unsigned: true})
  times: number;

  @OneToOne(type => Team, team => team.teamData)
  @JoinColumn({name: 'team_id'})
  team: Team;

  @Column({type: 'smallint', default: 0})
  win: number;

  @Column({type: 'smallint', default: 0})
  lose: number;

  @Column({name: 'win_continue', type: 'smallint', default: 0})
  winContinue: number;

  @Column({type: 'smallint', default: 0})
  score: number;

  @Column({name: 'lose_score', type: 'smallint', default: 0})
  loseScore: number;

  @Column({type: 'smallint', default: 0})
  hr: number;

  @Column({type: 'smallint', default: 0})
  steal: number;

  @Column({name: 'strike_out', type: 'smallint', default: 0})
  strikeOut: number;

  @Column({type: 'smallint', default: 0})
  error: number;

  @Column({default: true})
  active: boolean;

  @CreateDateColumn()
  created: Date;

  @UpdateDateColumn()
  updated: Date;
}
