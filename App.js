import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import AuthStack from "./src/navigation/AuthStack";
import { supabase } from "./src/lib/supabase";

export default function App() {
  const [initialRoute, setInitialRoute] = useState("Login");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) setInitialRoute("NotesList"); // direct to NotesList
      setLoading(false);
    }

    checkSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session) setInitialRoute("NotesList");
        else setInitialRoute("Login");
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  if (loading) return null;

  return (
    <NavigationContainer>
      <AuthStack initialRoute={initialRoute} />
    </NavigationContainer>
  );
}
