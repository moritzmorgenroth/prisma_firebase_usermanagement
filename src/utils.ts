import { Prisma } from './generated/prisma'
import * as admin from "firebase-admin";

export interface Context {
  db: Prisma
  request: any
}
export class AuthError extends Error {
  constructor() {
    super('Not authorized');
  }
}
export async function getUserId(ctx: Context) {
  const Authorization = ctx.request.get("Authorization");
  if (Authorization) {
    const token = Authorization.replace("Bearer ", "");
    let data = await admin.auth().verifyIdToken(token);
    if(!data) return null; 
    let user = await ctx.db.query.user({
      where: {
        uid: data.uid
      }
    });
    if (!user) {
      user = await ctx.db.mutation.createUser({
        data: {
          uid: data.uid
        }
      });
    }
    return user.id;
  }
  throw new AuthError();
}