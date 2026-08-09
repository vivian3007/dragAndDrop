import React from 'react';
import { Dialog, IconButton } from '@mui/material';
import { Close } from '@mui/icons-material';

const AppDialog = ({
    open,
    onClose,
    maxWidth = 'lg',
    children,
}: {
    open: boolean;
    onClose: () => void;
    maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    children: React.ReactNode;
}) => {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth={maxWidth}
            fullWidth
            PaperProps={{ sx: { borderRadius: '24px', overflow: 'hidden' } }}
        >
            <IconButton
                onClick={onClose}
                sx={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    zIndex: 1,
                    backgroundColor: 'rgba(250, 246, 239, 0.85)',
                    color: 'var(--color-text)',
                    '&:hover': { backgroundColor: 'var(--color-accent-soft-hover)' },
                }}
            >
                <Close />
            </IconButton>
            {children}
        </Dialog>
    );
};

export default AppDialog;
