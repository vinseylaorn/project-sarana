FROM php:8.2-fpm-alpine

WORKDIR /var/www/html

# System packages + nginx + supervisor (process manager to run nginx + php-fpm together)
RUN apk add --no-cache \
    libpng-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    libzip-dev \
    zip \
    unzip \
    curl \
    nginx \
    supervisor

RUN docker-php-ext-configure gd --with-freetype --with-jpeg

RUN docker-php-ext-install \
    pdo_mysql \
    zip \
    gd

# Copy Composer from the official image
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

COPY composer.json composer.lock ./

RUN composer install --no-dev --optimize-autoloader --no-scripts --no-interaction \
    || composer install --no-dev --optimize-autoloader --no-scripts --no-interaction \
    || composer install --no-dev --optimize-autoloader --no-scripts --no-interaction --prefer-source

# Now copy the rest of the application code
COPY . .

RUN mkdir -p bootstrap/cache storage/logs storage/framework/cache \
    storage/framework/sessions storage/framework/views \
    && chmod -R 775 bootstrap/cache storage

RUN composer dump-autoload --optimize --no-scripts

# Laravel storage permissions
RUN chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

# Nginx + Supervisor config (see docker/ folder)
COPY docker/nginx.conf /etc/nginx/http.d/default.conf
COPY docker/supervisord.conf /etc/supervisord.conf
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["entrypoint.sh"]
CMD ["supervisord", "-c", "/etc/supervisord.conf"]
