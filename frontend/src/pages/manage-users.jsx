// src/pages/manage-users.jsx
import React, { useEffect, useState } from 'react';
import { getUsers } from '../services/api';
import UserList from '../components/UserList';
import Header from '../components/Header';
import { Container, Typography, CircularProgress, Alert, Button } from '@mui/material';
import Link from 'next/link';

function ManageUsers() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        getUsers()
            .then(response => {
                setUsers(response.data);
                setLoading(false);
            })
            .catch(error => {
                setError('Error fetching users.');
                setLoading(false);
            });
    }, []);

    return (
        <>
            <Header />
            <Container>
                <Typography variant="h4" gutterBottom>
                    Manage Users
                </Typography>
                <Button
                    variant="contained"
                    color="primary"
                    component={Link}
                    href="/add-user"
                    style={{ marginBottom: '16px' }}
                >
                    Add New User
                </Button>
                {loading && <CircularProgress />}
                {error && <Alert severity="error">{error}</Alert>}
                {!loading && !error && <UserList users={users} />}
            </Container>
        </>
    );
}

export default ManageUsers;
