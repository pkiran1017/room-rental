-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Mar 15, 2026 at 02:55 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION";
START TRANSACTION;
SET time_zone = "+00:00";

SET NAMES utf8mb4;

--
-- Database: `room_rental_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `ads`
--

CREATE TABLE `ads` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `banner_title` varchar(150) NOT NULL,
  `description` text DEFAULT NULL,
  `images_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `priority` int(11) NOT NULL DEFAULT 0,
  `card_placement` varchar(50) DEFAULT 'MP_Search',
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `ads`
--

INSERT INTO `ads` (`id`, `banner_title`, `description`, `images_json`, `priority`, `card_placement`, `start_date`, `end_date`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Happy Diwali', 'Communication &amp; interpersonal skills Problem-solving mindset Team collaboration Time management Adaptability and quick learning Attention to detail', '[\"https://i.ibb.co/VpJJ6YH9/r13-jpeg.jpg\"]', 1, 'MP_Search', '2026-03-06', '2026-03-14', 1, '2026-03-09 09:11:18', '2026-03-12 05:30:58'),
(2, 'Testing One', 'and systemic disease characterized', '[\"https://i.ibb.co/QFdGsWpF/diwali2-gif.gif\"]', 2, 'MP_Post1', '2026-02-16', '2026-03-17', 1, '2026-03-09 09:25:24', '2026-03-12 05:29:43');

-- --------------------------------------------------------

--
-- Table structure for table `audit_logs`
--

CREATE TABLE `audit_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `action` varchar(100) NOT NULL,
  `entity_type` varchar(50) NOT NULL,
  `entity_id` varchar(50) DEFAULT NULL,
  `old_values` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `new_values` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `chat_rooms`
--

CREATE TABLE `chat_rooms` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `room_id` varchar(50) NOT NULL,
  `room_listing_id` int(11) DEFAULT NULL COMMENT 'Reference to rooms table if room-related',
  `participant_1` int(11) NOT NULL,
  `participant_2` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `last_message_at` timestamp NULL DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `chat_rooms`
--

INSERT INTO `chat_rooms` (`id`, `room_id`, `room_listing_id`, `participant_1`, `participant_2`, `created_at`, `last_message_at`, `is_active`) VALUES
(4, 'chat_1773032399505_xjrxbyxjf', 4, 4, 3, '2026-03-09 04:59:59', '2026-03-09 05:00:56', 1),
(6, 'chat_1773114180215_fjbqa6pfc', 5, 6, 4, '2026-03-10 03:43:00', '2026-03-10 15:47:36', 1);

-- --------------------------------------------------------

--
-- Table structure for table `contact_leads`
--

CREATE TABLE `contact_leads` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(120) NOT NULL,
  `email` varchar(160) NOT NULL,
  `phone` varchar(40) DEFAULT NULL,
  `subject` varchar(180) NOT NULL,
  `message` text NOT NULL,
  `source_page` varchar(120) DEFAULT NULL,
  `source` varchar(80) NOT NULL DEFAULT 'ContactPage',
  `status` enum('New','Contacted','Qualified','Closed','Spam') NOT NULL DEFAULT 'New',
  `admin_remark` text DEFAULT NULL,
  `is_spam` tinyint(1) NOT NULL DEFAULT 0,
  `spam_score` int(11) NOT NULL DEFAULT 0,
  `spam_reason` varchar(255) DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` varchar(255) DEFAULT NULL,
  `reviewed_by` int(11) DEFAULT NULL,
  `reviewed_at` timestamp NULL DEFAULT NULL,
  `submitted_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `contact_leads`
--

INSERT INTO `contact_leads` (`id`, `name`, `email`, `phone`, `subject`, `message`, `source_page`, `source`, `status`, `admin_remark`, `is_spam`, `spam_score`, `spam_reason`, `ip_address`, `user_agent`, `reviewed_by`, `reviewed_at`, `submitted_at`, `created_at`, `updated_at`) VALUES
(2, 'Smoke Test Lead', 'smoketest+20260315170632@example.com', '9999999999', 'Smoke Lead 20260315170632', 'Automated smoke test submission from Copilot.', NULL, 'ContactPage', 'Spam', NULL, 1, 0, NULL, NULL, NULL, 2, '2026-03-15 12:16:01', '2026-03-15 12:11:14', '2026-03-15 11:36:32', '2026-03-15 12:16:01'),
(3, 'Smoke Test Lead', 'smoketest+20260315170649@example.com', '9999999999', 'Smoke Lead 20260315170649', 'Automated smoke test submission from Copilot.', NULL, 'ContactPage', 'Spam', NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-03-15 12:11:14', '2026-03-15 11:36:49', '2026-03-15 11:39:47'),
(4, 'Smoke Test Lead', 'smoketest+20260315170714@example.com', '9999999999', 'Smoke Lead 20260315170714', 'Automated smoke test submission from Copilot.', NULL, 'ContactPage', 'Closed', NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-03-15 12:11:14', '2026-03-15 11:37:14', '2026-03-15 11:39:43'),
(5, 'Test User', 'test@example.com', '9876543210', 'Need help', 'This is a valid contact message for debugging.', '&#x2F;contact', 'ContactPage', 'New', NULL, 0, 0, NULL, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.26100.7920', NULL, NULL, '2026-03-15 12:11:14', '2026-03-15 12:11:14', '2026-03-15 12:11:14'),
(6, 'Web Studio', 'firewallhacker10@gmail.com', '8888107878', 'Test1', 'Nothing to tell need site', '&#x2F;contact', 'ContactPage', 'Spam', NULL, 1, 0, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', 2, '2026-03-15 12:15:52', '2026-03-15 12:12:28', '2026-03-15 12:12:28', '2026-03-15 12:15:52');

-- --------------------------------------------------------

--
-- Table structure for table `existing_roommates`
--

CREATE TABLE `existing_roommates` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `room_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `city` varchar(100) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `existing_roommates`
--

INSERT INTO `existing_roommates` (`id`, `room_id`, `name`, `city`, `created_at`) VALUES
(1, 4, 'Shab', 'Sillod', '2026-03-09 04:54:53');

-- --------------------------------------------------------

--
-- Table structure for table `expenses`
--

CREATE TABLE `expenses` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `expense_id` varchar(20) NOT NULL,
  `title` varchar(200) NOT NULL,
  `cost` decimal(12,2) NOT NULL,
  `expense_date` date NOT NULL,
  `paid_by` int(11) NOT NULL COMMENT 'User who paid',
  `group_id` varchar(10) NOT NULL,
  `expense_category` varchar(20) NOT NULL DEFAULT 'Daily',
  `trip_label` varchar(150) DEFAULT NULL,
  `split_type` enum('Equal','Custom') DEFAULT 'Equal',
  `due_date` date DEFAULT NULL,
  `is_settled` tinyint(1) DEFAULT 0,
  `settled_at` timestamp NULL DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_by` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `expenses`
--

INSERT INTO `expenses` (`id`, `expense_id`, `title`, `cost`, `expense_date`, `paid_by`, `group_id`, `expense_category`, `trip_label`, `split_type`, `due_date`, `is_settled`, `settled_at`, `notes`, `created_by`, `created_at`, `updated_at`) VALUES
(1, 'E6341X', '455445', 500.00, '2026-03-14', 4, 'H2US3', 'Daily', NULL, 'Equal', '2026-03-16', 1, '2026-03-14 08:13:56', 'Water Bottel', 4, '2026-03-14 08:12:13', '2026-03-14 08:13:56'),
(3, 'E8039X', 'electric', 399.96, '2026-03-14', 4, '8BP3B', 'Daily', NULL, 'Equal', '2026-03-31', 1, '2026-03-14 10:12:23', NULL, 4, '2026-03-14 08:35:03', '2026-03-14 10:12:23'),
(4, 'E8366X', 'Water bill', 6000.00, '2026-03-14', 4, '8BP3B', 'Daily', NULL, 'Equal', '2026-03-31', 1, '2026-03-14 14:28:58', NULL, 4, '2026-03-14 08:35:45', '2026-03-14 14:28:58'),
(5, 'E8733X', 'Pune trip', 5000.00, '2026-03-14', 4, '8BP3B', 'Daily', NULL, 'Equal', '2026-03-31', 1, '2026-03-14 14:16:25', NULL, 4, '2026-03-14 08:55:47', '2026-03-14 14:16:25'),
(6, 'E6373X', 'Goa wallee', 4000.00, '2026-03-14', 4, '8BP3B', 'Daily', NULL, 'Equal', '2026-03-30', 1, '2026-03-14 10:12:23', NULL, 4, '2026-03-14 09:44:48', '2026-03-14 10:12:23'),
(7, 'E3712X', 'Water botteel', 5000.00, '2026-03-14', 4, 'P3E7Q', 'TripOther', NULL, 'Equal', '2026-03-30', 1, '2026-03-14 10:45:59', NULL, 4, '2026-03-14 10:27:19', '2026-03-14 10:45:59'),
(8, 'E4413X', 'March Expense', 5656.00, '2026-03-14', 10, '8BP3B', 'Daily', NULL, 'Equal', '2026-03-30', 1, '2026-03-14 12:24:41', NULL, 10, '2026-03-14 11:36:27', '2026-03-14 12:24:41');

-- --------------------------------------------------------

--
-- Table structure for table `expense_splits`
--

CREATE TABLE `expense_splits` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `expense_id` int(11) NOT NULL,
  `roommate_id` int(11) NOT NULL COMMENT 'Reference to roommates table',
  `amount` decimal(12,2) NOT NULL,
  `is_paid` tinyint(1) DEFAULT 0,
  `paid_at` timestamp NULL DEFAULT NULL,
  `notification_sent` tinyint(1) DEFAULT 0,
  `notification_sent_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `expense_splits`
--

INSERT INTO `expense_splits` (`id`, `expense_id`, `roommate_id`, `amount`, `is_paid`, `paid_at`, `notification_sent`, `notification_sent_at`, `created_at`) VALUES
(1, 1, 6, 250.00, 1, '2026-03-14 08:12:35', 0, NULL, '2026-03-14 08:12:13'),
(2, 1, 7, 250.00, 1, '2026-03-14 08:13:56', 1, '2026-03-14 08:12:39', '2026-03-14 08:12:13'),
(5, 3, 1, 199.98, 1, '2026-03-14 10:12:17', 1, '2026-03-14 10:07:47', '2026-03-14 08:35:03'),
(6, 3, 5, 199.98, 1, '2026-03-14 10:12:23', 0, NULL, '2026-03-14 08:35:03'),
(7, 4, 1, 3000.00, 1, '2026-03-14 10:12:17', 1, '2026-03-14 10:07:47', '2026-03-14 08:35:45'),
(8, 4, 5, 3000.00, 1, '2026-03-14 10:12:23', 0, NULL, '2026-03-14 08:35:45'),
(9, 5, 1, 2500.00, 1, '2026-03-14 10:12:17', 1, '2026-03-14 10:07:47', '2026-03-14 08:55:47'),
(10, 5, 5, 2500.00, 1, '2026-03-14 10:12:23', 0, NULL, '2026-03-14 08:55:47'),
(11, 6, 1, 2000.00, 1, '2026-03-14 10:12:18', 1, '2026-03-14 10:07:47', '2026-03-14 09:44:48'),
(12, 6, 5, 2000.00, 1, '2026-03-14 10:12:23', 0, NULL, '2026-03-14 09:44:48'),
(13, 7, 9, 1666.67, 1, '2026-03-14 10:45:46', 1, '2026-03-14 10:37:02', '2026-03-14 10:27:19'),
(14, 7, 10, 1666.67, 1, '2026-03-14 10:45:51', 1, '2026-03-14 10:39:27', '2026-03-14 10:27:20'),
(15, 7, 11, 1666.66, 1, '2026-03-14 10:45:59', 0, NULL, '2026-03-14 10:27:20'),
(16, 8, 1, 2828.00, 1, '2026-03-14 12:24:39', 0, NULL, '2026-03-14 11:36:27'),
(17, 8, 5, 2828.00, 1, '2026-03-14 12:24:41', 0, NULL, '2026-03-14 11:36:27');

-- --------------------------------------------------------

--
-- Table structure for table `maharashtra_cities`
--

CREATE TABLE `maharashtra_cities` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `city_name` varchar(100) NOT NULL,
  `district` varchar(100) NOT NULL,
  `is_active` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `maharashtra_cities`
--

INSERT INTO `maharashtra_cities` (`id`, `city_name`, `district`, `is_active`) VALUES
(1, 'Pune', 'Pune', 1),
(2, 'Mumbai', 'Mumbai', 1),
(3, 'Nagpur', 'Nagpur', 1),
(4, 'Nashik', 'Nashik', 1),
(5, 'Thane', 'Thane', 1),
(6, 'Kalyan', 'Thane', 1),
(7, 'Navi Mumbai', 'Mumbai', 1),
(8, 'Aurangabad', 'Aurangabad', 1),
(9, 'Solapur', 'Solapur', 1),
(10, 'Kolhapur', 'Kolhapur', 1),
(11, 'Sangli', 'Sangli', 1),
(12, 'Satara', 'Satara', 1),
(13, 'Ahmednagar', 'Ahmednagar', 1),
(14, 'Jalgaon', 'Jalgaon', 1),
(15, 'Latur', 'Latur', 1),
(16, 'Chandrapur', 'Chandrapur', 1),
(17, 'Nanded', 'Nanded', 1),
(18, 'Malegaon', 'Nashik', 1),
(19, 'Akola', 'Akola', 1),
(20, 'Dhule', 'Dhule', 1),
(21, 'Jalna', 'Jalna', 1),
(22, 'Bhusawal', 'Jalgaon', 1),
(23, 'Navi Mumbai Panvel', 'Raigad', 1),
(24, 'Panvel', 'Raigad', 1),
(25, 'Ulhasnagar', 'Thane', 1),
(26, 'Vasai-Virar', 'Palghar', 1),
(27, 'Pimpri-Chinchwad', 'Pune', 1),
(28, 'Nigdi', 'Pune', 1),
(29, 'Hinjewadi', 'Pune', 1),
(30, 'Wakad', 'Pune', 1),
(31, 'Baner', 'Pune', 1),
(32, 'Aundh', 'Pune', 1),
(33, 'Kothrud', 'Pune', 1),
(34, 'Kharadi', 'Pune', 1),
(35, 'Viman Nagar', 'Pune', 1),
(36, 'Magarpatta', 'Pune', 1),
(37, 'Hadapsar', 'Pune', 1),
(38, 'Koregaon Park', 'Pune', 1),
(39, 'Camp', 'Pune', 1),
(40, 'Deccan', 'Pune', 1),
(41, 'Shivaji Nagar', 'Pune', 1);

-- --------------------------------------------------------

--
-- Table structure for table `messages`
--

CREATE TABLE `messages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `chat_room_id` varchar(50) NOT NULL,
  `sender_id` int(11) NOT NULL,
  `message` text NOT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `read_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `messages`
--

INSERT INTO `messages` (`id`, `chat_room_id`, `sender_id`, `message`, `is_read`, `read_at`, `created_at`) VALUES
(2, 'chat_1773031672457_w5gm9xx3u', 4, 'ok', 1, '2026-03-09 04:48:24', '2026-03-09 04:48:24'),
(3, 'chat_1773031672457_w5gm9xx3u', 4, 'hii', 0, NULL, '2026-03-09 04:49:06'),
(4, 'chat_1773032399505_xjrxbyxjf', 4, 'hi', 1, '2026-03-09 05:17:58', '2026-03-09 05:00:02'),
(5, 'chat_1773032399505_xjrxbyxjf', 4, 'bfbmk', 1, '2026-03-09 05:17:58', '2026-03-09 05:00:31'),
(6, 'chat_1773032399505_xjrxbyxjf', 4, 'rgrg', 1, '2026-03-09 05:17:58', '2026-03-09 05:00:43'),
(7, 'chat_1773032399505_xjrxbyxjf', 4, 'grglrm', 1, '2026-03-09 05:17:58', '2026-03-09 05:00:50'),
(8, 'chat_1773032399505_xjrxbyxjf', 4, 'tg,hlglh,b', 1, '2026-03-09 05:17:58', '2026-03-09 05:00:56'),
(9, 'chat_1773114180215_fjbqa6pfc', 6, 'Hii dude', 1, '2026-03-10 03:43:21', '2026-03-10 03:43:04'),
(10, 'chat_1773114180215_fjbqa6pfc', 4, 'HII', 1, '2026-03-10 15:47:33', '2026-03-10 03:43:24'),
(11, 'chat_1773114180215_fjbqa6pfc', 6, 'ok', 1, '2026-03-12 05:18:03', '2026-03-10 15:47:36');

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `type` enum('Room_Approved','Room_Rejected','Room_Expired','Broker_Approved','Expense_Due','Chat_Message','Roommate_Invite','System') NOT NULL,
  `title` varchar(200) NOT NULL,
  `message` text NOT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `read_at` timestamp NULL DEFAULT NULL,
  `reference_id` varchar(50) DEFAULT NULL,
  `reference_type` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`id`, `user_id`, `type`, `title`, `message`, `is_read`, `read_at`, `reference_id`, `reference_type`, `created_at`) VALUES
(17, 1, 'System', 'New Room Pending Approval', 'New room \"Dormitory Unfurnished Apartment in Deccan Gymkhana\" posted by Web Studio', 0, NULL, 'R6358N', 'room', '2026-03-09 04:54:53'),
(18, 2, 'System', 'New Room Pending Approval', 'New room \"Dormitory Unfurnished Apartment in Deccan Gymkhana\" posted by Web Studio', 1, '2026-03-09 05:14:50', 'R6358N', 'room', '2026-03-09 04:54:53'),
(20, 1, 'System', 'New Room Pending Approval', 'New room \"1BHK Semi-furnished Apartment in Navi Peth\" posted by Kiran Santosh Pandit', 0, NULL, 'R1023N', 'room', '2026-03-09 04:55:44'),
(21, 2, 'System', 'New Room Pending Approval', 'New room \"1BHK Semi-furnished Apartment in Navi Peth\" posted by Kiran Santosh Pandit', 1, '2026-03-09 05:14:50', 'R1023N', 'room', '2026-03-09 04:55:44'),
(23, 4, 'Room_Approved', 'Room Approved', 'Your room \"1BHK Semi-furnished Apartment in Navi Peth\" has been approved', 1, '2026-03-09 05:29:08', 'R1023N', 'room', '2026-03-09 04:59:25'),
(24, 3, 'Room_Approved', 'Room Approved', 'Your room \"Dormitory Unfurnished Apartment in Deccan Gymkhana\" has been approved', 0, NULL, 'R6358N', 'room', '2026-03-09 04:59:29'),
(25, 3, 'Chat_Message', 'New Message', 'New message from Kiran Santosh Pandit', 0, NULL, 'chat_1773032399505_xjrxbyxjf', 'chat', '2026-03-09 05:00:02'),
(26, 3, 'Chat_Message', 'New Message', 'New message from Kiran Santosh Pandit', 0, NULL, 'chat_1773032399505_xjrxbyxjf', 'chat', '2026-03-09 05:00:31'),
(27, 3, 'Chat_Message', 'New Message', 'New message from Kiran Santosh Pandit', 0, NULL, 'chat_1773032399505_xjrxbyxjf', 'chat', '2026-03-09 05:00:43'),
(28, 3, 'Chat_Message', 'New Message', 'New message from Kiran Santosh Pandit', 0, NULL, 'chat_1773032399505_xjrxbyxjf', 'chat', '2026-03-09 05:00:50'),
(29, 3, 'Chat_Message', 'New Message', 'New message from Kiran Santosh Pandit', 0, NULL, 'chat_1773032399505_xjrxbyxjf', 'chat', '2026-03-09 05:00:56'),
(30, 6, 'Broker_Approved', 'Broker Account Approved', 'Your broker account has been approved', 1, '2026-03-09 08:13:17', NULL, NULL, '2026-03-09 06:55:54'),
(31, 5, 'Broker_Approved', 'Broker Account Approved', 'Your broker account has been approved', 0, NULL, NULL, NULL, '2026-03-09 07:04:07'),
(32, 5, 'System', 'Subscription Updated', 'Your subscription has been updated.', 0, NULL, '3', 'subscription', '2026-03-09 07:49:14'),
(33, 6, 'System', 'Subscription Updated', 'Your subscription has been updated.', 1, '2026-03-09 08:13:17', '2', 'subscription', '2026-03-09 07:49:20'),
(34, 5, 'System', 'Subscription Updated', 'Your subscription has been updated.', 0, NULL, '3', 'subscription', '2026-03-09 07:52:20'),
(35, 6, 'System', 'Subscription Updated', 'Your subscription has been updated.', 1, '2026-03-09 08:13:17', '2', 'subscription', '2026-03-09 07:52:40'),
(36, 6, 'System', 'Subscription Updated', 'Your subscription has been updated.', 1, '2026-03-09 08:13:17', '2', 'subscription', '2026-03-09 07:53:15'),
(37, 6, 'System', 'Subscription Updated', 'Your subscription has been updated.', 1, '2026-03-09 08:13:17', '2', 'subscription', '2026-03-09 08:04:18'),
(38, 4, 'Chat_Message', 'New Message', 'New message from Web Studio', 1, '2026-03-10 03:51:01', 'chat_1773114180215_fjbqa6pfc', 'chat', '2026-03-10 03:43:04'),
(39, 6, 'Chat_Message', 'New Message', 'New message from Kiran Santosh Pandit', 1, '2026-03-10 15:47:31', 'chat_1773114180215_fjbqa6pfc', 'chat', '2026-03-10 03:43:24'),
(40, 4, 'Chat_Message', 'New Message', 'New message from Web Studio', 1, '2026-03-12 05:18:17', 'chat_1773114180215_fjbqa6pfc', 'chat', '2026-03-10 15:47:36'),
(41, 1, 'System', 'New Room Pending Approval', 'New room \"1BHK Semi-furnished Apartment in Dattawadi\" posted by Aacker', 0, NULL, 'R3456N', 'room', '2026-03-15 02:24:26'),
(42, 2, 'System', 'New Room Pending Approval', 'New room \"1BHK Semi-furnished Apartment in Dattawadi\" posted by Aacker', 1, '2026-03-15 12:05:41', 'R3456N', 'room', '2026-03-15 02:24:26'),
(44, 1, 'System', 'New Room Pending Approval', 'New room \"1BHK Semi-furnished Apartment in Fatima Nagar\" posted by Wwallhacker', 0, NULL, 'R2171N', 'room', '2026-03-15 04:19:07'),
(45, 2, 'System', 'New Room Pending Approval', 'New room \"1BHK Semi-furnished Apartment in Fatima Nagar\" posted by Wwallhacker', 1, '2026-03-15 12:05:41', 'R2171N', 'room', '2026-03-15 04:19:07'),
(47, 1, 'System', 'New Room Pending Approval', 'New room \"2BHK Furnished Apartment in Erandwane\" posted by Kwallhacker', 0, NULL, 'R7113N', 'room', '2026-03-15 04:33:24'),
(48, 2, 'System', 'New Room Pending Approval', 'New room \"2BHK Furnished Apartment in Erandwane\" posted by Kwallhacker', 1, '2026-03-15 12:05:41', 'R7113N', 'room', '2026-03-15 04:33:24');

-- --------------------------------------------------------

--
-- Table structure for table `plans`
--

CREATE TABLE `plans` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `plan_name` varchar(100) NOT NULL,
  `plan_code` varchar(50) NOT NULL,
  `plan_type` enum('Regular','Broker') DEFAULT 'Regular',
  `description` text DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `duration_days` int(11) NOT NULL,
  `features` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `plans`
--

INSERT INTO `plans` (`id`, `plan_name`, `plan_code`, `plan_type`, `description`, `price`, `duration_days`, `features`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Basic', 'BASIC', 'Regular', 'Basic listing for 15 days', 0.00, 15, '[\"15 days visibility\", \"Basic support\"]', 1, '2026-03-09 02:38:32', '2026-03-09 02:38:32'),
(2, 'Standard', 'STANDARD', 'Regular', 'Standard listing for 30 days with priority', 199.00, 30, '[\"30 days visibility\", \"Priority listing\", \"Email support\"]', 1, '2026-03-09 02:38:32', '2026-03-09 02:38:32'),
(3, 'Premium', 'PREMIUM', 'Regular', 'Premium listing for 60 days with featured tag', 499.00, 60, '[\"60 days visibility\", \"Featured tag\", \"Priority support\", \"WhatsApp notifications\"]', 1, '2026-03-09 02:38:32', '2026-03-09 02:38:32'),
(4, 'Gold', 'GOLD', 'Regular', 'Gold listing for 90 days with all features', 999.00, 90, '[\"90 days visibility\", \"Featured tag\", \"Top priority\", \"24/7 support\", \"Analytics dashboard\"]', 1, '2026-03-09 02:38:32', '2026-03-09 02:38:32'),
(5, 'Broker Monthly', 'BROKER_MONTHLY', 'Broker', 'Monthly broker subscription with unlimited listings', 899.00, 30, '[\"Unlimited room postings\",\"Auto-approved listings\",\"Premium plan for all rooms\",\"Edit rooms anytime\",\"Featured listings\",\"Priority support\"]', 1, '2026-03-09 02:38:32', '2026-03-09 08:09:24'),
(6, 'Broker Quarterly', 'BROKER_6_MONTH', 'Broker', 'Quarterly broker subscription with unlimited listings', 4814.00, 90, '[\"Unlimited room postings\",\"Auto-approved listings\",\"Premium plan for all rooms\",\"Edit rooms anytime\",\"Featured listings\",\"Priority support\",\"10% Off\"]', 1, '2026-03-09 02:38:32', '2026-03-09 08:12:31'),
(7, 'Broker Yearly', 'BROKER_YEARLY', 'Broker', 'Yearly broker subscription with unlimited listings', 8630.00, 365, '[\"Unlimited room postings\",\"Auto-approved listings\",\"Premium plan for all rooms\",\"Edit rooms anytime\",\"Featured listings\",\"Priority support\",\"20% off\"]', 1, '2026-03-09 02:38:32', '2026-03-09 08:11:42');

-- --------------------------------------------------------

--
-- Table structure for table `roommates`
--

CREATE TABLE `roommates` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL COMMENT 'If registered user',
  `name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `contact` varchar(20) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `group_id` varchar(10) NOT NULL,
  `group_name` varchar(100) DEFAULT NULL,
  `linked_user_id` int(11) DEFAULT NULL COMMENT 'Linked to users table if registered',
  `invite_token` varchar(255) DEFAULT NULL,
  `invited_by` int(11) NOT NULL,
  `invited_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `accepted_at` timestamp NULL DEFAULT NULL,
  `status` enum('Pending','Accepted','Declined') DEFAULT 'Pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `roommates`
--

INSERT INTO `roommates` (`id`, `user_id`, `name`, `email`, `contact`, `city`, `group_id`, `group_name`, `linked_user_id`, `invite_token`, `invited_by`, `invited_at`, `accepted_at`, `status`, `created_at`, `updated_at`) VALUES
(1, 4, 'Kiran Santosh Pandit', 'p1432k@gmail.com', '8888783707', NULL, '8BP3B', 'Wada', 4, NULL, 4, '2026-03-12 05:59:27', '2026-03-12 05:59:27', 'Accepted', '2026-03-12 05:59:27', '2026-03-12 05:59:27'),
(4, NULL, 'Sham', 'p14432k@gmail.com', '8888773707', 'Sillod', '8BP3B', 'Wada', NULL, 'd84a936d4d9aa46bd00ab9be9ff87715ec851d3d237b2c9343c1a2ac6492ec29', 4, '2026-03-12 06:01:08', NULL, 'Pending', '2026-03-12 06:01:08', '2026-03-12 06:01:08'),
(5, 10, 'Ganu', 'ganu@gmail.com', '888847707', 'Sillod', '8BP3B', 'Wada', 10, NULL, 4, '2026-03-12 06:47:08', '2026-03-12 06:48:58', 'Accepted', '2026-03-12 06:47:08', '2026-03-12 06:48:58'),
(6, 4, 'Kiran Santosh Pandit', 'p1432k@gmail.com', '8888783707', NULL, 'H2US3', 'Goa Trip', 4, NULL, 4, '2026-03-14 08:05:27', '2026-03-14 08:05:27', 'Accepted', '2026-03-14 08:05:27', '2026-03-14 08:05:27'),
(7, 8, 'RAm', 'Ram@gmail.com', '8888456595', 'City', 'H2US3', 'Goa Trip', 8, NULL, 4, '2026-03-14 08:05:27', '2026-03-14 08:10:41', 'Accepted', '2026-03-14 08:05:27', '2026-03-14 08:10:41'),
(8, NULL, 'Raju', 'mysteriousai.network@gmail.com', '7845154652', 'Mumbai', 'H2US3', 'Goa Trip', NULL, '116f5c9558d02a3acaa7d7bcd9590de86e14f517f783dec89efdd3d1b35f9d12', 4, '2026-03-14 08:05:27', NULL, 'Pending', '2026-03-14 08:05:27', '2026-03-14 08:05:27'),
(9, 4, 'Kiran Santosh Pandit', 'p1432k@gmail.com', '8888783707', NULL, 'P3E7Q', 'Goa Trip  March', 4, NULL, 4, '2026-03-14 10:18:32', '2026-03-14 10:18:32', 'Accepted', '2026-03-14 10:18:32', '2026-03-14 10:18:32'),
(10, 8, 'RAm', 'Ram@gmail.com', '8888783707', NULL, 'P3E7Q', 'Goa Trip  March', 8, NULL, 4, '2026-03-14 10:18:32', '2026-03-14 10:21:15', 'Accepted', '2026-03-14 10:18:32', '2026-03-14 10:21:15'),
(11, 10, 'Ganu', 'ganu@gmail.com', '8888107887', NULL, 'P3E7Q', 'Goa Trip  March', 10, NULL, 4, '2026-03-14 10:18:32', '2026-03-14 10:21:45', 'Accepted', '2026-03-14 10:18:32', '2026-03-14 10:21:45'),
(12, 4, 'Kiran Santosh Pandit', 'p1432k@gmail.com', '8888783707', NULL, 'HDION', 'Flat 302', 4, NULL, 4, '2026-03-14 11:08:07', '2026-03-14 11:08:07', 'Accepted', '2026-03-14 11:08:07', '2026-03-14 11:08:07'),
(13, NULL, 'Ram', 'ram@gmail.com', '8888783707', 'Sillod', 'HDION', 'Flat 302', NULL, '8b92cc8a5335b1dbb6e39bfb1a7f0ba9d1285bd2bab3a17c5184ab06b1d0ceb2', 4, '2026-03-14 11:37:34', NULL, 'Pending', '2026-03-14 11:37:34', '2026-03-14 11:37:34'),
(14, 10, 'Ganu', 'ganu@gmail.com', '8888107887', NULL, 'HDION', 'Flat 302', 10, NULL, 4, '2026-03-14 11:38:16', '2026-03-14 11:38:27', 'Accepted', '2026-03-14 11:38:16', '2026-03-14 11:38:27');

-- --------------------------------------------------------

--
-- Table structure for table `roommate_groups`
--

CREATE TABLE `roommate_groups` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `group_id` varchar(10) NOT NULL COMMENT '5 alphanumeric chars',
  `group_name` varchar(100) DEFAULT NULL,
  `expense_category` varchar(20) NOT NULL DEFAULT 'Daily',
  `expense_label` varchar(180) DEFAULT NULL,
  `expense_status` varchar(20) NOT NULL DEFAULT 'Ongoing',
  `allow_member_edit_history` tinyint(1) NOT NULL DEFAULT 0,
  `closed_at` timestamp NULL DEFAULT NULL,
  `admin_upi_id` varchar(120) DEFAULT NULL,
  `admin_scanner_url` text DEFAULT NULL,
  `admin_drive_link` text DEFAULT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_by` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `roommate_groups`
--

INSERT INTO `roommate_groups` (`id`, `group_id`, `group_name`, `expense_category`, `expense_label`, `expense_status`, `allow_member_edit_history`, `closed_at`, `admin_upi_id`, `admin_scanner_url`, `admin_drive_link`, `is_deleted`, `deleted_at`, `created_by`, `created_at`, `updated_at`) VALUES
(1, '8BP3B', 'Wada', 'Daily', NULL, 'Closed', 0, '2026-03-14 14:36:05', 'ekalone@ybl', 'https://i.ibb.co/fzdBvSNr/Account-QRCode-State-Bank-of-India-3930-DARK-THEME1550979595113681116-png.png', NULL, 0, NULL, 4, '2026-03-12 06:33:26', '2026-03-14 14:36:05'),
(2, 'H2US3', 'Goa Trip', 'Daily', NULL, 'Closed', 0, '2026-03-14 14:06:20', NULL, NULL, NULL, 1, '2026-03-14 14:09:08', 4, '2026-03-14 08:05:27', '2026-03-14 14:09:08'),
(3, 'P3E7Q', 'Goa Trip  March', 'TripOther', NULL, 'Closed', 0, '2026-03-14 11:09:00', NULL, 'https://i.ibb.co/fzdBvSNr/Account-QRCode-State-Bank-of-India-3930-DARK-THEME1550979595113681116-png.png', NULL, 1, '2026-03-14 14:11:58', 4, '2026-03-14 10:18:32', '2026-03-14 14:11:58'),
(4, 'HDION', 'Flat 302', 'TripOther', 'Goa Trip', 'Closed', 1, '2026-03-14 14:08:59', NULL, NULL, NULL, 1, '2026-03-14 14:08:59', 4, '2026-03-14 11:08:07', '2026-03-14 14:08:59');

-- --------------------------------------------------------

--
-- Table structure for table `rooms`
--

CREATE TABLE `rooms` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `room_id` varchar(20) NOT NULL COMMENT 'Auto-generated ID like R0414N',
  `user_id` int(11) NOT NULL COMMENT 'Owner who posted the room',
  `listing_type` enum('For Rent','Required Roommate','For Sell') NOT NULL,
  `title` varchar(255) NOT NULL,
  `room_type` enum('1RK','1BHK','2BHK','3BHK','4BHK','PG','Dormitory','Studio','Other') NOT NULL,
  `house_type` enum('Flat','Apartment','House') NOT NULL,
  `availability_from` date NOT NULL,
  `rent` decimal(12,2) DEFAULT NULL COMMENT 'For Rent/Roommate',
  `deposit` decimal(12,2) DEFAULT NULL COMMENT 'For Rent/Roommate',
  `cost` decimal(15,2) DEFAULT NULL COMMENT 'For Sell',
  `size_sqft` int(11) DEFAULT NULL COMMENT 'For Sell - size in sqft',
  `latitude` decimal(10,8) NOT NULL,
  `longitude` decimal(11,8) NOT NULL,
  `city` varchar(100) NOT NULL DEFAULT 'Pune',
  `area` varchar(150) NOT NULL,
  `address` text NOT NULL,
  `pincode` varchar(10) NOT NULL,
  `contact` varchar(20) NOT NULL,
  `contact_visibility` enum('Private','Public') DEFAULT 'Private' COMMENT 'Privacy setting for contact number',
  `email` varchar(150) DEFAULT NULL,
  `preferred_gender` enum('Male','Female','Any') DEFAULT NULL COMMENT 'For Rent/Roommate',
  `furnishing_type` enum('Furnished','Semi-furnished','Unfurnished') NOT NULL,
  `facilities` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Array of selected facilities',
  `note` text DEFAULT NULL,
  `plan_type` varchar(50) NOT NULL,
  `plan_amount` decimal(10,2) DEFAULT NULL,
  `images` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT 'Array of image URLs',
  `status` enum('Pending','Approved','Hold','Rejected','Expired') DEFAULT 'Pending',
  `admin_remark` text DEFAULT NULL,
  `views_count` int(11) DEFAULT 0,
  `post_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `last_updated` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL COMMENT 'Soft delete timestamp - NULL means not deleted',
  `expiry_date` timestamp NULL DEFAULT NULL COMMENT 'Auto-expire if no response in 72hrs',
  `is_occupied` tinyint(1) DEFAULT 0,
  `occupied_by` int(11) DEFAULT NULL,
  `meta_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Additional metadata',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `rooms`
--

INSERT INTO `rooms` (`id`, `room_id`, `user_id`, `listing_type`, `title`, `room_type`, `house_type`, `availability_from`, `rent`, `deposit`, `cost`, `size_sqft`, `latitude`, `longitude`, `city`, `area`, `address`, `pincode`, `contact`, `contact_visibility`, `email`, `preferred_gender`, `furnishing_type`, `facilities`, `note`, `plan_type`, `plan_amount`, `images`, `status`, `admin_remark`, `views_count`, `post_date`, `last_updated`, `deleted_at`, `expiry_date`, `is_occupied`, `occupied_by`, `meta_data`, `created_at`) VALUES
(2, 'R6978N', 4, 'For Rent', '1BHK Furnished Apartment in Deccan Gymkhana', '1BHK', 'Apartment', '2026-03-09', 50000.00, 5000.00, NULL, NULL, 18.51102800, 73.84049700, 'Pune', 'Deccan Gymkhana', 'Riverside Road, Deccan Gymkhana, Pune City, Pune District, Maharashtra, 411004, India', '411004', '8888783707', 'Private', 'p1432k@gmail.com', 'Female', 'Furnished', '[\"Parking\"]', NULL, 'Standard', 0.00, '[\"https://i.ibb.co/kV6YZNvs/r1-jpg.jpg\",\"https://i.ibb.co/fY5f1bCq/r2-jpg.jpg\",\"https://i.ibb.co/nNMdwnjf/r3-jpg.jpg\"]', 'Approved', 'good room', 28, '2026-03-09 04:43:51', '2026-03-15 08:12:28', NULL, NULL, 0, NULL, '{\"title\":\"1BHK Furnished Apartment in Deccan Gymkhana\",\"listingType\":\"For Rent\",\"roomType\":\"1BHK\",\"houseType\":\"Apartment\",\"city\":\"Pune\",\"area\":\"Deccan Gymkhana\",\"pincode\":\"411004\",\"furnishingType\":\"Furnished\",\"facilities\":[\"Parking\"],\"keywords\":[\"1bhk\",\"furnished\",\"apartment\",\"deccan\",\"gymkhana\",\"for\",\"rent\",\"pune\",\"riverside\",\"road\",\"city\",\"district\",\"maharashtra\",\"411004\",\"india\",\"parking\"],\"searchableText\":\"1BHK Furnished Apartment in Deccan Gymkhana For Rent 1BHK Apartment Pune Deccan Gymkhana Riverside Road, Deccan Gymkhana, Pune City, Pune District, Maharashtra, 411004, India 411004 Furnished Parking\",\"updatedAt\":\"2026-03-09T04:43:51.174Z\"}', '2026-03-09 04:43:51'),
(3, 'R6865N', 4, 'For Rent', 'Dormitory Semi-furnished Apartment in Viman Nagar', 'Dormitory', 'Apartment', '2026-03-09', 400.00, 400.00, NULL, NULL, 18.56880600, 73.91638200, 'Pune', 'Viman Nagar', 'Viman Nagar, Pune City, Pune District, Maharashtra, 411011, India', '411011', '8888783707', 'Public', 'p1432k@gmail.com', 'Male', 'Semi-furnished', '[\"Lift\",\"Gym\",\"Parking\",\"Water Supply\",\"Security\",\"CCTV\",\"WiFi\",\"Power Backup\"]', NULL, 'Standard', 0.00, '[\"https://i.ibb.co/7JLv2ZQQ/r11-jpeg.jpg\"]', 'Approved', NULL, 2, '2026-03-09 04:45:19', '2026-03-09 04:48:33', NULL, NULL, 0, NULL, '{\"title\":\"Dormitory Semi-furnished Apartment in Viman Nagar\",\"listingType\":\"For Rent\",\"roomType\":\"Dormitory\",\"houseType\":\"Apartment\",\"city\":\"Pune\",\"area\":\"Viman Nagar\",\"pincode\":\"411011\",\"furnishingType\":\"Semi-furnished\",\"facilities\":[\"Lift\",\"Gym\",\"Parking\",\"Water Supply\",\"Security\",\"CCTV\",\"WiFi\",\"Power Backup\"],\"keywords\":[\"dormitory\",\"semi\",\"furnished\",\"apartment\",\"viman\",\"nagar\",\"for\",\"rent\",\"pune\",\"city\",\"district\",\"maharashtra\",\"411011\",\"india\",\"lift\",\"gym\",\"parking\",\"water\",\"supply\",\"security\",\"cctv\",\"wifi\",\"power\",\"backup\"],\"searchableText\":\"Dormitory Semi-furnished Apartment in Viman Nagar For Rent Dormitory Apartment Pune Viman Nagar Viman Nagar, Pune City, Pune District, Maharashtra, 411011, India 411011 Semi-furnished Lift Gym Parking Water Supply Security CCTV WiFi Power Backup\",\"updatedAt\":\"2026-03-09T04:45:19.504Z\"}', '2026-03-09 04:45:19'),
(4, 'R6358N', 3, 'Required Roommate', 'Dormitory Unfurnished Apartment in Deccan Gymkhana', 'Dormitory', 'Apartment', '2026-03-09', 5000.00, 500.00, NULL, NULL, 18.51763700, 73.83551700, 'Pune', 'Deccan Gymkhana', 'Deccan Gymkhana, Pune City, Pune District, Maharashtra, 411004, India', '411004', '7454554545', 'Private', 'wallhacker10@gmail.com', 'Female', 'Unfurnished', '[\"Parking\",\"WiFi\",\"Power Backup\",\"Water Supply\"]', NULL, 'Standard', 0.00, '[\"https://i.ibb.co/Fqcb3J8L/r10-jpeg.jpg\",\"https://i.ibb.co/7JLv2ZQQ/r11-jpeg.jpg\",\"https://i.ibb.co/kV6YZNvs/r1-jpg.jpg\",\"https://i.ibb.co/fY5f1bCq/r2-jpg.jpg\",\"https://i.ibb.co/nNMdwnjf/r3-jpg.jpg\"]', 'Approved', 'dgrgrg', 38, '2026-03-09 04:54:53', '2026-03-15 08:05:27', NULL, NULL, 0, NULL, '{\"title\":\"Dormitory Unfurnished Apartment in Deccan Gymkhana\",\"listingType\":\"Required Roommate\",\"roomType\":\"Dormitory\",\"houseType\":\"Apartment\",\"city\":\"Pune\",\"area\":\"Deccan Gymkhana\",\"pincode\":\"411004\",\"furnishingType\":\"Unfurnished\",\"facilities\":[\"Parking\",\"WiFi\",\"Power Backup\",\"Water Supply\"],\"keywords\":[\"dormitory\",\"unfurnished\",\"apartment\",\"deccan\",\"gymkhana\",\"required\",\"roommate\",\"pune\",\"city\",\"district\",\"maharashtra\",\"411004\",\"india\",\"parking\",\"wifi\",\"power\",\"backup\",\"water\",\"supply\"],\"searchableText\":\"Dormitory Unfurnished Apartment in Deccan Gymkhana Required Roommate Dormitory Apartment Pune Deccan Gymkhana Deccan Gymkhana, Pune City, Pune District, Maharashtra, 411004, India 411004 Unfurnished Parking WiFi Power Backup Water Supply\",\"updatedAt\":\"2026-03-09T04:54:53.768Z\"}', '2026-03-09 04:54:53'),
(5, 'R1023N', 4, 'Required Roommate', '1BHK Semi-furnished Apartment in Navi Peth', '1BHK', 'Apartment', '2026-03-09', 5000.00, 500.00, NULL, NULL, 18.51060500, 73.85567600, 'Pune', 'Navi Peth', 'Narsimha Chintaman Kelkar Marg, Navi Peth, Pune City, Pune District, Maharashtra, 411030, India', '411030', '8888783707', 'Private', 'p1432k@gmail.com', 'Female', 'Semi-furnished', '[\"Lift\",\"Water Supply\"]', NULL, 'Standard', 0.00, '[\"https://i.ibb.co/Fqcb3J8L/r10-jpeg.jpg\",\"https://i.ibb.co/7JLv2ZQQ/r11-jpeg.jpg\",\"https://i.ibb.co/hJ6Lp6GZ/r12-jpeg.jpg\",\"https://i.ibb.co/VpJJ6YH9/r13-jpeg.jpg\"]', 'Approved', NULL, 11, '2026-03-09 04:55:44', '2026-03-14 14:07:45', NULL, NULL, 0, NULL, '{\"title\":\"1BHK Semi-furnished Apartment in Navi Peth\",\"listingType\":\"Required Roommate\",\"roomType\":\"1BHK\",\"houseType\":\"Apartment\",\"city\":\"Pune\",\"area\":\"Navi Peth\",\"pincode\":\"411030\",\"furnishingType\":\"Semi-furnished\",\"facilities\":[\"Lift\",\"Water Supply\"],\"keywords\":[\"1bhk\",\"semi\",\"furnished\",\"apartment\",\"navi\",\"peth\",\"required\",\"roommate\",\"pune\",\"narsimha\",\"chintaman\",\"kelkar\",\"marg\",\"city\",\"district\",\"maharashtra\",\"411030\",\"india\",\"lift\",\"water\",\"supply\"],\"searchableText\":\"1BHK Semi-furnished Apartment in Navi Peth Required Roommate 1BHK Apartment Pune Navi Peth Narsimha Chintaman Kelkar Marg, Navi Peth, Pune City, Pune District, Maharashtra, 411030, India 411030 Semi-furnished Lift Water Supply\",\"updatedAt\":\"2026-03-09T04:55:44.672Z\"}', '2026-03-09 04:55:44'),
(6, 'R3456N', 11, 'For Rent', '1BHK Semi-furnished Apartment in Dattawadi', '1BHK', 'Apartment', '2026-03-15', 4000.00, 4000.00, NULL, NULL, 18.50062700, 73.84495100, 'Pune', 'Dattawadi', 'Narveer Tanaji Malusare Marg, Dattawadi, Anandnagar, Pune City, Pune District, Maharashtra, 411051, India', '411051', '8888101045', 'Private', 'aacker10@gmail.com', 'Any', 'Semi-furnished', '[\"Lift\",\"Parking\"]', NULL, 'Basic', 0.00, '[\"https://i.ibb.co/q3j7QxKZ/r12-jpeg.jpg\"]', 'Pending', NULL, 0, '2026-03-15 02:24:26', '2026-03-15 02:24:26', NULL, NULL, 0, NULL, '{\"title\":\"1BHK Semi-furnished Apartment in Dattawadi\",\"listingType\":\"For Rent\",\"roomType\":\"1BHK\",\"houseType\":\"Apartment\",\"city\":\"Pune\",\"area\":\"Dattawadi\",\"pincode\":\"411051\",\"furnishingType\":\"Semi-furnished\",\"facilities\":[\"Lift\",\"Parking\"],\"keywords\":[\"1bhk\",\"semi\",\"furnished\",\"apartment\",\"dattawadi\",\"for\",\"rent\",\"pune\",\"narveer\",\"tanaji\",\"malusare\",\"marg\",\"anandnagar\",\"city\",\"district\",\"maharashtra\",\"411051\",\"india\",\"lift\",\"parking\"],\"searchableText\":\"1BHK Semi-furnished Apartment in Dattawadi For Rent 1BHK Apartment Pune Dattawadi Narveer Tanaji Malusare Marg, Dattawadi, Anandnagar, Pune City, Pune District, Maharashtra, 411051, India 411051 Semi-furnished Lift Parking\",\"updatedAt\":\"2026-03-15T02:24:26.003Z\"}', '2026-03-15 02:24:26'),
(7, 'R2171N', 13, 'For Sell', '1BHK Semi-furnished Apartment in Fatima Nagar', '1BHK', 'Apartment', '2026-03-15', NULL, NULL, 4520.00, 540, 18.50873300, 73.91533900, 'Pune', 'Fatima Nagar', 'Hadapsar Industrial Estate, Fatima Nagar, Pune City, Pune District, Maharashtra, 411013, India', '411013', '8888161045', 'Private', 'wwallhacker10@gmail.com', NULL, 'Semi-furnished', '[\"Parking\"]', NULL, 'Premium', 0.00, '[\"https://i.ibb.co/d4sBGmHm/r10-jpeg.jpg\"]', 'Pending', NULL, 0, '2026-03-15 04:19:07', '2026-03-15 04:19:07', NULL, NULL, 0, NULL, '{\"title\":\"1BHK Semi-furnished Apartment in Fatima Nagar\",\"listingType\":\"For Sell\",\"roomType\":\"1BHK\",\"houseType\":\"Apartment\",\"city\":\"Pune\",\"area\":\"Fatima Nagar\",\"pincode\":\"411013\",\"furnishingType\":\"Semi-furnished\",\"facilities\":[\"Parking\"],\"keywords\":[\"1bhk\",\"semi\",\"furnished\",\"apartment\",\"fatima\",\"nagar\",\"for\",\"sell\",\"pune\",\"hadapsar\",\"industrial\",\"estate\",\"city\",\"district\",\"maharashtra\",\"411013\",\"india\",\"parking\"],\"searchableText\":\"1BHK Semi-furnished Apartment in Fatima Nagar For Sell 1BHK Apartment Pune Fatima Nagar Hadapsar Industrial Estate, Fatima Nagar, Pune City, Pune District, Maharashtra, 411013, India 411013 Semi-furnished Parking\",\"updatedAt\":\"2026-03-15T04:19:07.654Z\"}', '2026-03-15 04:19:07'),
(8, 'R7113N', 15, 'For Rent', '2BHK Furnished Apartment in Erandwane', '2BHK', 'Apartment', '2026-03-15', 4000.00, 400.00, NULL, NULL, 18.50721900, 73.83369000, 'Pune', 'Erandwane', 'Kashibai Amrutrao Khilare Path, Erandwane, Pune City, Pune District, Maharashtra, 411004, India', '411004', '8888743737', 'Private', 'kwallhacker10@gmail.com', 'Female', 'Furnished', '[\"Lift\"]', NULL, 'Premium', 0.00, '[\"https://i.ibb.co/rRNVVfJp/mainpimg-jpeg.jpg\"]', 'Pending', NULL, 0, '2026-03-15 04:33:24', '2026-03-15 04:33:24', NULL, NULL, 0, NULL, '{\"title\":\"2BHK Furnished Apartment in Erandwane\",\"listingType\":\"For Rent\",\"roomType\":\"2BHK\",\"houseType\":\"Apartment\",\"city\":\"Pune\",\"area\":\"Erandwane\",\"pincode\":\"411004\",\"furnishingType\":\"Furnished\",\"facilities\":[\"Lift\"],\"keywords\":[\"2bhk\",\"furnished\",\"apartment\",\"erandwane\",\"for\",\"rent\",\"pune\",\"kashibai\",\"amrutrao\",\"khilare\",\"path\",\"city\",\"district\",\"maharashtra\",\"411004\",\"india\",\"lift\"],\"searchableText\":\"2BHK Furnished Apartment in Erandwane For Rent 2BHK Apartment Pune Erandwane Kashibai Amrutrao Khilare Path, Erandwane, Pune City, Pune District, Maharashtra, 411004, India 411004 Furnished Lift\",\"updatedAt\":\"2026-03-15T04:33:24.588Z\"}', '2026-03-15 04:33:24');

-- --------------------------------------------------------

--
-- Table structure for table `site_settings`
--

CREATE TABLE `site_settings` (
  `id` tinyint(4) NOT NULL AUTO_INCREMENT,
  `business_name` varchar(120) NOT NULL,
  `business_tagline` varchar(255) DEFAULT NULL,
  `support_email` varchar(160) NOT NULL,
  `admin_email` varchar(160) NOT NULL,
  `support_phone` varchar(40) NOT NULL,
  `logo_url` varchar(600) DEFAULT NULL,
  `favicon_url` varchar(600) DEFAULT NULL,
  `support_address` varchar(255) DEFAULT NULL,
  `facebook_url` varchar(500) DEFAULT NULL,
  `twitter_url` varchar(500) DEFAULT NULL,
  `instagram_url` varchar(500) DEFAULT NULL,
  `linkedin_url` varchar(500) DEFAULT NULL,
  `youtube_url` varchar(500) DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `default_ad_bg_search_url` varchar(600) DEFAULT NULL,
  `default_ad_bg_post_url` varchar(600) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `site_settings`
--

INSERT INTO `site_settings` (`id`, `business_name`, `business_tagline`, `support_email`, `admin_email`, `support_phone`, `logo_url`, `favicon_url`, `support_address`, `facebook_url`, `twitter_url`, `instagram_url`, `linkedin_url`, `youtube_url`, `updated_at`, `default_ad_bg_search_url`, `default_ad_bg_post_url`) VALUES
(1, 'RoomRental', 'Find Your Perfect Roommate', 'customer@support.com', 'customer@support.com', '+91 99999 99999', NULL, NULL, 'Pune, Maharashtra', '', '', '', '', '', '2026-03-09 17:11:47', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `subscriptions`
--

CREATE TABLE `subscriptions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `plan_id` int(11) NOT NULL,
  `room_id` int(11) DEFAULT NULL,
  `amount_paid` decimal(10,2) NOT NULL,
  `starts_at` datetime NOT NULL,
  `expires_at` datetime NOT NULL,
  `payment_status` enum('Pending','Completed','Rejected','Suspended','Refunded') DEFAULT 'Pending',
  `transaction_id` varchar(255) DEFAULT NULL,
  `admin_remark` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `subscriptions`
--

INSERT INTO `subscriptions` (`id`, `user_id`, `plan_id`, `room_id`, `amount_paid`, `starts_at`, `expires_at`, `payment_status`, `transaction_id`, `admin_remark`, `created_at`) VALUES
(2, 6, 5, NULL, 999.00, '2026-03-09 12:00:00', '2026-04-08 12:00:00', 'Completed', 'ADMIN_APPROVED_1773039354921', NULL, '2026-03-09 06:55:54'),
(3, 5, 5, NULL, 999.00, '2026-03-09 12:00:00', '2026-04-08 12:00:00', 'Completed', 'ADMIN_APPROVED_1773039847266', NULL, '2026-03-09 07:04:07');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `unique_id` varchar(20) NOT NULL COMMENT 'Auto-generated ID like P1144R',
  `name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `contact` varchar(20) NOT NULL,
  `contact_visibility` enum('Private','Public') DEFAULT 'Private' COMMENT 'Privacy setting for contact number',
  `gender` enum('Male','Female','Other') NOT NULL,
  `pincode` varchar(10) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('Admin','Member','Broker') DEFAULT 'Member',
  `broker_area` varchar(255) DEFAULT NULL COMMENT 'Area covered by broker',
  `broker_status` enum('Pending','Approved','Hold','Rejected','Suspended') DEFAULT NULL COMMENT 'Broker approval status. Suspended brokers cannot login.',
  `admin_remark` text DEFAULT NULL COMMENT 'Admin remark for broker approval',
  `two_factor_enabled` tinyint(1) DEFAULT 0,
  `otp_code` varchar(10) DEFAULT NULL,
  `otp_expires_at` datetime DEFAULT NULL,
  `is_verified` tinyint(1) DEFAULT 0,
  `registration_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `last_login` timestamp NULL DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `device_info` varchar(255) DEFAULT NULL,
  `profile_image` varchar(500) DEFAULT NULL,
  `status` enum('Active','Inactive','Suspended') DEFAULT 'Active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `selected_plan_id` int(11) DEFAULT NULL COMMENT 'Plan selected by broker during registration'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `unique_id`, `name`, `email`, `contact`, `contact_visibility`, `gender`, `pincode`, `password_hash`, `role`, `broker_area`, `broker_status`, `admin_remark`, `two_factor_enabled`, `otp_code`, `otp_expires_at`, `is_verified`, `registration_date`, `last_login`, `ip_address`, `device_info`, `profile_image`, `status`, `created_at`, `updated_at`, `selected_plan_id`) VALUES
(1, 'A00001', 'System Admin', 'admin@gmail.com', '9999999999', 'Private', 'Male', '411001', '$2b$10$YourHashedPasswordHere', 'Admin', NULL, NULL, NULL, 0, NULL, NULL, 1, '2026-03-09 02:38:32', NULL, NULL, NULL, NULL, 'Active', '2026-03-09 02:38:32', '2026-03-09 02:38:32', NULL),
(2, 'P1435R', 'Web Studio', 'admin1@gmail.com', '8888888888', 'Private', 'Female', '421212', '$2a$12$31tf9RTUnJmGHvljE3tSl.3K3532y8eFMxk4cCyyMGNIUgnaTfEGa', 'Admin', NULL, NULL, NULL, 0, NULL, NULL, 1, '2026-03-09 02:41:30', '2026-03-15 12:29:15', '::1', 'Mozilla/5.0 (Linux; Android 13; SM-G981B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Mobile Safari/537.36', NULL, 'Active', '2026-03-09 02:41:30', '2026-03-15 12:29:15', NULL),
(3, 'P3736R', 'Web Studio', 'wallhacker10@gmail.com', '7454554545', 'Private', 'Female', '454545', '$2a$12$mI4A7BuKYYcfi9Lh8Fs/yOLSNMCfqcmGpft4fobJrQTZiNb8Imzke', 'Member', NULL, NULL, NULL, 0, NULL, NULL, 1, '2026-03-09 03:18:35', '2026-03-09 04:00:41', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', NULL, 'Active', '2026-03-09 03:18:35', '2026-03-09 04:53:22', NULL),
(4, 'P6180R', 'Kiran Santosh Pandit', 'p1432k@gmail.com', '8888783707', 'Private', 'Female', '431112', '$2a$12$s1.lNepQ3.0cjq1yez.d1.shnLTaC/WSRowMt6UK1MM65lXTT/Qtq', 'Member', NULL, NULL, NULL, 0, NULL, NULL, 1, '2026-03-09 04:39:11', '2026-03-15 12:17:32', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', '/uploads/profiles/profile-1773292734308-917926977.jpg', 'Active', '2026-03-09 04:39:11', '2026-03-15 12:17:32', NULL),
(5, 'P8871R', 'Web Studio', 'hacker10@gmail.com', '7454545454', 'Private', 'Male', '455445', '$2a$12$d1MFxO47sF/VI7TXMPECPO8p.oA4w6ZyOH/v2pQvxkOxuK4hyBi32', 'Broker', NULL, 'Approved', 'All Good', 0, NULL, NULL, 1, '2026-03-09 06:06:29', '2026-03-15 02:07:35', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', NULL, 'Active', '2026-03-09 06:06:29', '2026-03-15 02:07:35', 5),
(6, 'P1920R', 'Web Studio', 'allhacker10@gmail.com', '8888107887', 'Private', 'Male', '454444', '$2a$12$6DDwXvBp.HY.c6r8Axs5BeNPOrjKRicnoRHdtSYxw.cdVeJCN6yO.', 'Broker', 'Budhwar Peth, Mumbai, Yerawada, Swargate, Bavdhan', 'Approved', NULL, 0, NULL, NULL, 1, '2026-03-09 06:36:36', '2026-03-10 03:42:53', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '/uploads/profiles/profile-1773046763162-247403257.jpg', 'Active', '2026-03-09 06:36:36', '2026-03-10 03:42:53', 5),
(7, 'P8107R', 'Kiran Santosh Pandit', 'firewallhacker10@gmail.com', '7777666689', 'Private', 'Male', '431113', '$2a$12$8uaDtc7D.eT4kP/SOdwkg.4vYF0HVc6jEvYNXZ5RldOk/5IvDK8N6', 'Member', NULL, NULL, NULL, 0, NULL, NULL, 1, '2026-03-12 06:15:54', '2026-03-12 06:16:18', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', NULL, 'Active', '2026-03-12 06:15:54', '2026-03-12 06:16:18', NULL),
(8, 'P3657R', 'Ram', 'ram@gmail.com', '8888483707', 'Private', 'Male', '431112', '$2a$12$YA4YCQIIP6c0S347/vbOfemMemZ3f.i8SqJiCdtyAz9ggl.1kT5Be', 'Member', NULL, NULL, NULL, 0, NULL, NULL, 1, '2026-03-12 06:20:20', '2026-03-14 08:10:34', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', NULL, 'Active', '2026-03-12 06:20:20', '2026-03-14 08:10:34', NULL),
(9, 'P8845R', 'Ram', 'p14432k@gmail.com', '8888784707', 'Private', 'Male', '431112', '$2a$12$05BR36/9Nars/T/3ULTQf.cxF0UwrlOTTRPWY1Lz2F/BLNaAxDAFy', 'Member', NULL, NULL, NULL, 0, NULL, NULL, 1, '2026-03-12 06:35:10', '2026-03-12 06:36:04', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', NULL, 'Active', '2026-03-12 06:35:10', '2026-03-12 06:36:04', NULL),
(10, 'P8037R', 'Ganu', 'ganu@gmail.com', '8888783707', 'Private', 'Male', '431113', '$2a$12$BJPGe9ts0j69m61bnJlGlubl3dKzDqgEGPH7MAMBfFpeD86lQKcDe', 'Member', NULL, NULL, NULL, 0, NULL, NULL, 1, '2026-03-12 06:48:42', '2026-03-14 10:21:45', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', NULL, 'Active', '2026-03-12 06:48:42', '2026-03-14 10:21:45', NULL),
(11, 'P9879R', 'Aacker', 'aacker10@gmail.com', '8888101045', 'Private', 'Other', '411051', '$2a$12$8r/a/DPSfsz56gSzQu4hp.xHNn9mmPpyCTgPVNeOEKDy.o6eHB0be', 'Member', NULL, NULL, NULL, 0, NULL, NULL, 1, '2026-03-15 02:23:43', '2026-03-15 02:24:05', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', NULL, 'Active', '2026-03-15 02:23:43', '2026-03-15 02:24:05', NULL),
(12, 'P5162R', 'Hhacker', 'hhacker10@gmail.com', '8888201045', 'Private', 'Other', '411013', '$2a$12$teenTTas.BQAe.mXHSqg6OyPo/XMqdgLOcO19LhHo8QHRgysrlWHm', 'Member', NULL, NULL, NULL, 0, '252473', '2026-03-15 08:44:35', 0, '2026-03-15 03:04:35', NULL, NULL, NULL, NULL, 'Active', '2026-03-15 03:04:35', '2026-03-15 03:04:35', NULL),
(13, 'P1002R', 'Wwallhacker', 'wwallhacker10@gmail.com', '8888161045', 'Private', 'Other', '411013', '$2a$12$P0Fit3W0tKegPQbcSXFpbu1W4KitcHemba2ST1PcBM4wQ0wflV60e', 'Member', NULL, NULL, NULL, 0, NULL, NULL, 1, '2026-03-15 04:18:51', '2026-03-15 04:19:07', '::1', 'Mozilla/5.0 (Linux; Android 13; SM-G981B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Mobile Safari/537.36', NULL, 'Active', '2026-03-15 04:18:51', '2026-03-15 04:19:07', NULL),
(14, 'P4309R', 'Ewallhacker', 'ewallhacker10@gmail.com', '8888783737', 'Private', 'Other', '411004', '$2a$12$FwUN8E.gwpcIfpw3VKqfmOfb/Q3suQ.n6ezSM4YEfOa0ZejwKSzFS', 'Broker', 'Nigdi', 'Pending', NULL, 0, NULL, NULL, 1, '2026-03-15 04:23:55', NULL, NULL, NULL, NULL, 'Active', '2026-03-15 04:23:55', '2026-03-15 04:24:25', 5),
(15, 'P4950R', 'Kwallhacker', 'kwallhacker10@gmail.com', '8888743737', 'Private', 'Other', '411004', '$2a$12$gcR.6xov4FAHRij8lnV36.NxKlrdGO8.4aYrTvNMz4UX4iF55Hw/a', 'Member', NULL, NULL, NULL, 0, NULL, NULL, 1, '2026-03-15 04:33:04', '2026-03-15 04:33:24', '::1', 'Mozilla/5.0 (Linux; Android 13; SM-G981B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Mobile Safari/537.36', NULL, 'Active', '2026-03-15 04:33:04', '2026-03-15 04:33:24', NULL);

-- --------------------------------------------------------

-- --------------------------------------------------------

--
-- Structure for view `vw_dashboard_stats`
--
DROP VIEW IF EXISTS `vw_dashboard_stats`;

CREATE OR REPLACE VIEW `vw_dashboard_stats` AS SELECT (select count(0) from `rooms`) AS `total_rooms`, (select count(0) from `rooms` where `rooms`.`status` = 'Approved') AS `approved_rooms`, (select count(0) from `rooms` where `rooms`.`status` = 'Pending') AS `pending_rooms`, (select count(0) from `rooms` where `rooms`.`is_occupied` = 1) AS `occupied_rooms`, (select count(0) from `users` where `users`.`role` = 'Member') AS `total_members`, (select count(0) from `users` where `users`.`role` = 'Broker' and `users`.`broker_status` = 'Approved') AS `approved_brokers`, (select count(0) from `users` where `users`.`role` = 'Broker' and `users`.`broker_status` = 'Pending') AS `pending_brokers`, (select count(0) from `users` where cast(`users`.`registration_date` as date) = curdate()) AS `today_registrations`, (select count(0) from `rooms` where cast(`rooms`.`post_date` as date) = curdate()) AS `today_rooms` ;

-- --------------------------------------------------------

--
-- Structure for view `vw_pending_brokers`
--
DROP VIEW IF EXISTS `vw_pending_brokers`;

CREATE OR REPLACE VIEW `vw_pending_brokers` AS SELECT `users`.`id` AS `id`, `users`.`unique_id` AS `unique_id`, `users`.`name` AS `name`, `users`.`email` AS `email`, `users`.`contact` AS `contact`, `users`.`gender` AS `gender`, `users`.`pincode` AS `pincode`, `users`.`password_hash` AS `password_hash`, `users`.`role` AS `role`, `users`.`broker_area` AS `broker_area`, `users`.`broker_status` AS `broker_status`, `users`.`admin_remark` AS `admin_remark`, `users`.`two_factor_enabled` AS `two_factor_enabled`, `users`.`otp_code` AS `otp_code`, `users`.`otp_expires_at` AS `otp_expires_at`, `users`.`is_verified` AS `is_verified`, `users`.`registration_date` AS `registration_date`, `users`.`last_login` AS `last_login`, `users`.`ip_address` AS `ip_address`, `users`.`device_info` AS `device_info`, `users`.`profile_image` AS `profile_image`, `users`.`status` AS `status`, `users`.`created_at` AS `created_at`, `users`.`updated_at` AS `updated_at` FROM `users` WHERE `users`.`role` = 'Broker' AND `users`.`broker_status` = 'Pending' ;

-- --------------------------------------------------------

--
-- Structure for view `vw_pending_rooms`
--
DROP VIEW IF EXISTS `vw_pending_rooms`;

CREATE OR REPLACE VIEW `vw_pending_rooms` AS SELECT `r`.`id` AS `id`, `r`.`room_id` AS `room_id`, `r`.`user_id` AS `user_id`, `r`.`listing_type` AS `listing_type`, `r`.`title` AS `title`, `r`.`room_type` AS `room_type`, `r`.`house_type` AS `house_type`, `r`.`availability_from` AS `availability_from`, `r`.`rent` AS `rent`, `r`.`deposit` AS `deposit`, `r`.`cost` AS `cost`, `r`.`size_sqft` AS `size_sqft`, `r`.`latitude` AS `latitude`, `r`.`longitude` AS `longitude`, `r`.`city` AS `city`, `r`.`area` AS `area`, `r`.`address` AS `address`, `r`.`pincode` AS `pincode`, `r`.`contact` AS `contact`, `r`.`contact_visibility` AS `contact_visibility`, `r`.`email` AS `email`, `r`.`preferred_gender` AS `preferred_gender`, `r`.`furnishing_type` AS `furnishing_type`, `r`.`facilities` AS `facilities`, `r`.`note` AS `note`, `r`.`plan_type` AS `plan_type`, `r`.`plan_amount` AS `plan_amount`, `r`.`images` AS `images`, `r`.`status` AS `status`, `r`.`admin_remark` AS `admin_remark`, `r`.`views_count` AS `views_count`, `r`.`post_date` AS `post_date`, `r`.`last_updated` AS `last_updated`, `r`.`expiry_date` AS `expiry_date`, `r`.`is_occupied` AS `is_occupied`, `r`.`occupied_by` AS `occupied_by`, `r`.`meta_data` AS `meta_data`, `r`.`created_at` AS `created_at`, `u`.`name` AS `owner_name`, `u`.`contact` AS `owner_contact`, `u`.`email` AS `owner_email` FROM (`rooms` `r` join `users` `u` on(`r`.`user_id` = `u`.`id`)) WHERE `r`.`status` = 'Pending' ;

-- --------------------------------------------------------

--
-- Structure for view `vw_today_registrations`
--
DROP VIEW IF EXISTS `vw_today_registrations`;

CREATE OR REPLACE VIEW `vw_today_registrations` AS SELECT `users`.`id` AS `id`, `users`.`unique_id` AS `unique_id`, `users`.`name` AS `name`, `users`.`email` AS `email`, `users`.`contact` AS `contact`, `users`.`gender` AS `gender`, `users`.`pincode` AS `pincode`, `users`.`password_hash` AS `password_hash`, `users`.`role` AS `role`, `users`.`broker_area` AS `broker_area`, `users`.`broker_status` AS `broker_status`, `users`.`admin_remark` AS `admin_remark`, `users`.`two_factor_enabled` AS `two_factor_enabled`, `users`.`otp_code` AS `otp_code`, `users`.`otp_expires_at` AS `otp_expires_at`, `users`.`is_verified` AS `is_verified`, `users`.`registration_date` AS `registration_date`, `users`.`last_login` AS `last_login`, `users`.`ip_address` AS `ip_address`, `users`.`device_info` AS `device_info`, `users`.`profile_image` AS `profile_image`, `users`.`status` AS `status`, `users`.`created_at` AS `created_at`, `users`.`updated_at` AS `updated_at` FROM `users` WHERE cast(`users`.`registration_date` as date) = curdate() ;

-- --------------------------------------------------------

--
-- Structure for view `vw_today_rooms`
--
DROP VIEW IF EXISTS `vw_today_rooms`;

CREATE OR REPLACE VIEW `vw_today_rooms` AS SELECT `rooms`.`id` AS `id`, `rooms`.`room_id` AS `room_id`, `rooms`.`user_id` AS `user_id`, `rooms`.`listing_type` AS `listing_type`, `rooms`.`title` AS `title`, `rooms`.`room_type` AS `room_type`, `rooms`.`house_type` AS `house_type`, `rooms`.`availability_from` AS `availability_from`, `rooms`.`rent` AS `rent`, `rooms`.`deposit` AS `deposit`, `rooms`.`cost` AS `cost`, `rooms`.`size_sqft` AS `size_sqft`, `rooms`.`latitude` AS `latitude`, `rooms`.`longitude` AS `longitude`, `rooms`.`city` AS `city`, `rooms`.`area` AS `area`, `rooms`.`address` AS `address`, `rooms`.`pincode` AS `pincode`, `rooms`.`contact` AS `contact`, `rooms`.`contact_visibility` AS `contact_visibility`, `rooms`.`email` AS `email`, `rooms`.`preferred_gender` AS `preferred_gender`, `rooms`.`furnishing_type` AS `furnishing_type`, `rooms`.`facilities` AS `facilities`, `rooms`.`note` AS `note`, `rooms`.`plan_type` AS `plan_type`, `rooms`.`plan_amount` AS `plan_amount`, `rooms`.`images` AS `images`, `rooms`.`status` AS `status`, `rooms`.`admin_remark` AS `admin_remark`, `rooms`.`views_count` AS `views_count`, `rooms`.`post_date` AS `post_date`, `rooms`.`last_updated` AS `last_updated`, `rooms`.`expiry_date` AS `expiry_date`, `rooms`.`is_occupied` AS `is_occupied`, `rooms`.`occupied_by` AS `occupied_by`, `rooms`.`meta_data` AS `meta_data`, `rooms`.`created_at` AS `created_at` FROM `rooms` WHERE cast(`rooms`.`post_date` as date) = curdate() ;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `ads`
--
ALTER TABLE `ads`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_ads_active_dates` (`is_active`,`start_date`,`end_date`),
  ADD KEY `idx_ads_dates` (`start_date`,`end_date`);

--
-- Indexes for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_action` (`action`),
  ADD KEY `idx_entity` (`entity_type`,`entity_id`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Indexes for table `chat_rooms`
--
ALTER TABLE `chat_rooms`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `room_id` (`room_id`),
  ADD KEY `participant_2` (`participant_2`),
  ADD KEY `idx_room_id` (`room_id`),
  ADD KEY `idx_participants` (`participant_1`,`participant_2`),
  ADD KEY `idx_room_listing` (`room_listing_id`);

--
-- Indexes for table `contact_leads`
--
ALTER TABLE `contact_leads`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_contact_leads_status` (`status`),
  ADD KEY `idx_contact_leads_created_at` (`created_at`),
  ADD KEY `idx_contact_leads_email` (`email`);

--
-- Indexes for table `existing_roommates`
--
ALTER TABLE `existing_roommates`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_room_id` (`room_id`);

--
-- Indexes for table `expenses`
--
ALTER TABLE `expenses`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `expense_id` (`expense_id`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `idx_expense_id` (`expense_id`),
  ADD KEY `idx_group_id` (`group_id`),
  ADD KEY `idx_paid_by` (`paid_by`),
  ADD KEY `idx_expense_date` (`expense_date`);

--
-- Indexes for table `expense_splits`
--
ALTER TABLE `expense_splits`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_expense_id` (`expense_id`),
  ADD KEY `idx_roommate_id` (`roommate_id`);

--
-- Indexes for table `maharashtra_cities`
--
ALTER TABLE `maharashtra_cities`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_city_name` (`city_name`);

--
-- Indexes for table `messages`
--
ALTER TABLE `messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_chat_room` (`chat_room_id`),
  ADD KEY `idx_sender` (`sender_id`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_type` (`type`),
  ADD KEY `idx_is_read` (`is_read`);

--
-- Indexes for table `plans`
--
ALTER TABLE `plans`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `plan_code` (`plan_code`),
  ADD KEY `idx_plan_code` (`plan_code`),
  ADD KEY `idx_plan_type` (`plan_type`),
  ADD KEY `idx_is_active` (`is_active`);

--
-- Indexes for table `roommates`
--
ALTER TABLE `roommates`
  ADD PRIMARY KEY (`id`),
  ADD KEY `invited_by` (`invited_by`),
  ADD KEY `linked_user_id` (`linked_user_id`),
  ADD KEY `idx_group_id` (`group_id`),
  ADD KEY `idx_email` (`email`),
  ADD KEY `idx_invite_token` (`invite_token`),
  ADD KEY `idx_user_id` (`user_id`);

--
-- Indexes for table `roommate_groups`
--
ALTER TABLE `roommate_groups`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `group_id` (`group_id`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `idx_group_id` (`group_id`);

--
-- Indexes for table `rooms`
--
ALTER TABLE `rooms`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `room_id` (`room_id`),
  ADD KEY `idx_room_id` (`room_id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_listing_type` (`listing_type`),
  ADD KEY `idx_city_area` (`city`,`area`),
  ADD KEY `idx_post_date` (`post_date`),
  ADD KEY `idx_deleted_at` (`deleted_at`);
ALTER TABLE `rooms` ADD KEY `idx_title` (`title`);

--
-- Indexes for table `site_settings`
--
ALTER TABLE `site_settings`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `subscriptions`
--
ALTER TABLE `subscriptions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `plan_id` (`plan_id`),
  ADD KEY `room_id` (`room_id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_expires_at` (`expires_at`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_id` (`unique_id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_email` (`email`),
  ADD KEY `idx_role` (`role`),
  ADD KEY `idx_unique_id` (`unique_id`),
  ADD KEY `idx_broker_status` (`broker_status`),
  ADD KEY `idx_broker_selected_plan` (`selected_plan_id`);

--
-- AUTO_INCREMENT values — ensures next INSERT starts above the highest existing id
--

ALTER TABLE `ads` AUTO_INCREMENT = 3;
ALTER TABLE `audit_logs` AUTO_INCREMENT = 1;
ALTER TABLE `chat_rooms` AUTO_INCREMENT = 7;
ALTER TABLE `contact_leads` AUTO_INCREMENT = 7;
ALTER TABLE `existing_roommates` AUTO_INCREMENT = 2;
ALTER TABLE `expenses` AUTO_INCREMENT = 9;
ALTER TABLE `expense_splits` AUTO_INCREMENT = 18;
ALTER TABLE `maharashtra_cities` AUTO_INCREMENT = 42;
ALTER TABLE `messages` AUTO_INCREMENT = 12;
ALTER TABLE `notifications` AUTO_INCREMENT = 49;
ALTER TABLE `plans` AUTO_INCREMENT = 8;
ALTER TABLE `roommates` AUTO_INCREMENT = 15;
ALTER TABLE `roommate_groups` AUTO_INCREMENT = 5;
ALTER TABLE `rooms` AUTO_INCREMENT = 9;
ALTER TABLE `site_settings` AUTO_INCREMENT = 2;
ALTER TABLE `subscriptions` AUTO_INCREMENT = 4;
ALTER TABLE `users` AUTO_INCREMENT = 16;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `chat_rooms`
--
ALTER TABLE `chat_rooms`
  ADD CONSTRAINT `chat_rooms_ibfk_1` FOREIGN KEY (`room_listing_id`) REFERENCES `rooms` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `chat_rooms_ibfk_2` FOREIGN KEY (`participant_1`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `chat_rooms_ibfk_3` FOREIGN KEY (`participant_2`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `existing_roommates`
--
ALTER TABLE `existing_roommates`
  ADD CONSTRAINT `existing_roommates_ibfk_1` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `expenses`
--
ALTER TABLE `expenses`
  ADD CONSTRAINT `expenses_ibfk_1` FOREIGN KEY (`paid_by`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `expenses_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `expense_splits`
--
ALTER TABLE `expense_splits`
  ADD CONSTRAINT `expense_splits_ibfk_1` FOREIGN KEY (`expense_id`) REFERENCES `expenses` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `messages`
--
ALTER TABLE `messages`
  ADD CONSTRAINT `messages_ibfk_1` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `roommates`
--
ALTER TABLE `roommates`
  ADD CONSTRAINT `roommates_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `roommates_ibfk_2` FOREIGN KEY (`invited_by`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `roommates_ibfk_3` FOREIGN KEY (`linked_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `roommate_groups`
--
ALTER TABLE `roommate_groups`
  ADD CONSTRAINT `roommate_groups_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `rooms`
--
ALTER TABLE `rooms`
  ADD CONSTRAINT `rooms_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `subscriptions`
--
ALTER TABLE `subscriptions`
  ADD CONSTRAINT `subscriptions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `subscriptions_ibfk_2` FOREIGN KEY (`plan_id`) REFERENCES `plans` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `subscriptions_ibfk_3` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`selected_plan_id`) REFERENCES `plans` (`id`);
COMMIT;
