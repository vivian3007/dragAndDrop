import React from 'react';
import { Box, Pagination } from '@mui/material';

export const PAGE_SIZE = 24;

const PatternPagination = ({
    page,
    totalPages,
    onPageChange,
}: {
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}) => {
    if (totalPages <= 1) {
        return null;
    }

    return (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <Pagination
                count={totalPages}
                page={page}
                onChange={(_, value) => onPageChange(value)}
                shape="rounded"
                color="standard"
            />
        </Box>
    );
};

export default PatternPagination;
