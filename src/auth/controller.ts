import { Request, Response } from "express";
import "dotenv/config"
import { PUBLIC_KEY } from "../utils/cert";
import jose from "node-jose";
import path from "node:path";
import { signInSchema, signUpSchema } from "./validator";
import { signInService, signUpService, userInfoService } from "./service";


const serverUrl = process.env.SERVER_URL;
const PORT = process.env.PORT;


// controller for the well-known openid-configuration
export const openIdConfig = async (req: Request, res: Response) => {
    try {
        const ISSUER = `${serverUrl}:${PORT}`
        return res.json({
            issuer: ISSUER,
            authorization_endpoint: `${ISSUER}/o/authenticate`,
            userinfo_endpoint: `${ISSUER}/o/userinfo`,
            jwks_uri: `${ISSUER}/.well-known/jwks.json`,
        })
    } catch (error: any) {
        console.log("Internal server Error: ", error);
    }
}


// controller for the well-known jwks
export const jwksResponse = async (req: Request, res: Response) => {
    try {
        const key = await jose.JWK.asKey(PUBLIC_KEY, "pem");

        return res.json({
            keys: [key.toJSON()]
        })
    } catch (error: any) {
        console.log("Internal Server Error: ", error);
    }
}


// controller for getting user data 
export const authenticate = async (req: Request, res: Response) => {
    try {
        return res.sendFile(path.resolve("public", "authenticate.html"));
    } catch (error: any) {
        console.log("Internal Server Error: ", error)
    }
}


// sign-up controller
export const signUpController = async (req: Request, res: Response) => {
    try {
        const parsed = signUpSchema.parse(req.body);

        const result = await signUpService(parsed);

        res.status(201).json(result);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    };
};

// sign-in controller
export const signInController = async (req: Request, res: Response) => {
    try {
        const parsed = signInSchema.parse(req.body);

        const result = await signInService(parsed);

        res.status(200).json(result);
    } catch (error: any) {
        res.status(401).json({ message: error.message });
    };
};


// user-info controller
export const userInfoController = async (req: Request, res: Response) => {
    try {
        const result = await userInfoService(req.headers.authorization);

        res.status(200).json(result);
    } catch (error : any) {
        res.status(401).json({ message: error.message });
    };
};