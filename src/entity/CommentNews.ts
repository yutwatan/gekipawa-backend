import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { User } from './User';
import { GameLog } from './GameLog';

export enum CommentKind {
  COMMENT = 'comment',
  NEWS = 'news',
}

@Entity()
export class CommentNews {

  @PrimaryGeneratedColumn({type: 'bigint', unsigned: true})
  id: number;

  @Column({type: 'enum', enum: CommentKind, default: CommentKind.COMMENT})
  kind: CommentKind;

  @ManyToOne(type => User, user => user.comment)
  @JoinColumn({name: 'user_id'})
  user: User;

  @Column({length: 100})
  comment: string;

  @Column({name: 'comment_date'})
  commentDate: Date;

  @ManyToOne(type => GameLog, gameLog => gameLog.comment)
  @JoinColumn({name: 'game_log_id'})
  gameLog: GameLog;

  @Column({default: true})
  active: boolean;

  @CreateDateColumn()
  created: Date;

  @UpdateDateColumn()
  updated: Date;
}
