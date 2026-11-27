<?php

return [

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'telegram' => [
        'bot_token' => env('TELEGRAM_BOT_TOKEN'),
        'chat_id'   => env('TELEGRAM_CHAT_ID'),
        'enabled'   => env('TELEGRAM_NOTIFICATIONS_ENABLED', true),
    ],
    'nbc' => [
        'url'            => env('NBC_RATE_URL', 'https://data.mef.gov.kh/api/v1/realtime-api/exchange-rate?currency_id=USD'),
        'api_key'        => env('NBC_API_KEY'),
        'api_key_header' => env('NBC_API_KEY_HEADER', 'x-api-key'),   // ឬ Authorization
        'api_key_query'  => env('NBC_API_KEY_QUERY'),                 // ឧ. apikey (បើ key ផ្ញើតាម ?apikey=...)
        'rate_path'      => env('NBC_RATE_PATH', 'data.average'),     // path ក្នុង JSON (data.average សម្រាប់ MEF)
    ],

];