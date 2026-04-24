import { Router } from "express";
import { 
    authenticate, 
    jwksResponse, 
    openIdConfig, 
    signInController, 
    signUpController, 
    userInfoController 
} from "./controller";
import { authMiddleware } from "./middleware";


const router = Router();


// well-known/openid-configuration
router.get("/.well-known/openid-configuration", openIdConfig);


// well-known/jwks.json
router.get("/.well-known/jwks.json", jwksResponse);

    
// authenticate
router.get("/o/authenticate", authenticate);

// sign in 
router.post("/o/authenticate/sign-in", signInController);

// sign up
router.post("/o/authenticate/sign-up", signUpController);

// user info
router.get("/o/userinfo",authMiddleware, userInfoController);


export default router;