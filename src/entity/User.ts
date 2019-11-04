import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('user')
export class User {

  @PrimaryGeneratedColumn()
  id: number;

  @Index({unique: true})
  @Column({length: 8, unique: true})
  name: string;

  @Column({length: 16})
  password: string;

  @Column({default: true})
  active: boolean;

  @CreateDateColumn('datetime')
  created: any;

  @UpdateDateColumn('datetime')
  updated: any;
}
