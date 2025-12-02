import { createNativeStackNavigator } from "@react-navigation/native-stack";

import LoginScreen from "../../src/screens/LoginScreen";
import SignupScreen from "../../src/screens/SignUpScreen";
import HomeScreen from "../../src/screens/HomeScreen";
import NotesListScreen from "../screens/NotesListScreen";
import CreateNoteScreen from "../screens/CreateNoteScreen";
import EditNoteScreen from "../screens/EditNoteScreen";

const Stack = createNativeStackNavigator();

export default function AuthStack({ initialRoute = "Login" }) {
  return (
    <Stack.Navigator initialRouteName={initialRoute}>
      {/* Authentication */}
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Signup"
        component={SignupScreen}
        options={{ headerShown: false }}
      />

      {/* Home */}
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ headerShown: false }}
      />

      {/* Notes */}
      <Stack.Screen
        name="NotesList"
        component={NotesListScreen}
        options={{ title: "Your Notes" }}
      />
      <Stack.Screen
        name="CreateNote"
        component={CreateNoteScreen}
        options={{ title: "Create Note" }}
      />
      <Stack.Screen
        name="EditNote"
        component={EditNoteScreen}
        options={{ title: "Edit Note" }}
      />
    </Stack.Navigator>
  );
}
