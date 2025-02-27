
export function navigationHistorySample() {
    return {
        "navigation-path": [
            {
                "label": "Select",
                "url": "http://localhost:5678/webhook/bxKkwMfFdXNReTjV/webhook/27f68323-c314-4adf-a88f-aad037af08ee"
            },
            {
                "label": "Validate SOFT",
                "url": "http://localhost:5678/webhook/lY7jAmzUeQgizzH6/webhook/27f68323-c314-4adf-a88f-aad037af08ee"
            }
        ]
    }
}

export function newItemSample() {
    return {
        "label": "One step",
        "url": "http://localhost:5678/webhook/bxKkwMfFdXNReTjW/webhook/27f68323-c314-4adf-a88f-aad037af08ee"
    }
}

export function selectItemSample() {
    return {
        "label": "Validate SOFT",
        "url": "http://localhost:5678/webhook/lY7jAmzUeQgizzH6/webhook/27f68323-c314-4adf-a88f-aad037af08ee"
    }
}


export function addPathItem(navigation_chain, new_item) {
    // TODO implement
    // the navigation path is appended a new element
}

export function selectPathItem(navigation_chain, new_item) {
    // TODO implement:
    // precondition addPathItem(newItemSample()) called
    // use as follows selectPathItem(selectItemSample()) is called
    // the navigation path is cut so that the navigationHistorySample remains
}