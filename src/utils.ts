import { Prisma } from './generated/prisma'
import * as admin from "firebase-admin";

export interface Context {
  db: Prisma
  request: any
  user: any
}
export class AuthError extends Error {
  constructor() {
    super('Not authorized');
  }
}
// TODO implement session tokens
export async function getUser(request: any, db){
  // TODO ugly nested request. Refactor?
  const auth = request.request.get('Authorization');
  if (auth) {
    const token = auth.replace("Bearer ", "");
    let data = await admin.auth().verifyIdToken(token).catch(() => {return null});
    if(!data) return null; 
    console.log("I get called");
    let user = await db.query.user({
      where: {
        uid: data.uid
      }
    }, `{ id }`);
    if (!user) {
      user = await db.mutation.createUser({
        data: {
          uid: data.uid,
          roles: ["USER"]
        }
      });
    }
    return user; 
  } else {
    return null
  }
}