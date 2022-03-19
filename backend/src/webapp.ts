import type { Express, Request, Response } from 'express';
import type { Logger } from './logger';

type User = {
  id: number
  name: string
  email: string
};

const users: User[] = [
  { id: 1, name: "User1", email: "user1@test.local" },
  { id: 2, name: "User2", email: "user2@test.local" },
  { id: 3, name: "User3", email: "user3@test.local" }
];

type UserParams = {
  name: string
};

export default function registerHandlers(app: Express, logger: Logger) {

  app.get('/user/:name', (req: Request<UserParams>, res: Response) => {
    if (req.params.name) {
      const user = users.find(user => user.name === req.params.name);
      if (user) {
        res.send(JSON.stringify({
          email: user.email
        }));
      }
      else {
        res.status(404);
        res.send(JSON.stringify({ msg: 'user not found' }));
      }
    }
    else {
      res.status(400);
      res.send(JSON.stringify({ msg: 'bad request' }));
    }
  });

}

