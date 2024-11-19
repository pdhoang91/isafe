// // src/pages/add-user.jsx
// import React, { useState } from 'react';
// import { addUser } from '../services/api';
// import { useRouter } from 'next/router';
// import Header from '../components/Header';
// import { Container, Typography, TextField, Button, Select, MenuItem, InputLabel, FormControl, Alert } from '@mui/material';

// function AddUser() {
//     const [name, setName] = useState('');
//     const [role, setRole] = useState('');
//     const [image, setImage] = useState(null);
//     const [error, setError] = useState(null);
//     const [success, setSuccess] = useState(false);
//     const router = useRouter();

//     const handleImageChange = (e) => {
//         if (e.target.files && e.target.files[0]) {
//             setImage(e.target.files[0]);
//         }
//     };

//     const handleSubmit = async (e) => {
//         e.preventDefault();
//         if (!image) {
//             setError('Please upload a face image.');
//             return;
//         }

//         // Convert image to base64
//         const reader = new FileReader();
//         reader.readAsDataURL(image);
//         reader.onloadend = () => {
//             const base64Image = reader.result.split(',')[1]; // Remove data prefix

//             const userData = { name, role, face_snapshot: base64Image };
//             addUser(userData)
//                 .then(response => {
//                     setSuccess(true);
//                     setError(null);
//                     router.push('/manage-users');
//                 })
//                 .catch(error => {
//                     setError('Failed to add user.');
//                     setSuccess(false);
//                 });
//         };
//     };

//     return (
//         <>
//             <Header />
//             <Container>
//                 <Typography variant="h4" gutterBottom>
//                     Add New User
//                 </Typography>
//                 <form onSubmit={handleSubmit}>
//                     <TextField
//                         label="Name"
//                         value={name}
//                         onChange={(e) => setName(e.target.value)}
//                         fullWidth
//                         margin="normal"
//                         required
//                     />
//                     <FormControl fullWidth margin="normal" required>
//                         <InputLabel>Role</InputLabel>
//                         <Select
//                             value={role}
//                             onChange={(e) => setRole(e.target.value)}
//                             label="Role"
//                         >
//                             <MenuItem value="student">Student</MenuItem>
//                             <MenuItem value="teacher">Teacher</MenuItem>
//                             <MenuItem value="visitor">Visitor</MenuItem>
//                         </Select>
//                     </FormControl>
//                     <Button
//                         variant="contained"
//                         component="label"
//                         style={{ marginTop: '16px' }}
//                     >
//                         Upload Face Image
//                         <input
//                             type="file"
//                             accept="image/*"
//                             hidden
//                             onChange={handleImageChange}
//                             required
//                         />
//                     </Button>
//                     {image && <Typography variant="body2">{image.name}</Typography>}
//                     {error && <Alert severity="error" style={{ marginTop: '16px' }}>{error}</Alert>}
//                     {success && <Alert severity="success" style={{ marginTop: '16px' }}>User added successfully!</Alert>}
//                     <Button type="submit" variant="contained" color="primary" style={{ marginTop: '16px' }}>
//                         Add User
//                     </Button>
//                 </form>
//             </Container>
//         </>
//     );
// }

// export default AddUser;


// src/pages/add-user.jsx

import React, { useState } from 'react';
import { addUser } from '../services/api';
import { useRouter } from 'next/router';
import Header from '../components/Header';
import { Container, Typography, TextField, Button, Select, MenuItem, InputLabel, FormControl, Alert } from '@mui/material';

function AddUser() {
    const [name, setName] = useState('');
    const [role, setRole] = useState('');
    const [image, setImage] = useState(null);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const router = useRouter();

    const handleImageChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setImage(e.target.files[0]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!image) {
            setError('Please upload a face image.');
            return;
        }

        // Convert image to base64
        const reader = new FileReader();
        reader.readAsDataURL(image);
        reader.onloadend = () => {
            const base64Image = reader.result.split(',')[1]; // Remove data prefix

            const userData = { name, role, face_snapshot: base64Image };
            addUser(userData)
                .then(response => {
                    setSuccess(true);
                    setError(null);
                    router.push('/manage-users');
                })
                .catch(error => {
                    setError('Failed to add user.');
                    setSuccess(false);
                });
        };
    };

    return (
        <>
            <Header />
            <Container>
                <Typography variant="h4" gutterBottom>
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
                    <Button
                        variant="contained"
                        component="label"
                        style={{ marginTop: '16px' }}
                    >
                        Upload Face Image
                        <input
                            type="file"
                            accept="image/*"
                            hidden
                            onChange={handleImageChange}
                            // Remove 'required' attribute
                        />
                    </Button>
                    {image && <Typography variant="body2">{image.name}</Typography>}
                    {error && <Alert severity="error" style={{ marginTop: '16px' }}>{error}</Alert>}
                    {success && <Alert severity="success" style={{ marginTop: '16px' }}>User added successfully!</Alert>}
                    <Button type="submit" variant="contained" color="primary" style={{ marginTop: '16px' }}>
                        Add User
                    </Button>
                </form>
            </Container>
        </>
    );
}

export default AddUser;
