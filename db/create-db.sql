CREATE DATABASE simple_login;

USE simple_login;

CREATE TABLE users (
    user_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    display_name VARCHAR(64) NOT NULL,
    email VARCHAR(255) NOT NULL,
    username VARCHAR(32) NOT NULL,
    password VARCHAR(64) NOT NULL,
    PRIMARY KEY (user_id),
    UNIQUE KEY (username)
) ENGINE=InnoDB;

CREATE TABLE sessions (
    user_id INT UNSIGNED NOT NULL,
    session_id VARCHAR(36) NOT NULL,
    PRIMARY KEY (session_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
) ENGINE=MEMORY;
