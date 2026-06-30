/**
 * Central model registry.
 *
 * Importing this file registers every Mongoose model. On serverless platforms
 * (like Vercel) each API route is an isolated function, so a route that calls
 * .populate() on a ref whose model wasn't otherwise imported throws
 * "MissingSchemaError". Importing all models here — and from connectDB — ensures
 * every schema is registered before any query runs.
 */
import { User } from "./User";
import { Campaign } from "./Campaign";
import { Donation } from "./Donation";
import { Update } from "./Update";
import { Comment } from "./Comment";
import { AdminLog } from "./AdminLog";

export { User, Campaign, Donation, Update, Comment, AdminLog };
