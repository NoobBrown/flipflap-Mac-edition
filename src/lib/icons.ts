export interface IconGroup {
    label: string;
    icons: string[];
}

// Each string is a Tabler icon name (without the `ti-` prefix).
// Render as: <i class="ti ti-{name}">
export const ICON_GROUPS: IconGroup[] = [
    {
        label: 'Education',
        icons: [
            'book', 'book-2', 'school', 'writing', 'pencil', 'notebook',
            'notes', 'certificate', 'abc', 'vocabulary', 'text-size',
            'letter-case', 'highlight', 'underline',
        ],
    },
    {
        label: 'Science',
        icons: [
            'flask', 'dna', 'microscope', 'atom', 'test-pipe',
            'planet', 'virus', 'radioactive', 'wave-sine', 'augmented-reality',
            'prism', 'eyeglass',
        ],
    },
    {
        label: 'Technology',
        icons: [
            'code', 'device-laptop', 'cpu', 'terminal', 'keyboard',
            'database', 'wifi', 'cloud', 'circuit-board', 'binary-tree',
            'bug', 'api', 'brackets', 'braces',
        ],
    },
    {
        label: 'Math',
        icons: [
            'math', 'calculator', 'percentage', 'sigma', 'variable',
            'infinity', 'chart-bar', 'chart-line', 'function',
            'divide', 'plus', 'minus',
        ],
    },
    {
        label: 'Language',
        icons: [
            'language', 'message-circle', 'world', 'flag', 'speakerphone',
            'typography', 'alphabet-cyrillic', 'alphabet-greek',
            'quote', 'blockquote',
        ],
    },
    {
        label: 'Art & Music',
        icons: [
            'palette', 'music', 'photo', 'brush', 'headphones',
            'microphone', 'movie', 'color-filter', 'artboard',
            'guitar-pick', 'piano', 'vinyl',
        ],
    },
    {
        label: 'Health & Sports',
        icons: [
            'run', 'barbell', 'swimming', 'bike', 'ball-football',
            'yoga', 'stethoscope', 'heart-rate-monitor', 'dumbbell',
            'salad', 'apple',
        ],
    },
    {
        label: 'Travel & World',
        icons: [
            'plane', 'map', 'globe', 'compass', 'map-pin',
            'ship', 'car', 'train', 'backpack', 'tent',
            'mountain', 'beach',
        ],
    },
    {
        label: 'General',
        icons: [
            'star', 'flame', 'trophy', 'target', 'brain',
            'bulb', 'rocket', 'crown', 'diamond', 'leaf',
            'heart', 'clock', 'bolt', 'puzzle',
            'shield', 'anchor', 'key', 'lock',
        ],
    },
];

export const ALL_ICONS: string[] = ICON_GROUPS.flatMap((g) => g.icons);
