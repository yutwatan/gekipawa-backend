import 'reflect-metadata';
import { createConnection } from 'typeorm';
import * as express from 'express';
import * as bodyParser from 'body-parser';
import { Request, Response } from 'express';
import { Routes } from './routes';

(async () => {
  try {
    await createConnection();

    // create express app
    const app = express();
    app.use(bodyParser.json());

    // register express routes from defined application routes
    Routes.forEach(route => {
      (app as any)[route.method](
        route.route,
        (req: Request, res: Response, next: Function) => {
          const result = new (route.controller as any)()[route.action](
            req,
            res,
            next
          );
          res.set('Access-Control-Allow-Origin', '*');
          if (result instanceof Promise) {
            result.then(result =>
              result !== null && result !== undefined
                ? res.send(result)
                : res.sendStatus(404)
            );
          }
          else if (result !== null && result !== undefined) {
            res.json(result);
          }
        }
      );
    });

    // setup express app here
    // ...
    app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
      res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, OPTIONS');

      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
      }
      else {
        next();
      }
    });

    /*
    app.options('*', (req, res) => {
      res.sendStatus(200);
    });

     */

    // start express server
    app.listen(3000);

    console.log('Express server has started on port 3000.');
    console.log('Open http://localhost:3000/users to see results');
  }
  catch (e) {
    console.log(e);
  }
})();
