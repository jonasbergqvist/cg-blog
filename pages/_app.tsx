import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { ApolloClient, ApolloProvider, InMemoryCache } from '@apollo/client';

//const queryClient = new QueryClient()
const client = new ApolloClient({
  uri: `https://cg.optimizely.com/content/v2?auth=${process.env.NEXT_PUBLIC_CG_SINGLE_KEY}`,
  cache: new InMemoryCache(),
  //headers = 
});

export default function App({ Component, pageProps }: AppProps) {
  return(
  <ApolloProvider client={client}>
    <Component {...pageProps} />
  </ApolloProvider>
  );
}
