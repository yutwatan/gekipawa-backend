import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  ManyToOne,
  JoinColumn,
  OneToMany
} from 'typeorm';
import { BaseColumn } from './BaseColumn';
import { Team } from './Team';
import { CommentNews } from './CommentNews';

@Entity()
export class GameLog extends BaseColumn {

  @PrimaryGeneratedColumn({type: 'bigint', unsigned: true})
  id: number;

  @Index('idx_times')
  @Column({type: 'tinyint', unsigned: true})
  times: number;

  @ManyToOne(type => Team, team => team.topTeam)
  @JoinColumn({name: 'top_team_id'})
  topTeam: Team;

  @ManyToOne(type => Team, team => team.botTeam)
  @JoinColumn({name: 'bot_team_id'})
  botTeam: Team;

  @Column({name: 'top_score', type: 'tinyint', default: 0})
  topScore: number;

  @Column({name: 'bot_score', type: 'tinyint', default: 0})
  botScore: number;

  @Column({name: 'play_date'})
  playDate: Date;

  @OneToMany(type => CommentNews, commentNews => commentNews.gameLog)
  comment: CommentNews;
}
