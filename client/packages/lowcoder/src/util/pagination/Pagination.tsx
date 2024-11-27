import styled from "styled-components";
import { Pagination } from "antd";

const PaginationLayout = styled(Pagination)`
    display: flex;
    justify-content: center;
    margin-top: 40px;
    margin-bottom: 20px;
`;

interface PaginationCompProps {
    setCurrentPage: (page: number) => void;
    setPageSize: (size: number) => void;
    currentPage: number;
    pageSize: number;
    total: number;
}

const PaginationComp = (props: PaginationCompProps) => {
    const {
        setCurrentPage,
        setPageSize,
        currentPage,
        pageSize,
        total,
    } = props;

    const handlePageChange = (page: number, pageSize: number | undefined) => {
        if (setCurrentPage) {
            setCurrentPage(page);
        }
    };

    const handlePageSizeChange = (current: number, size: number) => {
        if (setPageSize) {
            setPageSize(size);
        }
    };

    return (
        <PaginationLayout
            current={currentPage}
            pageSize={pageSize}
            onChange={handlePageChange}
            onShowSizeChange={handlePageSizeChange}
            total={total}
            showSizeChanger
        />
    );
};

export default PaginationComp;