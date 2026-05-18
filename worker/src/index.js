const FEISHU_AUTH = 'https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal';
const FEISHU_SEND = 'https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=open_id';

const SOURCES = [
  { url: 'https://uapis.cn/api/v1/misc/hotboard?type=douyin', parser: 'uapis' },
  { url: 'https://api.xunjinlu.fun/api/rebang/douyin.php', parser: 'xjl' },
];

async function getToken(env) {
  const r = await fetch(FEISHU_AUTH, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ app_id: env.FEISHU_APP_ID, app_secret: env.FEISHU_APP_SECRET }),
  });
  return (await r.json()).tenant_access_token;
}

async function fetchItems() {
  for (const src of SOURCES) {
    try {
      const r = await fetch(src.url, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
      });
      const data = await r.json();
      let items = [];

      if (src.parser === 'uapis' && data?.data?.list) {
        items = data.data.list.map(i => ({
          title: i.title || '',
          heat: i.hot_label || i.hot_value?.toString() || '',
        }));
      } else if (src.parser === 'xjl' && data?.data?.list) {
        items = data.data.list.map(i => ({
          title: i.title || '',
          heat: i.hot_label || i.hot_value?.toString() || '',
        }));
      }

      if (items.length > 0) return items;
    } catch (e) {
      console.error('Source failed:', src.url, e.message);
    }
  }
  throw new Error('All sources failed');
}

function fmt(items) {
  const now = new Date();
  const d = (now.getMonth()+1) + '/' + now.getDate();
  const t = now.toTimeString().slice(0,5);
  let text = '今日抖音热搜  ' + d + '  ' + t + '\n\n';
  items.slice(0,30).forEach((item,i) => {
    text += (i+1) + '. ' + item.title + '  ' + item.heat + '\n';
  });
  return { msg_type: 'text', content: JSON.stringify({ text }) };
}

async function send(token, oid, msg) {
  const r = await fetch(FEISHU_SEND, {
    method: 'POST',
    headers: { Authorization: 'Bearer '+token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ receive_id: oid, ...msg }),
  });
  const j = await r.json();
  if (j.code !== 0) throw new Error('FS err: '+j.code+' '+j.msg);
}

export default {
  async scheduled(event, env, ctx) {
    try {
      const token = await getToken(env);
      const items = await fetchItems();
      await send(token, env.FEISHU_ADMIN_OPEN_ID, fmt(items));
      console.log('OK', items.length, 'items');
    } catch (e) {
      console.error('FAIL', e.message);
      try {
        const token = await getToken(env);
        await send(token, env.FEISHU_ADMIN_OPEN_ID, {
          msg_type: 'text',
          content: JSON.stringify({ text: '抖音热搜拉取失败: ' + e.message }),
        });
      } catch (_) {}
    }
  },
  async fetch(request, env, ctx) {
    try {
      const items = await fetchItems();
      return new Response(JSON.stringify({ ok: true, count: items.length }), { headers: { 'Content-Type':'application/json' } });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type':'application/json' } });
    }
  },
};
