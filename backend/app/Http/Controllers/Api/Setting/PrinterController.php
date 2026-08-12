<?php

namespace App\Http\Controllers\Api\Setting;

use App\Http\Controllers\Controller;
use App\Models\Printer;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class PrinterController extends Controller
{
    public function index(): JsonResponse
    {
        $printers = Printer::all()->map(fn($p) => $this->format($p));
        return response()->json($printers);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'       => 'required|string|max:255',
            'ip_address' => 'required|string|max:255',
            'categories' => 'nullable|array',
        ]);

        $data['status']     = $this->pingPrinter($data['ip_address']) ? 'online' : 'offline';
        $data['categories'] = $data['categories'] ?? [];

        $printer = Printer::create($data);

        return response()->json($this->format($printer), 201);
    }

    // PUT /api/printers/{printer}
    public function update(Request $request, Printer $printer): JsonResponse
    {
        $data = $request->validate([
            'name'       => 'sometimes|string|max:255',
            'ip_address' => 'sometimes|string|max:255',
            'categories' => 'nullable|array',
            'status'     => 'sometimes|in:online,offline',
        ]);

        if (isset($data['ip_address'])) {
            $data['status'] = $this->pingPrinter($data['ip_address']) ? 'online' : 'offline';
        }

        $printer->update($data);

        return response()->json($this->format($printer));
    }

    public function destroy(Printer $printer): JsonResponse
    {
        $printer->delete();
        return response()->json(['message' => 'Printer deleted successfully']);
    }

    // POST /api/printers/scan
    public function scan(Request $request): JsonResponse
    {
        $request->validate([
            'subnet' => 'nullable|string',
        ]);

        $subnet = $request->input('subnet', $this->detectSubnet());
        $found  = [];

        for ($i = 1; $i <= 254; $i++) {
            $ip = "{$subnet}.{$i}";
            if ($this->pingPrinter($ip)) {
                $existing = Printer::where('ip_address', $ip)->first();
                if ($existing) {
                    $existing->update(['status' => 'online']);
                } else {
                    $found[] = [
                        'ip_address' => $ip,
                        'name'       => "Printer ({$ip})",
                        'status'     => 'online',
                        'categories' => [],
                    ];
                }
            }
        }

        return response()->json([
            'found'   => count($found),
            'devices' => $found,
        ]);
    }

    public function saveScanResult(Request $request): JsonResponse
    {
        $request->validate([
            'devices'              => 'required|array',
            'devices.*.ip_address' => 'required|string',
            'devices.*.name'       => 'required|string',
        ]);

        $saved = [];
        foreach ($request->devices as $device) {
            $printer = Printer::firstOrCreate(
                ['ip_address' => $device['ip_address']],
                [
                    'name'       => $device['name'],
                    'status'     => 'online',
                    'categories' => [],
                ]
            );
            $saved[] = $this->format($printer);
        }

        return response()->json($saved, 201);
    }

    public function ping(Printer $printer): JsonResponse
    {
        $online = $this->pingPrinter($printer->ip_address);
        $printer->update(['status' => $online ? 'online' : 'offline']);

        return response()->json([
            'id'     => (string) $printer->id,
            'status' => $online ? 'online' : 'offline',
        ]);
    }


    private function pingPrinter(string $ip, int $port = 9100, float $timeout = 0.5): bool
    {
        $sock = @fsockopen($ip, $port, $errno, $errstr, $timeout);
        if ($sock) {
            fclose($sock);
            return true;
        }
        return false;
    }

    private function detectSubnet(): string
    {
        $serverIp = gethostbyname(gethostname());
        $parts    = explode('.', $serverIp);
        if (count($parts) === 4) {
            return "{$parts[0]}.{$parts[1]}.{$parts[2]}";
        }
        return '192.168.1';
    }

    private function format(Printer $p): array
    {
        return [
            'id'         => (string) $p->id,
            'name'       => $p->name,
            'ipAddress'  => $p->ip_address,
            'status'     => $p->status,
            'categories' => $p->categories ?? [],
        ];
    }
}