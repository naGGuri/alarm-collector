import React from 'react';
import { SafeAreaView } from 'react-native';
import TimelineScreen from './screens/TimelineScreen';

export default function App() {
    return (
        <SafeAreaView style={{ flex: 1 }}>
            <TimelineScreen />
        </SafeAreaView>
    );
}
