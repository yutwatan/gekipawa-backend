import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index, OneToOne, JoinColumn } from 'typeorm';
import { User } from './User';

@Entity('team')
export class Team {

  @PrimaryGeneratedColumn()
  id: number;

  @Index({unique: true})
  @Column({length: 10})
  name: string;

  @Column({length: 16})
  icon: string;

  @Index()
  @OneToOne(type => User)
  @JoinColumn({name: 'user_id'})
  userId: number;

  @Column({name: 'type_attack', type: 'tinyint', default: 5})
  typeAttack: number;

  @Column({name: 'type_bunt', type: 'tinyint', default: 5})
  typeBunt: number;

  @Column({name: 'type_steal', type: 'tinyint', default: 5})
  typeSteal: number;

  @Column({name: 'type_mind', type: 'tinyint', default: 5})
  typeMind: number;

  @Column({default: true})
  active: boolean;

  @CreateDateColumn('datetime')
  created: any;

  @UpdateDateColumn('datetime')
  updated: any;
}
