import { inferAsyncReturnType } from '@trpc/server';
import { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import { prisma } from './prisma/client';

export const createContext = ({ req, res }: CreateExpressContextOptions) => {
  return {
    prisma,
    req,
    res,
  };
};

export type Context = inferAsyncReturnType<typeof createContext>; 