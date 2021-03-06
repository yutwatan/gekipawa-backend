import { UserController } from './controller/UserController';
import { TeamController } from "./controller/TeamController";
import { PlayerController } from './controller/PlayerController';
import { PitcherController } from './controller/PitcherController';
import { CurrentController } from './controller/CurrentController';
import { GameLogController } from './controller/GameLogController';
import { CommentNewsController } from './controller/CommentNewsController';
import { PlayBallController } from './controller/PlayBallController';

export const Routes = [
  // Current data
  {
    method: 'get',
    route: '/current',
    controller: CurrentController,
    action: 'get'
  },
  {
    method: 'post',
    route: '/current',
    controller: CurrentController,
    action: 'save'
  },

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
  },

  // Game Log
  {
    method: 'get',
    route: '/gameLogs',
    controller: GameLogController,
    action: 'all'
  },
  {
    method: 'get',
    route: '/gameLog/:id',
    controller: GameLogController,
    action: 'one'
  },

  // PlayBall
  {
    method: 'post',
    route: '/playBall',
    controller: PlayBallController,
    action: 'playBall'
  },

  // Comment & News
  {
    method: 'get',
    route: '/commentNews',
    controller: CommentNewsController,
    action: 'all'
  },
  {
    method: 'get',
    route: '/commentNews/:id',
    controller: CommentNewsController,
    action: 'one'
  },
  {
    method: 'post',
    route: '/commentNews',
    controller: CommentNewsController,
    action: 'save'
  },
  {
    method: 'delete',
    route: '/commentNews/:id',
    controller: CommentNewsController,
    action: 'remove'
  },

  // Player
  {
    method: 'get',
    route: '/players',
    controller: PlayerController,
    action: 'all'
  },
  {
    method: 'get',
    route: '/player/:id',
    controller: PlayerController,
    action: 'one'
  },
  {
    method: 'post',
    route: '/player',
    controller: PlayerController,
    action: 'save'
  },
  {
    method: 'delete',
    route: '/player/:id',
    controller: PlayerController,
    action: 'remove'
  },

  // Pitcher
  {
    method: 'get',
    route: '/pitchers',
    controller: PitcherController,
    action: 'all'
  },
  {
    method: 'get',
    route: '/pitcher/:id',
    controller: PitcherController,
    action: 'one'
  },
  {
    method: 'post',
    route: '/pitcher',
    controller: PitcherController,
    action: 'save'
  },
  {
    method: 'delete',
    route: '/pitcher/:id',
    controller: PitcherController,
    action: 'remove'
  },
];
