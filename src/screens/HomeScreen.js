import { View, Text, Button, StyleSheet } from "react-native";
import { signOut } from "../lib/supabase";

export default function HomeScreen({ navigation }) {
  async function handleLogout() {
    await signOut();
    navigation.replace("Login");
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to your Notes App!</Text>
      <Button title="Logout" onPress={handleLogout} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, marginTop: 100 },
  title: { fontSize: 28, marginBottom: 20, fontWeight: "bold" },
});
