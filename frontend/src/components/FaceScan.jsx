// // src/components/FaceScan.jsx

// import React, { useRef, useState } from 'react';
// import { Button, Typography, CircularProgress, Alert } from '@mui/material';
// import Webcam from 'react-webcam';
// import { verifyFace } from '../services/api';

// function FaceScan() {
//     const webcamRef = useRef(null);
//     const [loading, setLoading] = useState(false);
//     const [result, setResult] = useState(null);
//     const [error, setError] = useState(null);

//     // const capture = async () => {
//     //     const imageSrc = webcamRef.current.getScreenshot();
//     //     if (!imageSrc) {
//     //         setError('Failed to capture image.');
//     //         return;
//     //     }

//     //     // Chuyển base64 thành Blob
//     //     const res = await fetch(imageSrc);
//     //     const blob = await res.blob();

//     //     const formData = new FormData();
//     //     formData.append('image', blob, 'capture.jpg');

//     //     setLoading(true);
//     //     setError(null);
//     //     setResult(null);

//     //     try {
//     //         const response = await fetch('http://localhost:5001/process_image', {
//     //             method: 'POST',
//     //             body: formData,
//     //         });

//     //         const data = await response.json();
//     //         if (data.error) {
//     //             setError(data.error);
//     //             setLoading(false);
//     //             return;
//     //         }

//     //         const embedding = data.embedding;
//     //         // Gọi API verify_face
//     //         const verifyResponse = await verifyFace(embedding);
//     //         setResult(verifyResponse.data);
//     //     } catch (err) {
//     //         setError('Error during face recognition.');
//     //     } finally {
//     //         setLoading(false);
//     //     }
//     // };

//     const capture = async () => {
//         const imageSrc = webcamRef.current.getScreenshot();
//         if (!imageSrc) {
//             setError('Failed to capture image.');
//             return;
//         }
    
//         // Chuyển base64 thành Blob
//         const byteString = atob(imageSrc.split(',')[1]);
//         const mimeString = imageSrc.split(',')[0].split(':')[1].split(';')[0];
//         const arrayBuffer = new Uint8Array(byteString.length);
    
//         for (let i = 0; i < byteString.length; i++) {
//             arrayBuffer[i] = byteString.charCodeAt(i);
//         }
    
//         const blob = new Blob([arrayBuffer], { type: mimeString });
    
//         // Gửi file qua API verifyFace
//         setLoading(true);
//         setError(null);
//         setResult(null);
    
//         try {
//             const response = await verifyFace(blob); // Gọi API verifyFace từ services/api.js
//             setResult(response.data);
//         } catch (err) {
//             setError('Error during face recognition.');
//         } finally {
//             setLoading(false);
//         }
//     };
    

//     return (
//         <div>
//             <Typography variant="h5" gutterBottom>
//                 Face Scan
//             </Typography>
//             <Webcam
//                 audio={false}
//                 ref={webcamRef}
//                 screenshotFormat="image/jpeg"
//                 width={400}
//             />
//             <div style={{ marginTop: '16px' }}>
//                 <Button variant="contained" color="primary" onClick={capture}>
//                     Capture & Verify
//                 </Button>
//             </div>
//             {loading && <CircularProgress style={{ marginTop: '16px' }} />}
//             {error && <Alert severity="error" style={{ marginTop: '16px' }}>{error}</Alert>}
//             {result && (
//                 <Alert severity={result.Match ? "success" : "warning"} style={{ marginTop: '16px' }}>
//                     {result.Match ? `Welcome, ${result.User.name}! Similarity: ${result.Similarity}` : result.AlertMessage}
//                 </Alert>
//             )}
//         </div>
//     );
// }

// export default FaceScan;
// src/components/FaceScan.jsx

// src/components/FaceScan.jsx

import React, { useRef, useState } from 'react';
import { Button, Typography, CircularProgress, Alert, Box, TextField } from '@mui/material';
import Webcam from 'react-webcam';
import { verifyFace } from '../services/api';

function FaceScan() {
    const webcamRef = useRef(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);

    const handleCapture = async () => {
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

        await handleVerify(blob);
    };

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setSelectedFile(file);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            setError('Please select an image to upload.');
            return;
        }
        await handleVerify(selectedFile);
    };

    const handleVerify = async (file) => {
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const response = await verifyFace(file); // Call verifyFace API
            setResult(response.data);
        } catch (err) {
            setError('Error during face recognition.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <Typography variant="h5" gutterBottom>
                Face Scan
            </Typography>
            <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                width={400}
            />
            <div style={{ marginTop: '16px' }}>
                <Button variant="contained" color="primary" onClick={handleCapture} style={{ marginRight: '8px' }}>
                    Capture & Verify
                </Button>
                <TextField
                    type="file"
                    inputProps={{ accept: 'image/*' }}
                    onChange={handleFileChange}
                    style={{ display: 'inline-block', marginRight: '8px' }}
                />
                <Button variant="contained" color="secondary" onClick={handleUpload}>
                    Upload & Verify
                </Button>
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

export default FaceScan;

