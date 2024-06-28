import { createConnection } from "mysql2/promise";

const db_client = createConnection({
    host: "127.0.0.1",
    user: "simple-login-server",
    password: "",
    database: "simple_login",
});

export default db_client;
