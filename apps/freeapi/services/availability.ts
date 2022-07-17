import { PrismaClient } from '@prisma/client';
const bcrypt = require('bcrypt');

export class AvailabilityService {
  async createSchedule(prisma: PrismaClient, body: any) {
    let data = { name: body.name, user: { connect: { id: body.user_id } } };
    return await prisma.schedule.create({ data });
  }
}
