// src/screens/EditNoteScreen.js
import React, { useState, useEffect } from "react";
import { View, TextInput, TouchableOpacity, Text, Image, StyleSheet, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "../lib/supabase";
import { Video } from "expo-av";

export default function EditNoteScreen({ route, navigation }) {
  const { note } = route.params;

  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [mediaUrl, setMediaUrl] = useState(note.media_url || null);
  const [uploading, setUploading] = useState(false);

  // -----------------------------
  // Pick new media (image/video)
  // -----------------------------
  const pickMedia = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        quality: 1,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) return;

      const file = result.assets[0];
      if (!file.uri) throw new Error("No file URI!");

      await uploadMedia(file.uri);
    } catch (error) {
      Alert.alert("Error picking media", error.message || error.toString());
    }
  };

  // -----------------------------
  // Upload media to Supabase
  // -----------------------------
  const uploadMedia = async (uri) => {
    try {
      setUploading(true);

      const response = await fetch(uri);
      const fileBuffer = await response.arrayBuffer();

      const fileExt = uri.split(".").pop();
      const fileName = `private/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("notes-media")
        .upload(fileName, fileBuffer, {
          contentType: uri.endsWith(".mp4") ? "video/mp4" : "image/jpeg",
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("notes-media")
        .getPublicUrl(fileName);

      setMediaUrl(data.publicUrl);
    } catch (error) {
      console.error("Upload failed:", error);
      Alert.alert("Upload failed", error.message || error.toString());
    } finally {
      setUploading(false);
    }
  };

  // -----------------------------
  // Update note
  // -----------------------------
  const updateNote = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert("Error", "User not logged in");
        return;
      }

      const { error } = await supabase
        .from("notes")
        .update({
          title,
          content,
          media_url: mediaUrl,
        })
        .eq("id", note.id);

      if (error) throw error;

      navigation.replace("NotesList"); // go back to NotesList
    } catch (error) {
      console.error("Update failed:", error);
      Alert.alert("Update failed", error.message || error.toString());
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Title"
        style={styles.input}
        value={title}
        onChangeText={setTitle}
      />
      <TextInput
        placeholder="Content"
        style={[styles.input, { height: 100 }]}
        multiline
        value={content}
        onChangeText={setContent}
      />

      {mediaUrl && mediaUrl.endsWith(".mp4") ? (
        <Video
          source={{ uri: mediaUrl }}
          style={styles.mediaPreview}
          useNativeControls
          resizeMode="contain"
        />
      ) : mediaUrl ? (
        <Image source={{ uri: mediaUrl }} style={styles.mediaPreview} />
      ) : null}

      <TouchableOpacity
        style={styles.button}
        onPress={pickMedia}
        disabled={uploading}
      >
        <Text style={styles.buttonText}>
          {uploading ? "Uploading..." : "Change Image/Video"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={updateNote}>
        <Text style={styles.buttonText}>Update Note</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
  },
  button: {
    backgroundColor: "#007bff",
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "bold" },
  mediaPreview: { width: "100%", height: 200, marginBottom: 15 },
});
