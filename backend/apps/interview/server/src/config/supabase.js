import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';
import { localDatabaseStore } from './localDatabaseStore.js';

let remoteClient = null;
let useLocalFallback = false;
let fallbackNoticeLogged = false;

// Attempt initializing remote Supabase client if URL provided
if (env.supabase?.url && env.supabase?.serviceRoleKey) {
  try {
    remoteClient = createClient(env.supabase.url, env.supabase.serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
  } catch (err) {
    console.warn('[Database] Failed to instantiate Supabase client, utilizing resilient local store:', err.message);
    useLocalFallback = true;
  }
} else {
  useLocalFallback = true;
}

// Initial health check probe with realistic WAN cold-start timeout and safe development logging
(async () => {
  if (remoteClient && !useLocalFallback) {
    const probeStart = Date.now();
    let hostname = 'unknown';
    try {
      hostname = new URL(env.supabase.url).hostname;
    } catch (_) {}

    try {
      const controller = new AbortController();
      // Cold TLS handshake across geographic regions requires realistic headroom (8s)
      const timer = setTimeout(() => controller.abort(), 8000);

      // Use HEAD method to avoid serializing and downloading 45KB OpenAPI spec on startup probe
      const res = await fetch(`${env.supabase.url}/rest/v1/`, {
        method: 'HEAD',
        headers: {
          apikey: env.supabase.serviceRoleKey,
          Authorization: `Bearer ${env.supabase.serviceRoleKey}`
        },
        signal: controller.signal
      });

      clearTimeout(timer);
      const durationMs = Date.now() - probeStart;

      if (res && res.ok) {
        console.log(`[Database] Remote Supabase cloud connection operational (${hostname}, ${durationMs}ms, HTTP ${res.status}).`);
      } else {
        const statusErr = new Error(`HTTP status: ${res?.status || 'unreachable'}`);
        statusErr.status = res?.status;
        throw statusErr;
      }
    } catch (err) {
      const durationMs = Date.now() - probeStart;
      useLocalFallback = true;
      if (!fallbackNoticeLogged) {
        console.log(`[Database] Remote Supabase cloud unreachable (${err.message || 'DNS/Network'}). Active database engine: Resilient Local Store.`);
        if (env.env === 'development') {
          console.debug('[Database][Debug Diagnostic]', {
            name: err.name,
            message: err.message,
            cause: err.cause,
            httpStatus: err.status || null,
            durationMs,
            endpointHost: hostname
          });
        }
        fallbackNoticeLogged = true;
      }
    }
  }
})();

export const isUsingLocalFallback = () => useLocalFallback;

/**
 * Resilient Query Builder that records chained operations and seamlessly
 * falls back to localDatabaseStore if remote Supabase fails at any point.
 */
class ResilientQueryBuilder {
  constructor(tableName) {
    this.tableName = tableName;
    this.ops = [];
  }

  _record(method, args) {
    this.ops.push({ method, args });
    return this;
  }

  select(...args) { return this._record('select', args); }
  insert(...args) { return this._record('insert', args); }
  update(...args) { return this._record('update', args); }
  upsert(...args) { return this._record('upsert', args); }
  delete(...args) { return this._record('delete', args); }
  eq(...args) { return this._record('eq', args); }
  neq(...args) { return this._record('neq', args); }
  in(...args) { return this._record('in', args); }
  is(...args) { return this._record('is', args); }
  order(...args) { return this._record('order', args); }
  limit(...args) { return this._record('limit', args); }
  range(...args) { return this._record('range', args); }
  single(...args) { return this._record('single', args); }
  maybeSingle(...args) { return this._record('maybeSingle', args); }

  _executeLocal() {
    let q = localDatabaseStore.from(this.tableName);
    for (const op of this.ops) {
      if (typeof q[op.method] === 'function') {
        q = q[op.method](...op.args);
      }
    }
    return q;
  }

  async _executeRemote() {
    let q = remoteClient.from(this.tableName);
    for (const op of this.ops) {
      if (typeof q[op.method] === 'function') {
        q = q[op.method](...op.args);
      }
    }
    const result = await q;
    // Inspect if error is network/DNS error
    if (result?.error) {
      const msg = result.error.message || '';
      if (msg.includes('fetch failed') || msg.includes('ENOTFOUND') || msg.includes('ECONNREFUSED') || msg.includes('network') || msg.includes('getaddrinfo')) {
        throw new Error(msg);
      }
    }
    return result;
  }

  async execute() {
    if (useLocalFallback || !remoteClient) {
      return this._executeLocal().execute();
    }

    try {
      return await this._executeRemote();
    } catch (err) {
      if (!fallbackNoticeLogged) {
        console.log(`[Database] Remote Supabase request failed (${err.message}). Active database engine: Resilient Local Store.`);
        fallbackNoticeLogged = true;
      }
      useLocalFallback = true;
      return this._executeLocal().execute();
    }
  }

  then(resolve, reject) {
    return this.execute().then(resolve, reject);
  }

  catch(reject) {
    return this.execute().catch(reject);
  }
}

export const supabase = {
  from(tableName) {
    return new ResilientQueryBuilder(tableName);
  },

  get storage() {
    if (useLocalFallback || !remoteClient) {
      return localDatabaseStore.storage;
    }
    return remoteClient.storage;
  }
};

export default supabase;
