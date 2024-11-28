CREATE TABLE user (
    id SERIAL PRIMARY KEY,         
    chat_id BIGINT NOT NULL UNIQUE, 
    username VARCHAR(255),         
    balance INTEGER DEFAULT 1000,
    status TEXT[] DEFAULT '{}',
    exp INTEGER DEFAULT 0,
    rank TEXT
);

CREATE TABLE slot_game (
    id SERIAL PRIMARY KEY,         
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, 
    reel JSONB NOT NULL,           
    bet_step INTEGER DEFAULT 10,   
    last_win INTEGER DEFAULT 0,    
    max_win INTEGER DEFAULT 0,
    machine_lives INTEGER DEFAULT 50
);

CREATE TABLE gifts (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    last_collected TIMESTAMP NOT NULL DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);
