import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index  } from 'typeorm';

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

  @Column({default: true})
  active: boolean;

  @CreateDateColumn()
  created: Date;

  @UpdateDateColumn()
  updated: Date;
}
