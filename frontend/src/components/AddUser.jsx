import React, { useState } from 'react';
import { addUser } from '../services/api';
import Webcam from 'react-webcam';
import { TextField, Button, Select, MenuItem, FormControl, InputLabel, Alert, CircularProgress, Typography } from '@mui/material';

function AddUser({ onUserAdded }) {
    const [name, setName] = useState('');
    const [role, setRole] = useState('');
    const [image, setImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const webcamRef = React.useRef(null);

    const handleImageChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setImage(e.target.files[0]);
        }
    };

    const handleCapture = () => {
        const imageSrc = webcamRef.current.getScreenshot();
        if (!imageSrc) {
            setError('Failed to capture image.');
            return;
        }

        // Chuyển đổi ảnh chụp thành Blob
        const byteString = atob(imageSrc.split(',')[1]);
        const mimeString = imageSrc.split(',')[0].split(':')[1].split(';')[0];
        const arrayBuffer = new Uint8Array(byteString.length);
        for (let i = 0; i < byteString.length; i++) {
            arrayBuffer[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([arrayBuffer], { type: mimeString });
        setImage(blob);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name || !role) {
            setError('Please fill in name and role.');
            return;
        }

        if (!image) {
            setError('Please upload or capture an image.');
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(false);

        // Convert image to base64
        const reader = new FileReader();
        reader.readAsDataURL(image);
        reader.onloadend = () => {
            const base64Image = reader.result.split(',')[1]; // Remove prefix
            const userData = { name, role, face_snapshot: base64Image };

            addUser(userData)
                .then(() => {
                    setSuccess(true);
                    setError(null);
                    onUserAdded(); // Refresh user list
                })
                .catch(() => {
                    setError('Failed to add user.');
                })
                .finally(() => {
                    setLoading(false);
                });
        };
    };

    return (
        <div style={{ marginBottom: '16px' }}>
            <Typography variant="h5" gutterBottom>
                Add New User
            </Typography>
            <form onSubmit={handleSubmit}>
                <TextField
                    label="Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    fullWidth
                    margin="normal"
                    required
                />
                <FormControl fullWidth margin="normal" required>
                    <InputLabel>Role</InputLabel>
                    <Select
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        label="Role"
                    >
                        <MenuItem value="student">Student</MenuItem>
                        <MenuItem value="teacher">Teacher</MenuItem>
                        <MenuItem value="visitor">Visitor</MenuItem>
                    </Select>
                </FormControl>
                <div style={{ marginTop: '16px' }}>
                    <Button variant="contained" component="label" style={{ marginRight: '8px' }}>
                        Upload Image
                        <input type="file" accept="image/*" hidden onChange={handleImageChange} />
                    </Button>
                    <Button variant="contained" color="primary" onClick={handleCapture}>
                        Capture Image
                    </Button>
                </div>
                <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    width={300}
                    style={{ marginTop: '16px' }}
                />
                {image && <Typography variant="body2" style={{ marginTop: '8px' }}>{image.name || 'Captured Image'}</Typography>}
                {loading && <CircularProgress style={{ marginTop: '16px' }} />}
                {error && <Alert severity="error" style={{ marginTop: '16px' }}>{error}</Alert>}
                {success && <Alert severity="success" style={{ marginTop: '16px' }}>User added successfully!</Alert>}
                <Button type="submit" variant="contained" color="primary" style={{ marginTop: '16px' }}>
                    Upload & Verify
                </Button>
            </form>
        </div>
    );
}

export default AddUser;
