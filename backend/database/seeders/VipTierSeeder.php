<?php

namespace Database\Seeders;

use App\Models\VipTier;
use Illuminate\Database\Seeder;

class VipTierSeeder extends Seeder
{
    public function run(): void
    {
        $tiers = [
            [
                'name'          => 'Silver',
                'name_kh'       => 'ប្រាក់',
                'discount'      => 5,
                'min_visits'    => 1,
                'max_visits'    => 9,
                'upgrade_at'    => 10,
                'monthly_limit' => 0,
                'color'         => '#94a3b8',
                'bg_from'       => '#0f172a',
                'bg_to'         => '#1e293b',
                'accent_color'  => '#94a3b8',
                'icon'          => 'star',
            ],
            [
                'name'          => 'Gold',
                'name_kh'       => 'មាស',
                'discount'      => 10,
                'min_visits'    => 10,
                'max_visits'    => 29,
                'upgrade_at'    => 30,
                'monthly_limit' => 0,
                'color'         => '#F0B429',
                'bg_from'       => '#1C1A0E',
                'bg_to'         => '#2A2410',
                'accent_color'  => '#F0B429',
                'icon'          => 'gem',
            ],
            [
                'name'          => 'Platinum',
                'name_kh'       => 'ប្លាទីន',
                'discount'      => 15,
                'min_visits'    => 30,
                'max_visits'    => null,
                'upgrade_at'    => null,
                'monthly_limit' => 0,
                'color'         => '#e2e8f0',
                'bg_from'       => '#0c1322',
                'bg_to'         => '#111827',
                'accent_color'  => '#e2e8f0',
                'icon'          => 'crown',
            ],
        ];

        foreach ($tiers as $tier) {
            VipTier::firstOrCreate(['name' => $tier['name']], $tier);
        }
    }
}