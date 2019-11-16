import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, OneToOne } from 'typeorm';
import { Team } from './Team';

@Entity()
export class User {

  @PrimaryGeneratedColumn({unsigned: true})
  id: number;

  @Index('idx_name', {unique: true})
  @Column({length: 8})
  name: string;

  @Column({length: 16})
  password: string;

  @Column({default: true})
  active: boolean;

  @CreateDateColumn()
  created: Date;

  @UpdateDateColumn()
  updated: Date;

  @OneToOne(type => Team, team => team.user)
  team: Team;
}
