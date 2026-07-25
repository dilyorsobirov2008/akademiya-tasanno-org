/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" }, // Video thumbnail / fayl xosting domenlarini shu yerda cheklashingiz mumkin
    ],
  },
};

module.exports = nextConfig;
