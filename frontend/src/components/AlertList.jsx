// // src/components/AlertList.jsx
// import React from 'react';
// import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Avatar } from '@mui/material';

// function AlertList({ alerts }) {
//     if (!alerts) {
//         return <div>No alerts available.</div>;
//     }

//     return (
//         <TableContainer component={Paper}>
//             <Table>
//                 <TableHead>
//                     <TableRow>
//                         <TableCell>ID</TableCell>
//                         <TableCell>Snapshot</TableCell>
//                         <TableCell>Timestamp</TableCell>
//                         <TableCell>Status</TableCell>
//                     </TableRow>
//                 </TableHead>
//                 <TableBody>
//                     {alerts.map(alert => (
//                         <TableRow key={alert.alert_id}>
//                             <TableCell>{alert.alert_id}</TableCell>
//                             <TableCell>
//                                 <Avatar
//                                     src={`data:image/jpeg;base64,${Buffer.from(alert.face_snapshot).toString('base64')}`}
//                                     variant="square"
//                                     alt="Snapshot"
//                                     sx={{ width: 56, height: 56 }}
//                                 />
//                             </TableCell>
//                             <TableCell>{new Date(alert.timestamp).toLocaleString()}</TableCell>
//                             <TableCell>{alert.status}</TableCell>
//                         </TableRow>
//                     ))}
//                 </TableBody>
//             </Table>
//         </TableContainer>
//     );
// }

// export default AlertList;

// src/components/AlertList.jsx
import React from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Avatar } from '@mui/material';

function AlertList({ alerts }) {
    if (!alerts || alerts.length === 0) {
        return <div>No alerts available.</div>;
    }

    return (
        <TableContainer component={Paper}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>ID</TableCell>
                        <TableCell>Snapshot</TableCell>
                        <TableCell>Timestamp</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Similarity</TableCell>
                        <TableCell>Message</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {alerts.map(alert => (
                        <TableRow key={alert.id}>
                            <TableCell>{alert.id}</TableCell>
                            <TableCell>
                                {alert.face_snapshot ? (
                                    <Avatar
                                        src={`data:image/jpeg;base64,${alert.face_snapshot}`}
                                        variant="square"
                                        alt="Snapshot"
                                        sx={{ width: 56, height: 56 }}
                                    />
                                ) : (
                                    "No Snapshot"
                                )}
                            </TableCell>
                            <TableCell>{new Date(alert.timestamp).toLocaleString()}</TableCell>
                            <TableCell>{alert.status}</TableCell>
                            <TableCell>{alert.similarity.toFixed(2)}</TableCell>
                            <TableCell>{alert.alert_message}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
}

export default AlertList;
