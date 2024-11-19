import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import { nets, detectAllFaces, TinyFaceDetectorOptions, loadFromUri } from 'face-api.js';
import { verifyFace } from '../services/api';
import { Typography, CircularProgress, Alert, Box } from '@mui/material';

function FaceAutoScan() {
    const webcamRef = useRef(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [result, setResult] = useState(null);

    useEffect(() => {
        const loadModels = async () => {
            setLoading(true);
            try {
                const MODEL_URL = '/models';
                await nets.tinyFaceDetector.loadFromUri(MODEL_URL);
                await nets.faceLandmark68Net.loadFromUri(MODEL_URL);
                await nets.faceRecognitionNet.loadFromUri(MODEL_URL);
                setLoading(false);
            } catch (err) {
                setError('Error loading face detection models.');
                setLoading(false);
            }
        };

        loadModels();
    }, []);

    const detectFace = async () => {
        if (!webcamRef.current || !webcamRef.current.video) return;

        const video = webcamRef.current.video;

        if (video.readyState === 4) {
            try {
                const detections = await detectAllFaces(
                    video,
                    new TinyFaceDetectorOptions()
                );

                if (detections.length > 0) {
                    console.log('Face detected:', detections);
                    captureAndVerify();
                } else {
                    console.log('No face detected');
                }
            } catch (err) {
                setError('Error during face detection.');
            }
        }
    };

    const captureAndVerify = async () => {
        if (!webcamRef.current) return;
    
        const imageSrc = webcamRef.current.getScreenshot();
        if (!imageSrc) {
            setError('Failed to capture image.');
            return;
        }
    
        // Convert base64 to Blob
        const byteString = atob(imageSrc.split(',')[1]);
        const mimeString = imageSrc.split(',')[0].split(':')[1].split(';')[0];
        const arrayBuffer = new Uint8Array(byteString.length);
    
        for (let i = 0; i < byteString.length; i++) {
            arrayBuffer[i] = byteString.charCodeAt(i);
        }
    
        const blob = new Blob([arrayBuffer], { type: mimeString });
    
        setLoading(true);
        setError(null);
        setResult(null);
    
        try {
            const response = await verifyFace(blob);
            console.log("response", response)
            if (response.data.match) {
                console.log('User identified:', response.data.user.name);
                setResult(response.data);
            } else {
                console.log('Face not recognized:', response.data || 'Unknown error');
                setResult({
                    Match: false,
                    AlertMessage: response.data.AlertMessage || 'Face not recognized',
                });
            }
        } catch (err) {
            setError('Error verifying face.');
        } finally {
            setLoading(false);
        }
    };
    

    useEffect(() => {
        const interval = setInterval(() => {
            detectFace();
        }, 2000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div>
            <Typography variant="h5" gutterBottom>
                Face Auto Scan
            </Typography>
            <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                width={400}
            />
            {loading && <CircularProgress style={{ marginTop: '16px' }} />}
            {error && <Alert severity="error" style={{ marginTop: '16px' }}>{error}</Alert>}
            {result && (
                <Box style={{ marginTop: '16px' }}>
                    {result.match ? (
                        <Alert severity="success">
                            <Typography variant="h6">Welcome, {result.user.Name}!</Typography>
                            <Typography variant="body1">
                                <strong>ID:</strong> {result.user.ID}
                            </Typography>
                            <Typography variant="body1">
                                <strong>Role:</strong> {result.user.Role}
                            </Typography>
                            <Typography variant="body1">
                                <strong>Last Seen:</strong> {new Date(result.user.LastSeen).toLocaleString()}
                            </Typography>
                            <Typography variant="body1">
                                <strong>Similarity:</strong> {(result.similarity * 100).toFixed(2)}%
                            </Typography>
                        </Alert>
                    ) : (
                        <Alert severity="warning">{result.alert_message}</Alert>
                    )}
                </Box>
            )}
        </div>
    );
}

export default FaceAutoScan;
