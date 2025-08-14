// Cloudflare Worker for cross-device sync
// Deploy this to Cloudflare Workers and update the endpoint in config.js

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, PUT, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
    
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }
    
    // Parse namespace from path
    const syncMatch = path.match(/^\/_sync\/(.+)$/) || path.match(/^\/sync\/(.+)$/);
    if (!syncMatch) {
      return new Response('Not Found', { status: 404, headers: corsHeaders });
    }
    
    const namespace = syncMatch[1];
    
    try {
      if (request.method === 'PUT') {
        return await handlePush(request, env, namespace, corsHeaders);
      } else if (request.method === 'GET') {
        return await handlePull(request, env, namespace, corsHeaders);
      } else {
        return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });
      }
    } catch (error) {
      console.error('Worker error:', error);
      return new Response('Internal Server Error', { 
        status: 500, 
        headers: corsHeaders 
      });
    }
  }
};

async function handlePush(request, env, namespace, corsHeaders) {
  const data = await request.json();
  const { items, cursor } = data;
  
  if (!items || !Array.isArray(items)) {
    return new Response('Invalid request body', { status: 400, headers: corsHeaders });
  }
  
  // Store each item in KV (LWW key and time-indexed key)
  const promises = items.map(async (item) => {
    const serverTimestamp = Date.now();
    const baseValue = {
      id: item.id,
      type: item.type,
      operation: item.operation,
      ciphertext: item.ciphertext,
      iv: item.iv,
      updatedAt: item.updatedAt,
      serverTimestamp
    };
    const value = JSON.stringify(baseValue);

    const lwwKey = `${namespace}:${item.type}:${item.id}`;
    const invTs = 9999999999999 - serverTimestamp; // newest-first ordering via inverted timestamp
    const tsKey = `${namespace}:ts:${String(invTs).padStart(13, '0')}:${item.type}:${item.id}`;
    
    await env.SYNC_KV.put(lwwKey, value);
    await env.SYNC_KV.put(tsKey, value);
  });
  
  await Promise.all(promises);
  
  // Update namespace cursor to last server timestamp (coarse LWW)
  const newCursor = Date.now().toString();
  await env.SYNC_KV.put(`${namespace}:cursor`, newCursor);
  
  return new Response(JSON.stringify({ 
    success: true, 
    cursor: newCursor,
    processed: items.length 
  }), {
    headers: { 
      'Content-Type': 'application/json',
      ...corsHeaders 
    }
  });
}

async function handlePull(request, env, namespace, corsHeaders) {
  const url = new URL(request.url);
  const since = url.searchParams.get('since') || '0';
  const sinceTimestamp = parseInt(since);
  const limitParam = url.searchParams.get('limit');
  const pageCursor = url.searchParams.get('pageCursor') || undefined;
  const batchSize = Math.min(Math.max(parseInt(limitParam || '500', 10) || 500, 1), 1000); // clamp 1..1000
  
  // Prefer reading from time-ordered index
  let listResult = await env.SYNC_KV.list({ prefix: `${namespace}:ts:`, limit: batchSize, cursor: pageCursor });

  // Backward-compat: if no ts-indexed keys exist and this is the first page, fallback to legacy prefix
  if ((!listResult || listResult.keys.length === 0) && !pageCursor) {
    listResult = await env.SYNC_KV.list({ prefix: `${namespace}:`, limit: batchSize, cursor: undefined });
  }
  
  const items = [];
  let minTsInPage = null;
  for (const key of listResult.keys) {
    if (key.name.endsWith(':cursor')) continue;
    const value = await env.SYNC_KV.get(key.name);
    if (!value) continue;
    const item = JSON.parse(value);
    // Track the oldest timestamp in this page (actual timestamp from value)
    if (typeof item.serverTimestamp === 'number') {
      minTsInPage = (minTsInPage === null) ? item.serverTimestamp : Math.min(minTsInPage, item.serverTimestamp);
    }
    if (item.serverTimestamp > sinceTimestamp) {
      items.push({
        id: item.id,
        type: item.type,
        operation: item.operation,
        ciphertext: item.ciphertext,
        iv: item.iv,
        updatedAt: item.updatedAt
      });
    }
  }
  
  // Get current namespace cursor (coarse timestamp)
  const currentCursor = await env.SYNC_KV.get(`${namespace}:cursor`) || Date.now().toString();

  // If listing isn't complete AND the oldest item in this page is still newer than 'since', there may be more relevant pages.
  const hasMore = (listResult && listResult.list_complete === false) && (minTsInPage !== null && minTsInPage > sinceTimestamp);
  const nextPageCursor = listResult && listResult.cursor ? listResult.cursor : null;
  
  return new Response(JSON.stringify({
    items,
    cursor: currentCursor,
    hasMore,
    pageCursor: nextPageCursor
  }), {
    headers: { 
      'Content-Type': 'application/json',
      ...corsHeaders 
    }
  });
}

// Cleanup old entries (optional - run periodically)
async function cleanup(env, namespace, maxAge = 30 * 24 * 60 * 60 * 1000) { // 30 days
  const cutoff = Date.now() - maxAge;
  // Clean both the LWW keys and time-index keys
  const listResult = await env.SYNC_KV.list({ prefix: `${namespace}:` });
  
  const deletePromises = [];
  
  for (const key of listResult.keys) {
    if (key.name.endsWith(':cursor')) continue;
    const value = await env.SYNC_KV.get(key.name);
    if (value) {
      const item = JSON.parse(value);
      if (item.serverTimestamp < cutoff) {
        deletePromises.push(env.SYNC_KV.delete(key.name));
      }
    }
  }
  
  await Promise.all(deletePromises);
  return deletePromises.length;
}
