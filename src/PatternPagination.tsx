import React from 'react';
import { Box, Pagination } from '@mui/material';
import { useT } from './i18n/LanguageProvider';

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
    const t = useT();

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
                getItemAriaLabel={(type, itemPage) => {
                    if (type === 'page') return t('pagination.page', { page: itemPage ?? 0 });
                    return t(type === 'previous' ? 'pagination.previous' : type === 'next' ? 'pagination.next' : type === 'first' ? 'pagination.first' : 'pagination.last');
                }}
                sx={{
                    '& .MuiPaginationItem-root': { color: 'var(--color-text)' },
                    '& .Mui-selected': {
                        backgroundColor: 'var(--color-primary) !important',
                        color: 'white',
                    },
                }}
            />
        </Box>
    );
};

export default PatternPagination;
