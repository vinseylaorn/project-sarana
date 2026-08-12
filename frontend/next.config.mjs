/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  turbopack: {
    resolveAlias: {
      '@': './',
    },
  },
  experimental: {
    workerThreads: false,
    cpus: 1,
  },
}

export default nextConfig