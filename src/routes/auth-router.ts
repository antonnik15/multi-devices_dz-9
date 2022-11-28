import {Response, Request, Router} from "express";
import {usersService} from "../domain/users-service";
import {
    inputUsersValidationResult, userVerification, ValidationOfUsersInputParameters
} from "../middlewares/input-users-validation-middlewares";
import {jwtService} from "../application/jwt-service";
import {authMiddleware} from "../middlewares/auth-middleware";
import {authService} from "../domain/auth-service";

export const authRouter = Router({})

authRouter.post("/registration",
    ValidationOfUsersInputParameters,
    inputUsersValidationResult,
    userVerification,
    async (req: Request, res: Response) => {
        const userId = await authService.createNewUser(req.body.login, req.body.password, req.body.email);
        if (userId) {
            res.sendStatus(204);
            return;
        }
        res.sendStatus(400)
    })

authRouter.post("/registration-confirmation", async (req: Request, res: Response) => {
    const confirmationResult = await authService.confirmEmail(req.body.code);
    if (confirmationResult) {
        res.sendStatus(204)
        return;
    }
    res.status(400).send({ errorsMessages: [{ message: "some problem with code confirmation", field: "code" }]})
})

authRouter.post("/registration-email-resending",
    ValidationOfUsersInputParameters[2],
    inputUsersValidationResult,
    async (req: Request, res: Response) => {
    const resultOfSending = await authService.resendEmailConfirmationMessage(req.body.email);
    if (resultOfSending) {
        res.sendStatus(204)
        return;
    }
    res.status(400).send({ errorsMessages: [{ message: "this user was confirmed, or some problem with email", field: "email" }]});
})

authRouter.post("/login",
    async (req: Request, res: Response) => {
    const user = await usersService.checkCredentials(req.body.loginOrEmail, req.body.password)
    if (user) {
        const token = await jwtService.createJWT(user)
        res.status(200).send({accessToken: token})
        return;
    }
    res.sendStatus(401)
})

authRouter.get("/me",
    authMiddleware,
    async (req: Request, res: Response) => {
    res.status(200).send({
        email: req.user!.email,
        login: req.user!.login,
        userId: req.user!.id
    })
})