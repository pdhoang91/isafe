// src/pages/edit-user/[id].jsx
import React, { useEffect, useState } from 'react';
import { getUserById, updateUser } from '../../services/api';
import { useRouter } from 'next/router';
import Header from '../../components/Header';
import { Container, Typography, TextField, Button, Select, MenuItem, InputLabel, FormControl, Alert } from '@mui/material';

function EditUser() {
    const router = useRouter();
    const { id } = router.query;
    const [name, setName] = useState('');
    const [role, setRole] = useState('');
    const [image, setImage] = useState(null);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (id) {
            getUserById(id)
                .then(response => {
                    const user = response.data;
                    setName(user.name);
                    setRole(user.role);
                    // Nếu cần, xử lý face_snapshot
                })
                .catch(error => {
                    setError('Failed to fetch user data.');
                });
        }
    }, [id]);

    const handleImageChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setImage(e.target.files[0]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Convert image to base64 nếu có thay đổi
        let base64Image = null;
        if (image) {
            const reader = new FileReader();
            reader.readAsDataURL(image);
            await new Promise(resolve => {
                reader.onloadend = () => {
                    base64Image = reader.result.split(',')[1]; // Remove data prefix
                    resolve();
                };
            });
        }

        const userData = { name, role };
        if (base64Image) {
            userData.face_snapshot = base64Image;
        }

        updateUser(id, userData)
            .then(response => {
                setSuccess(true);
                setError(null);
                router.push('/manage-users');
            })
            .catch(error => {
                setError('Failed to update user.');
                setSuccess(false);
            });
    };

    return (
        <>
            <Header />
            <Container>
                <Typography variant="h4" gutterBottom>
                    Edit User
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
                    <Button
                        variant="contained"
                        component="label"
                        style={{ marginTop: '16px' }}
                    >
                        Upload New Face Image
                        <input
                            type="file"
                            accept="image/*"
                            hidden
                            onChange={handleImageChange}
                        />
                    </Button>
                    {image && <Typography variant="body2">{image.name}</Typography>}
                    {error && <Alert severity="error" style={{ marginTop: '16px' }}>{error}</Alert>}
                    {success && <Alert severity="success" style={{ marginTop: '16px' }}>User updated successfully!</Alert>}
                    <Button type="submit" variant="contained" color="primary" style={{ marginTop: '16px' }}>
                        Update User
                    </Button>
                </form>
            </Container>
        </>
    );
}

export default EditUser;
