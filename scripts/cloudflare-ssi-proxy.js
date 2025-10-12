export default {
    async fetch(request) {
      const url = new URL(request.url);
      const path = url.pathname.replace(/^\/+/, ''); // vd: stock/exchange/hose
      const query = url.search; // vd: ?boardId=MAIN
  
      const targetUrl = `https://iboard-query.ssi.com.vn/${path}${query}`;
  
      const res = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          'Accept': 'application/json, text/plain, */*',
          'Referer': 'https://iboard.ssi.com.vn/',
          'Origin': 'https://iboard.ssi.com.vn'
        }
      });
  
      return new Response(await res.text(), {
        status: res.status,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      });
    }
  }
  