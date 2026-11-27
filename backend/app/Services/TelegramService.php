<?php

namespace App\Services;

use App\Models\Inventory;
use App\Models\Order;
use App\Models\Reservation;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TelegramService
{
    protected ?string $botToken;
    protected ?string $chatId;
    protected bool $enabled;

    public function __construct()
    {
        $this->botToken = config('services.telegram.bot_token', env('TELEGRAM_BOT_TOKEN'));
        $this->chatId = config('services.telegram.chat_id', env('TELEGRAM_CHAT_ID'));
        $this->enabled = (bool) config('services.telegram.enabled', env('TELEGRAM_NOTIFICATIONS_ENABLED', true));
    }

    /**
     * Send message via Telegram Bot API
     */
    public function sendMessage(string $text, string $parseMode = 'HTML'): bool
    {
        if (!$this->enabled || empty($this->botToken) || empty($this->chatId)) {
            Log::info('Telegram notification skipped: missing configuration or disabled.');
            return false;
        }

        try {
            $url = "https://api.telegram.org/bot{$this->botToken}/sendMessage";
            $response = Http::timeout(5)->post($url, [
                'chat_id'    => $this->chatId,
                'text'       => $text,
                'parse_mode' => $parseMode,
            ]);

            if ($response->failed()) {
                Log::error('Telegram API error: ' . $response->body());
                return false;
            }

            return true;
        } catch (\Exception $e) {
            Log::error('Telegram notification exception: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Send photo with caption via Telegram Bot API
     */
    public function sendPhoto(string $photoPathOrUrl, string $caption = '', string $parseMode = 'HTML'): bool
    {
        if (!$this->enabled || empty($this->botToken) || empty($this->chatId)) {
            return false;
        }

        try {
            $url = "https://api.telegram.org/bot{$this->botToken}/sendPhoto";

            if (filter_var($photoPathOrUrl, FILTER_VALIDATE_URL)) {
                $response = Http::timeout(8)->post($url, [
                    'chat_id'    => $this->chatId,
                    'photo'      => $photoPathOrUrl,
                    'caption'    => $caption,
                    'parse_mode' => $parseMode,
                ]);
            } elseif (file_exists($photoPathOrUrl)) {
                $response = Http::timeout(10)
                    ->attach('photo', file_get_contents($photoPathOrUrl), basename($photoPathOrUrl))
                    ->post($url, [
                        'chat_id'    => $this->chatId,
                        'caption'    => $caption,
                        'parse_mode' => $parseMode,
                    ]);
            } else {
                return $this->sendMessage($caption, $parseMode);
            }

            if ($response->failed()) {
                Log::error('Telegram sendPhoto error: ' . $response->body());
                return $this->sendMessage($caption, $parseMode);
            }

            return true;
        } catch (\Exception $e) {
            Log::error('Telegram sendPhoto exception: ' . $e->getMessage());
            return $this->sendMessage($caption, $parseMode);
        }
    }

    /**
     * Send alert when a new Reservation / Booking is created
     */
    public function sendReservationNotification(Reservation $reservation): bool
    {
        $reservation->loadMissing(['tables', 'items']);

        $tables = $reservation->tables->pluck('name')->join(', ');
        if (empty($tables)) {
            $tables = 'N/A';
        }

        $formattedTime = $reservation->arrival_datetime 
            ? $reservation->arrival_datetime->format('Y-m-d h:i A') 
            : now()->format('Y-m-d h:i A');

        $itemsText = "";
        if ($reservation->items->isNotEmpty()) {
            $itemsText .= "\n📋 <b>Reserved Items:</b>\n";
            foreach ($reservation->items as $index => $item) {
                $num = $index + 1;
                $name = e($item->name ?? 'Item');
                $qty = $item->quantity ?? 1;
                $subtotal = number_format(($item->price ?? 0) * $qty, 2);
                // ✅ FIX: "\${subtotal}" printed the literal text "${subtotal}"
                // because \$ escapes the dollar sign and {subtotal} (without a
                // leading $) is not variable interpolation. Correct form is
                // "\${$subtotal}" — escaped $ followed by the interpolated variable.
                $itemsText .= "  {$num}. <b>{$name}</b> x{$qty} — \${$subtotal}\n";
            }
        }

        $customerName  = e($reservation->customer_name ?? 'Guest');
        $customerPhone = e($reservation->customer_phone ?? 'N/A');

        $text = "📅 <b>NEW BOOKING / RESERVATION</b>\n\n"
            . "👤 <b>Customer Name:</b> {$customerName}\n"
            . "📞 <b>Phone Number:</b> {$customerPhone}\n"
            . "📅 <b>Date & Time:</b> {$formattedTime}\n"
            . "🪑 <b>Table :</b> {$tables}\n"
            . "🆔 <b>Reservation ID:</b> #{$reservation->id}\n"
            . "⚡ <b>Status:</b> " . strtoupper(e($reservation->status ?? 'pending')) . "\n"
            . $itemsText;

        if ($reservation->total_price > 0) {
            $text .= "\n💰 <b>Total Price:</b> $" . number_format($reservation->total_price, 2) . "\n";
        }

        if (!empty($reservation->notes)) {
            $text .= "📝 <b>Notes:</b> " . e($reservation->notes) . "\n";
        }

        return $this->sendMessage($text);
    }

    /**
     * Send alert when a new Customer Order is placed
     */
    public function sendOrderNotification(Order $order): bool
    {
        $order->loadMissing('items');

        $formattedDate = $order->created_at 
            ? $order->created_at->format('Y-m-d h:i A') 
            : now()->format('Y-m-d h:i A');

        $itemsText = "";
        $firstItemImage = null;

        foreach ($order->items as $index => $item) {
            $num = $index + 1;
            $name = e($item->name ?? $item->menu_item_name ?? 'Item');
            $qty = $item->quantity ?? 1;
            $subtotal = number_format(($item->price ?? 0) * $qty, 2);
            // ✅ FIX: same escaping bug as above — use "\${$subtotal}" so the
            // variable is actually interpolated instead of printing "${subtotal}".
            $itemsText .= "  {$num}. <b>{$name}</b> x{$qty} — \${$subtotal}\n";

            // Find image for item if available
            if (!$firstItemImage && !empty($item->menu_item_id)) {
                $menuItem = \App\Models\MenuItem::find($item->menu_item_id);
                if ($menuItem && !empty($menuItem->image)) {
                    $img = $menuItem->image;
                    if (str_starts_with($img, 'http://') || str_starts_with($img, 'https://')) {
                        $firstItemImage = $img;
                    } else {
                        $localPath = storage_path('app/public/' . ltrim($img, '/'));
                        if (file_exists($localPath)) {
                            $firstItemImage = $localPath;
                        }
                    }
                }
            }
        }

        $customerName  = e($order->customer_name ?? 'Guest / Walk-in');
        $customerPhone = e($order->customer_phone ?? 'N/A');
        $tableName     = e($order->table_name ?? 'Takeaway / Counter');

        $text = "🛒 <b>NEW CUSTOMER ORDER</b>\n\n"
            . "👤 <b>Customer Name:</b> {$customerName}\n"
            . "📞 <b>Phone Number:</b> {$customerPhone}\n"
            . "📅 <b>Date & Time:</b> {$formattedDate}\n"
            . "🪑 <b>Table / Room:</b> {$tableName}\n"
            . "🆔 <b>Order Ref:</b> #" . e($order->order_ref ?? $order->id) . "\n"
            . "⚡ <b>Status:</b> " . strtoupper(e($order->status ?? 'pending')) . "\n\n"
            . "📋 <b>Items Ordered:</b>\n"
            . $itemsText . "\n"
            . "💰 <b>Total Price:</b> $" . number_format($order->total ?? 0, 2) . "\n"
            . "💳 <b>Payment Method:</b> " . strtoupper(e($order->payment_method ?? 'Unpaid')) . "\n";

        if ($firstItemImage) {
            return $this->sendPhoto($firstItemImage, $text);
        }

        return $this->sendMessage($text);
    }

    /**
     * Send alert when Stock is low (stock <= min_stock)
     */
    public function sendLowStockNotification(Inventory $inventory, float $currentStock): bool
    {
        $unit = e($inventory->unit ?? 'pcs');
        $text = "⚠️ <b>LOW STOCK WARNING</b>\n\n"
            . "📦 <b>Item Name:</b> " . e($inventory->name) . "\n"
            . "📉 <b>Current Stock:</b> {$currentStock} {$unit}\n"
            . "📊 <b>Min Stock Threshold:</b> {$inventory->min_stock} {$unit}\n\n"
            . "🔔 <b>Action Required:</b> Stock is below minimum level. Please re-order soon!\n";

        return $this->sendMessage($text);
    }

    /**
     * Send alert when Stock is completely out (stock <= 0)
     */
    public function sendOutOfStockNotification(Inventory $inventory): bool
    {
        $currentStock = (float) $inventory->stock;
        $unit = e($inventory->unit ?? 'pcs');
        $text = "🚨 <b>OUT OF STOCK ALERT</b>\n\n"
            . "📦 <b>Item Name:</b> " . e($inventory->name) . "\n"
            . "📉 <b>Current Stock:</b> {$currentStock} {$unit}\n"
            . "📊 <b>Min Stock Threshold:</b> {$inventory->min_stock} {$unit}\n\n"
            . "🛑 <b>CRITICAL WARNING:</b> Item is OUT OF STOCK ({$currentStock} {$unit})! Please restock immediately.\n";

        return $this->sendMessage($text);
    }
}