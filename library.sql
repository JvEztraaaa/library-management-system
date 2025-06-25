-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jun 19, 2025 at 08:19 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `library`
--

-- --------------------------------------------------------

--
-- Table structure for table `borrowed_books`
--

CREATE TABLE `borrowed_books` (
  `id` int(11) NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `author` varchar(255) DEFAULT NULL,
  `genre` varchar(255) DEFAULT NULL,
  `status` enum('Pending','Approved','Rejected','Borrowed','Returned','Overdue') DEFAULT 'Pending',
  `borrow_time` timestamp NOT NULL DEFAULT current_timestamp(),
  `user_id` int(11) DEFAULT NULL,
  `due_date` datetime DEFAULT NULL,
  `fine_amount` decimal(10,2) DEFAULT 0.00,
  `admin_comment` text DEFAULT NULL,
  `approved_by` int(11) DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `cancelled_at` datetime DEFAULT NULL,
  `return_time` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Triggers `borrowed_books`
--
DELIMITER $$
CREATE TRIGGER `check_overdue` BEFORE UPDATE ON `borrowed_books` FOR EACH ROW BEGIN
    IF NEW.status = 'Borrowed' AND NEW.due_date < NOW() THEN
        SET NEW.status = 'Overdue';
        SET NEW.fine_amount = DATEDIFF(NOW(), NEW.due_date) * 20;
    END IF;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `update_return_time` BEFORE UPDATE ON `borrowed_books` FOR EACH ROW BEGIN
    IF NEW.status = 'Returned' AND OLD.status != 'Returned' THEN
        SET NEW.return_time = NOW();
    END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `calendar_events`
--

CREATE TABLE `calendar_events` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `event_date` date NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `location` varchar(255) NOT NULL,
  `event_type` enum('Book Fair','Author Visit','Workshop','Library Closure','Other') NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `calendar_events`
--

INSERT INTO `calendar_events` (`id`, `title`, `description`, `event_date`, `start_time`, `end_time`, `location`, `event_type`, `created_at`) VALUES
(22, 'Project Presentation', '', '2025-06-10', '10:30:00', '10:30:00', 'asdasdsad', 'Other', '2025-06-10 02:31:04'),
(26, 'New Book', '', '2025-06-16', '18:20:00', '18:20:00', 'Library', 'Other', '2025-06-13 15:19:51');

-- --------------------------------------------------------

--
-- Table structure for table `favorites`
--

CREATE TABLE `favorites` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `book_title` varchar(255) NOT NULL,
  `book_author` varchar(255) NOT NULL,
  `book_genre` varchar(255) NOT NULL,
  `book_cover` varchar(255) NOT NULL,
  `book_image` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `login_log`
--

CREATE TABLE `login_log` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `login_time` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `type` varchar(50) DEFAULT NULL,
  `book_title` varchar(255) DEFAULT NULL,
  `message` text DEFAULT NULL,
  `timestamp` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `first_name` varchar(255) NOT NULL,
  `last_name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `student_number` char(5) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` varchar(10) DEFAULT 'user',
  `avatar_url` varchar(255) DEFAULT '../homepage/images/default_avatar.jpg',
  `gender` enum('male','female') DEFAULT NULL,
  `status` enum('IN','OUT') DEFAULT 'OUT',
  `check_in_count` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `first_name`, `last_name`, `email`, `student_number`, `password_hash`, `role`, `avatar_url`, `gender`, `status`, `check_in_count`) VALUES
(2, 'Admin', '', 'admin@nu.com', '00001', '$2y$10$eS3eyNyT7IbbXk/Mqqk7muoT7j9NLoOcOwnjT3uEotMUTuXy6yaUG', 'admin', '../homepage/images/default_avatar.jpg', 'male', 'OUT', 0),
(3, 'Jan', 'Estrada', 'jan@nu.com', '00002', '$2y$10$pMNsVyy/xkXJA4RGLdwQCevw9jutelGbxzDxHo3O2rL5mg/qAQQES', 'user', '../homepage/images/default_avatar.jpg', 'male', 'OUT', 0),
(4, 'Alvin', 'Malabaguio', 'alvin@nu.com', '00003', '$2y$10$pMNsVyy/xkXJA4RGLdwQCevw9jutelGbxzDxHo3O2rL5mg/qAQQES', 'user', '../homepage/images/default_avatar.jpg', 'male', 'OUT', 0),
(5, 'Shaina', 'Rynne', 'shaina@nu.com', '00004', '$2y$10$pMNsVyy/xkXJA4RGLdwQCevw9jutelGbxzDxHo3O2rL5mg/qAQQES', 'user', '../homepage/images/default_avatar.jpg', 'female', 'OUT', 0),
(6, 'Daniela', 'Filoteo', 'daniela@nu.com', '00005', '$2y$10$pMNsVyy/xkXJA4RGLdwQCevw9jutelGbxzDxHo3O2rL5mg/qAQQES', 'user', '../homepage/images/default_avatar.jpg', 'female', 'OUT', 0),
(7, 'Jericho', 'Buena', 'jericho@nu.com', '00006', '$2y$10$pMNsVyy/xkXJA4RGLdwQCevw9jutelGbxzDxHo3O2rL5mg/qAQQES', 'user', '../homepage/images/default_avatar.jpg', 'male', 'OUT', 0),
(14, 'prince', 'ramirez', 'prince@nu.com', '00007', '$2y$10$2G89/dr.SqUNV0zAjUpOGOHmyuSRPy7DC/r2fPIdpabP5xa93Zi1K', 'user', '../homepage/images/default_avatar.jpg', 'male', 'OUT', 0);

-- --------------------------------------------------------

--
-- Table structure for table `user_notifications`
--

CREATE TABLE `user_notifications` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `type` varchar(50) NOT NULL,
  `message` text NOT NULL,
  `book_id` int(11) DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `borrowed_books`
--
ALTER TABLE `borrowed_books`
  ADD PRIMARY KEY (`id`),
  ADD KEY `borrowed_books_ibfk_approved_by` (`approved_by`),
  ADD KEY `idx_borrow_time` (`borrow_time`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_return_time` (`return_time`);

--
-- Indexes for table `calendar_events`
--
ALTER TABLE `calendar_events`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `favorites`
--
ALTER TABLE `favorites`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_book` (`user_id`,`book_title`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `idx_user_book` (`user_id`,`book_title`);

--
-- Indexes for table `login_log`
--
ALTER TABLE `login_log`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `user_notifications`
--
ALTER TABLE `user_notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_read` (`user_id`,`is_read`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `borrowed_books`
--
ALTER TABLE `borrowed_books`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=325;

--
-- AUTO_INCREMENT for table `calendar_events`
--
ALTER TABLE `calendar_events`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT for table `favorites`
--
ALTER TABLE `favorites`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=165;

--
-- AUTO_INCREMENT for table `login_log`
--
ALTER TABLE `login_log`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=50;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=263;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `user_notifications`
--
ALTER TABLE `user_notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=140;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `borrowed_books`
--
ALTER TABLE `borrowed_books`
  ADD CONSTRAINT `borrowed_books_ibfk_approved_by` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`);

--
-- Constraints for table `favorites`
--
ALTER TABLE `favorites`
  ADD CONSTRAINT `favorites_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `login_log`
--
ALTER TABLE `login_log`
  ADD CONSTRAINT `login_log_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `user_notifications`
--
ALTER TABLE `user_notifications`
  ADD CONSTRAINT `user_notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
