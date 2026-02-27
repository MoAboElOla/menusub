export function shouldAutosave(items, saved) {
    if (saved || !Array.isArray(items) || items.length === 0) return false;
    return items.some((item) => ((item?.item_name_en || '').trim() || (item?.item_name_ar || '').trim()));
}
