FROM php:8.4-fpm-alpine

RUN apk add --no-cache libpq-dev

RUN docker-php-ext-install pdo pdo_pgsql pgsql bcmath

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer
