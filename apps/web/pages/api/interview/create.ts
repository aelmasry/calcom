import { Prisma } from "@prisma/client";
import { NextApiRequest, NextApiResponse } from "next";

import { getSession } from "@lib/auth";
import prisma from "@lib/prisma";

const jsonwebtoken = require("jsonwebtoken");

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return;
  }

  // get the token from url params
  const token = req.query.token;
  // check if the token is exists and valid
  if (!token) {
    res.status(401).json({ message: "Invalid token" });
    return;
  }
  console.log("################TOKEN", token);
  // decode the token
  let decoded;
  try {
    decoded = jsonwebtoken.decode(token, process.env.JWT_SECRET);
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
    return;
  }
  console.log("################decoded", decoded);
  const userId = decoded.data;
  const data = req.body;
  const { job_id, job_title } = data;
  const name = job_title + "-" + job_id;

  if (!job_id || !job_title) {
    res.status(400).json({ message: "Missing required fields" });
    return;
  }

  //create schedule
  const slug = name
    .toLowerCase()
    .replace(/\s/g, "-")
    .concat("-" + Math.floor(Math.random() * 1000000));
  const schedule = await createSchedule(name, userId, slug);
  console.log("###########schedule", schedule);
  const eventType = await createEventType(name, schedule.id, userId, slug);
  res.status(200).json({
    interview_id: eventType.id,
    interview_slug: slug,
    interview_link: `/event-types/${eventType.id}`,
    schedule_id: schedule.id,
    schedule_link: `/availability/${schedule.id}`,
    duration: eventType.length,
    title: eventType.title,
  });
}

async function createSchedule(name: string, userId: any, slug: any) {
  const data = { name: slug, user: { connect: { id: userId } } };
  return await prisma.schedule.create({ data });
}

async function createEventType(title: any, scheduleId: any, userId: any, slug: any) {
  // make a slug using lowercase title and replace spaces with dashes and add a big random number
  const length = 15;
  const data: Prisma.EventTypeCreateInput = {
    title: title,
    slug: slug,
    disableGuests: true,
    length: length,
    schedule: {
      connect: {
        id: scheduleId,
      },
    },
    userId: userId,
  };
  return await prisma.eventType.create({ data });
}
