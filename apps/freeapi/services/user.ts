import express, { NextFunction } from 'express';
import bodyParser from 'body-parser';
import { PrismaClient } from '@prisma/client';
const bcrypt = require('bcrypt');

export class UserService {
  async createUser(prisma: PrismaClient, body: any) {
    const hashedPassword = await bcrypt.hash(body.password, 10);
    return await prisma.user.create({
      data: {
        id: body.id,
        name: body.name,
        email: body.email,
        username: body.username,
        password: hashedPassword,
      },
    });
  }
}
