const { readFileSync, writeFileSync } = require('node:fs');
const { dirname, join } = require('node:path');

// Draggable FlatList 4.0.3 still calls InteractionManager, removed in React Native 0.88.
const root = dirname(require.resolve('react-native-draggable-flatlist/package.json'));
const { version } = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
if (version !== '4.0.3') throw new Error('Recheck the SDK 58 compatibility patch for Draggable FlatList.');

const patches = [
  ['src/components/DraggableFlatList.tsx', '  InteractionManager,\n', 'InteractionManager.runAfterInteractions('],
  [
    'lib/module/components/DraggableFlatList.js',
    'import { InteractionManager } from "react-native";\n',
    'InteractionManager.runAfterInteractions(',
  ],
  ['lib/commonjs/components/DraggableFlatList.js', '', '_reactNative.InteractionManager.runAfterInteractions('],
];

const updates = patches.map(([relativePath, importText, call]) => {
  const path = join(root, relativePath);
  const source = readFileSync(path, 'utf8');
  if (!source.includes('InteractionManager') && source.includes('requestIdleCallback(')) return null;
  if (source.split(call).length !== 2 || (importText && !source.includes(importText))) {
    throw new Error(`Unexpected Draggable FlatList source: ${relativePath}`);
  }
  const withoutImport = importText ? source.replace(importText, '') : source;
  return { path, source: withoutImport.replace(call, 'requestIdleCallback(') };
});

for (const update of updates) {
  if (update) writeFileSync(update.path, update.source);
}
