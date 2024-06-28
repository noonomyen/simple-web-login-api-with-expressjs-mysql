import { Connection, RowDataPacket } from "mysql2/promise";
import { Request, Response, NextFunction } from "express";
import { validate } from 'uuid';

import { UserAuth } from "./types";

declare global {
    namespace Express {
        interface Request {
            auth: UserAuth
        }
    }
}

type middleware_type = (req: Request, res: Response, next: NextFunction) => void;

let __auth_middle: middleware_type | undefined = undefined;
let __content_filter_middle: middleware_type | undefined = undefined;

function ISID(res: Response): void {
    res.clearCookie("sid");
    res.status(403).json({ message: "Error, Invalid session id" }).end();
}

function auth_middle(db_client: Connection): middleware_type {
    if (__auth_middle === undefined) {
        __auth_middle = async function __auth_middle(req, res, next) {
            if (typeof req.cookies.sid === "string" && req.cookies.sid.length === 36 && validate(req.cookies.sid)) {
                db_client.execute<RowDataPacket[]>("SELECT * FROM sessions, users WHERE session_id = ? AND sessions.user_id = users.user_id", [req.cookies.sid]).then((value) => {
                    const [result, _] = value;
                    if (result.length === 1) {
                        delete result[0].password;
                        req.auth = result[0] as UserAuth;
                        next();
                    } else {
                        ISID(res);
                    }
                });
            } else {
                ISID(res);
            }
        }
    }

    return __auth_middle;
}

function content_filter_middle(filter: string): middleware_type {
    if (__content_filter_middle === undefined) {
        __content_filter_middle = async function __content_filter_middle(req, res, next) {
            if (req.is(filter)) next();
            else res.status(400).json({ message: "Bad request" }).end();
        }
    }

    return __content_filter_middle;
}

export {
    auth_middle,
    content_filter_middle
}
