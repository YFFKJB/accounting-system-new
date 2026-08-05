/**
 * Cloudflare Pages Functions —— 反向代理到 Vercel 后端 API
 *
 * 作用：国内用户访问 Cloudflare Pages 上的静态页面时，
 * 所有 /api/* 请求由 Cloudflare 边缘节点转发到 Vercel，
 * 用户无需直连 Vercel，因此不需要 VPN。
 *
 * 部署前需要在 Cloudflare Pages 项目设置里配置环境变量：
 *   VERCEL_ORIGIN = https://你的项目名.vercel.app
 * （不带末尾斜杠）。未配置时使用下方 DEFAULT_ORIGIN 兜底。
 */

const DEFAULT_ORIGIN = 'https://accounting-system-new.vercel.app';

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const origin = (env.VERCEL_ORIGIN || DEFAULT_ORIGIN).trim().replace(/\/+$/, '');

  if (!origin) {
    return new Response(
      JSON.stringify({ error: '服务端未配置 VERCEL_ORIGIN 环境变量' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
      }
    );
  }

  const target = new URL(origin);
  target.pathname = url.pathname;
  target.search = url.search;

  // 预检请求直接放行
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders() });
  }

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

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400'
  };
}
