import "dotenv/config"
import { db } from "../db";
import { usersTable } from "../db/schema";
import { eq } from "drizzle-orm";
import crypto from "node:crypto"
import type { InferInsertModel } from "drizzle-orm";
import { JWTClaims } from "../utils/user-token";
import { PRIVATE_KEY, PUBLIC_KEY } from "../utils/cert";
import JWT from "jsonwebtoken"

type NewUser = InferInsertModel<typeof usersTable>;


const serverUrl = process.env.SERVER_URL;
const PORT = process.env.PORT;


// Service function to handle user sign-up
export const signUpService = async (data: any) => {
    try {
        const { firstName, lastName, email, password } = data;
        // finding the existing user in the database
        const [existingUser] = await db
            .select({ id: usersTable.id })
            .from(usersTable)
            .where(eq(usersTable.email, email))
            .limit(1);

        if (existingUser) {
            throw new Error("Email is already exists");
        }

        const salt = crypto.randomBytes(16).toString("hex");
        const hash = crypto
            .createHash("sha256")
            .update(password + salt)
            .digest("hex");

        const newUser: NewUser = {
            firstName,
            lastName: lastName || undefined,
            email,
            password: hash,
            salt,
            profileImageURL: undefined,
            emailVerified: false,
        };

        await db.insert(usersTable).values(newUser);

        return { ok: true };
    } catch (error) {
        console.error(error);
        throw error;
    }
}


// Service function to handle user sign-in
export const signInService = async (data: any) => {
    try {
        const { email, password } = data;
        if (!email || !password) {
            throw new Error("Email or Password is missing");
        };

        const [user] = await db
            .select()
            .from(usersTable)
            .where(eq(usersTable.email, email))
            .limit(1)

        if (!user || !user.password || !user.salt) {
            throw new Error("Invalid email or password");
        };

        const hash = crypto
            .createHash("sha256")
            .update(password + user.salt)
            .digest("hex")

        if (hash !== user.password) {
            throw new Error("Invalid Password");
        };

        const ISSUER = `${serverUrl}:${PORT}`;
        const now = Math.floor(Date.now() / 1000);

        const claims: JWTClaims = {
            iss: ISSUER,
            sub: user.id,
            email: user.email,
            email_verified: String(user.emailVerified),
            exp: now + 3600,
            given_name: user.firstName ?? "",
            family_name: user.lastName ?? undefined,
            name: [user.firstName, user.lastName].filter(Boolean).join(" "),
            picture: user.profileImageURL ?? undefined,
        };

        const token = JWT.sign(claims, PRIVATE_KEY, { algorithm: "RS256" })

        return { token };
    } catch (error) {
        console.error(error);
        throw error;
    };
};


// Service function to handle user info
export const userInfoService = async (authHeader?: string) => {

    if (!authHeader?.startsWith("Bearer ")) {
        throw new Error("Missing or invalid Authorization header");
    };

    const token = authHeader.slice(7);

    let cliams: JWTClaims;
    try {
        cliams = JWT.verify(token, PUBLIC_KEY, {
            algorithms: ["RS256"]
        }) as JWTClaims;
    } catch (error) {
        throw new Error("Invalid or expired token");
    };

    const [user] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, cliams.sub))
        .limit(1)

    if (!user) {
        throw new Error("User not found");
    };

    return {
        sub: user.id,
        email: user.email,
        email_verified: user.emailVerified,
        given_name: user.firstName,
        family_name: user.lastName,
        name: [user.firstName, user.lastName].filter(Boolean).join(" "),
        picture: user.profileImageURL,
    };
} ;