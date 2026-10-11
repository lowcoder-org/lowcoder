import styled from "styled-components";
import { Pagination } from "antd";

interface PaginationLayoutProps {
    height?: number;
    marginTop?: number;
    marginBottom?: number;
}

const PaginationLayout = styled(Pagination)<PaginationLayoutProps>`
    display: flex;
    justify-content: center;
    align-items: center;
    margin-top: ${(props) => props.marginTop !== undefined ? props.marginTop : 40}px !important;
    margin-bottom: ${(props) => props.marginBottom !== undefined ? props.marginBottom : 20}px !important;
    height: ${(props) => props.height}px;
`;

interface PaginationCompProps {
    setCurrentPage: (page: number) => void;
    setPageSize: (size: number) => void;
    currentPage: number;
    pageSize: number;
    total: number;
    height?: number;
    marginTop?: number;
    marginBottom?: number;
    simple?: boolean;
}

const PaginationComp = (props: PaginationCompProps) => {
    const {
        setCurrentPage,
        setPageSize,
        currentPage,
        pageSize,
        total,
        height,
        marginTop,
        marginBottom,
        simple,
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
        <>
        {simple ?
            <PaginationLayout
                height={height}
                marginTop={marginTop}
                marginBottom={marginBottom}
                current={currentPage}
                pageSize={pageSize}
                onChange={handlePageChange}
                onShowSizeChange={handlePageSizeChange}
                total={total}
                simple
            /> :
            <PaginationLayout
                height={height}
                marginTop={marginTop}
                marginBottom={marginBottom}
                current={currentPage}
                pageSize={pageSize}
                onChange={handlePageChange}
                onShowSizeChange={handlePageSizeChange}
                total={total}
                showSizeChanger
            />
        }
            </>
    );
};

export default PaginationComp;