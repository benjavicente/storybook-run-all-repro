// Extracted from Storybook v10.6.5 public source; see SOURCE.json and LICENSE.storybook.
// TypeScript 5.9.3 transpilation, ES2022 / ESNext; no behavioral edits.
export function createTestProviderStore({ universalTestProviderStore, useUniversalStore, }) {
    const baseStore = {
        settingsChanged: () => {
            universalTestProviderStore.untilReady().then(() => {
                universalTestProviderStore.send({ type: 'settings-changed' });
            });
        },
        onRunAll: (listener) => universalTestProviderStore.subscribe('run-all', listener),
        onClearAll: (listener) => universalTestProviderStore.subscribe('clear-all', listener),
    };
    const fullTestProviderStore = {
        ...baseStore,
        getFullState: universalTestProviderStore.getState,
        setFullState: universalTestProviderStore.setState,
        onSettingsChanged: (listener) => universalTestProviderStore.subscribe('settings-changed', listener),
        runAll: async () => {
            await universalTestProviderStore.untilReady();
            universalTestProviderStore.send({ type: 'run-all' });
        },
        clearAll: async () => {
            await universalTestProviderStore.untilReady();
            universalTestProviderStore.send({ type: 'clear-all' });
        },
    };
    const getTestProviderStoreById = (testProviderId) => {
        const getStateForTestProvider = () => universalTestProviderStore.getState()[testProviderId] ?? 'test-provider-state:pending';
        const setStateForTestProvider = (state) => {
            universalTestProviderStore.untilReady().then(() => {
                universalTestProviderStore.setState((currentState) => ({
                    ...currentState,
                    [testProviderId]: state,
                }));
            });
        };
        return {
            ...baseStore,
            testProviderId,
            getState: getStateForTestProvider,
            setState: setStateForTestProvider,
            runWithState: async (callback) => {
                setStateForTestProvider('test-provider-state:running');
                try {
                    await callback();
                    setStateForTestProvider('test-provider-state:succeeded');
                }
                catch (error) {
                    setStateForTestProvider('test-provider-state:crashed');
                }
            },
        };
    };
    if (useUniversalStore) {
        return {
            getTestProviderStoreById,
            fullTestProviderStore,
            universalTestProviderStore,
            useTestProviderStore: (selector) => useUniversalStore(universalTestProviderStore, selector)[0],
        };
    }
    return {
        getTestProviderStoreById,
        fullTestProviderStore,
        universalTestProviderStore,
    };
}
