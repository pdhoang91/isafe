// src/components/Header.jsx
import React from 'react';
import Link from 'next/link';
import { AppBar, Toolbar, Typography, Button } from '@mui/material';

function Header() {
    return (
        <AppBar position="static">
            <Toolbar>
                <Typography variant="h6" style={{ flexGrow: 1 }}>
                    iSafe Security
                </Typography>
                <Link href="/" passHref>
                    <Button color="inherit">Dashboard</Button>
                </Link>
                <Link href="/add-user" passHref>
                    <Button color="inherit">Add User</Button>
                </Link>
                <Link href="/manage-users" passHref>
                    <Button color="inherit">Manage Users</Button>
                </Link>
            </Toolbar>
        </AppBar>
    );
}

export default Header;
