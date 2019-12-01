import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  Index,
  ManyToOne,
  OneToMany,
  JoinColumn
} from 'typeorm';
import { BaseColumn } from './BaseColumn';
import { Condition, Position } from './Enum';
import { Team } from './Team';
import { BattingData } from './BattingData';

@Entity()
@Index('idx_team_id_order', ['team', 'order'])
export class Player extends BaseColumn {

  @PrimaryGeneratedColumn({unsigned: true})
  id: number;

  @Column({length: 10})
  name: string;

  @Index('idx_team_id')
  @ManyToOne(type => Team, team => team.players)
  @JoinColumn({name: 'team_id'})
  team: Team;

  @Column('tinyint')
  order: number;

  @Column('enum', {enum: Position, default: Position.CATCHER})
  position: Position;

  @Column('enum', {enum: Condition, default: Condition.NORMAL})
  condition: Condition;

  @Column({type: 'tinyint', default: 5})
  power: number;

  @Column({type: 'tinyint', default: 5})
  meet: number;

  @Column({type: 'tinyint', default: 5})
  run: number;

  @Column({type: 'tinyint', default: 5})
  defense: number;

  @OneToMany(type => BattingData, battingData => battingData.playerId, {cascade: true})
  battingData: BattingData[];

}
