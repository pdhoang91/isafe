// src/pages/_app.jsx
import '../../styles/globals.css';
import { CssBaseline } from '@mui/material';
import Head from 'next/head';

function MyApp({ Component, pageProps }) {
    return (
        <>
            <Head>
                <title>iSafe Security Dashboard</title>
                <meta name="viewport" content="initial-scale=1, width=device-width" />
            </Head>
            <CssBaseline />
            <Component {...pageProps} />
        </>
    );
}

export default MyApp;
