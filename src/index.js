/**
 * PilotsEYE 记账系统 - Cloudflare Worker
 *
 * 作用：
 * 1. 静态页面（public/ 目录）由 Cloudflare 直接提供；
 * 2. /api/* 请求转发到 Vercel 后端，国内用户无需直连 Vercel。
 */

const DEFAULT_ORIGIN = 'https://accounting-system-new.vercel.app';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // API 请求：转发到 Vercel 后端
    if (url.pathname.startsWith('/api/')) {
      const origin = (env.VERCEL_ORIGIN || DEFAULT_ORIGIN).trim().replace(/\/+$/, '');

      // 预检请求直接放行
      if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: corsHeaders() });
      }

      const target = new URL(origin);
      target.pathname = url.pathname;
      target.search = url.search;

      const upstream = await fetch(target.toString(), request);
      const headers = new Headers(upstream.headers);
      headers.set('Access-Control-Allow-Origin', '*');
      headers.set('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
      headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

      return new Response(upstream.body, {
        status: upstream.status,
        statusText: upstream.statusText,
        headers
      });
    }

    // 其他请求：提供静态资源（public/ 目录）
    return env.ASSETS.fetch(request);
  }
};

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400'
  };
}
