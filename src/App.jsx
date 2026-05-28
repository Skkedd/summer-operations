import SummerOperationsHomePage from './pages/SummerOperationsHomePage.jsx'
import { useEffect } from "react";
import { supabase } from "./lib/supabaseClient";

export default function App() {
  useEffect(() => {
    const checkSession = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error("Summer Operations auth error:", error);
      }

      if (!data.session) {
        window.location.href = "https://app.deepsitecontrol.com";
        return;
      }
    };

    checkSession();
  }, []);
  return <SummerOperationsHomePage />
}