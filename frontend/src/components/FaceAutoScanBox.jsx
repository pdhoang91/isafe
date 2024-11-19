import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import { nets, detectAllFaces, TinyFaceDetectorOptions, draw } from 'face-api.js';
import { Typography, CircularProgress, Alert, Box } from '@mui/material';
import { verifyFace } from '../services/api';

function FaceAutoScanBox() {
    const webcamRef = useRef(null);
    const canvasRef = useRef(null);
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

                // Clear canvas before drawing
                const canvas = canvasRef.current;
                const context = canvas.getContext('2d');
                context.clearRect(0, 0, canvas.width, canvas.height);

                if (detections.length > 0) {
                    console.log('Face detected:', detections);

                    // Adjust canvas size
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;

                    // Draw detections on canvas
                    draw.drawDetections(canvas, detections);

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
    
        try {
            // Convert base64 image to Blob
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
    
            console.log('Sending image to verifyFace API...');
            const response = await verifyFace(blob); // Gọi hàm verifyFace với Blob
            console.log('API Response:', response.data);
    
            const { match, user, similarity, AlertMessage } = response.data;
    
            if (match) {
                setResult({
                    match,
                    user,
                    similarity,
                });
                console.log('User recognized:', user);
            } else {
                setResult({
                    match: false,
                    alertMessage: AlertMessage || 'Face not recognized.',
                });
                console.log('Face not recognized:', AlertMessage);
            }
        } catch (err) {
            console.error('Error verifying face:', err);
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
            <div style={{ position: 'relative', width: '400px' }}>
                <Webcam
                    ref={webcamRef}
                    audio={false}
                    screenshotFormat="image/jpeg"
                    width={400}
                    videoConstraints={{
                        width: 640,
                        height: 480,
                        facingMode: 'user',
                    }}
                />
                <canvas
                    ref={canvasRef}
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        zIndex: 9,
                        width: '400px',
                        height: '300px',
                    }}
                />
            </div>
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

export default FaceAutoScanBox;
