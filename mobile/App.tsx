// App.tsx
import React from "react";
import HomeScreen from "./screens/HomeScreen";
import { SafeAreaView, StatusBar } from "react-native";

export default function App() {
    return (
        <>
            <StatusBar barStyle="dark-content" />
            <HomeScreen />
        </>
    );
}
