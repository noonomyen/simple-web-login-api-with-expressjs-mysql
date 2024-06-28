import express from "express";
import cookieParser from "cookie-parser";

import api_routing from "./api";
import db_client from "./db-conn";

db_client.then((db_client) => {
    const app = express();

    app.use(express.urlencoded({ extended: true }));
    app.use(express.json());
    app.use(cookieParser());
    app.use(api_routing(db_client));
    app.get("/", (req, res) => res.redirect(302, "/login.html"));
    app.use(express.static("public"))

    app.listen(8000, "127.0.0.1", () => {
        console.log("Listening at http://127.0.0.1:8000");
    })
});
