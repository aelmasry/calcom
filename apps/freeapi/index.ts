import express from 'express';
import bodyParser from 'body-parser';
import { Prisma, PrismaClient } from '@prisma/client';
import { UserService } from './services/user';
import { AvailabilityService } from './services/availability';
import { AuthHelper } from './helpers/auth_helper';
import { useSession } from 'next-auth/react';
import { EventTypeService } from './services/eventType';

const app = express();
var jsonParser = bodyParser.json();

app.post('/user/create', jsonParser, async (req: any, res: any) => {
  const prisma = new PrismaClient();
  const userService = new UserService();
  let user;
  let token;
  let onboarding_url = process.env.NEXT_PUBLIC_WEBAPP_URL + '/getting-started';
  try {
    user = await userService.createUser(prisma, req.body);
    const authHelper = new AuthHelper();
    token = authHelper.createJWTToken(user);
  } catch (e) {
    return res.status(500).json(e);
  }

  return res.json({ token: token, onboarding_url: onboarding_url });
});

app.get('/verifyUser', jsonParser, async (req: any, res: any) => {
  const authHelper = new AuthHelper();
  const prisma = new PrismaClient();
  const redirectLink = req.query.redirect;

  try {
    let user = await authHelper.getUserFromJWTToken(req.query.api_token);

    //make session token
    let data: Prisma.SessionCreateInput = {
      user: { connect: { id: user.id } },
      sessionToken: user.id,
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7 * 4 * 12 * 55555),
    };
    prisma.session.create({ data });
    return res.redirect(
      process.env.NEXT_PUBLIC_WEBAPP_URL + '/' + redirectLink
    );
  } catch (e) {
    return res.redirect(process.env.NEXT_PUBLIC_WEBAPP_URL + '/500');
  }
});

app.post('/schedule/create', jsonParser, async (req: any, res: any) => {
  const prisma = new PrismaClient();
  const availabilityService = new AvailabilityService();
  const eventTypeService = new EventTypeService();
  let schedule;
  let event;

  schedule = await availabilityService.createSchedule(prisma, req.body);
  req.body.scheduleId = schedule.id;
  event = await eventTypeService.createEventType(prisma, req.body);

  return res.json({ schedule, event });
});

const port = process.env.PORT || 3005;

app.listen(port, () => console.log('Listening to port ' + port));
