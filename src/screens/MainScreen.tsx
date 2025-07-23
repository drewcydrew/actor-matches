import { StatusBar } from "expo-status-bar";
import { StyleSheet, View, TouchableOpacity, Text } from "react-native";
import React, { useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import FilmComparisonView from "./FilmComparison/FilmComparisonView";
import ActorComparisonView from "./ActorComparison/ActorComparisonView";
import AppBanner from "../modals/AppBanner";

// Define comparison modes
type ComparisonMode = "compareByFilm" | "compareByActor";

const MainScreen = () => {
  // Add state for comparison mode
  const [comparisonMode, setComparisonMode] =
    useState<ComparisonMode>("compareByFilm");

  // Get theme colors
  const { colors, theme } = useTheme();

  // Get safe area insets with fallback values
  const insets = useSafeAreaInsets();

  // Create styles inline
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      width: "100%",
    },
    safeArea: {
      paddingTop: insets.top,
      backgroundColor: colors.surface,
    },
    contentContainer: {
      flex: 1,
      paddingBottom: insets.bottom,
      paddingLeft: insets.left,
      paddingRight: insets.right,
    },
    modeSelector: {
      flexDirection: "row",
      justifyContent: "center",
      paddingVertical: 10,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modeTab: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      marginHorizontal: 5,
    },
    activeTab: {
      backgroundColor: colors.primary,
    },
    inactiveTab: {
      backgroundColor: colors.headerBackground,
    },
    tabText: {
      fontSize: 14,
      fontWeight: "500",
    },
    activeTabText: {
      color: "#fff",
    },
    inactiveTabText: {
      color: colors.text,
    },
  });

  return (
    <View style={styles.container}>
      {/* Render the status bar with correct style */}
      <StatusBar style={theme === "dark" ? "light" : "dark"} />

      {/* Privacy/Install Banner - positioned absolutely on top */}
      <View
        style={{
          position: "absolute",
          top: insets.top,
          left: 0,
          right: 0,
          zIndex: 1000,
        }}
      >
        <AppBanner
          appName="Double Bill"
          appIcon={require("../../assets/icon.png")}
          privacyPolicyUrl="https://doublebill-privacypolicy.onrender.com/"
          androidUrl="https://play.google.com/apps/testing/com.drew92.actormatches"
          androidTestersGroupUrl="https://groups.google.com/g/i-am-db-testers"
          iosUrl="https://apps.apple.com/us/app/double-bill/id6747002318"
          backgroundColor="#000000ff"
          borderColor="#ffffffff"
          accentColor="#4e6ae7ff"
          textColor="#ffffff"
        />
      </View>

      {/* Safe area padding for top notch */}
      <View style={styles.safeArea}>
        {/* Mode selector - now inside the safe area */}
        <View style={styles.modeSelector}>
          <TouchableOpacity
            style={[
              styles.modeTab,
              comparisonMode === "compareByFilm"
                ? styles.activeTab
                : styles.inactiveTab,
            ]}
            onPress={() => setComparisonMode("compareByFilm")}
          >
            <Text
              style={[
                styles.tabText,
                comparisonMode === "compareByFilm"
                  ? styles.activeTabText
                  : styles.inactiveTabText,
              ]}
            >
              Compare by Media
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.modeTab,
              comparisonMode === "compareByActor"
                ? styles.activeTab
                : styles.inactiveTab,
            ]}
            onPress={() => setComparisonMode("compareByActor")}
          >
            <Text
              style={[
                styles.tabText,
                comparisonMode === "compareByActor"
                  ? styles.activeTabText
                  : styles.inactiveTabText,
              ]}
            >
              Compare by Person
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content container - removed ScrollView, using View instead */}
      <View style={styles.contentContainer}>
        {/* Render content based on selected mode */}
        {comparisonMode === "compareByFilm" ? (
          <FilmComparisonView />
        ) : (
          <ActorComparisonView />
        )}
      </View>
    </View>
  );
};

export default MainScreen;
