import {body, validationResult} from "express-validator";
import {NextFunction, Response, Request} from "express";

export const InputBlogsValidationMiddlewares = [body("websiteUrl").trim()
    .isLength({max: 100}).withMessage({
        "message": "Length of websiteUrl more than 500",
        "field": "websiteUrl"
    }).isString().withMessage({
        "message": "field websiteUrl is not a string",
        "field": "websiteUrl"
    }).matches(new RegExp("^https://([a-zA-Z0-9_-]+\\.)+[a-zA-Z0-9_-]+(\\/[a-zA-Z0-9_-]+)*\\/?$"))
    .withMessage({
        "message": "field websiteUrl is not valid",
        "field": "websiteUrl"
    }), body("name").trim()
    .isLength({min: 1, max: 15}).withMessage({
        "message": "Length of name more than 15 or less than 1 symbol",
        "field": "name"
    }).isString().withMessage({
        "message": "field name is not a string",
        "field": "name"
    }),
    body("description").trim()
        .isLength({min: 1, max: 500}).withMessage({
        "message": "Length of description more than 500 or less than 1 symbol",
        "field": "description"
    }).isString().withMessage({
        "message": "field description is not a string",
        "field": "description"
    }),
]
export const InputBlogsValidationResult = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({errorsMessages: errors.array().map(m => m.msg)})
    } else {
        next()
    }
}