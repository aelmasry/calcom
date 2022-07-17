import { PrismaClient, Prisma } from '@prisma/client';

export class EventTypeService {
  async createEventType(prisma: PrismaClient, req: any) {
    let title = req.name;
    // make a slug using lowercase title and replace spaces with dashes and add a big random number
    let slug = title.toLowerCase().replace(/\s/g, '-').concat('-' + Math.floor(Math.random() * 1000000));
    let length = 15;
    const data: Prisma.EventTypeCreateInput = {
      title: title,
      slug: slug,
      length: length,
      schedule: {
        connect: {
          id: req.scheduleId
        }
      },
      userId: req.user_id,
    };
    return await prisma.eventType.create({ data });
  }
}
