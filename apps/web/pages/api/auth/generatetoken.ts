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
  const username = slugify(userEmail);
  // There is actually an existingUser if username matches
  // OR if email matches and both username and password are set
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { username },
        {
          AND: [{ email: userEmail }, { password: { not: null } }, { username: { not: null } }],
        },
      ],
    },
  });

  if (!user) {
    return res.status(409).json({ message :"user doen't exist" });
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

  return res.status(201).json({ user, message: "Token generated", token });
}
