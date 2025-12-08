// Utility function to calculate optimal grid columns for responsive layout
// Ensures all items fit on screen without cutoff
export const getGridColumns = (count) => {
    if (count === 0) return '1fr';
    if (count === 1) return '1fr';
    if (count === 2) return 'repeat(2, 1fr)';
    if (count === 3) return 'repeat(3, 1fr)';
    if (count === 4) return 'repeat(2, 1fr)'; // 2x2
    if (count === 5) return 'repeat(3, 1fr)'; // 3x2 (with one empty cell)
    if (count === 6) return 'repeat(3, 1fr)'; // 3x2
    if (count >= 7 && count <= 9) return 'repeat(3, 1fr)'; // 3x3
    return 'repeat(4, 1fr)'; // For 10+, use 4 columns
};
