// src/components/UserList.jsx
import React from 'react';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';

function UserList({ users }) {
    if (!users || users.length === 0) {
        return <div>No users available.</div>;
    }

    return (
        <TableContainer component={Paper}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>ID</TableCell>
                        <TableCell>Name</TableCell>
                        <TableCell>Role</TableCell>
                        <TableCell>Last Seen</TableCell>
                        <TableCell>Actions</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {users.map(user => {
                        // Kiểm tra nếu user.ID tồn tại
                        const uniqueKey = user.ID || user.id;
                        if (!uniqueKey) {
                            console.warn('User does not have a unique ID:', user);
                        }
                        return (
                            <TableRow key={uniqueKey}>
                                <TableCell>{uniqueKey}</TableCell>
                                <TableCell>{user.Name || user.name}</TableCell>
                                <TableCell>{user.Role || user.role}</TableCell>
                                <TableCell>{new Date(user.LastSeen || user.last_seen).toLocaleString()}</TableCell>
                                <TableCell>
                                    <Button
                                        variant="outlined"
                                        color="primary"
                                        size="small"
                                        startIcon={<EditIcon />}
                                        component={Link}
                                        href={`/edit-user/${uniqueKey}`}
                                    >
                                        Edit
                                    </Button>
                                    {/* Thêm các nút hành động khác nếu cần */}
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </TableContainer>
        
    );
}

export default UserList;
