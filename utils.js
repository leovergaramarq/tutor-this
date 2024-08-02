export function hasAncestor(element, ancestor, stopNode) {
    if (element === ancestor) return true;

    while (
        (stopNode === undefined || element !== stopNode) &&
        (element = element.parentElement) !== null
    ) {
        if (element === ancestor) return true;
    }
    return false;
}
