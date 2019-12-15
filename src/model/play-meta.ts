import { Player } from '../entity/Player';
import { Pitcher } from '../entity/Pitcher';

export class PlayMeta {
  steal: number;
  stealPlayer: Player;
  getScore: number;
  outCount: number;
  error: number;
  errorPlayer: Player;
  wildPitch: number;
  wildPitcher: Pitcher;
  battingData: {
    player: Player,
    result: string,
    hit: number,
    hr: number,
    batScore: number,
    strikeOut: number,
    fourBall: number,
    bunt: number,
  };
}
