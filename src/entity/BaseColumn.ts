import {
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export abstract class BaseColumn {

  @Column({default: true})
  active: boolean;

  @CreateDateColumn()
  created: Date;

  @UpdateDateColumn()
  updated: Date;

}
