import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
});

const nextConfig: NextConfig = {
  // Hapus bagian eslint dan typescript yang lama
  // Jika ingin mengabaikan error saat build, gunakan ini:
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default withPWA(nextConfig);
