export const DATA_FIELD = /* GraphQL */ `
    {
        id
        category {
            slug
        }
        version
        title
        url
        fullUrl
        # settings
        content
        snippet
        savedOn
        status
        locked
        publishedOn
        error
        notFound
        locked
        createdFrom
        createdOn
        createdBy {
            id
            displayName
        }
    }
`;

const LIST_DATA_FIELD = /* GraphQL */ `
    {
        id
        category {
            slug
        }
        status
        title
        url
        status
        locked
        publishedOn
        savedOn
        createdFrom
        createdOn
        createdBy {
            id
            displayName
        }
    }
`;

export const ERROR_FIELD = /* GraphQL */ `
    {
        code
        data
        message
    }
`;

export const CREATE_PAGE = /* GraphQL */ `
    mutation CreatePage($from: ID, $category: String) {
        pageBuilder {
            createPage(from: $from, category: $category) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const UPDATE_PAGE = /* GraphQL */ `
    mutation UpdatePage($id: ID!, $data: PbUpdatePageInput!) {
        pageBuilder {
            updatePage(id: $id, data: $data) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const PUBLISH_PAGE = /* GraphQL */ `
    mutation PublishPage($id: ID!) {
        pageBuilder {
            publishPage(id: $id) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const UNPUBLISH_PAGE = /* GraphQL */ `
    mutation UnpublishPage($id: ID!) {
        pageBuilder {
            unpublishPage(id: $id) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const REQUEST_REVIEW = /* GraphQL */ `
    mutation RequestReview($id: ID!) {
        pageBuilder {
            requestReview(id: $id) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const REQUEST_CHANGES = /* GraphQL */ `
    mutation RequestChanges($id: ID!) {
        pageBuilder {
            requestChanges(id: $id) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const LIST_PAGES = /* GraphQL */ `
    query ListPages($where: PbListPagesWhereInput, $limit: Int, $page: Int, $sort: PbListPagesSortInput) {
        pageBuilder {
            listPages(where: $where, limit: $limit, page: $page, sort: $sort) {
                data ${LIST_DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const LIST_PUBLISHED_PAGES = /* GraphQL */ `
    query ListPublishedPages($where: PbListPagesWhereInput, $limit: Int, $page: Int, $sort: PbListPagesSortInput) {
        pageBuilder {
            listPublishedPages(where: $where, limit: $limit, page: $page, sort: $sort) {
                data ${LIST_DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const GET_PAGE = /* GraphQL */ `
    query GetPage($id: ID!) {
        pageBuilder {
            getPage(id: $id) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const DELETE_PAGE = /* GraphQL */ `
    mutation DeletePage($id: ID!) {
        pageBuilder {
            deletePage(id: $id) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;
