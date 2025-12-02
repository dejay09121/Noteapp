import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  TextInput,
  Modal,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../lib/supabase";
import { useFocusEffect } from "@react-navigation/native";
import { Video } from "expo-av";

export default function NotesListScreen({ navigation }) {
  const [notes, setNotes] = useState([]);
  const [filteredNotes, setFilteredNotes] = useState([]);
  const [deleteMode, setDeleteMode] = useState(false);
  const [selected, setSelected] = useState({});
  const [searchModal, setSearchModal] = useState(false);
  const [searchText, setSearchText] = useState("");

  // -----------------------------
  // SIGN OUT
  // -----------------------------
  async function signOut() {
    await supabase.auth.signOut();
    navigation.replace("Login");
  }

  // -----------------------------
  // FETCH NOTES + REALTIME LISTENER
  // -----------------------------
  useEffect(() => {
    fetchNotes();

    const channel = supabase
      .channel("notes-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notes" },
        () => fetchNotes()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchNotes();
    }, [])
  );

  // -----------------------------
  // LOAD NOTES FROM SUPABASE
  // -----------------------------
  async function fetchNotes() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error) {
      setNotes(data);
      setFilteredNotes(data);
    }
  }

  // -----------------------------
  // SEARCH FUNCTION
  // -----------------------------
  function performSearch() {
    const keyword = searchText.toLowerCase().trim();

    if (!keyword) {
      setFilteredNotes(notes);
      return;
    }

    const results = notes.filter(
      (note) =>
        note.title.toLowerCase().includes(keyword) ||
        note.content.toLowerCase().includes(keyword)
    );

    setFilteredNotes(results);
    setSearchModal(false);
  }

  function closeSearchModal() {
    setSearchModal(false);
  }

  function cancelFilter() {
    setSearchText("");
    setFilteredNotes(notes);
  }

  function highlight(text) {
    if (!searchText) return <Text>{text}</Text>;

    const keyword = searchText.toLowerCase();
    const parts = text.split(new RegExp(`(${searchText})`, "gi"));

    return parts.map((part, idx) =>
      part.toLowerCase() === keyword ? (
        <Text key={idx} style={styles.highlight}>
          {part}
        </Text>
      ) : (
        <Text key={idx}>{part}</Text>
      )
    );
  }

  // -----------------------------
  // DELETE MODE
  // -----------------------------
  function toggleSelect(id) {
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  async function deleteSelected() {
    const ids = Object.keys(selected).filter((id) => selected[id]);
    if (ids.length === 0) return;
    await supabase.from("notes").delete().in("id", ids);
    setSelected({});
    setDeleteMode(false);
    fetchNotes();
  }

  return (
    <View style={styles.container}>
      {/* SIGN OUT BUTTON */}
      <View style={styles.header}>
        <TouchableOpacity onPress={signOut}>
          <Ionicons name="log-out-outline" size={25} color="#333" />
        </TouchableOpacity>
      </View>

      {/* CANCEL FILTER BUTTON */}
      {searchText !== "" && (
        <TouchableOpacity style={styles.cancelFilterBtn} onPress={cancelFilter}>
          <Text style={styles.cancelFilterText}>Back</Text>
        </TouchableOpacity>
      )}

      {/* SEARCH MODAL */}
      <Modal visible={searchModal} transparent animationType="fade">
        <View style={styles.modalBackground}>
          <View style={styles.modalBox}>
            <Text style={styles.searchTitle}>Search Notes</Text>

            <TextInput
              style={styles.searchInput}
              placeholder="Enter keyword..."
              value={searchText}
              onChangeText={setSearchText}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalBtn} onPress={performSearch}>
                <Text style={styles.modalBtnText}>Search</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: "#aaa" }]}
                onPress={closeSearchModal}
              >
                <Text style={styles.modalBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* DELETE HEADER */}
      {deleteMode && (
        <View style={styles.deleteHeader}>
          <TouchableOpacity onPress={() => setDeleteMode(false)}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={deleteSelected}>
            <Text style={styles.deleteText}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* NOTES LIST */}
      {filteredNotes.length === 0 && searchText !== "" ? (
        <View style={styles.notFoundContainer}>
          <Text style={styles.notFoundText}>Keyword Not Found</Text>
        </View>
      ) : (
        <FlatList
          data={filteredNotes}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingBottom: 150 }}
          renderItem={({ item }) => {
            const isSelected = selected[item.id];
            return (
              <TouchableOpacity
                style={[
                  styles.noteBox,
                  isSelected && deleteMode ? styles.selectedBox : null,
                ]}
                onPress={() =>
                  deleteMode
                    ? toggleSelect(item.id)
                    : navigation.navigate("EditNote", { note: item })
                }
              >
                <Text style={styles.title}>{highlight(item.title)}</Text>
                <Text style={styles.content}>{highlight(item.content)}</Text>

                {item.media_url && item.media_url.includes(".mp4") ? (
                  <Text style={styles.videoText}>Video attached</Text>
                ) : item.media_url ? (
                  <Image
                    source={{ uri: item.media_url }}
                    style={{ width: "100%", height: 150, marginTop: 10 }}
                  />
                ) : null}
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* CREATE BUTTON (+) */}
      <TouchableOpacity
        style={styles.createBtn}
        onPress={() => navigation.navigate("CreateNote")}
      >
        <Ionicons name="add" size={35} color="#fff" />
      </TouchableOpacity>

      {/* SEARCH BUTTON */}
      <TouchableOpacity
        style={styles.searchBtn}
        onPress={() => setSearchModal(true)}
      >
        <Ionicons name="search" size={30} color="#fff" />
      </TouchableOpacity>

      {/* TRASH BUTTON */}
      <TouchableOpacity
        style={styles.trashBtn}
        onPress={() => setDeleteMode(!deleteMode)}
      >
        <Ionicons name="trash" size={30} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 35 },

  header: { position: "absolute", top: 5, right: 20, zIndex: 20 },

  cancelFilterBtn: {
    position: "absolute",
    top: 30,
    left: 20,
    zIndex: 20,
    padding: 8,
    backgroundColor: "#ff4444",
    borderRadius: 6,
  },

  cancelFilterText: { color: "#fff", fontSize: 16 },

  noteBox: {
    backgroundColor: "#f1f1f1",
    borderRadius: 10,
    padding: 15,
    borderWidth: 1,
    borderColor: "#ccc",
    marginHorizontal: 20,
    marginBottom: 15,
  },

  selectedBox: { backgroundColor: "#ffe1e1", borderColor: "red", borderWidth: 2 },

  title: { fontSize: 18, fontWeight: "bold" },
  content: { marginTop: 5, color: "#555" },
  videoText: { marginTop: 10, fontStyle: "italic", color: "#555" },

  highlight: { backgroundColor: "yellow", color: "black" },

  createBtn: {
    position: "absolute",
    bottom: 60,
    right: 25,
    backgroundColor: "#007bff",
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },

  searchBtn: {
    position: "absolute",
    bottom: 60,
    left: "50%",
    marginLeft: -30,
    backgroundColor: "#00b894",
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },

  trashBtn: {
    position: "absolute",
    bottom: 60,
    left: 25,
    backgroundColor: "#ff4444",
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },

  deleteHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 25,
    marginBottom: 10,
  },

  cancelText: { color: "#555", fontSize: 18 },
  deleteText: { color: "red", fontSize: 18, },

  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },

  modalBox: { backgroundColor: "#fff", width: "80%", padding: 20, borderRadius: 10 },

  searchTitle: { fontSize: 20, marginBottom: 10, fontWeight: "bold" },

  searchInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
  },

  modalButtons: { flexDirection: "row", justifyContent: "space-between" },

  modalBtn: {
    backgroundColor: "#007bff",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },

  modalBtnText: { color: "#fff", fontSize: 16 },

  notFoundContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  notFoundText: {
    fontSize: 20,
    color: "#888",
    fontWeight: "bold",
  },
});
