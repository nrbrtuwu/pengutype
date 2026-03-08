/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["http://10.11.0.40:3000"],
  images: {
    unoptimized: true,
  },
}

export default nextConfig
