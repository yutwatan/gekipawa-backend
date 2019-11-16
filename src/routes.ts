import { UserController } from './controller/UserController';
import { TeamController } from "./controller/TeamController";

export const Routes = [
  // User
  {
    method: 'get',
    route: '/users',
    controller: UserController,
    action: 'all'
  },
  {
    method: 'get',
    route: '/user/:id',
    controller: UserController,
    action: 'one'
  },
  /*
  {
    method: 'post',
    route: '/user',
    controller: UserController,
    action: 'save'
  },
  {
    method: 'delete',
    route: '/user/:id',
    controller: UserController,
    action: 'remove'
  },
   */

  // Team
  {
    method: 'get',
    route: '/teams',
    controller: TeamController,
    action: 'all'
  },
  {
    method: 'get',
    route: '/team/:id',
    controller: TeamController,
    action: 'one'
  },
  {
    method: 'post',
    route: '/team',
    controller: TeamController,
    action: 'save'
  },
  {
    method: 'delete',
    route: '/team/:id',
    controller: TeamController,
    action: 'remove'
  }
];
