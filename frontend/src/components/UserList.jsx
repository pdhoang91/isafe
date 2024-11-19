// // src/components/UserList.jsx
// import React from 'react';
// import Link from 'next/link';
// import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button } from '@mui/material';
// import EditIcon from '@mui/icons-material/Edit';

// function UserList({ users }) {
//     if (!users || users.length === 0) {
//         return <div>No users available.</div>;
//     }

//     return (
//         <TableContainer component={Paper}>
//             <Table>
//                 <TableHead>
//                     <TableRow>
//                         <TableCell>ID</TableCell>
//                         <TableCell>Name</TableCell>
//                         <TableCell>Role</TableCell>
//                         <TableCell>Last Seen</TableCell>
//                         <TableCell>Actions</TableCell>
//                     </TableRow>
//                 </TableHead>
//                 <TableBody>
//                     {users.map(user => {
//                         // Kiểm tra nếu user.ID tồn tại
//                         const uniqueKey = user.ID || user.id;
//                         if (!uniqueKey) {
//                             console.warn('User does not have a unique ID:', user);
//                         }
//                         return (
//                             <TableRow key={uniqueKey}>
//                                 <TableCell>{uniqueKey}</TableCell>
//                                 <TableCell>{user.Name || user.name}</TableCell>
//                                 <TableCell>{user.Role || user.role}</TableCell>
//                                 <TableCell>{new Date(user.LastSeen || user.last_seen).toLocaleString()}</TableCell>
//                                 <TableCell>
//                                     <Button
//                                         variant="outlined"
//                                         color="primary"
//                                         size="small"
//                                         startIcon={<EditIcon />}
//                                         component={Link}
//                                         href={`/edit-user/${uniqueKey}`}
//                                     >
//                                         Edit
//                                     </Button>
//                                     {/* Thêm các nút hành động khác nếu cần */}
//                                 </TableCell>
//                             </TableRow>
//                         );
//                     })}
//                 </TableBody>
//             </Table>
//         </TableContainer>
//     );
// }


import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Avatar, CircularProgress } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { getUserSnapshots } from '../services/api';

function UserList({ users }) {
    const [snapshots, setSnapshots] = useState({});
    const [loadingSnapshots, setLoadingSnapshots] = useState(false);

    useEffect(() => {
        const fetchSnapshots = async () => {
            setLoadingSnapshots(true);
            const snapshotsData = {};
            for (const user of users) {
                try {
                    const response = await getUserSnapshots(user.ID || user.id);
                    snapshotsData[user.ID || user.id] = response.data.snapshots || [];
                } catch (error) {
                    console.error(`Failed to fetch snapshots for user ${user.ID || user.id}:`, error);
                }
            }
            setSnapshots(snapshotsData);
            setLoadingSnapshots(false);
        };

        if (users && users.length > 0) {
            fetchSnapshots();
        }
    }, [users]);

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
                        <TableCell>Snapshots</TableCell>
                        <TableCell>Actions</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {users.map((user, index) => {
                        const uniqueKey = user.ID || user.id || `user-${index}`;
                        const userSnapshots = snapshots[user.ID || user.id] || [];

                        return (
                            <TableRow key={uniqueKey}>
                                <TableCell>{user.ID || user.id}</TableCell>
                                <TableCell>{user.Name || user.name}</TableCell>
                                <TableCell>{user.Role || user.role}</TableCell>
                                <TableCell>{new Date(user.LastSeen || user.last_seen).toLocaleString()}</TableCell>
                                <TableCell>
                                    {loadingSnapshots ? (
                                        <CircularProgress size={24} />
                                    ) : userSnapshots.length > 0 ? (
                                        userSnapshots.map((snapshot, index) => (
                                            <Avatar
                                                key={index}
                                                src={`data:image/jpeg;base64,${snapshot}`}
                                                alt={`Snapshot ${index}`}
                                                sx={{ width: 48, height: 48, margin: '4px' }}
                                            />
                                        ))
                                    ) : (
                                        'No snapshots'
                                    )}
                                </TableCell>
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
