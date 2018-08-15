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
export async function getUserUid(token){
  let data = await admin.auth().verifyIdToken(token).catch(error => {
    console.log(error)
    throw new AuthError()
  });
  if(data){
    return data.uid
  }
}