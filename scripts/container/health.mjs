try {
  const response = await fetch('http://127.0.0.1:3000/api/auth/session', { signal: AbortSignal.timeout(3000) });
  if (response.status !== 401) process.exitCode = 1;
} catch { process.exitCode = 1; }
