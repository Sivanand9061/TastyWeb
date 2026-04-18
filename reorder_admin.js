const fs = require('fs');

const path = 'c:\\Users\\sivan\\Downloads\\TastyWeb\\src\\imports\\Admin\\AdminAddItems.tsx';
let source = fs.readFileSync(path, 'utf8');

// The layout replacement:
// Find `<div className="max-w-2xl mx-auto space-y-10">`
source = source.replace('<div className="max-w-2xl mx-auto space-y-10">', `<div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ── LEFT COLUMN ── */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-8">`);

// Find the MANAGE ITEMS section
const manageItemsStartMarker = '{/* ── MANAGE ITEMS ── */}';
const bottomPaddingMarker = '{/* Bottom padding */}';

const manageItemsStartIndex = source.indexOf(manageItemsStartMarker);
const manageItemsEndIndex = source.indexOf(bottomPaddingMarker);

const manageItemsBlock = source.substring(manageItemsStartIndex, manageItemsEndIndex).trim();

// Remove Manage items from the bottom:
source = source.substring(0, manageItemsStartIndex) + source.substring(manageItemsEndIndex);

// Add the closing of left column, opening of right column, and MANAGE ITEMS before CATEGORIES
const categoriesMarker = '{/* ── CATEGORIES ── */}';
const injectionStr = `
        ${manageItemsBlock}

        </div>

        {/* ── RIGHT COLUMN ── */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-8">

        ${categoriesMarker}`;

source = source.replace(categoriesMarker, injectionStr);

// Close right column before Bottom padding
source = source.replace('{/* Bottom padding */}', `</div>\n\n        {/* Bottom padding */}`);

fs.writeFileSync(path, source, 'utf8');
console.log("Successfully rebuilt Admin layout");
