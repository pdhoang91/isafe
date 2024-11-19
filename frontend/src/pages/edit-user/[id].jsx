import React, { useEffect, useState } from 'react';
import { getUserById, updateUser, getUserSnapshots } from '../../services/api';
import { useRouter } from 'next/router';
import Header from '../../components/Header';
import { Container, Typography, TextField, Button, Select, MenuItem, InputLabel, FormControl, Alert, Avatar, CircularProgress } from '@mui/material';

function EditUser() {
    const router = useRouter();
    const { id } = router.query;
    const [name, setName] = useState('');
    const [role, setRole] = useState('');
    const [image, setImage] = useState(null); // Ảnh mới upload
    const [currentSnapshot, setCurrentSnapshot] = useState(null); // Ảnh snapshot hiện tại
    const [snapshots, setSnapshots] = useState([]);
    const [loadingUser, setLoadingUser] = useState(false);
    const [loadingSnapshots, setLoadingSnapshots] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (id) {
            // Lấy thông tin người dùng
            setLoadingUser(true);
            getUserById(id)
            .then((response) => {
                const user = response.data;
                console.log("Fetched user:", user);
        
                setName(user.Name || ''); // Đảm bảo giá trị mặc định
                setRole(user.Role || ''); // Đảm bảo giá trị mặc định
                setCurrentSnapshot(user.face_snapshot || null); // Gán snapshot nếu có
                setLoadingUser(false);
            })
            .catch((err) => {
                console.error("Error fetching user:", err);
                setError('Failed to fetch user data.');
                setLoadingUser(false);
            });
        
    
            // Lấy danh sách snapshots
            setLoadingSnapshots(true);
            getUserSnapshots(id)
                .then((response) => {
                    const snapshotsData = response.data.snapshots || [];
                    setSnapshots(snapshotsData);
                    setLoadingSnapshots(false);
                })
                .catch(() => {
                    setError('Failed to fetch user snapshots.');
                    setLoadingSnapshots(false);
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
            await new Promise((resolve) => {
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
            .then(() => {
                setSuccess(true);
                setError(null);
                router.push('/manage-users');
            })
            .catch(() => {
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
                    {loadingUser ? (
                        <CircularProgress />
                    ) : (
                        <>
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
                                    value={role || ''} // Đảm bảo giá trị không phải là undefined
                                    onChange={(e) => setRole(e.target.value)}
                                    label="Role"
                                >
                                    <MenuItem value="student">Student</MenuItem>
                                    <MenuItem value="teacher">Teacher</MenuItem>
                                    <MenuItem value="visitor">Visitor</MenuItem>
                                </Select>
                            </FormControl>

                            <div style={{ marginBottom: '16px' }}>
                                {currentSnapshot && (
                                    <Avatar
                                        src={`data:image/jpeg;base64,${currentSnapshot}`}
                                        alt="Current Snapshot"
                                        sx={{ width: 128, height: 128, marginBottom: '16px' }}
                                    />
                                )}
                                <Button
                                    variant="contained"
                                    component="label"
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
                            </div>
                            <Button type="submit" variant="contained" color="primary">
                                Update User
                            </Button>
                        </>
                    )}
                </form>
                <Typography variant="h6" gutterBottom style={{ marginTop: '24px' }}>
                    Snapshots
                </Typography>
                {loadingSnapshots ? (
                    <CircularProgress />
                ) : snapshots.length > 0 ? (
                    snapshots.map((snapshot, index) => (
                        <Avatar
                            key={index}
                            src={`data:image/jpeg;base64,${snapshot}`}
                            alt={`Snapshot ${index}`}
                            sx={{ width: 56, height: 56, margin: '4px' }}
                        />
                    ))
                ) : (
                    <Typography>No snapshots available.</Typography>
                )}
            </Container>
        </>
    );
}

export default EditUser;
