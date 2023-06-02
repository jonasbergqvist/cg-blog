import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import React from 'react';
import { ApolloClient, ApolloLink, ApolloProvider, from, HttpLink, InMemoryCache } from '@apollo/client';

import Base64 from 'crypto-js/enc-base64';
import md5 from 'crypto-js/md5';
import hmacSHA256 from "crypto-js/hmac-sha256";

function generateHMAC(key: string, secretKey: string, url: URL | RequestInfo, init: RequestInit) {
  const secret = Base64.parse(secretKey);
  const method = init.method;
  const target = new URL(url.toString()).pathname;
  const timestamp = new Date().getTime();
  const nonce = Math.random().toString(36).substring(7);
  const body = init.body as any;
  const body_b64 = Base64.stringify(md5(body));
  const message = key + method + target + timestamp + nonce + body_b64;
  const hmac = hmacSHA256(message, secret);
  const base64hmac = Base64.stringify(hmac);
  return key + ":" + timestamp + ":" + nonce + ":" + base64hmac;
}

const httpLink = new HttpLink({
  uri: `https://cg.optimizely.com/content/v2`,
  fetch: (uri, options) => {
    const singleKey = process.env.NEXT_PUBLIC_CG_SINGLE_KEY
    const appKey = process.env.NEXT_PUBLIC_CG_APP_KEY
    const secret = process.env.NEXT_PUBLIC_CG_SECRET
    const request = new Request(uri, options)

    if (appKey && secret) {
      const hmac = generateHMAC(appKey, secret, uri, options)
      request.headers.set("Authorization", `epi-hmac ${hmac}`)
    }

    else if (singleKey) {
      request.headers.set("Authorization", `epi-single ${singleKey}`)
    }

    return fetch(request)
  }
});

const activityMiddleware = new ApolloLink((operation, forward) => {
  operation.setContext(({ headers = {} }) => ({
    headers: {
      ...headers,
    }
  }));

  return forward(operation);
})

const client = new ApolloClient({
  cache: new InMemoryCache(),
  link: from([
    activityMiddleware,
    httpLink
  ]),
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ApolloProvider client={client}>
      <Component {...pageProps} />
    </ApolloProvider>
  );
}