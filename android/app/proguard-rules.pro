# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# react-native-reanimated
-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }

# expo-task-manager / expo-notifications ship their own proguard-rules.pro but don't
# wire it up via consumerProguardFiles, so it isn't picked up automatically - inlined here.
-keep class expo.modules.taskManager.** { *; }
-keep class expo.modules.notifications.** { *; }

# react-native-maps (Google Maps SDK) - standard rules from Google/react-native-maps docs.
-keep class com.google.android.gms.maps.** { *; }
-keep interface com.google.android.gms.maps.** { *; }
-keep class com.google.android.gms.internal.maps_dyn.** { *; }
-keep class com.google.android.gms.dynamic.** { *; }

# Add any project specific keep options here:
