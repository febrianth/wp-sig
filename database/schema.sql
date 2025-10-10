CREATE TABLE `%%PREFIX%%sig_members` (
    `id` BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `full_address` TEXT,
    `district_id` VARCHAR(10) NULL,
    `village_id` VARCHAR(20) NULL,
    `latitude` DECIMAL(10, 8) NULL,
    `longitude` DECIMAL(11, 8) NULL,
    `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` DATETIME NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    INDEX `province_id_index` (`province_id`),
    INDEX `regency_id_index` (`regency_id`),
    INDEX `district_id_index` (`district_id`),
    INDEX `village_id_index` (`village_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;