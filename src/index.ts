import { GraphQLServer } from "graphql-yoga";
import { importSchema } from "graphql-import";
import { Prisma } from "./generated/prisma";
import { Context, getUserUid, AuthError } from "./utils";
import * as admin from "firebase-admin";
import { rule, shield, and, or, not } from "graphql-shield";

const resolvers = {
  Query: {
    async authenticateUser(parent, args, context: Context, info) {
      const uid = await getUserUid(args.token); 
      if(!uid) throw new AuthError;
      const user = await context.db.query.user({ where: { uid } }, info);
      if(!user) {
        return context.db.mutation.createUser({ 
          data: {
            uid,
            preferences: {
              create:{

              }
            }
          }
        }, info);
      }
      return user; 
    }
  },
  Mutation: {
    async updatePreferences(parent, {token, subscribeNewsletter}, context: Context, info) {
      const uid = await getUserUid(token); 
      return context.db.mutation.updateUser(
        {
          data: {
            preferences: {
              update: { subscribeNewsletter }
            }
          },
          where: { uid }
        },
        info
      );
    }
  }
};
const prisma = new Prisma({
  endpoint: process.env.PRISMA_ENDPOINT, // the endpoint of the Prisma DB service (value is set in .env)
  secret: process.env.PRISMA_SECRET, // taken from database/prisma.yml (value is set in .env)
  debug: false // log all GraphQL queries & mutations
});

const server = new GraphQLServer({
  typeDefs: "./src/schema.graphql",
  resolvers,
  context: req => ({
    ...req,
    db: prisma,
  })
});

console.log("Firebase: Start initialization");

if (!process.env.FIREBASE_CREDS_URL) {
  console.error("Firebase: Please provide the FIREBASE_CREDS_URL envvar.");
  process.exit(1);
}

var serviceAccount = require(process.env.FIREBASE_CREDS_URL);

console.log(`Firebase: Connecting...`);

// Initialize the app with a service account, granting admin privileges
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

server.start(() => console.log("Server is running on http://localhost:4000"));
