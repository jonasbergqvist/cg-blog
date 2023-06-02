import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import React from 'react';
import { ApolloClient, ApolloLink, ApolloProvider, from, HttpLink, InMemoryCache } from '@apollo/client';

import Base64 from 'crypto-js/enc-base64';
import md5 from 'crypto-js/md5';
import hmacSHA256 from "crypto-js/hmac-sha256";

function generateHMACKey (key, secretKey, body_str) {
  let secret = Base64.parse(secretKey);
  let method = "POST";
  let target = `https://cg.optimizely.com/content/v2?auth=${process.env.NEXT_PUBLIC_CG_SINGLE_KEY}`;
  let timestamp = (new Date()).getTime();
  let nonce = Math.random().toString(36).substring(7);
  let body = "";
  body = body_str;
  let bodybase64 = Base64.stringify(md5(body));
  let message = key + method + target + timestamp + nonce + bodybase64;
  let hmac = hmacSHA256(message, secret);
  let base64hmac = Base64.stringify(hmac);
  return "epi-hmac " + key + ":" + timestamp +":" + nonce + ":" + base64hmac;
}

const httpLink = new HttpLink({ uri: `https://cg.optimizely.com/content/v2?auth=${process.env.NEXT_PUBLIC_CG_SINGLE_KEY}` });

const authMiddleware = new ApolloLink((operation, forward) => {
  // add the authorization to the headers

  const query = operation.query
  const variables = operation.variables
  let bodyString = JSON.stringify({
    query,
    variables
  });

  operation.setContext(({ headers = {} }) => ({
    headers: {
      ...headers,
      authorization: generateHMACKey(
        process.env.NEXT_PUBLIC_CG_APP_KEY,
        process.env.NEXT_PUBLIC_CG_SECRET,
        bodyString
      )
    }
  }));

  return forward(operation);
})

const activityMiddleware = new ApolloLink((operation, forward) => {
  // add the recent-activity custom header to the headers
  operation.setContext(({ headers = {} }) => ({
    headers: {
      ...headers,
      //'recent-activity': localStorage.getItem('lastOnlineTime') || null,
    }
  }));

  return forward(operation);
})


//const queryClient = new QueryClient()
const client = new ApolloClient({
  cache: new InMemoryCache(),
  link: from([
    authMiddleware,
    activityMiddleware,
    httpLink
  ]),
});

export default function App({ Component, pageProps }: AppProps) {
  return(
  <ApolloProvider client={client}>
    <Component {...pageProps} />
  </ApolloProvider>
  );
}