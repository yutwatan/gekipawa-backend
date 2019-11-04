import { Entity, Column, PrimaryGeneratedColumn, OneToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { Team } from './Team';

@Entity('pitcher')
@Index(['teamId', 'order'])
export class Pitcher {

  @PrimaryGeneratedColumn()
  id: number;

  @Column({length: 8})
  name: string;

  @Index()
  @OneToOne(type => Team)
  @JoinColumn({name: 'team_id'})
  teamId: number;

  @Column('tinyint')
  order: number;

  @Column('tinyint')
  speed: number;

  @Column('tinyint')
  change: number;

  @Column('tinyint')
  control: number;

  @Column('tinyint')
  defense: number;

  @Column({default: true})
  active: boolean;

  @CreateDateColumn('datetime')
  created: any;

  @UpdateDateColumn('datetime')
  updated: any;
}

