import {Response, Request, Router} from "express";
import {usersService} from "../domain/users-service";
import {
    emailOrPasswordValidationResult,
    inputUsersValidationResult, userVerification, ValidationOfNewPassword, ValidationOfUsersInputParameters
} from "../middlewares/input-users-validation-middlewares";
import {jwtService} from "../application/jwt-service";
import {authMiddleware} from "../middlewares/auth-middleware";
import {authService} from "../domain/auth-service";
import UAParser from "ua-parser-js";
import {rateLimiterMiddleware} from "../middlewares/rate-limiter-middlewares";


export const authRouter = Router({})

authRouter.post("/registration",
    rateLimiterMiddleware,
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

authRouter.post("/registration-confirmation",
    rateLimiterMiddleware,
    async (req: Request, res: Response) => {
    const confirmationResult = await authService.confirmEmail(req.body.code);
    if (confirmationResult) {
        res.sendStatus(204)
        return;
    }
    res.status(400).send({ errorsMessages: [{ message: "some problem with code confirmation", field: "code" }]})
})

authRouter.post("/registration-email-resending",
    rateLimiterMiddleware,
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
    rateLimiterMiddleware,
    async (req: Request, res: Response) => {
    const user = await usersService.checkCredentials(req.body.loginOrEmail, req.body.password)

    if (user) {
        const accessToken: string = await jwtService.createAccessToken(user.id);
        const refreshToken: string = await jwtService.createRefreshToken(user.id);

        const deviceInfo = UAParser(req.headers["user-agent"]);
        const ipAddress: string = req.ip;

        await authService.createDeviceAuthSession(refreshToken, deviceInfo, ipAddress);

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: true
        });
        res.status(200).send({accessToken: accessToken});
        return;
    }
    res.sendStatus(401)
})

authRouter.post("/refresh-token", async (req: Request, res: Response) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
        res.sendStatus(401);
        return;
    }
    const jwtPayload = await authService.checkRefreshToken(refreshToken);
    if (jwtPayload) {
        const accessToken: string = await jwtService.createAccessToken(jwtPayload.userId);
        const newRefreshToken: string = await jwtService.createRefreshToken(jwtPayload.userId, jwtPayload.deviceId);

        await authService.updateCurrentAuthSession(newRefreshToken);

        res.cookie('refreshToken', newRefreshToken, {
            httpOnly: true,
            secure: true
        });
        res.status(200).send({accessToken: accessToken});
        return;
    }
    res.sendStatus(401)
})

authRouter.post("/logout", async (req: Request, res: Response) => {
    const refreshToken = req.cookies.refreshToken;
    const jwtPayload = await authService.checkRefreshToken(refreshToken);
    if (jwtPayload) {
        await authService.deleteCurrentAuthSession(jwtPayload);
        res.clearCookie('refreshToken');
        res.sendStatus(204);
        return;
    }
    res.sendStatus(401);
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

authRouter.post('/password-recovery',
    rateLimiterMiddleware,
    ValidationOfUsersInputParameters[2],
    emailOrPasswordValidationResult,
    async (req: Request, res: Response) => {
        await authService.sendRecoveryCode(req.body.email);
        res.sendStatus(204);
    })

authRouter.post('/new-password',
    rateLimiterMiddleware,
    ValidationOfNewPassword,
    emailOrPasswordValidationResult,
    async (req: Request, res: Response) => {
        const recoveryPasswordResult = await authService.recoveryPassword(req.body.newPassword, req.body.recoveryCode);
        if (recoveryPasswordResult) {
            res.sendStatus(204)
            return;
        }
        res.status(400).send({ errorsMessages: [{ message: "recoveryCode is incorrect", field: "recoveryCode" }] });
    })
