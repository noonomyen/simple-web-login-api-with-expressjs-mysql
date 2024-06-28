CREATE USER 'simple-login-server'@'127.0.0.1' IDENTIFIED BY '';
GRANT ALL PRIVILEGES ON simple_login.* TO 'simple-login-server'@'127.0.0.1' WITH GRANT OPTION;
