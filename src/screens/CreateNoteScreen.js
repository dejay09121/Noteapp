// src/screens/CreateNoteScreen.js
import React, { useState } from "react";
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Image, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "../lib/supabase";

export default function CreateNoteScreen({ navigation }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mediaUrl, setMediaUrl] = useState(null);
  const [uploading, setUploading] = useState(false);

  // -----------------------------
  // Pick media (image/video)
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
  // Save note to Supabase
  // -----------------------------
  const saveNote = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert("Error", "User not logged in");
        return;
      }

      const { error } = await supabase.from("notes").insert([
        {
          title,
          content,
          media_url: mediaUrl,
          user_id: user.id,
        },
      ]);

      if (error) throw error;

      // -------------------------------------
      // OPTION 1 — Reset Stack (NO BACK BUTTON)
      // -------------------------------------
      navigation.reset({
        index: 0,
        routes: [{ name: "NotesList" }],
      });

    } catch (error) {
      console.error("Save note failed:", error);
      Alert.alert("Save failed", error.message || error.toString());
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
        <Text style={styles.mediaLabel}>Video selected</Text>
      ) : mediaUrl ? (
        <Image source={{ uri: mediaUrl }} style={styles.mediaPreview} />
      ) : null}

      <TouchableOpacity
        style={styles.button}
        onPress={pickMedia}
        disabled={uploading}
      >
        <Text style={styles.buttonText}>
          {uploading ? "Uploading..." : "Pick Image/Video"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={saveNote}>
        <Text style={styles.buttonText}>Save Note</Text>
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
  mediaLabel: { marginBottom: 15, fontSize: 16, fontWeight: "bold" },
});
