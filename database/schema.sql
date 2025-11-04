CREATE TABLE `%%PREFIX%%sig_members` (
    `id` BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `phone_number` VARCHAR(25) NULL,
    `full_address` TEXT NULL,
    `district_id` VARCHAR(20) NULL,
    `village_id` VARCHAR(20) NULL,
    `status` ENUM('verified', 'pending', 'rejected') NOT NULL DEFAULT 'pending',
    `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` DATETIME NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `phone_number_unique` (`phone_number`),
    INDEX `district_id_index` (`district_id`),
    INDEX `village_id_index` (`village_id`),
    INDEX `status_index` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `%%PREFIX%%sig_events` (
    `id` BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
    `event_name` VARCHAR(255) NOT NULL,
    `status` BOOLEAN NOT NULL DEFAULT FALSE,
    `started_at` DATETIME NULL DEFAULT NULL,
    `end_at` DATETIME NULL DEFAULT NULL,
    `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` DATETIME NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `event_name_unique` (`event_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `%%PREFIX%%sig_member_events` (
    `id` BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
    `member_id` BIGINT(20) UNSIGNED NOT NULL,
    `event_id` BIGINT(20) UNSIGNED NOT NULL,
    `status` ENUM('verified', 'pending', 'rejected') NOT NULL DEFAULT 'pending',
    `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` DATETIME NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    INDEX `member_id_index` (`member_id`),
    INDEX `event_id_index` (`event_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;