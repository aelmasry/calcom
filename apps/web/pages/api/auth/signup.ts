import { IdentityProvider } from "@prisma/client";
import { NextApiRequest, NextApiResponse } from "next";
import { resolve } from "path";

import { hashPassword } from "@lib/auth";
import prisma from "@lib/prisma";
import slugify from "@lib/slugify";

const jsonwebtoken = require("jsonwebtoken");

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return;
  }

  const data = req.body;
  const { name, email } = data;
  const userEmail = email.toLowerCase();
  const username = slugify(name.toLowerCase());
  // If no time zone is provided user's time zone
  // Declare timeZone outside of the if-else blocks
  let timezone;
  if (req.body.timezone === "" || req.body.timezone === null || req.body.timezone === undefined) {
    timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  } else {
    timezone = req.body.timezone;
  }

  //generate a random password
  const password = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

  if (!username) {
    res.status(422).json({ message: "Invalid username" });
    return;
  }

  if (!userEmail || !userEmail.includes("@")) {
    res.status(422).json({ message: "Invalid email" });
    return;
  }

  if (!password || password.trim().length < 7) {
    res.status(422).json({ message: "Invalid input - password should be at least 7 characters long." });
    return;
  }

  // There is actually an existingUser if username matches
  // OR if email matches and both username and password are set
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { username },
        {
          AND: [{ email: userEmail }, { password: { not: null } }, { username: { not: null } }],
        },
      ],
    },
  });

  if (existingUser) {
    const message: string =
      existingUser.email !== userEmail ? "Username already taken" : "Email address is already registered";

    return res.status(409).json({ message });
  }

  const hashedPassword = await hashPassword(password);

  const user = await prisma.user.upsert({
    where: { email: userEmail },
    update: {
      username,
      name: name,
      timeZone: timezone,
      password: hashedPassword,
      emailVerified: new Date(Date.now()),
      identityProvider: IdentityProvider.CAL,
    },
    create: {
      username,
      name: name,
      timeZone: timezone,
      email: userEmail,
      password: hashedPassword,
      identityProvider: IdentityProvider.CAL,
    },
  });

  // If user has been invitedTo a team, we accept the membership
  if (user.invitedTo) {
    await prisma.membership.update({
      where: {
        userId_teamId: { userId: user.id, teamId: user.invitedTo },
      },
      data: {
        accepted: true,
      },
    });
  }

  const jsonSecret = process.env.JWT_SECRET;
  const token = jsonwebtoken.sign(
    {
      data: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    jsonSecret
  );

  return res.status(201).json({ user, message: "Created user", token });
}
