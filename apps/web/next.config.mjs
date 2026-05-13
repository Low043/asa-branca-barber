/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        // O Next.js agirá como um proxy, redirecionando as requisições para a sua VM.
        // As requisições sairão do servidor da Vercel (onde HTTP é permitido).
        destination: `${process.env.API_BASE_URL}/:path*`,
      },
    ];
  },
};

export default nextConfig;