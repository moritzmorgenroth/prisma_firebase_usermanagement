import { GraphQLServer } from "graphql-yoga";
import { importSchema } from "graphql-import";
import { Prisma } from "./generated/prisma";
import { Context, getUserId } from "./utils";
import * as admin from "firebase-admin";
import { rule, shield, and, or, not } from "graphql-shield";

const resolvers = {
  Query: {
    authenticateUser(parent, args, context: Context, info) {
      return context.db.query.user({ where: { id: context.user } }, info);
    }
  },
  Mutation: {
    updatePreferences(parent, { subscibeNewsletter }, context: Context, info) {
      return context.db.mutation.updatePreferences(
        { data: { subscibeNewsletter } },
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
    user: getUser(req, prisma)
  })
});

console.log("Firebase: Start initialization");

if (!process.env.FIREBASE_CREDS_URL) {
  console.error("Firebase: Please provide the FIREBASE_CREDS_URL envvar.");
  process.exit(1);
}

var databaseURL = process.env.FIREBASE_DATABASE_URL;
var serviceAccount = require(process.env.FIREBASE_CREDS_URL);

console.log(`Firebase: Connecting to ${databaseURL}`);

// Initialize the app with a service account, granting admin privileges
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: databaseURL
});

server.start(() => console.log("Server is running on http://localhost:4000"));
