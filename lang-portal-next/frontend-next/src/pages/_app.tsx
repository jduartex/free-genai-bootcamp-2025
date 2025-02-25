import '../styles/globals.css';
import { AppProps } from 'next/app';
import { useRouter } from 'next/router';

const MyApp = ({ Component, pageProps }: AppProps) => {
  const router = useRouter();
  return <Component {...pageProps} key={router.route} />;
};

export default MyApp;
