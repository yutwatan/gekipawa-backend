import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToOne,
  OneToMany
} from 'typeorm';
import { Team } from './Team';
import { CommentNews } from './CommentNews';

@Entity()
export class User {

  @PrimaryGeneratedColumn({unsigned: true})
  id: number;

  @Index('idx_name', {unique: true})
  @Column({length: 8})
  name: string;

  @Column({length: 64})
  password: string;

  @Column({default: true})
  active: boolean;

  @CreateDateColumn()
  created: Date;

  @UpdateDateColumn()
  updated: Date;

  @OneToOne(type => Team, team => team.user)
  team: Team;

  @OneToMany(type => CommentNews, commentNews => commentNews.user)
  comment: CommentNews;
}
