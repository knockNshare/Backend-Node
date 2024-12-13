CREATE DATABASE projets_devops;
USE projets_devops;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('resident', 'service_provider', 'administrator') NOT NULL DEFAULT 'resident',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Events table
CREATE TABLE events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    event_date DATETIME NOT NULL,
    creator_id INT NOT NULL, -- Link to the user who created the event
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (creator_id) REFERENCES users(id)
);

-- Services table
CREATE TABLE services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    service_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    user_id INT NOT NULL, -- Link to the user
    start_date DATETIME NOT NULL, -- Service start date
    end_date DATETIME NULL, -- Service end date (can be NULL if ongoing)
    status VARCHAR(20) DEFAULT 'ongoing', -- Service status: "ongoing", "completed", "canceled"
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Conversations table
CREATE TABLE conversations (
    id INT AUTO_INCREMENT PRIMARY KEY, -- Unique conversation ID
    participant_ids TEXT NOT NULL, -- List of participant IDs (e.g., "1,2,3")
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- Conversation creation date
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP -- Last update timestamp
);

-- Messages table for conversations
CREATE TABLE messages (
    id INT AUTO_INCREMENT PRIMARY KEY, -- Unique message ID
    conversation_id INT NOT NULL, -- Link to the conversation
    sender_id INT NOT NULL, -- Link to the sender
    content TEXT NOT NULL, -- Message content
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- Message sending time
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Community projects table
CREATE TABLE projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(50) NOT NULL, -- Example: "pending", "approved", "canceled"
    proposer_id INT NOT NULL, -- Link to the user who proposed the project
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (proposer_id) REFERENCES users(id)
);

-- Votes table for community projects
CREATE TABLE votes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL, -- Link to the user
    project_id INT NOT NULL, -- Link to the project
    vote VARCHAR(10) NOT NULL, -- Example: "yes", "no"
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (project_id) REFERENCES projects(id)
);

-- Notifications table
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    content TEXT NOT NULL,
    user_id INT NULL, -- Link to the user (NULL for global notifications)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);