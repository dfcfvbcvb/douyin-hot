#!/usr/bin/env python
"""Fetch Douyin hot search list and send to Feishu."""
import json
import os
import re
import ssl
import sys
import urllib.request

APP_ID = os.environ["FEISHU_APP_ID"]
APP_SECRET = os.environ["FEISHU_APP_SECRET"]
ADMIN_OPEN_ID = os.environ["FEISHU_ADMIN_OPEN_ID"]

ssl_ctx = ssl.create_default_context()
ssl_ctx.check_hostname = False
ssl_ctx.verify_mode = ssl.CERT_NONE


def get_tenant_token():
    data = json.dumps({"app_id": APP_ID, "app_secret": APP_SECRET}).encode()
    req = urllib.request.Request(
        "https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal",
        data=data,
        headers={"Content-Type": "application/json"},
    )
    resp = urllib.request.urlopen(req, timeout=15)
    return json.loads(resp.read())["tenant_access_token"]


def fetch_douyin_hot():
    req = urllib.request.Request(
        "https://tophub.today/n/MZd7PrPerO",
        headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        },
    )
    resp = urllib.request.urlopen(req, timeout=15, context=ssl_ctx)
    html = resp.read().decode("utf-8", errors="ignore")

    items = re.findall(
        r"<tr>.*?<td[^>]*align=\"center\"[^>]*>(.*?)</td>.*?<td[^>]*>.*?<a[^>]*>(.*?)</a>.*?<td[^>]*class=\"ws\"[^>]*>(.*?)</td>.*?</tr>",
        html,
        re.DOTALL,
    )
    return [
        (re.sub(r"<[^>]+>", "", t).strip(), re.sub(r"<[^>]+>", "", h).strip())
        for _, t, h in items
    ]


def send_feishu_message(token, title, items):
    lines = [f"{title}\n"]
    for i, (topic, heat) in enumerate(items[:30], 1):
        lines.append(f"{i}. {topic}  {heat}")
    text = "\n".join(lines)

    content = json.dumps({"text": text})
    data = json.dumps({
        "receive_id": ADMIN_OPEN_ID,
        "msg_type": "text",
        "content": content,
    }).encode()

    req = urllib.request.Request(
        "https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=open_id",
        data=data,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
    )
    resp = urllib.request.urlopen(req, timeout=15)
    result = json.loads(resp.read())
    if result.get("code") != 0:
        print(f"Failed to send: {result}")
        sys.exit(1)
    print("Message sent successfully")


def main():
    import datetime

    token = get_tenant_token()
    items = fetch_douyin_hot()
    today = datetime.date.today().strftime("%m/%d")
    title = f"今日抖音热搜  {today}"
    send_feishu_message(token, title, items)


if __name__ == "__main__":
    main()
