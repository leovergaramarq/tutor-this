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

// https://stackoverflow.com/a/2901298/20250972
export function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
