// // src/pages/index.jsx
// export default Dashboard;

import React, { useEffect, useState } from 'react';
import { getAlerts } from '../services/api';
import AlertList from '../components/AlertList';
import Header from '../components/Header';
import { Container, Typography, CircularProgress, Alert as MuiAlert, Grid } from '@mui/material';
import FaceAutoScanBox from '../components/FaceAutoScanBox';

function Dashboard() {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchAlerts = () => {
        getAlerts()
            .then(response => {
                setAlerts(response.data);
                setLoading(false);
            })
            .catch(error => {
                setError('Error fetching alerts.');
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchAlerts();
    }, []);

    return (
        <>
            <Header />
            <Container>
                <Typography variant="h4" gutterBottom>
                    Alerts Dashboard
                </Typography>
                <Grid container spacing={4}>
                    <Grid item xs={12} md={6}>
                        <FaceAutoScanBox />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        {loading && <CircularProgress />}
                        {error && <MuiAlert severity="error">{error}</MuiAlert>}
                        {!loading && !error && <AlertList alerts={alerts} />}
                    </Grid>
                </Grid>
            </Container>
        </>
    );
}

export default Dashboard;

