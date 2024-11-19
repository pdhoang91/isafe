import React, { useEffect, useState } from 'react';
import { getUsers } from '../services/api';
import UserList from '../components/UserList';
import AddUser from '../components/AddUser';
import Header from '../components/Header';
import { Container, Typography, CircularProgress, Alert } from '@mui/material';

function ManageUsers() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchUsers = () => {
        setLoading(true);
        getUsers()
            .then((response) => {
                setUsers(response.data);
                setLoading(false);
            })
            .catch(() => {
                setError('Error fetching users.');
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    return (
        <>
            <Header />
            <Container>
                <Typography variant="h4" gutterBottom>
                    Manage Users
                </Typography>
                <AddUser onUserAdded={fetchUsers} />
                {loading && <CircularProgress />}
                {error && <Alert severity="error">{error}</Alert>}
                {!loading && !error && <UserList users={users} />}
            </Container>
        </>
    );
}

export default ManageUsers;
