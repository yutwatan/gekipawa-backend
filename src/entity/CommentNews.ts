import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { BaseColumn } from './BaseColumn';
import { CommentKind } from './Enum';
import { User } from './User';
import { GameLog } from './GameLog';

@Entity()
export class CommentNews extends BaseColumn {

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

}
