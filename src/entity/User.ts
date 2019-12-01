import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  OneToOne,
  OneToMany
} from 'typeorm';
import { BaseColumn } from './BaseColumn';
import { Team } from './Team';
import { CommentNews } from './CommentNews';

@Entity()
export class User extends BaseColumn {

  @PrimaryGeneratedColumn({unsigned: true})
  id: number;

  @Index('idx_name', {unique: true})
  @Column({length: 8})
  name: string;

  @Column({length: 64})
  password: string;

  @OneToOne(type => Team, team => team.user)
  team: Team;

  @OneToMany(type => CommentNews, commentNews => commentNews.user)
  comment: CommentNews;

}
