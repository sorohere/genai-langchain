-- Create the students table
CREATE TABLE IF NOT EXISTS students (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50),
    class VARCHAR(50),
    section VARCHAR(10),
    marks INTEGER
);

-- Chat Sessions
CREATE TABLE IF NOT EXISTS chat_sessions (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Chat Messages
CREATE TABLE IF NOT EXISTS chat_messages (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES chat_sessions (id) ON DELETE CASCADE,
    role VARCHAR(20), -- 'user' or 'assistant'
    content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample data for students if empty (handled by app logic usually, but keeping here for reference)
INSERT INTO
    students (name, class, section, marks)
SELECT 'Jainam', 'Data Science', 'A', 90
WHERE
    NOT EXISTS (
        SELECT 1
        FROM students
        WHERE
            name = 'Jainam'
    );

INSERT INTO
    students (name, class, section, marks)
SELECT 'Jackie', 'Data Science', 'B', 100
WHERE
    NOT EXISTS (
        SELECT 1
        FROM students
        WHERE
            name = 'Jackie'
    );

INSERT INTO
    students (name, class, section, marks)
SELECT 'Gadot', 'Data Science', 'A', 86
WHERE
    NOT EXISTS (
        SELECT 1
        FROM students
        WHERE
            name = 'Gadot'
    );

INSERT INTO
    students (name, class, section, marks)
SELECT 'Jacob', 'DevOps', 'A', 50
WHERE
    NOT EXISTS (
        SELECT 1
        FROM students
        WHERE
            name = 'Jacob'
    );

INSERT INTO
    students (name, class, section, marks)
SELECT 'Dikshita', 'DevOps', 'A', 35
WHERE
    NOT EXISTS (
        SELECT 1
        FROM students
        WHERE
            name = 'Dikshita'
    );

INSERT INTO
    students (name, class, section, marks)
SELECT 'Saurabh', 'AI Engineering', 'A', 95
WHERE
    NOT EXISTS (
        SELECT 1
        FROM students
        WHERE
            name = 'Saurabh'
    );

INSERT INTO
    students (name, class, section, marks)
SELECT 'Alex', 'Web Dev', 'B', 88
WHERE
    NOT EXISTS (
        SELECT 1
        FROM students
        WHERE
            name = 'Alex'
    );