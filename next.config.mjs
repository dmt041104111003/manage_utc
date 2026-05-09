/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // JSON đăng ký có base64 (tối đa ~2×20MB); tăng giới hạn body cho Server Actions nếu dùng sau này
    serverActions: {
      bodySizeLimit: "45mb"
    }
  }
};

export default nextConfig;
