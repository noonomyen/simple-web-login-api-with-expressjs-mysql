import { Connection, ResultSetHeader, QueryError, RowDataPacket } from "mysql2/promise";
import { hash, compare } from "bcrypt";
import { v4 } from "uuid";
import express from "express";

import { User } from "./types";
import { auth_middle, content_filter_middle } from "./middle";

export default function api_routing(db_client: Connection): express.Router {
    const router = express.Router();

    router.post("/api/login", content_filter_middle("application/json"), (req, res) => {
        if (
            typeof req.body.username === "string" && req.body.username.match(/^[A-Za-z][\w-]{5,32}$/) &&
            typeof req.body.password === "string"
        ) {
            db_client.execute<RowDataPacket[]>("SELECT * FROM users WHERE username = ? LIMIT 1", [req.body.username]).then((value) => {
                const [result, _] = value;
                if (result.length > 0) {
                    const user = result[0] as User;
                    compare(req.body.password, user.password, (err, same) => {
                        if (err) {
                            res.status(500).json({ message: "Internal error" }).end();
                        } else {
                            if (same) {
                                const session_id = v4().toString();
                                db_client.execute<ResultSetHeader>("INSERT INTO sessions (user_id, session_id) VALUES (?, ?)", [user.user_id, session_id]).then((value) => {
                                    const [result, _] = value;
                                    if (result.affectedRows > 0) {
                                        res.cookie("sid", session_id);
                                        res.status(200).json({
                                            message: "ok",
                                            user: {
                                                user_id: user.user_id,
                                                display_name: user.display_name,
                                                email: user.email,
                                                username: user.username
                                            } as User
                                        }).end();
                                    } else {
                                        res.status(500).json({ message: "Internal error" }).end();
                                    }
                                });
                            } else {
                                res.status(403).json({ message: "Incorrect password" }).end();
                            }
                        }
                    });
                } else {
                    res.status(403).json({ message: "Username is not found" }).end();
                }
            }).catch(err => {
                res.status(500).json({ message: "Database error" }).end();
            });
        } else {
            res.status(400).json({ message: "Bad request" }).end();
        }
    });

    router.get("/api/user", auth_middle(db_client), (req, res) => {
        res.status(200).json({
            message: "ok",
            user: {
                user_id: req.auth.user_id,
                display_name: req.auth.display_name,
                email: req.auth.email,
                username: req.auth.username
            } as User
        });
    });

    router.put("/api/register", content_filter_middle("application/json"), (req, res) => {
        if (
            typeof req.body.display_name === "string" && req.body.display_name.match(/^(?=.{1,64}$)[\w\s]+$/) &&
            typeof req.body.email === "string" && req.body.email.match(/^(?=.{1,255}$)[\w\.-]+@([\w-]+\.)+[\w-]{2,4}$/) &&
            typeof req.body.username === "string" && req.body.username.match(/^[A-Za-z][\w-]{5,32}$/) &&
            typeof req.body.password === "string"
        ) {
            hash(req.body.password, 10).then((password) => {
                const rows = [
                    req.body.display_name,
                    req.body.email,
                    req.body.username,
                    password
                ];

                db_client.execute<ResultSetHeader>("INSERT INTO users (display_name, email, username, password) VALUES (?, ?, ?, ?)", rows).then((value) => {
                    const [result, _] = value;
                    if (result.affectedRows > 0) {
                        res.status(200).json({
                            message: "ok",
                            user: {
                                user_id: result.insertId,
                                display_name: rows[0],
                                email: rows[1],
                                username: rows[2]
                            }
                        }).end();
                    } else {
                        res.status(500).json({ message: "Internal error" }).end();
                    }
                }).catch((err: QueryError) => {
                    if (err.errno === 1062) res.status(400).json({ message: "Username is duplicated" }).end();
                    else res.status(500).json({ message: "Internal error" }).end();
                });
            });
        } else {
            res.status(400).json({ message: "Bad requst" }).end();
        }
    });

    router.post("/api/logout", auth_middle(db_client), (req, res) => {
        db_client.execute<ResultSetHeader>("DELETE FROM sessions WHERE session_id = ?", [req.auth.session_id]).then((value) => {
            const [result, _] = value;
            if (result.affectedRows > 0) {
                res.clearCookie("sid");
                res.status(200).json({ message: "ok" }).end();
            } else {
                res.status(404).json({ message: "Not found this session Id" }).end();
            }
        })
    });

    return router;
}
